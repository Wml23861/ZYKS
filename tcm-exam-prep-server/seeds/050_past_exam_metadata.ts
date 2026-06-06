import { Knex } from 'knex'

export async function seed(knex: Knex): Promise<void> {
  await knex('past_exam_questions').del()
  await knex('past_exams').del()

  // 2020-2024, 每年4单元
  const years = [2024, 2023, 2022, 2021, 2020]
  const exams: {
    id: string; year: number; unit: number; total_questions: number; time_limit: number
    summary: string; key_points: string; source: string; created_at: number
  }[] = []

  for (const year of years) {
    for (let unit = 1; unit <= 4; unit++) {
      exams.push({
        id: `exam-${year}-unit${unit}`,
        year,
        unit,
        total_questions: 150,
        time_limit: 150,
        summary: `${year}年中医执业医师资格考试第${unit}单元真题`,
        key_points: getUnitKeyPoints(unit),
        source: '考生回忆版+医学教育网整理',
        created_at: Date.now(),
      })
    }
  }

  await knex('past_exams').insert(exams)

  // 将 questions 表中带真题标签的题目关联到 past_exam_questions
  const examQuestions = await knex('questions')
    .where('tags_json', 'like', '%真题%')
    .orderBy('id')

  const examQs: {
    id: string; exam_id: string; type: string; subject_id: string
    question_stem: string; options: string; correct_answer: string
    explanation: string; difficulty: number; key_point_tag: string
    exam_frequency: number; sort_order: number
  }[] = []

  let idx = 0
  for (const q of examQuestions) {
    // 按ID前缀分配单元: q-yr1→unit1, q-yr2→unit2, etc
    let unit = 1
    if (q.id.startsWith('q-yr2')) unit = 2
    else if (q.id.startsWith('q-yr3')) unit = 3
    else if (q.id.startsWith('q-yr4')) unit = 4

    // 每个单元分配到一个年份
    const yearIdx = (unit - 1) % 5
    const year = years[yearIdx]

    examQs.push({
      id: `pq-${q.id}`,
      exam_id: `exam-${year}-unit${unit}`,
      type: q.question_type,
      subject_id: q.subject_id,
      question_stem: q.question_stem,
      options: q.options_json,
      correct_answer: q.correct_answer,
      explanation: q.explanation,
      difficulty: q.difficulty,
      key_point_tag: extractKeyPoint(q.tags_json, q.subject_id),
      exam_frequency: 1,
      sort_order: idx++,
    })
  }

  if (examQs.length > 0) {
    const batchSize = 50
    for (let i = 0; i < examQs.length; i += batchSize) {
      await knex('past_exam_questions').insert(examQs.slice(i, i + batchSize))
    }
  }

  console.log(`[Seed 050] ${examQuestions.length} past exam questions linked to ${exams.length} exams`)
}

function getUnitKeyPoints(unit: number): string {
  const map: Record<number, string> = {
    1: '中医基础理论,中医诊断学,中药学,方剂学',
    2: '中医内科学,针灸学',
    3: '中医外科学,中医妇科学,中医儿科学',
    4: '内科学,诊断学基础,传染病学,医学伦理学,卫生法规',
  }
  return map[unit] || ''
}

function extractKeyPoint(tagsJson: string, subjectId: string): string {
  try {
    const tags = JSON.parse(tagsJson)
    return tags[0] || subjectId
  } catch {
    return subjectId
  }
}
