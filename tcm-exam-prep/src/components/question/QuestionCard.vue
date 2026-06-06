<template>
  <div class="question-card">
    <div class="question-header">
      <TcmTag :type="typeTagType" size="sm">{{ type }}</TcmTag>
      <TcmTag v-if="difficulty" type="default" size="sm">难度 {{ difficulty }}/5</TcmTag>
      <span v-if="examYears?.length" class="question-years">{{ examYears?.join('、') }}年真题</span>
    </div>
    <div class="question-stem" v-html="renderedStem"></div>
    <div class="question-options">
      <div
        v-for="option in options"
        :key="option.key"
        :class="optionClasses(option.key)"
        @click="selectOption(option.key)"
      >
        <span class="option-key">{{ option.key }}</span>
        <span class="option-text">{{ option.text }}</span>
      </div>
    </div>
    <div v-if="showExplanation" class="question-explanation">
      <div class="explanation-header">
        <span v-if="isCorrect" class="text-tcm-success">&#x2713; 回答正确</span>
        <span v-else class="text-tcm-error">&#x2717; 回答错误，正确答案是 {{ correctAnswer }}</span>
      </div>
      <div class="explanation-body" v-html="renderedExplanation"></div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import MarkdownIt from 'markdown-it'
import TcmTag from '@/components/ui/TcmTag.vue'

const props = defineProps<{
  type: string
  questionStem: string
  options: { key: string; text: string }[]
  correctAnswer: string
  explanation: string
  difficulty?: number
  examYears?: number[]
  selectedAnswer?: string | null
  showExplanation?: boolean
}>()

const emit = defineEmits<{ select: [key: string] }>()

const md = new MarkdownIt({ html: false, breaks: true })
const renderedStem = computed(() => md.render(props.questionStem))
const renderedExplanation = computed(() => md.render(props.explanation))
const isCorrect = computed(() => props.selectedAnswer === props.correctAnswer)

const typeTagType = computed(() => {
  const m: Record<string, string> = { A1: 'key', A2: 'difficult', A3: 'high-frequency', A4: 'high-frequency' }
  return (m[props.type] || 'high-frequency') as 'key' | 'difficult' | 'high-frequency' | 'memorize' | 'default'
})

function optionClasses(key: string) {
  const base = 'question-option'
  const selected = props.selectedAnswer === key ? 'option-selected' : ''
  let result = ''
  if (props.showExplanation) {
    if (key === props.correctAnswer) result = 'option-correct'
    else if (props.selectedAnswer === key && key !== props.correctAnswer) result = 'option-incorrect'
    else result = 'option-dimmed'
  }
  return [base, selected, result].filter(Boolean)
}

function selectOption(key: string) {
  if (!props.showExplanation) emit('select', key)
}
</script>

<style scoped>
.question-card { margin-bottom: 24px; }
.question-header { display: flex; align-items: center; gap: 8px; margin-bottom: 16px; flex-wrap: wrap; }
.question-years { font-size: var(--tcm-font-xs); color: var(--tcm-gold-500); }
.question-stem { font-size: var(--tcm-font-md); color: var(--tcm-text-primary); line-height: 1.8; margin-bottom: 20px; }
.question-stem :deep(p) { margin-bottom: 8px; }
.question-options { display: flex; flex-direction: column; gap: 8px; }
.question-option {
  display: flex; align-items: flex-start; gap: 12px;
  padding: 12px 16px; border: 2px solid var(--tcm-border-light);
  border-radius: var(--tcm-radius-md); cursor: pointer;
  transition: all 0.15s; background: var(--tcm-bg-surface);
}
.question-option:hover { border-color: var(--tcm-primary-300); background: var(--tcm-primary-50); }
.option-selected { border-color: var(--tcm-primary-500); background: var(--tcm-primary-50); }
.option-correct { border-color: var(--tcm-success-text); background: var(--tcm-success-bg); }
.option-incorrect { border-color: var(--tcm-error-text); background: var(--tcm-error-bg); }
.option-dimmed { opacity: 0.5; }
.option-key { font-weight: 700; font-size: var(--tcm-font-md); color: var(--tcm-primary-500); min-width: 24px; }
.option-correct .option-key { color: var(--tcm-jade-500); }
.option-incorrect .option-key { color: var(--tcm-error); }
.option-text { font-size: var(--tcm-font-base); color: var(--tcm-text-primary); line-height: 1.6; }
.question-explanation { margin-top: 20px; padding: 16px; background: var(--tcm-bg-elevated); border: 1px solid var(--tcm-border-light); border-radius: var(--tcm-radius-md); }
.explanation-header { font-weight: 600; margin-bottom: 8px; }
.explanation-body { font-size: var(--tcm-font-sm); color: var(--tcm-text-secondary); line-height: 1.7; }
.text-tcm-success { color: var(--tcm-jade-500); }
.text-tcm-error { color: var(--tcm-error); }
</style>
