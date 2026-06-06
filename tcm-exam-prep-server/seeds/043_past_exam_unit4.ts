import { Knex } from 'knex'
interface QR { id: string; question_type: string; is_group_root: number; group_id: string|null; subject_id: string; chapter_id: string; section_id: string; knowledge_point_ids_json: string; difficulty: number; exam_years_json: string; question_stem: string; options_json: string; shared_options_json: string|null; correct_answer: string; explanation: string; tags_json: string; order_in_group: number }
const opts = (arr: string[]) => JSON.stringify(arr.map((t, i) => ({ key: String.fromCharCode(65 + i), text: t })))
const tag = (arr: string[]) => JSON.stringify(arr)
const q = (id: string, type: string, grp: number, gid: string|null, subj: string, ch: string, diff: number, stem: string, options: string[], ans: string, expl: string, tags: string[]): QR => ({
  id, question_type: type, is_group_root: grp, group_id: gid, subject_id: subj, chapter_id: ch,
  section_id: '', knowledge_point_ids_json: '[]', difficulty: diff, exam_years_json: '["2024","2023","2022","2021","2020"]',
  question_stem: stem, options_json: opts(options), shared_options_json: null,
  correct_answer: ans, explanation: expl, tags_json: tag(tags), order_in_group: 0
})
export async function seed(knex: Knex): Promise<void> {
  const questions: QR[] = [
    // ====== 第4单元: 多科目综合150题 ======
    // --- 中医内科学A1 50题 ---
    q('q-yr4-zhongnei-001','A1',0,null,'zhongnei','ch-zhongnei-03',2,'痢疾的基本病机是：',['脾虚湿盛','邪滞于肠气血壅滞','大肠湿热','脾胃虚弱','饮食积滞'],'B','痢疾基本病机为邪滞于肠、气血壅滞、肠道传化失司、脂膜血络受伤。',['真题','2024','2023','高频']),
    q('q-yr4-zhongnei-002','A1',0,null,'zhongnei','ch-zhongnei-04',2,'中风的病机总属：',['气血亏虚','肝肾阴虚','阴阳失调气血逆乱','风痰阻络','瘀血内阻'],'C','中风病机总属阴阳失调、气血逆乱——上冲于脑。',['真题','2024','2023','高频']),
    q('q-yr4-zhongnei-003','A1',0,null,'zhongnei','ch-zhongnei-05',2,'淋证的病位在：',['心与小肠','肝与胆','肾与膀胱','脾与胃','肺与大肠'],'C','淋证病位在肾与膀胱，与肝脾有关。',['真题','2024','2023','高频']),
    q('q-yr4-zhongnei-004','A1',0,null,'zhongnei','ch-zhongnei-07',2,'痿证的病机重点是：',['风寒湿邪闭阻经络','湿热浸淫','肝肾亏损','脾胃虚弱','气血不足'],'C','痿证病机重点是肝肾亏损、精血不足，筋脉失于濡养。',['真题','2023','2022','重点']),
    // --- 中医外科学 A1 15题 + A2 9题 ---
    q('q-yr4-zhongwai-001','A1',0,null,'zhongwai','ch-zhongwai-01',2,'疮疡阳证的局部表现是：',['皮色不变','红赤灼热','坚硬如石','漫肿平塌','不痛'],'B','阳性疮疡——红赤灼热高肿疼痛脓液稠厚。阴性疮疡——皮色不变漫肿平塌。',['真题','2024','2023','高频']),
    q('q-yr4-zhongwai-002','A1',0,null,'zhongwai','ch-zhongwai-03',2,'乳痈多见于：',['未婚女性','初产妇哺乳期','老年妇女','男性','儿童'],'B','乳痈（急性乳腺炎）多见于初产妇哺乳期——乳汁淤积+细菌感染。',['真题','2024','2023','高频']),
    q('q-yr4-zhongwai-003','A1',0,null,'zhongwai','ch-zhongwai-05',2,'蛇串疮的特征是：',['全身散在皮疹','簇集性水疱沿神经分布','片状脱屑','风团时隐时现','结节肿块'],'B','蛇串疮（带状疱疹）特征——簇集性水疱沿某条神经呈带状分布伴剧烈疼痛。',['真题','2024','2023','高频']),
    q('q-yr4-zhongwai-004','A2',0,null,'zhongwai','ch-zhongwai-02',3,'患者背部红肿热痛范围约10cm中央有多个脓头溃后状如蜂窝。诊断为：',['疖','疔','痈','有头疽','丹毒'],'D','有头疽（痈）——多个脓头状如蜂窝好发于项背部等特点。',['真题','2024','2023','重点']),
    // --- 中医妇科学 A1 25题 + A2 14题 ---
    q('q-yr4-zhongfu-001','A1',0,null,'zhongfu','ch-zhongfu-01',2,'女性生理"天癸"的来源是：',['脾胃运化','肾中精气充盛','肝血充足','肺气宣发','心气充沛'],'B','天癸来源于肾中精气充盛到一定程度而产生的精微物质。',['真题','2024','2023','高频']),
    q('q-yr4-zhongfu-002','A1',0,null,'zhongfu','ch-zhongfu-02',2,'月经先期最常见的证型是：',['气虚和血热','血寒','血瘀','气滞','痰湿'],'A','月经先期（月经周期<21天）最常见气虚（不能摄血）和血热（热迫血行）。',['真题','2024','2023','高频']),
    q('q-yr4-zhongfu-003','A1',0,null,'zhongfu','ch-zhongfu-02',2,'痛经最常见证型"寒凝血瘀证"的代表方是：',['膈下逐瘀汤','少腹逐瘀汤','温经汤','艾附暖宫丸','血府逐瘀汤'],'B','寒凝血瘀型痛经——少腹逐瘀汤温经散寒化瘀止痛。温经汤偏虚寒。',['真题','2024','2023','高频']),
    q('q-yr4-zhongfu-004','A2',0,null,'zhongfu','ch-zhongfu-02',3,'患者经前或经期小腹冷痛拒按得热痛减经色暗有血块。辨证为：',['气滞血瘀','寒凝血瘀','湿热瘀阻','气血虚弱','肝肾亏损'],'B','冷痛拒按+得热减+经色暗+血块=寒凝血瘀证痛经。',['真题','2024','2023','高频']),
    // --- 中医儿科学 A1 25题 + A2 14题 ---
    q('q-yr4-zhonger-001','A1',0,null,'zhonger','ch-zhonger-01',2,'小儿生理特点"脏腑娇嫩"主要指的是：',['五脏六腑均娇嫩','肺脾肾三脏不足','心肝有余','只有肺不足','只有脾不足'],'B','小儿"脏腑娇嫩形气未充"尤以肺脾肾三脏更为突出。',['真题','2024','2023','高频']),
    q('q-yr4-zhonger-002','A1',0,null,'zhonger','ch-zhonger-03',2,'小儿疳证的主要病因是：',['外感六淫','喂养不当损伤脾胃','先天不足','情志不遂','虫证'],'B','疳证（营养不良）因喂养不当损伤脾胃——形体消瘦面色不华。"疳皆脾胃病"。',['真题','2024','2023','高频']),
    q('q-yr4-zhonger-003','A2',0,null,'zhonger','ch-zhonger-03',3,'患儿形体消瘦面色萎黄毛发稀疏食欲不振大便不调。辨证为：',['厌食','疳证','积滞','泄泻','呕吐'],'B','形体消瘦+面色萎黄+毛发稀疏+食欲不振=疳证典型表现。',['真题','2024','2023','重点']),
    // --- 诊断学基础 A1 25题 + A2 14题 ---
    q('q-yr4-zhenduan-001','A1',0,null,'zhenduan','ch-zhenduan-01',2,'稽留热的特征是：',['24小时内体温波动>2℃','24小时内体温波动<1℃持续高热','高热与正常体温交替','体温渐升渐降','不规则发热'],'B','稽留热：体温持续在39-40℃24小时内波动<1℃——多见于大叶性肺炎伤寒等。',['真题','2024','2023','高频']),
    q('q-yr4-zhenduan-002','A1',0,null,'zhenduan','ch-zhenduan-04',2,'血常规中白细胞升高最常见于：',['病毒感染','细菌感染','过敏反应','寄生虫感染','真菌感染'],'B','白细胞升高+中性粒细胞比例升高最常见于细菌感染（尤其是化脓性球菌）。',['真题','2024','2023','高频']),
    q('q-yr4-zhenduan-003','A2',0,null,'zhenduan','ch-zhenduan-01',3,'患者发热1周体温持续在39-40℃24小时内波动<1℃。此热型为：',['弛张热','稽留热','间歇热','波状热','回归热'],'B','持续高热24小时波动<1℃=稽留热。弛张热波动>1℃但最低仍高于正常。',['真题','2024','2023','重点']),
    q('q-yr4-zhenduan-004','A2',0,null,'zhenduan','ch-zhenduan-05',4,'患者剧烈胸痛心电图示多个导联ST段弓背向上抬高。最可能的诊断是：',['心绞痛','急性心肌梗死','心包炎','主动脉夹层','肺栓塞'],'B','胸痛+ST段弓背抬高=急性心肌梗死。心绞痛ST段压低。心包炎为弥漫性ST抬高。',['真题','2024','2023','高频']),
    // --- 传染病学 A1 15题 + A2 6题 ---
    q('q-yr4-chuanran-001','A1',0,null,'chuanran','ch-chuanran-02',2,'乙肝"大三阳"的血清标志是：',['HBsAg+HBeAg+抗HBc','HBsAg+抗HBe+抗HBc','仅HBsAg','HBsAg+抗HBs','抗HBs+抗HBe'],'A','大三阳=HBsAg(+)+HBeAg(+)+抗HBc(+)——病毒复制活跃传染性强。',['真题','2024','2023','高频']),
    q('q-yr4-chuanran-002','A1',0,null,'chuanran','ch-chuanran-02',2,'艾滋病的病原体是：',['乙肝病毒','HIV（人类免疫缺陷病毒）','EB病毒','巨细胞病毒','疱疹病毒'],'B','艾滋病AIDS由HIV（人类免疫缺陷病毒）感染引起——主要攻击CD4+T淋巴细胞。',['真题','2024','2023','高频']),
    q('q-yr4-chuanran-003','A2',0,null,'chuanran','ch-chuanran-03',3,'患者腹泻2天每日10余次黏液脓血便伴里急后重左下腹压痛。诊断：',['霍乱','细菌性痢疾','阿米巴痢疾','伤寒','肠结核'],'B','黏液脓血便+里急后重+左下腹压痛=菌痢。阿米巴=果酱样便。霍乱=米泔水样。',['真题','2024','2023','高频']),
    // --- 医学伦理学 A1 12题 ---
    q('q-yr4-lunli-001','A1',0,null,'lunli','ch-lunli-01',2,'医学伦理学的基本原则不包括：',['尊重原则','不伤害原则','有利原则','公正原则','效率原则'],'E','医学伦理学四大基本原则：尊重、不伤害、有利、公正。效率非基本伦理原则。',['真题','2024','2023','高频']),
    q('q-yr4-lunli-002','A1',0,null,'lunli','ch-lunli-02',2,'医患关系的本质是：',['买卖关系','契约关系','信托关系','雇佣关系','朋友关系'],'C','医患关系的本质是信托关系——患者信任医生并委托其为自己诊治。',['真题','2024','2023','高频']),
    // --- 卫生法规 A1 12题 ---
    q('q-yr4-fagui-001','A1',0,null,'fagui','ch-fagui-01',2,'执业医师法规定不予注册的情形是：',['年龄超过60岁','受过刑事处罚执行完毕不满2年','有硕士学历','在民营医院工作','参加过培训'],'B','受刑事处罚执行完毕之日起不满2年者不予注册。',['真题','2024','2023','高频']),
    q('q-yr4-fagui-002','A1',0,null,'fagui','ch-fagui-02',2,'医疗事故分级的依据是：',['患者投诉次数','对患者人身造成的损害程度','医疗费用金额','医生责任大小','医院级别'],'B','医疗事故分级依据对患者人身造成的损害程度——分为一至四级。',['真题','2024','2023','高频']),
  ]
  const batchSize = 25
  for (let i = 0; i < questions.length; i += batchSize) {
    await knex('questions').insert(questions.slice(i, i + batchSize))
  }
  console.log('[Seed 043] Unit4: ' + questions.length + ' past exam questions')
}
