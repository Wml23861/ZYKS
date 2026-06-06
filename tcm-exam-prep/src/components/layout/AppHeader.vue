<template>
  <header class="app-header">
    <div class="app-header-left">
      <button class="app-header-menu-btn" @click="$emit('toggleSidebar')">
        <span class="menu-icon"></span>
      </button>
      <router-link to="/" class="app-header-logo">
        <span class="app-header-logo-icon">岐</span>
        <span class="app-header-logo-text">岐黄备考</span>
      </router-link>
    </div>
    <div class="app-header-center">
      <div class="app-header-search" v-if="!isMobile">
        <input
          type="text"
          placeholder="搜索科目、知识点、题目..."
          class="app-header-search-input"
          readonly
          @focus.prevent="openSearch()"
          @click.prevent="openSearch()"
        />
        <span class="app-header-search-icon">&#x2315;</span>
      </div>
    </div>
    <div class="app-header-right">
      <!-- 用户信息 -->
      <div v-if="authStore.isAuthenticated" class="app-header-user">
        <button class="app-header-user-trigger" @click="toggleUserMenu">
          <span class="app-header-user-icon">&#x263A;</span>
          <span class="app-header-user-name">{{ authStore.user?.displayName || authStore.user?.username }}</span>
          <span class="app-header-user-arrow" :class="{ 'is-open': showUserMenu }">&#x25BC;</span>
        </button>
        <div v-if="showUserMenu" class="app-header-user-menu" @click.stop>
          <div class="app-header-user-menu-item user-info">
            <span class="user-role-label">{{ authStore.user?.role === 'admin' ? '管理员' : '用户' }}</span>
          </div>
          <router-link to="/settings" class="app-header-user-menu-item" @click="showUserMenu = false">
            <span>&#x2699;</span> 设置
          </router-link>
          <button class="app-header-user-menu-item logout-btn" @click="handleLogout">
            <span>&#x21AA;</span> 退出登录
          </button>
        </div>
      </div>
      <router-link v-if="!authStore.isAuthenticated" to="/login" class="app-header-link" title="登录">
        <span class="header-login-icon">&#x1F464;</span>
      </router-link>
      <router-link to="/stats" class="app-header-link" title="学习统计">
        <span class="header-stat-icon">&#x2606;</span>
      </router-link>
      <router-link to="/settings" class="app-header-link" title="设置">
        <span class="header-settings-icon">&#x2699;</span>
      </router-link>
    </div>
  </header>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, inject } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/useAuthStore'

defineEmits<{ toggleSidebar: [] }>()

const router = useRouter()
const authStore = useAuthStore()
const openSearch = inject<() => void>('openSearch', () => {})

const isMobile = ref(false)
const showUserMenu = ref(false)

function update() { isMobile.value = window.innerWidth < 768 }

function toggleUserMenu(): void {
  showUserMenu.value = !showUserMenu.value
}

function handleLogout(): void {
  showUserMenu.value = false
  authStore.logout()
  router.push('/login')
}

function handleClickOutside(event: MouseEvent): void {
  const target = event.target as HTMLElement
  if (!target.closest('.app-header-user')) {
    showUserMenu.value = false
  }
}

onMounted(() => {
  update()
  window.addEventListener('resize', update)
  document.addEventListener('click', handleClickOutside)
})

onUnmounted(() => {
  window.removeEventListener('resize', update)
  document.removeEventListener('click', handleClickOutside)
})
</script>

<style scoped>
.app-header {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  height: 56px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 20px;
  background: var(--tcm-bg-elevated);
  border-bottom: 1px solid var(--tcm-border-light);
  box-shadow: var(--tcm-shadow-sm);
  z-index: 100;
}

.app-header-left {
  display: flex;
  align-items: center;
  gap: 12px;
}

.app-header-menu-btn {
  display: none;
  width: 36px;
  height: 36px;
  border: none;
  background: transparent;
  cursor: pointer;
  border-radius: var(--tcm-radius-sm);
  padding: 6px;
}

.app-header-menu-btn:hover {
  background: var(--tcm-bg-surface);
}

@media (max-width: 1023px) {
  .app-header-menu-btn { display: flex; align-items: center; justify-content: center; }
}

.menu-icon {
  width: 20px;
  height: 2px;
  background: var(--tcm-text-primary);
  position: relative;
}

.menu-icon::before,
.menu-icon::after {
  content: '';
  position: absolute;
  width: 20px;
  height: 2px;
  background: var(--tcm-text-primary);
  left: 0;
}

.menu-icon::before { top: -6px; }
.menu-icon::after { top: 6px; }

.app-header-logo {
  display: flex;
  align-items: center;
  gap: 8px;
  text-decoration: none;
}

.app-header-logo-icon {
  font-size: 22px;
  font-weight: 700;
  color: var(--tcm-text-on-primary);
  background: var(--tcm-primary-500);
  width: 34px; height: 34px;
  border-radius: 8px;
  display: flex; align-items: center; justify-content: center;
  font-family: var(--tcm-font-decorative);
}

.app-header-logo-text {
  font-family: var(--tcm-font-decorative);
  font-size: var(--tcm-font-xl);
  color: var(--tcm-text-primary);
  font-weight: 600;
}

.app-header-center { flex: 1; display: flex; justify-content: center; }

.app-header-search {
  position: relative;
  width: 360px;
  max-width: 100%;
}

.app-header-search-input {
  width: 100%;
  height: 36px;
  padding: 0 36px 0 14px;
  border: 1px solid var(--tcm-border);
  border-radius: 18px;
  background: var(--tcm-bg-base);
  font-size: var(--tcm-font-sm);
  color: var(--tcm-text-primary);
  outline: none;
  cursor: pointer;
  transition: border-color 0.2s;
}

.app-header-search-input:focus {
  border-color: var(--tcm-primary-500);
}

.app-header-search-icon {
  position: absolute;
  right: 12px;
  top: 50%;
  transform: translateY(-50%);
  color: var(--tcm-text-disabled);
  font-size: 18px;
}

.app-header-right {
  display: flex;
  align-items: center;
  gap: 4px;
}

.app-header-link {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  border-radius: var(--tcm-radius-sm);
  color: var(--tcm-text-secondary);
  text-decoration: none;
  font-size: 20px;
  transition: all 0.2s;
}

.app-header-link:hover {
  background: var(--tcm-bg-surface);
  color: var(--tcm-primary-500);
}

/* 用户区域 */
.app-header-user {
  position: relative;
}

.app-header-user-trigger {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 4px 10px 4px 6px;
  border: 1px solid var(--tcm-border-light);
  border-radius: var(--tcm-radius-md);
  background: var(--tcm-bg-surface);
  cursor: pointer;
  font-family: var(--tcm-font-family);
  font-size: var(--tcm-font-sm);
  color: var(--tcm-text-primary);
  transition: all var(--tcm-transition-fast);
}

.app-header-user-trigger:hover {
  border-color: var(--tcm-primary-500);
  background: var(--tcm-bg-elevated);
}

.app-header-user-icon {
  font-size: 18px;
  color: var(--tcm-primary-500);
}

.app-header-user-name {
  max-width: 100px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-weight: 500;
}

.app-header-user-arrow {
  font-size: 10px;
  color: var(--tcm-text-disabled);
  transition: transform var(--tcm-transition-fast);
}

.app-header-user-arrow.is-open {
  transform: rotate(180deg);
}

.app-header-user-menu {
  position: absolute;
  top: calc(100% + 6px);
  right: 0;
  min-width: 160px;
  background: var(--tcm-bg-elevated);
  border: 1px solid var(--tcm-border-light);
  border-radius: var(--tcm-radius-md);
  box-shadow: var(--tcm-shadow-lg);
  overflow: hidden;
  z-index: 200;
}

.app-header-user-menu-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 14px;
  font-size: var(--tcm-font-sm);
  color: var(--tcm-text-primary);
  text-decoration: none;
  cursor: pointer;
  border: none;
  background: none;
  width: 100%;
  font-family: var(--tcm-font-family);
  transition: background var(--tcm-transition-fast);
}

.app-header-user-menu-item:hover {
  background: var(--tcm-bg-surface);
}

.app-header-user-menu-item.user-info {
  border-bottom: 1px solid var(--tcm-border-light);
  cursor: default;
  font-size: var(--tcm-font-xs);
}

.app-header-user-menu-item.user-info:hover {
  background: transparent;
}

.user-role-label {
  color: var(--tcm-text-disabled);
}

.logout-btn {
  color: var(--tcm-error);
}

.logout-btn:hover {
  background: rgba(192, 57, 43, 0.06);
}
</style>
