/**
 * 批量 AI 出题脚本（严谨版）
 * 用法: npx tsx generate-questions.ts <subject_id> <question_type> <count> [start_index]
 */
import Database from 'better-sqlite3'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const db = new Database(path.join(__dirname, 'data', 'tcm-exam.db'))

const API_KEY = process.env.AI_API_KEY || 'sk-dfdd2a1170bf4dbbbe05980df1a0c365'
const API_URL = process.env.AI_API_URL || 'https://api.deepseek.com/v1/chat/completions'
const MODEL = process.env.AI_MODEL || 'deepseek-chat'

const SUBJECT_NAMES: Record<string, string> = {
  fagui: '卫生法规', lunli: '医学伦理学', chuanran: '传染病学', zhenduan: '诊断学基础',
  neike: '内科学', zhongwai: '中医外科学', zhongfu: '中医妇科学', zhonger: '中医儿科学',
  zhenjiu: '针灸学', zhongji: '中医基础理论', zhenjuan: '中医诊断学',
  zhongyao: '中药学', fangji: '方剂学', zhongnei: '中医内科学',
}

function pickD(): number { const r=Math.random(); return r<0.25?1:r<0.50?2:r<0.75?3:r<0.90?4:5 }

async function callAI(msgs: {role:string;content:string}[], mt=8192): Promise<string> {
  const res=await fetch(API_URL,{
    method:'POST',headers:{'Content-Type':'application/json',Authorization:`Bearer ${API_KEY}`},
    body:JSON.stringify({model:MODEL,messages:msgs,temperature:0.2,max_tokens:mt}),
  })
  if(!res.ok) throw new Error(`API ${res.status}: ${await res.text().slice(0,200)}`)
  const d=await res.json() as {choices:{message:{content:string}}[]}
  return d.choices[0]?.message?.content||''
}

/** 从 AI 返回中提取尽可能多的合法 JSON 元素 */
function extractArrayItems(text: string): any[] {
  // 去掉 markdown 包裹
  let t = text.replace(/```json\s*/g,'').replace(/```\s*/g,'').trim()
  // 找 JSON 数组
  let m = t.match(/\[[\s\S]*\]/)
  if (!m) return []
  let json = m[0]
  // 修复常见问题
  json = json.replace(/,\s*]/g,']')  // trailing comma
  // 尝试解析
  try { const arr=JSON.parse(json); if(Array.isArray(arr)) return arr } catch {}
  // 逐个提取有效元素（容错模式）
  const items: any[] = []
  // 解析每个 {...} 对象
  const objRegex = /\{[^{}]*\{[^{}]*\}[^{}]*\}|\{[^{}]*\}/g
  let om: RegExpExecArray|null
  while ((om=objRegex.exec(json))!==null) {
    try {
      const obj=JSON.parse(om[0])
      if(obj.stem&&obj.options&&obj.answer) items.push(obj)
    } catch {
      // 尝试修复后重试
      try {
        let fix=om[0].replace(/,\s*}/g,'}')
        const obj=JSON.parse(fix)
        if(obj.stem&&obj.options&&obj.answer) items.push(obj)
      } catch {}
    }
  }
  return items
}

async function generateA1A2(
  subject:string, type:'A1'|'A2', chapters:{id:string;title:string}[],
  count:number, startIdx:number,
): Promise<any[]> {
  const sname=SUBJECT_NAMES[subject]||subject
  const isA2=type==='A2'
  // 获取该科目的知识点
  const kps=db.prepare('SELECT id,title,content FROM knowledge_points WHERE subject_id=? LIMIT 300').all(subject) as any[]
  const allKpText=kps.slice(0,200).map((k:any)=>`- ${k.title}: ${(k.content||'').slice(0,300)}`).join('\n')
  const chapterList=chapters.map(c=>`${c.id}: ${c.title}`).join(', ')
  const questions: any[]=[]
  let idx=startIdx
  const BATCH=8 // 小批次避免 JSON 截断

  // 轮询章节确保覆盖
  let chapterIdx=0

  while(questions.length<count){
    const remaining=count-questions.length
    const batchCount=Math.min(BATCH,remaining)
    // 取当前批次对应的章节（循环轮询）
    const focusChapters=chapters.slice(chapterIdx,chapterIdx+1)
    chapterIdx=(chapterIdx+1)%chapters.length
    const focusText=focusChapters.map(c=>`${c.id}: ${c.title}`).join('\n')

    const prompt=`你是中医执业助理医师考试命题专家，必须确保题目内容准确无误。

科目：${sname}
本轮聚焦章节：${focusText}
全部章节：${chapterList}

可参考的知识点（必须依据这些内容出题，不可杜撰）：
${allKpText.slice(0,6000)}

请为以上聚焦章节出${batchCount}道${type}型选择题。严格遵守以下规则：
1. 每道题的内容必须严格依据上述知识点，不能凭空编造
2. 5个选项（A～E），正确答案只有一个
3. 干扰项要有迷惑性但必须专业合理
4. 解析要详细说明正确选项的出处和依据，以及错误选项为什么错
5. 难度分1-5（基础概念→临床综合分析）
${isA2?'6. A2题型含简短病例描述（患者基本特征+主诉+关键体征）':''}
7. 选项不出现"以上都是"或"以上都不是"

返回 JSON 数组（不要 markdown 包裹）：
[{"stem":"题干","options":["A.选项","B.选项","C.选项","D.选项","E.选项"],"answer":"A","explanation":"引用知识点详细解析","difficulty":3,"chapter_id":"ch-xxx","tags":["标签1","标签2"]}]`

    console.log(`  [AI] ${type} ${questions.length+1}-${questions.length+batchCount} (ch: ${focusChapters[0]?.id||'auto'})`)
    const resp=await callAI([
      {role:'system',content:`你是中医执业助理医师考试命题专家，专精${sname}。出题必须基于客观知识点，不编造。只返回纯JSON数组。`},
      {role:'user',content:prompt},
    ], 4096)

    const items=extractArrayItems(resp)
    let added=0
    for(const q of items){
      if(!q.stem||!Array.isArray(q.options)||q.options.length<4||!q.answer||!q.explanation) continue
      // 确保 chapter_id 有效
      if(!chapters.find(c=>c.id===q.chapter_id)) q.chapter_id=focusChapters[0]?.id||chapters[0]?.id||''
      // 确保 tags 是数组
      if(!Array.isArray(q.tags)) q.tags=[q.tags].filter(Boolean)
      q.id=`q-${subject}-${type.toLowerCase()}-gen${String(idx).padStart(4,'0')}`
      q.subject_id=subject; q.question_type=type
      q.difficulty=(typeof q.difficulty==='number'&&q.difficulty>=1&&q.difficulty<=5)?q.difficulty:pickD()
      q.options_json=JSON.stringify(q.options.map((t:string,i:number)=>({key:String.fromCharCode(65+i),text:t})))
      q.section_id='';q.knowledge_point_ids_json='[]';q.exam_years_json='[]'
      q.is_group_root=0;q.group_id=null;q.shared_options_json=null;q.order_in_group=0
      q.explanation=q.explanation||'暂无解析'
      // 字段映射: API返回 stem→question_stem, answer→correct_answer
      q.question_stem=q.stem
      q.correct_answer=q.answer
      q.tags_json=JSON.stringify(q.tags)
      idx++;added++;questions.push(q)
    }
    if(added===0){
      console.warn(`  [WARN] 0 items from ${items.length} parsed, resp: ${resp.slice(0,150)}`)
      // 如果连续失败，尝试更小批次
      if(resp.length<100) console.warn(`  [WARN] API可能超限，等待后重试...`)
    }
    console.log(`  [OK] +${added} = ${questions.length}/${count}`)
    await new Promise(r=>setTimeout(r,800))
  }
  return questions
}

async function generateB1(
  subject:string, chapters:{id:string;title:string}[], groupCount:number, startIdx:number,
): Promise<any[]> {
  const sname=SUBJECT_NAMES[subject]||subject
  const kps=db.prepare('SELECT id,title,content FROM knowledge_points WHERE subject_id=? LIMIT 200').all(subject) as any[]
  const allKpText=kps.slice(0,150).map((k:any)=>`- ${k.title}: ${(k.content||'').slice(0,300)}`).join('\n')
  const chapterList=chapters.map(c=>`${c.id}: ${c.title}`).join(', ')
  const questions:any[]=[]
  let idx=startIdx
  const BATCH_GROUPS=2

  while(questions.filter(q=>q.is_group_root).length<groupCount){
    const remaining=groupCount-questions.filter(q=>q.is_group_root).length
    const batch=Math.min(BATCH_GROUPS,Math.max(1,remaining))

    const prompt=`你是中医执业助理医师考试命题专家，专精${sname}。

知识点参考：
${allKpText.slice(0,5000)}
章节：${chapterList}

出${batch}组B1型配伍题。每组格式：
- 5个共用选项(A-E)，必须专业严谨有区分度
- 配3-4道独立小题，每题选出1个最佳选项
- 小题题干不重复，覆盖不同章节
- 解析详细，说明为什么选这个选项

返回 JSON（不要 markdown）：
[{"shared_options":["A.选项","B.选项","C.选项","D.选项","E.选项"],"sub_questions":[{"stem":"小题1题干","answer":"A","explanation":"解析","difficulty":3,"tags":[]},{"stem":"小题2","answer":"B","explanation":"解析","difficulty":2,"tags":[]}]}]`

    console.log(`  [AI] B1 组...`)
    const resp=await callAI([
      {role:'system',content:`你是中医命题专家。只返回纯JSON数组。`},
      {role:'user',content:prompt},
    ], 4096)

    const groups=extractArrayItems(resp)
    // B1组的格式不同,尝试解析 shared_options 和 sub_questions
    const validGroups:any[]=[]
    for(const g of groups){
      if(g.shared_options&&Array.isArray(g.shared_options)&&g.sub_questions&&Array.isArray(g.sub_questions))
        validGroups.push(g)
    }
    // 如果 extractArrayItems 没提取到组结构,尝试直接解析
    if(validGroups.length===0){
      try{
        let t=resp.replace(/```json\s*/g,'').replace(/```\s*/g,'').trim()
        let m=t.match(/\[[\s\S]*\]/)
        if(m){
          let arr=JSON.parse(m[0].replace(/,\s*]/g,']'))
          for(const g of arr){
            if(g.shared_options&&g.sub_questions) validGroups.push(g)
          }
        }
      }catch{}
    }

    for(const g of validGroups){
      const gid=`q-${subject}-b1-gen${String(idx).padStart(4,'0')}`
      const sharedJson=JSON.stringify(g.shared_options.map((t:string,i:number)=>({key:String.fromCharCode(65+i),text:t.replace(/^[A-E][.、)\s]+/,'')})))
      // group root
      questions.push({
        id:`q-${subject}-b1-gen${String(idx).padStart(4,'0')}`,question_type:'B1',is_group_root:1,group_id:gid,
        subject_id:subject,chapter_id:chapters[0]?.id||'',section_id:'',
        knowledge_point_ids_json:'[]',difficulty:3,exam_years_json:'[]',
        question_stem:`（B1型配伍题，共用选项）`,
        options_json:'[]',shared_options_json:sharedJson,correct_answer:'',explanation:'',
        tags_json:'["B1","配伍题"]',order_in_group:0,
      })
      idx++
      for(const sq of g.sub_questions){
        if(!sq.stem||!sq.answer) continue
        questions.push({
          id:`q-${subject}-b1-gen${String(idx).padStart(4,'0')}`,question_type:'B1',is_group_root:0,group_id:gid,
          subject_id:subject,chapter_id:chapters[0]?.id||'',section_id:'',
          knowledge_point_ids_json:'[]',exam_years_json:'[]',
          difficulty:typeof sq.difficulty==='number'&&sq.difficulty>=1?sq.difficulty:pickD(),
          question_stem:sq.stem,options_json:'[]',shared_options_json:null,
          correct_answer:sq.answer.toUpperCase(),explanation:sq.explanation||'',
          tags_json:JSON.stringify(Array.isArray(sq.tags)?sq.tags:['B1']),order_in_group:0,
        })
        idx++
      }
    }
    console.log(`  [OK] B1 ${questions.filter(q=>q.is_group_root).length}/${groupCount} 组`)
    await new Promise(r=>setTimeout(r,800))
  }
  return questions
}

function insertQuestions(questions:any[]):number{
  const insert=db.prepare(`INSERT OR IGNORE INTO questions (id,question_type,is_group_root,group_id,subject_id,chapter_id,section_id,knowledge_point_ids_json,difficulty,exam_years_json,question_stem,options_json,shared_options_json,correct_answer,explanation,tags_json,order_in_group) VALUES (@id,@question_type,@is_group_root,@group_id,@subject_id,@chapter_id,@section_id,@knowledge_point_ids_json,@difficulty,@exam_years_json,@question_stem,@options_json,@shared_options_json,@correct_answer,@explanation,@tags_json,@order_in_group)`)
  let c=0
  const tx=db.transaction(()=>{for(const q of questions){try{insert.run(q);c++}catch(e:any){if(!e.message?.includes('UNIQUE'))console.warn(`[SKIP]${q.id}:`,e.message?.slice(0,60))}}})
  tx();return c
}

async function main(){
  const args=process.argv.slice(2)
  if(args.length<2){console.log('用法: npx tsx generate-questions.ts <科目> <题型|all> [数量] [起始序号]');process.exit(1)}
  const subject=args[0],qtype=args[1].toUpperCase(),total=parseInt(args[2]||'100'),start=parseInt(args[3]||'1')
  const sname=SUBJECT_NAMES[subject]
  if(!sname){console.error('未知科目:',subject);process.exit(1)}
  console.log(`\n=== ${sname} | ${qtype} | ${total}题 | 起始${start} ===\n`)
  const chapters=db.prepare('SELECT id,title FROM chapters WHERE subject_id=? ORDER BY id').all(subject) as any[]
  if(!chapters.length){console.warn('无章节');db.close();return}
  let all:any[]=[]
  if(qtype==='ALL'){
    const a1n=Math.floor(total*0.40),a2n=Math.floor(total*0.35),b1n=total-a1n-a2n
    console.log(`A1:${a1n} A2:${a2n} B1:${b1n}\n`)
    try{all.push(...await generateA1A2(subject,'A1',chapters,a1n,start))}catch(e){console.error('A1:',e)}
    await new Promise(r=>setTimeout(r,1500))
    try{all.push(...await generateA1A2(subject,'A2',chapters,a2n,start+a1n))}catch(e){console.error('A2:',e)}
    await new Promise(r=>setTimeout(r,1500))
    try{all.push(...await generateB1(subject,chapters,Math.ceil(b1n/4),start+a1n+a2n))}catch(e){console.error('B1:',e)}
  }else if(qtype==='B1'){
    all=await generateB1(subject,chapters,Math.ceil(total/4),start)
  }else{
    all=await generateA1A2(subject,qtype as 'A1'|'A2',chapters,total,start)
  }
  const inserted=insertQuestions(all)
  console.log(`\n生成${all.length}题,入库${inserted}题`)
  const stats=db.prepare('SELECT question_type,COUNT(*)c FROM questions WHERE subject_id=? GROUP BY question_type').all(subject) as any[]
  console.log(`${sname} 题库:`)
  for(const s of stats)console.log(`  ${s.question_type}: ${s.c}`)
  const totalQ=db.prepare('SELECT COUNT(*)c FROM questions WHERE subject_id=?').get(subject) as any
  console.log(`  总计: ${totalQ.c} 题`)
  db.close()
}
main().catch(e=>{console.error(e);process.exit(1)})
