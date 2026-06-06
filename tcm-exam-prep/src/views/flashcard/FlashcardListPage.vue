<template>
  <div class="page-flashcard-list">
    <div class="page-header">
      <h1 class="page-title">闪卡记忆</h1>
      <p class="page-subtitle">基于 SM-2 间隔重复算法，科学安排复习节奏</p>
    </div>

    <!-- Loading Skeleton -->
    <div v-if="isLoading" class="skeleton-list">
      <TcmSkeleton v-for="n in 3" :key="n" variant="card" class="mb-4" />
    </div>

    <!-- Subject Deck List -->
    <div v-else-if="subjects.length > 0" class="deck-grid">
      <TcmCard
        v-for="subject in subjects"
        :key="subject.id"
        hoverable
        class="deck-card"
        @click="goToSubjectReview(subject.id)"
      >
        <div class="deck-card-inner">
          <div class="deck-card-main">
            <h3 class="deck-card-title">{{ subject.name }}</h3>
            <p class="deck-card-desc">{{ subject.description }}</p>
          </div>
          <div class="deck-card-stats">
            <div class="deck-stat">
              <span class="deck-stat-value">{{ subjectStats[subject.id]?.total ?? '-' }}</span>
              <span class="deck-stat-label">总卡片</span>
            </div>
            <div class="deck-stat">
              <span class="deck-stat-value deck-stat-value--due">
                {{ subjectStats[subject.id]?.due ?? 0 }}
              </span>
              <span class="deck-stat-label">待复习</span>
            </div>
          </div>
          <div class="deck-card-arrow">
            <span class="arrow-icon">&#12295;</span>
          </div>
        </div>
      </TcmCard>
    </div>

    <!-- Combined Review Card -->
    <TcmCard v-if="!isLoading" class="review-all-card">
      <div class="review-all-inner">
        <div class="review-all-info">
          <h3 class="review-all-title">综合复习</h3>
          <p class="review-all-desc">
            复习所有科目中待复习的闪卡
            <span v-if="totalDue > 0" class="review-all-due">
              当前共 {{ totalDue }} 张待复习
            </span>
          </p>
        </div>
        <TcmButton variant="primary" size="lg" @click="startAllReview">
          开始综合复习
        </TcmButton>
      </div>
    </TcmCard>

    <!-- Empty State -->
    <TcmEmpty v-if="!isLoading && subjects.length === 0" description="暂无闪卡数据，请先添加科目或闪卡" />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useSubjectStore } from '@/stores/useSubjectStore'
import { useFlashcardStore } from '@/stores/useFlashcardStore'
import { flashcardRepo } from '@/db/repositories/flashcardRepo'
import { studyRepo } from '@/db/repositories/studyRepo'
import TcmCard from '@/components/ui/TcmCard.vue'
import TcmButton from '@/components/ui/TcmButton.vue'
import TcmSkeleton from '@/components/ui/TcmSkeleton.vue'
import TcmEmpty from '@/components/ui/TcmEmpty.vue'

const router = useRouter()
const subjectStore = useSubjectStore()
const flashcardStore = useFlashcardStore()

const isLoading = ref(true)
const subjectStats = ref<Record<string, { total: number; due: number }>>({})

const subjects = computed(() => subjectStore.subjects)
const totalDue = computed(() =>
  Object.values(subjectStats.value).reduce((sum, s) => sum + s.due, 0),
)

async function loadStats(): Promise<void> {
  isLoading.value = true
  try {
    await subjectStore.loadSubjects()

    const stats: Record<string, { total: number; due: number }> = {}
    const dueReviews = await studyRepo.getDueReviews()
    const flashcardDue = dueReviews.filter((s) => s.itemType === 'flashcard')

    for (const subject of subjectStore.subjects) {
      const cards = await flashcardRepo.findBySubject(subject.id)
      const due = flashcardDue.filter((s) => s.subjectId === subject.id)
      stats[subject.id] = {
        total: cards.length,
        due: due.length,
      }
    }
    subjectStats.value = stats
  } finally {
    isLoading.value = false
  }
}

async function startAllReview(): Promise<void> {
  await flashcardStore.startReview()
  router.push({ name: 'flashcard-review' })
}

function goToSubjectReview(subjectId: string): void {
  router.push({ name: 'flashcard-review', params: { subjectId } })
}

onMounted(() => {
  loadStats()
})
</script>

<style scoped>
.page-flashcard-list {
  /* 宽度动态填充 */
}

.page-header {
  margin-bottom: 24px;
}

.page-title {
  font-family: var(--tcm-font-decorative);
  font-size: var(--tcm-font-2xl);
  color: var(--tcm-text-primary);
  margin-bottom: 4px;
}

.page-subtitle {
  font-size: var(--tcm-font-sm);
  color: var(--tcm-text-secondary);
}

.skeleton-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.deck-grid {
  display: flex;
  flex-direction: column;
  gap: 12px;
  margin-bottom: 24px;
}

.deck-card-inner {
  display: flex;
  align-items: center;
  gap: 20px;
}

.deck-card-main {
  flex: 1;
  min-width: 0;
}

.deck-card-title {
  font-size: var(--tcm-font-lg);
  font-weight: 600;
  color: var(--tcm-text-primary);
  margin-bottom: 2px;
}

.deck-card-desc {
  font-size: var(--tcm-font-xs);
  color: var(--tcm-text-secondary);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.deck-card-stats {
  display: flex;
  gap: 20px;
  flex-shrink: 0;
}

.deck-stat {
  display: flex;
  flex-direction: column;
  align-items: center;
  min-width: 40px;
}

.deck-stat-value {
  font-size: var(--tcm-font-xl);
  font-weight: 700;
  color: var(--tcm-text-primary);
}

.deck-stat-value--due {
  color: var(--tcm-primary-500);
}

.deck-stat-label {
  font-size: var(--tcm-font-xs);
  color: var(--tcm-text-disabled);
}

.deck-card-arrow {
  color: var(--tcm-text-disabled);
  font-size: var(--tcm-font-lg);
  flex-shrink: 0;
}

.review-all-card {
  margin-top: 8px;
}

.review-all-inner {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
}

.review-all-info {
  flex: 1;
  min-width: 0;
}

.review-all-title {
  font-family: var(--tcm-font-decorative);
  font-size: var(--tcm-font-lg);
  font-weight: 600;
  color: var(--tcm-text-primary);
  margin-bottom: 2px;
}

.review-all-desc {
  font-size: var(--tcm-font-sm);
  color: var(--tcm-text-secondary);
}

.review-all-due {
  color: var(--tcm-primary-500);
  font-weight: 500;
}
</style>
