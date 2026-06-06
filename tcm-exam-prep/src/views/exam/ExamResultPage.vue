<template>
  <div class="page-exam-result">
    <div v-if="isLoading" class="loading-state">
      <TcmSkeleton variant="card" />
      <TcmSkeleton variant="text" />
      <TcmSkeleton variant="text" />
    </div>

    <template v-else-if="examRecord && scoreResult">
      <!-- 成绩概览卡片 -->
      <div class="result-hero">
        <div class="result-score-badge" :style="{ borderColor: gradeInfo.color }">
          <span class="score-number" :style="{ color: gradeInfo.color }">{{ scoreResult.score }}</span>
          <span class="score-unit">分</span>
        </div>
        <div class="result-grade">
          <span class="grade-label" :style="{ color: gradeInfo.color }">{{ gradeInfo.label }}</span>
          <p class="grade-encouragement">{{ getEncouragement(gradeInfo.label) }}</p>
        </div>
      </div>

      <!-- 考试信息 -->
      <TcmCard title="考试信息" class="result-section">
        <div class="info-grid">
          <div class="info-item">
            <span class="info-label">考试范围</span>
            <span class="info-value">{{ examRecord.scopeName }}</span>
          </div>
          <div class="info-item">
            <span class="info-label">考试时间</span>
            <span class="info-value">{{ formatDateTime(examRecord.startTime) }}</span>
          </div>
          <div class="info-item">
            <span class="info-label">用时</span>
            <span class="info-value">{{ formatDuration(examRecord.duration) }}</span>
          </div>
          <div class="info-item">
            <span class="info-label">题型</span>
            <span class="info-value">A1 / A2 / B1</span>
          </div>
        </div>
      </TcmCard>

      <!-- 答题统计 -->
      <TcmCard title="答题统计" class="result-section">
        <div class="stats-grid">
          <div class="stats-item stats-total">
            <span class="stats-num">{{ scoreResult.total }}</span>
            <span class="stats-label">总题数</span>
          </div>
          <div class="stats-item stats-correct">
            <span class="stats-num">{{ scoreResult.correct }}</span>
            <span class="stats-label">正确</span>
          </div>
          <div class="stats-item stats-wrong">
            <span class="stats-num">{{ scoreResult.wrong }}</span>
            <span class="stats-label">错误</span>
          </div>
          <div class="stats-item stats-accuracy">
            <span class="stats-num">{{ scoreResult.accuracy }}%</span>
            <span class="stats-label">正确率</span>
          </div>
        </div>

        <TcmDivider />

        <div class="progress-section">
          <TcmProgress
            :percent="scoreResult.accuracy"
            :color="gradeInfo.color"
            :label="'正确率'"
          />
        </div>
      </TcmCard>

      <!-- 每题回顾 -->
      <TcmCard title="题目回顾" class="result-section">
        <div class="review-header">
          <div class="review-legend">
            <span class="review-dot review-dot--correct"></span> 回答正确
            <span class="review-dot review-dot--wrong"></span> 回答错误
            <span class="review-dot review-dot--unanswered"></span> 未作答
          </div>
        </div>

        <div
          v-for="(answer, idx) in reviewAnswers"
          :key="answer.questionId"
          class="review-item"
          :class="{
            'review-item--correct': answer.isCorrect,
            'review-item--wrong': !answer.isCorrect && answer.userAnswer !== null,
            'review-item--unanswered': answer.userAnswer === null,
          }"
        >
          <div class="review-item-header">
            <span class="review-num">第 {{ idx + 1 }} 题</span>
            <TcmTag :type="answer.isCorrect ? 'success' : 'warning'" size="sm">
              {{ answer.userAnswer === null ? '未作答' : (answer.isCorrect ? '正确' : '错误') }}
            </TcmTag>
          </div>

          <div class="review-question-stem" v-html="getQuestionStem(answer.questionId)"></div>

          <div class="review-answer-info">
            <span v-if="answer.userAnswer !== null">
              你的答案: <strong :class="answer.isCorrect ? 'text-correct' : 'text-wrong'">{{ answer.userAnswer }}</strong>
            </span>
            <span v-else class="text-unanswered">未作答</span>
            <span class="review-separator">|</span>
            <span>正确答案: <strong class="text-correct">{{ getCorrectAnswer(answer.questionId) }}</strong></span>
          </div>

          <div v-if="getExplanation(answer.questionId)" class="review-explanation">
            <p class="explanation-label">解析：</p>
            <div class="explanation-content" v-html="getExplanation(answer.questionId)"></div>
          </div>
        </div>
      </TcmCard>

      <!-- 操作按钮 -->
      <div class="result-actions">
        <TcmButton variant="secondary" size="lg" @click="goBack">
          返回首页
        </TcmButton>
        <TcmButton variant="primary" size="lg" @click="retakeExam">
          再来一次
        </TcmButton>
      </div>
    </template>

    <TcmEmpty v-else description="未找到考试成绩" />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import TcmCard from '@/components/ui/TcmCard.vue'
import TcmButton from '@/components/ui/TcmButton.vue'
import TcmTag from '@/components/ui/TcmTag.vue'
import TcmEmpty from '@/components/ui/TcmEmpty.vue'
import TcmDivider from '@/components/ui/TcmDivider.vue'
import TcmProgress from '@/components/ui/TcmProgress.vue'
import TcmSkeleton from '@/components/ui/TcmSkeleton.vue'
import { examRepo } from '@/db/repositories/examRepo'
import { questionRepo } from '@/db/repositories/questionRepo'
import { formatDateTime, formatDuration } from '@/utils/date'
import { calculateScore, getScoreGrade } from '@/utils/exam-scoring'
import type { ExamRecord, Question, ExamAnswer } from '@/types'

const route = useRoute()
const router = useRouter()

const examId = route.params.examId as string
const examRecord = ref<ExamRecord | null>(null)
const questions = ref<Question[]>([])
const isLoading = ref(true)

const scoreResult = computed(() => {
  if (!examRecord.value) return null
  return calculateScore(examRecord.value.answers, examRecord.value.totalQuestions)
})

const gradeInfo = computed(() => {
  if (!scoreResult.value) return { label: '--', color: 'var(--tcm-text-disabled)' }
  return getScoreGrade(scoreResult.value.score)
})

const reviewAnswers = computed((): ExamAnswer[] => {
  if (!examRecord.value) return []
  return examRecord.value.answers
})

function getQuestionStem(questionId: string): string {
  return questions.value.find(q => q.id === questionId)?.questionStem ?? '(题目已加载)'
}

function getCorrectAnswer(questionId: string): string {
  return questions.value.find(q => q.id === questionId)?.correctAnswer ?? '?'
}

function getExplanation(questionId: string): string {
  return questions.value.find(q => q.id === questionId)?.explanation ?? ''
}

function getEncouragement(grade: string): string {
  const map: Record<string, string> = {
    '优秀': '成绩优异！继续保持，通关无忧。',
    '良好': '基础扎实，针对薄弱科目加强练习。',
    '一般': '还需努力，建议回顾错题并加强背诵。',
    '及格': '刚好过关，务必查漏补缺，巩固基础。',
    '不及格': '不要气馁，分析错题，重点复习再做一次。',
  }
  return map[grade] ?? '继续努力！'
}

function goBack(): void {
  router.push({ name: 'dashboard' })
}

function retakeExam(): void {
  router.push({ name: 'exam-setup' })
}

onMounted(async () => {
  try {
    const record = await examRepo.findById(examId)
    if (!record || !record.isCompleted) {
      examRecord.value = null
      return
    }
    examRecord.value = record

    // 加载题目以显示解析
    const questionIds = record.answers.map(a => a.questionId)
    const loaded = await questionRepo.findByFilter({ questionIds })
    questions.value = loaded
  } finally {
    isLoading.value = false
  }
})
</script>

<style scoped>
.page-exam-result {
  /* 宽度动态填充 */
}

.loading-state {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

/* ===== 成绩英雄区 ===== */
.result-hero {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 32px;
  padding: 40px 24px;
  background: var(--tcm-bg-surface);
  border: 1px solid var(--tcm-border-light);
  border-radius: var(--tcm-radius-lg);
  margin-bottom: 24px;
  box-shadow: var(--tcm-shadow-md);
}

.result-score-badge {
  width: 120px;
  height: 120px;
  border: 4px solid;
  border-radius: 50%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  background: var(--tcm-bg-elevated);
}

.score-number {
  font-size: 48px;
  font-weight: 700;
  font-family: var(--tcm-font-mono);
  line-height: 1;
}

.score-unit {
  font-size: var(--tcm-font-sm);
  color: var(--tcm-text-secondary);
  margin-top: 4px;
}

.grade-label {
  font-family: var(--tcm-font-decorative);
  font-size: var(--tcm-font-3xl);
  font-weight: 700;
}

.grade-encouragement {
  margin: 8px 0 0 0;
  font-size: var(--tcm-font-base);
  color: var(--tcm-text-secondary);
}

/* ===== 信息网格 ===== */
.result-section {
  margin-bottom: 20px;
}

.info-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
  gap: 16px;
}

.info-item {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.info-label {
  font-size: var(--tcm-font-sm);
  color: var(--tcm-text-secondary);
}

.info-value {
  font-size: var(--tcm-font-base);
  color: var(--tcm-text-primary);
  font-weight: 500;
}

/* ===== 统计数据 ===== */
.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 16px;
  text-align: center;
}

.stats-item {
  padding: 16px 8px;
  border-radius: var(--tcm-radius-md);
}

.stats-total { background: var(--tcm-bg-base); }
.stats-correct { background: #E8F5E9; }
.stats-wrong { background: #FDF0ED; }
.stats-accuracy { background: #FFF8E1; }

.stats-num {
  display: block;
  font-size: var(--tcm-font-2xl);
  font-weight: 700;
  font-family: var(--tcm-font-mono);
}

.stats-total .stats-num { color: var(--tcm-text-primary); }
.stats-correct .stats-num { color: var(--tcm-jade-500); }
.stats-wrong .stats-num { color: var(--tcm-error); }
.stats-accuracy .stats-num { color: var(--tcm-gold-500); }

.stats-label {
  display: block;
  margin-top: 4px;
  font-size: var(--tcm-font-sm);
  color: var(--tcm-text-secondary);
}

.progress-section {
  margin-top: 8px;
}

/* ===== 题目回顾 ===== */
.review-header {
  margin-bottom: 16px;
}

.review-legend {
  display: flex;
  gap: 16px;
  font-size: var(--tcm-font-sm);
  color: var(--tcm-text-secondary);
  align-items: center;
}

.review-dot {
  display: inline-block;
  width: 10px;
  height: 10px;
  border-radius: 50%;
  margin-right: 4px;
}

.review-dot--correct { background: var(--tcm-jade-300); }
.review-dot--wrong { background: var(--tcm-error); }
.review-dot--unanswered { background: var(--tcm-border); }

.review-item {
  background: var(--tcm-bg-base);
  border: 1px solid var(--tcm-border-light);
  border-radius: var(--tcm-radius-md);
  padding: 16px;
  margin-bottom: 12px;
}

.review-item--correct { border-left: 4px solid var(--tcm-jade-500); }
.review-item--wrong { border-left: 4px solid var(--tcm-error); }
.review-item--unanswered { border-left: 4px solid var(--tcm-border); }

.review-item-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 8px;
}

.review-num {
  font-size: var(--tcm-font-sm);
  font-weight: 600;
  color: var(--tcm-text-primary);
}

.review-question-stem {
  font-size: var(--tcm-font-base);
  color: var(--tcm-text-primary);
  line-height: var(--tcm-leading-relaxed);
  margin-bottom: 8px;
}

.review-answer-info {
  font-size: var(--tcm-font-sm);
  color: var(--tcm-text-secondary);
  margin-bottom: 8px;
}

.review-separator {
  margin: 0 8px;
  color: var(--tcm-border);
}

.text-correct { color: var(--tcm-jade-500); }
.text-wrong { color: var(--tcm-error); }
.text-unanswered { color: var(--tcm-text-disabled); font-style: italic; }

.review-explanation {
  background: var(--tcm-bg-elevated);
  border: 1px solid var(--tcm-border-light);
  border-radius: var(--tcm-radius-sm);
  padding: 12px;
}

.explanation-label {
  font-size: var(--tcm-font-sm);
  font-weight: 600;
  color: var(--tcm-primary-500);
  margin: 0 0 4px 0;
}

.explanation-content {
  font-size: var(--tcm-font-sm);
  color: var(--tcm-text-secondary);
  line-height: var(--tcm-leading-relaxed);
}

/* ===== 底部操作 ===== */
.result-actions {
  display: flex;
  justify-content: center;
  gap: 16px;
  padding: 8px 0 40px;
}

@media (max-width: 600px) {
  .result-hero {
    flex-direction: column;
    gap: 16px;
    padding: 24px;
  }

  .stats-grid {
    grid-template-columns: repeat(2, 1fr);
  }

  .review-legend {
    flex-wrap: wrap;
    gap: 8px;
  }
}
</style>
