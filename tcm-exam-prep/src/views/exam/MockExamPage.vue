<template>
  <div class="page-exam">
    <!-- 顶部计时栏 -->
    <div class="exam-header" :class="{ 'time-warning': timeRemaining <= 300 }">
      <div class="header-left">
        <h1 class="exam-title">{{ examRecord?.scopeName }} - 模拟考试</h1>
      </div>
      <div class="header-center">
        <div class="timer-display" :class="{ 'timer-urgent': timeRemaining <= 300 }">
          <span class="timer-label">剩余时间</span>
          <span class="timer-value">{{ formatDuration(timeRemaining) }}</span>
        </div>
      </div>
      <div class="header-right">
        <TcmButton variant="outline" size="sm" @click="showSubmitDialog = true">
          交卷
        </TcmButton>
      </div>
    </div>

    <div class="exam-body">
      <!-- 左侧：题目区域 -->
      <div class="exam-main">
        <div v-if="currentQuestion" class="question-area">
          <!-- B1 题组处理 -->
          <template v-if="currentQuestion.type === 'B1' && currentQuestion.sharedOptions">
            <div class="b1-group">
              <div class="b1-header">
                <span class="b1-badge">B1 型题</span>
                <p class="b1-shared-stem">{{ currentQuestion.questionStem }}</p>
              </div>
              <div class="b1-options-header">
                <span
                  v-for="opt in currentQuestion.sharedOptions"
                  :key="opt.key"
                  class="shared-option-label"
                >
                  {{ opt.key }}. {{ opt.text }}
                </span>
              </div>
              <div
                v-for="(subQ, subIdx) in b1SubQuestions"
                :key="subQ.id"
                class="b1-sub-item"
                :class="{
                  'is-answered': getAnswer(subQ.id)?.userAnswer !== null,
                  'is-marked': getAnswer(subQ.id)?.isMarked,
                }"
              >
                <p class="b1-sub-stem">
                  <span class="b1-sub-number">{{ subIdx + 1 }}.</span>
                  {{ subQ.questionStem }}
                </p>
                <div class="options-list">
                  <button
                    v-for="opt in currentQuestion.sharedOptions"
                    :key="opt.key"
                    :class="[
                      'option-item',
                      { 'is-selected': getAnswer(subQ.id)?.userAnswer === opt.key },
                    ]"
                    @click="selectAnswer(subQ.id, opt.key)"
                  >
                    <span class="option-key">{{ opt.key }}</span>
                  </button>
                </div>
                <button
                  class="mark-toggle"
                  @click="toggleMark(subQ.id)"
                >
                  <span class="mark-icon">{{ getAnswer(subQ.id)?.isMarked ? '&#x2605;' : '&#x2606;' }}</span>
                  {{ getAnswer(subQ.id)?.isMarked ? '已标记' : '标记' }}
                </button>
              </div>
            </div>
          </template>

          <!-- A3/A4 题组处理 -->
          <template v-else-if="(currentQuestion.type === 'A3' || currentQuestion.type === 'A4') && currentQuestion.isGroupRoot">
            <A3A4QuestionGroup
              :type="currentQuestion.type as 'A3' | 'A4'"
              :clinical-scenario="a3a4ClinicalScenario"
              :sub-questions="a3a4GroupSubQuestions"
              :show-results="false"
              @answer="(qId: string, ans: string) => selectAnswer(qId, ans)"
            />
            <div class="mark-toggle-wrap">
              <button class="mark-toggle" @click="toggleMark(a3a4GroupSubQuestions[currentSubIdx]?.id ?? '')">
                <span class="mark-icon">{{ getAnswer(a3a4GroupSubQuestions[currentSubIdx]?.id ?? '')?.isMarked ? '\u2605' : '\u2606' }}</span>
                {{ getAnswer(a3a4GroupSubQuestions[currentSubIdx]?.id ?? '')?.isMarked ? '已标记' : '标记此题' }}
              </button>
            </div>
          </template>

          <!-- A1/A2 题型 -->
          <template v-else>
            <div class="question-card" :class="{ 'is-marked': currentQuestionAnswer?.isMarked }">
              <div class="question-header">
                <TcmTag :type="getTypeTag(currentQuestion.type)">{{ getTypeLabel(currentQuestion.type) }}</TcmTag>
                <span class="question-number">
                  第 {{ currentFlatIdx + 1 }} / {{ examRecord?.totalQuestions }} 题
                </span>
              </div>

              <div class="question-stem" v-html="currentQuestion.questionStem"></div>

              <div class="options-list options-list--vertical">
                <button
                  v-for="opt in currentQuestion.options"
                  :key="opt.key"
                  :class="[
                    'option-item option-item--full',
                    { 'is-selected': currentQuestionAnswer?.userAnswer === opt.key },
                  ]"
                  @click="selectAnswer(currentQuestion.id, opt.key)"
                >
                  <span class="option-key">{{ opt.key }}</span>
                  <span class="option-text">{{ opt.text }}</span>
                </button>
              </div>

              <div class="question-actions">
                <button class="mark-toggle" @click="toggleMark(currentQuestion.id)">
                  <span class="mark-icon">{{ currentQuestionAnswer?.isMarked ? '&#x2605;' : '&#x2606;' }}</span>
                  {{ currentQuestionAnswer?.isMarked ? '已标记' : '标记此题' }}
                </button>
              </div>
            </div>
          </template>

          <!-- 上一题/下一题导航 -->
          <div class="question-navigation">
            <TcmButton variant="secondary" size="md" :disabled="currentFlatIdx === 0" @click="goToPrev">
              上一题
            </TcmButton>
            <TcmButton variant="secondary" size="md" :disabled="currentFlatIdx >= totalCount - 1" @click="goToNext">
              下一题
            </TcmButton>
          </div>
        </div>

        <TcmEmpty v-else description="暂无题目数据" />
      </div>

      <!-- 右侧：答题卡 -->
      <div class="exam-sidebar">
        <div class="navigator-panel">
          <h3 class="navigator-title">答题卡</h3>

          <div class="navigator-stats">
            <div class="stat-item stat-answered">
              <span class="stat-count">{{ answeredCount }}</span>
              <span class="stat-label">已答</span>
            </div>
            <div class="stat-item stat-unanswered">
              <span class="stat-count">{{ totalCount - answeredCount }}</span>
              <span class="stat-label">未答</span>
            </div>
            <div class="stat-item stat-marked">
              <span class="stat-count">{{ markedCount }}</span>
              <span class="stat-label">标记</span>
            </div>
          </div>

          <div class="navigator-grid">
            <button
              v-for="(answer, idx) in flatAnswers"
              :key="answer.questionId"
              :class="[
                'nav-btn',
                {
                  'nav-btn--current': idx === currentFlatIdx,
                  'nav-btn--answered': answer.userAnswer !== null,
                  'nav-btn--marked': answer.isMarked,
                },
              ]"
              @click="goToFlatIndex(idx)"
            >
              {{ idx + 1 }}
            </button>
          </div>

          <TcmDivider />

          <div class="navigator-legend">
            <div class="legend-item">
              <span class="legend-dot legend-dot--answered"></span> 已答
            </div>
            <div class="legend-item">
              <span class="legend-dot legend-dot--unanswered"></span> 未答
            </div>
            <div class="legend-item">
              <span class="legend-dot legend-dot--marked"></span> 标记
            </div>
            <div class="legend-item">
              <span class="legend-dot legend-dot--current"></span> 当前
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 交卷确认对话框 -->
    <Teleport to="body">
      <div v-if="showSubmitDialog" class="dialog-overlay" @click.self="showSubmitDialog = false">
        <div class="dialog-confirm">
          <h3 class="dialog-title">确认交卷</h3>
          <p class="dialog-message" v-if="unansweredCount > 0">
            还有 <strong>{{ unansweredCount }}</strong> 题未答，确定交卷？
          </p>
          <p class="dialog-message" v-else>
            所有题目已作答，确定交卷？
          </p>
          <div class="dialog-actions">
            <TcmButton variant="secondary" size="md" @click="showSubmitDialog = false">继续检查</TcmButton>
            <TcmButton variant="primary" size="md" :loading="submitting" @click="submitExam">确认交卷</TcmButton>
          </div>
        </div>
      </div>
    </Teleport>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import TcmButton from '@/components/ui/TcmButton.vue'
import TcmTag from '@/components/ui/TcmTag.vue'
import TcmEmpty from '@/components/ui/TcmEmpty.vue'
import TcmDivider from '@/components/ui/TcmDivider.vue'
import A3A4QuestionGroup from '@/components/question/A3A4QuestionGroup.vue'
import { examRepo } from '@/db/repositories/examRepo'
import { questionRepo } from '@/db/repositories/questionRepo'
import { formatDuration } from '@/utils/date'
import { calculateScore } from '@/utils/exam-scoring'
import type { ExamRecord, Question, ExamAnswer } from '@/types'

const route = useRoute()
const router = useRouter()

const examId = route.params.examId as string
const examRecord = ref<ExamRecord | null>(null)
const questions = ref<Question[]>([])
const currentFlatIdx = ref(0)
const showSubmitDialog = ref(false)
const submitting = ref(false)
const timeRemaining = ref(0)
let timerInterval: ReturnType<typeof setInterval> | null = null

interface FlatItem {
  questionId: string
  userAnswer: string | null
  isCorrect: boolean
  isMarked: boolean
  timeSpent: number
}

function buildFlatAnswers(): FlatItem[] {
  if (!examRecord.value) return []
  const result: FlatItem[] = []
  const qs = questions.value
  for (const q of qs) {
    if (q.type === 'B1' && q.sharedOptions) {
      for (const sub of qs) {
        if (sub.groupId === q.id) {
          const ans = examRecord.value!.answers.find((a: ExamAnswer) => a.questionId === sub.id)
          result.push(ans ?? { questionId: sub.id, userAnswer: null, isCorrect: false, isMarked: false, timeSpent: 0 })
        }
      }
    } else if ((q.type === 'A3' || q.type === 'A4') && q.isGroupRoot) {
      for (const sub of qs) {
        if (sub.groupId === q.id) {
          const ans = examRecord.value!.answers.find((a: ExamAnswer) => a.questionId === sub.id)
          result.push(ans ?? { questionId: sub.id, userAnswer: null, isCorrect: false, isMarked: false, timeSpent: 0 })
        }
      }
    } else if (!q.groupId) {
      const ans = examRecord.value!.answers.find((a: ExamAnswer) => a.questionId === q.id)
      result.push(ans ?? { questionId: q.id, userAnswer: null, isCorrect: false, isMarked: false, timeSpent: 0 })
    }
  }
  return result
}

const flatAnswers = computed<FlatItem[]>(() => buildFlatAnswers())

function getCurrentQuestion(): Question | null {
  const flats = flatAnswers.value
  if (currentFlatIdx.value >= flats.length) return null
  const flat = flats[currentFlatIdx.value]
  if (!flat) return null
  const q = questions.value.find((q: Question) => q.id === flat.questionId)
  if (!q) return null
  if (q.groupId) {
    const root = questions.value.find((r: Question) => r.id === q.groupId)
    if (root && (root.type === 'B1' || root.type === 'A3' || root.type === 'A4')) {
      return root
    }
  }
  return q
}

const currentQuestion = computed<Question | null>(() => getCurrentQuestion())

const b1SubQuestions = computed<Question[]>(() => {
  const root = currentQuestion.value
  if (!root || root.type !== 'B1' || !root.sharedOptions) return []
  return questions.value.filter((q: Question) => q.groupId === root.id)
})

// A3/A4 group data
const a3a4ClinicalScenario = computed<string>(() => {
  const root = currentQuestion.value
  if (!root || (root.type !== 'A3' && root.type !== 'A4') || !root.isGroupRoot) return ''
  return root.questionStem
})

const a3a4GroupSubQuestions = computed<{
  id: string
  questionStem: string
  options: { key: string; text: string }[]
  correctAnswer: string
  explanation: string
  difficulty: number
  userAnswer?: string | null
  isCorrect?: boolean
}[]>(() => {
  const root = currentQuestion.value
  if (!root || (root.type !== 'A3' && root.type !== 'A4') || !root.isGroupRoot) return []
  const subs = questions.value.filter((q: Question) => q.groupId === root.id)
  return subs.map(q => {
    const ans = getAnswer(q.id)
    return {
      id: q.id,
      questionStem: q.questionStem,
      options: q.options,
      correctAnswer: q.correctAnswer,
      explanation: q.explanation,
      difficulty: q.difficulty,
      userAnswer: ans?.userAnswer ?? null,
      isCorrect: ans?.isCorrect ?? false,
    }
  })
})

const currentSubIdx = computed<number>(() => {
  const flats = flatAnswers.value
  if (currentFlatIdx.value >= flats.length) return 0
  const flat = flats[currentFlatIdx.value]
  if (!flat) return 0
  // Find the index of this sub-question within its group
  const subs = a3a4GroupSubQuestions.value
  return subs.findIndex(q => q.id === flat.questionId)
})

const totalCount = computed<number>(() => flatAnswers.value.length)
const answeredCount = computed<number>(() => flatAnswers.value.filter((fa: FlatItem) => fa.userAnswer !== null).length)
const markedCount = computed<number>(() => flatAnswers.value.filter((fa: FlatItem) => fa.isMarked).length)
const unansweredCount = computed<number>(() => totalCount.value - answeredCount.value)

const currentQuestionAnswer = computed(() => {
  const q = currentQuestion.value
  if (!q || !examRecord.value) return null
  return examRecord.value.answers.find(a => a.questionId === q.id) ?? null
})

function getAnswer(questionId: string): ExamAnswer | null {
  if (!examRecord.value) return null
  return examRecord.value.answers.find(a => a.questionId === questionId) ?? null
}

function getTypeLabel(type: string): string {
  const map: Record<string, string> = { A1: 'A1 型题', A2: 'A2 型题', B1: 'B1 型题', A3: 'A3 型题', A4: 'A4 型题' }
  return map[type] ?? type
}

function getTypeTag(type: string): 'key' | 'difficult' | 'default' {
  if (type === 'A1') return 'key'
  if (type === 'A2') return 'difficult'
  if (type === 'A3' || type === 'A4') return 'difficult'
  if (type === 'B1') return 'default'
  return 'default'
}

function selectAnswer(questionId: string, optionKey: string): void {
  if (!examRecord.value) return
  const ANSWERS = examRecord.value.answers
  const idx = ANSWERS.findIndex(a => a.questionId === questionId)
  if (idx === -1) return
  ANSWERS[idx] = { ...ANSWERS[idx], userAnswer: optionKey }
  // Re-assign to trigger reactivity
  examRecord.value = { ...examRecord.value, answers: [...ANSWERS] }
}

function toggleMark(questionId: string): void {
  if (!examRecord.value) return
  const ANSWERS = examRecord.value.answers
  const idx = ANSWERS.findIndex(a => a.questionId === questionId)
  if (idx === -1) return
  ANSWERS[idx] = { ...ANSWERS[idx], isMarked: !ANSWERS[idx].isMarked }
  examRecord.value = { ...examRecord.value, answers: [...ANSWERS] }
}

function goToPrev(): void {
  if (currentFlatIdx.value > 0) {
    currentFlatIdx.value--
  }
}

function goToNext(): void {
  if (currentFlatIdx.value < totalCount.value - 1) {
    currentFlatIdx.value++
  }
}

function goToFlatIndex(idx: number): void {
  currentFlatIdx.value = idx
}

async function submitExam(): Promise<void> {
  if (!examRecord.value) return
  submitting.value = true

  try {
    // 计算正确率
    for (const answer of examRecord.value.answers) {
      if (answer.userAnswer !== null) {
        const q = questions.value.find(q => q.id === answer.questionId)
        answer.isCorrect = q ? answer.userAnswer === q.correctAnswer : false
      }
    }

    const endTime = Date.now()
    const duration = Math.floor((endTime - examRecord.value.startTime) / 1000)
    const scoreResult = calculateScore(examRecord.value.answers, examRecord.value.totalQuestions)
    const answeredCountValue = examRecord.value.answers.filter(a => a.userAnswer !== null).length

    await examRepo.update(examId, {
      endTime,
      isCompleted: true,
      answeredQuestions: answeredCountValue,
      correctCount: scoreResult.correct,
      score: scoreResult.score,
      duration,
      answers: examRecord.value.answers,
    })

    router.push({ name: 'exam-result', params: { examId } })
  } finally {
    submitting.value = false
  }
}

function startTimer(): void {
  timerInterval = setInterval(() => {
    timeRemaining.value--
    if (timeRemaining.value <= 0) {
      if (timerInterval) clearInterval(timerInterval)
      submitExam()
    }
  }, 1000)
}

async function loadExam(): Promise<void> {
  const record = await examRepo.findById(examId)
  if (!record || record.isCompleted) {
    router.replace({ name: 'exam-result', params: { examId } })
    return
  }
  examRecord.value = record

  // 加载所有相关题目
  const allQuestions: Question[] = []
  const questionIds = record.answers.map(a => a.questionId)

  // 从 DB 加载题目
  const loaded = await questionRepo.findByFilter({ questionIds })
  allQuestions.push(...loaded)

  // 同时加载 B1/A3/A4 题组的子题目和根题目
  const groupIds = new Set<string>()
  for (const q of loaded) {
    if (q.groupId) groupIds.add(q.groupId)
    if (q.type === 'B1' && q.sharedOptions) groupIds.add(q.id)
    if ((q.type === 'A3' || q.type === 'A4') && q.isGroupRoot) groupIds.add(q.id)
  }
  // 可能需要补充加载组题子题目
  if (groupIds.size > 0) {
    for (const gid of groupIds) {
      const subs = await questionRepo.findByFilter({})
      for (const sq of subs) {
        if (sq.groupId === gid && !allQuestions.find(q => q.id === sq.id)) {
          allQuestions.push(sq)
          // 确保子题目在 answers 中
          if (!record.answers.find(a => a.questionId === sq.id)) {
            record.answers.push({
              questionId: sq.id,
              userAnswer: null,
              isCorrect: false,
              timeSpent: 0,
              isMarked: false,
            })
          }
        }
      }
    }
  }

  questions.value = allQuestions

  // 计算剩余时间
  const elapsed = Math.floor((Date.now() - record.startTime) / 1000)
  timeRemaining.value = Math.max(0, record.timeLimit - elapsed)

  // 更新 totalQuestions 以包含 B1 子题
  const actualTotal = flatAnswers.value.length
  if (actualTotal !== record.totalQuestions) {
    await examRepo.update(examId, { totalQuestions: actualTotal })
    examRecord.value = { ...examRecord.value!, totalQuestions: actualTotal }
  }

  startTimer()
}

onMounted(() => {
  loadExam()
})

onUnmounted(() => {
  if (timerInterval) clearInterval(timerInterval)
})
</script>

<style scoped>
.page-exam {
  max-width: var(--tcm-content-max-width);
  margin: 0 auto;
  min-height: calc(100vh - 120px);
}

/* ===== 顶部计时栏 ===== */
.exam-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 20px;
  background: var(--tcm-bg-surface);
  border: 1px solid var(--tcm-border-light);
  border-radius: var(--tcm-radius-lg);
  margin-bottom: 20px;
  box-shadow: var(--tcm-shadow-sm);
  transition: all var(--tcm-transition-normal);
}

.exam-header.time-warning {
  background: var(--tcm-error-bg);
  border-color: var(--tcm-error-text);
}

.exam-title {
  font-size: var(--tcm-font-md);
  font-weight: 600;
  color: var(--tcm-text-primary);
  font-family: var(--tcm-font-decorative);
  margin: 0;
}

.timer-display {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.timer-label {
  font-size: var(--tcm-font-xs);
  color: var(--tcm-text-secondary);
}

.timer-value {
  font-size: var(--tcm-font-xl);
  font-weight: 700;
  font-family: var(--tcm-font-mono);
  color: var(--tcm-text-primary);
}

.timer-display.timer-urgent .timer-value {
  color: var(--tcm-error);
  animation: pulse 1s infinite;
}

@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.5; }
}

/* ===== 主体布局 ===== */
.exam-body {
  display: flex;
  gap: 20px;
  align-items: flex-start;
}

.exam-main {
  flex: 1;
  min-width: 0;
}

.exam-sidebar {
  width: 220px;
  flex-shrink: 0;
  position: sticky;
  top: 16px;
}

/* ===== 题目卡片 ===== */
.question-card {
  background: var(--tcm-bg-surface);
  border: 1px solid var(--tcm-border-light);
  border-radius: var(--tcm-radius-lg);
  padding: 24px;
  margin-bottom: 16px;
  box-shadow: var(--tcm-shadow-sm);
}

.question-card.is-marked {
  border-color: var(--tcm-gold-300);
}

.question-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 16px;
}

.question-number {
  font-size: var(--tcm-font-sm);
  color: var(--tcm-text-secondary);
}

.question-stem {
  font-size: var(--tcm-font-md);
  color: var(--tcm-text-primary);
  line-height: var(--tcm-leading-relaxed);
  margin-bottom: 20px;
}

/* 选项 */
.options-list {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.options-list--vertical {
  flex-direction: column;
}

.option-item {
  padding: 10px 16px;
  border: 1px solid var(--tcm-border);
  border-radius: var(--tcm-radius-md);
  background: var(--tcm-bg-base);
  cursor: pointer;
  transition: all var(--tcm-transition-fast);
  font-family: var(--tcm-font-family);
  font-size: var(--tcm-font-base);
  text-align: left;
}

.option-item:hover {
  border-color: var(--tcm-primary-300);
  background: var(--tcm-bg-elevated);
}

.option-item.is-selected {
  border-color: var(--tcm-primary-500);
  background: var(--tcm-primary-50);
  color: var(--tcm-primary-700);
}

.option-item--full {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  width: 100%;
}

.option-key {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  border-radius: 50%;
  background: var(--tcm-bg-elevated);
  font-weight: 600;
  font-size: var(--tcm-font-sm);
  flex-shrink: 0;
}

.option-item.is-selected .option-key {
  background: var(--tcm-primary-100);
  color: var(--tcm-primary-700);
}

.option-text {
  line-height: 28px;
  color: var(--tcm-text-primary);
}

.question-actions {
  margin-top: 16px;
  display: flex;
  justify-content: flex-end;
}

.mark-toggle-wrap {
  margin-top: 12px;
  display: flex;
  justify-content: flex-end;
}

.mark-toggle {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 4px 12px;
  border: 1px solid var(--tcm-border-light);
  border-radius: var(--tcm-radius-sm);
  background: transparent;
  color: var(--tcm-text-secondary);
  font-size: var(--tcm-font-sm);
  font-family: var(--tcm-font-family);
  cursor: pointer;
  transition: all var(--tcm-transition-fast);
}

.mark-toggle:hover {
  border-color: var(--tcm-gold-300);
  color: var(--tcm-gold-500);
}

.mark-icon {
  font-size: 16px;
  line-height: 1;
}

/* ===== B1 题组 ===== */
.b1-group {
  background: var(--tcm-bg-surface);
  border: 1px solid var(--tcm-border-light);
  border-radius: var(--tcm-radius-lg);
  padding: 24px;
  margin-bottom: 16px;
}

.b1-header {
  margin-bottom: 16px;
}

.b1-badge {
  display: inline-block;
  padding: 2px 10px;
  background: var(--tcm-bg-elevated);
  border: 1px solid var(--tcm-border);
  border-radius: var(--tcm-radius-sm);
  font-size: var(--tcm-font-xs);
  color: var(--tcm-text-secondary);
  margin-bottom: 8px;
}

.b1-shared-stem {
  font-size: var(--tcm-font-md);
  color: var(--tcm-text-primary);
  line-height: var(--tcm-leading-relaxed);
  margin: 0;
}

.b1-options-header {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  padding: 12px;
  background: var(--tcm-bg-base);
  border-radius: var(--tcm-radius-md);
  margin-bottom: 16px;
}

.shared-option-label {
  font-size: var(--tcm-font-sm);
  color: var(--tcm-text-secondary);
  padding: 2px 8px;
  background: var(--tcm-bg-elevated);
  border-radius: var(--tcm-radius-sm);
}

.b1-sub-item {
  border: 1px solid var(--tcm-border-light);
  border-radius: var(--tcm-radius-md);
  padding: 16px;
  margin-bottom: 12px;
  transition: border-color var(--tcm-transition-fast);
}

.b1-sub-item.is-answered {
  border-color: var(--tcm-primary-300);
}

.b1-sub-item.is-marked {
  border-color: var(--tcm-gold-300);
}

.b1-sub-stem {
  font-size: var(--tcm-font-base);
  color: var(--tcm-text-primary);
  line-height: var(--tcm-leading-relaxed);
  margin: 0 0 12px 0;
}

.b1-sub-number {
  font-weight: 600;
  color: var(--tcm-primary-500);
}

/* ===== 上一题/下一题 ===== */
.question-navigation {
  display: flex;
  justify-content: space-between;
  padding: 8px 0 24px;
}

/* ===== 答题卡面板 ===== */
.navigator-panel {
  background: var(--tcm-bg-surface);
  border: 1px solid var(--tcm-border-light);
  border-radius: var(--tcm-radius-lg);
  padding: 16px;
  box-shadow: var(--tcm-shadow-sm);
}

.navigator-title {
  font-size: var(--tcm-font-base);
  font-weight: 600;
  color: var(--tcm-text-primary);
  margin: 0 0 12px 0;
  text-align: center;
}

.navigator-stats {
  display: flex;
  justify-content: space-around;
  margin-bottom: 16px;
}

.stat-item {
  text-align: center;
}

.stat-count {
  display: block;
  font-size: var(--tcm-font-2xl);
  font-weight: 700;
  font-family: var(--tcm-font-mono);
}

.stat-label {
  font-size: var(--tcm-font-xs);
  color: var(--tcm-text-secondary);
}

.stat-answered .stat-count { color: var(--tcm-jade-500); }
.stat-unanswered .stat-count { color: var(--tcm-text-disabled); }
.stat-marked .stat-count { color: var(--tcm-gold-500); }

.navigator-grid {
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  gap: 6px;
}

.nav-btn {
  width: 100%;
  aspect-ratio: 1;
  border: 1px solid var(--tcm-border-light);
  border-radius: var(--tcm-radius-sm);
  background: var(--tcm-bg-base);
  font-size: var(--tcm-font-sm);
  font-family: var(--tcm-font-family);
  font-weight: 500;
  color: var(--tcm-text-secondary);
  cursor: pointer;
  transition: all var(--tcm-transition-fast);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0;
}

.nav-btn:hover {
  border-color: var(--tcm-primary-300);
}

.nav-btn--current {
  border-color: var(--tcm-primary-500);
  background: var(--tcm-primary-50);
  color: var(--tcm-primary-700);
  font-weight: 700;
}

.nav-btn--answered {
  background: var(--tcm-success-border);
  border-color: var(--tcm-success-text);
  color: var(--tcm-text-on-primary);
}

.nav-btn--marked {
  border-color: var(--tcm-gold-500);
}

.nav-btn--marked::after {
  content: '\2605';
  position: absolute;
  font-size: 8px;
  color: var(--tcm-gold-500);
}

.navigator-legend {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 12px;
}

.legend-item {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: var(--tcm-font-xs);
  color: var(--tcm-text-secondary);
}

.legend-dot {
  width: 10px;
  height: 10px;
  border-radius: 2px;
  border: 1px solid var(--tcm-border);
}

.legend-dot--answered { background: var(--tcm-jade-300); border-color: var(--tcm-jade-500); }
.legend-dot--unanswered { background: var(--tcm-bg-base); }
.legend-dot--marked { border-color: var(--tcm-gold-500); background: var(--tcm-bg-base); }
.legend-dot--current { border-color: var(--tcm-primary-500); background: var(--tcm-primary-50); }

/* ===== 对话框 ===== */
.dialog-overlay {
  position: fixed;
  inset: 0;
  background: var(--tcm-bg-overlay);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.dialog-confirm {
  background: var(--tcm-bg-elevated);
  border-radius: var(--tcm-radius-lg);
  padding: 32px;
  max-width: 400px;
  width: 90%;
  box-shadow: var(--tcm-shadow-lg);
}

.dialog-title {
  font-family: var(--tcm-font-decorative);
  font-size: var(--tcm-font-xl);
  color: var(--tcm-text-primary);
  margin: 0 0 12px 0;
  text-align: center;
}

.dialog-message {
  font-size: var(--tcm-font-base);
  color: var(--tcm-text-secondary);
  text-align: center;
  margin: 0 0 24px 0;
}

.dialog-message strong {
  color: var(--tcm-error);
  font-size: var(--tcm-font-xl);
}

.dialog-actions {
  display: flex;
  gap: 12px;
  justify-content: center;
}

@media (max-width: 768px) {
  .exam-body {
    flex-direction: column-reverse;
  }

  .exam-sidebar {
    width: 100%;
    position: static;
  }

  .navigator-grid {
    grid-template-columns: repeat(8, 1fr);
  }
}
</style>
