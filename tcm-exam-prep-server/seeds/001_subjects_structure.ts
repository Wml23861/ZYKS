import { Knex } from 'knex'

export async function seed(knex: Knex): Promise<void> {
  // 清空数据（按外键依赖顺序）
  await knex('knowledge_points').del()
  await knex('sections').del()
  await knex('chapters').del()
  await knex('subjects').del()

  // === 科目 ===
  await knex('subjects').insert([
    { id: 'zhongji', name: '中医基础理论', short_name: '中基', icon: 'Reading', description: '含中医经典著作内容，是中医学习的理论基础和入门科目', exam_weight: 5, total_chapters: 10, total_questions: 0, color: '#8B2500', sort_order: 1 },
    { id: 'zhenjuan', name: '中医诊断学', short_name: '中诊', icon: 'View', description: '涵盖望闻问切四诊方法及八纲辨证、脏腑辨证等', exam_weight: 5, total_chapters: 8, total_questions: 0, color: '#C0392B', sort_order: 2 },
    { id: 'zhongyao', name: '中药学', short_name: '中药', icon: 'DishDot', description: '系统学习常用中药的性味归经、功效主治、用法用量', exam_weight: 5, total_chapters: 12, total_questions: 0, color: '#B8860B', sort_order: 3 },
    { id: 'fangji', name: '方剂学', short_name: '方剂', icon: 'Document', description: '学习方剂的组成原则、分类及常用方剂的组成与运用', exam_weight: 5, total_chapters: 10, total_questions: 0, color: '#D4A030', sort_order: 4 },
    { id: 'neike', name: '内科学', short_name: '内科', icon: 'FirstAidKit', description: '西医内科常见疾病的诊断与治疗基础', exam_weight: 5, total_chapters: 8, total_questions: 0, color: '#4A7C96', sort_order: 5 },
    { id: 'zhenduan', name: '诊断学基础', short_name: '诊基', icon: 'Management', description: '西医诊断学基础，包含体格检查及辅助检查等', exam_weight: 5, total_chapters: 6, total_questions: 0, color: '#2E5E4E', sort_order: 6 },
    { id: 'lunli', name: '医学伦理学', short_name: '伦理', icon: 'UserFilled', description: '医师职业道德规范、医患关系伦理等', exam_weight: 5, total_chapters: 4, total_questions: 0, color: '#6DBF9E', sort_order: 7 },
    { id: 'chuanran', name: '传染病学', short_name: '传染病', icon: 'WarningFilled', description: '常见传染病的病原学、流行病学、临床表现及防治', exam_weight: 5, total_chapters: 6, total_questions: 0, color: '#E4826E', sort_order: 8 },
    { id: 'fagui', name: '卫生法规', short_name: '法规', icon: 'Files', description: '医疗卫生相关法律法规知识', exam_weight: 5, total_chapters: 4, total_questions: 0, color: '#5C1A00', sort_order: 9 },
    { id: 'zhongnei', name: '中医内科学', short_name: '中内', icon: 'OfficeBuilding', description: '中医内科常见病证的辨证论治', exam_weight: 5, total_chapters: 10, total_questions: 0, color: '#8B6508', sort_order: 10 },
    { id: 'zhongwai', name: '中医外科学', short_name: '中外', icon: 'Scissor', description: '中医外科疮疡、皮肤病、肛门直肠疾病等', exam_weight: 5, total_chapters: 8, total_questions: 0, color: '#1B3A2F', sort_order: 11 },
    { id: 'zhongfu', name: '中医妇科学', short_name: '中妇', icon: 'Female', description: '中医妇科经、带、胎、产等疾病辨证论治', exam_weight: 5, total_chapters: 8, total_questions: 0, color: '#C0392B', sort_order: 12 },
    { id: 'zhonger', name: '中医儿科学', short_name: '中儿', icon: 'Child', description: '中医儿科常见病证的辨证论治及小儿生理病理特点', exam_weight: 5, total_chapters: 6, total_questions: 0, color: '#E8C980', sort_order: 13 },
    { id: 'zhenjiu', name: '针灸学', short_name: '针灸', icon: 'Aim', description: '经络腧穴、刺灸法及针灸治疗各科疾病', exam_weight: 5, total_chapters: 8, total_questions: 0, color: '#2E5E4E', sort_order: 14 },
  ])

  // === 章节 (106个) ===
  await knex('chapters').insert([
    // 中医基础理论 — 10章
    { id: 'ch-zhongji-01', subject_id: 'zhongji', title: '绪论', description: '中医学理论体系的基本概念、形成与发展、基本特点及主要思维方式', sort_order: 1, section_count: 4, knowledge_point_count: 8 },
    { id: 'ch-zhongji-02', subject_id: 'zhongji', title: '哲学基础', description: '气一元论、阴阳学说——中医学的哲学基础与思维方法', sort_order: 2, section_count: 5, knowledge_point_count: 12 },
    { id: 'ch-zhongji-03', subject_id: 'zhongji', title: '五行学说', description: '五行的基本概念、基本内容及在中医学中的应用', sort_order: 3, section_count: 3, knowledge_point_count: 7 },
    { id: 'ch-zhongji-04', subject_id: 'zhongji', title: '藏象', description: '五脏、六腑、奇恒之腑的生理功能及相互关系', sort_order: 4, section_count: 5, knowledge_point_count: 12 },
    { id: 'ch-zhongji-05', subject_id: 'zhongji', title: '精气血津液', description: '精、气、血、津液的概念、生成、功能及相互关系', sort_order: 5, section_count: 5, knowledge_point_count: 10 },
    { id: 'ch-zhongji-06', subject_id: 'zhongji', title: '经络', description: '十二经脉、奇经八脉的循行分布规律及生理功能', sort_order: 6, section_count: 3, knowledge_point_count: 7 },
    { id: 'ch-zhongji-07', subject_id: 'zhongji', title: '体质', description: '体质的概念、形成因素、分类及与疾病的关系', sort_order: 7, section_count: 2, knowledge_point_count: 4 },
    { id: 'ch-zhongji-08', subject_id: 'zhongji', title: '病因', description: '六淫、七情、饮食劳逸、痰饮瘀血等致病因素', sort_order: 8, section_count: 4, knowledge_point_count: 8 },
    { id: 'ch-zhongji-09', subject_id: 'zhongji', title: '病机', description: '疾病发生、发展与变化的基本机制', sort_order: 9, section_count: 4, knowledge_point_count: 8 },
    { id: 'ch-zhongji-10', subject_id: 'zhongji', title: '防治原则', description: '中医预防与治疗疾病的基本原则', sort_order: 10, section_count: 3, knowledge_point_count: 6 },
    // 中医诊断学 — 8章
    { id: 'ch-zhenjuan-01', subject_id: 'zhenjuan', title: '望诊', description: '望神、望色、望形态、望舌等望诊方法', sort_order: 1, section_count: 5, knowledge_point_count: 10 },
    { id: 'ch-zhenjuan-02', subject_id: 'zhenjuan', title: '闻诊', description: '听声音和嗅气味以诊察疾病', sort_order: 2, section_count: 3, knowledge_point_count: 5 },
    { id: 'ch-zhenjuan-03', subject_id: 'zhenjuan', title: '问诊', description: '问寒热、汗出、疼痛、饮食、二便、睡眠等', sort_order: 3, section_count: 5, knowledge_point_count: 10 },
    { id: 'ch-zhenjuan-04', subject_id: 'zhenjuan', title: '切诊', description: '脉诊和按诊的方法、常见脉象及临床意义', sort_order: 4, section_count: 3, knowledge_point_count: 8 },
    { id: 'ch-zhenjuan-05', subject_id: 'zhenjuan', title: '八纲辨证', description: '表里、寒热、虚实、阴阳辨证', sort_order: 5, section_count: 4, knowledge_point_count: 8 },
    { id: 'ch-zhenjuan-06', subject_id: 'zhenjuan', title: '脏腑辨证', description: '五脏六腑病证的辨证方法', sort_order: 6, section_count: 5, knowledge_point_count: 12 },
    { id: 'ch-zhenjuan-07', subject_id: 'zhenjuan', title: '气血津液辨证', description: '气病、血病、气血同病及津液病辨证', sort_order: 7, section_count: 3, knowledge_point_count: 6 },
    { id: 'ch-zhenjuan-08', subject_id: 'zhenjuan', title: '其他辨证方法', description: '六经辨证、卫气营血辨证、三焦辨证', sort_order: 8, section_count: 3, knowledge_point_count: 6 },
    // 中药学 — 12章
    { id: 'ch-zhongyao-01', subject_id: 'zhongyao', title: '中药学总论', description: '中药的品种、产地、采集、炮制', sort_order: 1, section_count: 2, knowledge_point_count: 4 },
    { id: 'ch-zhongyao-02', subject_id: 'zhongyao', title: '中药的性能', description: '四气五味、升降浮沉、归经、毒性', sort_order: 2, section_count: 2, knowledge_point_count: 6 },
    { id: 'ch-zhongyao-03', subject_id: 'zhongyao', title: '解表药', description: '辛温解表药与辛凉解表药', sort_order: 3, section_count: 2, knowledge_point_count: 8 },
    { id: 'ch-zhongyao-04', subject_id: 'zhongyao', title: '清热药', description: '清热泻火、清热燥湿、清热解毒、清热凉血、清虚热', sort_order: 4, section_count: 2, knowledge_point_count: 8 },
    { id: 'ch-zhongyao-05', subject_id: 'zhongyao', title: '泻下药与祛风湿药', description: '攻下、润下、峻下逐水药及祛风湿药', sort_order: 5, section_count: 2, knowledge_point_count: 6 },
    { id: 'ch-zhongyao-06', subject_id: 'zhongyao', title: '化湿药与利水渗湿药', description: '芳香化湿药与利水渗湿药', sort_order: 6, section_count: 2, knowledge_point_count: 6 },
    { id: 'ch-zhongyao-07', subject_id: 'zhongyao', title: '温里药与理气药', description: '温里祛寒药与行气理气药', sort_order: 7, section_count: 2, knowledge_point_count: 6 },
    { id: 'ch-zhongyao-08', subject_id: 'zhongyao', title: '消食药与驱虫药', description: '消食导滞药与驱虫药', sort_order: 8, section_count: 2, knowledge_point_count: 4 },
    { id: 'ch-zhongyao-09', subject_id: 'zhongyao', title: '止血药与活血化瘀药', description: '止血、活血、破血逐瘀药', sort_order: 9, section_count: 2, knowledge_point_count: 6 },
    { id: 'ch-zhongyao-10', subject_id: 'zhongyao', title: '化痰止咳平喘药', description: '温化寒痰、清化热痰、止咳平喘药', sort_order: 10, section_count: 2, knowledge_point_count: 5 },
    { id: 'ch-zhongyao-11', subject_id: 'zhongyao', title: '安神药与平肝息风药', description: '重镇安神、养心安神及平肝息风药', sort_order: 11, section_count: 2, knowledge_point_count: 5 },
    { id: 'ch-zhongyao-12', subject_id: 'zhongyao', title: '补虚药与收涩药', description: '补气、补血、补阴、补阳药及收涩药', sort_order: 12, section_count: 2, knowledge_point_count: 8 },
    // 方剂学 — 10章
    { id: 'ch-fangji-01', subject_id: 'fangji', title: '方剂学总论', description: '方剂的组成与变化、剂型与用法', sort_order: 1, section_count: 2, knowledge_point_count: 5 },
    { id: 'ch-fangji-02', subject_id: 'fangji', title: '解表剂', description: '辛温解表剂与辛凉解表剂', sort_order: 2, section_count: 2, knowledge_point_count: 6 },
    { id: 'ch-fangji-03', subject_id: 'fangji', title: '泻下剂与和解剂', description: '寒下、温下、润下及和解少阳、调和肝脾', sort_order: 3, section_count: 2, knowledge_point_count: 5 },
    { id: 'ch-fangji-04', subject_id: 'fangji', title: '清热剂', description: '清气分热、清营凉血、清热解毒、清脏腑热', sort_order: 4, section_count: 2, knowledge_point_count: 6 },
    { id: 'ch-fangji-05', subject_id: 'fangji', title: '温里剂与补益剂', description: '温中祛寒、回阳救逆及补气、补血、补阴、补阳剂', sort_order: 5, section_count: 2, knowledge_point_count: 8 },
    { id: 'ch-fangji-06', subject_id: 'fangji', title: '固涩剂与安神剂', description: '固表止汗、固崩止带及重镇安神、养心安神剂', sort_order: 6, section_count: 2, knowledge_point_count: 5 },
    { id: 'ch-fangji-07', subject_id: 'fangji', title: '理气剂与理血剂', description: '行气、降气及活血祛瘀、止血剂', sort_order: 7, section_count: 2, knowledge_point_count: 5 },
    { id: 'ch-fangji-08', subject_id: 'fangji', title: '治风剂与治燥剂', description: '疏散外风、平息内风及轻宣外燥、滋润内燥剂', sort_order: 8, section_count: 2, knowledge_point_count: 5 },
    { id: 'ch-fangji-09', subject_id: 'fangji', title: '祛湿剂与祛痰剂', description: '燥湿和胃、清热祛湿、利水渗湿及化痰止咳平喘剂', sort_order: 9, section_count: 2, knowledge_point_count: 5 },
    { id: 'ch-fangji-10', subject_id: 'fangji', title: '消食剂与驱虫剂', description: '消食导滞、健脾消食及驱虫剂', sort_order: 10, section_count: 2, knowledge_point_count: 4 },
    // 内科学 — 8章
    { id: 'ch-neike-01', subject_id: 'neike', title: '呼吸系统疾病', description: '急慢性支气管炎、肺炎、支气管哮喘、COPD等', sort_order: 1, section_count: 2, knowledge_point_count: 6 },
    { id: 'ch-neike-02', subject_id: 'neike', title: '循环系统疾病', description: '心力衰竭、心律失常、高血压病、冠心病等', sort_order: 2, section_count: 2, knowledge_point_count: 6 },
    { id: 'ch-neike-03', subject_id: 'neike', title: '消化系统疾病', description: '胃炎、消化性溃疡、肝硬化、急性胰腺炎等', sort_order: 3, section_count: 2, knowledge_point_count: 6 },
    { id: 'ch-neike-04', subject_id: 'neike', title: '泌尿系统疾病', description: '肾小球肾炎、肾病综合征、尿路感染、慢性肾衰竭等', sort_order: 4, section_count: 2, knowledge_point_count: 5 },
    { id: 'ch-neike-05', subject_id: 'neike', title: '血液系统疾病', description: '贫血、白血病、血小板减少性紫癜等', sort_order: 5, section_count: 2, knowledge_point_count: 5 },
    { id: 'ch-neike-06', subject_id: 'neike', title: '内分泌与代谢疾病', description: '甲状腺疾病、糖尿病、血脂异常等', sort_order: 6, section_count: 2, knowledge_point_count: 5 },
    { id: 'ch-neike-07', subject_id: 'neike', title: '风湿性疾病', description: '类风湿关节炎、系统性红斑狼疮等', sort_order: 7, section_count: 2, knowledge_point_count: 4 },
    { id: 'ch-neike-08', subject_id: 'neike', title: '神经系统疾病', description: '脑血管疾病、癫痫、帕金森病等', sort_order: 8, section_count: 2, knowledge_point_count: 5 },
    // 诊断学基础 — 6章
    { id: 'ch-zhenduan-01', subject_id: 'zhenduan', title: '常见症状', description: '发热、疼痛、呼吸困难、咳嗽咳痰、咯血等', sort_order: 1, section_count: 2, knowledge_point_count: 6 },
    { id: 'ch-zhenduan-02', subject_id: 'zhenduan', title: '体格检查（一）', description: '一般检查、头颈部检查、胸部检查', sort_order: 2, section_count: 2, knowledge_point_count: 6 },
    { id: 'ch-zhenduan-03', subject_id: 'zhenduan', title: '体格检查（二）', description: '腹部检查、脊柱四肢检查、神经系统检查', sort_order: 3, section_count: 2, knowledge_point_count: 6 },
    { id: 'ch-zhenduan-04', subject_id: 'zhenduan', title: '实验室检查', description: '血液检查、尿液检查、粪便检查、生化检查', sort_order: 4, section_count: 2, knowledge_point_count: 6 },
    { id: 'ch-zhenduan-05', subject_id: 'zhenduan', title: '心电图检查', description: '正常心电图与常见异常心电图', sort_order: 5, section_count: 2, knowledge_point_count: 5 },
    { id: 'ch-zhenduan-06', subject_id: 'zhenduan', title: '影像学检查', description: 'X线、CT、超声等影像学基础', sort_order: 6, section_count: 2, knowledge_point_count: 4 },
    // 医学伦理学 — 4章
    { id: 'ch-lunli-01', subject_id: 'lunli', title: '医学伦理学概论', description: '伦理学基本概念、医学伦理学的发展', sort_order: 1, section_count: 2, knowledge_point_count: 4 },
    { id: 'ch-lunli-02', subject_id: 'lunli', title: '医患关系伦理', description: '医患关系的性质、模式、医患双方的道德权利与义务', sort_order: 2, section_count: 2, knowledge_point_count: 5 },
    { id: 'ch-lunli-03', subject_id: 'lunli', title: '临床诊疗伦理', description: '临床诊断、治疗、急危重症救治中的伦理问题', sort_order: 3, section_count: 2, knowledge_point_count: 4 },
    { id: 'ch-lunli-04', subject_id: 'lunli', title: '医学科研与医学技术伦理', description: '医学科研伦理、人体实验伦理、器官移植伦理等', sort_order: 4, section_count: 2, knowledge_point_count: 5 },
    // 传染病学 — 6章
    { id: 'ch-chuanran-01', subject_id: 'chuanran', title: '传染病学总论', description: '感染与免疫、传染病的基本特征与临床特点', sort_order: 1, section_count: 2, knowledge_point_count: 5 },
    { id: 'ch-chuanran-02', subject_id: 'chuanran', title: '病毒性传染病', description: '病毒性肝炎、艾滋病、流行性感冒、麻疹等', sort_order: 2, section_count: 2, knowledge_point_count: 6 },
    { id: 'ch-chuanran-03', subject_id: 'chuanran', title: '细菌性传染病', description: '伤寒、细菌性痢疾、霍乱、流行性脑脊髓膜炎等', sort_order: 3, section_count: 2, knowledge_point_count: 6 },
    { id: 'ch-chuanran-04', subject_id: 'chuanran', title: '其他病原体感染', description: '钩端螺旋体病、疟疾、血吸虫病等', sort_order: 4, section_count: 2, knowledge_point_count: 5 },
    { id: 'ch-chuanran-05', subject_id: 'chuanran', title: '新发传染病', description: 'SARS、禽流感、COVID-19等新发传染病', sort_order: 5, section_count: 2, knowledge_point_count: 4 },
    { id: 'ch-chuanran-06', subject_id: 'chuanran', title: '传染病的预防与控制', description: '传染病防治法、预防接种、消毒隔离等', sort_order: 6, section_count: 2, knowledge_point_count: 4 },
    // 卫生法规 — 4章
    { id: 'ch-fagui-01', subject_id: 'fagui', title: '执业医师法律制度', description: '执业医师资格考试、执业注册、执业规则等', sort_order: 1, section_count: 2, knowledge_point_count: 5 },
    { id: 'ch-fagui-02', subject_id: 'fagui', title: '医疗机构管理法律制度', description: '医疗机构管理条例、医疗事故处理条例等', sort_order: 2, section_count: 2, knowledge_point_count: 5 },
    { id: 'ch-fagui-03', subject_id: 'fagui', title: '药品管理法律制度', description: '药品管理法、处方管理办法等', sort_order: 3, section_count: 2, knowledge_point_count: 4 },
    { id: 'ch-fagui-04', subject_id: 'fagui', title: '公共卫生法律制度', description: '传染病防治法、母婴保健法、献血法等', sort_order: 4, section_count: 2, knowledge_point_count: 4 },
    // 中医内科学 — 10章
    { id: 'ch-zhongnei-01', subject_id: 'zhongnei', title: '肺系病证', description: '感冒、咳嗽、哮病、喘证、肺痨、肺痈、肺胀', sort_order: 1, section_count: 2, knowledge_point_count: 7 },
    { id: 'ch-zhongnei-02', subject_id: 'zhongnei', title: '心系病证', description: '心悸、胸痹、不寐、癫狂、痫病、痴呆', sort_order: 2, section_count: 2, knowledge_point_count: 6 },
    { id: 'ch-zhongnei-03', subject_id: 'zhongnei', title: '脾胃病证', description: '胃痛、呕吐、呃逆、泄泻、便秘、腹痛', sort_order: 3, section_count: 2, knowledge_point_count: 6 },
    { id: 'ch-zhongnei-04', subject_id: 'zhongnei', title: '肝胆病证', description: '胁痛、黄疸、积聚、鼓胀、眩晕、头痛、中风', sort_order: 4, section_count: 2, knowledge_point_count: 7 },
    { id: 'ch-zhongnei-05', subject_id: 'zhongnei', title: '肾系病证', description: '水肿、淋证、癃闭、遗精、阳痿', sort_order: 5, section_count: 2, knowledge_point_count: 5 },
    { id: 'ch-zhongnei-06', subject_id: 'zhongnei', title: '气血津液病证', description: '郁证、血证、痰饮、消渴、自汗盗汗、内伤发热、虚劳', sort_order: 6, section_count: 2, knowledge_point_count: 7 },
    { id: 'ch-zhongnei-07', subject_id: 'zhongnei', title: '肢体经络病证', description: '痹证、痿证、腰痛、痉证', sort_order: 7, section_count: 2, knowledge_point_count: 4 },
    { id: 'ch-zhongnei-08', subject_id: 'zhongnei', title: '外感病证', description: '湿阻、疟疾、痢疾、霍乱', sort_order: 8, section_count: 2, knowledge_point_count: 4 },
    { id: 'ch-zhongnei-09', subject_id: 'zhongnei', title: '癌症辨证论治', description: '肺癌、肝癌、胃癌、肠癌等的中医辨证论治', sort_order: 9, section_count: 2, knowledge_point_count: 4 },
    { id: 'ch-zhongnei-10', subject_id: 'zhongnei', title: '中医内科急症', description: '高热、神昏、厥证、脱证等急症的辨证论治', sort_order: 10, section_count: 2, knowledge_point_count: 4 },
    // 中医外科学 — 8章
    { id: 'ch-zhongwai-01', subject_id: 'zhongwai', title: '中医外科学总论', description: '外科疾病病因病机、辨证、治法', sort_order: 1, section_count: 2, knowledge_point_count: 4 },
    { id: 'ch-zhongwai-02', subject_id: 'zhongwai', title: '疮疡', description: '痈、疽、疔、疖、有头疽、丹毒等', sort_order: 2, section_count: 2, knowledge_point_count: 5 },
    { id: 'ch-zhongwai-03', subject_id: 'zhongwai', title: '乳房疾病', description: '乳痈、乳癖、乳核、乳岩等', sort_order: 3, section_count: 2, knowledge_point_count: 4 },
    { id: 'ch-zhongwai-04', subject_id: 'zhongwai', title: '瘿与瘤', description: '气瘿、肉瘿、瘿痈、血瘤、肉瘤等', sort_order: 4, section_count: 2, knowledge_point_count: 4 },
    { id: 'ch-zhongwai-05', subject_id: 'zhongwai', title: '皮肤病', description: '湿疹、瘾疹、牛皮癣、蛇串疮、粉刺等', sort_order: 5, section_count: 2, knowledge_point_count: 5 },
    { id: 'ch-zhongwai-06', subject_id: 'zhongwai', title: '肛门直肠疾病', description: '痔、肛裂、肛漏、脱肛等', sort_order: 6, section_count: 2, knowledge_point_count: 4 },
    { id: 'ch-zhongwai-07', subject_id: 'zhongwai', title: '男性前阴病', description: '子痈、精浊、血精、阳强等', sort_order: 7, section_count: 2, knowledge_point_count: 4 },
    { id: 'ch-zhongwai-08', subject_id: 'zhongwai', title: '周围血管疾病与外伤', description: '脱疽、臁疮、冻疮、烧烫伤、毒蛇咬伤等', sort_order: 8, section_count: 2, knowledge_point_count: 5 },
    // 中医妇科学 — 8章
    { id: 'ch-zhongfu-01', subject_id: 'zhongfu', title: '中医妇科学总论', description: '女性生理特点、妇科病因病机、治法概要', sort_order: 1, section_count: 2, knowledge_point_count: 5 },
    { id: 'ch-zhongfu-02', subject_id: 'zhongfu', title: '月经病', description: '月经不调、痛经、闭经、崩漏、经行前后诸证', sort_order: 2, section_count: 2, knowledge_point_count: 6 },
    { id: 'ch-zhongfu-03', subject_id: 'zhongfu', title: '带下病', description: '带下过多、带下过少', sort_order: 3, section_count: 2, knowledge_point_count: 3 },
    { id: 'ch-zhongfu-04', subject_id: 'zhongfu', title: '妊娠病', description: '恶阻、胎漏、胎动不安、子肿、子痫等', sort_order: 4, section_count: 2, knowledge_point_count: 5 },
    { id: 'ch-zhongfu-05', subject_id: 'zhongfu', title: '产后病', description: '产后恶露不绝、产后发热、产后身痛、缺乳等', sort_order: 5, section_count: 2, knowledge_point_count: 5 },
    { id: 'ch-zhongfu-06', subject_id: 'zhongfu', title: '妇科杂病', description: '不孕症、癥瘕、盆腔炎性疾病等', sort_order: 6, section_count: 2, knowledge_point_count: 4 },
    { id: 'ch-zhongfu-07', subject_id: 'zhongfu', title: '计划生育', description: '避孕、绝育、人工流产等', sort_order: 7, section_count: 2, knowledge_point_count: 3 },
    { id: 'ch-zhongfu-08', subject_id: 'zhongfu', title: '妇科常用方药', description: '妇科常用方剂的组成与运用', sort_order: 8, section_count: 2, knowledge_point_count: 4 },
    // 中医儿科学 — 6章
    { id: 'ch-zhonger-01', subject_id: 'zhonger', title: '中医儿科学总论', description: '小儿生理病理特点、四诊要点、治法用药特点', sort_order: 1, section_count: 2, knowledge_point_count: 5 },
    { id: 'ch-zhonger-02', subject_id: 'zhonger', title: '新生儿疾病与肺系病证', description: '胎黄、感冒、咳嗽、肺炎喘嗽、哮喘', sort_order: 2, section_count: 2, knowledge_point_count: 5 },
    { id: 'ch-zhonger-03', subject_id: 'zhonger', title: '脾胃病证', description: '鹅口疮、口疮、呕吐、腹泻、疳证、积滞', sort_order: 3, section_count: 2, knowledge_point_count: 6 },
    { id: 'ch-zhonger-04', subject_id: 'zhonger', title: '心肝病证', description: '惊风、痫证、夜啼、心悸', sort_order: 4, section_count: 2, knowledge_point_count: 4 },
    { id: 'ch-zhonger-05', subject_id: 'zhonger', title: '肾系病证', description: '水肿、遗尿、五迟五软、性早熟', sort_order: 5, section_count: 2, knowledge_point_count: 4 },
    { id: 'ch-zhonger-06', subject_id: 'zhonger', title: '传染病与时行疾病', description: '麻疹、风疹、水痘、痄腮、手足口病', sort_order: 6, section_count: 2, knowledge_point_count: 5 },
    // 针灸学 — 8章
    { id: 'ch-zhenjiu-01', subject_id: 'zhenjiu', title: '经络总论', description: '经络系统的组成、十二经脉的循行与交接规律', sort_order: 1, section_count: 2, knowledge_point_count: 6 },
    { id: 'ch-zhenjiu-02', subject_id: 'zhenjiu', title: '腧穴总论', description: '腧穴的分类、命名、主治规律及特定穴', sort_order: 2, section_count: 2, knowledge_point_count: 5 },
    { id: 'ch-zhenjiu-03', subject_id: 'zhenjiu', title: '经络腧穴各论（一）', description: '手三阴经、手三阳经的循行与常用穴', sort_order: 3, section_count: 2, knowledge_point_count: 8 },
    { id: 'ch-zhenjiu-04', subject_id: 'zhenjiu', title: '经络腧穴各论（二）', description: '足三阴经、足三阳经的循行与常用穴', sort_order: 4, section_count: 2, knowledge_point_count: 8 },
    { id: 'ch-zhenjiu-05', subject_id: 'zhenjiu', title: '经络腧穴各论（三）', description: '任督二脉及经外奇穴', sort_order: 5, section_count: 2, knowledge_point_count: 5 },
    { id: 'ch-zhenjiu-06', subject_id: 'zhenjiu', title: '刺灸法', description: '毫针刺法、灸法、拔罐法及其他疗法', sort_order: 6, section_count: 2, knowledge_point_count: 6 },
    { id: 'ch-zhenjiu-07', subject_id: 'zhenjiu', title: '针灸治疗总论', description: '针灸治疗原则、配穴处方方法', sort_order: 7, section_count: 2, knowledge_point_count: 4 },
    { id: 'ch-zhenjiu-08', subject_id: 'zhenjiu', title: '针灸治疗各论', description: '各科常见病证的针灸治疗', sort_order: 8, section_count: 2, knowledge_point_count: 6 },
  ])

  console.log('[Seed 001] 14个科目、106个章节已导入')
}
