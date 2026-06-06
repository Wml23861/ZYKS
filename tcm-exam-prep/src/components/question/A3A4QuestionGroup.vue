<template>
  <div class="a3a4-group">
    <div class="a3a4-header">
      <TcmTag :type="type === 'A3' ? 'key' : 'difficult'" size="sm">{{ type }} 型题</TcmTag>
      <span class="a3a4-instruction">以下试题共用同一临床情景，请根据情景逐一作答</span>
    </div>
    <div class="a3a4-scenario">
      <div class="scenario-label">【临床情景】</div>
      <div class="scenario-body" v-html="renderMd(clinicalScenario)"></div>
    </div>
    <div class="a3a4-sub-questions">
      <div v-for="(subQ, idx) in subQuestions" :key="subQ.id" class="a3a4-sub-question">
        <div class="sub-question-header">
          <span class="sub-question-num">第 {{ idx + 1 }} 题</span>
          <TcmTag v-if="subQ.difficulty" type="default" size="sm">难度 {{ subQ.difficulty }}/5</TcmTag>
          <span v-if="showResults && subQ.userAnswer" :class="subQ.isCorrect ? 'text-tcm-success' : 'text-tcm-error'">
            {{ subQ.isCorrect ? '\u2713 正确' : `\u2717 正确答案: ${subQ.correctAnswer}` }}
          </span>
        </div>
        <div class="sub-question-stem" v-html="renderMd(subQ.questionStem)"></div>
        <div class="sub-question-options">
          <div
            v-for="opt in subQ.options"
            :key="opt.key"
            :class="optionClasses(subQ, opt.key)"
            @click="selectOption(subQ.id, opt.key)"
          >
            <span class="option-key">{{ opt.key }}</span>
            <span class="option-text">{{ opt.text }}</span>
          </div>
        </div>
        <div v-if="showResults && subQ.explanation" class="sub-question-explanation" v-html="renderMd(subQ.explanation)"></div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import MarkdownIt from 'markdown-it'
import TcmTag from '@/components/ui/TcmTag.vue'

interface SubQuestion {
  id: string
  questionStem: string
  options: { key: string; text: string }[]
  correctAnswer: string
  explanation?: string
  difficulty?: number
  userAnswer?: string | null
  isCorrect?: boolean
}

const props = defineProps<{
  type: 'A3' | 'A4'
  clinicalScenario: string
  subQuestions: SubQuestion[]
  showResults?: boolean
}>()

const emit = defineEmits<{ answer: [questionId: string, answer: string] }>()

const md = new MarkdownIt({ html: false, breaks: true })

function renderMd(text: string): string {
  return md.render(text)
}

function optionClasses(subQ: SubQuestion, key: string) {
  const isSelected = subQ.userAnswer === key
  const isDisabled = props.showResults

  let cls = 'option-item'
  if (isSelected) cls += ' is-selected'
  if (isDisabled) cls += ' is-disabled'
  if (props.showResults) {
    if (key === subQ.correctAnswer) cls += ' is-correct'
    if (isSelected && key !== subQ.correctAnswer) cls += ' is-incorrect'
  }
  return cls
}

function selectOption(questionId: string, key: string): void {
  if (props.showResults) return
  emit('answer', questionId, key)
}
</script>

<style scoped>
.a3a4-group {
  margin-bottom: 24px;
}
.a3a4-header {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 16px;
  flex-wrap: wrap;
}
.a3a4-instruction {
  font-size: var(--tcm-font-sm);
  color: var(--tcm-text-secondary);
}
.a3a4-scenario {
  padding: 16px 20px;
  background: var(--tcm-bg-elevated, #f9fafb);
  border: 1px solid var(--tcm-border, #d1d5db);
  border-left: 4px solid var(--tcm-primary-500, #6c5ce7);
  border-radius: var(--tcm-radius-md, 8px);
  margin-bottom: 20px;
}
.scenario-label {
  font-size: var(--tcm-font-sm);
  font-weight: 600;
  color: var(--tcm-primary-500, #6c5ce7);
  margin-bottom: 8px;
}
.scenario-body {
  font-size: var(--tcm-font-base);
  color: var(--tcm-text-primary);
  line-height: var(--tcm-leading-relaxed, 1.8);
}
.a3a4-sub-questions {
  display: flex;
  flex-direction: column;
  gap: 16px;
}
.a3a4-sub-question {
  padding: 16px;
  background: var(--tcm-bg-surface);
  border: 1px solid var(--tcm-border-light);
  border-radius: var(--tcm-radius-md);
}
.sub-question-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
  flex-wrap: wrap;
  gap: 8px;
}
.sub-question-num {
  font-weight: 600;
  color: var(--tcm-primary-500);
}
.sub-question-stem {
  font-size: var(--tcm-font-base);
  color: var(--tcm-text-primary);
  margin-bottom: 12px;
  line-height: var(--tcm-leading-relaxed);
}
.sub-question-options {
  display: flex;
  flex-direction: column;
  gap: 6px;
}
.option-item {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  padding: 8px 12px;
  border: 1px solid var(--tcm-border);
  border-radius: var(--tcm-radius-sm);
  background: var(--tcm-bg-base);
  cursor: pointer;
  transition: all var(--tcm-transition-fast);
}
.option-item:hover:not(.is-disabled) {
  border-color: var(--tcm-primary-300);
  background: var(--tcm-bg-elevated);
}
.option-item.is-selected {
  border-color: var(--tcm-primary-500);
  background: var(--tcm-primary-50, #f5f3ff);
}
.option-item.is-disabled {
  cursor: default;
}
.option-item.is-correct {
  border-color: var(--tcm-success-border, #6ee7b7);
  background: var(--tcm-success-bg, #ecfdf5);
}
.option-item.is-incorrect {
  border-color: var(--tcm-error, #ef4444);
  background: var(--tcm-error-bg, #fef2f2);
}
.option-key {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 26px;
  height: 26px;
  border-radius: 50%;
  background: var(--tcm-bg-elevated);
  font-weight: 600;
  font-size: var(--tcm-font-sm);
  flex-shrink: 0;
}
.option-item.is-selected .option-key {
  background: var(--tcm-primary-100, #ede9fe);
  color: var(--tcm-primary-700, #4c1d95);
}
.option-item.is-correct .option-key {
  background: var(--tcm-success-bg, #d1fae5);
  color: var(--tcm-success-text, #065f46);
}
.option-item.is-incorrect .option-key {
  background: var(--tcm-error-bg, #fee2e2);
  color: var(--tcm-error, #dc2626);
}
.option-text {
  line-height: 26px;
  color: var(--tcm-text-primary);
}
.sub-question-explanation {
  margin-top: 12px;
  padding: 10px 14px;
  background: var(--tcm-bg-elevated, #f9fafb);
  border-radius: var(--tcm-radius-sm);
  font-size: var(--tcm-font-sm);
  color: var(--tcm-text-secondary);
  line-height: var(--tcm-leading-relaxed);
}
.text-tcm-success {
  color: var(--tcm-success-text, #059669);
  font-size: var(--tcm-font-sm);
}
.text-tcm-error {
  color: var(--tcm-error);
  font-size: var(--tcm-font-sm);
}
</style>
