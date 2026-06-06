<template>
  <div class="real-exam-session">
    <div class="exam-header" :class="{ 'time-warning': timeRemaining <= 300 }">
      <div class="header-left"><h1 class="exam-title">真实模考</h1></div>
      <div class="header-center">
        <div class="timer-display" :class="{ 'timer-urgent': timeRemaining <= 300 }">
          <span class="timer-label">剩余时间</span>
          <span class="timer-value">{{ formatDuration(timeRemaining) }}</span>
        </div>
      </div>
      <div class="header-right">
        <span class="answered-count">{{ answeredCount }}/{{ totalCount }}</span>
        <TcmButton variant="outline" size="sm" @click="showSubmitDialog = true">交卷</TcmButton>
      </div>
    </div>

    <div class="exam-body">
      <div class="exam-main">
        <div v-if="currentQuestion" class="question-area">
          <div class="question-header">
            <TcmTag :type="getTypeTag(currentQuestion.type)" size="sm">{{ currentQuestion.type }} 型题</TcmTag>
            <span class="q-num">第 {{ currentIndex + 1 }} / {{ totalCount }} 题</span>
            <button class="mark-btn" @click="toggleMark(currentQuestion.id)">
              {{ isMarked(currentQuestion.id) ? '★ 已标记' : '☆ 标记' }}
            </button>
          </div>
          <div class="q-stem" v-html="renderMd(currentQuestion.questionStem)"></div>
          <div class="options-list">
            <button v-for="opt in currentQuestion.options" :key="opt.key"
              :class="['opt-item', { selected: getAnswer(currentQuestion.id) === opt.key }]"
              @click="selectAnswer(currentQuestion.id, opt.key)">
              <span class="opt-key">{{ opt.key }}</span>
              <span class="opt-text">{{ opt.text }}</span>
            </button>
          </div>
          <div class="nav-buttons">
            <TcmButton variant="secondary" size="md" :disabled="currentIndex === 0" @click="goPrev">上一题</TcmButton>
            <TcmButton variant="secondary" size="md" :disabled="currentIndex >= totalCount - 1" @click="goNext">下一题</TcmButton>
          </div>
        </div>
      </div>
      <div class="exam-sidebar">
        <div class="nav-panel">
          <h3>答题卡</h3>
          <div class="nav-grid">
            <button v-for="(q, idx) in questions" :key="q.id"
              :class="['nav-btn', { 'nav-current': idx === currentIndex, 'nav-answered': getAnswer(q.id), 'nav-marked': isMarked(q.id) }]"
              @click="goTo(idx)">{{ idx + 1 }}</button>
          </div>
        </div>
      </div>
    </div>

    <Teleport to="body">
      <div v-if="showSubmitDialog" class="dialog-overlay" @click.self="showSubmitDialog = false">
        <div class="dialog-confirm">
          <h3>确认交卷</h3>
          <p v-if="unansweredCount > 0">还有 <strong>{{ unansweredCount }}</strong> 题未答，确定交卷？</p>
          <p v-else>所有题目已作答，确定交卷？</p>
          <div class="dialog-actions">
            <TcmButton variant="secondary" @click="showSubmitDialog = false">继续检查</TcmButton>
            <TcmButton variant="primary" :loading="submitting" @click="submitExam">确认交卷</TcmButton>
          </div>
        </div>
      </div>
    </Teleport>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import MarkdownIt from 'markdown-it'
import { apiGet, apiPost } from '@/utils/api-client'
import TcmTag from '@/components/ui/TcmTag.vue'
import TcmButton from '@/components/ui/TcmButton.vue'
import { formatDuration } from '@/utils/date'

const route = useRoute()
const router = useRouter()
const examId = (route.query.examId as string) || ''

interface Q { id: string; type: string; subjectId: string; questionStem: string; options: { key: string; text: string }[]; correctAnswer: string; explanation: string; difficulty: number }
interface A { questionId: string; userAnswer: string | null }
const questions = ref<Q[]>([])
const answers = ref<A[]>([])
const currentIndex = ref(0)
const timeRemaining = ref(7200)
const showSubmitDialog = ref(false)
const submitting = ref(false)
const markedQ = ref<Set<string>>(new Set())

const md = new MarkdownIt({ html: false, breaks: true })
const renderMd = (s: string) => md.render(s || '')
const currentQuestion = computed(() => questions.value[currentIndex.value] || null)
const totalCount = computed(() => questions.value.length)
const answeredCount = computed(() => answers.value.filter(a => a.userAnswer !== null).length)
const unansweredCount = computed(() => totalCount.value - answeredCount.value)

function getAnswer(qid: string): string | null { return answers.value.find(a => a.questionId === qid)?.userAnswer || null }
function selectAnswer(qid: string, key: string): void { const a = answers.value.find(a => a.questionId === qid); if (a) a.userAnswer = key }
function isMarked(qid: string): boolean { return markedQ.value.has(qid) }
function toggleMark(qid: string): void { if (markedQ.value.has(qid)) markedQ.value.delete(qid); else markedQ.value.add(qid) }
function goTo(idx: number): void { currentIndex.value = idx }
function goPrev(): void { if (currentIndex.value > 0) currentIndex.value-- }
function goNext(): void { if (currentIndex.value < totalCount.value - 1) currentIndex.value++ }
function getTypeTag(t: string): 'key'|'difficult'|'high-frequency'|'default' {
  const m: Record<string, 'key'|'difficult'|'high-frequency'|'default'> = { A1: 'key', A2: 'difficult', A3: 'high-frequency', A4: 'high-frequency', B1: 'default' }
  return m[t] || 'default'
}

let timer: ReturnType<typeof setInterval> | null = null
function startTimer(): void { timer = setInterval(() => { timeRemaining.value--; if (timeRemaining.value <= 0) submitExam() }, 1000) }

async function submitExam(): Promise<void> {
  if (submitting.value) return
  submitting.value = true
  if (timer) clearInterval(timer)
  try {
    const resp = await apiPost<any>('/api/real-exam/submit', { examId, answers: answers.value })
    router.replace({ name: 'real-exam-result', params: { examId } })
  } catch { submitting.value = false }
}

onMounted(async () => {
  try {
    const resp = await apiGet<any>(`/api/real-exam/session/${examId}`)
    if (resp?.record?.is_completed) { router.replace({ name: 'real-exam-result', params: { examId } }); return }
    questions.value = resp.questions || []
    answers.value = resp.answers || []
    timeRemaining.value = resp.record?.time_limit || 7200
    startTimer()
  } catch { router.replace({ name: 'real-exam-entry' }) }
})

onUnmounted(() => { if (timer) clearInterval(timer) })
</script>

<style scoped>
.real-exam-session { max-width: 1100px; min-height: calc(100vh - 120px); }
.exam-header { display: flex; align-items: center; justify-content: space-between; padding: 12px 20px; background: var(--tcm-bg-surface); border: 1px solid var(--tcm-border-light); border-radius: var(--tcm-radius-lg); margin-bottom: 20px; gap: 16px; }
.exam-header.time-warning { background: #FDF0ED; border-color: var(--tcm-error); }
.exam-header > * { flex-shrink: 0; }
.exam-title { font-family: var(--tcm-font-decorative); font-size: var(--tcm-font-lg); margin: 0; }
.timer-display { text-align: center; min-width: 80px; }
.timer-label { display: block; font-size: var(--tcm-font-xs); color: var(--tcm-text-secondary); margin-bottom: 2px; }
.timer-value { font-size: var(--tcm-font-2xl); font-weight: 700; font-family: var(--tcm-font-mono); display: block; }
.timer-urgent .timer-value { color: var(--tcm-error); animation: pulse 1s infinite; }
@keyframes pulse { 0%,100%{opacity:1} 50%{opacity:.5} }
.answered-count { font-size: var(--tcm-font-sm); color: var(--tcm-text-secondary); margin-right: 16px; }
.exam-body { display: flex; gap: 20px; }
.exam-main { flex: 1; min-width: 0; }
.question-area { background: var(--tcm-bg-surface); border: 1px solid var(--tcm-border-light); border-radius: var(--tcm-radius-lg); padding: 24px; }
.question-header { display: flex; align-items: center; gap: 12px; margin-bottom: 16px; }
.q-num { font-size: var(--tcm-font-sm); color: var(--tcm-text-secondary); }
.mark-btn { border: 1px solid var(--tcm-border); background: transparent; padding: 4px 10px; border-radius: var(--tcm-radius-sm); cursor: pointer; font-size: var(--tcm-font-sm); color: var(--tcm-text-secondary); font-family: inherit; }
.mark-btn:hover { border-color: var(--tcm-gold-500); color: var(--tcm-gold-500); }
.q-stem { font-size: var(--tcm-font-md); line-height: 1.8; margin-bottom: 20px; }
.options-list { display: flex; flex-direction: column; gap: 8px; }
.opt-item { display: flex; align-items: flex-start; gap: 12px; padding: 12px 16px; border: 2px solid var(--tcm-border-light); border-radius: var(--tcm-radius-md); cursor: pointer; background: var(--tcm-bg-base); text-align: left; font-family: inherit; font-size: var(--tcm-font-base); transition: all 0.15s; }
.opt-item:hover { border-color: var(--tcm-primary-300); }
.opt-item.selected { border-color: var(--tcm-primary-500); background: #FDF0ED; }
.opt-key { font-weight: 700; color: var(--tcm-primary-500); min-width: 24px; }
.opt-text { color: var(--tcm-text-primary); }
.nav-buttons { display: flex; justify-content: space-between; margin-top: 24px; }
.exam-sidebar { width: 200px; flex-shrink: 0; }
.nav-panel { background: var(--tcm-bg-surface); border: 1px solid var(--tcm-border-light); border-radius: var(--tcm-radius-lg); padding: 16px; position: sticky; top: 16px; }
.nav-panel h3 { font-size: var(--tcm-font-sm); margin: 0 0 12px; }
.nav-grid { display: grid; grid-template-columns: repeat(5, 1fr); gap: 5px; }
.nav-btn { aspect-ratio: 1; border: 1px solid var(--tcm-border-light); border-radius: var(--tcm-radius-sm); background: var(--tcm-bg-base); font-size: 12px; cursor: pointer; }
.nav-btn.nav-current { border-color: var(--tcm-primary-500); background: #FDF0ED; }
.nav-btn.nav-answered { background: #E8F5E9; }
.nav-btn.nav-marked { border-color: var(--tcm-gold-500); background: #FFF8E1; }
.dialog-overlay { position: fixed; inset: 0; background: var(--tcm-bg-overlay); display: flex; align-items: center; justify-content: center; z-index: 1000; }
.dialog-confirm { background: var(--tcm-bg-elevated); border-radius: var(--tcm-radius-lg); padding: 32px; max-width: 400px; text-align: center; box-shadow: var(--tcm-shadow-lg); }
.dialog-confirm h3 { font-family: var(--tcm-font-decorative); margin: 0 0 12px; }
.dialog-confirm strong { color: var(--tcm-error); font-size: var(--tcm-font-xl); }
.dialog-actions { display: flex; gap: 12px; justify-content: center; margin-top: 20px; }
@media (max-width: 768px) { .exam-body { flex-direction: column-reverse; } .exam-sidebar { width: 100%; position: static; } .nav-grid { grid-template-columns: repeat(10, 1fr); } }
</style>
