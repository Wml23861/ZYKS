<template>
  <div class="page-practice-session">
    <!-- Loading state -->
    <template v-if="isLoading">
      <div class="session-loading">
        <TcmSkeleton variant="card" />
        <TcmSkeleton variant="text" />
        <TcmSkeleton variant="text" />
        <TcmSkeleton variant="text" />
      </div>
    </template>

    <!-- Empty state -->
    <template v-else-if="flatItems.length === 0">
      <TcmEmpty description="暂无符合条件的题目" />
      <div class="empty-actions">
        <TcmButton variant="primary" @click="goBack">返回设置</TcmButton>
      </div>
    </template>

    <!-- Session complete -->
    <template v-else-if="isComplete">
      <div class="session-complete">
        <TcmCard>
          <div class="complete-content">
            <h2 class="complete-title">练习完成</h2>
            <div class="complete-stats">
              <div class="stat-item">
                <span class="stat-number">{{ flatItems.length }}</span>
                <span class="stat-label">总题数</span>
              </div>
              <div class="stat-item">
                <span class="stat-number answered-count">{{ answeredCount }}</span>
                <span class="stat-label">已答</span>
              </div>
              <div class="stat-item">
                <span class="stat-number correct-count">{{ correctCount }}</span>
                <span class="stat-label">正确</span>
              </div>
              <div class="stat-item">
                <span class="stat-number incorrect-count">{{ incorrectCount }}</span>
                <span class="stat-label">错误</span>
              </div>
            </div>
            <TcmProgress
              :percent="accuracyPercent"
              label="正确率"
              :color="accuracyPercent >= 60 ? 'var(--tcm-jade-500)' : 'var(--tcm-error)'"
            />
            <div class="complete-actions">
              <TcmButton variant="outline" @click="resetSession">重新练习</TcmButton>
              <TcmButton variant="primary" @click="goBack">返回设置</TcmButton>
              <TcmButton variant="gold" @click="goToWrongQuestions">查看错题本</TcmButton>
            </div>
          </div>
        </TcmCard>
      </div>
    </template>

    <!-- Active session -->
    <template v-else>
      <div class="session-layout">
        <!-- Main question area -->
        <div class="session-main">
          <!-- Session header -->
          <div class="session-header">
            <div class="session-info">
              <span class="session-subject">{{ subjectName }}</span>
              <span class="session-progress">
                第 {{ currentIndex + 1 }} / {{ flatItems.length }} 题
              </span>
            </div>
            <div class="session-actions">
              <TcmButton
                variant="outline"
                size="sm"
                @click="toggleMark(currentQuestionId)"
              >
                {{ isMarked(currentQuestionId) ? '取消标记' : '标记' }}
              </TcmButton>
              <TcmButton
                variant="primary"
                size="sm"
                :disabled="!canSubmit"
                @click="submitAll"
              >
                交卷
              </TcmButton>
            </div>
          </div>

          <TcmProgress
            :percent="progressPercent"
            :color="'var(--tcm-primary-500)'"
            :show-label="false"
          />

          <!-- Question display -->
          <div class="question-area">
            <!-- A1 / A2 questions -->
            <QuestionCard
              v-if="currentItem.type === 'A1' || currentItem.type === 'A2'"
              :type="currentQuestion.type"
              :question-stem="currentQuestion.questionStem"
              :options="currentQuestion.options"
              :correct-answer="currentQuestion.correctAnswer"
              :explanation="currentQuestion.explanation"
              :difficulty="currentQuestion.difficulty"
              :exam-years="currentQuestion.examYears"
              :selected-answer="getAnswer(currentQuestion.id)"
              :show-explanation="isSubmitted"
              @select="onSelectAnswer(currentQuestion.id, $event)"
            />

            <!-- A3/A4 question group -->
            <A3A4QuestionGroup
              v-else-if="currentItem.type === 'A3' || currentItem.type === 'A4'"
              :type="currentItem.type as 'A3' | 'A4'"
              :clinical-scenario="currentA3A4Group.clinicalScenario"
              :sub-questions="currentA3A4Group.subQuestions"
              :show-results="isSubmitted"
              @answer="(qId: string, ans: string) => onSelectAnswer(qId, ans)"
            />

            <!-- B1 question group -->
            <B1QuestionGroup
              v-else
              :shared-options="currentB1Group.sharedOptions"
              :sub-questions="currentB1Group.subQuestions"
              :show-results="isSubmitted"
              @answer="(qId: string, ans: string) => onSelectAnswer(qId, ans)"
            />
          </div>

          <!-- Navigation buttons -->
          <div class="nav-buttons">
            <TcmButton
              variant="secondary"
              :disabled="currentIndex === 0"
              @click="goToPrev"
            >
              上一题
            </TcmButton>
            <TcmButton
              variant="primary"
              :disabled="currentIndex >= flatItems.length - 1"
              @click="goToNext"
            >
              下一题
            </TcmButton>
          </div>

          <!-- Post-submit review controls -->
          <div v-if="isSubmitted" class="review-actions">
            <TcmButton variant="outline" size="sm" @click="resetSession">
              重新练习
            </TcmButton>
            <TcmButton variant="gold" size="sm" @click="goToWrongQuestions">
              错题本
            </TcmButton>
          </div>
        </div>

        <!-- Sidebar: Question Navigator -->
        <aside class="session-sidebar">
          <QuestionNavigator
            :question-statuses="navigatorStatuses"
            :current-index="currentIndex"
            @go="goToIndex"
          />

          <!-- Session stats card -->
          <div class="sidebar-stats">
            <div class="sidebar-stat">
              <span class="stat-dot stat-dot--correct"></span>
              正确: {{ submittedCorrectCount }}
            </div>
            <div class="sidebar-stat">
              <span class="stat-dot stat-dot--incorrect"></span>
              错误: {{ submittedIncorrectCount }}
            </div>
            <div class="sidebar-stat">
              <span class="stat-dot stat-dot--unanswered"></span>
              未答: {{ unansweredCount }}
            </div>
          </div>
        </aside>
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted, watch } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import type { Question, QuestionFilter, QuestionType, QuestionDifficulty, WrongQuestionRecord } from '@/types'
import { useSubjectStore } from '@/stores/useSubjectStore'
import { questionRepo } from '@/db/repositories/questionRepo'
import { shuffle, pickRandom } from '@/utils/shuffle'
import { generateId } from '@/utils/id-generator'
import TcmCard from '@/components/ui/TcmCard.vue'
import TcmButton from '@/components/ui/TcmButton.vue'
import TcmProgress from '@/components/ui/TcmProgress.vue'
import TcmEmpty from '@/components/ui/TcmEmpty.vue'
import TcmSkeleton from '@/components/ui/TcmSkeleton.vue'
import QuestionCard from '@/components/question/QuestionCard.vue'
import B1QuestionGroup from '@/components/question/B1QuestionGroup.vue'
import A3A4QuestionGroup from '@/components/question/A3A4QuestionGroup.vue'
import QuestionNavigator from '@/components/question/QuestionNavigator.vue'

interface FlatItem {
  questionId: string
  type: 'A1' | 'A2' | 'B1' | 'A3' | 'A4'
  groupRootId?: string
}

interface B1GroupData {
  sharedOptions: { key: string; text: string }[]
  subQuestions: {
    id: string
    questionStem: string
    correctAnswer: string
    userAnswer?: string | null
    isCorrect?: boolean
  }[]
}

interface A3A4GroupData {
  clinicalScenario: string
  subQuestions: {
    id: string
    questionStem: string
    options: { key: string; text: string }[]
    correctAnswer: string
    explanation: string
    difficulty: number
    userAnswer?: string | null
    isCorrect?: boolean
  }[]
}

const router = useRouter()
const route = useRoute()
const subjectStore = useSubjectStore()

// --- State ---
const isLoading = ref(true)
const isSubmitted = ref(false)
const isComplete = ref(false)
const currentIndex = ref(0)
const allQuestions = ref<Question[]>([])
const flatItems = ref<FlatItem[]>([])
const answers = reactive<Record<string, string | null>>({})
const marked = reactive<Set<string>>(new Set())
const questionMap = ref<Record<string, Question>>({})

// --- Route params ---
function getQueryString(key: string): string {
  return (route.query[key] as string) || ''
}

// --- Subject name ---
const subjectName = computed(() => {
  const subjectId = getQueryString('subjectId')
  const s = subjectStore.subjects.find(s => s.id === subjectId)
  return s?.name ?? '刷题'
})

// --- Current item ---
const currentItem = computed<FlatItem>(() => flatItems.value[currentIndex.value])

const currentQuestion = computed<Question>(() => {
  return questionMap.value[currentItem.value.questionId]
})

const currentQuestionId = computed<string>(() => {
  return currentItem.value.questionId
})

// --- B1 group data ---
const b1GroupCache = new Map<string, B1GroupData>()

function buildB1GroupData(rootId: string): B1GroupData {
  const cached = b1GroupCache.get(rootId)
  if (cached) return cached

  const root = questionMap.value[rootId]
  const subIds = flatItems.value
    .filter(item => item.groupRootId === rootId)
    .map(item => item.questionId)

  const subQuestions = subIds.map(id => {
    const q = questionMap.value[id]
    return {
      id: q.id,
      questionStem: q.questionStem,
      correctAnswer: q.correctAnswer,
      userAnswer: answers[id] ?? null,
      isCorrect: isSubmitted ? answers[id] === q.correctAnswer : undefined,
    }
  })

  const data: B1GroupData = {
    sharedOptions: root.sharedOptions ?? [],
    subQuestions,
  }
  b1GroupCache.set(rootId, data)
  return data
}

const currentB1Group = computed<B1GroupData>(() => {
  if (currentItem.value.type !== 'B1' || !currentItem.value.groupRootId) {
    return { sharedOptions: [], subQuestions: [] }
  }
  return buildB1GroupData(currentItem.value.groupRootId)
})

// --- A3/A4 group data ---
const a3a4GroupCache = new Map<string, A3A4GroupData>()

function buildA3A4GroupData(rootId: string): A3A4GroupData {
  const cached = a3a4GroupCache.get(rootId)
  if (cached) return cached

  const root = questionMap.value[rootId]
  const subIds = flatItems.value
    .filter(item => item.groupRootId === rootId)
    .map(item => item.questionId)

  const subQuestions = subIds.map(id => {
    const q = questionMap.value[id]
    return {
      id: q.id,
      questionStem: q.questionStem,
      options: q.options,
      correctAnswer: q.correctAnswer,
      explanation: q.explanation,
      difficulty: q.difficulty,
      userAnswer: answers[id] ?? null,
      isCorrect: isSubmitted ? answers[id] === q.correctAnswer : undefined,
    }
  })

  const data: A3A4GroupData = {
    clinicalScenario: root?.questionStem ?? '',
    subQuestions,
  }
  a3a4GroupCache.set(rootId, data)
  return data
}

const currentA3A4Group = computed<A3A4GroupData>(() => {
  if ((currentItem.value.type !== 'A3' && currentItem.value.type !== 'A4') || !currentItem.value.groupRootId) {
    return { clinicalScenario: '', subQuestions: [] }
  }
  return buildA3A4GroupData(currentItem.value.groupRootId)
})

// --- Answer tracking ---
function getAnswer(questionId: string): string | null {
  return answers[questionId] ?? null
}

function onSelectAnswer(questionId: string, answer: string): void {
  if (isSubmitted.value) return
  answers[questionId] = answer
}

// --- Mark tracking ---
function isMarked(questionId: string): boolean {
  return marked.has(questionId)
}

function toggleMark(questionId: string): void {
  if (isSubmitted.value) return
  const newSet = new Set(marked)
  if (newSet.has(questionId)) {
    newSet.delete(questionId)
  } else {
    newSet.add(questionId)
  }
  marked.clear()
  for (const id of newSet) marked.add(id)
}

// --- Computed stats ---
const answeredCount = computed(() => {
  return flatItems.value.filter(item => answers[item.questionId] != null).length
})

const unansweredCount = computed(() => {
  return flatItems.value.length - answeredCount.value
})

const canSubmit = computed(() => {
  return answeredCount.value > 0
})

const progressPercent = computed(() => {
  if (flatItems.value.length === 0) return 0
  return (answeredCount.value / flatItems.value.length) * 100
})

const correctCount = computed(() => {
  return flatItems.value.filter(item => {
    const q = questionMap.value[item.questionId]
    return q && answers[item.questionId] === q.correctAnswer
  }).length
})

const incorrectCount = computed(() => {
  return flatItems.value.filter(item => {
    const a = answers[item.questionId]
    const q = questionMap.value[item.questionId]
    return a != null && q && a !== q.correctAnswer
  }).length
})

const submittedCorrectCount = computed(() => {
  return isSubmitted.value ? correctCount.value : 0
})

const submittedIncorrectCount = computed(() => {
  return isSubmitted.value ? incorrectCount.value : 0
})

const accuracyPercent = computed(() => {
  if (flatItems.value.length === 0) return 0
  return (correctCount.value / flatItems.value.length) * 100
})

// --- Navigator statuses ---
const navigatorStatuses = computed<('unanswered' | 'answered' | 'marked')[]>(() => {
  return flatItems.value.map(item => {
    if (isMarked(item.questionId)) return 'marked'
    if (answers[item.questionId] != null) return 'answered'
    return 'unanswered'
  })
})

// --- Navigation ---
function goToIndex(index: number): void {
  if (index >= 0 && index < flatItems.value.length) {
    currentIndex.value = index
  }
}

function goToNext(): void {
  goToIndex(currentIndex.value + 1)
}

function goToPrev(): void {
  goToIndex(currentIndex.value - 1)
}

// --- Submission ---
async function submitAll(): Promise<void> {
  isSubmitted.value = true
  b1GroupCache.clear()
  a3a4GroupCache.clear()

  // Save wrong answers
  const subjectId = getQueryString('subjectId')
  for (const item of flatItems.value) {
    const q = questionMap.value[item.questionId]
    const userAnswer = answers[item.questionId]
    if (!q || userAnswer == null) continue
    if (userAnswer !== q.correctAnswer) {
      await saveWrongRecord(q.id, subjectId, userAnswer)
    }
  }

  // Mark as complete if all questions are answered
  if (answeredCount.value === flatItems.value.length) {
    isComplete.value = true
  }
}

async function saveWrongRecord(questionId: string, subjectId: string, wrongAnswer: string): Promise<void> {
  try {
    const existing = await questionRepo.getWrongQuestion(questionId)
    if (existing) {
      const updated: WrongQuestionRecord = {
        ...existing,
        wrongCount: existing.wrongCount + 1,
        lastWrongAt: Date.now(),
        lastWrongAnswer: wrongAnswer,
      }
      await questionRepo.addWrongQuestion(updated)
    } else {
      const record: WrongQuestionRecord = {
        id: generateId('wrq'),
        questionId,
        subjectId,
        wrongCount: 1,
        lastWrongAt: Date.now(),
        lastWrongAnswer: wrongAnswer,
        notes: '',
        isMastered: false,
      }
      await questionRepo.addWrongQuestion(record)
    }
  } catch {
    // Non-critical: silently continue if wrong record save fails
  }
}

// --- Session lifecycle ---
function resetSession(): void {
  isSubmitted.value = false
  isComplete.value = false
  currentIndex.value = 0
  b1GroupCache.clear()
  a3a4GroupCache.clear()
  for (const key of Object.keys(answers)) {
    delete answers[key]
  }
  marked.clear()
}

function goBack(): void {
  router.push({ name: 'practice-setup' })
}

function goToWrongQuestions(): void {
  router.push({ name: 'wrong-questions' })
}

// --- Load questions ---
onMounted(async () => {
  await subjectStore.loadSubjects()
  await loadQuestions()
})

async function loadQuestions(): Promise<void> {
  isLoading.value = true
  try {
    const subjectId = getQueryString('subjectId')
    const typesStr = getQueryString('types')
    const difficultiesStr = getQueryString('difficulties')
    const countStr = getQueryString('count')
    const tagsFilter = getQueryString('tags')
    const allMode = getQueryString('all')

    if (!subjectId || !typesStr) {
      // 真题模式：加载所有科目的真题
      if (allMode === 'true' && tagsFilter === '真题') {
        const allQ = await questionRepo.findAll()
        const examQ = allQ.filter(q => {
          try { return (q.tags || []).includes('真题') } catch { return false }
        })
        const target = countStr ? parseInt(countStr, 10) : 150
        const finalQ = pickRandom(examQ.length > 0 ? examQ : allQ.slice(0, target), target)
        // 让后续代码处理：构建questionMap + flat items
        allQuestions.value = finalQ
        const qMap: Record<string, Question> = {}
        for (const q of finalQ) { qMap[q.id] = q }
        questionMap.value = qMap
        const items: FlatItem[] = []
        for (const q of finalQ) {
          if (!q.isGroupRoot) { items.push({ questionId: q.id, type: q.type, groupRootId: q.groupId || undefined }) }
        }
        flatItems.value = items
        currentIndex.value = 0
        marked.clear()
        a3a4GroupCache.clear()
        isLoading.value = false
        return
      }
      isLoading.value = false
      return
    }

    const types = typesStr.split(',').filter(Boolean) as QuestionType[]
    const difficulties = difficultiesStr
      ? difficultiesStr.split(',').filter(Boolean).map(Number) as QuestionDifficulty[]
      : []
    const count = countStr ? parseInt(countStr, 10) : 0

    // Fetch questions by type
    let allFetched: Question[] = []
    for (const type of types) {
      const filter: QuestionFilter = {
        subjectId,
        type,
      }
      const questions = await questionRepo.findByFilter(filter)
      allFetched = allFetched.concat(questions)
    }

    // Filter by difficulty if specified
    if (difficulties.length > 0) {
      allFetched = allFetched.filter(q => difficulties.includes(q.difficulty))
    }

    // Shuffle and pick
    allFetched = shuffle(allFetched)
    if (count > 0 && count < allFetched.length) {
      allFetched = pickRandom(allFetched, count)
    }

    allQuestions.value = allFetched

    // Build question map
    const qMap: Record<string, Question> = {}
    for (const q of allFetched) {
      qMap[q.id] = q
    }
    questionMap.value = qMap

    // Build flat display items
    const items: FlatItem[] = []
    const groupRootIds = new Set<string>()
    const subIdsByRoot: Record<string, string[]> = {}

    // First pass: identify group structure (B1 + A3 + A4)
    for (const q of allFetched) {
      if (q.type === 'B1' || q.type === 'A3' || q.type === 'A4') {
        if (q.isGroupRoot) {
          groupRootIds.add(q.id)
        } else if (q.groupId) {
          if (!subIdsByRoot[q.groupId]) {
            subIdsByRoot[q.groupId] = []
          }
          subIdsByRoot[q.groupId].push(q.id)
        }
      }
    }

    // Second pass: build flat items
    for (const q of allFetched) {
      if (q.type === 'B1' || q.type === 'A3' || q.type === 'A4') {
        if (!q.isGroupRoot) {
          items.push({
            questionId: q.id,
            type: q.type,
            groupRootId: q.groupId ?? undefined,
          })
        }
        // Skip group roots - they are not directly answerable
      } else {
        items.push({
          questionId: q.id,
          type: q.type,
        })
      }
    }

    flatItems.value = items

    // Initialize answers
    for (const item of items) {
      answers[item.questionId] = null
    }

    // Watch for completion
    watch(answeredCount, (newVal) => {
      if (newVal === flatItems.value.length && flatItems.value.length > 0 && isSubmitted.value) {
        isComplete.value = true
      }
    })
  } finally {
    isLoading.value = false
  }
}
</script>

<style scoped>
.page-practice-session {
  max-width: var(--tcm-content-max-width);
}

/* Loading */
.session-loading {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.empty-actions {
  display: flex;
  justify-content: center;
  margin-top: 24px;
}

/* Session layout */
.session-layout {
  display: grid;
  grid-template-columns: 1fr 240px;
  gap: 24px;
  align-items: start;
}
@media (max-width: 900px) {
  .session-layout {
    grid-template-columns: 1fr;
  }
}

/* Main area */
.session-main {
  min-width: 0;
}

.session-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
  flex-wrap: wrap;
  gap: 8px;
}
.session-info {
  display: flex;
  flex-direction: column;
  gap: 2px;
}
.session-subject {
  font-family: var(--tcm-font-decorative);
  font-size: var(--tcm-font-xl);
  color: var(--tcm-text-primary);
  font-weight: 600;
}
.session-progress {
  font-size: var(--tcm-font-sm);
  color: var(--tcm-text-secondary);
}
.session-actions {
  display: flex;
  gap: 8px;
}

.question-area {
  margin-top: 20px;
  padding: 24px;
  background: var(--tcm-bg-surface);
  border: 1px solid var(--tcm-border-light);
  border-radius: var(--tcm-radius-lg);
  min-height: 300px;
}

.nav-buttons {
  display: flex;
  justify-content: space-between;
  margin-top: 20px;
}

.review-actions {
  display: flex;
  gap: 8px;
  margin-top: 12px;
  justify-content: center;
}

/* Sidebar */
.session-sidebar {
  display: flex;
  flex-direction: column;
  gap: 16px;
  position: sticky;
  top: 16px;
}

.sidebar-stats {
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 12px 16px;
  background: var(--tcm-bg-surface);
  border-radius: var(--tcm-radius-md);
  font-size: var(--tcm-font-sm);
  color: var(--tcm-text-secondary);
}
.sidebar-stat {
  display: flex;
  align-items: center;
  gap: 8px;
}
.stat-dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
}
.stat-dot--correct { background: var(--tcm-success-border); }
.stat-dot--incorrect { background: var(--tcm-error); }
.stat-dot--unanswered { background: var(--tcm-border); }

/* Complete state */
.session-complete {
  max-width: 600px;
  margin: 0 auto;
}
.complete-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 20px;
  padding: 20px;
}
.complete-title {
  font-family: var(--tcm-font-decorative);
  font-size: var(--tcm-font-2xl);
  color: var(--tcm-text-primary);
}
.complete-stats {
  display: flex;
  gap: 32px;
  flex-wrap: wrap;
  justify-content: center;
}
.stat-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
}
.stat-number {
  font-size: var(--tcm-font-3xl);
  font-weight: 700;
  color: var(--tcm-primary-500);
  font-family: var(--tcm-font-decorative);
}
.stat-number.correct-count { color: var(--tcm-jade-500); }
.stat-number.incorrect-count { color: var(--tcm-error); }
.stat-number.answered-count { color: var(--tcm-gold-500); }
.stat-label {
  font-size: var(--tcm-font-xs);
  color: var(--tcm-text-secondary);
}
.complete-actions {
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
  justify-content: center;
}
</style>
