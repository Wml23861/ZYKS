<template>
  <div class="app-layout" :class="{ 'app-layout--mobile': isMobile }">
    <AppHeader @toggle-sidebar="toggleSidebar" />
    <div class="app-layout-body">
      <AppSidebar
        :collapsed="sidebarCollapsed"
        @close="sidebarCollapsed = true"
      />
      <main class="app-layout-main">
        <div class="app-layout-content">
          <router-view v-slot="{ Component, route }">
            <Transition name="page" mode="out-in">
              <component :is="Component" :key="route.path" />
            </Transition>
          </router-view>
        </div>
      </main>
    </div>
    <AppMobileCapsuleNav v-if="isMobile" />
    <SearchPanel ref="searchPanelRef" />
    <PomodoroTimer />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, provide } from 'vue'
import AppHeader from './AppHeader.vue'
import AppSidebar from './AppSidebar.vue'
import AppMobileCapsuleNav from './AppMobileCapsuleNav.vue'
import SearchPanel from '@/components/common/SearchPanel.vue'
import PomodoroTimer from '@/components/common/PomodoroTimer.vue'

const isMobile = ref(false)
const sidebarCollapsed = ref(false)
const isTablet = ref(false)
const searchPanelRef = ref<InstanceType<typeof SearchPanel> | null>(null)

function updateBreakpoint() {
  const w = window.innerWidth
  isMobile.value = w < 768
  isTablet.value = w >= 768 && w < 1024
  if (w < 1024) {
    sidebarCollapsed.value = true
  } else {
    sidebarCollapsed.value = false
  }
  // 设置 CSS 变量用于全屏检测
  document.documentElement.style.setProperty('--tcm-window-width', String(w))
}

function toggleSidebar() {
  sidebarCollapsed.value = !sidebarCollapsed.value
}

function openSearch() {
  searchPanelRef.value?.open()
}

provide('openSearch', openSearch)

function onGlobalKeydown(e: KeyboardEvent) {
  if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
    e.preventDefault()
    searchPanelRef.value?.toggle()
  }
}

onMounted(() => {
  updateBreakpoint()
  window.addEventListener('resize', updateBreakpoint)
  document.addEventListener('keydown', onGlobalKeydown)
})

onUnmounted(() => {
  window.removeEventListener('resize', updateBreakpoint)
  document.removeEventListener('keydown', onGlobalKeydown)
})
</script>

<style scoped>
.app-layout {
  display: flex;
  flex-direction: column;
  min-height: 100vh;
  background: var(--tcm-bg-base);
}

.app-layout-body {
  display: flex;
  flex: 1;
  padding-top: 56px;
}

.app-layout--mobile .app-layout-body {
  /* 去掉底部 padding，因为已经用顶部胶囊导航代替 */
}

.app-layout-main {
  flex: 1;
  overflow-y: auto;
  min-height: calc(100vh - 56px);
}

.app-layout--mobile .app-layout-main {
  min-height: calc(100vh - 56px);
}

.app-layout-content {
  padding: var(--tcm-content-padding-y) var(--tcm-content-padding-x);
  width: 100%;
}
</style>

<!-- 非 scoped：覆盖全局滚动条，让外层滚动条透明不占位 -->
<style>
.app-layout-main {
  scrollbar-width: thin;
  scrollbar-color: transparent transparent;
}
.app-layout-main::-webkit-scrollbar {
  width: 6px;
}
.app-layout-main::-webkit-scrollbar-track {
  background: transparent;
}
.app-layout-main::-webkit-scrollbar-thumb {
  background: transparent;
  border-radius: 3px;
}
.app-layout-main:hover::-webkit-scrollbar-thumb {
  background: rgba(0,0,0,0.12);
}
.app-layout-main::-webkit-scrollbar-thumb:hover {
  background: rgba(0,0,0,0.22);
}
</style>
