<template>
  <div class="page-bookmarks">
    <div class="page-header">
      <h1 class="page-title">&#x2605; 我的收藏</h1>
      <p class="page-subtitle">收藏的知识点、题目和章节，方便快速复习</p>
    </div>

    <!-- 有收藏内容 -->
    <div v-if="groupedBookmarks.length > 0">
      <div
        v-for="group in groupedBookmarks"
        :key="group.subjectId"
        class="bookmark-group"
      >
        <h2 class="bookmark-subject-title">
          <span class="subject-dot" :style="{ background: getSubjectColor(group.subjectId) }"></span>
          {{ getSubjectName(group.subjectId) }}
          <span class="subject-count">{{ group.items.length }} 项</span>
        </h2>

        <div class="bookmark-list">
          <div
            v-for="item in group.items"
            :key="item.id"
            class="bookmark-item"
          >
            <div class="bookmark-item-main" @click="navigateTo(item)">
              <span class="bookmark-item-type">
                {{ typeLabel(item.type) }}
              </span>
              <span class="bookmark-item-title">{{ item.title || '(无标题)' }}</span>
              <span class="bookmark-item-time">{{ formatTime(item.createdAt) }}</span>
            </div>
            <button
              class="bookmark-item-remove"
              @click.stop="removeBookmark(item)"
              title="取消收藏"
            >
              &#x2715;
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- 空状态 -->
    <TcmEmpty v-else description="还没有收藏内容，去学习页面收藏一些内容吧" />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useSubjectStore } from '@/stores/useSubjectStore'
import TcmEmpty from '@/components/ui/TcmEmpty.vue'

interface BookmarkEntry {
  id: string
  type: string
  itemId: string
  subjectId: string
  title: string
  navigatePath: string
  createdAt: number
}

const BOOKMARKS_KEY = 'bookmarks'
const router = useRouter()
const subjectStore = useSubjectStore()

const bookmarks = ref<BookmarkEntry[]>([])

const groupedBookmarks = computed(() => {
  const map = new Map<string, BookmarkEntry[]>()
  for (const bm of bookmarks.value) {
    const list = map.get(bm.subjectId) || []
    list.push(bm)
    map.set(bm.subjectId, list)
  }
  const result: { subjectId: string; items: BookmarkEntry[] }[] = []
  for (const [subjectId, items] of map) {
    result.push({ subjectId, items })
  }
  return result
})

function typeLabel(type: string): string {
  const map: Record<string, string> = {
    'knowledge-point': '知识点',
    'question': '题目',
    'section': '章节',
    'chapter': '章',
  }
  return map[type] || type
}

function getSubjectName(subjectId: string): string {
  const s = subjectStore.subjects.find((s: { id: string; name: string }) => s.id === subjectId)
  return s?.name || subjectId
}

function getSubjectColor(subjectId: string): string {
  const s = subjectStore.subjects.find((s: { id: string; color: string }) => s.id === subjectId)
  return s?.color || '#C0392B'
}

function formatTime(ts: number): string {
  const d = new Date(ts)
  const now = new Date()
  const diffDays = Math.floor((now.getTime() - d.getTime()) / (1000 * 60 * 60 * 24))
  if (diffDays === 0) return '今天'
  if (diffDays === 1) return '昨天'
  if (diffDays < 7) return `${diffDays} 天前`
  return `${d.getMonth() + 1}/${d.getDate()}`
}

function navigateTo(item: BookmarkEntry) {
  if (item.navigatePath) {
    router.push(item.navigatePath)
  }
}

function removeBookmark(item: BookmarkEntry) {
  const updated = bookmarks.value.filter(
    b => !(b.itemId === item.itemId && b.type === item.type)
  )
  bookmarks.value = updated
  saveBookmarks(updated)
}

function getBookmarksFromStorage(): BookmarkEntry[] {
  try {
    const raw = localStorage.getItem(BOOKMARKS_KEY)
    return raw ? JSON.parse(raw) as BookmarkEntry[] : []
  } catch { return [] }
}

function saveBookmarks(items: BookmarkEntry[]) {
  try { localStorage.setItem(BOOKMARKS_KEY, JSON.stringify(items)) } catch { /* ignore */ }
}

function loadBookmarks() {
  bookmarks.value = getBookmarksFromStorage()
}

onMounted(async () => {
  await subjectStore.loadSubjects()
  loadBookmarks()
})
</script>

<style scoped>
.page-bookmarks {
  /* 宽度动态填充 */
}

.page-header {
  margin-bottom: 32px;
}

.page-title {
  font-family: var(--tcm-font-decorative);
  font-size: var(--tcm-font-2xl);
  color: var(--tcm-text-primary);
  margin-bottom: 8px;
}

.page-subtitle {
  font-size: var(--tcm-font-sm);
  color: var(--tcm-text-secondary);
}

.bookmark-group {
  margin-bottom: 28px;
}

.bookmark-subject-title {
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: var(--tcm-font-lg);
  font-weight: 600;
  color: var(--tcm-text-primary);
  margin-bottom: 12px;
  padding-bottom: 8px;
  border-bottom: 1px solid var(--tcm-border-light);
}

.subject-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  flex-shrink: 0;
}

.subject-count {
  font-size: var(--tcm-font-xs);
  color: var(--tcm-text-disabled);
  font-weight: 400;
  margin-left: auto;
}

.bookmark-list {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.bookmark-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 14px;
  background: var(--tcm-bg-surface);
  border: 1px solid var(--tcm-border-light);
  border-radius: var(--tcm-radius-md);
  transition: all var(--tcm-transition-fast);
}

.bookmark-item:hover {
  border-color: var(--tcm-border);
  box-shadow: var(--tcm-shadow-sm);
}

.bookmark-item-main {
  flex: 1;
  display: flex;
  align-items: center;
  gap: 12px;
  cursor: pointer;
  min-width: 0;
}

.bookmark-item-type {
  font-size: var(--tcm-font-xs);
  padding: 2px 8px;
  background: var(--tcm-primary-50);
  color: var(--tcm-primary-500);
  border-radius: var(--tcm-radius-sm);
  white-space: nowrap;
  flex-shrink: 0;
}

.bookmark-item-title {
  flex: 1;
  font-size: var(--tcm-font-base);
  color: var(--tcm-text-primary);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.bookmark-item-time {
  font-size: var(--tcm-font-xs);
  color: var(--tcm-text-disabled);
  white-space: nowrap;
  flex-shrink: 0;
}

.bookmark-item-remove {
  flex-shrink: 0;
  width: 28px;
  height: 28px;
  display: flex;
  align-items: center;
  justify-content: center;
  border: none;
  background: none;
  color: var(--tcm-text-disabled);
  cursor: pointer;
  border-radius: var(--tcm-radius-sm);
  font-size: 12px;
  transition: all var(--tcm-transition-fast);
}

.bookmark-item-remove:hover {
  background: #FDF0ED;
  color: var(--tcm-primary-500);
}
</style>
