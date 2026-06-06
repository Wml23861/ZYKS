<template>
  <div class="page-real-exam-entry">
    <h1 class="page-title">真实模考</h1>
    <p class="page-subtitle">模拟真实考试环境 · 4单元×150题 · 每单元120分钟</p>

    <div class="unit-cards">
      <TcmCard v-for="u in units" :key="u.id" hoverable class="unit-card" @click="startUnit(u.id)">
        <div class="unit-header">
          <span class="unit-num">第{{ u.id }}单元</span>
          <span class="unit-time">120分钟</span>
        </div>
        <p class="unit-subjects">{{ u.subjects }}</p>
        <div class="unit-meta">
          <span>{{ u.questionCount }}题</span>
          <span class="unit-arrow">&#x2192;</span>
        </div>
      </TcmCard>

      <TcmCard hoverable class="unit-card unit-card--all" @click="startAllUnits">
        <div class="unit-header">
          <span class="unit-num">连续模考</span>
          <span class="unit-time">480分钟</span>
        </div>
        <p class="unit-subjects">4个单元全部 · 600题完整模拟</p>
        <div class="unit-meta">
          <span>600题</span>
          <span class="unit-arrow">&#x2192;</span>
        </div>
      </TcmCard>
    </div>

    <div class="history-section">
      <h2 class="section-title">模考记录</h2>
      <div v-if="records.length === 0" class="no-records">
        <TcmEmpty description="还没有模考记录，开始第一次模考吧" />
      </div>
      <div v-else class="records-list">
        <div v-for="r in records" :key="r.id" class="record-item" @click="viewRecord(r.id)">
          <div class="record-main">
            <span class="record-units">{{ formatUnits(r.units) }}</span>
            <span class="record-date">{{ formatDate(r.start_time) }}</span>
          </div>
          <div class="record-stats">
            <span class="record-score" :style="{ color: getScoreColor(r.score) }">{{ r.score }}分</span>
            <span>{{ r.correct_count }}/{{ r.total_questions }}</span>
          </div>
          <span class="record-arrow">&#x2192;</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { apiGet, apiPost } from '@/utils/api-client'
import TcmCard from '@/components/ui/TcmCard.vue'
import TcmEmpty from '@/components/ui/TcmEmpty.vue'
import { formatDate } from '@/utils/date'

const router = useRouter()
const records = ref<any[]>([])

const units = [
  { id: 1, subjects: '中基·中诊·中药·方剂', questionCount: 150 },
  { id: 2, subjects: '中医内科·针灸学', questionCount: 150 },
  { id: 3, subjects: '中外·中妇·中儿', questionCount: 150 },
  { id: 4, subjects: '西医内科·诊基·传染·伦理·法规', questionCount: 150 },
]

function formatUnits(unitsJson: string): string {
  try { const u = JSON.parse(unitsJson); return u.length === 4 ? '连续模考' : `第${u.join(',')}单元` } catch { return '' }
}
function getScoreColor(s: number): string { return s >= 80 ? '#2E5E4E' : s >= 60 ? '#D4A030' : '#C0392B' }

async function startUnit(unit: number): Promise<void> {
  try {
    const data = await apiPost<any>('/api/real-exam/start', { unit: String(unit) })
    sessionStorage.setItem("real_exam_data", JSON.stringify(data)); router.push({ name: "real-exam-session", query: { examId: (data as any).examId } })
  } catch { alert('开始模考失败') }
}

async function startAllUnits(): Promise<void> {
  try {
    const data = await apiPost<any>('/api/real-exam/start', { unit: '1', allUnits: 'true' })
    sessionStorage.setItem("real_exam_data", JSON.stringify(data)); router.push({ name: "real-exam-session", query: { examId: (data as any).examId } })
  } catch { alert('开始模考失败') }
}

function viewRecord(id: string): void {
  router.push({ name: 'real-exam-result', params: { examId: id } })
}

onMounted(async () => {
  try { records.value = await apiGet<any[]>('/api/real-exam/records') } catch { records.value = [] }
})
</script>

<style scoped>
.page-real-exam-entry { max-width: 800px; }
.page-title { font-family: var(--tcm-font-decorative); font-size: var(--tcm-font-3xl); color: var(--tcm-primary-500); margin: 0 0 4px; }
.page-subtitle { color: var(--tcm-text-secondary); margin: 0 0 28px; }

.unit-cards { display: flex; flex-direction: column; gap: 12px; margin-bottom: 40px; }
.unit-card { cursor: pointer; }
.unit-card--all { border: 2px solid var(--tcm-primary-300); }
.unit-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 4px; }
.unit-num { font-weight: 700; font-size: var(--tcm-font-lg); color: var(--tcm-text-primary); font-family: var(--tcm-font-decorative); }
.unit-time { font-size: var(--tcm-font-sm); color: var(--tcm-text-secondary); }
.unit-subjects { font-size: var(--tcm-font-sm); color: var(--tcm-text-secondary); margin: 0 0 8px; }
.unit-meta { display: flex; justify-content: space-between; font-size: var(--tcm-font-xs); color: var(--tcm-text-disabled); }
.unit-arrow { font-size: 18px; }

.section-title { font-family: var(--tcm-font-decorative); font-size: var(--tcm-font-xl); margin: 0 0 16px; }
.no-records { padding: 24px; }
.records-list { display: flex; flex-direction: column; gap: 8px; }
.record-item { display: flex; align-items: center; justify-content: space-between; padding: 14px 18px; background: var(--tcm-bg-surface); border-radius: var(--tcm-radius-md); cursor: pointer; transition: background 0.2s; border: 1px solid var(--tcm-border-light); }
.record-item:hover { background: var(--tcm-bg-elevated); }
.record-main { display: flex; flex-direction: column; gap: 2px; }
.record-units { font-weight: 600; font-size: var(--tcm-font-sm); }
.record-date { font-size: var(--tcm-font-xs); color: var(--tcm-text-disabled); }
.record-stats { display: flex; align-items: center; gap: 12px; font-size: var(--tcm-font-sm); }
.record-score { font-weight: 700; font-size: var(--tcm-font-lg); }
.record-arrow { color: var(--tcm-text-disabled); }
</style>
