import { Router } from 'express'
import { z } from 'zod'
import { authService } from '../services/auth.service.js'
import { requireAuth } from '../middleware/auth.js'
import { validate } from '../middleware/validate.js'

const router = Router()

const loginSchema = z.object({
  username: z.string().min(1, '用户名不能为空'),
  password: z.string().min(1, '密码不能为空'),
})

const registerSchema = z.object({
  username: z.string().min(2, '用户名至少2个字符'),
  password: z.string().min(6, '密码至少6个字符'),
  displayName: z.string().min(1, '昵称不能为空'),
})

router.post('/login', validate(loginSchema), async (req, res, next) => {
  try {
    const { username, password } = req.body
    const result = await authService.login(username, password)
    res.json({ success: true, data: result })
  } catch (err) {
    next(err)
  }
})

router.post('/register', validate(registerSchema), async (req, res, next) => {
  try {
    const { username, password, displayName } = req.body
    const result = await authService.register(username, password, displayName)
    res.status(201).json({ success: true, data: result })
  } catch (err) {
    next(err)
  }
})

router.get('/me', requireAuth, async (req, res, next) => {
  try {
    const user = await authService.getMe(req.userId!)
    res.json({ success: true, data: user })
  } catch (err) {
    next(err)
  }
})

// PUT /api/auth/password — 用户修改自己的密码
router.put('/password', requireAuth, async (req, res, next) => {
  try {
    const { oldPassword, newPassword } = req.body as { oldPassword: string; newPassword: string }
    if (!oldPassword || !newPassword || newPassword.length < 6) {
      return res.status(400).json({ success: false, error: '原密码和新密码都不能为空，新密码至少6位' })
    }
    await authService.changePassword(req.userId!, oldPassword, newPassword)
    res.json({ success: true, data: { message: '密码修改成功' } })
  } catch (err) {
    next(err)
  }
})

// POST /api/auth/reset-password/:userId — 管理员重置用户密码
router.post('/reset-password/:userId', requireAuth, async (req, res, next) => {
  try {
    const { newPassword } = req.body as { newPassword: string }
    if (!newPassword || newPassword.length < 6) {
      return res.status(400).json({ success: false, error: '新密码至少6位' })
    }
    await authService.resetUserPassword(req.userId!, req.params.userId, newPassword)
    res.json({ success: true, data: { message: '密码已重置' } })
  } catch (err) {
    next(err)
  }
})

// GET /api/auth/users — 管理员查看用户列表
router.get('/users', requireAuth, async (req, res, next) => {
  try {
    const users = await authService.listUsers(req.userId!)
    res.json({ success: true, data: users })
  } catch (err) {
    next(err)
  }
})

export { router as authRoutes }
