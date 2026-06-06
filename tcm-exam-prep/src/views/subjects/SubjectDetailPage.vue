<template>
  <div class="page-subject-detail">
    <div v-if="!isLoading && currentSubject">
      <div class="subject-header">
        <router-link to="/subjects" class="back-link">&#x2190; 科目列表</router-link>
        <h1 class="subject-title">{{ currentSubject.name }}</h1>
        <p class="subject-desc">{{ currentSubject.description }}</p>
        <div class="subject-actions">
          <TcmButton variant="primary" @click="startStudy">开始学习</TcmButton>
          <TcmButton variant="outline" @click="$router.push(`/flashcards/review/${currentSubject.id}`)">闪卡复习</TcmButton>
          <TcmButton variant="text" @click="goToPractice">刷题练习</TcmButton>
        </div>
      </div>

      <div class="chapters-section">
        <h2 class="section-title">章节目录</h2>
        <div class="chapter-list">
          <div
            v-for="chapter in chapters"
            :key="chapter.id"
            class="chapter-item"
            @click="goToChapter(chapter.id)"
          >
            <div class="chapter-order">第{{ toChineseNum(chapter.order) }}章</div>
            <div class="chapter-info">
              <h3 class="chapter-title">{{ chapter.title }}</h3>
              <p class="chapter-desc">{{ chapter.description }}</p>
              <div class="chapter-meta">
                <span>{{ chapter.sectionCount }} 节</span>
                <span>{{ chapter.knowledgePointCount }} 知识点</span>
              </div>
            </div>
            <div class="chapter-arrow">&#x232A;</div>
          </div>
        </div>
      </div>
    </div>

    <div v-else-if="isLoading" class="loading-state">
      <TcmSkeleton variant="rect" v-for="i in 5" :key="i" />
    </div>

    <TcmEmpty v-else description="科目信息加载失败" />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useSubjectStore } from '@/stores/useSubjectStore'
import TcmButton from '@/components/ui/TcmButton.vue'
import TcmSkeleton from '@/components/ui/TcmSkeleton.vue'
import TcmEmpty from '@/components/ui/TcmEmpty.vue'

const route = useRoute()
const router = useRouter()
const subjectStore = useSubjectStore()

const chapters = computed(() => subjectStore.chapters)
const currentSubject = computed(() => subjectStore.currentSubject)
const isLoading = ref(true)

const CHINESE_NUMS = ['零', '一', '二', '三', '四', '五', '六', '七', '八', '九', '十', '十一', '十二']

function toChineseNum(n: number): string {
  return CHINESE_NUMS[n] || String(n)
}

function goToChapter(chapterId: string) {
  router.push(`/subjects/${route.params.subjectId}/chapters/${chapterId}`)
}

function startStudy() {
  const firstChapter = chapters.value[0]
  if (firstChapter) goToChapter(firstChapter.id)
}

function goToPractice() {
  router.push(`/practice?subjectId=${route.params.subjectId}`)
}

onMounted(async () => {
  const subjectId = route.params.subjectId as string
  await subjectStore.loadSubjectDetail(subjectId)
  isLoading.value = false
})
</script>

<style scoped>
.page-subject-detail { /* 宽度动态填充 */ }

.subject-header { margin-bottom: 32px; }
.back-link { color: var(--tcm-text-secondary); font-size: var(--tcm-font-sm); text-decoration: none; display: inline-block; margin-bottom: 16px; }
.back-link:hover { color: var(--tcm-primary-500); }
.subject-title { font-family: var(--tcm-font-decorative); font-size: var(--tcm-font-3xl); color: var(--tcm-text-primary); margin-bottom: 8px; }
.subject-desc { color: var(--tcm-text-secondary); font-size: var(--tcm-font-md); margin-bottom: 16px; }
.subject-actions { display: flex; gap: 12px; flex-wrap: wrap; }

.chapters-section { margin-bottom: 32px; }
.section-title { font-family: var(--tcm-font-decorative); font-size: var(--tcm-font-xl); color: var(--tcm-text-primary); margin-bottom: 16px; }

.chapter-list { display: flex; flex-direction: column; gap: 8px; }
.chapter-item {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 16px 20px;
  background: var(--tcm-bg-surface);
  border: 1px solid var(--tcm-border-light);
  border-radius: var(--tcm-radius-md);
  cursor: pointer;
  transition: all var(--tcm-transition-fast);
}
.chapter-item:hover { background: var(--tcm-bg-elevated); box-shadow: var(--tcm-shadow-sm); }

.chapter-order {
  font-family: var(--tcm-font-decorative);
  font-size: var(--tcm-font-lg);
  color: var(--tcm-primary-500);
  width: 64px;
  flex-shrink: 0;
}
.chapter-info { flex: 1; min-width: 0; }
.chapter-title { font-size: var(--tcm-font-md); font-weight: 600; color: var(--tcm-text-primary); margin-bottom: 4px; }
.chapter-desc { font-size: var(--tcm-font-sm); color: var(--tcm-text-secondary); margin-bottom: 8px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.chapter-meta { display: flex; gap: 16px; font-size: var(--tcm-font-xs); color: var(--tcm-text-disabled); }
.chapter-arrow { font-size: var(--tcm-font-xl); color: var(--tcm-text-disabled); flex-shrink: 0; }
.loading-state { display: flex; flex-direction: column; gap: 12px; }
</style>
