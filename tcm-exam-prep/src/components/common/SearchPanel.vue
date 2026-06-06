<template>
  <Teleport to="body">
    <Transition name="search-panel">
      <div v-if="visible" class="search-overlay" @click.self="close">
        <div class="search-panel" @click.stop>
          <!-- 搜索输入区 -->
          <div class="search-input-wrapper">
            <span class="search-icon">&#x641C;</span>
            <input
              ref="inputRef"
              v-model="query"
              type="text"
              class="search-input"
              placeholder="搜索科目、章节、知识点、题目、闪卡..."
              @keydown="handleKeydown"
              @input="handleInput"
            />
            <kbd class="search-kbd">ESC</kbd>
          </div>

          <!-- 搜索结果 -->
          <div v-if="query.trim() && results.length > 0" class="search-results">
            <div
              v-for="(group, gIdx) in groupedResults"
              :key="gIdx"
              class="result-group"
            >
              <div class="result-group-header">
                <span class="result-group-icon">{{ group.icon }}</span>
                <span>{{ group.label }}</span>
                <span class="result-group-count">{{ group.items.length }}</span>
              </div>
              <div
                v-for="(item, iIdx) in group.items"
                :key="uniqueKey(item, gIdx, iIdx)"
                :ref="el => { if (el) resultRefs[globalIndex(gIdx, iIdx)] = el as HTMLElement }"
                :class="['result-item', {
                  'result-item--active': activeIndex === globalIndex(gIdx, iIdx)
                }]"
                @click="navigateTo(item)"
                @mouseenter="activeIndex = globalIndex(gIdx, iIdx)"
              >
                <span class="result-item-title">{{ item.title }}</span>
                <span class="result-item-preview">{{ item.preview }}</span>
                <span class="result-item-subject">{{ item.subjectName }}</span>
              </div>
            </div>
          </div>

          <!-- 空状态 -->
          <div v-else-if="query.trim() && results.length === 0" class="search-empty">
            <span class="search-empty-icon">&#x7A7A;</span>
            <p>未找到 "{{ query }}" 相关结果</p>
          </div>

          <!-- 最近搜索 -->
          <div v-else-if="recentSearches.length > 0" class="search-recent">
            <div class="result-group-header">
              <span class="result-group-icon">&#x65F6;</span>
              <span>最近搜索</span>
              <button class="recent-clear" @click="clearRecent">清空</button>
            </div>
            <div
              v-for="(item, idx) in recentSearches"
              :key="idx"
              :class="['result-item', { 'result-item--active': activeIndex === idx }]"
              @click="query = item; handleInput()"
              @mouseenter="activeIndex = idx"
            >
              <span class="result-item-title">{{ item }}</span>
            </div>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
import { ref, computed, nextTick } from 'vue'
import { useRouter } from 'vue-router'
import { useSubjectStore } from '@/stores/useSubjectStore'
import { subjectRepo } from '@/db/repositories/subjectRepo'
import { questionRepo } from '@/db/repositories/questionRepo'
import { flashcardRepo } from '@/db/repositories/flashcardRepo'
import type { Subject, Chapter, Section, KnowledgePoint, Question, Flashcard } from '@/types'

const router = useRouter()
const subjectStore = useSubjectStore()

const visible = ref(false)
const query = ref('')
const activeIndex = ref(-1)
const inputRef = ref<HTMLInputElement | null>(null)
const resultRefs = ref<HTMLElement[]>([])

// Cached search data
const searchSubjects = ref<Subject[]>([])
const searchChapters = ref<Chapter[]>([])
const searchSections = ref<Section[]>([])
const searchKnowledgePoints = ref<KnowledgePoint[]>([])
const searchQuestions = ref<Question[]>([])
const searchFlashcards = ref<Flashcard[]>([])

interface SearchResultItem {
  type: 'subject' | 'chapter' | 'section' | 'knowledge-point' | 'question' | 'flashcard'
  id: string
  title: string
  preview: string
  subjectName: string
  subjectId: string
  navigatePath: string
}

const results = ref<SearchResultItem[]>([])

const RECENT_KEY = 'search_recent'
const MAX_RECENT = 8

function getRecentFromStorage(): string[] {
  try {
    const raw = localStorage.getItem(RECENT_KEY)
    return raw ? JSON.parse(raw) as string[] : []
  } catch { return [] }
}

function saveRecentToStorage(items: string[]) {
  try { localStorage.setItem(RECENT_KEY, JSON.stringify(items)) } catch { /* ignore */ }
}

const recentSearches = ref<string[]>(getRecentFromStorage())

function uniqueKey(item: SearchResultItem, gIdx: number, iIdx: number): string {
  return `${item.type}-${item.id}`
}

function globalIndex(gIdx: number, iIdx: number): number {
  let offset = 0
  for (let i = 0; i < gIdx; i++) {
    offset += groupedResults.value[i].items.length
  }
  return offset + iIdx
}

const groupedResults = computed(() => {
  const groups: { label: string; icon: string; items: SearchResultItem[] }[] = [
    { label: '科目', icon: '目', items: [] },
    { label: '章节', icon: '章', items: [] },
    { label: '节', icon: '节', items: [] },
    { label: '知识点', icon: '知', items: [] },
    { label: '题目', icon: '题', items: [] },
    { label: '闪卡', icon: '忆', items: [] },
  ]
  for (const item of results.value) {
    const map: Record<string, number> = {
      'subject': 0,
      'chapter': 1,
      'section': 2,
      'knowledge-point': 3,
      'question': 4,
      'flashcard': 5,
    }
    groups[map[item.type]].items.push(item)
  }
  return groups.filter(g => g.items.length > 0)
})

function getSubjectName(subjectId: string): string {
  const s = searchSubjects.value.find(s => s.id === subjectId)
  return s?.shortName || s?.name || subjectId
}

function truncate(text: string, maxLen: number): string {
  if (!text) return ''
  return text.length > maxLen ? text.slice(0, maxLen) + '...' : text
}

function stripMarkdown(text: string): string {
  return text
    .replace(/[#*_~`>]/g, '')
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
    .replace(/\n/g, ' ')
    .trim()
}

function searchAll(q: string): SearchResultItem[] {
  if (!q.trim()) return []

  const items: SearchResultItem[] = []

  // 搜索科目
  for (const s of searchSubjects.value) {
    if (s.name.includes(q) || s.shortName.includes(q) || s.description.includes(q)) {
      items.push({
        type: 'subject',
        id: s.id,
        title: s.name,
        preview: truncate(s.description, 100),
        subjectName: s.shortName,
        subjectId: s.id,
        navigatePath: `/subjects/${s.id}`,
      })
    }
  }

  // 搜索章节
  for (const ch of searchChapters.value) {
    if (ch.title.includes(q) || ch.description.includes(q)) {
      items.push({
        type: 'chapter',
        id: ch.id,
        title: ch.title,
        preview: truncate(ch.description, 100),
        subjectName: getSubjectName(ch.subjectId),
        subjectId: ch.subjectId,
        navigatePath: `/subjects/${ch.subjectId}/chapters/${ch.id}`,
      })
    }
  }

  // 搜索节
  for (const sec of searchSections.value) {
    if (sec.title.includes(q) || stripMarkdown(sec.content).includes(q)) {
      items.push({
        type: 'section',
        id: sec.id,
        title: sec.title,
        preview: truncate(stripMarkdown(sec.content), 100),
        subjectName: getSubjectName(sec.subjectId),
        subjectId: sec.subjectId,
        navigatePath: `/subjects/${sec.subjectId}/chapters/${sec.chapterId}`,
      })
    }
  }

  // 搜索知识点
  for (const kp of searchKnowledgePoints.value) {
    if (kp.title.includes(q) || stripMarkdown(kp.content).includes(q)) {
      items.push({
        type: 'knowledge-point',
        id: kp.id,
        title: kp.title,
        preview: truncate(stripMarkdown(kp.content), 100),
        subjectName: getSubjectName(kp.subjectId),
        subjectId: kp.subjectId,
        navigatePath: `/subjects/${kp.subjectId}/chapters/${kp.chapterId}`,
      })
    }
  }

  // 搜索题目
  for (const qu of searchQuestions.value) {
    const stemText = stripMarkdown(qu.questionStem)
    const explanationText = stripMarkdown(qu.explanation)
    if (stemText.includes(q) || explanationText.includes(q)) {
      items.push({
        type: 'question',
        id: qu.id,
        title: truncate(stemText, 80),
        preview: qu.type + '型题 · 答案: ' + qu.correctAnswer,
        subjectName: getSubjectName(qu.subjectId),
        subjectId: qu.subjectId,
        navigatePath: `/practice?subjectId=${qu.subjectId}`,
      })
    }
  }

  // 搜索闪卡
  for (const fc of searchFlashcards.value) {
    const frontText = stripMarkdown(fc.frontContent)
    const backText = stripMarkdown(fc.backContent)
    if (frontText.includes(q) || backText.includes(q) || fc.mnemonic.includes(q)) {
      items.push({
        type: 'flashcard',
        id: fc.id,
        title: truncate(frontText, 80),
        preview: truncate(backText, 100),
        subjectName: getSubjectName(fc.subjectId),
        subjectId: fc.subjectId,
        navigatePath: `/flashcards`,
      })
    }
  }

  return items.slice(0, 50)
}

function handleInput() {
  if (!query.value.trim()) {
    results.value = []
    activeIndex.value = -1
    return
  }
  results.value = searchAll(query.value)
  activeIndex.value = results.value.length > 0 ? 0 : -1
}

function saveRecent(q: string) {
  if (!q.trim()) return
  const current = getRecentFromStorage()
  const filtered = current.filter((item: string) => item !== q)
  filtered.unshift(q)
  const trimmed = filtered.slice(0, MAX_RECENT)
  saveRecentToStorage(trimmed)
  recentSearches.value = trimmed
}

function clearRecent() {
  saveRecentToStorage([])
  recentSearches.value = []
}

function navigateTo(item: SearchResultItem) {
  saveRecent(query.value)
  close()
  router.push(item.navigatePath)
}

function handleKeydown(e: KeyboardEvent) {
  if (e.key === 'Escape') {
    e.preventDefault()
    close()
    return
  }

  const totalItems = results.value.length
  const recentCount = query.value.trim() ? 0 : recentSearches.value.length
  const maxIdx = query.value.trim() ? totalItems - 1 : recentCount - 1

  if (e.key === 'ArrowDown') {
    e.preventDefault()
    activeIndex.value = activeIndex.value < maxIdx ? activeIndex.value + 1 : 0
    scrollToActive()
  } else if (e.key === 'ArrowUp') {
    e.preventDefault()
    activeIndex.value = activeIndex.value > 0 ? activeIndex.value - 1 : maxIdx
    scrollToActive()
  } else if (e.key === 'Enter') {
    e.preventDefault()
    if (query.value.trim() && results.value.length > 0 && activeIndex.value >= 0) {
      const item = results.value[activeIndex.value]
      if (item) navigateTo(item)
    } else if (!query.value.trim() && recentSearches.value.length > 0 && activeIndex.value >= 0) {
      query.value = recentSearches.value[activeIndex.value]
      handleInput()
    }
  }
}

function scrollToActive() {
  nextTick(() => {
    const el = resultRefs.value[activeIndex.value]
    if (el) {
      el.scrollIntoView({ block: 'nearest', behavior: 'smooth' })
    }
  })
}

let dataLoaded = false

async function loadSearchData() {
  if (dataLoaded) return
  try {
    if (subjectStore.subjects.length === 0) {
      await subjectStore.loadSubjects()
    }
    searchSubjects.value = subjectStore.subjects

    // Load chapters for all subjects
    const allCh: Chapter[] = []
    const allSec: Section[] = []
    for (const subj of subjectStore.subjects) {
      try {
        const chapters = await subjectRepo.getChapters(subj.id)
        allCh.push(...chapters)
        for (const ch of chapters) {
          try {
            const sections = await subjectRepo.getSections(ch.id)
            allSec.push(...sections)
          } catch { /* ignore */ }
        }
      } catch { /* ignore */ }
    }
    searchChapters.value = allCh
    searchSections.value = allSec

    const [points, questions, flashcards] = await Promise.all([
      subjectRepo.getAllKnowledgePoints(),
      questionRepo.findAll(),
      flashcardRepo.findAll(),
    ])
    searchKnowledgePoints.value = points
    searchQuestions.value = questions
    searchFlashcards.value = flashcards
    dataLoaded = true
  } catch { /* ignore */ }
}

function open() {
  visible.value = true
  query.value = ''
  results.value = []
  activeIndex.value = -1
  recentSearches.value = getRecentFromStorage()
  loadSearchData()
  nextTick(() => {
    inputRef.value?.focus()
  })
}

function close() {
  visible.value = false
  query.value = ''
  results.value = []
  activeIndex.value = -1
}

function toggle() {
  if (visible.value) {
    close()
  } else {
    open()
  }
}

defineExpose({ open, close, toggle, visible })
</script>

<style scoped>
.search-overlay {
  position: fixed;
  inset: 0;
  z-index: 9999;
  display: flex;
  justify-content: center;
  padding-top: 12vh;
  background: var(--tcm-bg-overlay);
  backdrop-filter: blur(2px);
}

.search-panel {
  width: 600px;
  max-width: 90vw;
  max-height: 70vh;
  background: var(--tcm-bg-surface);
  border: 1px solid var(--tcm-border);
  border-radius: var(--tcm-radius-lg);
  box-shadow: var(--tcm-shadow-lg);
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.search-input-wrapper {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 16px 20px;
  border-bottom: 1px solid var(--tcm-border-light);
}

.search-icon {
  font-size: 18px;
  color: var(--tcm-text-secondary);
  flex-shrink: 0;
}

.search-input {
  flex: 1;
  border: none;
  outline: none;
  background: transparent;
  font-size: var(--tcm-font-md);
  color: var(--tcm-text-primary);
  font-family: var(--tcm-font-family);
}

.search-input::placeholder {
  color: var(--tcm-text-disabled);
}

.search-kbd {
  font-size: var(--tcm-font-xs);
  padding: 2px 6px;
  background: var(--tcm-bg-base);
  border: 1px solid var(--tcm-border);
  border-radius: var(--tcm-radius-sm);
  color: var(--tcm-text-disabled);
  font-family: var(--tcm-font-mono);
}

.search-results {
  overflow-y: auto;
  max-height: 55vh;
  padding: 8px;
}

.result-group {
  margin-bottom: 4px;
}

.result-group-header {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 12px 6px;
  font-size: var(--tcm-font-xs);
  font-weight: 600;
  color: var(--tcm-text-secondary);
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.result-group-icon {
  font-size: 15px;
  font-weight: 700;
  font-family: var(--tcm-font-decorative);
}

.result-group-count {
  margin-left: auto;
  font-size: 11px;
  color: var(--tcm-text-disabled);
}

.result-item {
  display: flex;
  flex-direction: column;
  gap: 2px;
  padding: 10px 12px;
  border-radius: var(--tcm-radius-md);
  cursor: pointer;
  transition: background var(--tcm-transition-fast);
}

.result-item:hover,
.result-item--active {
  background: var(--tcm-bg-base);
}

.result-item-title {
  font-size: var(--tcm-font-base);
  color: var(--tcm-text-primary);
  font-weight: 500;
  line-height: var(--tcm-leading-tight);
}

.result-item-preview {
  font-size: var(--tcm-font-sm);
  color: var(--tcm-text-secondary);
  line-height: var(--tcm-leading-tight);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.result-item-subject {
  font-size: var(--tcm-font-xs);
  color: var(--tcm-primary-500);
  margin-top: 2px;
}

.search-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 48px 24px;
  color: var(--tcm-text-disabled);
}

.search-empty-icon {
  font-size: 48px;
  margin-bottom: 12px;
  opacity: 0.5;
}

.search-recent {
  padding: 8px;
}

.recent-clear {
  margin-left: auto;
  border: none;
  background: none;
  color: var(--tcm-text-disabled);
  cursor: pointer;
  font-size: var(--tcm-font-xs);
  padding: 2px 6px;
}

.recent-clear:hover {
  color: var(--tcm-primary-500);
}

/* 过渡动画 */
.search-panel-enter-active,
.search-panel-leave-active {
  transition: opacity var(--tcm-transition-fast);
}

.search-panel-enter-from,
.search-panel-leave-to {
  opacity: 0;
}

.search-panel-enter-active .search-panel,
.search-panel-leave-active .search-panel {
  transition: transform var(--tcm-transition-fast);
}

.search-panel-enter-from .search-panel,
.search-panel-leave-to .search-panel {
  transform: translateY(-12px) scale(0.97);
}

@media (max-width: 768px) {
  .search-panel {
    max-width: 95vw;
    max-height: 80vh;
  }
  .search-overlay {
    padding-top: 8vh;
  }
}
</style>
