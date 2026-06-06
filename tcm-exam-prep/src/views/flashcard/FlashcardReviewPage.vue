<template>
  <div class="page-flashcard-review">
    <!-- Header -->
    <div class="review-header">
      <button class="review-back" @click="goBack">
        <span class="back-icon">&larr;</span>
        <span>返回</span>
      </button>
      <h1 class="review-title">闪卡复习</h1>
    </div>

    <!-- Loading State -->
    <div v-if="isLoading" class="review-loading">
      <TcmSkeleton variant="rect" class="skeleton-card" />
      <TcmSkeleton variant="text" class="skeleton-bar" />
    </div>

    <!-- Review Complete -->
    <div v-else-if="isComplete" class="review-complete">
      <div class="complete-icon">&#23436;</div>
      <h2 class="complete-title">复习完成</h2>
      <p class="complete-desc">
        本次复习了 {{ store.todayStats.reviewed }} 张闪卡
      </p>
      <p class="complete-sub">系统已根据你的评分自动安排下次复习时间</p>
      <div class="complete-actions">
        <TcmButton variant="secondary" @click="goBack">
          返回列表
        </TcmButton>
        <TcmButton variant="primary" @click="restartReview">
          再来一轮
        </TcmButton>
      </div>
    </div>

    <!-- Empty Deck -->
    <div v-else-if="!store.currentCard" class="review-loading">
      <TcmEmpty description="暂无可复习的闪卡" />
      <div class="empty-actions">
        <TcmButton variant="primary" @click="goBack">
          返回列表
        </TcmButton>
      </div>
    </div>

    <!-- Active Review -->
    <div v-else class="review-active">
      <!-- Progress -->
      <div class="review-progress">
        <FlashCardProgress
          :current="store.deckProgress.current"
          :total="store.deckProgress.total"
        />
      </div>

      <!-- Navigation Bar -->
      <div class="card-navigator">
        <button
          class="nav-btn nav-prev"
          :disabled="store.currentIndex === 0"
          title="上一张（← 键）"
          @click="store.prevCard()"
        >
          &lsaquo; 上一张
        </button>

        <span class="nav-info">
          {{ store.deckProgress.current }} / {{ store.deckProgress.total }}
        </span>

        <button
          class="nav-btn nav-next"
          :disabled="store.currentIndex >= store.deckProgress.total - 1"
          title="下一张（→ 键）"
          @click="store.nextCard()"
        >
          下一张 &rsaquo;
        </button>
      </div>

      <!-- Flashcard -->
      <div class="review-card-wrapper">
        <FlashCard
          :card="store.currentCard"
          :flipped="store.isFlipped"
          @flip="store.flipCard()"
        />
      </div>

      <!-- Rating Buttons -->
      <FlashCardRating v-if="store.isFlipped" @rate="handleRate" />

      <!-- Flip Hint -->
      <div v-else class="flip-prompt">
        <p>翻转卡片查看答案后进行评分</p>
      </div>

      <!-- Dot Navigation — jump to any card -->
      <div class="dot-navigation">
        <button
          v-for="(_card, idx) in store.currentDeck"
          :key="idx"
          :class="['dot', { active: idx === store.currentIndex }]"
          :title="`第 ${idx + 1} 张`"
          @click="store.goToCard(idx)"
        />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { watch, onMounted, onUnmounted } from 'vue'
import { storeToRefs } from 'pinia'
import { useRoute, useRouter } from 'vue-router'
import { useFlashcardStore } from '@/stores/useFlashcardStore'
import FlashCard from '@/components/flashcard/FlashCard.vue'
import FlashCardRating from '@/components/flashcard/FlashCardRating.vue'
import FlashCardProgress from '@/components/flashcard/FlashCardProgress.vue'
import TcmButton from '@/components/ui/TcmButton.vue'
import TcmSkeleton from '@/components/ui/TcmSkeleton.vue'
import TcmEmpty from '@/components/ui/TcmEmpty.vue'

const route = useRoute()
const router = useRouter()
const store = useFlashcardStore()

const { isLoading, isDeckComplete: isComplete } = storeToRefs(store)
const subjectId = route.params.subjectId as string | undefined

async function handleRate(quality: number): Promise<void> {
  await store.rateCard(quality)
}

async function restartReview(): Promise<void> {
  await store.startReview(subjectId)
}

function goBack(): void {
  router.push({ name: 'flashcards' })
}

function handleKeydown(e: KeyboardEvent): void {
  if (e.key === 'ArrowLeft') {
    e.preventDefault()
    store.prevCard()
  } else if (e.key === 'ArrowRight') {
    e.preventDefault()
    store.nextCard()
  } else if (e.key === ' ' || e.key === 'Enter') {
    e.preventDefault()
    store.flipCard()
  }
}

onMounted(async () => {
  await store.startReview(subjectId)
  window.addEventListener('keydown', handleKeydown)
})

onUnmounted(() => {
  window.removeEventListener('keydown', handleKeydown)
})

// When navigating to a different subject, restart the review
watch(
  () => route.params.subjectId,
  async (newId) => {
    await store.startReview(newId as string | undefined)
  },
)
</script>

<style scoped>
.page-flashcard-review {
  /* 宽度动态填充 */
}

.review-header {
  display: flex;
  align-items: center;
  gap: 16px;
  margin-bottom: 24px;
}

.review-back {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 4px 8px;
  border: none;
  background: none;
  color: var(--tcm-text-secondary);
  cursor: pointer;
  font-size: var(--tcm-font-sm);
  border-radius: var(--tcm-radius-sm);
  transition: color 0.2s;
}

.review-back:hover {
  color: var(--tcm-primary-500);
}

.back-icon {
  font-size: var(--tcm-font-lg);
}

.review-title {
  font-family: var(--tcm-font-decorative);
  font-size: var(--tcm-font-2xl);
  color: var(--tcm-text-primary);
}

.review-loading {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.skeleton-card {
  height: 280px;
}

.skeleton-bar {
  width: 60%;
}

.review-complete {
  text-align: center;
  padding: 48px 24px;
}

.complete-icon {
  font-size: 64px;
  color: var(--tcm-jade-500);
  font-family: var(--tcm-font-decorative);
  margin-bottom: 16px;
}

.complete-title {
  font-family: var(--tcm-font-decorative);
  font-size: var(--tcm-font-2xl);
  color: var(--tcm-text-primary);
  margin-bottom: 8px;
}

.complete-desc {
  font-size: var(--tcm-font-md);
  color: var(--tcm-text-secondary);
  margin-bottom: 4px;
}

.complete-sub {
  font-size: var(--tcm-font-sm);
  color: var(--tcm-text-disabled);
  margin-bottom: 32px;
}

.complete-actions {
  display: flex;
  gap: 12px;
  justify-content: center;
}

.empty-actions {
  display: flex;
  justify-content: center;
  margin-top: 24px;
}

.review-active {
  display: flex;
  flex-direction: column;
}

.review-progress {
  margin-bottom: 24px;
}

/* Nav Buttons */
.card-navigator {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 24px;
}

.nav-btn {
  padding: 8px 20px;
  border: 1.5px solid #e0d6c2;
  border-radius: 10px;
  background: #fffdf7;
  color: #5c4a32;
  font-size: 14px;
  cursor: pointer;
  transition: all 0.2s;
  font-family: inherit;
  font-weight: 500;
}

.nav-btn:hover:not(:disabled) {
  background: #faf4e6;
  border-color: #c9a96e;
  color: #8b4513;
  box-shadow: 0 2px 8px rgba(139, 69, 19, 0.06);
}

.nav-btn:disabled {
  opacity: 0.3;
  cursor: not-allowed;
}

.nav-info {
  font-size: 14px;
  font-weight: 600;
  color: #5c4a32;
  letter-spacing: 0.5px;
}

.review-card-wrapper {
  margin-bottom: 8px;
}

.flip-prompt {
  text-align: center;
  margin-top: 36px;
  font-size: 14px;
  color: #bbb;
}

/* Dot Navigation */
.dot-navigation {
  display: flex;
  justify-content: center;
  gap: 8px;
  margin-top: 40px;
  margin-bottom: 32px;
  flex-wrap: wrap;
  padding: 0 16px;
}

.dot {
  width: 12px;
  height: 12px;
  border-radius: 50%;
  border: none;
  background: #e0d6c2;
  cursor: pointer;
  transition: all 0.2s;
  padding: 0;
}

.dot:hover {
  background: #c9a96e;
  transform: scale(1.2);
}

.dot.active {
  background: #8b4513;
  transform: scale(1.35);
  box-shadow: 0 1px 4px rgba(139, 69, 19, 0.3);
}
</style>
