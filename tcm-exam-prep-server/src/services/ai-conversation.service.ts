import { getDb } from '../config/database.js'

interface ConvRow {
  id: string; user_id: string; title: string; created_at: number; updated_at: number
}
interface MsgRow {
  id: string; conversation_id: string; role: string; content: string; time: string; created_at: number
}

export const aiConversationService = {
  /** 获取用户的所有会话（按更新时间倒序） */
  async findAll(userId: string) {
    const db = getDb()
    const rows = await db<ConvRow>('ai_conversations')
      .where({ user_id: userId })
      .orderBy('updated_at', 'desc')
    return rows.map(r => ({ id: r.id, title: r.title, createdAt: r.created_at, updatedAt: r.updated_at }))
  },

  /** 获取单个会话详情（含消息） */
  async findById(userId: string, id: string) {
    const db = getDb()
    const conv = await db<ConvRow>('ai_conversations').where({ id, user_id: userId }).first()
    if (!conv) return undefined
    const messages = await db<MsgRow>('ai_messages')
      .where({ conversation_id: id })
      .orderBy('created_at', 'asc')
    return {
      id: conv.id,
      title: conv.title,
      createdAt: conv.created_at,
      updatedAt: conv.updated_at,
      messages: messages.map(m => ({ id: m.id, role: m.role, content: m.content, time: m.time, createdAt: m.created_at })),
    }
  },

  /** 创建新会话 */
  async create(userId: string, data: { id: string; title: string }) {
    const db = getDb()
    const now = Date.now()
    await db('ai_conversations').insert({
      id: data.id, user_id: userId, title: data.title, created_at: now, updated_at: now,
    })
    return { id: data.id, title: data.title, createdAt: now, updatedAt: now }
  },

  /** 更新会话（标题 + 时间 + 追加消息） */
  async update(userId: string, id: string, data: {
    title?: string
    messages?: { id: string; role: string; content: string; time: string }[]
  }) {
    const db = getDb()
    const conv = await db<ConvRow>('ai_conversations').where({ id, user_id: userId }).first()
    if (!conv) return undefined

    const patch: Record<string, unknown> = { updated_at: Date.now() }
    if (data.title) patch.title = data.title

    await db('ai_conversations').where({ id, user_id: userId }).update(patch)

    // 追加消息
    if (data.messages && data.messages.length > 0) {
      const now = Date.now()
      for (const msg of data.messages) {
        await db('ai_messages')
          .insert({
            id: msg.id,
            conversation_id: id,
            role: msg.role,
            content: msg.content,
            time: msg.time,
            created_at: now,
          })
          .onConflict('id').ignore()
      }
    }

    return aiConversationService.findById(userId, id)
  },

  /** 删除会话 */
  async delete(userId: string, id: string) {
    const db = getDb()
    await db('ai_messages').where({ conversation_id: id }).del()
    await db('ai_conversations').where({ id, user_id: userId }).del()
  },
}
