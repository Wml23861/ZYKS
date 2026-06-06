<template>
  <nav class="capsule-nav">
    <div class="capsule-scroll" ref="scrollEl">
      <button
        v-for="item in items"
        :key="item.key"
        :class="['capsule-item', { active: isActive(item) }]"
        @click="navigate(item)"
      >
        <span class="capsule-icon">{{ item.icon }}</span>
        <span class="capsule-label">{{ item.label }}</span>
      </button>
    </div>
  </nav>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'

const route = useRoute()
const router = useRouter()
const scrollEl = ref<HTMLElement | null>(null)

interface CapsuleItem {
  key: string
  label: string
  icon: string
  path: string
}

const items: CapsuleItem[] = [
  { key: 'practice', label: '刷题', icon: '题', path: '/practice' },
  { key: 'wrong', label: '错题', icon: '纠', path: '/practice/wrong' },
  { key: 'subjects', label: '知识', icon: '典', path: '/subjects' },
  { key: 'exam', label: '模考', icon: '试', path: '/exam/setup' },
  { key: 'past-exams', label: '真题', icon: '历', path: '/past-exams' },
  { key: 'recite', label: '背诵', icon: '诵', path: '/recite' },
  { key: 'flashcards', label: '闪卡', icon: '忆', path: '/flashcards' },
  { key: 'stats', label: '统计', icon: '览', path: '/stats' },
]

function isActive(item: CapsuleItem): boolean {
  if (item.path === '/') return route.path === '/'
  return route.path.startsWith(item.path)
}

function navigate(item: CapsuleItem): void {
  router.push(item.path)
}

onMounted(() => {
  // 自动滚动到当前激活项
  const activeItem = scrollEl.value?.querySelector('.capsule-item.active') as HTMLElement | null
  if (activeItem && scrollEl.value) {
    const scrollLeft = activeItem.offsetLeft - scrollEl.value.offsetWidth / 2 + activeItem.offsetWidth / 2
    scrollEl.value.scrollTo({ left: scrollLeft, behavior: 'smooth' })
  }
})
</script>

<style scoped>
.capsule-nav {
  background: var(--tcm-bg-elevated);
  border-bottom: 1px solid var(--tcm-border-light);
  overflow: hidden;
}

.capsule-scroll {
  display: flex;
  gap: 4px;
  padding: 8px 12px;
  overflow-x: auto;
  scrollbar-width: none;
  -ms-overflow-style: none;
  scroll-behavior: smooth;
}

.capsule-scroll::-webkit-scrollbar {
  display: none;
}

.capsule-item {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 8px 14px;
  border: none;
  border-radius: 100px;
  background: var(--tcm-bg-base);
  color: var(--tcm-text-secondary);
  font-size: 13px;
  font-family: inherit;
  cursor: pointer;
  white-space: nowrap;
  flex-shrink: 0;
  transition: all 0.2s;
  min-height: 36px;
}

.capsule-item:active {
  transform: scale(0.96);
}

.capsule-item.active {
  background: var(--tcm-primary-500);
  color: var(--tcm-text-on-primary);
  font-weight: 600;
}

.capsule-icon {
  font-size: 16px;
  font-weight: 700;
  line-height: 1;
  font-family: var(--tcm-font-decorative);
}
</style>
