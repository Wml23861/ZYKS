import { Knex } from 'knex'

function eid(prefix: string, year: number, unit: number): string {
  return `${prefix}_${year}_u${unit}`
}

function qid(examId: string, idx: number): string {
  return `${examId}_q${String(idx).padStart(3, '0')}`
}

const now = Date.now()

export async function seed(knex: Knex): Promise<void> {
  // 清理旧数据
  await knex('past_exam_questions').del()
  await knex('past_exams').del()

  // ========== 2024 年真题 ==========
  const exam2024U1 = eid('pe', 2024, 1)
  const exam2024U2 = eid('pe', 2024, 2)

  await knex('past_exams').insert([
    {
      id: exam2024U1, year: 2024, unit: 1, total_questions: 150, time_limit: 150,
      summary: `**2024年中医执业助理医师第一单元考试总结**\n\n本单元涵盖中医基础理论、中医诊断学、中药学、方剂学四大科目。整体难度中等，A1型题占比约60%，A2型题约25%，B1型题约15%。\n\n- **中医基础理论**：重点考查阴阳五行学说、藏象学说、气血津液理论\n- **中医诊断学**：重点考查望诊、舌诊、脉诊及八纲辨证\n- **中药学**：重点考查常用中药的性味归经、功效主治及配伍禁忌（十八反十九畏）\n- **方剂学**：重点考查常用方剂的组成、功效及主治病证\n\n考查趋势：题目更加注重临床应用能力，A2型病例题占比逐年上升。`,
      key_points: `**2024年第一单元重点难点**\n\n**高频考点**\n- 阴阳学说：事物阴阳属性的归类、阴阳互根互用\n- 五行学说：五行生克乘侮关系及其在疾病传变中的应用\n- 脏腑辨证：心与小肠、肝与胆的表里关系\n- 八纲辨证：表里、寒热、虚实、阴阳的鉴别要点\n\n**难点提示**\n- 六淫致病的性质和特点（风、寒、暑、湿、燥、火）\n- 舌苔与舌质的综合辨析\n- 十八反、十九畏的具体药物及配伍禁忌\n- 麻黄汤与桂枝汤的组成鉴别及临床应用区别`,
      source: '考生回忆版', created_at: now,
    },
    {
      id: exam2024U2, year: 2024, unit: 2, total_questions: 150, time_limit: 150,
      summary: `**2024年中医执业助理医师第二单元考试总结**\n\n本单元涵盖中医内科学、针灸学、中医妇科学、中医儿科学、西医基础及医学伦理法规。A2型病例分析题占比明显高于第一单元。\n\n- **中医内科学**：重点考查感冒、咳嗽、哮证、喘证、胸痹、中风、胃痛、泄泻、痢疾、胁痛、黄疸、水肿、淋证等常见病证的辨证论治\n- **针灸学**：重点考查经络循行、腧穴定位、行针手法及常见病证的针灸治疗\n- **中医妇科学**：重点考查月经病、带下病\n- **西医基础**：考查传染病、呼吸系统、消化系统等基础知识`,
      key_points: `**2024年第二单元重点难点**\n\n**高频考点**\n- 感冒：风寒感冒与风热感冒的鉴别\n- 咳嗽：外感咳嗽与内伤咳嗽的辨证要点\n- 哮证与喘证的区别\n- 胸痹的辨证分型（心血瘀阻、气滞心胸等）\n- 中风：中经络与中脏腑的鉴别；脱证与闭证\n- 胃痛：寒邪客胃证与脾胃虚寒证的鉴别\n\n**难点提示**\n- 内伤发热与外感发热的鉴别诊断\n- 痢疾与泄泻的鉴别要点\n- 淋证的六种证型鉴别\n- 针灸行针基本手法与辅助手法的区分\n- 八会穴、五输穴的记忆和应用`,
      source: '考生回忆版', created_at: now,
    },
  ])

  // ========== 2024 第一单元真题 ==========
  const q2024U1 = [
    // A1 型题 — 中医基础理论
    { type: 'A1', subject: 'basic-theory', stem: '下列哪项属于中医学的基本特点', options: [{key:'A',text:'同病异治'},{key:'B',text:'异病同治'},{key:'C',text:'审因论治'},{key:'D',text:'辨证论治'},{key:'E',text:'标本同治'}], answer: 'D', explanation: '辨证论治是中医学的基本特点之一。中医学的两大基本特点是整体观念和辨证论治。', difficulty: 1, tag: '高频', freq: 5 },
    { type: 'A1', subject: 'basic-theory', stem: '下述说法，哪一项不是"金"的特性', options: [{key:'A',text:'肃降'},{key:'B',text:'收敛'},{key:'C',text:'清洁'},{key:'D',text:'寒凉'},{key:'E',text:'干燥'}], answer: 'D', explanation: '金的特性是肃降、收敛、清洁、干燥。寒凉属水的特性。五行中，水曰润下，其性寒凉。', difficulty: 2, tag: '重点', freq: 3 },
    { type: 'A1', subject: 'basic-theory', stem: '下列哪项是小肠的功能', options: [{key:'A',text:'主受盛'},{key:'B',text:'主运化'},{key:'C',text:'主传化'},{key:'D',text:'主受纳'},{key:'E',text:'主腐熟'}], answer: 'A', explanation: '小肠的主要生理功能是主受盛和化物，泌别清浊。主运化是脾的功能，主传化是大肠的功能，主受纳和腐熟是胃的功能。', difficulty: 2, tag: '高频', freq: 4 },
    { type: 'A1', subject: 'basic-theory', stem: '肺主一身之气，主要体现在', options: [{key:'A',text:'宣发卫气'},{key:'B',text:'生成宗气'},{key:'C',text:'调节腠理'},{key:'D',text:'吸入清气'},{key:'E',text:'排出浊气'}], answer: 'B', explanation: '肺主一身之气主要体现在宗气的生成。宗气由肺吸入的清气与脾胃运化的水谷精气结合而成，积于胸中，贯心脉而行呼吸。', difficulty: 3, tag: '重点', freq: 4 },
    { type: 'A1', subject: 'basic-theory', stem: '肾主水的功能主要依赖于', options: [{key:'A',text:'肾阳的温煦'},{key:'B',text:'肾阴的滋润'},{key:'C',text:'肾的气化'},{key:'D',text:'肾的封藏'},{key:'E',text:'肾的固摄'}], answer: 'C', explanation: '肾主水的功能主要依赖于肾的气化作用。肾的气化功能正常，则水液代谢正常；肾的气化功能失常，则水液代谢障碍，出现水肿、小便不利等。', difficulty: 3, tag: '难点', freq: 3 },
    // A1 型题 — 中医诊断学
    { type: 'A1', subject: 'diagnostics', stem: '舌诊中，舌尖所候的脏腑是', options: [{key:'A',text:'心、肺'},{key:'B',text:'脾、胃'},{key:'C',text:'肝、胆'},{key:'D',text:'肾'},{key:'E',text:'大肠'}], answer: 'A', explanation: '舌面的脏腑分部：舌尖候心肺，舌中候脾胃，舌根候肾，舌边候肝胆。', difficulty: 1, tag: '高频', freq: 5 },
    { type: 'A1', subject: 'diagnostics', stem: '滑数脉的主病是', options: [{key:'A',text:'气虚'},{key:'B',text:'血虚'},{key:'C',text:'痰热'},{key:'D',text:'寒湿'},{key:'E',text:'气滞'}], answer: 'C', explanation: '滑脉主痰饮、食滞、实热；数脉主热证。滑数脉相兼主痰热、食积化热等证。', difficulty: 2, tag: '重点', freq: 4 },
    { type: 'A1', subject: 'diagnostics', stem: '战汗的临床意义是', options: [{key:'A',text:'邪去正安'},{key:'B',text:'正邪交争'},{key:'C',text:'正气欲脱'},{key:'D',text:'阳气暴脱'},{key:'E',text:'阴虚内热'}], answer: 'B', explanation: '战汗是指患者先全身战栗抖动而后汗出的现象，是正邪交争剧烈的表现。战汗后热退脉静者为邪去正安；战汗后烦躁脉疾者为正气欲脱之危候。', difficulty: 3, tag: '难点', freq: 3 },
    { type: 'A1', subject: 'diagnostics', stem: '五轮学说中，眼睑属于', options: [{key:'A',text:'血轮'},{key:'B',text:'气轮'},{key:'C',text:'肉轮'},{key:'D',text:'风轮'},{key:'E',text:'水轮'}], answer: 'C', explanation: '五轮学说：眼睑（肉轮）属脾，两眦（血轮）属心，白睛（气轮）属肺，黑睛（风轮）属肝，瞳神（水轮）属肾。', difficulty: 2, tag: '重点', freq: 4 },
    // A1 型题 — 中药学
    { type: 'A1', subject: 'herbology', stem: '大黄的性味是', options: [{key:'A',text:'苦、甘，寒'},{key:'B',text:'苦，寒'},{key:'C',text:'辛、苦，寒'},{key:'D',text:'甘、淡，寒'},{key:'E',text:'酸、苦，寒'}], answer: 'B', explanation: '大黄味苦，性寒。归脾、胃、大肠、肝、心包经。具有泻下攻积、清热泻火、凉血解毒、逐瘀通经的功效。', difficulty: 1, tag: '高频', freq: 5 },
    { type: 'A1', subject: 'herbology', stem: '细辛的功效是', options: [{key:'A',text:'解表散寒，祛风止痛'},{key:'B',text:'解表散寒，祛风止痛，温肺化饮'},{key:'C',text:'发散风寒，通鼻窍'},{key:'D',text:'祛风散寒，胜湿止痛'},{key:'E',text:'散寒解表，行气宽中'}], answer: 'B', explanation: '细辛的功效是解表散寒、祛风止痛、温肺化饮。白芷的功效是解表散寒、祛风止痛、通鼻窍。羌活的功效是解表散寒、祛风胜湿、止痛。', difficulty: 2, tag: '重点', freq: 4 },
    { type: 'A1', subject: 'herbology', stem: '知母的功效是', options: [{key:'A',text:'清热泻火'},{key:'B',text:'清热泻火，滋阴润燥'},{key:'C',text:'清热凉血'},{key:'D',text:'清热解毒'},{key:'E',text:'清热燥湿'}], answer: 'B', explanation: '知母的功效是清热泻火、滋阴润燥。知母与石膏均能清热泻火，但石膏重在清解，知母重在清润。', difficulty: 2, tag: '重点', freq: 3 },
    { type: 'A1', subject: 'herbology', stem: '十八反中，甘草反', options: [{key:'A',text:'甘遂、大戟、海藻、芫花'},{key:'B',text:'贝母、瓜蒌、半夏、白蔹、白及'},{key:'C',text:'人参、沙参、丹参、玄参、细辛、芍药'},{key:'D',text:'甘遂、大戟、芫花'},{key:'E',text:'藜芦'}], answer: 'A', explanation: '十八反歌：本草明言十八反，半萎贝蔹及攻乌，藻戟遂芫俱战草，诸参辛芍叛藜芦。甘草反甘遂、大戟、海藻、芫花。', difficulty: 2, tag: '高频', freq: 5 },
    // A1 型题 — 方剂学
    { type: 'A1', subject: 'formulas', stem: '麻黄汤的组成是', options: [{key:'A',text:'麻黄、桂枝、杏仁、甘草'},{key:'B',text:'麻黄、桂枝、白芍、甘草'},{key:'C',text:'麻黄、桂枝、生姜、大枣、甘草'},{key:'D',text:'桂枝、白芍、生姜、大枣、甘草'},{key:'E',text:'麻黄、石膏、杏仁、甘草'}], answer: 'A', explanation: '麻黄汤（《伤寒论》）由麻黄、桂枝、杏仁、甘草四味药组成。功效发汗解表、宣肺平喘。主治外感风寒表实证。', difficulty: 1, tag: '高频', freq: 5 },
    { type: 'A1', subject: 'formulas', stem: '桂枝汤中桂枝与白芍的配伍比例是', options: [{key:'A',text:'1:1'},{key:'B',text:'2:1'},{key:'C',text:'1:2'},{key:'D',text:'3:1'},{key:'E',text:'1:3'}], answer: 'A', explanation: '桂枝汤中桂枝三两（去皮）、芍药三两，比例为1:1。桂枝解肌发表，芍药敛阴和营，一散一收，调和营卫。', difficulty: 2, tag: '重点', freq: 4 },
    { type: 'A1', subject: 'formulas', stem: '二陈汤的主治病证是', options: [{key:'A',text:'风痰上扰'},{key:'B',text:'湿痰咳嗽'},{key:'C',text:'热痰咳嗽'},{key:'D',text:'寒痰咳嗽'},{key:'E',text:'燥痰咳嗽'}], answer: 'B', explanation: '二陈汤由半夏、橘红、白茯苓、甘草组成。功效燥湿化痰、理气和中。主治湿痰咳嗽。症见咳嗽痰多、色白易咯、胸膈痞闷、恶心呕吐、舌苔白腻。', difficulty: 2, tag: '高频', freq: 4 },
    { type: 'A2', subject: 'formulas', stem: '患者感冒3天，恶寒发热，无汗，头痛身痛，气喘，舌苔薄白，脉浮紧。应选用的方剂是', options: [{key:'A',text:'桂枝汤'},{key:'B',text:'麻黄汤'},{key:'C',text:'银翘散'},{key:'D',text:'桑菊饮'},{key:'E',text:'荆防败毒散'}], answer: 'B', explanation: '恶寒发热、无汗、脉浮紧为风寒表实证的典型表现，麻黄汤证（太阳伤寒）。桂枝汤证应有汗出（太阳中风）。', difficulty: 3, tag: '重点', freq: 4 },
    { type: 'A2', subject: 'formulas', stem: '患者咳嗽痰多、色白易咯、胸膈痞闷、恶心呕吐、舌苔白腻、脉滑。应选用的方剂是', options: [{key:'A',text:'止嗽散'},{key:'B',text:'清气化痰丸'},{key:'C',text:'二陈汤'},{key:'D',text:'苓甘五味姜辛汤'},{key:'E',text:'三子养亲汤'}], answer: 'C', explanation: '咳嗽痰多色白易咯、胸膈痞闷、恶心呕吐、舌苔白腻、脉滑，为湿痰证的典型表现。二陈汤燥湿化痰、理气和中，是治疗湿痰咳嗽的主方。', difficulty: 2, tag: '高频', freq: 4 },
    // B1 型题
    { type: 'B1', subject: 'basic-theory', stem: '（共用选项）', options: [{key:'A',text:'风'},{key:'B',text:'寒'},{key:'C',text:'暑'},{key:'D',text:'湿'},{key:'E',text:'燥'}], answer: 'A', explanation: '风为阳邪，其性开泄，易袭阳位。风性善行而数变，风为百病之长。', difficulty: 2, tag: '重点', freq: 3 },
    { type: 'B1', subject: 'diagnostics', stem: '（共用选项）', options: [{key:'A',text:'表证'},{key:'B',text:'里证'},{key:'C',text:'寒证'},{key:'D',text:'热证'},{key:'E',text:'虚证'}], answer: 'A', explanation: '恶寒发热同时并见是表证的特征性表现。', difficulty: 1, tag: '高频', freq: 4 },
  ]

  await knex('past_exam_questions').insert(q2024U1.map((q, i) => ({
    id: qid(exam2024U1, i + 1),
    exam_id: exam2024U1,
    type: q.type,
    subject_id: q.subject,
    question_stem: q.stem,
    options: JSON.stringify(q.options),
    correct_answer: q.answer,
    explanation: q.explanation,
    difficulty: q.difficulty,
    key_point_tag: q.tag,
    exam_frequency: q.freq,
    sort_order: i + 1,
  })))

  // ========== 2024 第二单元真题 ==========
  const q2024U2 = [
    // 中医内科学 A1
    { type: 'A1', subject: 'internal-medicine', stem: '感冒的病机主要是', options: [{key:'A',text:'肺气不宣'},{key:'B',text:'卫表不和'},{key:'C',text:'肺失宣降'},{key:'D',text:'正邪交争'},{key:'E',text:'营卫不和'}], answer: 'B', explanation: '感冒的基本病机是卫表不和。外邪侵犯肺卫，卫阳被遏，营卫失和，正邪交争而发病。病位在肺卫。', difficulty: 2, tag: '高频', freq: 5 },
    { type: 'A1', subject: 'internal-medicine', stem: '下列哪项不是痢疾与泄泻的鉴别点', options: [{key:'A',text:'有无里急后重'},{key:'B',text:'有无脓血便'},{key:'C',text:'有无排便次数增多'},{key:'D',text:'有无腹痛'},{key:'E',text:'有无传染性'}], answer: 'C', explanation: '痢疾与泄泻均可见排便次数增多，故不是鉴别要点。痢疾特征为里急后重、痢下赤白脓血；泄泻特征为便溏、水样便。', difficulty: 3, tag: '重点', freq: 4 },
    { type: 'A1', subject: 'internal-medicine', stem: '下列哪项不属于内伤发热的诊断要点', options: [{key:'A',text:'起病较缓'},{key:'B',text:'病程较长'},{key:'C',text:'多为高热'},{key:'D',text:'反复发作'},{key:'E',text:'伴气血阴阳亏虚表现'}], answer: 'C', explanation: '内伤发热以低热为多见，或自觉发热而体温不高。高热多为外感发热的特点。内伤发热起病缓慢、病程较长、反复发作。', difficulty: 3, tag: '难点', freq: 3 },
    { type: 'A1', subject: 'internal-medicine', stem: '中风的脱证与闭证的鉴别要点是', options: [{key:'A',text:'有无神志障碍'},{key:'B',text:'有无肢体偏瘫'},{key:'C',text:'有无牙关紧闭'},{key:'D',text:'有无二便失禁'},{key:'E',text:'目合口开与牙关紧闭'}], answer: 'E', explanation: '中风闭证：牙关紧闭、口噤不开、两手握固、肢体强痉。脱证：目合口开、手撒肢冷、二便失禁。关键鉴别在目合口开（脱）与牙关紧闭（闭）。', difficulty: 3, tag: '高频', freq: 4 },
    { type: 'A1', subject: 'internal-medicine', stem: '胸痹的主要病机是', options: [{key:'A',text:'心脉痹阻'},{key:'B',text:'心气不足'},{key:'C',text:'心阳不振'},{key:'D',text:'痰浊内阻'},{key:'E',text:'气滞血瘀'}], answer: 'A', explanation: '胸痹的主要病机是心脉痹阻。虽可有心气不足、心阳不振、痰浊、气滞、血瘀等多种病理变化，但最终导致心脉痹阻而发病。', difficulty: 2, tag: '高频', freq: 4 },
    { type: 'A2', subject: 'internal-medicine', stem: '患者咳嗽声重，痰稀色白，恶寒发热，无汗，鼻塞流清涕，舌苔薄白，脉浮紧。其证型为', options: [{key:'A',text:'风热犯肺'},{key:'B',text:'风寒袭肺'},{key:'C',text:'风燥伤肺'},{key:'D',text:'痰湿蕴肺'},{key:'E',text:'痰热郁肺'}], answer: 'B', explanation: '咳嗽痰稀色白、恶寒无汗、流清涕、舌苔薄白、脉浮紧，为风寒袭肺咳嗽的典型表现。', difficulty: 2, tag: '高频', freq: 5 },
    { type: 'A2', subject: 'internal-medicine', stem: '患者胃脘隐痛，喜温喜按，空腹痛甚，得食痛减，神疲乏力，舌淡苔白，脉虚弱。应诊断为', options: [{key:'A',text:'寒邪客胃证'},{key:'B',text:'饮食伤胃证'},{key:'C',text:'肝气犯胃证'},{key:'D',text:'脾胃虚寒证'},{key:'E',text:'胃阴亏虚证'}], answer: 'D', explanation: '胃痛喜温喜按、空腹痛甚、得食痛减为脾胃虚寒证的典型表现。寒邪客胃证为突然胃痛、遇寒加重。', difficulty: 3, tag: '重点', freq: 4 },
    // 针灸学
    { type: 'A1', subject: 'acupuncture', stem: '捻转法属于', options: [{key:'A',text:'辅助手法'},{key:'B',text:'基本手法'},{key:'C',text:'补泻手法'},{key:'D',text:'催气手法'},{key:'E',text:'行气手法'}], answer: 'B', explanation: '行针基本手法包括提插法和捻转法。辅助手法包括循法、刮法、弹法、飞法、震颤法等。', difficulty: 2, tag: '重点', freq: 4 },
    { type: 'A1', subject: 'acupuncture', stem: '八会穴中，血会是', options: [{key:'A',text:'太渊'},{key:'B',text:'膈俞'},{key:'C',text:'中脘'},{key:'D',text:'大杼'},{key:'E',text:'阳陵泉'}], answer: 'B', explanation: '八会穴：脏会章门，腑会中脘，气会膻中，血会膈俞，筋会阳陵泉，脉会太渊，骨会大杼，髓会绝骨。', difficulty: 2, tag: '高频', freq: 4 },
    { type: 'A1', subject: 'acupuncture', stem: '中风脱证取穴宜选用', options: [{key:'A',text:'关元、神阙'},{key:'B',text:'人中、内关'},{key:'C',text:'合谷、太冲'},{key:'D',text:'曲池、足三里'},{key:'E',text:'风池、风府'}], answer: 'A', explanation: '中风脱证宜回阳固脱，取任脉穴为主。关元为元阳之所在，神阙为生命之根蒂，二穴施灸可回阳救逆。', difficulty: 3, tag: '难点', freq: 3 },
    { type: 'A2', subject: 'acupuncture', stem: '患者牙痛剧烈，齿龈红肿，伴口臭、口渴、便秘，舌红苔黄，脉洪数。辨证属于', options: [{key:'A',text:'风火牙痛'},{key:'B',text:'胃火牙痛'},{key:'C',text:'虚火牙痛'},{key:'D',text:'龋齿牙痛'},{key:'E',text:'风寒牙痛'}], answer: 'B', explanation: '牙痛剧烈、齿龈红肿、口臭口渴便秘、舌红苔黄、脉洪数为胃火牙痛的典型表现。取合谷、颊车、下关为主穴，配内庭清泻胃火。', difficulty: 2, tag: '重点', freq: 3 },
    // 西医基础
    { type: 'A1', subject: 'western-medicine', stem: '下列各项，对诊断急性肾小球肾炎最有意义的是', options: [{key:'A',text:'血尿'},{key:'B',text:'蛋白尿'},{key:'C',text:'管型尿'},{key:'D',text:'高血压'},{key:'E',text:'血清补体C₃下降，在肾炎症状出现后8周内恢复正常'}], answer: 'E', explanation: '血清补体C₃下降并在8周内恢复正常是急性肾小球肾炎的特征性改变，具有重要诊断价值。其他选项也可见于急性肾小球肾炎，但非特异性诊断指标。', difficulty: 4, tag: '难点', freq: 2 },
    { type: 'A1', subject: 'western-medicine', stem: '下列哪项不是再生障碍性贫血的中医证型', options: [{key:'A',text:'气血两虚证'},{key:'B',text:'脾肾阳虚证'},{key:'C',text:'阳虚水停证'},{key:'D',text:'肝肾阴虚证'},{key:'E',text:'热毒炽盛证'}], answer: 'C', explanation: '再生障碍性贫血的中医证型包括气血两虚证、脾肾阳虚证、肝肾阴虚证、热毒炽盛证等。阳虚水停证不是再障的中医证型。', difficulty: 3, tag: '重点', freq: 2 },
    // 伦理法规
    { type: 'A1', subject: 'ethics-law', stem: '我国卫生法基本原则不包括的内容是', options: [{key:'A',text:'保护公民健康'},{key:'B',text:'预防为主'},{key:'C',text:'中西医并重'},{key:'D',text:'兼顾经济与社会效益'},{key:'E',text:'动员全社会参与'}], answer: 'D', explanation: '我国卫生法的基本原则包括：保护公民健康、预防为主、中西医并重、依靠科技进步、动员全社会参与。兼顾经济与社会效益不属于基本原则。', difficulty: 2, tag: '重点', freq: 3 },
    { type: 'A1', subject: 'ethics-law', stem: '下列各项，不属于法定责任疫情报告人的是', options: [{key:'A',text:'医疗机构'},{key:'B',text:'疾病预防控制机构'},{key:'C',text:'采供血机构'},{key:'D',text:'卫生行政部门'},{key:'E',text:'社会福利机构'}], answer: 'E', explanation: '法定责任疫情报告人包括医疗机构、疾病预防控制机构、采供血机构、卫生行政部门及其执行职务的医务人员。社会福利机构不属于法定责任疫情报告人。', difficulty: 2, tag: '重点', freq: 2 },
  ]

  await knex('past_exam_questions').insert(q2024U2.map((q, i) => ({
    id: qid(exam2024U2, i + 1),
    exam_id: exam2024U2,
    type: q.type,
    subject_id: q.subject,
    question_stem: q.stem,
    options: JSON.stringify(q.options),
    correct_answer: q.answer,
    explanation: q.explanation,
    difficulty: q.difficulty,
    key_point_tag: q.tag,
    exam_frequency: q.freq,
    sort_order: i + 1,
  })))

  // ========== 2023 年真题 ==========
  const exam2023U1 = eid('pe', 2023, 1)
  const exam2023U2 = eid('pe', 2023, 2)

  await knex('past_exams').insert([
    {
      id: exam2023U1, year: 2023, unit: 1, total_questions: 150, time_limit: 150,
      summary: `**2023年中医执业助理医师第一单元考试总结**\n\n2023年考试大纲已按2020版新大纲执行。第一单元整体难度与2022年持平，侧重基础知识的考查。\n\n中医基础理论、中医诊断学为考查重点，中药学和方剂学更加注重临床应用能力的测试。`,
      key_points: `**2023年第一单元重点难点**\n\n- 阴阳五行学说在临床中的应用\n- 脏腑辨证的综合运用\n- 常用中药的鉴别（功效相近药物的比较）\n- 方剂的组成原则与加减变化`,
      source: '考生回忆版', created_at: now,
    },
    {
      id: exam2023U2, year: 2023, unit: 2, total_questions: 150, time_limit: 150,
      summary: `**2023年中医执业助理医师第二单元考试总结**\n\n第二单元以中医内科学和针灸学为核心，A2型病例分析题占比约35%。西医基础部分注重常见检验指标的解读。\n\n传染病学考查了新冠病毒感染纳入乙类乙管后的相关法规要求。`,
      key_points: `**2023年第二单元重点难点**\n\n- 中医内科常见病证的辨证论治\n- 针灸治疗各科病证的选穴规律\n- 西医常见实验室检查的临床意义\n- 传染病报告制度及分类管理`,
      source: '考生回忆版', created_at: now,
    },
  ])

  const q2023U1 = [
    { type: 'A1', subject: 'basic-theory', stem: '阴阳学说中，"阴中求阳"的理论依据是', options: [{key:'A',text:'阴阳对立制约'},{key:'B',text:'阴阳互根互用'},{key:'C',text:'阴阳消长平衡'},{key:'D',text:'阴阳相互转化'},{key:'E',text:'阴阳交感'}], answer: 'B', explanation: '阴中求阳的理论依据是阴阳互根互用。阴阳双方互为根本，相互依存、相互为用。', difficulty: 2, tag: '高频', freq: 4 },
    { type: 'A1', subject: 'basic-theory', stem: '五行中，木的"所不胜"是', options: [{key:'A',text:'水'},{key:'B',text:'火'},{key:'C',text:'土'},{key:'D',text:'金'},{key:'E',text:'木'}], answer: 'D', explanation: '五行相克：木克土，土克水，水克火，火克金，金克木。克我者为"所不胜"，金克木，故木的"所不胜"是金。', difficulty: 2, tag: '重点', freq: 3 },
    { type: 'A1', subject: 'basic-theory', stem: '脾胃为气机升降的枢纽，其中脾主', options: [{key:'A',text:'升清'},{key:'B',text:'降浊'},{key:'C',text:'升清降浊'},{key:'D',text:'运化水谷'},{key:'E',text:'统血'}], answer: 'A', explanation: '脾胃为气机升降之枢纽：脾主升清，胃主降浊。脾升胃降，共同维持人体气机的正常运行。', difficulty: 2, tag: '重点', freq: 3 },
    { type: 'A1', subject: 'diagnostics', stem: '望神中，"失神"的临床意义是', options: [{key:'A',text:'正气已伤，病情较重'},{key:'B',text:'正气大伤，病情严重'},{key:'C',text:'正气未伤，病情较轻'},{key:'D',text:'阴阳离决，生命垂危'},{key:'E',text:'假神，病情恶化'}], answer: 'B', explanation: '失神又称"无神"，提示正气大伤、脏腑功能衰竭，病情严重。假神是垂危患者出现暂时好转的假象。少神提示正气已伤。', difficulty: 2, tag: '高频', freq: 4 },
    { type: 'A1', subject: 'herbology', stem: '麻黄与桂枝的共同功效是', options: [{key:'A',text:'发汗解表'},{key:'B',text:'温通经脉'},{key:'C',text:'宣肺平喘'},{key:'D',text:'利水消肿'},{key:'E',text:'助阳化气'}], answer: 'A', explanation: '麻黄与桂枝均能发汗解表，常相须为用治疗风寒表实证。麻黄还能宣肺平喘、利水消肿。桂枝还能温通经脉、助阳化气。', difficulty: 2, tag: '重点', freq: 3 },
    { type: 'A1', subject: 'herbology', stem: '十九畏中，丁香畏', options: [{key:'A',text:'芒硝'},{key:'B',text:'郁金'},{key:'C',text:'三棱'},{key:'D',text:'牵牛子'},{key:'E',text:'巴豆'}], answer: 'B', explanation: '十九畏歌：硫黄原是火中精，朴硝一见便相争；水银莫与砒霜见；狼毒最怕密陀僧；巴豆性烈最为上，偏与牵牛不顺情；丁香莫与郁金见；牙硝难合京三棱。', difficulty: 2, tag: '高频', freq: 4 },
    { type: 'A1', subject: 'formulas', stem: '银翘散的君药是', options: [{key:'A',text:'银花、连翘'},{key:'B',text:'银花、薄荷'},{key:'C',text:'连翘、薄荷'},{key:'D',text:'银花、荆芥'},{key:'E',text:'连翘、牛蒡子'}], answer: 'A', explanation: '银翘散中银花、连翘为君药，既有辛凉透表、清热解毒之功，又具芳香辟秽之效，在透散卫分表邪的同时兼顾温热病邪易蕴而成毒的特点。', difficulty: 2, tag: '高频', freq: 4 },
    { type: 'A2', subject: 'formulas', stem: '患者发热，微恶风寒，无汗或有汗不畅，头痛口渴，咳嗽咽痛，舌尖红苔薄白，脉浮数。应选用的方剂是', options: [{key:'A',text:'麻黄汤'},{key:'B',text:'桂枝汤'},{key:'C',text:'银翘散'},{key:'D',text:'桑菊饮'},{key:'E',text:'麻杏石甘汤'}], answer: 'C', explanation: '发热、微恶风寒、口渴、咽痛、舌尖红、脉浮数为风热表证。银翘散辛凉透表，清热解毒，为治疗风热表证的代表方。', difficulty: 2, tag: '重点', freq: 4 },
  ]

  await knex('past_exam_questions').insert(q2023U1.map((q, i) => ({
    id: qid(exam2023U1, i + 1),
    exam_id: exam2023U1,
    type: q.type,
    subject_id: q.subject,
    question_stem: q.stem,
    options: JSON.stringify(q.options),
    correct_answer: q.answer,
    explanation: q.explanation,
    difficulty: q.difficulty,
    key_point_tag: q.tag,
    exam_frequency: q.freq,
    sort_order: i + 1,
  })))

  const q2023U2 = [
    { type: 'A1', subject: 'internal-medicine', stem: '哮证发作期的基本病理变化是', options: [{key:'A',text:'肺失宣降'},{key:'B',text:'痰阻气闭'},{key:'C',text:'外邪侵袭'},{key:'D',text:'肺肾两虚'},{key:'E',text:'气机郁滞'}], answer: 'B', explanation: '哮证发作期的基本病理变化是痰阻气闭。宿痰伏于肺，因外感、饮食、情志等诱因触发，痰随气升，气因痰阻，痰气搏结，壅塞气道而发作。', difficulty: 2, tag: '高频', freq: 4 },
    { type: 'A1', subject: 'internal-medicine', stem: '黄疸的辨证应以何为纲', options: [{key:'A',text:'阴阳'},{key:'B',text:'寒热'},{key:'C',text:'虚实'},{key:'D',text:'表里'},{key:'E',text:'气血'}], answer: 'A', explanation: '黄疸的辨证以阴阳为纲，分为阳黄和阴黄。阳黄多因湿热，阴黄多因寒湿。', difficulty: 2, tag: '重点', freq: 3 },
    { type: 'A2', subject: 'internal-medicine', stem: '患者眩晕，头重如蒙，胸闷恶心，食少多寐，舌苔白腻，脉濡滑。其证型为', options: [{key:'A',text:'肝阳上亢'},{key:'B',text:'痰湿中阻'},{key:'C',text:'气血亏虚'},{key:'D',text:'肾精不足'},{key:'E',text:'瘀血阻窍'}], answer: 'B', explanation: '眩晕头重如蒙、胸闷恶心、食少多寐、苔白腻、脉濡滑为痰湿中阻证的典型表现。', difficulty: 2, tag: '重点', freq: 3 },
    { type: 'A1', subject: 'acupuncture', stem: '足三里穴的定位是', options: [{key:'A',text:'外膝眼下3寸，胫骨前嵴外一横指'},{key:'B',text:'外膝眼下2寸'},{key:'C',text:'内膝眼下3寸'},{key:'D',text:'小腿外侧，腓骨小头前下方'},{key:'E',text:'髌骨下方凹陷中'}], answer: 'A', explanation: '足三里属足阳明胃经，定位：在小腿外侧，犊鼻（外膝眼）下3寸，犊鼻与解溪的连线上，胫骨前嵴外一横指处。', difficulty: 1, tag: '高频', freq: 5 },
    { type: 'A1', subject: 'acupuncture', stem: '五输穴中，荥穴主治', options: [{key:'A',text:'心下满'},{key:'B',text:'身热'},{key:'C',text:'体重节痛'},{key:'D',text:'喘咳寒热'},{key:'E',text:'逆气而泄'}], answer: 'B', explanation: '五输穴主治：井主心下满，荥主身热，输主体重节痛，经主喘咳寒热，合主逆气而泄。', difficulty: 2, tag: '难点', freq: 3 },
    { type: 'A1', subject: 'western-medicine', stem: '中医学认为，甲状腺功能亢进症的病因不包括', options: [{key:'A',text:'外感六淫'},{key:'B',text:'情志内伤'},{key:'C',text:'饮食不节'},{key:'D',text:'体质因素'},{key:'E',text:'劳倦过度'}], answer: 'A', explanation: '甲亢的中医病因包括情志内伤、饮食不节、体质因素、劳倦过度等。外感六淫不是其主要病因。', difficulty: 3, tag: '重点', freq: 2 },
    { type: 'A1', subject: 'gynecology', stem: '月经先期的病机主要是', options: [{key:'A',text:'气虚和血热'},{key:'B',text:'血寒和血瘀'},{key:'C',text:'气滞和血瘀'},{key:'D',text:'痰湿和湿热'},{key:'E',text:'肾虚和肝郁'}], answer: 'A', explanation: '月经先期的主要病机是气虚和血热。气虚则统摄无权，冲任不固；血热则热扰冲任，血海不宁，均可使月经提前而至。', difficulty: 2, tag: '重点', freq: 3 },
  ]

  await knex('past_exam_questions').insert(q2023U2.map((q, i) => ({
    id: qid(exam2023U2, i + 1),
    exam_id: exam2023U2,
    type: q.type,
    subject_id: q.subject,
    question_stem: q.stem,
    options: JSON.stringify(q.options),
    correct_answer: q.answer,
    explanation: q.explanation,
    difficulty: q.difficulty,
    key_point_tag: q.tag,
    exam_frequency: q.freq,
    sort_order: i + 1,
  })))

  // ========== 2022-2018 年真题元数据（框架数据，具体题目后续补充） ==========
  const olderExams = [
    { year: 2022, summary: '2022年考试采用2020版新大纲，中医经典内容有所增加。整体难度适中。', keyPoints: '重点考查中医经典条文的理解和应用。方剂学增加《金匮要略》相关方剂。' },
    { year: 2021, summary: '2021年考试受疫情影响，部分考区延期。题型结构与2020年一致。', keyPoints: '温病学相关内容考查增多。传染病防控知识成为新增考点。' },
    { year: 2020, summary: '2020年为新老大纲过渡年，开始执行2020版考试大纲。', keyPoints: '新大纲增加中医经典（内经、伤寒论、金匮要略、温病学）考查内容。' },
    { year: 2019, summary: '2019年考试仍沿用旧版大纲，为最后一年旧大纲考试。', keyPoints: '重点仍以中医基础、诊断、中药、方剂四大基础科目为主。' },
    { year: 2018, summary: '2018年考试整体难度偏易，通过率较高。', keyPoints: '考试重点在中医内科常见病证的辨证论治，针灸取穴考查较为基础。' },
  ]

  for (const exam of olderExams) {
    for (const unit of [1, 2]) {
      await knex('past_exams').insert({
        id: eid('pe', exam.year, unit),
        year: exam.year,
        unit,
        total_questions: 150,
        time_limit: 150,
        summary: exam.summary,
        key_points: exam.keyPoints,
        source: '考生回忆版',
        created_at: now,
      })

      // 为每年每单元插入少量代表性题目
      const sampleQs = unit === 1 ? [
        { type: 'A1', subject: 'basic-theory', stem: `（${exam.year}年真题）中医学整体观念的含义是`, options: [{key:'A',text:'人体自身的完整性'},{key:'B',text:'人与自然环境的统一性'},{key:'C',text:'人与社会环境的统一性'},{key:'D',text:'人体自身的完整性及与自然、社会环境的统一性'},{key:'E',text:'五脏六腑的统一性'}], answer: 'D', explanation: '中医学整体观念包括人体自身的完整性和人与自然、社会环境的统一性两个方面。', difficulty: 1, tag: '高频', freq: 5 },
        { type: 'A1', subject: 'diagnostics', stem: `（${exam.year}年真题）面色萎黄多属`, options: [{key:'A',text:'脾胃气虚'},{key:'B',text:'湿热黄疸'},{key:'C',text:'寒湿困脾'},{key:'D',text:'气血不足'},{key:'E',text:'肝胆湿热'}], answer: 'A', explanation: '面色萎黄、淡黄无华多属脾胃气虚、气血不足。面色黄而鲜明如橘皮为湿热黄疸（阳黄），面色黄而晦暗如烟熏为寒湿黄疸（阴黄）。', difficulty: 1, tag: '高频', freq: 5 },
        { type: 'A1', subject: 'herbology', stem: `（${exam.year}年真题）黄芪的主要功效是`, options: [{key:'A',text:'补气升阳，益卫固表'},{key:'B',text:'补气养血'},{key:'C',text:'补气养阴'},{key:'D',text:'补气活血'},{key:'E',text:'补气安胎'}], answer: 'A', explanation: '黄芪的功效是补气升阳、益卫固表、利水消肿、托毒生肌。为补气要药。', difficulty: 1, tag: '高频', freq: 5 },
        { type: 'A1', subject: 'formulas', stem: `（${exam.year}年真题）四君子汤的组成是`, options: [{key:'A',text:'人参、白术、茯苓、甘草'},{key:'B',text:'人参、白术、茯苓、陈皮'},{key:'C',text:'党参、白术、茯苓、甘草'},{key:'D',text:'人参、苍术、茯苓、甘草'},{key:'E',text:'人参、白术、猪苓、甘草'}], answer: 'A', explanation: '四君子汤（《太平惠民和剂局方》）由人参、白术、茯苓、甘草组成。功效益气健脾。主治脾胃气虚证。', difficulty: 1, tag: '高频', freq: 5 },
      ] : [
        { type: 'A1', subject: 'internal-medicine', stem: `（${exam.year}年真题）泄泻的主要病机是`, options: [{key:'A',text:'脾虚湿盛'},{key:'B',text:'肝气乘脾'},{key:'C',text:'肾阳虚衰'},{key:'D',text:'食滞肠胃'},{key:'E',text:'外邪侵袭'}], answer: 'A', explanation: '泄泻的主要病机是脾虚湿盛。脾虚则运化失职，湿盛则水湿下注，合而为泄泻。', difficulty: 2, tag: '高频', freq: 4 },
        { type: 'A1', subject: 'acupuncture', stem: `（${exam.year}年真题）合谷穴的定位是`, options: [{key:'A',text:'手背第1、2掌骨间，第2掌骨桡侧中点'},{key:'B',text:'手背第2、3掌骨间'},{key:'C',text:'腕背横纹上2寸'},{key:'D',text:'拇指桡侧指甲角旁0.1寸'},{key:'E',text:'手背第4、5掌骨间'}], answer: 'A', explanation: '合谷穴属手阳明大肠经，定位：在手背，第1、2掌骨之间，当第2掌骨桡侧的中点处。为"面口合谷收"的代表穴位。', difficulty: 1, tag: '高频', freq: 5 },
        { type: 'A1', subject: 'western-medicine', stem: `（${exam.year}年真题）传染病流行的基本条件是`, options: [{key:'A',text:'传染源、传播途径、易感人群'},{key:'B',text:'病原体、传染源、传播途径'},{key:'C',text:'病原体、传染源、易感人群'},{key:'D',text:'传染源、传播媒介、易感人群'},{key:'E',text:'病原体、传染源、自然环境'}], answer: 'A', explanation: '传染病流行的三个基本条件是传染源、传播途径和易感人群。病原体是引起传染病的因子，但不是流行条件。', difficulty: 2, tag: '重点', freq: 3 },
      ]

      await knex('past_exam_questions').insert(sampleQs.map((q, i) => ({
        id: qid(eid('pe', exam.year, unit), i + 1),
        exam_id: eid('pe', exam.year, unit),
        type: q.type,
        subject_id: q.subject,
        question_stem: q.stem,
        options: JSON.stringify(q.options),
        correct_answer: q.answer,
        explanation: q.explanation,
        difficulty: q.difficulty,
        key_point_tag: q.tag,
        exam_frequency: q.freq,
        sort_order: i + 1,
      })))
    }
  }
}
