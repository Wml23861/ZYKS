<template>
  <div class="page-past-exam">
    <div v-if="isLoading" class="loading-state">
      <TcmSkeleton variant="rect" class="skel-header" />
      <TcmSkeleton variant="card" v-for="i in 5" :key="i" />
    </div>

    <template v-else-if="exam">
      <!-- Header -->
      <div class="exam-header">
        <button class="back-btn" @click="goBack">← 返回列表</button>
        <div class="exam-info">
          <h1 class="exam-title">{{ exam.year }}年 · 第{{ exam.unit }}单元</h1>
          <span class="exam-meta">{{ questions.length }}题 · {{ exam.timeLimit }}分钟 · {{ exam.source }}</span>
        </div>
        <div class="exam-actions">
          <span v-if="!isSubmitted" class="timer" :class="{ 'timer--warn': remainingSeconds < 300 }">
            ⏱ {{ formatTime(remainingSeconds) }}
          </span>
          <TcmButton
            v-if="!isSubmitted"
            variant="primary"
            :disabled="answeredCount < questions.length"
            @click="submitExam"
          >
            交卷 ({{ answeredCount }}/{{ questions.length }})
          </TcmButton>
          <TcmButton v-else variant="outline" @click="goToAnalysis">
            查看分析
          </TcmButton>
        </div>
      </div>

      <!-- Question list -->
      <div class="question-list">
        <div
          v-for="(q, idx) in questions"
          :key="q.id"
          :ref="el => { questionRefs[idx] = el as HTMLElement | null }"
          class="question-block"
        >
          <div class="q-header">
            <span class="q-num">{{ idx + 1 }}.</span>
            <TcmTag :type="getQuestionTagType(q.type)" size="sm">{{ q.type }}</TcmTag>
            <span v-if="q.keyPointTag" class="q-tag">{{ q.keyPointTag }}</span>
          </div>

          <QuestionCard
            v-if="q.type !== 'B1'"
            :type="q.type"
            :question-stem="q.questionStem"
            :options="q.options"
            :correct-answer="q.correctAnswer"
            :explanation="isSubmitted ? q.explanation : ''"
            :difficulty="q.difficulty"
            :selected-answer="answers[q.id] ?? null"
            :show-explanation="isSubmitted"
            @select="(ans: string) => onAnswer(q.id, ans)"
          />

          <!-- B1 placeholder: show sub-questions individually -->
          <div v-else class="b1-placeholder">
            <p class="b1-stem">{{ q.questionStem }}</p>
            <p class="b1-note">（配伍题，请选择正确选项）</p>
            <div class="b1-options">
              <button
                v-for="opt in q.options"
                :key="opt.key"
                :class="['b1-opt', { selected: answers[q.id] === opt.key }]"
                :disabled="isSubmitted"
                @click="onAnswer(q.id, opt.key)"
              >
                {{ opt.key }}. {{ opt.text }}
              </button>
            </div>
            <div v-if="isSubmitted && answers[q.id] !== q.correctAnswer" class="b1-correct">
              正确答案: {{ q.correctAnswer }}
            </div>
          </div>

          <div v-if="isSubmitted" class="q-result" :class="answers[q.id] === q.correctAnswer ? 'correct' : 'wrong'">
            {{ answers[q.id] === q.correctAnswer ? '✓ 正确' : '✗ 错误' }}
          </div>
        </div>
      </div>

      <!-- Bottom submit bar -->
      <div v-if="!isSubmitted" class="bottom-bar">
        <div class="answer-progress">
          <div class="progress-bar">
            <div class="progress-fill" :style="{ width: (answeredCount / questions.length * 100) + '%' }" />
          </div>
          <span>{{ answeredCount }}/{{ questions.length }} 已答</span>
        </div>
        <TcmButton variant="primary" size="lg" :disabled="answeredCount < questions.length" @click="submitExam">
          交卷
        </TcmButton>
      </div>
    </template>

    <TcmEmpty v-else description="真题试卷加载失败" />
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted, onUnmounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { apiGet, apiPost } from '@/utils/api-client'
import { generateId } from '@/utils/id-generator'
import QuestionCard from '@/components/question/QuestionCard.vue'
import TcmButton from '@/components/ui/TcmButton.vue'
import TcmTag from '@/components/ui/TcmTag.vue'
import TcmSkeleton from '@/components/ui/TcmSkeleton.vue'
import TcmEmpty from '@/components/ui/TcmEmpty.vue'

interface PastExamQuestion {
  id: string
  examId: string
  type: string
  subjectId: string
  questionStem: string
  options: { key: string; text: string }[]
  correctAnswer: string
  explanation: string
  difficulty: number
  keyPointTag: string
  examFrequency: number
  sortOrder: number
}

interface PastExam {
  id: string
  year: number
  unit: number
  totalQuestions: number
  timeLimit: number
  summary: string
  keyPoints: string
  source: string
}

const route = useRoute()
const router = useRouter()
const examId = route.params.examId as string

const exam = ref<PastExam | null>(null)
const questions = ref<PastExamQuestion[]>([])
const answers = reactive<Record<string, string | null>>({})
const questionRefs = ref<(HTMLElement | null)[]>([])
const isLoading = ref(true)
const isSubmitted = ref(false)
const remainingSeconds = ref(0)
let timerInterval: ReturnType<typeof setInterval> | null = null

const answeredCount = computed(() => {
  return questions.value.filter(q => answers[q.id] != null).length
})

function getQuestionTagType(type: string): 'key' | 'difficult' | 'high-frequency' | 'default' {
  if (type === 'A1') return 'key'
  if (type === 'A2') return 'difficult'
  return 'high-frequency'
}

function onAnswer(questionId: string, answer: string) {
  if (isSubmitted.value) return
  answers[questionId] = answer
}

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60)
  const s = seconds % 60
  return `${m}:${s.toString().padStart(2, '0')}`
}

function goBack() {
  router.push({ name: 'past-exams' })
}

function goToAnalysis() {
  router.push({ name: 'past-exam-analysis', params: { examId } })
}

async function submitExam() {
  isSubmitted.value = true
  if (timerInterval) {
    clearInterval(timerInterval)
    timerInterval = null
  }

  // Save exam result and wrong questions
  const correctCount = questions.value.filter(q => answers[q.id] === q.correctAnswer).length
  const score = Math.round((correctCount / questions.value.length) * 100)

  try {
    // TODO: Save exam record via API
    localStorage.setItem(`past-exam-${examId}-result`, JSON.stringify({
      examId,
      answers: { ...answers },
      score,
      correctCount,
      totalCount: questions.value.length,
      submittedAt: Date.now(),
    }))

    // Save wrong answers to wrong question records
    for (const q of questions.value) {
      const userAnswer = answers[q.id]
      if (userAnswer && userAnswer !== q.correctAnswer) {
        try {
          await saveWrongRecord(q)
        } catch { /* silent */ }
      }
    }
  } catch { /* silent */ }
}

async function saveWrongRecord(q: PastExamQuestion) {
  try {
    const existing = await apiGet<any>(`/api/wrong-questions/${q.id}`)
    if (existing) {
      await apiPost('/api/wrong-questions', {
        ...existing,
        wrongCount: existing.wrongCount + 1,
        lastWrongAt: Date.now(),
        lastWrongAnswer: answers[q.id] ?? '',
      })
    } else {
      await apiPost('/api/wrong-questions', {
        id: generateId('wrq'),
        questionId: q.id,
        subjectId: q.subjectId || '',
        wrongCount: 1,
        lastWrongAt: Date.now(),
        lastWrongAnswer: answers[q.id] ?? '',
        notes: '',
        isMastered: false,
      })
    }
  } catch { /* silent */ }
}

onMounted(async () => {
  try {
    const [examData, qData] = await Promise.all([
      apiGet<PastExam>(`/api/past-exams/${examId}`),
      apiGet<PastExamQuestion[]>(`/api/past-exams/${examId}/questions`),
    ])
    exam.value = examData
    questions.value = qData || []

    // Init timer
    if (exam.value) {
      remainingSeconds.value = exam.value.timeLimit * 60
      timerInterval = setInterval(() => {
        remainingSeconds.value--
        if (remainingSeconds.value <= 0) {
          submitExam()
        }
      }, 1000)
    }

    // Restore saved answers
    const saved = localStorage.getItem(`past-exam-${examId}-answers`)
    if (saved) {
      try {
        const parsed = JSON.parse(saved)
        Object.assign(answers, parsed)
      } catch { /* ignore */ }
    }
  } finally {
    isLoading.value = false
  }
})

// Auto-save answers
const autoSave = () => {
  localStorage.setItem(`past-exam-${examId}-answers`, JSON.stringify({ ...answers }))
}
const autoSaveInterval = setInterval(autoSave, 10000)

onUnmounted(() => {
  if (timerInterval) clearInterval(timerInterval)
  clearInterval(autoSaveInterval)
  autoSave()
})
</script>

<style scoped>
.page-past-exam { /* 宽度动态填充 */ }

.loading-state { display: flex; flex-direction: column; gap: 16px; }
.skel-header { height: 60px; }

/* Header */
.exam-header {
  display: flex;
  align-items: center;
  gap: 20px;
  margin-bottom: 24px;
  padding: 16px 20px;
  background: var(--tcm-bg-surface);
  border: 1px solid var(--tcm-border-light);
  border-radius: var(--tcm-radius-lg);
  flex-wrap: wrap;
  position: sticky;
  top: 0;
  z-index: 10;
}
.back-btn {
  background: none;
  border: none;
  color: var(--tcm-text-secondary);
  font-size: var(--tcm-font-sm);
  cursor: pointer;
  padding: 4px 8px;
  flex-shrink: 0;
}
.back-btn:hover { color: var(--tcm-primary-500); }
.exam-info { flex: 1; min-width: 0; }
.exam-title {
  font-family: var(--tcm-font-decorative);
  font-size: var(--tcm-font-xl);
  color: var(--tcm-text-primary);
  margin-bottom: 4px;
}
.exam-meta { font-size: var(--tcm-font-sm); color: var(--tcm-text-secondary); }
.exam-actions { display: flex; align-items: center; gap: 12px; flex-shrink: 0; }
.timer {
  font-family: var(--tcm-font-mono);
  font-size: var(--tcm-font-lg);
  font-weight: 700;
  color: var(--tcm-primary-500);
}
.timer--warn { color: var(--tcm-error); animation: pulse 1s infinite; }
@keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.5; } }

/* Question list */
.question-list {
  display: flex;
  flex-direction: column;
  gap: 24px;
  margin-bottom: 100px;
}

.question-block {
  padding: 20px;
  background: var(--tcm-bg-surface);
  border: 1px solid var(--tcm-border-light);
  border-radius: var(--tcm-radius-lg);
}

.q-header {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 12px;
}
.q-num {
  font-family: var(--tcm-font-decorative);
  font-size: var(--tcm-font-md);
  font-weight: 700;
  color: var(--tcm-primary-500);
}
.q-tag {
  font-size: var(--tcm-font-xs);
  color: var(--tcm-gold-500);
  background: var(--tcm-gold-bg);
  padding: 2px 8px;
  border-radius: 4px;
}

.q-result {
  margin-top: 12px;
  padding: 8px 16px;
  border-radius: var(--tcm-radius-sm);
  font-size: var(--tcm-font-sm);
  font-weight: 600;
}
.q-result.correct { background: #e8f5e9; color: #2e7d32; }
.q-result.wrong { background: #fbe9e7; color: #c62828; }

/* B1 placeholder styles */
.b1-placeholder { margin-top: 12px; }
.b1-stem { font-size: var(--tcm-font-sm); color: var(--tcm-text-secondary); }
.b1-note { font-size: var(--tcm-font-xs); color: var(--tcm-text-disabled); margin: 6px 0 10px; }
.b1-options { display: flex; flex-wrap: wrap; gap: 8px; }
.b1-opt {
  padding: 6px 14px;
  border: 1px solid var(--tcm-border);
  border-radius: var(--tcm-radius-sm);
  background: var(--tcm-bg-base);
  font-size: var(--tcm-font-sm);
  cursor: pointer;
  transition: all 0.15s;
  font-family: inherit;
}
.b1-opt:hover:not(:disabled) { border-color: var(--tcm-primary-400); }
.b1-opt.selected { border-color: var(--tcm-primary-500); background: var(--tcm-primary-50); color: var(--tcm-primary-700); }
.b1-opt:disabled { cursor: default; opacity: 0.7; }
.b1-correct {
  margin-top: 10px;
  font-size: var(--tcm-font-sm);
  font-weight: 600;
  color: var(--tcm-jade-500);
}

/* Bottom bar */
.bottom-bar {
  position: fixed;
  bottom: 0;
  left: 220px;
  right: 0;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 24px;
  background: var(--tcm-bg-surface);
  border-top: 1px solid var(--tcm-border-light);
  box-shadow: 0 -2px 8px rgba(0,0,0,0.06);
  z-index: 50;
}
.answer-progress { display: flex; align-items: center; gap: 12px; flex: 1; margin-right: 20px; }
.progress-bar {
  flex: 1;
  max-width: 300px;
  height: 8px;
  background: var(--tcm-border-light);
  border-radius: 4px;
  overflow: hidden;
}
.progress-fill {
  height: 100%;
  background: var(--tcm-primary-500);
  border-radius: 4px;
  transition: width 0.3s;
}

@media (max-width: 1023px) {
  .bottom-bar { left: 0; }
}
</style>
