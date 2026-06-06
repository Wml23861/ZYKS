import { getDb } from '../config/database.js'

interface WrongQuestionRow {
  id: string
  user_id: string
  question_id: string
  subject_id: string
  wrong_count: number
  last_wrong_at: number
  last_wrong_answer: string
  notes: string
  is_mastered: number
}

function map(row: WrongQuestionRow) {
  return {
    id: row.id,
    questionId: row.question_id,
    subjectId: row.subject_id,
    wrongCount: row.wrong_count,
    lastWrongAt: row.last_wrong_at,
    lastWrongAnswer: row.last_wrong_answer,
    notes: row.notes,
    isMastered: row.is_mastered === 1,
  }
}

export const wrongQuestionService = {
  async findAll(userId: string, filter?: { subjectId?: string; mastered?: boolean }) {
    const db = getDb()
    let query = db<WrongQuestionRow>('wrong_question_records').where({ user_id: userId })

    if (filter?.subjectId) query = query.where({ subject_id: filter.subjectId })
    if (filter?.mastered !== undefined) {
      query = query.where({ is_mastered: filter.mastered ? 1 : 0 })
    }

    const rows = await query
    return rows.map(map)
  },

  async findByQuestionId(userId: string, questionId: string) {
    const db = getDb()
    const row = await db<WrongQuestionRow>('wrong_question_records')
      .where({ user_id: userId, question_id: questionId })
      .first()
    return row ? map(row) : undefined
  },

  async upsert(userId: string, record: {
    id: string
    questionId: string
    subjectId: string
    wrongCount: number
    lastWrongAt: number
    lastWrongAnswer: string
    notes: string
    isMastered: boolean
  }) {
    const db = getDb()
    const row = {
      id: record.id,
      user_id: userId,
      question_id: record.questionId,
      subject_id: record.subjectId,
      wrong_count: record.wrongCount,
      last_wrong_at: record.lastWrongAt,
      last_wrong_answer: record.lastWrongAnswer,
      notes: record.notes,
      is_mastered: record.isMastered ? 1 : 0,
    }
    await db('wrong_question_records')
      .insert(row)
      .onConflict(['user_id', 'question_id'])
      .merge()
    return record
  },

  async delete(userId: string, id: string) {
    const db = getDb()
    await db('wrong_question_records').where({ id, user_id: userId }).del()
  },

  async markMastered(userId: string, id: string) {
    const db = getDb()
    await db('wrong_question_records')
      .where({ id, user_id: userId })
      .update({ is_mastered: 1 })
  },

  async getUnmastered(userId: string, subjectId?: string) {
    const db = getDb()
    let query = db<WrongQuestionRow>('wrong_question_records')
      .where({ user_id: userId, is_mastered: 0 })

    if (subjectId) query = query.where({ subject_id: subjectId })

    const rows = await query
    return rows.map(map)
  },
}
