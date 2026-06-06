<template>
  <div
    class="flashcard-container"
    :class="{ 'is-active': flipped }"
    @click="flip"
  >
    <div class="flashcard">
      <!-- Front -->
      <div class="flashcard-face flashcard-front">
        <div class="card-header">
          <TcmTag v-if="card.category" :type="tagType" class="flashcard-category">{{ categoryLabel }}</TcmTag>
          <span class="card-hint">点击或空格翻转</span>
        </div>
        <div class="flashcard-body">
          <div class="flashcard-question" v-html="renderedFront"></div>
        </div>
      </div>

      <!-- Back -->
      <div class="flashcard-face flashcard-back">
        <div class="card-header card-header--back">
          <span class="answer-badge">答案</span>
          <span class="card-hint">点击翻回</span>
        </div>
        <div class="flashcard-body">
          <div class="flashcard-answer" v-html="renderedBack"></div>
        </div>
        <div v-if="card.mnemonic" class="flashcard-mnemonic">
          <div class="mnemonic-label">记忆口诀</div>
          <p class="mnemonic-text">{{ card.mnemonic }}</p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import MarkdownIt from 'markdown-it'
import TcmTag from '@/components/ui/TcmTag.vue'
import type { Flashcard } from '@/types'

const props = defineProps<{ card: Flashcard; flipped: boolean }>()
const emit = defineEmits<{ flip: [] }>()

const md = new MarkdownIt({ html: false, breaks: true })

const renderedFront = computed(() => props.card ? md.render(props.card.frontContent) : '')
const renderedBack = computed(() => props.card ? md.render(props.card.backContent) : '')

const categoryLabel = computed(() => {
  const labels: Record<string, string> = {
    definition: '概念', herb: '中药', formula: '方剂',
    acupoint: '穴位', song: '方歌', diagnosis: '诊断', clinical: '临床',
    regulation: '法规', other: '其他',
  }
  return labels[props.card?.category ?? 'other'] || '其他'
})

const tagType = computed(() => {
  const m: Record<string, string> = {
    definition: 'key', herb: 'memorize', formula: 'high-frequency',
    acupoint: 'difficult', song: 'memorize', diagnosis: 'default',
    clinical: 'success', regulation: 'default', other: 'default',
  }
  return (m[props.card?.category ?? 'other'] || 'default') as
    | 'key' | 'difficult' | 'high-frequency' | 'memorize' | 'success' | 'default'
})

function flip(): void { emit('flip') }
</script>

<style scoped>
.flashcard-container {
  perspective: 800px;
  width: 100%;
  max-width: 680px;
  margin: 0 auto;
  cursor: pointer;
}

.flashcard {
  display: grid;
  grid-template-areas: 'face';
  transition: transform 0.45s ease;
  transform-style: preserve-3d;
}

.flashcard-container.is-active .flashcard {
  transform: rotateY(180deg);
}

/* Both faces share the same grid cell → container auto-sizes to tallest */
.flashcard-face {
  grid-area: face;
  display: flex;
  flex-direction: column;
  backface-visibility: hidden;
  border-radius: 14px;
  overflow: hidden;
  min-height: 200px;
}

.flashcard-front {
  background: var(--tcm-bg-elevated);
  border: 2px solid var(--tcm-border-light);
  box-shadow: var(--tcm-shadow-md);
}

.flashcard-back {
  background: var(--tcm-bg-elevated);
  border: 2px solid var(--tcm-primary-300);
  box-shadow: var(--tcm-shadow-lg);
  transform: rotateY(180deg);
}

/* Header row */
.card-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 24px;
  border-bottom: 1px solid var(--tcm-border-light);
  flex-shrink: 0;
}

.card-header--back {
  border-bottom-color: var(--tcm-primary-100);
}

.flashcard-category {
  flex-shrink: 0;
}

.answer-badge {
  font-size: 12px;
  font-weight: 600;
  color: var(--tcm-success-text);
  background: var(--tcm-success-bg);
  padding: 2px 12px;
  border-radius: 100px;
  letter-spacing: 0.5px;
}

.card-hint {
  font-size: 12px;
  color: var(--tcm-text-disabled);
}

/* Body */
.flashcard-body {
  flex: 1;
  padding: 28px 36px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.flashcard-question {
  font-size: 17px;
  color: var(--tcm-text-primary);
  line-height: 1.8;
  text-align: center;
  width: 100%;
}

.flashcard-answer {
  font-size: 15px;
  color: var(--tcm-text-primary);
  line-height: 1.7;
  text-align: left;
  width: 100%;
}

/* Rich answer content */
.flashcard-answer :deep(h2),
.flashcard-answer :deep(h3) {
  font-size: 17px;
  margin: 16px 0 8px;
  color: var(--tcm-primary-700);
}

.flashcard-answer :deep(ul),
.flashcard-answer :deep(ol) {
  padding-left: 24px;
  margin: 10px 0;
}

.flashcard-answer :deep(li) {
  margin-bottom: 6px;
}

.flashcard-answer :deep(strong) {
  color: var(--tcm-primary-500);
}

.flashcard-answer :deep(table) {
  width: 100%;
  border-collapse: collapse;
  margin: 14px 0;
  font-size: 14px;
}

.flashcard-answer :deep(th) {
  background: var(--tcm-success-bg);
  color: var(--tcm-success-text);
  padding: 10px 14px;
  text-align: left;
  border: 1px solid var(--tcm-success-border);
  font-weight: 600;
}

.flashcard-answer :deep(td) {
  padding: 8px 14px;
  border: 1px solid var(--tcm-border-light);
}

.flashcard-answer :deep(blockquote) {
  border-left: 3px solid var(--tcm-primary-300);
  background: var(--tcm-bg-surface);
  margin: 14px 0;
  padding: 10px 20px;
  color: var(--tcm-text-secondary);
  font-style: italic;
  border-radius: 0 6px 6px 0;
}

.flashcard-answer :deep(code) {
  background: var(--tcm-bg-code);
  padding: 2px 6px;
  border-radius: 4px;
  font-size: 0.9em;
  color: var(--tcm-primary-500);
}

/* Mnemonic footer */
.flashcard-mnemonic {
  margin: 0 24px 20px;
  padding: 12px 20px;
  background: var(--tcm-gold-bg);
  border: 1px solid var(--tcm-gold-border);
  border-radius: 10px;
}

.mnemonic-label {
  font-size: 12px;
  font-weight: 700;
  color: var(--tcm-gold-text);
  letter-spacing: 0.5px;
  margin-bottom: 6px;
  text-transform: uppercase;
}

.mnemonic-text {
  font-size: 14px;
  color: var(--tcm-text-secondary);
  line-height: 1.8;
  margin: 0;
}
</style>
