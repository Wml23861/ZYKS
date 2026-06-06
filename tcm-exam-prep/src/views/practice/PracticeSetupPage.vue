<template>
  <div class="page-practice-setup">
    <h1 class="page-title">题库刷题</h1>

    <TcmCard class="setup-card">
      <template #header>
        <div class="card-header-content">
          <span>刷题设置</span>
          <TcmButton variant="text" size="sm" @click="resetFilters">重置</TcmButton>
        </div>
      </template>

      <!-- 科目选择 -->
      <div class="setup-section">
        <label class="section-label">选择科目</label>
        <p class="section-hint">选择一个科目开始刷题</p>
        <div class="subject-grid">
          <button
            v-for="subject in subjects"
            :key="subject.id"
            :class="['subject-card', { active: selectedSubjectId === subject.id }]"
            @click="selectSubject(subject.id)"
          >
            <span class="subject-name">{{ subject.name }}</span>
            <span class="subject-count">{{ getQuestionCount(subject.id) }} 题</span>
          </button>
        </div>
      </div>

      <!-- 题型选择 -->
      <div class="setup-section">
        <label class="section-label">题型</label>
        <p class="section-hint">中医类别医学综合笔试包含 A1、A2、A3、A4、B1 等题型</p>
        <div class="type-chips">
          <button
            v-for="t in questionTypes"
            :key="t.value"
            :class="['type-chip', { active: selectedTypes.includes(t.value) }]"
            @click="toggleType(t.value)"
          >
            <span class="type-name">{{ t.label }}</span>
            <span class="type-desc">{{ t.desc }}</span>
          </button>
        </div>
      </div>

      <!-- 难度选择 -->
      <div class="setup-section">
        <label class="section-label">难度筛选</label>
        <p class="section-hint">不选则包含所有难度</p>
        <div class="difficulty-row">
          <button
            v-for="d in 5"
            :key="d"
            :class="['diff-btn', { active: selectedDifficulties.includes(d as QuestionDifficulty) }]"
            @click="toggleDifficulty(d as QuestionDifficulty)"
          >
            {{ d }}
          </button>
        </div>
      </div>

      <!-- 题目数量 -->
      <div class="setup-section">
        <label class="section-label">题目数量</label>
        <p class="section-hint">选择本次刷题的题目数量</p>
        <div class="count-options">
          <button
            v-for="c in countOptions"
            :key="c"
            :class="['count-btn', { active: selectedCount === c }]"
            @click="selectedCount = c"
          >
            {{ c === 0 ? '全部' : `${c} 题` }}
          </button>
        </div>
      </div>

      <!-- 筛选条件汇总 -->
      <div class="setup-section summary">
        <div class="summary-row">
          <span class="summary-label">本次刷题配置：</span>
          <span class="summary-value">
            {{ selectedSubjectName || '未选择科目' }}
            <template v-if="selectedTypes.length > 0">
              | {{ selectedTypes.join('、') }}
            </template>
            <template v-if="selectedDifficulties.length > 0">
              | 难度 {{ selectedDifficulties.join('、') }}
            </template>
            | {{ selectedCount === 0 ? '全部题目' : `${selectedCount} 题` }}
          </span>
        </div>
      </div>

      <div class="setup-actions">
        <TcmButton
          variant="primary"
          size="lg"
          block
          :disabled="!canStart"
          @click="startPractice"
        >
          开始刷题
        </TcmButton>
      </div>
    </TcmCard>

    <!-- 快捷入口 -->
    <div class="quick-links">
      <TcmCard hoverable @click="goToPastExams">
        <div class="quick-link-content">
          <span class="quick-link-title">历年真题</span>
          <span class="quick-link-desc">2020-2024年真题练习 (4单元)</span>
          <span class="quick-link-arrow">&#x2192;</span>
        </div>
      </TcmCard>
      <TcmCard hoverable @click="goToWrongQuestions">
        <div class="quick-link-content">
          <span class="quick-link-title">错题本</span>
          <span class="quick-link-desc">查看和复习做错的题目</span>
          <span class="quick-link-arrow">&#x2192;</span>
        </div>
      </TcmCard>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import type { QuestionType, QuestionDifficulty } from '@/types'
import { useSubjectStore } from '@/stores/useSubjectStore'
import { questionRepo } from '@/db/repositories/questionRepo'
import TcmCard from '@/components/ui/TcmCard.vue'
import TcmButton from '@/components/ui/TcmButton.vue'

const router = useRouter()
const subjectStore = useSubjectStore()

const selectedSubjectId = ref<string>('')
const selectedTypes = ref<QuestionType[]>([])
const selectedDifficulties = ref<QuestionDifficulty[]>([])
const selectedCount = ref<number>(20)
const questionCounts = ref<Record<string, number>>({})

const questionTypes: { label: string; value: QuestionType; desc: string }[] = [
  { label: 'A1 型题', value: 'A1', desc: '单句型最佳选择题' },
  { label: 'A2 型题', value: 'A2', desc: '病例摘要型最佳选择题' },
  { label: 'A3 型题', value: 'A3', desc: '病例组型最佳选择题' },
  { label: 'A4 型题', value: 'A4', desc: '病例串型最佳选择题' },
  { label: 'B1 型题', value: 'B1', desc: '标准配伍题' },
]

const countOptions = [10, 20, 30, 50, 100, 0]

const subjects = computed(() => subjectStore.subjects)
const selectedSubjectName = computed(() => {
  const s = subjects.value.find(s => s.id === selectedSubjectId.value)
  return s?.name ?? ''
})

const canStart = computed(() => {
  return selectedSubjectId.value !== '' && selectedTypes.value.length > 0
})

onMounted(async () => {
  if (subjectStore.subjects.length === 0) {
    await subjectStore.loadSubjects()
  }
  await loadQuestionCounts()
})

async function loadQuestionCounts(): Promise<void> {
  const counts: Record<string, number> = {}
  for (const subject of subjectStore.subjects) {
    counts[subject.id] = await questionRepo.countBySubject(subject.id)
  }
  questionCounts.value = counts
}

function getQuestionCount(subjectId: string): number {
  return questionCounts.value[subjectId] ?? 0
}

function selectSubject(subjectId: string): void {
  selectedSubjectId.value = subjectId
}

function toggleType(type: QuestionType): void {
  const idx = selectedTypes.value.indexOf(type)
  if (idx >= 0) {
    selectedTypes.value = selectedTypes.value.filter(t => t !== type)
  } else {
    selectedTypes.value = [...selectedTypes.value, type]
  }
}

function toggleDifficulty(d: QuestionDifficulty): void {
  const idx = selectedDifficulties.value.indexOf(d)
  if (idx >= 0) {
    selectedDifficulties.value = selectedDifficulties.value.filter(x => x !== d)
  } else {
    selectedDifficulties.value = [...selectedDifficulties.value, d]
  }
}

function resetFilters(): void {
  selectedSubjectId.value = ''
  selectedTypes.value = []
  selectedDifficulties.value = []
  selectedCount.value = 20
}

function startPractice(): void {
  const params: Record<string, string> = {
    subjectId: selectedSubjectId.value,
    types: selectedTypes.value.join(','),
    count: String(selectedCount.value),
  }
  if (selectedDifficulties.value.length > 0) {
    params.difficulties = selectedDifficulties.value.join(',')
  }
  router.push({ name: 'practice-session', query: params })
}

function goToPastExams(): void {
  router.push({ name: 'practice-session', query: { tags: '真题', all: 'true' } })
}

function goToWrongQuestions(): void {
  router.push({ name: 'wrong-questions' })
}
</script>

<style scoped>
.page-practice-setup {
  /* 宽度动态填充 */
}
.page-title {
  font-family: var(--tcm-font-decorative);
  font-size: var(--tcm-font-2xl);
  color: var(--tcm-text-primary);
  margin-bottom: 24px;
}

.setup-card {
  margin-bottom: 24px;
}
.card-header-content {
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
  font-size: var(--tcm-font-lg);
  font-weight: 600;
  color: var(--tcm-text-primary);
  font-family: var(--tcm-font-decorative);
}

.setup-section {
  margin-bottom: 28px;
}
.setup-section:last-child {
  margin-bottom: 0;
}
.section-label {
  font-size: var(--tcm-font-base);
  font-weight: 600;
  color: var(--tcm-text-primary);
  display: block;
  margin-bottom: 4px;
}
.section-hint {
  font-size: var(--tcm-font-xs);
  color: var(--tcm-text-secondary);
  margin-bottom: 12px;
}

/* 科目选择 */
.subject-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
  gap: 10px;
}
.subject-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  padding: 16px;
  border: 2px solid var(--tcm-border-light);
  border-radius: var(--tcm-radius-md);
  background: var(--tcm-bg-base);
  cursor: pointer;
  transition: all var(--tcm-transition-fast);
  font-family: var(--tcm-font-family);
}
.subject-card:hover {
  border-color: var(--tcm-primary-300);
}
.subject-card.active {
  border-color: var(--tcm-primary-500);
  background: #FDF0ED;
}
.subject-name {
  font-size: var(--tcm-font-base);
  font-weight: 600;
  color: var(--tcm-text-primary);
}
.subject-count {
  font-size: var(--tcm-font-xs);
  color: var(--tcm-text-secondary);
}

/* 题型选择 */
.type-chips {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
}
.type-chip {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2px;
  padding: 12px 20px;
  border: 2px solid var(--tcm-border-light);
  border-radius: var(--tcm-radius-md);
  background: var(--tcm-bg-base);
  cursor: pointer;
  transition: all var(--tcm-transition-fast);
  font-family: var(--tcm-font-family);
}
.type-chip:hover {
  border-color: var(--tcm-primary-300);
}
.type-chip.active {
  border-color: var(--tcm-primary-500);
  background: #FDF0ED;
}
.type-name {
  font-size: var(--tcm-font-md);
  font-weight: 600;
  color: var(--tcm-text-primary);
}
.type-desc {
  font-size: var(--tcm-font-xs);
  color: var(--tcm-text-secondary);
}

/* 难度选择 */
.difficulty-row {
  display: flex;
  gap: 8px;
}
.diff-btn {
  width: 44px;
  height: 44px;
  border: 2px solid var(--tcm-border-light);
  border-radius: var(--tcm-radius-md);
  background: var(--tcm-bg-base);
  cursor: pointer;
  font-size: var(--tcm-font-lg);
  font-weight: 600;
  color: var(--tcm-text-secondary);
  transition: all var(--tcm-transition-fast);
  font-family: var(--tcm-font-family);
}
.diff-btn:hover {
  border-color: var(--tcm-primary-300);
  color: var(--tcm-primary-500);
}
.diff-btn.active {
  border-color: var(--tcm-primary-500);
  background: #FDF0ED;
  color: var(--tcm-primary-500);
}

/* 数量选择 */
.count-options {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}
.count-btn {
  padding: 8px 20px;
  border: 2px solid var(--tcm-border-light);
  border-radius: var(--tcm-radius-md);
  background: var(--tcm-bg-base);
  cursor: pointer;
  font-size: var(--tcm-font-sm);
  font-weight: 500;
  color: var(--tcm-text-secondary);
  transition: all var(--tcm-transition-fast);
  font-family: var(--tcm-font-family);
}
.count-btn:hover {
  border-color: var(--tcm-primary-300);
}
.count-btn.active {
  border-color: var(--tcm-primary-500);
  background: #FDF0ED;
  color: var(--tcm-primary-500);
}

/* 汇总 */
.summary {
  padding: 12px 16px;
  background: #FFF8E1;
  border: 1px solid #FFE082;
  border-radius: var(--tcm-radius-md);
}
.summary-row {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}
.summary-label {
  font-size: var(--tcm-font-sm);
  font-weight: 600;
  color: var(--tcm-text-secondary);
}
.summary-value {
  font-size: var(--tcm-font-sm);
  color: var(--tcm-text-primary);
  font-weight: 500;
}

.setup-actions {
  padding-top: 8px;
}

/* 快捷入口 */
.quick-links {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
  gap: 12px;
}
.quick-link-content {
  display: flex;
  flex-direction: column;
  gap: 4px;
}
.quick-link-title {
  font-size: var(--tcm-font-md);
  font-weight: 600;
  color: var(--tcm-text-primary);
}
.quick-link-desc {
  font-size: var(--tcm-font-xs);
  color: var(--tcm-text-secondary);
}
.quick-link-arrow {
  align-self: flex-end;
  color: var(--tcm-primary-500);
  font-size: var(--tcm-font-lg);
}
</style>
