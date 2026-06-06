import { getDb } from '../config/database.js'

const UNIT_SUBJECTS: Record<number, Record<string, number>> = {
  1: { zhongji: 35, zhenjuan: 35, zhongyao: 40, fangji: 40 },
  2: { zhongnei: 100, zhenjiu: 50 },
  3: { zhongwai: 40, zhongfu: 55, zhonger: 55 },
  4: { neike: 40, zhenduan: 40, chuanran: 30, lunli: 20, fagui: 20 },
}

export const realExamService = {
  /** 按单元和比例从题库随机抽取题目 */
  async generateExam(userId: string, unit: number, allUnits: boolean) {
    const db = getDb()
    const units = allUnits ? [1, 2, 3, 4] : [unit]

    let allQuestions: any[] = []
    for (const u of units) {
      const subjects = UNIT_SUBJECTS[u]
      for (const [subjectId, count] of Object.entries(subjects)) {
        const pool = await db('questions')
          .where({ subject_id: subjectId })
          .whereNot({ is_group_root: 1 }).whereNotNull("correct_answer").where("correct_answer", "!=", "").whereNotNull("options_json").where("options_json", "!=", "[]").where("options_json", "!=", "")
          .whereNotNull('correct_answer')
          .where('correct_answer', '!=', '')
          .orderByRaw('RANDOM()')
          .limit(Math.min(count * 3, 500))
        const shuffled = pool.sort(() => Math.random() - 0.5)
        const picked = shuffled.slice(0, count)
        for (const q of picked) {
          const opts = JSON.parse(q.options_json || '[]')
          allQuestions.push({
            id: q.id,
            type: q.question_type,
            subjectId: q.subject_id,
            chapterId: q.chapter_id,
            questionStem: q.question_stem,
            options: opts,
            correctAnswer: q.correct_answer,
            explanation: q.explanation,
            difficulty: q.difficulty,
            tags: JSON.parse(q.tags_json || '[]'),
            isGroupRoot: q.is_group_root === 1,
            groupId: q.group_id,
            sharedOptions: q.shared_options_json ? JSON.parse(q.shared_options_json) : null,
            orderInGroup: q.order_in_group,
          })
        }
      }
    }

    // 创建考试记录
    const examId = `real_${Date.now().toString(36)}`
    const now = Date.now()
    const totalQuestions = allQuestions.length
    const timeLimit = units.length * 120 * 60 // 每单元120分钟

    const answers = allQuestions.map(q => ({
      questionId: q.id,
      userAnswer: null,
      isCorrect: false,
      isMarked: false,
      timeSpent: 0,
    }))

    const questionIds = allQuestions.map(q => q.id)

    await db('real_exam_records').insert({
      id: examId,
      user_id: userId,
      units: JSON.stringify(units),
      total_questions: totalQuestions,
      time_limit: timeLimit,
      answers_json: JSON.stringify(answers),
      is_completed: 0,
      score: 0,
      start_time: now,
    })

    return {
      examId,
      totalQuestions,
      timeLimit,
      questions: allQuestions,
      answers,
    }
  },

  /** 提交答案并计算成绩 */
  async submitExam(userId: string, examId: string, answers: { questionId: string; userAnswer: string | null }[]) {
    const db = getDb()
    const record = await db('real_exam_records').where({ id: examId, user_id: userId }).first()
    if (!record) throw new Error('考试记录不存在')

    const allQuestions = await db('questions').whereIn('id', answers.map(a => a.questionId))
    const questionMap = new Map(allQuestions.map(q => [q.id, q]))

    let correctCount = 0; const totalQuestions = answers.length
    const answerDetails = answers.map(a => {
      const q = questionMap.get(a.questionId)
      const isCorrect = q ? a.userAnswer === q.correct_answer : false
      if (isCorrect) correctCount++
      return {
        questionId: a.questionId,
        userAnswer: a.userAnswer,
        isCorrect,
        isMarked: false,
        timeSpent: 0,
      }
    })

    const score = correctCount
    const duration = Math.floor((Date.now() - record.start_time) / 1000)

    await db('real_exam_records').where({ id: examId }).update({
      answers_json: JSON.stringify(answerDetails),
      answered_questions: answers.filter(a => a.userAnswer !== null).length,
      correct_count: correctCount,
      score,
      duration,
      is_completed: 1,
      end_time: Date.now(),
    })

    return { score, correctCount, totalQuestions: answers.length, duration, answerDetails }
  },

  /** 获取模考记录列表 */
  async getRecords(userId: string) {
    const db = getDb()
    return db('real_exam_records')
      .where({ user_id: userId })
      .orderBy('start_time', 'desc')
  },

  /** 获取所有记录（管理员） */
  async getAllRecords() {
    const db = getDb()
    return db('real_exam_records')
      .select('real_exam_records.*', 'users.username', 'users.display_name')
      .leftJoin('users', 'real_exam_records.user_id', 'users.id')
      .orderBy('start_time', 'desc')
  },

  /** 获取单次模考详情 */
  async getRecordDetail(userId: string, examId: string) {
    const db = getDb()
    const record = await db('real_exam_records').where({ id: examId }).first()
    if (!record) return null

    const answers = JSON.parse(record.answers_json || '[]')
    const questionIds = answers.map((a: any) => a.questionId)
    const questions = await db('questions').whereIn('id', questionIds)

    // 按科目统计
    const bySubject: Record<string, { total: number; wrong: number; correct: number }> = {}
    const byChapter: Record<string, { total: number; wrong: number; subjectId: string; chapterTitle: string }> = {}

    for (const a of answers) {
      const q = questions.find((q: any) => q.id === a.questionId)
      if (!q) continue
      const sid = q.subject_id
      if (!bySubject[sid]) bySubject[sid] = { total: 0, wrong: 0, correct: 0 }
      bySubject[sid].total++
      if (a.isCorrect) bySubject[sid].correct++
      else bySubject[sid].wrong++

      const cid = q.chapter_id
      if (!byChapter[cid]) byChapter[cid] = { total: 0, wrong: 0, subjectId: sid, chapterTitle: cid }
      byChapter[cid].total++
      if (!a.isCorrect) byChapter[cid].wrong++
    }

    // 获取章节名称
    const chapterIds = Object.keys(byChapter)
    if (chapterIds.length > 0) {
      const chapters = await db('chapters').whereIn('id', chapterIds)
      for (const ch of chapters) {
        if (byChapter[ch.id]) byChapter[ch.id].chapterTitle = ch.title
      }
    }

    return {
      record,
      answers,
      questions,
      stats: { bySubject, byChapter },
    }
  },

  /** 获取趋势数据 */
  async getTrend(userId: string) {
    const db = getDb()
    const records = await db('real_exam_records')
      .where({ user_id: userId, is_completed: 1 })
      .orderBy('start_time', 'asc')
      .limit(20)

    return records.map((r: any) => {
      const answers = JSON.parse(r.answers_json || '[]')
      const bySubject: Record<string, { total: number; correct: number }> = {}
      for (const a of answers) {
        const sid = a.questionId.split('-')[2] || 'unknown'
        if (!bySubject[sid]) bySubject[sid] = { total: 0, correct: 0 }
        bySubject[sid].total++
        if (a.isCorrect) bySubject[sid].correct++
      }
      return {
        id: r.id,
        date: r.start_time,
        score: r.score,
        totalQuestions: r.total_questions,
        correctCount: r.correct_count,
        duration: r.duration,
        bySubject,
      }
    })
  },
}
