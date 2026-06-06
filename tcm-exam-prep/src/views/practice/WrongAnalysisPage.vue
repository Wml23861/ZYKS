<template>
  <div class="page-wrong-analysis">
    <div class="page-header">
      <div>
        <h1 class="page-title">错题分析</h1>
        <p class="page-subtitle">深度分析错题分布，精准定位薄弱环节，高效查漏补缺</p>
      </div>
      <TcmButton variant="primary" @click="goToTargetedReview">
        &#x1F3AF; 针对性复习
      </TcmButton>
    </div>

    <!-- Stats Summary -->
    <div class="stats-row">
      <div class="stat-box">
        <div class="stat-num stat-total">{{ totalWrong }}</div>
        <div class="stat-label">错题总数</div>
      </div>
      <div class="stat-box">
        <div class="stat-num stat-mastered">{{ masteredCount }}</div>
        <div class="stat-label">已掌握</div>
      </div>
      <div class="stat-box">
        <div class="stat-num stat-unmastered">{{ unmasteredCount }}</div>
        <div class="stat-label">待攻克</div>
      </div>
      <div class="stat-box">
        <div class="stat-num stat-rate">{{ masterRate }}</div>
        <div class="stat-label">掌握率</div>
      </div>
    </div>

    <!-- Loading -->
    <template v-if="isLoading">
      <div class="loading-area">
        <TcmSkeleton variant="card" v-for="i in 3" :key="i" />
      </div>
    </template>

    <!-- Empty -->
    <template v-else-if="totalWrong === 0">
      <TcmEmpty description="还没有错题记录，快去刷题吧" />
    </template>

    <template v-else>
      <!-- Subject Distribution -->
      <div class="chart-section">
        <h2 class="section-title">按科目分布</h2>
        <TcmCard>
          <div class="subject-chart">
            <div
              v-for="item in subjectDistributionTotal"
              :key="item.subjectId"
              class="chart-row"
              @click="selectedSubject = item.subjectId"
            >
              <div class="chart-label">
                <span
                  class="chart-dot"
                  :style="{ background: item.color }"
                />
                <span class="chart-name">{{ item.subjectName }}</span>
              </div>
              <div class="chart-bar-wrapper">
                <div
                  class="chart-bar"
                  :style="{
                    width: getBarWidth(item.count, subjectDistributionTotal) + '%',
                    background: item.color,
                  }"
                />
              </div>
              <span class="chart-count">{{ item.count }} 题</span>
            </div>
          </div>
        </TcmCard>
      </div>

      <!-- Chapter Distribution for selected subject -->
      <div v-if="selectedSubject" class="chart-section">
        <h2 class="section-title">
          {{ getSubjectName(selectedSubject) }} - 按章节分布
        </h2>
        <TcmCard>
          <div class="subject-chart">
            <div
              v-for="item in chapterDistribution"
              :key="item.chapterId"
              class="chart-row"
            >
              <div class="chart-label">
                <span class="chart-name chart-name--sm">{{ item.chapterName }}</span>
              </div>
              <div class="chart-bar-wrapper">
                <div
                  class="chart-bar chart-bar--chapter"
                  :style="{
                    width: getBarWidth(item.count, chapterDistribution) + '%',
                    background: selectedSubjectColor,
                  }"
                />
              </div>
              <span class="chart-count">{{ item.count }} 题</span>
            </div>
          </div>
        </TcmCard>

        <!-- Subject selector chips -->
        <div class="subject-chips">
          <button
            v-for="subj in subjectDistributionTotal"
            :key="subj.subjectId"
            class="chip"
            :class="{ 'chip--active': selectedSubject === subj.subjectId }"
            @click="selectedSubject = subj.subjectId"
          >
            {{ subj.subjectName }}
            <span class="chip-count">{{ subj.count }}</span>
          </button>
        </div>
      </div>

      <!-- Top 10 Most-Wrong Knowledge Points -->
      <div class="chart-section">
        <h2 class="section-title">最易错知识点 Top 10</h2>
        <TcmCard>
          <div v-if="topWrongPoints.length === 0" class="no-data">
            暂无统计数据
          </div>
          <div v-else class="kp-ranking">
            <div
              v-for="(item, index) in topWrongPoints"
              :key="item.knowledgePoint"
              class="kp-rank-item"
            >
              <span class="rank-num" :class="{ 'rank-top3': index < 3 }">
                {{ index + 1 }}
              </span>
              <div class="rank-info">
                <span class="rank-text">{{ item.knowledgePoint }}</span>
                <span class="rank-sub">{{ getSubjectName(item.subjectId) }}</span>
              </div>
              <span class="rank-count">错 {{ item.count }} 次</span>
            </div>
          </div>
        </TcmCard>
      </div>

      <!-- Accuracy Improvement Over Time -->
      <div class="chart-section">
        <h2 class="section-title">正确率变化趋势</h2>
        <TcmCard>
          <div v-if="accuracyTrend.length === 0" class="no-data">
            需要更多答题数据来显示趋势
          </div>
          <div v-else class="accuracy-trend">
            <div
              v-for="(point, index) in accuracyTrend"
              :key="index"
              class="trend-point"
            >
              <div class="trend-date">{{ point.date }}</div>
              <div class="trend-bar-wrapper">
                <div
                  class="trend-bar"
                  :style="{
                    width: point.accuracy + '%',
                    background: point.accuracy >= 60 ? 'var(--tcm-jade-500)' : 'var(--tcm-warning)',
                  }"
                />
              </div>
              <span class="trend-value">{{ point.accuracy }}%</span>
            </div>
          </div>
        </TcmCard>
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useSubjectStore } from '@/stores/useSubjectStore'
import { questionRepo } from '@/db/repositories/questionRepo'
import { formatDate } from '@/utils/date'
import type { WrongQuestionRecord, Question, Subject } from '@/types'
import TcmCard from '@/components/ui/TcmCard.vue'
import TcmButton from '@/components/ui/TcmButton.vue'
import TcmEmpty from '@/components/ui/TcmEmpty.vue'
import TcmSkeleton from '@/components/ui/TcmSkeleton.vue'

interface SubjectDistItem {
  subjectId: string
  subjectName: string
  color: string
  count: number
}

interface ChapterDistItem {
  chapterId: string
  chapterName: string
  count: number
}

interface TopWrongItem {
  knowledgePoint: string
  subjectId: string
  count: number
}

interface AccuracyPoint {
  date: string
  accuracy: number
}

const router = useRouter()
const subjectStore = useSubjectStore()

const isLoading = ref(true)
const subjects = ref<Subject[]>([])
const allQuestions = ref<Question[]>([])
const wrongRecords = ref<WrongQuestionRecord[]>([])
const selectedSubject = ref('')

const totalWrong = computed(() => wrongRecords.value.length)
const masteredCount = computed(() => wrongRecords.value.filter((r) => r.isMastered).length)
const unmasteredCount = computed(() => wrongRecords.value.filter((r) => !r.isMastered).length)
const masterRate = computed(() => {
  if (totalWrong.value === 0) return '0%'
  return Math.round((masteredCount.value / totalWrong.value) * 100) + '%'
})

const selectedSubjectColor = computed(() => {
  return subjects.value.find((s) => s.id === selectedSubject.value)?.color ?? '#C0392B'
})

// Subject distribution (all records)
const subjectDistributionTotal = computed<SubjectDistItem[]>(() => {
  const map = new Map<string, number>()
  for (const r of wrongRecords.value) {
    map.set(r.subjectId, (map.get(r.subjectId) ?? 0) + 1)
  }
  return Array.from(map.entries())
    .map(([subjectId, count]) => {
      const subject = subjects.value.find((s) => s.id === subjectId)
      return {
        subjectId,
        subjectName: subject?.shortName ?? subjectId,
        color: subject?.color ?? '#C0392B',
        count,
      }
    })
    .sort((a, b) => b.count - a.count)
    .slice(0, 10)
})

// Chapter distribution for selected subject
const chapterDistribution = computed<ChapterDistItem[]>(() => {
  if (!selectedSubject.value) return []

  const records = wrongRecords.value.filter((r) => r.subjectId === selectedSubject.value)
  const chapterMap = new Map<string, number>()

  // Try to map questions to chapters
  for (const r of records) {
    const question = allQuestions.value.find((q) => q.id === r.questionId)
    const chapterId = question?.chapterId ?? 'unknown'
    chapterMap.set(chapterId, (chapterMap.get(chapterId) ?? 0) + 1)
  }

  return Array.from(chapterMap.entries())
    .map(([chapterId, count]) => {
      return {
        chapterId,
        chapterName: chapterId === 'unknown' ? '未分类' : chapterId,
        count,
      }
    })
    .sort((a, b) => b.count - a.count)
})

// Top 10 most-wrong knowledge points
const topWrongPoints = computed<TopWrongItem[]>(() => {
  const questionMap = new Map<string, Question>()
  for (const q of allQuestions.value) {
    questionMap.set(q.id, q)
  }

  const pointMap = new Map<string, { subjectId: string; count: number }>()
  for (const r of wrongRecords.value) {
    const kp = questionMap.get(r.questionId)
    const label = kp?.questionStem?.slice(0, 30) ?? r.questionId
    const existing = pointMap.get(label)
    if (existing) {
      existing.count += r.wrongCount
    } else {
      pointMap.set(label, {
        subjectId: r.subjectId,
        count: r.wrongCount,
      })
    }
  }

  return Array.from(pointMap.entries())
    .map(([knowledgePoint, data]) => ({
      knowledgePoint,
      subjectId: data.subjectId,
      count: data.count,
    }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 10)
})

// Accuracy improvement over time (last 7 days)
const accuracyTrend = computed<AccuracyPoint[]>(() => {
  const now = new Date()
  const days: AccuracyPoint[] = []

  for (let i = 6; i >= 0; i--) {
    const target = new Date(now)
    target.setDate(target.getDate() - i)
    target.setHours(0, 0, 0, 0)
    const dayStart = target.getTime()
    target.setHours(23, 59, 59, 999)
    const dayEnd = target.getTime()

    const dayRecords = wrongRecords.value.filter(
      (r) => r.lastWrongAt >= dayStart && r.lastWrongAt <= dayEnd,
    )

    // Approximate accuracy: mastered rate on that day
    const accuracy = dayRecords.length > 0
      ? Math.round((dayRecords.filter((r) => r.isMastered).length / dayRecords.length) * 100)
      : 0

    days.push({
      date: formatDate(dayStart).slice(5), // MM-DD
      accuracy,
    })
  }

  return days
})

onMounted(async () => {
  try {
    if (subjectStore.subjects.length === 0) {
      await subjectStore.loadSubjects()
    }
    subjects.value = subjectStore.subjects
    const [qs, records] = await Promise.all([
      questionRepo.findAll(),
      questionRepo.getWrongQuestions(),
    ])
    allQuestions.value = qs
    wrongRecords.value = records
  } finally {
    isLoading.value = false
  }
})

function getBarWidth(count: number, list: { count: number }[]): number {
  const max = Math.max(...list.map((i) => i.count), 1)
  return Math.round((count / max) * 100)
}

function getSubjectName(subjectId: string): string {
  return subjects.value.find((s) => s.id === subjectId)?.shortName ?? subjectId
}

function goToTargetedReview(): void {
  // Navigate to wrong question page with weakest subject pre-selected
  if (subjectDistributionTotal.value.length > 0 && unmasteredCount.value > 0) {
    const weakestSubject = subjectDistributionTotal.value[0].subjectId
    router.push({
      name: 'wrong-questions',
      query: { subject: weakestSubject, filter: 'unmastered' },
    })
  } else {
    router.push({ name: 'wrong-questions' })
  }
}
</script>

<style scoped>
.page-wrong-analysis { /* 宽度动态填充 */ }

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 24px;
  gap: 16px;
  flex-wrap: wrap;
}
.page-title {
  font-family: var(--tcm-font-decorative);
  font-size: var(--tcm-font-2xl);
  color: var(--tcm-text-primary);
  margin-bottom: 4px;
}
.page-subtitle {
  font-size: var(--tcm-font-sm);
  color: var(--tcm-text-secondary);
}

/* Stats */
.stats-row { display: grid; grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); gap: 12px; margin-bottom: 28px; }
.stat-box {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  padding: 18px 12px;
  background: var(--tcm-bg-surface);
  border: 1px solid var(--tcm-border-light);
  border-radius: var(--tcm-radius-md);
}
.stat-num {
  font-size: var(--tcm-font-2xl);
  font-weight: 700;
  font-family: var(--tcm-font-decorative);
}
.stat-total { color: var(--tcm-primary-500); }
.stat-mastered { color: var(--tcm-jade-500); }
.stat-unmastered { color: var(--tcm-warning); }
.stat-rate { color: var(--tcm-info); }
.stat-label { font-size: var(--tcm-font-xs); color: var(--tcm-text-secondary); }

/* Loading */
.loading-area { display: flex; flex-direction: column; gap: 16px; }

/* Chart Section */
.chart-section { margin-bottom: 28px; }
.section-title {
  font-family: var(--tcm-font-decorative);
  font-size: var(--tcm-font-xl);
  color: var(--tcm-text-primary);
  margin-bottom: 14px;
}

/* Bar Chart */
.subject-chart { display: flex; flex-direction: column; gap: 14px; }
.chart-row {
  display: flex;
  align-items: center;
  gap: 12px;
  cursor: pointer;
  padding: 4px 0;
  transition: opacity var(--tcm-transition-fast);
}
.chart-row:hover { opacity: 0.8; }
.chart-label { display: flex; align-items: center; gap: 8px; width: 72px; flex-shrink: 0; }
.chart-dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  flex-shrink: 0;
}
.chart-name {
  font-size: var(--tcm-font-sm);
  color: var(--tcm-text-primary);
  font-weight: 600;
}
.chart-name--sm { font-size: var(--tcm-font-xs); }
.chart-bar-wrapper {
  flex: 1;
  height: 20px;
  background: var(--tcm-border-light);
  border-radius: 10px;
  overflow: hidden;
}
.chart-bar {
  height: 100%;
  border-radius: 10px;
  min-width: 4px;
  transition: width var(--tcm-transition-slow);
}
.chart-bar--chapter { background: var(--tcm-primary-500); }
.chart-count {
  font-size: var(--tcm-font-xs);
  color: var(--tcm-text-secondary);
  font-weight: 600;
  width: 40px;
  text-align: right;
  flex-shrink: 0;
}

/* Subject Chips */
.subject-chips {
  display: flex;
  gap: 8px;
  margin-top: 14px;
  flex-wrap: wrap;
}
.chip {
  padding: 5px 14px;
  border: 1px solid var(--tcm-border);
  border-radius: 20px;
  background: var(--tcm-bg-surface);
  color: var(--tcm-text-secondary);
  font-size: var(--tcm-font-xs);
  font-family: var(--tcm-font-family);
  cursor: pointer;
  transition: all var(--tcm-transition-fast);
}
.chip:hover { border-color: var(--tcm-primary-300); }
.chip--active { background: var(--tcm-primary-500); color: #fff; border-color: var(--tcm-primary-500); }
.chip-count {
  display: inline-block;
  margin-left: 6px;
  padding: 1px 6px;
  background: rgba(255,255,255,0.25);
  border-radius: 10px;
  font-size: 10px;
}

/* Knowledge Point Ranking */
.no-data {
  text-align: center;
  color: var(--tcm-text-disabled);
  font-size: var(--tcm-font-sm);
  padding: 24px;
}
.kp-ranking { display: flex; flex-direction: column; gap: 6px; }
.kp-rank-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px 0;
  border-bottom: 1px solid var(--tcm-border-light);
}
.kp-rank-item:last-child { border-bottom: none; }
.rank-num {
  width: 28px;
  height: 28px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: var(--tcm-font-sm);
  font-weight: 700;
  background: var(--tcm-border-light);
  color: var(--tcm-text-secondary);
  flex-shrink: 0;
}
.rank-top3 { background: var(--tcm-primary-500); color: #fff; }
.rank-info { flex: 1; min-width: 0; }
.rank-text {
  display: block;
  font-size: var(--tcm-font-sm);
  color: var(--tcm-text-primary);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.rank-sub {
  font-size: var(--tcm-font-xs);
  color: var(--tcm-text-disabled);
}
.rank-count {
  font-size: var(--tcm-font-xs);
  color: var(--tcm-error);
  font-weight: 600;
  flex-shrink: 0;
}

/* Accuracy Trend */
.accuracy-trend { display: flex; flex-direction: column; gap: 10px; }
.trend-point {
  display: flex;
  align-items: center;
  gap: 10px;
}
.trend-date {
  font-size: var(--tcm-font-xs);
  color: var(--tcm-text-secondary);
  width: 48px;
  flex-shrink: 0;
}
.trend-bar-wrapper {
  flex: 1;
  height: 14px;
  background: var(--tcm-border-light);
  border-radius: 7px;
  overflow: hidden;
}
.trend-bar {
  height: 100%;
  border-radius: 7px;
  min-width: 4px;
  transition: width var(--tcm-transition-slow);
}
.trend-value {
  font-size: var(--tcm-font-xs);
  font-weight: 600;
  width: 36px;
  text-align: right;
  flex-shrink: 0;
}
</style>
