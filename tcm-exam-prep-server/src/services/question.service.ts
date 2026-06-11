import { getDb } from '../config/database.js'
import { parseJson } from '../utils/sqlite-json.js'

interface QuestionRow {
  id: string
  question_type: string
  is_group_root: number
  group_id: string | null
  subject_id: string
  chapter_id: string
  section_id: string
  knowledge_point_ids_json: string
  difficulty: number
  exam_years_json: string
  question_stem: string
  options_json: string
  shared_options_json: string | null
  correct_answer: string
  explanation: string
  tags_json: string
  order_in_group: number
}

interface Option {
  key: string
  text: string
}

function mapQuestion(row: QuestionRow) {
  return {
    id: row.id,
    type: row.question_type,
    isGroupRoot: row.is_group_root === 1,
    groupId: row.group_id,
    subjectId: row.subject_id,
    chapterId: row.chapter_id,
    sectionId: row.section_id,
    knowledgePointIds: parseJson<string[]>(row.knowledge_point_ids_json, []),
    difficulty: row.difficulty,
    examYears: parseJson<number[]>(row.exam_years_json, []),
    questionStem: row.question_stem,
    options: parseJson<Option[]>(row.options_json, []),
    sharedOptions: row.shared_options_json
      ? parseJson<Option[]>(row.shared_options_json, [])
      : null,
    correctAnswer: row.correct_answer,
    explanation: row.explanation,
    tags: parseJson<string[]>(row.tags_json, []),
    orderInGroup: row.order_in_group,
  }
}

interface QuestionFilter {
  subjectId?: string
  chapterId?: string
  sectionId?: string
  type?: string
  difficulty?: number
  tags?: string[]
  questionIds?: string[]
  page?: number
  limit?: number
}

export const questionService = {
  async findAll() {
    const db = getDb()
    const rows = await db<QuestionRow>('questions').select('*')
    return rows.map(mapQuestion)
  },

  async countAll(): Promise<number> {
    const db = getDb()
    const row = await db('questions').count('* as cnt').first() as { cnt: number }
    return row.cnt
  },

  async findById(id: string) {
    const db = getDb()
    const row = await db<QuestionRow>('questions').where({ id }).first()
    return row ? mapQuestion(row) : undefined
  },

  async findByFilter(filter: QuestionFilter) {
    const db = getDb()
    let query = db<QuestionRow>('questions')

    if (filter.subjectId) query = query.where({ subject_id: filter.subjectId })
    if (filter.chapterId) query = query.where({ chapter_id: filter.chapterId })
    if (filter.sectionId) query = query.where({ section_id: filter.sectionId })
    if (filter.type) query = query.where({ question_type: filter.type })
    if (filter.difficulty) query = query.where({ difficulty: filter.difficulty })
    if (filter.questionIds && filter.questionIds.length > 0) {
      query = query.whereIn('id', filter.questionIds)
    }

    const page = filter.page || 1
    const limit = filter.limit || 50
    const offset = (page - 1) * limit

    const [rows, countResult] = await Promise.all([
      query.clone().offset(offset).limit(limit),
      query.clone().count('* as total').first(),
    ])

    const total = (countResult as { total: number }).total
    return {
      data: rows.map(mapQuestion),
      total,
      page,
      limit,
    }
  },

  async countBySubject(subjectId: string) {
    const db = getDb()
    const result = await db('questions')
      .where({ subject_id: subjectId })
      .count('* as count')
      .first()
    return (result as { count: number }).count
  },
}
