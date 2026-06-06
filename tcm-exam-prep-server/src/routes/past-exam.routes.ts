import { Router } from 'express'
import { requireAuth } from '../middleware/auth.js'
import { pastExamService } from '../services/past-exam.service.js'

const router = Router()
router.use(requireAuth)

// GET /api/past-exams — 所有真题试卷列表
router.get('/past-exams', async (_req, res, next) => {
  try {
    const exams = await pastExamService.findAll()
    res.json({ success: true, data: exams })
  } catch (err) {
    next(err)
  }
})

// GET /api/past-exams/analysis — 年度汇总分析
router.get('/past-exams/analysis', async (_req, res, next) => {
  try {
    const analysis = await pastExamService.getAllYearAnalysis()
    res.json({ success: true, data: analysis })
  } catch (err) {
    next(err)
  }
})

// GET /api/past-exams/:id — 单个试卷详情
router.get('/past-exams/:id', async (req, res, next) => {
  try {
    const exam = await pastExamService.findById(req.params.id)
    if (!exam) return res.status(404).json({ success: false, error: '真题试卷不存在' })
    res.json({ success: true, data: exam })
  } catch (err) {
    next(err)
  }
})

// GET /api/past-exams/:id/questions — 试卷题目（考试用，不含答案）
router.get('/past-exams/:id/questions', async (req, res, next) => {
  try {
    const questions = await pastExamService.getQuestions(req.params.id)
    // 考试模式下移除答案解析
    const safe = questions.map(({ explanation, ...rest }) => rest)
    res.json({ success: true, data: safe })
  } catch (err) {
    next(err)
  }
})

// GET /api/past-exams/:id/answers — 试卷答案与解析（考后分析用）
router.get('/past-exams/:id/answers', async (req, res, next) => {
  try {
    const questions = await pastExamService.getQuestionsWithAnswers(req.params.id)
    res.json({ success: true, data: questions })
  } catch (err) {
    next(err)
  }
})

// GET /api/past-exams/:id/stats — 试卷考点统计分析
router.get('/past-exams/:id/stats', async (req, res, next) => {
  try {
    const stats = await pastExamService.getExamStats(req.params.id)
    res.json({ success: true, data: stats })
  } catch (err) {
    next(err)
  }
})

export { router as pastExamRoutes }
