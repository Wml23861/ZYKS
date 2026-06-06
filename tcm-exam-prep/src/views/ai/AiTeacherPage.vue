<template>
  <div class="ai-teacher">
    <!-- 左侧：历史会话 -->
    <aside class="ai-sidebar">
      <div class="sidebar-header">
        <span class="sidebar-icon">医</span>
        <span>对话记录</span>
      </div>
      <button class="new-chat-btn" @click="startNewChat">
        <span class="new-chat-icon">+</span> 新会话
      </button>
      <div class="conversation-list">
        <div
          v-for="conv in conversations"
          :key="conv.id"
          :class="['conv-item', { active: conv.id === activeConvId }]"
          @click="switchConversation(conv.id)"
        >
          <div class="conv-title">{{ conv.title || '新的对话' }}</div>
          <div class="conv-date">{{ formatConvDate(conv.updatedAt) }}</div>
          <button class="conv-delete" @click.stop="deleteConv(conv.id)" title="删除">×</button>
        </div>
        <div v-if="conversations.length === 0" class="conv-empty">
          暂无对话记录
        </div>
      </div>
    </aside>

    <!-- 右侧：聊天区域 -->
    <main class="ai-main">
      <!-- 顶部标题 -->
      <header class="ai-header">
        <div class="header-avatar">
          <span class="avatar-char">岐</span>
        </div>
        <div class="header-text">
          <h1 class="header-title">岐黄先生</h1>
          <p class="header-subtitle">AI 中医老师 · 随时为你答疑解惑</p>
        </div>
        <button class="header-new-btn" @click="startNewChat" v-if="messages.length > 0">
          新会话
        </button>
      </header>

      <!-- 消息列表 -->
      <div class="chat-area" ref="chatArea">
        <div v-if="messages.length === 0" class="welcome-screen">
          <div class="welcome-seal">岐黄</div>
          <h2>岐黄先生在此</h2>
          <p>选一个你想了解的问题，或直接输入提问</p>
          <div class="welcome-suggestions">
            <button
              v-for="q in suggestedQuestions"
              :key="q"
              class="suggestion-btn"
              @click="sendMessage(q)"
            >{{ q }}</button>
          </div>
        </div>

        <div
          v-for="(msg, idx) in messages"
          :key="idx"
          :class="['message', msg.role === 'user' ? 'message-user' : 'message-ai']"
        >
          <div class="message-avatar" v-if="msg.role === 'ai'">
            <span class="avatar-char avatar-char--small">岐</span>
          </div>
          <div class="message-bubble" :class="msg.role">
            <div class="message-content" v-html="renderMessage(msg.content)"></div>
            <div class="message-time">{{ msg.time }}</div>
          </div>
          <div class="message-avatar" v-if="msg.role === 'user'">
            <span class="avatar-char avatar-char--small avatar-char--user">生</span>
          </div>
        </div>

        <div v-if="isLoading" class="message message-ai">
          <div class="message-avatar">
            <span class="avatar-char avatar-char--small">岐</span>
          </div>
          <div class="message-bubble ai typing">
            <span class="typing-dot"></span>
            <span class="typing-dot"></span>
            <span class="typing-dot"></span>
          </div>
        </div>
      </div>

      <!-- 输入区 -->
      <div class="chat-input-area">
        <div class="input-wrapper">
          <textarea
            v-model="inputText"
            class="chat-input"
            placeholder="向岐黄先生提问... 例如：四逆汤和理中汤的区别？"
            rows="1"
            @keydown.enter.exact.prevent="handleSend"
            @input="autoResize"
            :disabled="isLoading"
          ></textarea>
          <button
            class="send-btn"
            :disabled="!inputText.trim() || isLoading"
            @click="handleSend"
            title="发送"
          >
            <span v-if="!isLoading">↑</span>
            <span v-else class="send-spinner"></span>
          </button>
        </div>
        <p class="input-hint">Enter 发送 · AI 回答仅供参考，重要知识请以教材为准</p>
      </div>
    </main>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, nextTick } from 'vue'
import MarkdownIt from 'markdown-it'
import { apiGet, apiPost, apiPut, apiDelete } from '@/utils/api-client'

interface Message {
  role: 'user' | 'ai'
  content: string
  time: string
}

interface Conversation {
  id: string
  title: string
  messages: Message[]
  createdAt: number
  updatedAt: number
}

const md = new MarkdownIt({ html: false, breaks: true, linkify: true })

const conversations = ref<Conversation[]>([])
const activeConvId = ref<string>('')
const messages = ref<Message[]>([])
const inputText = ref('')
const isLoading = ref(false)
const chatArea = ref<HTMLElement | null>(null)

const suggestedQuestions = [
  '四逆汤和理中汤有什么区别？',
  '麻黄汤的组成和主治是什么？',
  '什么是阴阳学说？举例说明。',
  '如何理解"同病异治"和"异病同治"？',
  '黄芩、黄连、黄柏的鉴别要点？',
]

function renderMessage(content: string): string {
  return md.render(content)
}

function cleanAiContent(text: string): string {
  return text.replace(/<br\s*\/?>/gi, '\n').replace(/<[^>]*>/g, '')
}

async function loadConversations(): Promise<void> {
  try {
    const data = await apiGet<Conversation[]>('/api/ai/conversations')
    conversations.value = data || []
  } catch { conversations.value = [] }
}

function startNewChat(): void {
  activeConvId.value = ''
  messages.value = []
  inputText.value = ''
}

async function switchConversation(id: string): Promise<void> {
  try {
    const conv = await apiGet<Conversation>(`/api/ai/conversations/${id}`)
    if (conv) {
      activeConvId.value = id
      messages.value = conv.messages || []
      nextTick(() => scrollToBottom())
    }
  } catch { /* ignore */ }
}

async function deleteConv(id: string): Promise<void> {
  try { await apiDelete(`/api/ai/conversations/${id}`) } catch { /* ignore */ }
  conversations.value = conversations.value.filter(c => c.id !== id)
  if (activeConvId.value === id) startNewChat()
}

async function ensureConv(title: string): Promise<string> {
  if (activeConvId.value) {
    const exists = conversations.value.find(c => c.id === activeConvId.value)
    if (exists) return exists.id
  }
  const id = 'conv_' + Date.now().toString(36)
  try {
    await apiPost('/api/ai/conversations', { id, title })
    conversations.value.unshift({ id, title, messages: [], createdAt: Date.now(), updatedAt: Date.now() })
  } catch { /* fallback */ }
  activeConvId.value = id
  return id
}

async function sendMessage(text?: string): Promise<void> {
  const msg = (text || inputText.value).trim()
  if (!msg || isLoading.value) return

  const now = new Date()
  const timeStr = now.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })
  const userMsg: Message = { role: 'user', content: msg, time: timeStr }
  messages.value.push(userMsg)
  inputText.value = ''
  nextTick(() => scrollToBottom())

  // 确保会话存在
  const title = msg.slice(0, 30) + (msg.length > 30 ? '...' : '')
  const convId = await ensureConv(title)

  // 保存用户消息到数据库
  const msgId = 'msg_' + Date.now().toString(36)
  try {
    await apiPut(`/api/ai/conversations/${convId}`, {
      title,
      messages: [{ id: msgId, role: 'user', content: msg, time: timeStr }],
    })
  } catch { /* non-critical */ }

  isLoading.value = true
  try {
    const history = messages.value.slice(0, -1).map(m => ({
      role: m.role === 'ai' ? 'assistant' : 'user',
      content: m.content,
    }))
    const data = await apiPost<{ reply: string }>('/api/ai/chat', { message: msg, history })
    const aiMsg: Message = { role: 'ai', content: cleanAiContent(data.reply), time: new Date().toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' }) }
    messages.value.push(aiMsg)

    // 保存 AI 回复到数据库
    const aiMsgId = 'msg_' + Date.now().toString(36) + '_ai'
    try {
      await apiPut(`/api/ai/conversations/${convId}`, {
        title,
        messages: [{ id: aiMsgId, role: 'ai', content: data.reply, time: aiMsg.time }],
      })
    } catch { /* non-critical */ }

    nextTick(() => scrollToBottom())
  } catch {
    const errMsg: Message = { role: 'ai', content: '抱歉，岐黄先生暂时无法回答。请检查 AI 配置或稍后再试。', time: new Date().toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' }) }
    messages.value.push(errMsg)
  } finally {
    isLoading.value = false
    nextTick(() => scrollToBottom())
  }
}

function handleSend(): void { sendMessage() }

function autoResize(e: Event): void {
  const el = e.target as HTMLTextAreaElement
  el.style.height = 'auto'
  el.style.height = Math.min(el.scrollHeight, 120) + 'px'
}

function scrollToBottom(): void {
  nextTick(() => {
    if (chatArea.value) chatArea.value.scrollTop = chatArea.value.scrollHeight
  })
}

function formatConvDate(ts: number): string {
  const d = new Date(ts)
  const now = new Date()
  if (d.toDateString() === now.toDateString()) return d.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })
  return d.toLocaleDateString('zh-CN', { month: 'short', day: 'numeric' })
}

onMounted(async () => {
  await loadConversations()
})
</script>

<style scoped>
.ai-teacher {
  display: flex;
  height: calc(100vh - 56px - var(--tcm-content-padding-y, 24px) * 2);
  background: var(--tcm-bg-base);
  overflow: hidden;
}

/* ===== 左侧边栏 ===== */
.ai-sidebar {
  width: 250px;
  min-width: 250px;
  border-right: 1px solid var(--tcm-border-light);
  background: var(--tcm-bg-surface);
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.sidebar-header {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 18px 16px 12px;
  font-family: var(--tcm-font-decorative);
  font-size: var(--tcm-font-lg);
  color: var(--tcm-text-primary);
  font-weight: 600;
}
.sidebar-icon {
  width: 32px; height: 32px;
  border-radius: 8px;
  background: var(--tcm-primary-500);
  color: var(--tcm-text-on-primary);
  display: flex; align-items: center; justify-content: center;
  font-size: 18px;
  font-family: var(--tcm-font-decorative);
  font-weight: 700;
}

.new-chat-btn {
  margin: 6px 12px 10px;
  padding: 9px;
  border: 1.5px dashed var(--tcm-primary-300);
  border-radius: var(--tcm-radius-md);
  background: transparent;
  color: var(--tcm-primary-500);
  font-size: var(--tcm-font-sm);
  cursor: pointer;
  transition: all 0.2s;
  font-family: inherit;
  display: flex; align-items: center; justify-content: center; gap: 4px;
}
.new-chat-btn:hover {
  background: var(--tcm-primary-50);
  border-color: var(--tcm-primary-500);
}
.new-chat-icon { font-size: 18px; font-weight: 300; }

.conversation-list { flex: 1; overflow-y: auto; padding: 4px 8px; }

.conv-item {
  padding: 10px 12px;
  border-radius: var(--tcm-radius-md);
  cursor: pointer;
  position: relative;
  transition: background 0.15s;
  margin-bottom: 2px;
}
.conv-item:hover { background: var(--tcm-bg-elevated); }
.conv-item.active { background: var(--tcm-primary-50); }

.conv-title {
  font-size: var(--tcm-font-sm);
  color: var(--tcm-text-primary);
  white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
  padding-right: 22px;
}
.conv-date { font-size: 11px; color: var(--tcm-text-disabled); margin-top: 2px; }

.conv-delete {
  position: absolute; right: 6px; top: 50%; transform: translateY(-50%);
  border: none; background: transparent; color: var(--tcm-text-disabled);
  cursor: pointer; font-size: 14px; padding: 2px 6px; border-radius: 4px;
  display: none;
}
.conv-item:hover .conv-delete { display: block; }
.conv-delete:hover { color: var(--tcm-error-text); background: var(--tcm-error-bg); }

.conv-empty {
  text-align: center; color: var(--tcm-text-disabled);
  font-size: var(--tcm-font-sm); padding: 32px 16px;
}

/* ===== 右侧主区域 ===== */
.ai-main {
  flex: 1; display: flex; flex-direction: column; min-width: 0;
}

/* ===== 头部 ===== */
.ai-header {
  display: flex; align-items: center; gap: 14px;
  padding: 14px 24px;
  border-bottom: 1px solid var(--tcm-border-light);
  background: var(--tcm-bg-elevated);
}

.header-avatar {
  width: 46px; height: 46px;
  border-radius: 14px;
  background: var(--tcm-primary-500);
  display: flex; align-items: center; justify-content: center;
  flex-shrink: 0;
}
.avatar-char {
  font-size: 26px; font-weight: 700; color: var(--tcm-text-on-primary);
  font-family: var(--tcm-font-decorative);
}

.header-text { flex: 1; }
.header-title {
  font-family: var(--tcm-font-decorative); font-size: var(--tcm-font-xl);
  color: var(--tcm-text-primary); margin: 0; font-weight: 700;
}
.header-subtitle { font-size: var(--tcm-font-xs); color: var(--tcm-text-secondary); margin: 2px 0 0; }

.header-new-btn {
  padding: 6px 14px;
  border: 1px solid var(--tcm-border); border-radius: var(--tcm-radius-md);
  background: transparent; color: var(--tcm-text-secondary);
  font-size: var(--tcm-font-sm); cursor: pointer; font-family: inherit;
  transition: all 0.15s;
}
.header-new-btn:hover { border-color: var(--tcm-primary-300); color: var(--tcm-primary-500); }

/* ===== 聊天区域 ===== */
.chat-area {
  flex: 1; overflow-y: auto; padding: 28px 24px;
  background: var(--tcm-bg-base);
}

/* --- 欢迎页 --- */
.welcome-screen {
  display: flex; flex-direction: column; align-items: center; justify-content: center;
  padding: 48px 24px; text-align: center; min-height: 100%;
}
.welcome-seal {
  width: 80px; height: 80px; border-radius: 50%;
  border: 3px solid var(--tcm-primary-500);
  color: var(--tcm-primary-500);
  font-family: var(--tcm-font-decorative); font-size: 32px; font-weight: 700;
  display: flex; align-items: center; justify-content: center;
  margin-bottom: 24px;
  transform: rotate(-10deg);
  box-shadow: 0 0 0 3px color-mix(in srgb, var(--tcm-primary-500) 12%, transparent);
}
.welcome-screen h2 {
  font-family: var(--tcm-font-decorative); font-size: 24px; color: var(--tcm-text-primary);
  margin: 0 0 8px;
}
.welcome-screen > p { color: var(--tcm-text-secondary); margin: 0 0 28px; font-size: 15px; }

.welcome-suggestions {
  display: flex; flex-wrap: wrap; gap: 10px; justify-content: center; max-width: 560px;
}
.suggestion-btn {
  padding: 10px 18px;
  border: 1.5px solid var(--tcm-border); border-radius: 100px;
  background: var(--tcm-bg-surface); color: var(--tcm-text-primary);
  font-size: var(--tcm-font-sm); cursor: pointer;
  transition: all 0.2s; font-family: inherit;
}
.suggestion-btn:hover {
  border-color: var(--tcm-primary-500); background: var(--tcm-primary-50); color: var(--tcm-primary-700);
}

/* --- 消息 --- */
.message { display: flex; gap: 12px; margin-bottom: 24px; }
.message-user { margin-left: auto; flex-direction: row-reverse; }

.message-avatar { flex-shrink: 0; }

.avatar-char--small {
  width: 34px; height: 34px; border-radius: 10px;
  background: var(--tcm-primary-500);
  display: flex; align-items: center; justify-content: center;
  font-size: 18px; font-weight: 700;
  color: var(--tcm-text-on-primary);
  font-family: var(--tcm-font-decorative);
}
.avatar-char--user {
  background: var(--tcm-bg-surface); color: var(--tcm-text-secondary);
  border: 1.5px solid var(--tcm-border);
}

.message-bubble {
  padding: 12px 18px; border-radius: var(--tcm-radius-lg);
  position: relative; flex: 1; min-width: 0;
}
.message-bubble.user {
  background: var(--tcm-primary-50); border: 1px solid var(--tcm-primary-100);
  color: var(--tcm-text-primary);
}
.message-bubble.ai {
  background: var(--tcm-bg-elevated); border: 1px solid var(--tcm-border-light);
  box-shadow: var(--tcm-shadow-sm);
}

.message-content { font-size: var(--tcm-font-base); line-height: 1.85; color: var(--tcm-text-primary); }
.message-content :deep(h2) { font-size: var(--tcm-font-lg); margin: 12px 0 6px; color: var(--tcm-primary-700); }
.message-content :deep(h3) { font-size: var(--tcm-font-md); margin: 10px 0 4px; color: var(--tcm-text-primary); }
.message-content :deep(p) { margin: 6px 0; }
.message-content :deep(ul), .message-content :deep(ol) { padding-left: 20px; margin: 8px 0; }
.message-content :deep(li) { margin: 4px 0; }
.message-content :deep(table) { width: 100%; border-collapse: collapse; margin: 12px 0; font-size: var(--tcm-font-sm); }
.message-content :deep(th) { background: var(--tcm-primary-50); padding: 8px 12px; border: 1px solid var(--tcm-border); text-align: left; font-weight: 600; }
.message-content :deep(td) { padding: 8px 12px; border: 1px solid var(--tcm-border-light); }
.message-content :deep(strong) { color: var(--tcm-primary-700); }
.message-content :deep(code) { background: var(--tcm-bg-surface); padding: 2px 6px; border-radius: 3px; font-size: 0.9em; }
.message-content :deep(blockquote) { border-left: 3px solid var(--tcm-gold-text); padding: 4px 12px; margin: 8px 0; background: var(--tcm-gold-bg); border-radius: 0 4px 4px 0; }

.message-time { font-size: 11px; color: var(--tcm-text-disabled); margin-top: 4px; text-align: right; }

/* --- 输入中 --- */
.message-bubble.typing { padding: 16px 24px; display: flex; gap: 6px; align-items: center; }
.typing-dot {
  width: 8px; height: 8px; border-radius: 50%;
  background: var(--tcm-text-disabled);
  animation: bounce 1.4s infinite both;
}
.typing-dot:nth-child(1) { animation-delay: 0s; }
.typing-dot:nth-child(2) { animation-delay: 0.2s; }
.typing-dot:nth-child(3) { animation-delay: 0.4s; }
@keyframes bounce {
  0%, 60%, 100% { transform: translateY(0); opacity: 0.4; }
  30% { transform: translateY(-6px); opacity: 1; }
}

/* --- 输入区 --- */
.chat-input-area {
  padding: 14px 24px; border-top: 1px solid var(--tcm-border-light);
  background: var(--tcm-bg-elevated);
}
.input-wrapper { display: flex; gap: 8px; align-items: flex-end; }

.chat-input {
  flex: 1; padding: 10px 16px;
  border: 2px solid var(--tcm-border); border-radius: var(--tcm-radius-lg);
  font-size: var(--tcm-font-base); font-family: inherit;
  background: var(--tcm-bg-base); color: var(--tcm-text-primary);
  resize: none; outline: none; min-height: 44px; max-height: 120px;
  transition: border-color 0.2s;
}
.chat-input:focus { border-color: var(--tcm-primary-500); }
.chat-input:disabled { opacity: 0.6; }

.send-btn {
  width: 44px; height: 44px; border: none; border-radius: var(--tcm-radius-md);
  background: var(--tcm-primary-500); color: var(--tcm-text-on-primary);
  font-size: 20px; cursor: pointer;
  display: flex; align-items: center; justify-content: center;
  transition: all 0.2s; flex-shrink: 0;
}
.send-btn:hover:not(:disabled) { background: var(--tcm-primary-700); }
.send-btn:disabled { opacity: 0.4; cursor: default; }

.send-spinner {
  width: 16px; height: 16px;
  border: 2px solid transparent; border-top-color: var(--tcm-text-on-primary);
  border-radius: 50%; animation: spin 0.6s linear infinite;
}
@keyframes spin { to { transform: rotate(360deg); } }

.input-hint {
  text-align: center; font-size: 11px; color: var(--tcm-text-disabled);
  margin: 8px 0 0;
}

/* 响应式 */
@media (max-width: 768px) {
  .ai-sidebar { display: none; }
  .chat-area { padding: 16px; }
  .chat-input-area { padding: 12px; }
  .message { max-width: 100%; }
}
</style>
