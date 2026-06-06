<template>
  <div class="page-chapter" :class="`page-chapter--font-${settingsStore.settings.fontSize}`">
    <div v-if="!isLoading && sections.length > 0" class="page-chapter-inner">
      <div class="chapter-header">
        <router-link
          :to="`/subjects/${subjectId}`"
          class="back-link"
        >&#x2190; 返回科目</router-link>
        <h1 class="chapter-title">{{ currentChapter?.title || '章节内容' }}</h1>
      </div>

      <div class="chapter-layout">
        <aside class="section-nav">
          <h3 class="nav-title">本节目录</h3>
          <div class="nav-list">
            <div
              v-for="(section, idx) in sections"
              :key="section.id"
              :class="['section-nav-item', { active: activeSection === idx }]"
              @click="scrollToSection(idx)"
            >
              <span class="section-nav-num">{{ idx + 1 }}</span>
              <span class="section-nav-label">{{ section.title }}</span>
            </div>
          </div>
        </aside>

        <div class="chapter-content" ref="contentRef" @scroll="onContentScroll">
          <div
            v-for="(section, idx) in sections"
            :key="section.id"
            :ref="el => { sectionRefs[idx] = el as HTMLElement | null }"
            class="section-block"
          >
            <h2 class="section-title">
              <span class="section-num">{{ idx + 1 }}.</span>
              {{ section.title }}
            </h2>

            <!-- 知识点 badge 标签组 inline 显示 -->
            <div v-if="getSectionKnowledgePoints(section.id).length > 0" class="section-kp-badges">
              <span
                v-for="kp in getSectionKnowledgePoints(section.id)"
                :key="kp.id"
                class="section-kp-badge"
              >
                <span class="kp-badge-title">{{ kp.title }}</span>
                <TcmTag
                  v-for="tag in kp.tags"
                  :key="tag.type"
                  :type="tag.type"
                  size="sm"
                >{{ tag.label }}</TcmTag>
              </span>
            </div>

            <div class="section-body" v-html="renderMarkdown(section.content)"></div>
            <div class="section-footer">
              <div class="section-meta">
                <span>预计学习: {{ Math.ceil(section.estimatedStudyTime / 60) }} 分钟</span>
              </div>
              <div class="section-footer-actions">
                <BookmarkButton
                  item-type="section"
                  :item-id="section.id"
                  :subject-id="subjectId"
                  :title="section.title"
                  :navigate-path="`/subjects/${subjectId}/chapters/${chapterId}`"
                />
                <TcmButton size="sm" variant="outline" @click="markSectionRead(section.id, idx)">
                  {{ readSections.has(section.id) ? '已学 ✓' : '标记已学' }}
                </TcmButton>
              </div>
            </div>
            <TcmDivider v-if="idx < sections.length - 1" />
          </div>

          <div class="chapter-bottom-actions">
            <TcmButton variant="primary" @click="goToNextChapter">
              {{ hasNextChapter ? '下一章 &#x2192;' : '返回科目列表' }}
            </TcmButton>
          </div>
        </div>
      </div>

      <!-- 回到顶部浮动按钮 -->
      <Transition name="back-to-top">
        <button
          v-if="showBackToTop"
          class="back-to-top-btn"
          @click="scrollToTop"
          title="回到顶部"
        >
          &#x2191;
        </button>
      </Transition>
    </div>

    <div v-else-if="isLoading" class="loading-state">
      <TcmSkeleton variant="rect" />
      <TcmSkeleton variant="text" v-for="i in 8" :key="i" />
    </div>

    <TcmEmpty v-else description="暂无章节内容" />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, nextTick } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useSubjectStore } from '@/stores/useSubjectStore'
import { useSettingsStore } from '@/stores/useSettingsStore'
import MarkdownIt from 'markdown-it'
import TcmButton from '@/components/ui/TcmButton.vue'
import TcmDivider from '@/components/ui/TcmDivider.vue'
import TcmSkeleton from '@/components/ui/TcmSkeleton.vue'
import TcmEmpty from '@/components/ui/TcmEmpty.vue'
import TcmTag from '@/components/ui/TcmTag.vue'
import BookmarkButton from '@/components/common/BookmarkButton.vue'
import type { KnowledgePoint } from '@/types'

const route = useRoute()
const router = useRouter()
const subjectStore = useSubjectStore()
const settingsStore = useSettingsStore()

const subjectId = route.params.subjectId as string
const chapterId = route.params.chapterId as string

const sections = computed(() => subjectStore.sections)
const currentChapter = computed(() => subjectStore.currentChapter)
const chapters = computed(() => subjectStore.chapters)
const isLoading = ref(true)
const activeSection = ref(0)
const readSections = ref(new Set<string>())
const sectionRefs = ref<(HTMLElement | null)[]>([])
const contentRef = ref<HTMLElement | null>(null)
const showBackToTop = ref(false)
const chapterKnowledgePoints = ref<KnowledgePoint[]>([])
const savedScrollPosition = ref(0)

const md = new MarkdownIt({ html: false, breaks: true, linkify: true })

function renderMarkdown(content: string): string {
  return md.render(content || '')
}

function getSectionKnowledgePoints(sectionId: string): KnowledgePoint[] {
  return chapterKnowledgePoints.value.filter(kp => kp.sectionId === sectionId)
}

function scrollToSection(idx: number) {
  activeSection.value = idx
  const el = sectionRefs.value[idx]
  if (el) {
    el.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }
}

function markSectionRead(sectionId: string, idx: number) {
  const newSet = new Set(readSections.value)
  newSet.add(sectionId)
  readSections.value = newSet
  if (idx < sections.value.length - 1) {
    activeSection.value = idx + 1
    nextTick(() => scrollToSection(idx + 1))
  }
}

const hasNextChapter = computed(() => {
  const currentIdx = chapters.value.findIndex(c => c.id === chapterId)
  return currentIdx >= 0 && currentIdx < chapters.value.length - 1
})

function goToNextChapter() {
  const currentIdx = chapters.value.findIndex(c => c.id === chapterId)
  if (currentIdx >= 0 && currentIdx < chapters.value.length - 1) {
    const nextChap = chapters.value[currentIdx + 1]
    router.push(`/subjects/${subjectId}/chapters/${nextChap.id}`)
  } else {
    router.push(`/subjects/${subjectId}`)
  }
}

// === 滚动进度保存（组件内 in-memory） ===
function saveReadingProgress() {
  const el = contentRef.value
  if (!el) return
  savedScrollPosition.value = el.scrollTop
}

let scrollTimer: ReturnType<typeof setTimeout> | null = null
function onContentScroll() {
  const el = contentRef.value
  if (!el) return
  showBackToTop.value = el.scrollTop > 500

  // 更新当前 active section
  updateActiveSection()

  // 防抖保存进度
  if (scrollTimer) clearTimeout(scrollTimer)
  scrollTimer = setTimeout(() => {
    saveReadingProgress()
  }, 500)
}

function updateActiveSection() {
  const el = contentRef.value
  if (!el) return
  const scrollTop = el.scrollTop
  for (let i = sectionRefs.value.length - 1; i >= 0; i--) {
    const secEl = sectionRefs.value[i]
    if (secEl && secEl.offsetTop <= scrollTop + 100) {
      activeSection.value = i
      break
    }
  }
}

function restoreReadingProgress() {
  if (savedScrollPosition.value > 0) {
    nextTick(() => {
      const el = contentRef.value
      if (el) {
        el.scrollTop = savedScrollPosition.value
      }
    })
  }
}

// === 回到顶部 ===
function scrollToTop() {
  const el = contentRef.value
  if (el) {
    el.scrollTo({ top: 0, behavior: 'smooth' })
  }
}

onMounted(async () => {
  await subjectStore.loadSubjectDetail(subjectId)
  await subjectStore.loadChapterContent(chapterId)

  // 加载本章节的知识点
  try {
    await subjectStore.loadKnowledgePoints({ chapterId })
    chapterKnowledgePoints.value = [...subjectStore.knowledgePoints]
  } catch {
    chapterKnowledgePoints.value = []
  }

  isLoading.value = false

  // 恢复阅读位置
  await nextTick()
  restoreReadingProgress()
})

onUnmounted(() => {
  if (scrollTimer) clearTimeout(scrollTimer)
  saveReadingProgress()
})
</script>

<style scoped>
.page-chapter { height: calc(100vh - 88px); }
.page-chapter-inner { display: flex; flex-direction: column; height: 100%; overflow: hidden; }

.chapter-header { flex-shrink: 0; margin-bottom: 16px; }
.back-link { color: var(--tcm-text-secondary); font-size: var(--tcm-font-sm); text-decoration: none; display: inline-block; margin-bottom: 8px; }
.back-link:hover { color: var(--tcm-primary-500); }
.chapter-title { font-family: var(--tcm-font-decorative); font-size: var(--tcm-font-2xl); color: var(--tcm-text-primary); margin: 0; }

/* ===== 左右双栏 — 固定高度 flex 布局 ===== */
.chapter-layout {
  flex: 1;
  display: flex;
  gap: 24px;
  min-height: 0;
  overflow: hidden;
}

/* ===== 左侧目录 — 单独滚动，始终可见 ===== */
.section-nav {
  width: 260px;
  min-width: 260px;
  flex-shrink: 0;
  display: flex;
  flex-direction: column;
  background: var(--tcm-bg-surface);
  border: 1px solid var(--tcm-border-light);
  border-radius: var(--tcm-radius-lg);
  box-shadow: var(--tcm-shadow-sm);
  overflow: hidden;
}

.nav-title {
  font-family: var(--tcm-font-decorative);
  font-size: var(--tcm-font-md);
  font-weight: 600;
  color: var(--tcm-text-primary);
  padding: 14px 16px 10px;
  margin: 0;
  border-bottom: 1px solid var(--tcm-border-light);
  flex-shrink: 0;
}

.nav-list {
  flex: 1;
  overflow-y: auto;
  padding: 8px 10px;
}

.nav-list::-webkit-scrollbar { width: 4px; }
.nav-list::-webkit-scrollbar-track { background: transparent; }
.nav-list::-webkit-scrollbar-thumb { background: var(--tcm-border); border-radius: 2px; }

.section-nav-item {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  padding: 10px 8px;
  border-radius: var(--tcm-radius-md);
  cursor: pointer;
  transition: all var(--tcm-transition-fast);
  position: relative;
  margin-bottom: 2px;
}

.section-nav-num {
  width: 22px;
  height: 22px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--tcm-bg-base);
  border-radius: 50%;
  font-size: var(--tcm-font-xs);
  font-weight: 600;
  flex-shrink: 0;
  color: var(--tcm-text-secondary);
  transition: all var(--tcm-transition-fast);
}

.section-nav-label {
  flex: 1;
  font-size: var(--tcm-font-sm);
  color: var(--tcm-text-secondary);
  line-height: 1.5;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  transition: color var(--tcm-transition-fast);
}

.section-nav-item:hover { background: var(--tcm-bg-elevated); }
.section-nav-item:hover .section-nav-label { color: var(--tcm-text-primary); }

.section-nav-item.active {
  background: linear-gradient(135deg, #FDF0ED 0%, #FFF5F3 100%);
}

.section-nav-item.active .section-nav-num {
  background: var(--tcm-primary-500);
  color: #fff;
}

.section-nav-item.active .section-nav-label {
  color: var(--tcm-primary-700);
  font-weight: 500;
}

/* 移动端隐藏 */
@media (max-width: 768px) {
  .section-nav { display: none; }
  .chapter-layout { flex-direction: column; }
}

/* ===== 右侧内容区 — 单独滚动 ===== */
.chapter-content {
  flex: 1;
  min-width: 0;
  overflow-y: auto;
  padding-right: 8px;
  position: relative;
}

.chapter-content::-webkit-scrollbar { width: 5px; }
.chapter-content::-webkit-scrollbar-track { background: transparent; }
.chapter-content::-webkit-scrollbar-thumb { background: var(--tcm-border); border-radius: 3px; }

.section-block { margin-bottom: 8px; }
.section-title {
  font-size: var(--tcm-font-xl);
  color: var(--tcm-text-primary);
  margin-bottom: 16px;
  font-family: var(--tcm-font-decorative);
}
.section-num { color: var(--tcm-primary-500); }

.section-body {
  line-height: var(--tcm-leading-relaxed);
  color: var(--tcm-text-primary);
}

.section-body :deep(h3) { font-size: var(--tcm-font-lg); margin: 20px 0 10px; color: var(--tcm-text-primary); }
.section-body :deep(h4) { font-size: var(--tcm-font-md); margin: 16px 0 8px; color: var(--tcm-text-secondary); }
.section-body :deep(p) { margin-bottom: 12px; }
.section-body :deep(ul), .section-body :deep(ol) { margin: 8px 0 16px; padding-left: 24px; }
.section-body :deep(li) { margin-bottom: 6px; }
.section-body :deep(table) { width: 100%; border-collapse: collapse; margin: 16px 0; }
.section-body :deep(th), .section-body :deep(td) { border: 1px solid var(--tcm-border); padding: 8px 12px; text-align: left; }
.section-body :deep(th) { background: var(--tcm-bg-surface); font-weight: 600; }
.section-body :deep(code) { background: var(--tcm-bg-surface); padding: 2px 6px; border-radius: 3px; font-size: 0.9em; }
.section-body :deep(strong) { color: var(--tcm-primary-700); }

.section-kp-badges {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-bottom: 16px;
  padding: 10px 14px;
  background: var(--tcm-bg-base);
  border-radius: var(--tcm-radius-md);
  border: 1px dashed var(--tcm-border);
}

.section-kp-badge {
  display: inline-flex;
  align-items: center;
  gap: 4px;
}

.kp-badge-title {
  font-size: var(--tcm-font-sm);
  font-weight: 600;
  color: var(--tcm-text-primary);
}

.section-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-top: 16px;
  padding-top: 12px;
}
.section-meta { font-size: var(--tcm-font-xs); color: var(--tcm-text-disabled); }
.section-footer-actions {
  display: flex;
  align-items: center;
  gap: 8px;
}

.chapter-bottom-actions {
  display: flex;
  justify-content: center;
  margin-top: 32px;
  padding-top: 24px;
  border-top: 1px solid var(--tcm-border-light);
}

.loading-state { display: flex; flex-direction: column; gap: 16px; }

/* === 回到顶部按钮 === */
.back-to-top-btn {
  position: fixed;
  bottom: 32px;
  right: 32px;
  width: 44px;
  height: 44px;
  border-radius: 50%;
  background: var(--tcm-primary-500);
  color: var(--tcm-text-on-primary);
  border: none;
  font-size: 20px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: var(--tcm-shadow-md);
  z-index: 500;
  transition: all var(--tcm-transition-fast);
}

.back-to-top-btn:hover {
  background: var(--tcm-primary-700);
  transform: translateY(-2px);
  box-shadow: var(--tcm-shadow-lg);
}

.back-to-top-enter-active,
.back-to-top-leave-active {
  transition: all var(--tcm-transition-fast);
}

.back-to-top-enter-from,
.back-to-top-leave-to {
  opacity: 0;
  transform: translateY(10px);
}

/* === 字体大小控制 === */
.page-chapter--font-small .section-body {
  font-size: 13px;
}
.page-chapter--font-small .section-title {
  font-size: 16px;
}

.page-chapter--font-medium .section-body {
  font-size: var(--tcm-font-base);
}

.page-chapter--font-large .section-body {
  font-size: 18px;
}
.page-chapter--font-large .section-title {
  font-size: 24px;
}

@media (max-width: 768px) {
  .back-to-top-btn {
    bottom: 80px;
    right: 12px;
  }
}
</style>
