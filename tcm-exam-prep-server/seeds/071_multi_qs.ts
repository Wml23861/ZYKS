/** 071 - 中药学/中诊/针灸 题库 */
import {Knex} from 'knex'
const O=(a:string[])=>JSON.stringify(a.map((t,i)=>({key:String.fromCharCode(65+i),text:t})))
export async function seed(knex:Knex):Promise<void>{
  const zyQs:any[]=[],zdQs:any[]=[],zjQs:any[]=[]
  const add=(arr:any[],id:string,tp:string,subj:string,df:number,s:string,opts:string[],ans:string,e:string)=>{
    arr.push({id,question_type:tp,subject_id:subj,difficulty:df,question_stem:s,options_json:O(opts),correct_answer:ans,explanation:e,tags_json:'[]'})}
  // 中药学 30 Qs
  add(zyQs,'q-zy-001','A1','zhongyao',1,'麻黄与桂枝共同功效？',['发汗解表','温经通脉','利水消肿','宣肺平喘'],'A','均发汗解表。麻黄可宣肺平喘利水;桂枝可温经通脉助阳。')
  add(zyQs,'q-zy-002','A1','zhongyao',1,'呕家圣药指？',['半夏','生姜','竹茹','陈皮'],'B','生姜温中止呕效佳为呕家圣药。')
  add(zyQs,'q-zy-003','A1','zhongyao',1,'石膏生用与煅用区别？',['相同','生清热煅收敛','生收敛煅清热'],'B','生用清热泻火;煅用收敛生肌。')
  add(zyQs,'q-zy-004','A1','zhongyao',2,'善清肝胆实火的药？',['黄连','黄芩','黄柏','龙胆草'],'D','龙胆草专入肝胆善清肝胆实火和下焦湿热。')
  add(zyQs,'q-zy-005','A1','zhongyao',2,'疮家圣药？',['金银花','连翘','蒲公英','紫花地丁'],'B','连翘清热解毒消肿散结为疮家圣药。')
  add(zyQs,'q-zy-006','A1','zhongyao',2,'乳痈要药？',['连翘','金银花','蒲公英','鱼腥草'],'C','蒲公英善治乳痈;鱼腥草→肺痈;紫花地丁→疔疮。')
  add(zyQs,'q-zy-007','A1','zhongyao',2,'大黄后下目的？',['减毒','增强泻下力','增强清热','增强活血'],'B','生用后下泻下力强;酒制活血;久煎泻下力减。')
  add(zyQs,'q-zy-008','A1','zhongyao',2,'独活与羌活鉴别？',['相同','独活下半身羌活上半身','独活解表羌活祛风湿'],'B','独活善治下半身痹痛;羌活善治上半身+后头痛。')
  add(zyQs,'q-zy-009','A1','zhongyao',2,'附子反何药？',['甘草','人参','半夏','细辛'],'C','乌头(附子)反半蒌贝蔹及。')
  add(zyQs,'q-zy-010','A1','zhongyao',1,'国老指？',['人参','黄芪','甘草','白术'],'C','甘草调和诸药称国老。反海藻大戟甘遂芫花。')
  add(zyQs,'q-zy-011','A1','zhongyao',2,'补血圣药？',['熟地','当归','白芍','阿胶'],'B','当归补血活血调经止痛为补血圣药。')
  add(zyQs,'q-zy-012','A1','zhongyao',2,'血中气药指？',['当归','川芎','丹参','红花'],'B','川芎活血行气祛风止痛头痛不离川芎。')
  add(zyQs,'q-zy-013','A1','zhongyao',2,'气虚水肿首选？',['人参','黄芪','白术','茯苓'],'B','黄芪补气升阳固表利水消肿。')
  add(zyQs,'q-zy-014','A1','zhongyao',2,'黄芩安胎机理？',['补脾','补肾','清热安胎','理气'],'C','黄芩清热安胎→血热胎动。白术→脾虚。')
  add(zyQs,'q-zy-015','A1','zhongyao',2,'芳香药煎法？',['先煎','后下','包煎','烊化'],'B','薄荷藿香砂仁含挥发油须后下。')
  add(zyQs,'q-zy-101','A2','zhongyao',2,'风寒表实证无汗而喘首选？',['桂枝','麻黄','香薷','荆芥'],'B','无汗而喘+脉浮紧=风寒表实证→麻黄。')
  add(zyQs,'q-zy-102','A2','zhongyao',2,'少阳证寒热往来首选？',['葛根','柴胡','升麻','薄荷'],'B','柴胡为少阳证要药。')
  add(zyQs,'q-zy-103','A2','zhongyao',2,'湿热泻痢首选？',['黄芩','黄连','黄柏','白头翁'],'B','黄连清热燥湿力最强善治湿热泻痢。')
  add(zyQs,'q-zy-104','A2','zhongyao',2,'肾虚腰痛首选？',['独活','威灵仙','杜仲','防己'],'C','杜仲补肝肾强筋骨肾虚腰痛要药。')

  // 中医诊断学 20 Qs
  add(zdQs,'q-zd-001','A1','zhenjuan',1,'正常脉有神的表现？',['从容和缓','和缓有力','尺脉沉取不绝'],'B','有胃=从容和缓;有神=和缓有力;有根=尺脉沉取不绝。')
  add(zdQs,'q-zd-002','A1','zhenjuan',1,'浮脉主病？',['里证','表证','热证','虚证'],'B','浮脉轻取即得→表证。久病浮而无力→虚阳浮越。')
  add(zdQs,'q-zd-003','A1','zhenjuan',1,'滑脉脉象？',['端直以长','往来流利如珠走盘','绷急弹指','轻刀刮竹'],'B','滑脉往来流利如珠走盘→痰湿食积实热孕妇。')
  add(zdQs,'q-zd-004','A1','zhenjuan',2,'弦脉主病？',['表证','肝胆病','气虚','阴虚'],'B','弦脉如按琴弦→肝胆病诸痛痰饮。')
  add(zdQs,'q-zd-005','A1','zhenjuan',2,'促脉结脉鉴别？',['有无停跳','脉率快慢','浮沉','力度'],'B','促脉数而时止(阳热);结脉缓而时止(阴寒)。')
  add(zdQs,'q-zd-006','A1','zhenjuan',2,'代脉主病？',['实热','痰湿','脏气衰微','表证'],'C','代脉迟而中止止有定数→脏气衰微。')
  add(zdQs,'q-zd-007','A1','zhenjuan',2,'濡脉脉象？',['沉细无力','浮细而软','极细极软','端直以长'],'B','濡脉=浮+细+软→虚证湿证。弱脉=沉+细+无力。')
  add(zdQs,'q-zd-008','A1','zhenjuan',1,'淡白舌主病？',['热证','气血两虚或阳虚','血瘀','阴虚'],'B','淡白舌→气血两虚/阳虚。红舌→热证。')
  add(zdQs,'q-zd-009','A1','zhenjuan',2,'黄腻苔主病？',['寒湿','湿热','食积','阴虚'],'B','黄苔+腻苔=湿热内蕴。')
  add(zdQs,'q-zd-010','A1','zhenjuan',2,'齿痕舌主病？',['热盛','阴虚','脾虚湿盛','血瘀'],'C','舌胖大边有齿痕=脾虚湿盛。')
  add(zdQs,'q-zd-101','A2','zhenjuan',2,'脉数而时一止止无定数属？',['结脉','代脉','促脉','涩脉'],'C','数而时止=促脉(阳盛)。缓而时止=结脉。')
  add(zdQs,'q-zd-102','A2','zhenjuan',2,'脉如按琴弦属？',['紧脉','弦脉','滑脉','长脉'],'B','弦=如按琴弦→肝胆病。紧=如转绳索→寒痛。')

  // 针灸学 20 Qs
  add(zjQs,'q-zj-001','A1','zhenjiu',1,'井穴主治？',['热证','心下满','关节痛','六腑病'],'B','《难经》:井主心下满。荥主身热;合主逆气而泄。')
  add(zjQs,'q-zj-002','A1','zhenjiu',1,'足三里定位？',['膝眼下3寸','犊鼻下3寸胫骨前嵴外一横指','外膝眼下4寸'],'B','犊鼻下3寸胫骨前嵴外一横指。合穴+胃下合穴。')
  add(zjQs,'q-zj-003','A1','zhenjiu',1,'合谷所属经？',['肺经','大肠经','胃经','脾经'],'B','合谷手阳明大肠经原穴。面口合谷收。')
  add(zjQs,'q-zj-004','A1','zhenjiu',2,'八会穴筋会是？',['阳陵泉','足三里','太渊','大杼'],'A','筋会阳陵泉;脉会太渊;骨会大杼;髓会悬钟。')
  add(zjQs,'q-zj-005','A1','zhenjiu',2,'公孙配何穴治胃心胸？',['外关','内关','列缺','照海'],'B','公孙(冲脉)+内关(阴维)→胃心胸。')
  add(zjQs,'q-zj-006','A1','zhenjiu',2,'祛痰要穴？',['足三里','丰隆','太渊','中脘'],'B','丰隆胃经络穴外踝尖上8寸祛痰要穴。')
  add(zjQs,'q-zj-007','A1','zhenjiu',2,'孕妇禁针？',['足三里','合谷','三阴交','太冲'],'C','三阴交脾肝肾三经交会孕妇禁针。')
  add(zjQs,'q-zj-008','A1','zhenjiu',2,'肚腹三里留指？',['手三里','足三里','上巨虚','下巨虚'],'B','四总穴歌:肚腹三里留腰背委中求。')
  add(zjQs,'q-zj-009','A1','zhenjiu',2,'退热要穴？',['百会','大椎','曲池','风池'],'B','大椎督脉第7颈椎棘突下诸阳之会退热要穴。')
  add(zjQs,'q-zj-010','A1','zhenjiu',2,'胃募穴+腑会是？',['天枢','中脘','章门','关元'],'B','中脘脐上4寸胃之募穴+八会穴之腑会。')
  add(zjQs,'q-zj-101','A2','zhenjiu',2,'胃痛呕吐首选？',['合谷','中脘','太冲','内关'],'B','中脘胃募穴+腑会胃痛首选。')
  add(zjQs,'q-zj-102','A2','zhenjiu',2,'头项强痛首选？',['合谷','列缺','足三里','太冲'],'B','头项寻列缺——列缺通任脉治头项。')

  // Insert
  const subjects=[['zhongyao','中药学',zyQs],['zhenjuan','中医诊断学',zdQs],['zhenjiu','针灸学',zjQs]] as [string,string,any[]][]
  for(const [sid,name,arr] of subjects){
    const ex=new Set(await knex('questions').where('subject_id',sid).select('id').then(r=>r.map(x=>x.id)))
    const ch=await knex('chapters').where('subject_id',sid).select('id').first()
    const sc=await knex('sections').where('subject_id',sid).select('id').first()
    let n=0
    for(const x of arr){
      if(ex.has(x.id))continue
      try{
        await knex('questions').insert({...x,chapter_id:ch?.id||'',section_id:sc?.id||'',exam_years_json:'[]',knowledge_point_ids_json:'[]',shared_options_json:null,group_id:null,is_group_root:0,order_in_group:0})
        n++
      }catch(e){}
    }
    const t=await knex('questions').where('subject_id',sid).count('* as cnt').first()
    console.log(name+': +'+n+' Qs 总计:'+t.cnt)
  }
}
