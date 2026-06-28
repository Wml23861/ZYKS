/**
 * 从 PDF 文本生成中医基础理论 seed 代码
 * 用法: node build-zhongji-seed.cjs > seeds/zhongji_sections_generated.ts
 */
const fs = require('fs');
const path = require('path');

const pdfPath = path.resolve(__dirname, '..', 'pdf', 'zyjcll-utf8.txt');
const text = fs.readFileSync(pdfPath, 'utf-8').replace(/\f/g, '');
const lines = text.split('\n');

// 寻找内容起始（绪论正文）
let tocEnd = 0;
for (let i = 0; i < lines.length; i++) {
  const ln = lines[i].trim();
  if (ln.includes('绪') && ln.includes('论') && i > 300) { tocEnd = i; break; }
}

// 找到所有章节边界
const markers = ['第一章','第二章','第三章','第四章','第五章','第六章','第七章','第八章'];
const boundaries = [{name:'绪论', line:tocEnd}];
for (const m of markers) {
  for (let i = tocEnd; i < lines.length; i++) {
    if (lines[i].trim().startsWith(m)) { boundaries.push({name:m, line:i}); break; }
  }
}
boundaries.push({name:'END', line:lines.length});

// 章节信息（与数据库 chapter ID 对应）
const chInfoMap = {
  '绪论':   {id:'ch-zhongji-01', title:'绪论', desc:'中医学理论体系的形成与发展、基本特点及主要思维方式', sort:1},
  '第一章': {id:'ch-zhongji-02', title:'中医学的哲学基础', desc:'气一元论、阴阳学说、五行学说——构建中医学理论体系的基石', sort:2},
  '第二章': {id:'ch-zhongji-03', title:'藏象', desc:'五脏、六腑、奇恒之腑的生理功能及相互关系', sort:3},
  '第三章': {id:'ch-zhongji-04', title:'精气血津液神', desc:'精、气、血、津液、神的概念、生成、功能及相互关系', sort:4},
  '第四章': {id:'ch-zhongji-05', title:'经络', desc:'十二经脉、奇经八脉的循行规律及生理功能', sort:5},
  '第五章': {id:'ch-zhongji-06', title:'体质', desc:'体质的概念、形成因素、分类及临床应用', sort:6},
  '第六章': {id:'ch-zhongji-07', title:'病因', desc:'外感病因、内伤病因、病理产物性病因及其他病因', sort:7},
  '第七章': {id:'ch-zhongji-08', title:'病机', desc:'发病机理、基本病机、内生五邪及疾病传变', sort:8},
  '第八章': {id:'ch-zhongji-09', title:'养生与防治原则', desc:'养生、治未病及治则治法', sort:9},
};

let sectionCounter = 1;

// 生成章节 seed 条目
console.log('// === 自动生成的章节定义 ===');
for (let i = 0; i < boundaries.length - 1; i++) {
  const info = chInfoMap[boundaries[i].name];
  if (!info) continue;
  console.log(`{ id: '${info.id}', subject_id: 'zhongji', title: '${info.title}', description: '${info.desc}', sort_order: ${info.sort}, section_count: 0, knowledge_point_count: 0 },`);
}

console.log('\n// === 自动生成的 Section 内容 ===');
let chSectionCounts = {};

// 处理每章
for (let i = 0; i < boundaries.length - 1; i++) {
  const chName = boundaries[i].name;
  const chInfo = chInfoMap[chName];
  if (!chInfo) continue;

  const startLine = boundaries[i].line;
  const endLine = boundaries[i+1].line;
  const chLines = lines.slice(startLine, endLine).map(l => l.trim()).filter(l => {
    return l && !/^\d+$/.test(l) && l !== '\f';
  });
  const chText = chLines.join('\n');

  console.error(`Processing: ${chName} (${chInfo.title}) - ${chText.length} chars`);

  // 按"一、二、三、..."拆分顶层 section
  const parts = [];
  let current = { title: '', content: [] };
  let found = false;

  for (const line of chLines) {
    const m = line.match(/^([一二三四五六七八九十])、(.+)$/);
    if (m && line.length < 60) {
      // 可能是顶层标题
      if (!found) {
        // 之前收集的是概述
        if (current.content.length > 0) parts.push({title: '概述', content: current.content});
        current = { title: m[2].trim(), content: [line] };
        found = true;
      } else {
        parts.push({title: current.title, content: current.content});
        current = { title: m[2].trim(), content: [line] };
      }
    } else {
      current.content.push(line);
    }
  }
  if (current.content.length > 0) {
    parts.push({title: current.title || '概述', content: current.content});
  }

  console.error(`  Sections: ${parts.length}`);
  chSectionCounts[chInfo.id] = parts.length;

  // 输出 s() 条目
  let sort = 0;
  for (const part of parts) {
    sort++;
    const sid = `sec-zhongji-${String(sectionCounter).padStart(3, '0')}`;
    sectionCounter++;
    let content = part.content.join('\n');

    // 转义反引号
    content = content.replace(/`/g, '\\`').replace(/\\/g, '\\\\').replace(/\$/g, '\\$');
    // 还原被双重转义的反引号
    content = content.replace(/\\\\`/g, '\\`');

    const safeTitle = part.title.replace(/'/g, "\\'").replace(/"/g, '\\"');
    // 估算学习时间（~3 chars/sec reading speed）
    const studyTime = Math.ceil(Math.min(content.length / 3, 1800));

    console.log(`s('${sid}','${chInfo.id}','zhongji','${safeTitle}',${sort},\`${content}\`,${studyTime}),`);
  }
}

// 输出章节更新计数的注释
console.error('\n=== Section Counts ===');
for (const [chId, cnt] of Object.entries(chSectionCounts)) {
  console.error(`${chId}: ${cnt} sections`);
}
console.error(`Total: ${sectionCounter - 1} sections`);
