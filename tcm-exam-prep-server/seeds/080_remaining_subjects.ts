/** 080 - 中基/妇科/儿科/西医 Qs */
import {Knex} from 'knex'
const O=(a:string[])=>JSON.stringify(a.map((t,i)=>({key:String.fromCharCode(65+i),text:t})))
const add=(arr:any[],subj:string,id:string,tp:string,df:number,s:string,opts:string[],ans:string,e:string)=>{
  arr.push({id,question_type:tp,subject_id:subj,difficulty:df,question_stem:s,options_json:O(opts),correct_answer:ans,explanation:e,tags_json:'[]'})}

export async function seed(knex:Knex):Promise<void>{
  const all:{subj:string,qs:any[]}[]=[]

  // 中医基础理论 25 Qs
  const jc:any[]=[];all.push({subj:'zhongji',qs:jc})
  add(jc,'zhongji','q-jc-001','A1',1,'"孤阴不生独阳不长"说明？',['对立制约','互根互用','消长平衡','转化'],'B','阴阳互根:相互依存互为根本。')
  add(jc,'zhongji','q-jc-002','A1',1,'五行中木的特性？',['曲直','炎上','稼穑','从革'],'A','木曰曲直。火曰炎上;土爰稼穑;金曰从革;水曰润下。')
  add(jc,'zhongji','q-jc-003','A1',2,'相乘与相侮的区别？',['相同','相乘按相克次序过度克制相侮反向克制','均正常'],'B','相乘=过度克制(木乘土);相侮=反向克制(木火刑金)。')
  add(jc,'zhongji','q-jc-004','A1',2,'滋水涵木法依据？',['相生','相克','相乘','相侮'],'A','水生木→虚则补其母。')
  add(jc,'zhongji','q-jc-005','A1',1,'心为五脏分阴阳中属？',['阳中之阳','阳中之阴','阴中之阳','阴中之至阴'],'A','心阳中之阳;肺阳中之阴;肝阴中之阳;肾阴中之阴;脾阴中之至阴。')
  add(jc,'zhongji','q-jc-006','A1',1,'肺的生理特性？',['华盖娇脏','刚脏','喜燥恶湿','主蛰'],'A','肺为华盖+娇脏。肝刚脏;脾喜燥恶湿;肾主蛰守位。')
  add(jc,'zhongji','q-jc-007','A1',1,'肝的生理功能？',['主血脉','主疏泄+主藏血','主运化','主纳气'],'B','肝主疏泄调畅气机+主藏血。')
  add(jc,'zhongji','q-jc-008','A1',1,'肾的生理功能不包括？',['藏精','主水','主纳气','主血脉'],'D','心主血脉。肾藏精主水主纳气。')
  add(jc,'zhongji','q-jc-009','A1',1,'六淫不包括？',['风','寒','燥','毒'],'D','六淫=风寒暑湿燥火。毒非六淫。')
  add(jc,'zhongji','q-jc-010','A1',2,'怒伤何脏？',['心','肝','脾','肺'],'B','怒伤肝喜伤心思伤脾忧伤肺恐伤肾。')
  add(jc,'zhongji','q-jc-011','A1',2,'"壮水之主以制阳光"治？',['实热','虚热','实寒','虚寒'],'B','壮水制阳=滋阴制阳→虚热证(阴虚阳亢)。')
  add(jc,'zhongji','q-jc-012','A1',2,'正治不包括？',['寒者热之','热者寒之','实则泻之','热因热用'],'D','热因热用=反治(从治)。正治=逆治。')
  add(jc,'zhongji','q-jc-013','A1',2,'反治不包括？',['热因热用','寒因寒用','塞因塞用','虚则补之'],'D','虚则补之=正治。反治(从治)含通因通用。')
  add(jc,'zhongji','q-jc-014','A1',2,'"大实有羸状"属？',['真实假虚','真虚假实','虚实夹杂','实证'],'A','真实假虚=大实有羸状。至虚有盛候=真虚假实。')
  add(jc,'zhongji','q-jc-015','A1',2,'治未病不包括？',['未病先防','既病防变','瘥后防复','对症治疗'],'D','治未病三层次:未病先防+既病防变+瘥后防复。')
  add(jc,'zhongji','q-jc-016','A1',2,'培土生金的含义？',['补脾益肺','补肝益心','补肾益肝','补肺益肾'],'A','培土生金=补脾(土)益肺(金)。按五行相生。')

  // 中医妇科 15 Qs
  const fk:any[]=[];all.push({subj:'zhongfu',qs:fk})
  add(fk,'zhongfu','q-fk-001','A1',1,'月经与哪三脏最密切？',['心肝脾','肝肾脾','肺脾肾','心肝肾'],'B','月经产生:肾(天癸)+肝(藏血疏泄)+脾(统血)最密切。')
  add(fk,'zhongfu','q-fk-002','A1',2,'月经先期常见病因？',['气虚血热','血虚','血瘀','气滞'],'A','月经先期=气虚不摄或血热迫血妄行。')
  add(fk,'zhongfu','q-fk-003','A1',2,'月经后期常见病因？',['血热','气虚','血虚血寒气滞','阴虚'],'C','月经后期=血虚血少/血寒凝滞/气滞血瘀。')
  add(fk,'zhongfu','q-fk-004','A1',2,'痛经基本病机？',['不通则痛或不荣则痛','肝火上炎','阴虚火旺','痰湿'],'A','痛经实证不通则痛(气滞血瘀寒凝);虚证不荣则痛。')
  add(fk,'zhongfu','q-fk-005','A1',2,'带下病核心病机？',['脾虚湿盛','肝火上炎','肾阳虚','血热'],'A','带下核心=湿邪。"诸带不离湿"')
  add(fk,'zhongfu','q-fk-006','A1',2,'产后三病指？',['痉郁冒大便难','腹痛恶露乳汁少','发热腹痛便秘'],'A','《金匮》:"新产妇人有三病:痉、郁冒、大便难。"')
  add(fk,'zhongfu','q-fk-007','A1',2,'妊娠恶阻病机？',['冲气上逆胃失和降','肝火上炎','脾虚','肾虚'],'A','妊娠恶阻=冲脉之气上逆+胃失和降。')
  add(fk,'zhongfu','q-fk-101','A2',2,'经期小腹冷痛得热痛减。证属？',['气滞血瘀','寒凝血瘀','气血虚弱','肾虚'],'B','冷痛+得热减=寒凝血瘀→温经散寒化瘀。')

  // 中医儿科 12 Qs
  const ek:any[]=[];all.push({subj:'zhonger',qs:ek})
  add(ek,'zhonger','q-ek-001','A1',1,'小儿生理特点？',['脏娇形弱生机蓬勃','脏坚形足','发育缓慢'],'A','小儿=脏腑娇嫩形气未充+生机蓬勃发育迅速。')
  add(ek,'zhonger','q-ek-002','A1',2,'小儿病理特点？',['发病易传变快脏清易康复','不易发病','病程缓','自愈差'],'A','小儿=发病容易传变迅速+脏气清灵易趋康复。')
  add(ek,'zhonger','q-ek-003','A1',2,'小儿感冒常见兼证？',['夹痰夹滞夹惊','夹湿夹热','夹寒夹虚'],'A','小儿感冒易夹痰(肺不足)+夹滞(脾不足)+夹惊(肝有余)。')
  add(ek,'zhonger','q-ek-004','A1',2,'小儿泄泻最常见病因？',['伤食','外感','脾胃虚弱','惊恐'],'A','伤食泄泻为小儿最常见。脾常不足+饮食不节。')
  add(ek,'zhonger','q-ek-005','A1',2,'小儿肺炎喘嗽病机？',['肺气郁闭','肝火','脾虚','肾虚'],'A','小儿肺炎喘嗽=肺气郁闭+痰热壅肺。')
  add(ek,'zhonger','q-ek-101','A2',2,'小儿咳嗽痰多色白纳呆苔白腻。选方？',['桑菊饮','杏苏散合二陈汤','清金化痰汤'],'B','痰多+纳呆=痰湿咳嗽→杏苏散合二陈汤。')

  // 西医内科学 8 Qs
  const xn:any[]=[];all.push({subj:'neike',qs:xn})
  add(xn,'neike','q-xn-001','A1',2,'慢支诊断标准？',['咳嗽咳痰>3月/年连续>2年','发热>1周','胸痛','咯血'],'A','慢支=咳嗽咳痰每年>3个月连续>2年。')
  add(xn,'neike','q-xn-002','A1',2,'高血压诊断标准？',['≥140/90mmHg','≥120/80mmHg','≥160/100mmHg'],'A','高血压=非同日3次收缩压≥140和/或舒张压≥90mmHg。')
  add(xn,'neike','q-xn-003','A1',2,'心绞痛典型特征？',['胸骨后压榨痛<15分钟','腹痛','头痛','持续>30分钟'],'A','心绞痛=胸骨后压榨性痛<15分休息/硝酸甘油缓解。')
  add(xn,'neike','q-xn-004','A1',2,'肺炎球菌肺炎典型痰？',['铁锈色痰','粉红色泡沫痰','黄绿痰','白沫痰'],'A','肺炎球菌=铁锈色痰。心衰=粉红色泡沫痰。')
  add(xn,'neike','q-xn-005','A1',2,'消化性溃疡最常见病因？',['HP感染','饮食','精神','遗传'],'A','消化性溃疡最主要病因=幽门螺杆菌感染。')

  // 诊断学基础 5 Qs
  const zd:any[]=[];all.push({subj:'zhenduan',qs:zd})
  add(zd,'zhenduan','q-xzd-001','A1',2,'39.1-41℃属？',['低热','中热','高热','超高热'],'C','低热<38;中热38.1-39;高热39.1-41;超高热>41。')
  add(zd,'zhenduan','q-xzd-002','A1',2,'正常白细胞计数？',['4-10×10⁹/L','1-5','10-20','0.5-2'],'A','正常白细胞4-10×10⁹/L。')

  // 传染病 3 Qs
  const cr:any[]=[];all.push({subj:'chuanran',qs:cr})
  add(cr,'chuanran','q-xcr-001','A1',2,'我国最常见病毒性肝炎？',['甲肝','乙肝','丙肝','戊肝'],'B','乙肝为我国最常见病毒性肝炎。')
  add(cr,'chuanran','q-xcr-002','A1',2,'艾滋病不通过什么传播？',['性','血液','母婴','空气飞沫'],'D','艾滋病通过性/血液/母婴传播。不通过空气。')

  // 伦理 3 Qs
  const ll:any[]=[];all.push({subj:'lunli',qs:ll})
  add(ll,'lunli','q-xll-001','A1',2,'医学伦理原则不包括？',['尊重','不伤害','有利','效率优先'],'D','四大原则:尊重/不伤害/有利/公正。无效率优先。')
  add(ll,'lunli','q-xll-002','A1',2,'知情同意核心？',['医生决定','患者自主选择','家属决定','医院规定'],'B','知情同意=患者自主决定权。')

  // 法规 3 Qs
  const fg:any[]=[];all.push({subj:'fagui',qs:fg})
  add(fg,'fagui','q-xfg-001','A1',2,'医师执业必须？',['取得资格即可','注册取得执业证书','无需注册'],'B','医师须注册取得《医师执业证书》方可执业。')
  add(fg,'fagui','q-xfg-002','A1',2,'医疗事故分几级？',['二级','三级','四级','五级'],'C','医疗事故分四级:一级(死亡)→四级(明显损害)。')

  // 批量插入
  for(const {subj,qs:arr} of all){
    const sn=await knex('subjects').where('id',subj).select('name').first()
    const ex=new Set(await knex('questions').where('subject_id',subj).select('id').then(r=>r.map(x=>x.id)))
    const ch=await knex('chapters').where('subject_id',subj).select('id').first()
    const sc=await knex('sections').where('subject_id',subj).select('id').first()
    let n=0
    for(const x of arr){
      if(ex.has(x.id))continue
      try{await knex('questions').insert({...x,chapter_id:ch?.id||'',section_id:sc?.id||'',exam_years_json:'[]',knowledge_point_ids_json:'[]',shared_options_json:null,group_id:null,is_group_root:0,order_in_group:0});n++}catch(e){}
    }
    const t=await knex('questions').where('subject_id',subj).count('* as cnt').first()
    console.log(sn?.name+': +'+n+'Qs 总计:'+t.cnt)
  }
}
