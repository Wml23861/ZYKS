import { Router } from 'express'
import { requireAuth } from '../middleware/auth.js'
import { realExamService } from '../services/real-exam.service.js'
import { getDb } from '../config/database.js'

const router = Router()
router.use(requireAuth)

// GET /api/real-exam/session/:examId — 获取考试题目
router.get('/session/:examId', async (req, res, next) => {
  try {
    const db = getDb()
    const record = await db('real_exam_records').where({ id: req.params.examId }).first()
    if (!record) return res.status(404).json({ success: false, error: '考试不存在' })
    if (record.is_completed) return res.status(400).json({ success: false, error: '考试已结束' })

    const answers = JSON.parse(record.answers_json || '[]')
    const answerIds = answers.map((a: any) => a.questionId)
    const questions = await db('questions').whereIn('id', answerIds)
    const qMap = new Map(questions.map((q: any) => [q.id, q]))

    const sorted = answerIds.map((id: string) => {
      const q = qMap.get(id)
      if (!q) return null
      return {
        id: q.id, type: q.question_type, subjectId: q.subject_id,
        questionStem: q.question_stem,
        options: JSON.parse(q.options_json || '[]'),
        correctAnswer: q.correct_answer, explanation: q.explanation,
        difficulty: q.difficulty,
      }
    }).filter(Boolean)

    res.json({ success: true, data: { record, questions: sorted, answers } })
  } catch (err) { next(err) }
})

// POST /api/real-exam/start
router.post('/start', async (req, res, next) => {
  try {
    const { unit, allUnits } = req.body as { unit: number; allUnits?: boolean }
    if (!unit && !allUnits) return res.status(400).json({ success: false, error: '请选择考试单元' })
    const exam = await realExamService.generateExam(req.userId!, unit || 1, allUnits || false)
    res.json({ success: true, data: exam })
  } catch (err) { next(err) }
})

// POST /api/real-exam/submit
router.post('/submit', async (req, res, next) => {
  try {
    const { examId, answers } = req.body as { examId: string; answers: { questionId: string; userAnswer: string | null }[] }
    if (!examId || !answers) return res.status(400).json({ success: false, error: '参数不完整' })
    const result = await realExamService.submitExam(req.userId!, examId, answers)
    res.json({ success: true, data: result })
  } catch (err) { next(err) }
})

router.get('/records', async (req, res, next) => {
  try { const records = await realExamService.getRecords(req.userId!); res.json({ success: true, data: records }) } catch (err) { next(err) }
})

router.get('/records/all', async (req, res, next) => {
  try { const records = await realExamService.getAllRecords(); res.json({ success: true, data: records }) } catch (err) { next(err) }
})

router.get('/records/:id', async (req, res, next) => {
  try {
    const detail = await realExamService.getRecordDetail(req.userId!, req.params.id)
    if (!detail) return res.status(404).json({ success: false, error: '记录不存在' })
    res.json({ success: true, data: detail })
  } catch (err) { next(err) }
})

router.get('/trend', async (req, res, next) => {
  try { const trend = await realExamService.getTrend(req.userId!); res.json({ success: true, data: trend }) } catch (err) { next(err) }
})

export { router as realExamRoutes }
