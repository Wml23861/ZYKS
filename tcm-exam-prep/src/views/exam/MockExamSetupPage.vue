<template>
  <div class="page-exam-setup">
    <h1 class="page-title">模拟考试</h1>
    <p class="page-subtitle">自定义考试范围、题量与时长，模拟真实考试环境</p>

    <TcmCard title="考试设置" class="setup-card">
      <!-- 科目选择 -->
      <div class="form-section">
        <h3 class="section-label">选择科目 <span class="label-hint">（至少选择 1 门）</span></h3>
        <div class="subject-grid">
          <label
            v-for="subject in subjectStore.subjects"
            :key="subject.id"
            class="subject-checkbox"
            :class="{ 'is-checked': isSubjectSelected(subject.id) }"
          >
            <input
              type="checkbox"
              :value="subject.id"
              :checked="isSubjectSelected(subject.id)"
              @change="toggleSubject(subject.id)"
            />
            <span class="subject-name">{{ subject.shortName }}</span>
            <span class="subject-fullname">{{ subject.name }}</span>
          </label>
        </div>
        <p v-if="selectedSubjects.length === 0" class="form-error">请至少选择一门科目</p>
      </div>

      <!-- 题量选择 -->
      <div class="form-section">
        <h3 class="section-label">题目数量</h3>
        <div class="option-group">
          <button
            v-for="count in questionCountOptions"
            :key="count"
            :class="['option-btn', { 'is-active': config.questionCount === count }]"
            @click="config.questionCount = count"
          >
            {{ count }} 题
          </button>
        </div>
      </div>

      <!-- 时长选择 -->
      <div class="form-section">
        <h3 class="section-label">考试时长</h3>
        <div class="option-group">
          <button
            v-for="min in timeLimitOptions"
            :key="min"
            :class="['option-btn', { 'is-active': config.timeLimit === min }]"
            @click="config.timeLimit = min"
          >
            {{ min }} 分钟
          </button>
        </div>
      </div>

      <div class="setup-summary">
        <p>
          已选 <strong>{{ selectedSubjects.length }}</strong> 门科目，
          共 <strong>{{ config.questionCount }}</strong> 题，
          时长 <strong>{{ config.timeLimit }}</strong> 分钟
        </p>
      </div>

      <div class="setup-actions">
        <TcmButton variant="primary" size="lg" block :disabled="selectedSubjects.length === 0" @click="startExam">
          开始考试
        </TcmButton>
      </div>
    </TcmCard>

    <!-- 注意事项 -->
    <TcmCard title="注意事项" class="tips-card">
      <ul class="tips-list">
        <li>考试开始后计时器即启动，中途不可暂停。</li>
        <li>每道题做出选择后即计入已答题数。</li>
        <li>可随时标记题目，方便回头检查。</li>
        <li>时间到后系统将自动交卷。</li>
        <li>提交后可在成绩页查看详细解析。</li>
      </ul>
    </TcmCard>
  </div>
</template>

<script setup lang="ts">
import { reactive, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import TcmCard from '@/components/ui/TcmCard.vue'
import TcmButton from '@/components/ui/TcmButton.vue'
import { useSubjectStore } from '@/stores/useSubjectStore'
import { useSettingsStore } from '@/stores/useSettingsStore'
import { questionRepo } from '@/db/repositories/questionRepo'
import { examRepo } from '@/db/repositories/examRepo'
import { generateId } from '@/utils/id-generator'
import { pickRandom } from '@/utils/shuffle'
import type { ExamConfig, ExamRecord } from '@/types'

const router = useRouter()
const subjectStore = useSubjectStore()
const settingsStore = useSettingsStore()

const questionCountOptions = [50, 100, 150] as const
const timeLimitOptions = [30, 60, 90, 120] as const

const selectedSubjects = reactive<string[]>([])

const config = reactive<{
  questionCount: number
  timeLimit: number
}>({
  questionCount: settingsStore.settings.defaultExamQuestionCount,
  timeLimit: settingsStore.settings.defaultExamDuration,
})

function isSubjectSelected(subjectId: string): boolean {
  return selectedSubjects.includes(subjectId)
}

function toggleSubject(subjectId: string): void {
  const idx = selectedSubjects.indexOf(subjectId)
  if (idx === -1) {
    selectedSubjects.push(subjectId)
  } else {
    selectedSubjects.splice(idx, 1)
  }
}

async function startExam(): Promise<void> {
  if (selectedSubjects.length === 0) return

  // 获取所选科目对应的所有题目
  const allQuestions: Array<{ id: string; subjectId: string }> = []

  for (const subjectId of selectedSubjects) {
    const questions = await questionRepo.findByFilter({ subjectId })
    questions.forEach(q => allQuestions.push({ id: q.id, subjectId: q.subjectId }))
  }

  if (allQuestions.length === 0) {
    alert('所选科目暂无题目，请先添加题目数据。')
    return
  }

  // 随机选取题目
  const selected = pickRandom(allQuestions, config.questionCount)
  const subjectIds = [...new Set(selected.map(q => q.subjectId))]
  const subjectNames = subjectIds
    .map(id => subjectStore.subjects.find(s => s.id === id)?.shortName ?? id)
    .join('、')

  const examConfig: ExamConfig = {
    examType: 'mock',
    scopeId: subjectIds.join(','),
    scopeName: subjectNames,
    subjectIds,
    questionCount: selected.length,
    timeLimit: config.timeLimit,
  }

  // 创建考试记录
  const examId = generateId('exam_')
  const record: ExamRecord = {
    id: examId,
    examType: examConfig.examType,
    scopeId: examConfig.scopeId,
    scopeName: examConfig.scopeName,
    startTime: Date.now(),
    endTime: null,
    isCompleted: false,
    totalQuestions: selected.length,
    answeredQuestions: 0,
    correctCount: 0,
    score: 0,
    duration: 0,
    answers: selected.map(q => ({
      questionId: q.id,
      userAnswer: null,
      isCorrect: false,
      timeSpent: 0,
      isMarked: false,
    })),
    timeLimit: config.timeLimit * 60,
  }

  await examRepo.create(record)
  router.push({ name: 'exam-session', params: { examId } })
}

onMounted(async () => {
  if (subjectStore.subjects.length === 0) {
    await subjectStore.loadSubjects()
  }
})
</script>

<style scoped>
.page-exam-setup {
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

.setup-card {
  margin-bottom: 20px;
}

.tips-card {
  margin-bottom: 24px;
}

.tips-list {
  list-style: none;
  padding: 0;
  margin: 0;
}

.tips-list li {
  position: relative;
  padding-left: 18px;
  margin-bottom: 8px;
  font-size: var(--tcm-font-sm);
  color: var(--tcm-text-secondary);
  line-height: var(--tcm-leading-relaxed);
}

.tips-list li::before {
  content: '';
  position: absolute;
  left: 0;
  top: 8px;
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: var(--tcm-primary-300);
}

.form-section {
  margin-bottom: 24px;
}

.section-label {
  font-size: var(--tcm-font-base);
  font-weight: 600;
  color: var(--tcm-text-primary);
  margin-bottom: 12px;
}

.label-hint {
  font-weight: 400;
  font-size: var(--tcm-font-sm);
  color: var(--tcm-text-disabled);
}

.subject-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(160px, 1fr));
  gap: 8px;
}

.subject-checkbox {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 12px;
  border: 1px solid var(--tcm-border-light);
  border-radius: var(--tcm-radius-md);
  cursor: pointer;
  transition: all var(--tcm-transition-fast);
  font-size: var(--tcm-font-sm);
}

.subject-checkbox:hover {
  border-color: var(--tcm-primary-300);
  background: var(--tcm-bg-elevated);
}

.subject-checkbox.is-checked {
  border-color: var(--tcm-primary-500);
  background: var(--tcm-primary-50);
}

.subject-checkbox input[type='checkbox'] {
  display: none;
}

.subject-name {
  font-weight: 600;
  color: var(--tcm-text-primary);
  min-width: 36px;
}

.subject-fullname {
  color: var(--tcm-text-secondary);
  font-size: var(--tcm-font-xs);
}

.form-error {
  color: var(--tcm-error);
  font-size: var(--tcm-font-sm);
  margin-top: 8px;
}

.option-group {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.option-btn {
  padding: 8px 20px;
  border: 1px solid var(--tcm-border);
  border-radius: var(--tcm-radius-md);
  background: var(--tcm-bg-base);
  color: var(--tcm-text-primary);
  font-size: var(--tcm-font-base);
  font-family: var(--tcm-font-family);
  cursor: pointer;
  transition: all var(--tcm-transition-fast);
}

.option-btn:hover {
  border-color: var(--tcm-primary-300);
  background: var(--tcm-bg-elevated);
}

.option-btn.is-active {
  border-color: var(--tcm-primary-500);
  background: var(--tcm-primary-50);
  color: var(--tcm-primary-700);
  font-weight: 600;
}

.setup-summary {
  padding: 16px;
  background: var(--tcm-bg-base);
  border-radius: var(--tcm-radius-md);
  margin-bottom: 20px;
  text-align: center;
  font-size: var(--tcm-font-base);
  color: var(--tcm-text-secondary);
}

.setup-summary strong {
  color: var(--tcm-primary-500);
}

.setup-actions {
  padding-top: 4px;
}
</style>
