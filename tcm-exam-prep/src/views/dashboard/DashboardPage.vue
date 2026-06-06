<template>
  <div class="page-dashboard">
    <!-- Header -->
    <div class="dashboard-header">
      <h1 class="dashboard-title">岐黄备考</h1>
      <p class="dashboard-subtitle">中医执业助理医师考试智能学习系统</p>
    </div>

    <!-- Exam Countdown -->
    <div v-if="examDaysLeft !== null" class="exam-countdown">
      <div class="countdown-badge">
        <span class="countdown-icon">&#x1F4C5;</span>
        <span class="countdown-text">
          距离考试还有 <strong>{{ examDaysLeft }}</strong> 天
        </span>
        <span v-if="examDaysLeft <= 30" class="countdown-urgent">&#x26A0; 时间紧迫，请加紧备考</span>
        <span v-else-if="examDaysLeft <= 90" class="countdown-warn">请合理安排复习进度</span>
      </div>
    </div>

    <!-- Stats Row -->
    <div class="dashboard-stats">
      <!-- Study Streak -->
      <TcmCard class="stat-card">
        <div class="stat-value stat-streak">
          <span class="streak-icon">&#x1F525;</span>
          {{ studyStreak }}
          <span class="streak-unit">天</span>
        </div>
        <div class="stat-label">连续学习</div>
        <div v-if="studyStreak >= 7" class="streak-bonus">&#x1F389; 连续一周达成!</div>
      </TcmCard>

      <!-- Due Reviews -->
      <TcmCard class="stat-card" :hoverable="true" @click="$router.push('/flashcards/review')">
        <div class="stat-value text-tcm-jade-500">{{ dueReviews.length }}</div>
        <div class="stat-label">今日待复习</div>
      </TcmCard>

      <!-- Studied Items -->
      <TcmCard class="stat-card">
        <div class="stat-value text-tcm-gold-500">{{ totalStudied }}</div>
        <div class="stat-label">已学知识点</div>
      </TcmCard>

      <!-- Questions Bank -->
      <TcmCard class="stat-card">
        <div class="stat-value text-tcm-info">{{ totalQuestions }}</div>
        <div class="stat-label">题库总量</div>
      </TcmCard>
    </div>

    <!-- Daily Goals -->
    <div class="dashboard-section">
      <h2 class="section-title">今日目标</h2>
      <TcmCard>
        <div class="goals-list">
          <div class="goal-item">
            <div class="goal-header">
              <span class="goal-label">&#x1F4D6; 学习</span>
              <span class="goal-progress-text">{{ todayStudyCount }} / {{ dailyStudyGoal }}</span>
            </div>
            <div class="goal-bar-bg">
              <div
                class="goal-bar-fill goal-bar--study"
                :style="{ width: studyGoalPercent + '%' }"
              />
            </div>
          </div>
          <div class="goal-item">
            <div class="goal-header">
              <span class="goal-label">&#x270E; 刷题</span>
              <span class="goal-progress-text">{{ todayQuestionCount }} / {{ dailyQuestionGoal }}</span>
            </div>
            <div class="goal-bar-bg">
              <div
                class="goal-bar-fill goal-bar--quiz"
                :style="{ width: questionGoalPercent + '%' }"
              />
            </div>
          </div>
          <div class="goal-item">
            <div class="goal-header">
              <span class="goal-label">&#x1F504; 复习</span>
              <span class="goal-progress-text">{{ todayReviewCount }} / {{ dailyReviewGoal }}</span>
            </div>
            <div class="goal-bar-bg">
              <div
                class="goal-bar-fill goal-bar--review"
                :style="{ width: reviewGoalPercent + '%' }"
              />
            </div>
          </div>
        </div>
      </TcmCard>
    </div>

    <!-- Last Study Position -->
    <div v-if="lastStudyPosition" class="dashboard-section">
      <div class="last-position-card">
        <span class="last-position-label">&#x1F4CD; 继续学习</span>
        <router-link
          :to="lastStudyPosition.link"
          class="last-position-link"
        >
          {{ lastStudyPosition.subjectName }} &rsaquo; {{ lastStudyPosition.chapterName }}
          <span v-if="lastStudyPosition.sectionName">
            &rsaquo; {{ lastStudyPosition.sectionName }}
          </span>
        </router-link>
      </div>
    </div>

    <!-- Today's Review Queue -->
    <div v-if="dueReviewItems.length > 0" class="dashboard-section">
      <h2 class="section-title">
        今日待复习
        <TcmTag type="key" size="sm" class="queue-badge">
          {{ dueReviewItems.length }} 项
        </TcmTag>
      </h2>
      <TcmCard>
        <div class="review-queue">
          <div
            v-for="item in dueReviewItems.slice(0, 5)"
            :key="item.id"
            class="review-queue-item"
          >
            <div class="queue-item-info">
              <TcmTag :type="getQueueTagType(item.itemType)" size="sm">
                {{ getQueueTypeLabel(item.itemType) }}
              </TcmTag>
              <span class="queue-item-title">{{ item.title }}</span>
            </div>
            <TcmTag size="sm" class="queue-item-subject">
              {{ getSubjectShortName(item.subjectId) }}
            </TcmTag>
          </div>
          <div
            v-if="dueReviewItems.length > 5"
            class="review-queue-more"
          >
            <router-link to="/flashcards/review" class="queue-more-link">
              查看全部 {{ dueReviewItems.length }} 项待复习 &#x2192;
            </router-link>
          </div>
        </div>
      </TcmCard>
    </div>

    <!-- Today's Auto-Generated Tasks -->
    <div class="dashboard-section">
      <h2 class="section-title">今日任务</h2>
      <TcmCard>
        <div class="task-list">
          <div
            v-for="task in todayTasks"
            :key="task.id"
            class="task-item"
            :class="{ 'task-item--done': task.done }"
          >
            <span class="task-check">{{ task.done ? '&#x2705;' : '&#x25CB;' }}</span>
            <span class="task-text">{{ task.label }}</span>
            <router-link
              v-if="task.link && !task.done"
              :to="task.link"
              class="task-action"
            >
              &#x2192;
            </router-link>
          </div>
        </div>
      </TcmCard>
    </div>

    <!-- Quick Actions -->
    <div class="dashboard-section">
      <h2 class="section-title">快速开始</h2>
      <div class="quick-actions">
        <TcmCard hoverable class="quick-action-card" @click="$router.push('/subjects')">
          <div class="quick-action-icon">&#x1F4D6;</div>
          <div class="quick-action-text">
            <h3>科目学习</h3>
            <p>{{ subjects.length }}门科目 | {{ Math.floor(totalStudied / Math.max(subjects.length, 1)) }}/门平均</p>
          </div>
        </TcmCard>
        <TcmCard hoverable class="quick-action-card" @click="$router.push('/flashcards/review')">
          <div class="quick-action-icon">&#x1F0CF;</div>
          <div class="quick-action-text">
            <h3>闪卡复习</h3>
            <p>{{ dueFlashcardCount }} 张待复习 | 间隔重复</p>
          </div>
        </TcmCard>
        <TcmCard hoverable class="quick-action-card" @click="$router.push('/practice')">
          <div class="quick-action-icon">&#x270E;</div>
          <div class="quick-action-text">
            <h3>题库刷题</h3>
            <p>A1/A2/B1题型 | {{ totalQuestions }}题</p>
          </div>
        </TcmCard>
        <TcmCard hoverable class="quick-action-card" @click="$router.push('/exam/setup')">
          <div class="quick-action-icon">&#x1F3AF;</div>
          <div class="quick-action-text">
            <h3>模拟考试</h3>
            <p>{{ examCount }} 套可用试卷 | 限时模拟</p>
          </div>
        </TcmCard>
      </div>
    </div>

    <!-- Learning Progress -->
    <div class="dashboard-section" v-if="subjects.length > 0">
      <h2 class="section-title">学习进度</h2>
      <div class="subject-progress-list">
        <div
          v-for="subject in subjects.slice(0, 6)"
          :key="subject.id"
          class="subject-progress-item"
          @click="$router.push(`/subjects/${subject.id}`)"
        >
          <div class="subject-progress-name">{{ subject.shortName }}</div>
          <TcmProgress
            :percent="getSubjectProgress(subject.id)"
            :color="subject.color"
            :show-label="false"
          />
        </div>
      </div>
      <div class="view-all-link">
        <router-link to="/subjects">查看全部科目 &#x2192;</router-link>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useSubjectStore } from '@/stores/useSubjectStore'
import { useSettingsStore } from '@/stores/useSettingsStore'
import { studyRepo } from '@/db/repositories/studyRepo'
import { questionRepo as qRepo } from '@/db/repositories/questionRepo'
import { flashcardRepo } from '@/db/repositories/flashcardRepo'
import { subjectRepo } from '@/db/repositories/subjectRepo'
import { daysUntilExam } from '@/utils/date'
import type { ReviewSchedule, StudyRecord, WrongQuestionRecord, Subject, Flashcard, KnowledgePoint } from '@/types'
import TcmCard from '@/components/ui/TcmCard.vue'
import TcmTag from '@/components/ui/TcmTag.vue'
import TcmProgress from '@/components/ui/TcmProgress.vue'

// Types for queue display
interface QueueItem {
  id: string
  itemType: string
  itemId: string
  subjectId: string
  title: string
  subjectName: string
}

interface TaskItem {
  id: string
  label: string
  done: boolean
  link?: string
}

interface LastStudyPosition {
  subjectId: string
  subjectName: string
  chapterId: string
  chapterName: string
  sectionId?: string
  sectionName?: string
  link: string
}

const subjectStore = useSubjectStore()
const settingsStore = useSettingsStore()
const subjects = ref<Subject[]>([])
const dueReviews = ref<ReviewSchedule[]>([])
const totalStudied = ref(0)
const totalQuestions = ref(0)
const examCount = ref(0)
const todayStudyCount = ref(0)
const todayQuestionCount = ref(0)
const todayReviewCount = ref(0)
const dueFlashcardCount = ref(0)
const allFlashcards = ref<Flashcard[]>([])
const allKnowledgePoints = ref<KnowledgePoint[]>([])
const allStudyRecords = ref<StudyRecord[]>([])

// Study streak
const studyStreak = ref(0)

// Daily goals (hardcoded defaults)
const dailyStudyGoal = ref(20)
const dailyQuestionGoal = ref(50)
const dailyReviewGoal = ref(30)

// Exam date (local ref)
const examDate = ref<number | null>(null)

// Last study position
const lastStudyPosition = ref<LastStudyPosition | null>(null)

// Computed
const examDaysLeft = computed<number | null>(() => {
  if (!examDate.value) return null
  const days = daysUntilExam(examDate.value)
  return Math.max(0, days)
})

const studyGoalPercent = computed(() => {
  return Math.min(Math.round((todayStudyCount.value / dailyStudyGoal.value) * 100), 100)
})

const questionGoalPercent = computed(() => {
  return Math.min(Math.round((todayQuestionCount.value / dailyQuestionGoal.value) * 100), 100)
})

const reviewGoalPercent = computed(() => {
  return Math.min(Math.round((todayReviewCount.value / dailyReviewGoal.value) * 100), 100)
})

// Due review items enriched with titles
const dueReviewItems = computed<QueueItem[]>(() => {
  return dueReviews.value.map((schedule) => {
    const subject = subjects.value.find((s) => s.id === schedule.subjectId)
    const subjectName = subject?.shortName ?? schedule.subjectId
    let title = schedule.itemId

    if (schedule.itemType === 'flashcard') {
      const card = allFlashcards.value.find((f) => f.id === schedule.itemId)
      title = card?.frontContent ?? schedule.itemId
      title = title.length > 30 ? title.slice(0, 30) + '...' : title
    } else if (schedule.itemType === 'knowledgePoint') {
      const kp = allKnowledgePoints.value.find((k) => k.id === schedule.itemId)
      title = kp?.title ?? schedule.itemId
    }

    return {
      id: schedule.id,
      itemType: schedule.itemType,
      itemId: schedule.itemId,
      subjectId: schedule.subjectId,
      title,
      subjectName,
    }
  })
})

// Today's auto-generated tasks
const todayTasks = computed<TaskItem[]>(() => {
  const tasks: TaskItem[] = []

  const flashcardDueCount = dueReviews.value.filter(
    (s) => s.itemType === 'flashcard'
  ).length
  const questionDueCount = dueReviews.value.filter(
    (s) => s.itemType === 'question'
  ).length

  tasks.push({
    id: 'review-flashcards',
    label: `复习闪卡: ${flashcardDueCount} 张待复习`,
    done: flashcardDueCount === 0,
    link: flashcardDueCount > 0 ? '/flashcards/review' : undefined,
  })

  tasks.push({
    id: 'practice-questions',
    label: `刷题练习: 目标${dailyQuestionGoal.value}题, 已完成${todayQuestionCount.value}题`,
    done: todayQuestionCount.value >= dailyQuestionGoal.value,
    link: '/practice',
  })

  tasks.push({
    id: 'study-new',
    label: `学习新内容: 目标${dailyStudyGoal.value}个知识点, 已学${todayStudyCount.value}个`,
    done: todayStudyCount.value >= dailyStudyGoal.value,
    link: '/subjects',
  })

  if (questionDueCount > 0) {
    tasks.push({
      id: 'review-questions',
      label: `错题复习: ${questionDueCount} 道待复习`,
      done: false,
      link: '/practice/wrong',
    })
  }

  // If there's a last study position, encourage continuing
  if (lastStudyPosition.value) {
    tasks.push({
      id: 'continue-study',
      label: `继续学习: ${lastStudyPosition.value.subjectName} > ${lastStudyPosition.value.chapterName}`,
      done: false,
      link: lastStudyPosition.value.link,
    })
  }

  return tasks
})

onMounted(async () => {
  try {
    // Load subjects and settings
    await Promise.all([subjectStore.loadSubjects(), settingsStore.loadSettings()])
    subjects.value = subjectStore.subjects
    dailyStudyGoal.value = settingsStore.settings.dailyStudyGoal
    dailyQuestionGoal.value = settingsStore.settings.dailyQuestionGoal
    dailyReviewGoal.value = settingsStore.settings.dailyReviewGoal
    examDate.value = settingsStore.settings.examDate

    // Load last study position from localStorage
    try {
      const raw = localStorage.getItem('lastStudyPosition')
      if (raw) lastStudyPosition.value = JSON.parse(raw) as LastStudyPosition
    } catch { /* ignore */ }

    // Load due reviews
    dueReviews.value = await studyRepo.getDueReviews()
    dueFlashcardCount.value = dueReviews.value.filter((s) => s.itemType === 'flashcard').length

    // Load study records
    const records: StudyRecord[] = await studyRepo.getAllRecords()
    allStudyRecords.value = records
    totalStudied.value = records.length

    // Calculate streak from study records
    studyStreak.value = calculateStreak(records)

    // Count today's progress
    const todayStart = new Date()
    todayStart.setHours(0, 0, 0, 0)
    const todayTime = todayStart.getTime()

    const todayRecords = records.filter((r) => r.lastStudiedAt >= todayTime)
    todayStudyCount.value = todayRecords.filter((r) => r.itemType === 'knowledgePoint' || r.itemType === 'section').length
    todayReviewCount.value = todayRecords.filter((r) => r.itemType === 'flashcard').length

    // Count today's questions from wrong question records
    const wrongRecords: WrongQuestionRecord[] = await qRepo.getWrongQuestions()
    const todayWrong = wrongRecords.filter((r) => r.lastWrongAt >= todayTime)
    todayQuestionCount.value = todayWrong.length

    // Total questions
    totalQuestions.value = (await qRepo.findAll()).length

    // Load flashcards and knowledge points for display enrichment
    try {
      allFlashcards.value = await flashcardRepo.findAll()
    } catch {
      allFlashcards.value = []
    }
    try {
      allKnowledgePoints.value = await subjectRepo.getAllKnowledgePoints()
    } catch {
      allKnowledgePoints.value = []
    }

    // Exam count (placeholder)
    examCount.value = 3
  } catch {
    // Database not available, use defaults
  }
})

function calculateStreak(records: StudyRecord[]): number {
  if (records.length === 0) return 0

  const dates = new Set<string>()
  for (const r of records) {
    if (r.lastStudiedAt) {
      const d = new Date(r.lastStudiedAt)
      dates.add(`${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`)
    }
  }

  let streak = 0
  const now = new Date()
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())

  for (let i = 0; i < 365; i++) {
    const check = new Date(today)
    check.setDate(check.getDate() - i)
    const key = `${check.getFullYear()}-${check.getMonth() + 1}-${check.getDate()}`
    if (dates.has(key)) {
      streak++
    } else if (i === 0) {
      // Today may not have been studied yet, continue checking yesterday
      continue
    } else {
      break
    }
  }

  return streak
}

function getSubjectShortName(subjectId: string): string {
  return subjects.value.find((s) => s.id === subjectId)?.shortName ?? subjectId
}

function getSubjectProgress(subjectId: string): number {
  const subjectRecords = allStudyRecords.value.filter((r) => r.subjectId === subjectId)
  const chapters = subjectStore.chapters.filter((c) => c.subjectId === subjectId)
  if (chapters.length === 0) return 0
  const studiedChapters = new Set(subjectRecords.map((r) => r.itemId))
  return Math.min(Math.round((studiedChapters.size / chapters.length) * 100), 100)
}

function getQueueTagType(itemType: string): 'key' | 'difficult' | 'high-frequency' | 'default' {
  switch (itemType) {
    case 'flashcard': return 'key'
    case 'knowledgePoint': return 'high-frequency'
    case 'question': return 'difficult'
    default: return 'default'
  }
}

function getQueueTypeLabel(itemType: string): string {
  switch (itemType) {
    case 'flashcard': return '闪卡'
    case 'knowledgePoint': return '知识点'
    case 'question': return '题目'
    case 'formulaSong': return '背诵'
    default: return itemType
  }
}
</script>

<style scoped>
.page-dashboard { /* 宽度动态填充 */ }

.dashboard-header { text-align: center; padding: 32px 0; }
.dashboard-title {
  font-family: var(--tcm-font-decorative);
  font-size: var(--tcm-font-3xl);
  color: var(--tcm-primary-500);
  margin-bottom: 8px;
}
.dashboard-subtitle { color: var(--tcm-text-secondary); font-size: var(--tcm-font-md); }

/* Exam Countdown */
.exam-countdown { margin-bottom: 24px; }
.countdown-badge {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 14px 20px;
  background: linear-gradient(135deg, #FFF8E1, #FFF3CD);
  border: 1px solid var(--tcm-gold-300);
  border-radius: var(--tcm-radius-lg);
  font-size: var(--tcm-font-md);
  color: var(--tcm-gold-700);
  flex-wrap: wrap;
}
.countdown-badge strong {
  font-family: var(--tcm-font-decorative);
  font-size: var(--tcm-font-xl);
  color: var(--tcm-primary-500);
}
.countdown-icon { font-size: var(--tcm-font-xl); }
.countdown-urgent { color: var(--tcm-error); font-weight: 600; font-size: var(--tcm-font-sm); }
.countdown-warn { color: var(--tcm-warning); font-size: var(--tcm-font-sm); }

/* Stats */
.dashboard-stats { display: grid; grid-template-columns: repeat(auto-fill, minmax(220px, 1fr)); gap: 16px; margin-bottom: 32px; }

.stat-card :deep(.tcm-card-body) { text-align: center; padding: 24px 16px; }
.stat-value {
  font-size: var(--tcm-font-3xl);
  font-weight: 700;
  color: var(--tcm-primary-500);
  font-family: var(--tcm-font-decorative);
}
.stat-value.stat-streak {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 4px;
}
.streak-icon { font-size: 24px; line-height: 1; }
.streak-unit { font-size: var(--tcm-font-sm); font-weight: 400; color: var(--tcm-text-secondary); }
.stat-label { font-size: var(--tcm-font-sm); color: var(--tcm-text-secondary); margin-top: 4px; }
.streak-bonus { font-size: var(--tcm-font-xs); color: var(--tcm-gold-500); margin-top: 6px; font-weight: 600; }

.text-tcm-jade-500 { color: var(--tcm-jade-500); }
.text-tcm-gold-500 { color: var(--tcm-gold-500); }
.text-tcm-info { color: var(--tcm-info); }

/* Sections */
.dashboard-section { margin-bottom: 28px; }
.section-title {
  font-family: var(--tcm-font-decorative);
  font-size: var(--tcm-font-xl);
  color: var(--tcm-text-primary);
  margin-bottom: 14px;
  display: flex;
  align-items: center;
  gap: 10px;
}
.queue-badge { font-size: var(--tcm-font-xs); }

/* Goals */
.goals-list { display: flex; flex-direction: column; gap: 18px; }
.goal-item { display: flex; flex-direction: column; gap: 6px; }
.goal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: var(--tcm-font-sm);
}
.goal-label { font-weight: 600; color: var(--tcm-text-primary); }
.goal-progress-text { color: var(--tcm-text-secondary); font-size: var(--tcm-font-xs); }
.goal-bar-bg {
  height: 10px;
  background: var(--tcm-border-light);
  border-radius: 5px;
  overflow: hidden;
}
.goal-bar-fill {
  height: 100%;
  border-radius: 5px;
  transition: width var(--tcm-transition-normal);
}
.goal-bar--study { background: var(--tcm-primary-500); }
.goal-bar--quiz { background: var(--tcm-gold-500); }
.goal-bar--review { background: var(--tcm-jade-500); }

/* Last Position */
.last-position-card {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 14px 20px;
  background: var(--tcm-bg-surface);
  border: 1px solid var(--tcm-border-light);
  border-radius: var(--tcm-radius-md);
  flex-wrap: wrap;
}
.last-position-label { font-weight: 600; color: var(--tcm-text-secondary); font-size: var(--tcm-font-sm); flex-shrink: 0; }
.last-position-link {
  color: var(--tcm-primary-500);
  font-size: var(--tcm-font-sm);
  font-weight: 600;
  text-decoration: none;
}
.last-position-link:hover { text-decoration: underline; }

/* Review Queue */
.review-queue { display: flex; flex-direction: column; gap: 0; }
.review-queue-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 0;
  border-bottom: 1px solid var(--tcm-border-light);
  flex-wrap: wrap;
  gap: 8px;
}
.review-queue-item:last-of-type { border-bottom: none; }
.queue-item-info { display: flex; align-items: center; gap: 10px; min-width: 0; }
.queue-item-title {
  font-size: var(--tcm-font-sm);
  color: var(--tcm-text-primary);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.queue-item-subject { flex-shrink: 0; }
.review-queue-more { padding-top: 12px; }
.queue-more-link { color: var(--tcm-primary-500); font-size: var(--tcm-font-sm); text-decoration: none; }

/* Task List */
.task-list { display: flex; flex-direction: column; gap: 4px; }
.task-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 0;
  border-bottom: 1px solid var(--tcm-border-light);
  font-size: var(--tcm-font-sm);
}
.task-item:last-of-type { border-bottom: none; }
.task-item--done .task-text { color: var(--tcm-text-disabled); text-decoration: line-through; }
.task-check { font-size: 16px; flex-shrink: 0; }
.task-text { flex: 1; color: var(--tcm-text-primary); }
.task-action { color: var(--tcm-primary-500); text-decoration: none; font-weight: 600; flex-shrink: 0; }

/* Quick Actions */
.quick-actions { display: grid; grid-template-columns: repeat(auto-fill, minmax(220px, 1fr)); gap: 16px; }
.quick-action-card { cursor: pointer; }
.quick-action-icon { font-size: 32px; margin-bottom: 8px; }
.quick-action-text h3 { font-size: var(--tcm-font-md); color: var(--tcm-text-primary); margin-bottom: 4px; }
.quick-action-text p { font-size: var(--tcm-font-xs); color: var(--tcm-text-secondary); }

/* Subject Progress */
.subject-progress-list { display: flex; flex-direction: column; gap: 12px; }
.subject-progress-item {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 10px 16px;
  background: var(--tcm-bg-surface);
  border-radius: var(--tcm-radius-md);
  cursor: pointer;
  transition: background 0.2s;
}
.subject-progress-item:hover { background: var(--tcm-bg-elevated); }
.subject-progress-name {
  width: 48px;
  font-size: var(--tcm-font-sm);
  font-weight: 600;
  color: var(--tcm-text-primary);
  flex-shrink: 0;
}
.subject-progress-item :deep(.tcm-progress) { flex: 1; }
.view-all-link { margin-top: 12px; text-align: center; }
.view-all-link a { color: var(--tcm-primary-500); font-size: var(--tcm-font-sm); text-decoration: none; }
</style>
