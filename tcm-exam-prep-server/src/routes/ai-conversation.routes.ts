import { Router } from 'express'
import { requireAuth } from '../middleware/auth.js'
import { aiConversationService } from '../services/ai-conversation.service.js'

const router = Router()
router.use(requireAuth)

// GET /api/ai/conversations
router.get('/ai/conversations', async (req, res, next) => {
  try {
    const convs = await aiConversationService.findAll(req.userId!)
    res.json({ success: true, data: convs })
  } catch (err) { next(err) }
})

// GET /api/ai/conversations/:id
router.get('/ai/conversations/:id', async (req, res, next) => {
  try {
    const conv = await aiConversationService.findById(req.userId!, req.params.id)
    if (!conv) return res.status(404).json({ success: false, error: '会话不存在' })
    res.json({ success: true, data: conv })
  } catch (err) { next(err) }
})

// POST /api/ai/conversations
router.post('/ai/conversations', async (req, res, next) => {
  try {
    const conv = await aiConversationService.create(req.userId!, req.body)
    res.status(201).json({ success: true, data: conv })
  } catch (err) { next(err) }
})

// PUT /api/ai/conversations/:id
router.put('/ai/conversations/:id', async (req, res, next) => {
  try {
    const conv = await aiConversationService.update(req.userId!, req.params.id, req.body)
    if (!conv) return res.status(404).json({ success: false, error: '会话不存在' })
    res.json({ success: true, data: conv })
  } catch (err) { next(err) }
})

// DELETE /api/ai/conversations/:id
router.delete('/ai/conversations/:id', async (req, res, next) => {
  try {
    await aiConversationService.delete(req.userId!, req.params.id)
    res.status(204).send()
  } catch (err) { next(err) }
})

export { router as aiConversationRoutes }
