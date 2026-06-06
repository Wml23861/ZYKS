<template>
  <div class="page-past-exams">
    <div class="page-header">
      <h1 class="page-title">历年真题</h1>
      <p class="page-subtitle">中医执业助理医师资格考试历年真题（2018-2025）</p>
    </div>

    <div v-if="isLoading" class="loading-state">
      <TcmSkeleton variant="card" v-for="i in 4" :key="i" />
    </div>

    <template v-else-if="exams.length > 0">
      <div v-for="year in years" :key="year" class="year-section">
        <h2 class="year-title">
          <span class="year-num">{{ year }}</span>
          <span class="year-label">年真题</span>
        </h2>
        <div class="exam-cards">
          <div
            v-for="exam in getExamsByYear(year)"
            :key="exam.id"
            class="exam-card"
            @click="goToExam(exam.id)"
          >
            <div class="exam-card-header">
              <span class="exam-unit">第{{ exam.unit }}单元</span>
              <TcmTag type="high-frequency" size="sm">{{ exam.totalQuestions }}题</TcmTag>
            </div>
            <div class="exam-card-body">
              <div class="exam-meta">
                <span>⏱ {{ exam.timeLimit }}分钟</span>
                <span>📋 {{ exam.source }}</span>
              </div>
              <p class="exam-summary">{{ exam.summary || '暂无考试总结' }}</p>
            </div>
            <div class="exam-card-footer">
              <span class="start-btn">开始考试 →</span>
            </div>
          </div>
        </div>
      </div>
    </template>

    <TcmEmpty v-else description="暂无历年真题数据" />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { apiGet } from '@/utils/api-client'
import TcmTag from '@/components/ui/TcmTag.vue'
import TcmSkeleton from '@/components/ui/TcmSkeleton.vue'
import TcmEmpty from '@/components/ui/TcmEmpty.vue'

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

const router = useRouter()
const exams = ref<PastExam[]>([])
const isLoading = ref(true)

const years = computed(() => {
  const y = [...new Set(exams.value.map(e => e.year))]
  return y.sort((a, b) => b - a)
})

function getExamsByYear(year: number): PastExam[] {
  return exams.value.filter(e => e.year === year).sort((a, b) => a.unit - b.unit)
}

function goToExam(id: string) {
  router.push({ name: 'past-exam', params: { examId: id } })
}

onMounted(async () => {
  try {
    exams.value = await apiGet<PastExam[]>('/api/past-exams') || []
  } finally {
    isLoading.value = false
  }
})
</script>

<style scoped>
.page-past-exams { /* 宽度动态填充 */ }
.page-header { margin-bottom: 28px; }
.page-title {
  font-family: var(--tcm-font-decorative);
  font-size: var(--tcm-font-3xl);
  color: var(--tcm-primary-500);
  margin-bottom: 8px;
}
.page-subtitle { color: var(--tcm-text-secondary); font-size: var(--tcm-font-md); }

.loading-state { display: flex; flex-direction: column; gap: 16px; }

.year-section { margin-bottom: 32px; }
.year-title {
  display: flex;
  align-items: baseline;
  gap: 8px;
  margin-bottom: 16px;
  padding-bottom: 8px;
  border-bottom: 2px solid var(--tcm-primary-100);
}
.year-num {
  font-family: var(--tcm-font-decorative);
  font-size: var(--tcm-font-2xl);
  color: var(--tcm-primary-500);
}
.year-label { font-size: var(--tcm-font-md); color: var(--tcm-text-secondary); }

.exam-cards {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(340px, 1fr));
  gap: 16px;
}

.exam-card {
  background: var(--tcm-bg-surface);
  border: 1px solid var(--tcm-border-light);
  border-radius: var(--tcm-radius-lg);
  padding: 20px 24px;
  cursor: pointer;
  transition: all 0.2s;
}
.exam-card:hover {
  box-shadow: var(--tcm-shadow-md);
  border-color: var(--tcm-primary-300);
  transform: translateY(-2px);
}

.exam-card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}
.exam-unit {
  font-family: var(--tcm-font-decorative);
  font-size: var(--tcm-font-lg);
  font-weight: 600;
  color: var(--tcm-text-primary);
}

.exam-card-body { margin-bottom: 16px; }
.exam-meta {
  display: flex;
  gap: 16px;
  font-size: var(--tcm-font-sm);
  color: var(--tcm-text-secondary);
  margin-bottom: 8px;
}
.exam-summary {
  font-size: var(--tcm-font-sm);
  color: var(--tcm-text-secondary);
  line-height: 1.6;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.exam-card-footer { text-align: right; }
.start-btn {
  font-size: var(--tcm-font-sm);
  font-weight: 600;
  color: var(--tcm-primary-500);
}
</style>
