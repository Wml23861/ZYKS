<template>
  <div class="page-analysis">
    <div v-if="isLoading" class="loading-state">
      <TcmSkeleton variant="card" v-for="i in 4" :key="i" />
    </div>

    <template v-else-if="exam">
      <!-- Header -->
      <div class="analysis-header">
        <button class="back-btn" @click="goBack">← 返回列表</button>
        <h1 class="analysis-title">{{ exam.year }}年 · 第{{ exam.unit }}单元 — 考试分析</h1>
      </div>

      <!-- Score Card -->
      <div class="score-card">
        <div class="score-main">
          <div class="score-circle" :class="scoreGradeClass">
            <span class="score-num">{{ result?.score ?? 0 }}</span>
            <span class="score-unit">分</span>
          </div>
          <div class="score-info">
            <h3>{{ scoreGradeLabel }}</h3>
            <p>正确 {{ result?.correctCount ?? 0 }} / {{ result?.totalCount ?? 0 }} 题</p>
            <p class="score-time">交卷时间: {{ formatTime(result?.submittedAt ?? 0) }}</p>
          </div>
        </div>
        <div class="score-stats">
          <div class="stat-item">
            <span class="stat-val">{{ accuracyPercent }}%</span>
            <span class="stat-lbl">正确率</span>
          </div>
          <div class="stat-item">
            <span class="stat-val">{{ wrongCount }}</span>
            <span class="stat-lbl">错题数</span>
          </div>
        </div>
      </div>

      <!-- Exam Summary -->
      <div v-if="exam.summary" class="section-card">
        <h2 class="section-title">📝 年度考试总结</h2>
        <div class="summary-text" v-html="renderedSummary"></div>
      </div>

      <!-- Key Points -->
      <div v-if="exam.keyPoints" class="section-card">
        <h2 class="section-title">🎯 重点难点分析</h2>
        <div class="summary-text" v-html="renderedKeyPoints"></div>
      </div>

      <!-- Subject Distribution -->
      <div v-if="stats" class="section-card">
        <h2 class="section-title">📊 科目考点分布</h2>
        <div class="subject-stats">
          <div
            v-for="(data, subjectId) in stats.bySubject"
            :key="subjectId"
            class="subject-stat-row"
          >
            <span class="ss-name">{{ getSubjectName(subjectId) }}</span>
            <span class="ss-count">{{ data.total }}题</span>
            <div class="ss-bar">
              <div
                class="ss-bar-fill"
                :style="{ width: (data.total / stats.totalQuestions * 100) + '%' }"
              />
            </div>
            <span class="ss-tags">
              <span v-if="data.tags['高频']" class="tag-high">高频 {{ data.tags['高频'] }}</span>
              <span v-if="data.tags['难点']" class="tag-hard">难点 {{ data.tags['难点'] }}</span>
              <span v-if="data.tags['重点']" class="tag-key">重点 {{ data.tags['重点'] }}</span>
            </span>
          </div>
        </div>
      </div>

      <!-- Wrong Questions Review -->
      <div v-if="wrongQuestions.length > 0" class="section-card">
        <h2 class="section-title">❌ 错题回顾 ({{ wrongQuestions.length }}题)</h2>
        <div class="wrong-list">
          <div v-for="q in wrongQuestions" :key="q.id" class="wrong-item">
            <div class="wrong-q-header">
              <TcmTag :type="getTagType(q.type)" size="sm">{{ q.type }}</TcmTag>
              <span class="wrong-q-stem">{{ q.questionStem }}</span>
            </div>
            <div class="wrong-q-detail">
              <span class="wrong-q-answer">你的答案: <strong class="text-error">{{ result?.answers[q.id] }}</strong></span>
              <span class="wrong-q-correct">正确答案: <strong class="text-success">{{ q.correctAnswer }}</strong></span>
            </div>
            <div v-if="q.explanation" class="wrong-q-exp" v-html="renderMd(q.explanation)"></div>
          </div>
        </div>
      </div>
    </template>

    <TcmEmpty v-else description="分析数据加载失败" />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useSubjectStore } from '@/stores/useSubjectStore'
import { apiGet } from '@/utils/api-client'
import MarkdownIt from 'markdown-it'
import TcmTag from '@/components/ui/TcmTag.vue'
import TcmSkeleton from '@/components/ui/TcmSkeleton.vue'
import TcmEmpty from '@/components/ui/TcmEmpty.vue'

interface PastExam {
  id: string; year: number; unit: number; totalQuestions: number; timeLimit: number
  summary: string; keyPoints: string; source: string
}

interface PastExamQuestion {
  id: string; type: string; subjectId: string; questionStem: string
  options: { key: string; text: string }[]
  correctAnswer: string; explanation: string; difficulty: number
  keyPointTag: string; examFrequency: number
}

interface ExamResult {
  examId: string; answers: Record<string, string>
  score: number; correctCount: number; totalCount: number; submittedAt: number
}

interface ExamStats {
  examId: string; totalQuestions: number
  bySubject: Record<string, { total: number; difficulties: number[]; tags: Record<string, number> }>
}

const route = useRoute()
const router = useRouter()
const subjectStore = useSubjectStore()
const examId = route.params.examId as string

const exam = ref<PastExam | null>(null)
const questions = ref<PastExamQuestion[]>([])
const result = ref<ExamResult | null>(null)
const stats = ref<ExamStats | null>(null)
const isLoading = ref(true)

const md = new MarkdownIt({ html: false, breaks: true })

const renderedSummary = computed(() => exam.value ? md.render(exam.value.summary) : '')
const renderedKeyPoints = computed(() => exam.value ? md.render(exam.value.keyPoints) : '')

const accuracyPercent = computed(() => {
  if (!result.value || result.value.totalCount === 0) return 0
  return Math.round((result.value.correctCount / result.value.totalCount) * 100)
})

const wrongCount = computed(() => {
  if (!result.value) return 0
  return result.value.totalCount - result.value.correctCount
})

const wrongQuestions = computed(() => {
  if (!result.value || !questions.value.length) return []
  return questions.value.filter(q => {
    const ans = result.value!.answers[q.id]
    return ans && ans !== q.correctAnswer
  })
})

const scoreGradeClass = computed(() => {
  const s = accuracyPercent.value
  if (s >= 80) return 'grade-excellent'
  if (s >= 60) return 'grade-pass'
  return 'grade-fail'
})

const scoreGradeLabel = computed(() => {
  const s = accuracyPercent.value
  if (s >= 80) return '优秀'
  if (s >= 60) return '合格'
  return '需努力'
})

function getSubjectName(subjectId: string): string {
  const names: Record<string, string> = {
    'basic-theory': '中医基础理论', 'diagnostics': '中医诊断学',
    'herbology': '中药学', 'formulas': '方剂学',
    'internal-medicine': '中医内科学', 'acupuncture': '针灸学',
    'gynecology': '中医妇科学', 'pediatrics': '中医儿科学',
    'western-medicine': '西医基础', 'ethics-law': '伦理法规',
  }
  return names[subjectId] || subjectId
}

function getTagType(type: string): 'key' | 'difficult' | 'high-frequency' | 'default' {
  if (type === 'A1') return 'key'
  if (type === 'A2') return 'difficult'
  return 'high-frequency'
}

function formatTime(ts: number): string {
  return new Date(ts).toLocaleString('zh-CN')
}

function renderMd(text: string): string {
  return md.render(text)
}

function goBack() {
  router.push({ name: 'past-exams' })
}

onMounted(async () => {
  try {
    if (subjectStore.subjects.length === 0) {
      await subjectStore.loadSubjects()
    }

    const [examData, qData, statsData] = await Promise.all([
      apiGet<PastExam>(`/api/past-exams/${examId}`),
      apiGet<PastExamQuestion[]>(`/api/past-exams/${examId}/answers`),
      apiGet<ExamStats>(`/api/past-exams/${examId}/stats`),
    ])

    exam.value = examData
    questions.value = qData || []
    stats.value = statsData

    const saved = localStorage.getItem(`past-exam-${examId}-result`)
    if (saved) {
      result.value = JSON.parse(saved) as ExamResult
    }
  } finally {
    isLoading.value = false
  }
})
</script>

<style scoped>
.page-analysis { /* 宽度动态填充 */ max-width: 1000px; }

.loading-state { display: flex; flex-direction: column; gap: 16px; }

/* Header */
.analysis-header { margin-bottom: 24px; }
.back-btn {
  background: none; border: none; color: var(--tcm-text-secondary);
  font-size: var(--tcm-font-sm); cursor: pointer; padding: 4px 8px; margin-bottom: 8px;
}
.back-btn:hover { color: var(--tcm-primary-500); }
.analysis-title {
  font-family: var(--tcm-font-decorative); font-size: var(--tcm-font-2xl);
  color: var(--tcm-text-primary);
}

/* Score Card */
.score-card {
  display: flex; align-items: center; justify-content: space-between;
  padding: 28px 32px; background: var(--tcm-bg-surface);
  border: 2px solid var(--tcm-border-light); border-radius: var(--tcm-radius-lg);
  margin-bottom: 24px; flex-wrap: wrap; gap: 20px;
}
.score-main { display: flex; align-items: center; gap: 24px; }
.score-circle {
  width: 96px; height: 96px; border-radius: 50%;
  display: flex; flex-direction: column; align-items: center; justify-content: center;
  border: 4px solid;
}
.grade-excellent { border-color: var(--tcm-jade-500); color: var(--tcm-jade-500); }
.grade-pass { border-color: var(--tcm-primary-500); color: var(--tcm-primary-500); }
.grade-fail { border-color: var(--tcm-error); color: var(--tcm-error); }
.score-num { font-size: 32px; font-weight: 700; font-family: var(--tcm-font-mono); }
.score-unit { font-size: var(--tcm-font-xs); }
.score-info h3 { font-size: var(--tcm-font-lg); color: var(--tcm-text-primary); margin-bottom: 4px; }
.score-info p { font-size: var(--tcm-font-sm); color: var(--tcm-text-secondary); }
.score-time { font-size: var(--tcm-font-xs); color: var(--tcm-text-disabled); }
.score-stats { display: flex; gap: 24px; }
.stat-item { text-align: center; }
.stat-val { font-size: var(--tcm-font-2xl); font-weight: 700; color: var(--tcm-text-primary); font-family: var(--tcm-font-mono); display: block; }
.stat-lbl { font-size: var(--tcm-font-xs); color: var(--tcm-text-secondary); }

/* Section cards */
.section-card {
  background: var(--tcm-bg-surface); border: 1px solid var(--tcm-border-light);
  border-radius: var(--tcm-radius-lg); padding: 24px; margin-bottom: 20px;
}
.section-title {
  font-family: var(--tcm-font-decorative); font-size: var(--tcm-font-lg);
  color: var(--tcm-text-primary); margin-bottom: 16px;
}
.summary-text { font-size: var(--tcm-font-sm); line-height: 1.8; color: var(--tcm-text-secondary); }
.summary-text :deep(h3) { color: var(--tcm-primary-700); margin: 12px 0 6px; }
.summary-text :deep(ul) { padding-left: 20px; }
.summary-text :deep(li) { margin-bottom: 6px; }

/* Subject stats */
.subject-stats { display: flex; flex-direction: column; gap: 12px; }
.subject-stat-row { display: flex; align-items: center; gap: 12px; }
.ss-name { width: 100px; font-size: var(--tcm-font-sm); font-weight: 600; color: var(--tcm-text-primary); flex-shrink: 0; }
.ss-count { font-size: var(--tcm-font-sm); color: var(--tcm-text-secondary); flex-shrink: 0; min-width: 36px; text-align: right; }
.ss-bar { flex: 1; height: 8px; background: var(--tcm-border-light); border-radius: 4px; overflow: hidden; }
.ss-bar-fill { height: 100%; background: var(--tcm-primary-400); border-radius: 4px; }
.ss-tags { display: flex; gap: 4px; flex-shrink: 0; }
.tag-high { font-size: 11px; padding: 1px 6px; border-radius: 3px; background: #fbe9e7; color: #c62828; }
.tag-hard { font-size: 11px; padding: 1px 6px; border-radius: 3px; background: #fff3e0; color: #e65100; }
.tag-key { font-size: 11px; padding: 1px 6px; border-radius: 3px; background: #e8eaf6; color: #283593; }

/* Wrong questions */
.wrong-list { display: flex; flex-direction: column; gap: 16px; }
.wrong-item {
  padding: 16px; background: var(--tcm-bg-base);
  border: 1px solid var(--tcm-border-light); border-radius: var(--tcm-radius-md);
}
.wrong-q-header { display: flex; align-items: flex-start; gap: 10px; margin-bottom: 8px; }
.wrong-q-stem { font-size: var(--tcm-font-sm); color: var(--tcm-text-primary); line-height: 1.6; }
.wrong-q-detail { display: flex; gap: 20px; font-size: var(--tcm-font-sm); margin-bottom: 8px; }
.wrong-q-exp { font-size: var(--tcm-font-sm); color: var(--tcm-text-secondary); line-height: 1.7; padding: 10px 14px; background: #fafaf5; border-radius: var(--tcm-radius-sm); border-left: 3px solid var(--tcm-primary-300); }
.wrong-q-exp :deep(p) { margin-bottom: 6px; }

.text-error { color: var(--tcm-error); }
.text-success { color: var(--tcm-jade-500); }
</style>
