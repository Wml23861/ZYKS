import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import { getDb } from '../config/database.js'
import { config } from '../config/env.js'
import { AppError } from '../middleware/error-handler.js'

const TOKEN_EXPIRY = '30d'

interface UserRow {
  id: string
  username: string
  password_hash: string
  display_name: string
  role: string
}

export const authService = {
  async login(username: string, password: string) {
    const db = getDb()
    const user = await db<UserRow>('users').where({ username }).first()
    if (!user) throw new AppError(401, '用户名或密码错误')

    const valid = await bcrypt.compare(password, user.password_hash)
    if (!valid) throw new AppError(401, '用户名或密码错误')

    const token = jwt.sign({ userId: user.id, userRole: user.role }, config.JWT_SECRET, {
      expiresIn: TOKEN_EXPIRY,
    })

    return {
      token,
      user: {
        id: user.id,
        username: user.username,
        displayName: user.display_name,
        role: user.role,
      },
    }
  },

  async register(username: string, password: string, displayName: string) {
    if (!config.ALLOW_REGISTRATION) {
      throw new AppError(403, '注册功能未开放')
    }

    const db = getDb()
    const existing = await db('users').where({ username }).first()
    if (existing) throw new AppError(400, '用户名已存在')

    const now = Date.now()
    const hash = await bcrypt.hash(password, 10)
    const id = `user_${Date.now().toString(36)}`

    await db('users').insert({
      id,
      username,
      password_hash: hash,
      display_name: displayName,
      role: 'user',
      created_at: now,
      updated_at: now,
    })

    // 为新用户创建默认设置
    await db('app_settings').insert({
      id,
      user_id: id,
    })

    const token = jwt.sign({ userId: id, userRole: 'user' }, config.JWT_SECRET, {
      expiresIn: TOKEN_EXPIRY,
    })

    return {
      token,
      user: { id, username, displayName, role: 'user' },
    }
  },

  async getMe(userId: string) {
    const db = getDb()
    const user = await db<UserRow>('users').where({ id: userId }).first()
    if (!user) throw new AppError(404, '用户不存在')
    return {
      id: user.id,
      username: user.username,
      displayName: user.display_name,
      role: user.role,
    }
  },

  /** 修改密码 */
  async changePassword(userId: string, oldPassword: string, newPassword: string) {
    const db = getDb()
    const user = await db<UserRow>('users').where({ id: userId }).first()
    if (!user) throw new AppError(404, '用户不存在')

    const valid = await bcrypt.compare(oldPassword, user.password_hash)
    if (!valid) throw new AppError(400, '原密码不正确')

    const hash = await bcrypt.hash(newPassword, 10)
    await db('users').where({ id: userId }).update({ password_hash: hash, updated_at: Date.now() })
  },

  /** 管理员重置用户密码 */
  async resetUserPassword(adminUserId: string, targetUserId: string, newPassword: string) {
    const db = getDb()
    const admin = await db<UserRow>('users').where({ id: adminUserId }).first()
    if (!admin || admin.role !== 'admin') throw new AppError(403, '仅管理员可重置密码')

    const target = await db<UserRow>('users').where({ id: targetUserId }).first()
    if (!target) throw new AppError(404, '目标用户不存在')

    const hash = await bcrypt.hash(newPassword, 10)
    await db('users').where({ id: targetUserId }).update({ password_hash: hash, updated_at: Date.now() })
  },

  /** 管理员查看用户列表 */
  async listUsers(adminUserId: string) {
    const db = getDb()
    const admin = await db<UserRow>('users').where({ id: adminUserId }).first()
    if (!admin || admin.role !== 'admin') throw new AppError(403, '仅管理员可查看')

    const users = await db('users').select('id', 'username', 'display_name', 'role', 'created_at').orderBy('created_at', 'asc')
    return users.map((u: { id: string; username: string; display_name: string; role: string; created_at: number }) => ({
      id: u.id,
      username: u.username,
      displayName: u.display_name,
      role: u.role,
      createdAt: u.created_at,
    }))
  },

  /** 确保至少有一个默认管理员用户 */
  async ensureDefaultUser() {
    const db = getDb()
    const count = await db('users').count('* as count').first()
    const cnt = (count as { count: number }).count
    if (cnt === 0) {
      const now = Date.now()
      const hash = await bcrypt.hash('tcm2024', 10)
      const userId = 'user-default'
      await db('users').insert({
        id: userId,
        username: 'admin',
        password_hash: hash,
        display_name: '默认管理员',
        role: 'admin',
        created_at: now,
        updated_at: now,
      })
      await db('app_settings').insert({
        id: userId,
        user_id: userId,
      })
      console.log('[Auth] 默认管理员已创建: admin / tcm2024')
    }
  },
}
