import { Knex } from 'knex'

export async function seed(knex: Knex): Promise<void> {
  await knex('flashcards').del()

  const now = Date.now()
  await knex('flashcards').insert([
    // 中医基础理论 (5)
    { id: 'fc-zhongji-001', subject_id: 'zhongji', chapter_id: 'ch-zhongji-02', knowledge_point_ids_json: '[]', front_content: '阴阳学说的基本内容包括哪些？', back_content: '1. 阴阳对立制约\n2. 阴阳互根互用\n3. 阴阳消长平衡\n4. 阴阳相互转化\n5. 阴阳交感与互藏', mnemonic: '口诀："对立互根消长转，交感互藏共五端"', category: 'definition', tags_json: '["阴阳学说","基础理论"]', created_at: now, is_system: 1 },
    { id: 'fc-zhongji-002', subject_id: 'zhongji', chapter_id: 'ch-zhongji-02', knowledge_point_ids_json: '[]', front_content: '五行相生、相克的次序分别是什么？', back_content: '相生：木→火→土→金→水→木\n相克：木→土→水→火→金→木', mnemonic: '以手掌记：五指代表五行，拇指为木，食指为火，中指为土，无名指为金，小指为水', category: 'definition', tags_json: '["五行学说","相生相克"]', created_at: now, is_system: 1 },
    { id: 'fc-zhongji-003', subject_id: 'zhongji', chapter_id: 'ch-zhongji-02', knowledge_point_ids_json: '[]', front_content: '什么是藏象？五脏、六腑、奇恒之腑分别包括哪些？', back_content: '五脏（藏精气而不泻）：心、肝、脾、肺、肾\n六腑（传化物而不藏）：胆、胃、小肠、大肠、膀胱、三焦\n奇恒之腑：脑、髓、骨、脉、胆、女子胞', mnemonic: '五脏："心肝脾肺肾"；六腑："胆小胃大膀三"', category: 'definition', tags_json: '["藏象","脏腑"]', created_at: now, is_system: 1 },
    { id: 'fc-zhongji-004', subject_id: 'zhongji', chapter_id: 'ch-zhongji-02', knowledge_point_ids_json: '[]', front_content: '人体之气的功能有哪些？', back_content: '1. 推动作用\n2. 温煦作用\n3. 防御作用\n4. 固摄作用\n5. 气化作用', mnemonic: '记"推温防固气"五字诀', category: 'definition', tags_json: '["精气血津液","气"]', created_at: now, is_system: 1 },
    { id: 'fc-zhongji-005', subject_id: 'zhongji', chapter_id: 'ch-zhongji-02', knowledge_point_ids_json: '[]', front_content: '六淫邪气各自的致病特点是什么？', back_content: '风：善行数变、百病之长\n寒：凝滞收引、伤阳气\n暑：炎热升散、多挟湿\n湿：重浊黏滞、趋下\n燥：干涩、易伤肺\n火：炎上、生风动血、致肿疡', mnemonic: '风善行寒凝滞，暑升散湿黏滞，燥干涩火炎上', category: 'definition', tags_json: '["病因","六淫"]', created_at: now, is_system: 1 },
    // 中医诊断学 (3)
    { id: 'fc-zhenjuan-001', subject_id: 'zhenjuan', chapter_id: 'ch-zhenjuan-01', knowledge_point_ids_json: '[]', front_content: '望诊主要包括哪些内容？', back_content: '1. 望神（得神/失神/假神）\n2. 望色（青赤黄白黑）\n3. 望形态\n4. 望头颈五官\n5. 望皮肤\n6. 望舌（舌质+舌苔）\n7. 望排出物', mnemonic: '神色形态从头望，皮肤舌象排出详。五色：青痛赤热黄湿虚，白寒黑水肾精亏', category: 'diagnosis', tags_json: '["望诊","四诊"]', created_at: now, is_system: 1 },
    { id: 'fc-zhenjuan-002', subject_id: 'zhenjuan', chapter_id: 'ch-zhenjuan-04', knowledge_point_ids_json: '[]', front_content: '常见脉象及其主病有哪些？', back_content: '浮脉→表证；沉脉→里证\n迟脉→寒证；数脉→热证\n虚脉→虚证；实脉→实证\n滑脉→痰饮、食滞、实热\n涩脉→气滞血瘀、精伤血少\n弦脉→肝胆病、痛证、痰饮\n细脉→气血两虚、湿证', mnemonic: '浮主表证沉主里，迟寒数热虚无力。滑痰实食涩血瘀，弦主肝胆细血虚', category: 'diagnosis', tags_json: '["脉诊","四诊合参"]', created_at: now, is_system: 1 },
    { id: 'fc-zhenjuan-003', subject_id: 'zhenjuan', chapter_id: 'ch-zhenjuan-05', knowledge_point_ids_json: '[]', front_content: '八纲辨证的内容及辨证要点是什么？', back_content: '表里（病位）、寒热（病性）、虚实（邪正盛衰）、阴阳（总纲）\n\n阴证=里+寒+虚；阳证=表+热+实', mnemonic: '表里定病位，寒热辨病性，虚实察盛衰，阴阳为总纲', category: 'diagnosis', tags_json: '["八纲辨证","辨证"]', created_at: now, is_system: 1 },
    // 中药学 (4)
    { id: 'fc-zhongyao-001', subject_id: 'zhongyao', chapter_id: 'ch-zhongyao-02', knowledge_point_ids_json: '[]', front_content: '中药"四气五味"的含义是什么？', back_content: '四气：寒、热、温、凉（+平性）\n\n五味作用：\n辛→发散、行气、行血\n甘→补益、和中、缓急\n酸→收敛、固涩\n苦→泄热、燥湿、坚阴\n咸→软坚散结、泻下\n淡→渗湿利水（附于甘）\n涩→收敛固涩（附于酸）', mnemonic: '辛散甘补酸收敛，苦泄咸软淡渗利', category: 'herb', tags_json: '["中药性能","四气五味"]', created_at: now, is_system: 1 },
    { id: 'fc-zhongyao-002', subject_id: 'zhongyao', chapter_id: 'ch-zhongyao-02', knowledge_point_ids_json: '[]', front_content: '什么是归经？举例说明。', back_content: '归经：药物对某脏腑经络的选择性治疗作用。\n\n麻黄→肺、膀胱经\n柴胡→肝、胆、肺经\n黄连→心、肝、胃、大肠经\n大黄→大肠、脾、胃、肝经', mnemonic: '看功效→定脏腑→归其经。杏仁止咳平喘→肺经；大黄泻下→大肠经', category: 'herb', tags_json: '["中药性能","归经"]', created_at: now, is_system: 1 },
    { id: 'fc-zhongyao-003', subject_id: 'zhongyao', chapter_id: 'ch-zhongyao-02', knowledge_point_ids_json: '[]', front_content: '中药"十八反"的内容是什么？', back_content: '乌头（川乌、草乌、附子）反半夏、瓜蒌、贝母、白蔹、白及\n甘草反海藻、大戟、甘遂、芫花\n藜芦反人参、沙参、丹参、玄参、苦参、细辛、芍药\n\n歌诀：本草明言十八反，半萎贝蔹及攻乌。藻戟遂芫俱战草，诸参辛芍叛藜芦。', mnemonic: '乌攻半萎贝蔹及，草战藻戟遂芫，藜芦叛参辛芍', category: 'herb', tags_json: '["配伍禁忌","十八反"]', created_at: now, is_system: 1 },
    { id: 'fc-zhongyao-004', subject_id: 'zhongyao', chapter_id: 'ch-zhongyao-02', knowledge_point_ids_json: '[]', front_content: '中药"十九畏"的内容是什么？', back_content: '硫黄畏朴硝，水银畏砒霜\n狼毒畏密陀僧，巴豆畏牵牛\n丁香畏郁金，牙硝畏三棱\n川乌草乌畏犀角，人参畏五灵脂\n官桂畏赤石脂\n\n共九组十九味药物', mnemonic: '分组记忆：硫朴、水砒、狼密、巴牵、丁郁、牙棱、乌犀、参脂、官石', category: 'herb', tags_json: '["配伍禁忌","十九畏"]', created_at: now, is_system: 1 },
    // 方剂学 (3)
    { id: 'fc-fangji-001', subject_id: 'fangji', chapter_id: 'ch-fangji-01', knowledge_point_ids_json: '[]', front_content: '方剂的组成原则"君臣佐使"各自的作用是什么？', back_content: '君药：针对主病/主证起主要治疗作用（不可缺）\n臣药：辅助君药、治疗兼证\n佐药：佐助、佐制、反佐\n使药：引经、调和', mnemonic: '君主病，臣辅助，佐助制反，使引调', category: 'formula', tags_json: '["方剂组成","君臣佐使"]', created_at: now, is_system: 1 },
    { id: 'fc-fangji-002', subject_id: 'fangji', chapter_id: 'ch-fangji-02', knowledge_point_ids_json: '[]', front_content: '麻黄汤的组成、功效、主治及方解是什么？', back_content: '组成：麻黄9g、桂枝6g、杏仁9g、炙甘草3g\n功效：发汗解表，宣肺平喘\n主治：外感风寒表实证（恶寒发热、无汗而喘、脉浮紧）\n方解：君-麻黄、臣-桂枝、佐-杏仁、使-炙甘草', mnemonic: '麻黄汤中用桂枝，杏仁甘草四般施，发热恶寒头项痛，无汗而喘服之宜', category: 'formula', tags_json: '["解表剂","麻黄汤"]', created_at: now, is_system: 1 },
    { id: 'fc-fangji-003', subject_id: 'fangji', chapter_id: 'ch-fangji-02', knowledge_point_ids_json: '[]', front_content: '桂枝汤的组成、功效、主治及方解是什么？', back_content: '组成：桂枝9g、芍药9g、生姜9g、大枣3枚、炙甘草6g\n功效：解肌发表，调和营卫\n主治：外感风寒表虚证（发热恶风、汗出、脉浮缓）\n方解：君-桂枝、臣-芍药（一散一收，调和营卫）', mnemonic: '桂枝汤治太阳风，芍药甘草姜枣同，解肌发表调营卫，表虚有汗此为功', category: 'formula', tags_json: '["解表剂","桂枝汤"]', created_at: now, is_system: 1 },
  ])

  console.log('[Seed 004] 15张记忆卡片已导入')
}
