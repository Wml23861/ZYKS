import { getDb } from '../config/database.js'

interface PastExamRow {
  id: string
  year: number
  unit: number
  total_questions: number
  time_limit: number
  summary: string
  key_points: string
  source: string
  created_at: number
}

interface PastExamQuestionRow {
  id: string
  exam_id: string
  type: string
  subject_id: string
  question_stem: string
  options: string
  correct_answer: string
  explanation: string
  difficulty: number
  key_point_tag: string
  exam_frequency: number
  sort_order: number
}

function mapExam(row: PastExamRow) {
  return {
    id: row.id,
    year: row.year,
    unit: row.unit,
    totalQuestions: row.total_questions,
    timeLimit: row.time_limit,
    summary: row.summary,
    keyPoints: row.key_points,
    source: row.source,
    createdAt: row.created_at,
  }
}

function mapQuestion(row: PastExamQuestionRow) {
  return {
    id: row.id,
    examId: row.exam_id,
    type: row.type,
    subjectId: row.subject_id,
    questionStem: row.question_stem,
    options: JSON.parse(row.options || '[]'),
    correctAnswer: row.correct_answer,
    explanation: row.explanation,
    difficulty: row.difficulty,
    keyPointTag: row.key_point_tag,
    examFrequency: row.exam_frequency,
    sortOrder: row.sort_order,
  }
}

export const pastExamService = {
  /** 获取所有真题试卷列表 */
  async findAll() {
    const db = getDb()
    const rows = await db<PastExamRow>('past_exams')
      .orderBy('year', 'desc')
      .orderBy('unit', 'asc')
    return rows.map(mapExam)
  },

  /** 根据 ID 获取单个真题试卷 */
  async findById(id: string) {
    const db = getDb()
    const row = await db<PastExamRow>('past_exams').where({ id }).first()
    return row ? mapExam(row) : undefined
  },

  /** 获取某年份的真题试卷 */
  async findByYear(year: number) {
    const db = getDb()
    const rows = await db<PastExamRow>('past_exams')
      .where({ year })
      .orderBy('unit', 'asc')
    return rows.map(mapExam)
  },

  /** 获取试卷的所有题目（不含答案，用于考试） */
  async getQuestions(examId: string) {
    const db = getDb()
    const rows = await db<PastExamQuestionRow>('past_exam_questions')
      .where({ exam_id: examId })
      .orderBy('sort_order', 'asc')
    return rows.map(mapQuestion)
  },

  /** 获取试卷题目（含答案，用于分析页） */
  async getQuestionsWithAnswers(examId: string) {
    return this.getQuestions(examId)
  },

  /** 按科目统计某试卷的考点分布 */
  async getExamStats(examId: string) {
    const db = getDb()
    const questions = await db<PastExamQuestionRow>('past_exam_questions')
      .where({ exam_id: examId })

    const bySubject: Record<string, { total: number; difficulties: number[]; tags: Record<string, number> }> = {}
    for (const q of questions) {
      const sid = q.subject_id || 'other'
      if (!bySubject[sid]) {
        bySubject[sid] = { total: 0, difficulties: [], tags: {} }
      }
      bySubject[sid].total++
      bySubject[sid].difficulties.push(q.difficulty)
      if (q.key_point_tag) {
        bySubject[sid].tags[q.key_point_tag] = (bySubject[sid].tags[q.key_point_tag] || 0) + 1
      }
    }

    return {
      examId,
      totalQuestions: questions.length,
      bySubject,
    }
  },

  /** 获取所有年份的汇总分析数据 */
  async getAllYearAnalysis() {
    const db = getDb()
    const exams = await db<PastExamRow>('past_exams')
      .orderBy('year', 'desc')
      .orderBy('unit', 'asc')

    const result = []
    for (const exam of exams) {
      const qc = await db<PastExamQuestionRow>('past_exam_questions')
        .where({ exam_id: exam.id })
        .count({ count: 'id' })
        .first()

      result.push({
        ...mapExam(exam),
        questionCount: qc ? Number(qc.count) : 0,
      })
    }

    return result
  },
}
