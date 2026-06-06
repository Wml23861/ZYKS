<template>
  <!-- 移动端/平板抽屉遮罩 -->
  <Transition name="fade">
    <div
      v-if="!collapsed && (isTablet || isMobile)"
      class="sidebar-overlay"
      @click="$emit('close')"
    ></div>
  </Transition>

  <!-- 侧边栏 -->
  <aside :class="sidebarClasses">
    <nav class="sidebar-nav">
      <router-link
        v-for="item in navItems"
        :key="item.path"
        :to="item.path"
        class="sidebar-nav-item"
        :class="{ 'router-link-active': isActive(item.path) }"
        @click="onNavClick"
      >
        <span class="sidebar-nav-icon" v-html="item.icon"></span>
        <span class="sidebar-nav-label">{{ item.label }}</span>
        <TcmBadge
          v-if="item.badge"
          variant="number"
          class="sidebar-nav-badge"
        >{{ item.badge }}</TcmBadge>
      </router-link>
    </nav>

    <div class="sidebar-footer">
      <div class="sidebar-progress" v-if="overallProgress > 0">
        <TcmProgress :percent="overallProgress" label="总学习进度" color="var(--tcm-jade-500)" />
      </div>
    </div>
  </aside>
</template>

<script setup lang="ts">
import { computed, ref, onMounted, onUnmounted } from 'vue'
import { useRoute } from 'vue-router'
import TcmBadge from '@/components/ui/TcmBadge.vue'
import TcmProgress from '@/components/ui/TcmProgress.vue'

const props = defineProps({
  collapsed: { type: Boolean, default: true },
})

defineEmits<{ close: [] }>()

const route = useRoute()
const isMobile = ref(false)
const isTablet = ref(false)

function update() {
  const w = window.innerWidth
  isMobile.value = w < 768
  isTablet.value = w >= 768 && w < 1024
}
onMounted(() => { update(); window.addEventListener('resize', update) })
onUnmounted(() => window.removeEventListener('resize', update))

const sidebarClasses = computed(() => [
  'app-sidebar',
  props.collapsed && !isMobile.value && !isTablet.value ? 'app-sidebar--collapsed' : '',
  props.collapsed && (isTablet.value || isMobile.value) ? 'app-sidebar--hidden' : '',
])

const navItems = [
  { path: '/', label: '学习仪表盘', icon: '衡', badge: null as number | null },
  { path: '/subjects', label: '科目学习', icon: '典', badge: null },
  { path: '/ai-teacher', label: 'AI中医老师', icon: '师', badge: null },
  { path: '/flashcards', label: '闪卡记忆', icon: '忆', badge: null },
  { path: '/practice', label: '题库刷题', icon: '题', badge: null },
  { path: '/exam/setup', label: '模拟考试', icon: '试', badge: null },
  { path: '/real-exam', label: '真实模考', icon: '考', badge: null },
  { path: '/past-exams', label: '历年真题', icon: '历', badge: null },
  { path: '/recite', label: '背诵辅助', icon: '诵', badge: null },
  { path: '/videos', label: '视频学习', icon: '影', badge: null },
  { path: '/stats', label: '学习统计', icon: '览', badge: null },
]

const overallProgress = ref(0)

function isActive(path: string): boolean {
  if (path === '/') return route.path === '/'
  return route.path.startsWith(path)
}

function onNavClick() {
  if (isMobile.value || isTablet.value) {
    // 移动端点击导航后自动关闭
  }
}
</script>

<style scoped>
.app-sidebar {
  width: 220px;
  min-width: 220px;
  height: calc(100vh - 56px);
  position: sticky;
  top: 56px;
  background: var(--tcm-bg-elevated);
  border-right: 1px solid var(--tcm-border-light);
  display: flex;
  flex-direction: column;
  overflow-y: auto;
  transition: all 0.3s ease;
  z-index: 90;
}

.app-sidebar--collapsed {
  width: 64px;
  min-width: 64px;
}

.app-sidebar--hidden {
  position: fixed;
  left: -260px;
  box-shadow: var(--tcm-shadow-lg);
  width: 240px;
  min-width: 240px;
}

/* 移动端展开时 */
@media (max-width: 1023px) {
  .app-sidebar:not(.app-sidebar--hidden) {
    position: fixed;
    left: 0;
    top: 56px;
    width: 240px;
    min-width: 240px;
    box-shadow: var(--tcm-shadow-lg);
  }
}

.sidebar-overlay {
  display: none;
}

@media (max-width: 1023px) {
  .sidebar-overlay {
    display: block;
    position: fixed;
    inset: 0;
    top: 56px;
    background: var(--tcm-bg-overlay);
    z-index: 89;
  }
}

.sidebar-nav {
  flex: 1;
  padding: 12px 8px;
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.sidebar-nav-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px 12px;
  border-radius: var(--tcm-radius-md);
  color: var(--tcm-text-secondary);
  text-decoration: none;
  font-size: var(--tcm-font-sm);
  transition: all 0.2s;
  white-space: nowrap;
  overflow: hidden;
}

.sidebar-nav-item:hover {
  background: var(--tcm-bg-surface);
  color: var(--tcm-text-primary);
}

.sidebar-nav-item.router-link-active {
  background: var(--tcm-primary-50);
  color: var(--tcm-primary-500);
  font-weight: 600;
}

.app-sidebar--collapsed .sidebar-nav-label,
.app-sidebar--collapsed .sidebar-nav-badge {
  display: none;
}

.app-sidebar--collapsed .sidebar-nav-item {
  justify-content: center;
  padding: 12px;
}

.sidebar-nav-icon {
  font-size: 20px;
  font-weight: 700;
  width: 28px;
  text-align: center;
  flex-shrink: 0;
  font-family: var(--tcm-font-decorative);
}

.sidebar-nav-label {
  flex: 1;
}

.sidebar-footer {
  padding: 12px 16px;
  border-top: 1px solid var(--tcm-border-light);
}

.app-sidebar--collapsed .sidebar-footer {
  display: none;
}
</style>
