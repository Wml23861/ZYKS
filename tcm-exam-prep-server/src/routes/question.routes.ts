import { Router } from 'express'
import { questionService } from '../services/question.service.js'

const router = Router()

// GET /api/questions
router.get('/', async (req, res, next) => {
  try {
    const filter = {
      subjectId: req.query.subjectId as string | undefined,
      chapterId: req.query.chapterId as string | undefined,
      sectionId: req.query.sectionId as string | undefined,
      type: req.query.type as string | undefined,
      difficulty: req.query.difficulty ? Number(req.query.difficulty) : undefined,
      questionIds: req.query.questionIds
        ? (req.query.questionIds as string).split(',')
        : undefined,
      page: req.query.page ? Number(req.query.page) : 1,
      limit: req.query.limit ? Number(req.query.limit) : 50,
    }
    const result = await questionService.findByFilter(filter)
    res.json({
      success: true,
      data: result.data,
      meta: { total: result.total, page: result.page, limit: result.limit },
    })
  } catch (err) {
    next(err)
  }
})

// GET /api/questions/count — 获取题目总数（无分页限制）
router.get('/count', async (_req, res, next) => {
  try {
    const count = await questionService.countAll()
    res.json({ success: true, data: { count } })
  } catch (err) {
    next(err)
  }
})

// GET /api/questions/:id
router.get('/:id', async (req, res, next) => {
  try {
    const question = await questionService.findById(req.params.id)
    if (!question) return res.status(404).json({ success: false, error: '题目不存在' })
    res.json({ success: true, data: question })
  } catch (err) {
    next(err)
  }
})

export { router as questionRoutes }
