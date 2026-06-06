<template>
  <div class="page-stats">
    <h1 class="page-title">学习统计</h1>
    <p class="page-subtitle">全面掌握学习进度，发现薄弱环节</p>

    <div v-if="isLoading" class="loading-state">
      <TcmSkeleton variant="card" />
      <TcmSkeleton variant="card" />
    </div>

    <template v-else>
      <!-- 概览卡片 -->
      <div class="overview-grid">
        <div class="overview-card">
          <div class="overview-icon overview-icon--time">
            <span>&#x23F1;</span>
          </div>
          <div class="overview-data">
            <span class="overview-value">{{ formatDuration(totalStudyTime) }}</span>
            <span class="overview-label">总学习时长</span>
          </div>
        </div>

        <div class="overview-card">
          <div class="overview-icon overview-icon--questions">
            <span>&#x270E;</span>
          </div>
          <div class="overview-data">
            <span class="overview-value">{{ totalQuestionsAnswered }}</span>
            <span class="overview-label">已答题数</span>
          </div>
        </div>

        <div class="overview-card">
          <div class="overview-icon overview-icon--exams">
            <span>&#x1F4DD;</span>
          </div>
          <div class="overview-data">
            <span class="overview-value">{{ examStats.totalExams }}</span>
            <span class="overview-label">考试次数</span>
          </div>
        </div>

        <div class="overview-card">
          <div class="overview-icon overview-icon--score">
            <span>&#x2605;</span>
          </div>
          <div class="overview-data">
            <span class="overview-value">{{ examStats.avgScore }}<span class="value-unit">分</span></span>
            <span class="overview-label">平均成绩</span>
          </div>
        </div>
      </div>

      <!-- 科目进度 -->
      <TcmCard title="科目学习进度" class="stat-section">
        <div class="subject-progress-list">
          <div
            v-for="subj in subjectProgress"
            :key="subj.id"
            class="subject-progress-item"
          >
            <div class="progress-header">
              <span class="progress-name">{{ subj.shortName }}</span>
              <span class="progress-detail">{{ subj.answered }} / {{ subj.total }} 题</span>
              <span class="progress-percent">{{ subj.percent }}%</span>
            </div>
            <TcmProgress
              :percent="subj.percent"
              :color="subj.color"
              :show-label="false"
            />
          </div>
        </div>
      </TcmCard>

      <!-- 近期考试记录 -->
      <TcmCard title="近期考试" class="stat-section">
        <div v-if="recentExams.length === 0" class="no-exams">
          <p>还没有考试记录，去完成一次模拟考试吧。</p>
          <TcmButton variant="primary" size="sm" @click="$router.push({ name: 'exam-setup' })">
            开始考试
          </TcmButton>
        </div>

        <div v-else class="exam-list">
          <div
            v-for="exam in recentExams"
            :key="exam.id"
            class="exam-item"
            @click="viewExamResult(exam.id)"
          >
            <div class="exam-item-left">
              <span
                class="exam-grade-dot"
                :style="{ background: getScoreGrade(exam.score).color }"
              ></span>
              <div class="exam-item-info">
                <span class="exam-item-name">{{ exam.scopeName }}</span>
                <span class="exam-item-time">{{ formatDateTime(exam.startTime) }}</span>
              </div>
            </div>
            <div class="exam-item-right">
              <span class="exam-item-score" :style="{ color: getScoreGrade(exam.score).color }">
                {{ exam.score }} 分
              </span>
              <TcmTag :type="exam.score >= 60 ? 'success' : 'warning'" size="sm">
                {{ getScoreGrade(exam.score).label }}
              </TcmTag>
            </div>
          </div>
        </div>
      </TcmCard>
    </template>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import TcmCard from '@/components/ui/TcmCard.vue'
import TcmButton from '@/components/ui/TcmButton.vue'
import TcmProgress from '@/components/ui/TcmProgress.vue'
import TcmTag from '@/components/ui/TcmTag.vue'
import TcmSkeleton from '@/components/ui/TcmSkeleton.vue'
import { examRepo } from '@/db/repositories/examRepo'
import { questionRepo } from '@/db/repositories/questionRepo'
import { useSubjectStore } from '@/stores/useSubjectStore'
import { formatDuration, formatDateTime } from '@/utils/date'
import { getScoreGrade } from '@/utils/exam-scoring'
import type { ExamRecord } from '@/types'

const router = useRouter()
const subjectStore = useSubjectStore()
const isLoading = ref(true)

const totalStudyTime = ref(0)
const totalQuestionsAnswered = ref(0)
const recentExams = ref<ExamRecord[]>([])

const examStats = reactive({
  totalExams: 0,
  avgScore: 0,
})

interface SubjectProgress {
  id: string
  shortName: string
  color: string
  total: number
  answered: number
  percent: number
}

const subjectProgress = ref<SubjectProgress[]>([])

function viewExamResult(examId: string): void {
  router.push({ name: 'exam-result', params: { examId } })
}

onMounted(async () => {
  try {
    // 加载已完成考试
    const completedExams = await examRepo.getCompleted()

    examStats.totalExams = completedExams.length

    if (completedExams.length > 0) {
      // 总学习时长
      totalStudyTime.value = completedExams.reduce((sum, e) => sum + (e.duration || 0), 0)

      // 总答题数
      totalQuestionsAnswered.value = completedExams.reduce(
        (sum, e) => sum + e.answeredQuestions,
        0,
      )

      // 平均分
      const sumScore = completedExams.reduce((sum, e) => sum + e.score, 0)
      examStats.avgScore = Math.round(sumScore / completedExams.length)

      // 近期考试（最近 10 条）
      recentExams.value = completedExams
        .sort((a, b) => b.startTime - a.startTime)
        .slice(0, 10)
    }

    // 科目进度：基于 seed subjects
    if (subjectStore.subjects.length === 0) {
      await subjectStore.loadSubjects()
    }

    const subjects = subjectStore.subjects

    const progressList: SubjectProgress[] = []
    for (const subj of subjects) {
      const total = await questionRepo.countBySubject(subj.id)
      progressList.push({
        id: subj.id,
        shortName: subj.shortName,
        color: subj.color,
        total,
        answered: 0, // 可从 exam 记录中汇总具体答题数
        percent: 0,
      })
    }

    // 计算每个科目的答题数和正确率
    if (completedExams.length > 0) {
      for (const progressItem of progressList) {
        let answered = 0
        for (const exam of completedExams) {
          if (exam.scopeId.includes(progressItem.id)) {
            answered += exam.answeredQuestions
          }
        }
        progressItem.answered = answered
        progressItem.percent = progressItem.total > 0
          ? Math.round((answered / (progressItem.total * Math.max(1, completedExams.length))) * 100)
          : 0
        if (progressItem.percent > 100) progressItem.percent = 100
      }
    }

    subjectProgress.value = progressList
  } finally {
    isLoading.value = false
  }
})
</script>

<style scoped>
.page-stats {
  /* 宽度动态填充 */
}

.page-title {
  font-family: var(--tcm-font-decorative);
  font-size: var(--tcm-font-2xl);
  color: var(--tcm-text-primary);
  margin-bottom: 8px;
}

.page-subtitle {
  font-size: var(--tcm-font-base);
  color: var(--tcm-text-secondary);
  margin-bottom: 24px;
}

.loading-state {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

/* ===== 概览卡片 ===== */
.overview-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(190px, 1fr));
  gap: 16px;
  margin-bottom: 24px;
}

.overview-card {
  display: flex;
  align-items: center;
  gap: 16px;
  background: var(--tcm-bg-surface);
  border: 1px solid var(--tcm-border-light);
  border-radius: var(--tcm-radius-lg);
  padding: 20px;
  box-shadow: var(--tcm-shadow-sm);
}

.overview-icon {
  width: 48px;
  height: 48px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 22px;
  flex-shrink: 0;
}

.overview-icon--time {
  background: #FDF0ED;
  color: var(--tcm-primary-500);
}

.overview-icon--questions {
  background: #E8F5E9;
  color: var(--tcm-jade-500);
}

.overview-icon--exams {
  background: #FFF8E1;
  color: var(--tcm-gold-500);
}

.overview-icon--score {
  background: #EDE7F6;
  color: #4527A0;
}

.overview-data {
  display: flex;
  flex-direction: column;
}

.overview-value {
  font-size: var(--tcm-font-xl);
  font-weight: 700;
  color: var(--tcm-text-primary);
  font-family: var(--tcm-font-mono);
}

.value-unit {
  font-size: var(--tcm-font-sm);
  font-weight: 400;
  color: var(--tcm-text-secondary);
}

.overview-label {
  font-size: var(--tcm-font-xs);
  color: var(--tcm-text-secondary);
  margin-top: 2px;
}

/* ===== 科目进度 ===== */
.stat-section {
  margin-bottom: 20px;
}

.subject-progress-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.subject-progress-item {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.progress-header {
  display: flex;
  align-items: center;
  gap: 8px;
}

.progress-name {
  font-size: var(--tcm-font-sm);
  font-weight: 600;
  color: var(--tcm-text-primary);
  min-width: 40px;
}

.progress-detail {
  font-size: var(--tcm-font-xs);
  color: var(--tcm-text-secondary);
  flex: 1;
}

.progress-percent {
  font-size: var(--tcm-font-sm);
  font-weight: 600;
  color: var(--tcm-text-primary);
}

/* ===== 考试列表 ===== */
.no-exams {
  text-align: center;
  padding: 24px;
}

.no-exams p {
  color: var(--tcm-text-secondary);
  font-size: var(--tcm-font-sm);
  margin: 0 0 12px 0;
}

.exam-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.exam-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 16px;
  background: var(--tcm-bg-base);
  border: 1px solid var(--tcm-border-light);
  border-radius: var(--tcm-radius-md);
  cursor: pointer;
  transition: all var(--tcm-transition-fast);
}

.exam-item:hover {
  border-color: var(--tcm-primary-300);
  background: var(--tcm-bg-elevated);
}

.exam-item-left {
  display: flex;
  align-items: center;
  gap: 12px;
}

.exam-grade-dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  flex-shrink: 0;
}

.exam-item-info {
  display: flex;
  flex-direction: column;
}

.exam-item-name {
  font-size: var(--tcm-font-sm);
  color: var(--tcm-text-primary);
  font-weight: 500;
}

.exam-item-time {
  font-size: var(--tcm-font-xs);
  color: var(--tcm-text-disabled);
}

.exam-item-right {
  display: flex;
  align-items: center;
  gap: 8px;
}

.exam-item-score {
  font-size: var(--tcm-font-md);
  font-weight: 700;
  font-family: var(--tcm-font-mono);
}

@media (max-width: 500px) {
  .overview-grid {
    grid-template-columns: repeat(2, 1fr);
  }

  .exam-item {
    flex-direction: column;
    align-items: flex-start;
    gap: 8px;
  }
}
</style>
