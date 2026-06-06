<template>
  <div class="page-subjects">
    <div class="page-header">
      <h1 class="page-title">考试科目</h1>
      <p class="page-desc">师承和确有专长执业助理医师 — 共 14 门考试科目</p>
    </div>

    <div class="subjects-grid" v-if="!isLoading">
      <div
        v-for="subject in subjects"
        :key="subject.id"
        class="subject-card-wrapper"
        @click="$router.push(`/subjects/${subject.id}`)"
      >
        <div class="subject-card" :style="{ borderTopColor: subject.color }">
          <div class="subject-order">{{ subject.order }}</div>
          <div class="subject-info">
            <h3 class="subject-name">{{ subject.name }}</h3>
            <p class="subject-desc">{{ subject.description }}</p>
            <div class="subject-meta">
              <TcmTag type="default">{{ subject.totalChapters }} 章</TcmTag>
              <TcmTag type="default">{{ subject.totalQuestions }} 题</TcmTag>
              <TcmTag v-if="subject.examWeight >= 5" type="high-frequency">重要</TcmTag>
            </div>
          </div>
          <div class="subject-arrow">&#x2192;</div>
        </div>
      </div>
    </div>

    <div v-else class="subjects-grid">
      <TcmSkeleton variant="card" v-for="i in 8" :key="i" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useSubjectStore } from '@/stores/useSubjectStore'
import type { Subject } from '@/types'
import TcmTag from '@/components/ui/TcmTag.vue'
import TcmSkeleton from '@/components/ui/TcmSkeleton.vue'

const subjectStore = useSubjectStore()
const subjects = ref<Subject[]>([])
const isLoading = ref(false)

onMounted(async () => {
  await subjectStore.loadSubjects()
  subjects.value = subjectStore.subjects
})
</script>

<style scoped>
.page-subjects { /* 宽度动态填充 */ }
.page-header { margin-bottom: 28px; }
.page-title { font-family: var(--tcm-font-decorative); font-size: var(--tcm-font-3xl); color: var(--tcm-primary-500); margin-bottom: 8px; }
.page-desc { color: var(--tcm-text-secondary); font-size: var(--tcm-font-md); }

.subjects-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(380px, 1fr)); gap: 16px; }

.subject-card-wrapper { cursor: pointer; }
.subject-card {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 20px;
  background: var(--tcm-bg-surface);
  border: 1px solid var(--tcm-border-light);
  border-top: 3px solid var(--tcm-primary-500);
  border-radius: var(--tcm-radius-lg);
  box-shadow: var(--tcm-shadow-sm);
  transition: all var(--tcm-transition-normal);
}
.subject-card:hover {
  box-shadow: var(--tcm-shadow-md);
  transform: translateY(-2px);
}

.subject-order {
  font-family: var(--tcm-font-decorative);
  font-size: var(--tcm-font-2xl);
  color: var(--tcm-border);
  width: 36px;
  text-align: center;
  flex-shrink: 0;
}
.subject-info { flex: 1; min-width: 0; }
.subject-name { font-size: var(--tcm-font-md); font-weight: 600; color: var(--tcm-text-primary); margin-bottom: 4px; }
.subject-desc { font-size: var(--tcm-font-sm); color: var(--tcm-text-secondary); margin-bottom: 8px; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; }
.subject-meta { display: flex; gap: 6px; flex-wrap: wrap; }
.subject-arrow { font-size: var(--tcm-font-xl); color: var(--tcm-text-disabled); flex-shrink: 0; }
</style>
