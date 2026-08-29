<template>
  <div class="page-videos">
    <div class="page-header">
      <h1 class="page-title">视频学习</h1>
      <div class="header-actions">
        <TcmButton variant="outline" size="sm" :loading="isScanning" @click="handleScan">
          {{ isScanning ? '扫描中...' : '扫描 video 目录' }}
        </TcmButton>
        <router-link to="/videos/upload">
          <TcmButton variant="primary" size="sm">上传视频</TcmButton>
        </router-link>
      </div>
    </div>

    <!-- 处理中的视频 -->
    <div v-if="processingVideos.length > 0" class="section">
      <h2 class="section-title">处理中</h2>
      <div class="video-grid">
        <div v-for="v in processingVideos" :key="v.id" class="video-card processing"
          @click="$router.push(`/videos/${v.id}`)">
          <div class="video-thumbnail processing-bg">
            <div class="video-thumbnail-placeholder">
              <span class="video-format-badge">{{ v.format?.toUpperCase() || 'MP4' }}</span>
              <span class="processing-icon">&#x2699;</span>
            </div>
            <div class="processing-overlay">
              <div class="processing-progress-bar">
                <div class="processing-fill" :style="{ width: v.processingProgress + '%' }"></div>
              </div>
              <span class="processing-text">{{ v.processingStep || '等待处理...' }}</span>
            </div>
          </div>
          <div class="video-info">
            <h3 class="video-title">{{ v.title }}</h3>
            <p class="video-desc">{{ v.description || '暂无描述' }}</p>
            <div class="video-meta">
              <TcmTag type="warning" size="sm">处理中 {{ v.processingProgress }}%</TcmTag>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 学习库中已就绪的视频（按目录分组） -->
    <div v-if="readyVideos.length > 0" class="section">
      <div class="section-head">
        <div>
          <h2 class="section-title">学习库</h2>
          <p class="section-desc">已入库的视频按目录分组，点击目录展开查看</p>
        </div>
        <div class="section-actions">
          <TcmButton variant="text" size="sm" @click="setAllExpanded(readyTree, true)">全部展开</TcmButton>
          <TcmButton variant="text" size="sm" @click="setAllExpanded(readyTree, false)">全部收起</TcmButton>
        </div>
      </div>

      <div class="dir-groups">
        <VideoDirNode v-for="node in readyTopNodes" :key="node.path" :node="node">
          <template #default="{ item }">
            <div class="video-card" @click="$router.push(`/videos/${item.id}`)">
              <button v-if="canDelete(item)" class="video-delete-btn" title="删除" @click.stop="handleDelete(item)">&times;</button>
              <div class="video-thumbnail">
                <div class="video-thumbnail-placeholder">
                  <span class="video-format-badge">{{ item.format?.toUpperCase() || 'MP4' }}</span>
                  <span class="video-play-icon">&#x25B6;</span>
                </div>
                <span v-if="item.duration > 0" class="video-duration">{{ formatDuration(item.duration) }}</span>
                <span v-if="item.extractedKeyPoints?.length" class="video-kp-badge">
                  {{ item.extractedKeyPoints.length }} 知识点
                </span>
              </div>
              <div class="video-info">
                <h3 class="video-title">{{ item.title }}</h3>
                <p class="video-desc">{{ item.description || '暂无描述' }}</p>
                <div class="video-meta">
                  <TcmTag :type="statusTag(item.processingStatus)" size="sm">
                    {{ statusLabel(item.processingStatus) }}
                  </TcmTag>
                  <TcmTag v-if="item.ownerName" type="key" size="sm">{{ item.ownerName }}</TcmTag>
                  <span class="video-subjects">{{ item.subjectIds.map(getSubjectName).filter(Boolean).join('、') || '未分类' }}</span>
                </div>
              </div>
            </div>
          </template>
        </VideoDirNode>
      </div>
    </div>

    <!-- 本地 video/ 目录下未入库的视频（按目录分组） -->
    <div v-if="unimportedVideos.length > 0" class="section">
      <div class="section-head">
        <div>
          <h2 class="section-title">video 目录</h2>
          <p class="section-desc">按目录分组展示，点击目录展开查看视频，点击视频即可添加到学习库并播放</p>
        </div>
        <div class="section-actions">
          <TcmButton variant="text" size="sm" @click="setAllExpanded(dirTree, true)">全部展开</TcmButton>
          <TcmButton variant="text" size="sm" @click="setAllExpanded(dirTree, false)">全部收起</TcmButton>
        </div>
      </div>

      <div class="dir-groups">
        <VideoDirNode v-for="node in localTopNodes" :key="node.path" :node="node">
          <template #default="{ item }">
            <div class="video-card local" @click="addLocalToLibrary(item)">
              <div class="video-thumbnail flv-thumbnail">
                <span class="video-format-badge">{{ item.format.toUpperCase() }}</span>
                <span class="video-play-icon">&#x25B6;</span>
              </div>
              <div class="video-info">
                <h3 class="video-title">{{ item.title }}</h3>
                <p class="video-desc">{{ formatSize(item.size) }} · {{ item.format.toUpperCase() }}</p>
                <div class="video-meta">
                  <TcmTag type="default" size="sm">video 目录</TcmTag>
                  <span v-if="item.relativePath.includes('/')" class="video-path">{{ item.relativePath }}</span>
                </div>
              </div>
            </div>
          </template>
        </VideoDirNode>
      </div>
    </div>

    <TcmEmpty v-if="allVideos.length === 0 && unimportedVideos.length === 0"
      description="还没有视频。点击「上传视频」添加，或将视频文件放入 video 目录后点击「扫描 video 目录」" />

    <TcmConfirm ref="confirmDlg" />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, provide, onMounted, onBeforeUnmount } from 'vue'
import { useRouter } from 'vue-router'
import { videoRepo } from '@/db/repositories/videoRepo'
import { useSubjectStore } from '@/stores/useSubjectStore'
import { useAuthStore } from '@/stores/useAuthStore'
import { generateId } from '@/utils/id-generator'
import { formatDuration } from '@/utils/date'
import TcmButton from '@/components/ui/TcmButton.vue'
import TcmTag from '@/components/ui/TcmTag.vue'
import TcmEmpty from '@/components/ui/TcmEmpty.vue'
import TcmConfirm from '@/components/ui/TcmConfirm.vue'
import VideoDirNode from './VideoDirNode.vue'
import type { Video, LocalVideoFile, VideoFormat, DirTreeNode } from '@/types'

const router = useRouter()
const subjectStore = useSubjectStore()
const authStore = useAuthStore()
const allVideos = ref<Video[]>([])
const localVideos = ref<LocalVideoFile[]>([])
const isScanning = ref(false)
const confirmDlg = ref<InstanceType<typeof TcmConfirm>>()
let progressTimer: ReturnType<typeof setInterval> | null = null

const processingVideos = computed(() =>
  allVideos.value.filter(v =>
    v.processingStatus !== 'ready' && v.processingStatus !== 'error' && v.processingStatus !== 'raw'
  )
)

const readyVideos = computed(() =>
  allVideos.value.filter(v => v.processingStatus === 'ready' || v.processingStatus === 'raw' || v.processingStatus === 'error')
)

/** 归一化 URL：去掉 origin 前缀，统一为相对路径 */
function normalizeUrl(url: string): string {
  return url.replace(/^https?:\/\/[^/]+/, '')
}

const unimportedVideos = computed(() =>
  localVideos.value.filter(lv =>
    !allVideos.value.some(v => normalizeUrl(v.fileUrl) === normalizeUrl(lv.url))
  )
)

/** 带相对路径的条目（用于目录树分组） */
type HasPath = { relativePath: string; title: string }

/** 取条目所在目录的相对路径（不含文件名） */
function dirOf(item: HasPath): string {
  const idx = item.relativePath.lastIndexOf('/')
  return idx === -1 ? '' : item.relativePath.slice(0, idx)
}

/** 按目录层级构建树 */
function buildDirTree<T extends HasPath>(items: T[]): DirTreeNode<T> {
  const root: DirTreeNode<T> = { name: '', path: '', videos: [], children: [], totalVideos: 0 }
  const map = new Map<string, DirTreeNode<T>>([['', root]])
  for (const item of items) {
    const dir = dirOf(item)
    if (!dir) { root.videos.push(item); continue }
    let node = map.get(dir)
    if (!node) {
      const segs = dir.split('/')
      let parent = root
      let cur = ''
      for (const seg of segs) {
        cur = cur ? `${cur}/${seg}` : seg
        let n = map.get(cur)
        if (!n) {
          n = { name: seg, path: cur, videos: [], children: [], totalVideos: 0 }
          map.set(cur, n)
          parent.children.push(n)
        }
        parent = n
      }
      node = map.get(dir)!
    }
    node.videos.push(item)
  }
  const walk = (n: DirTreeNode<T>): number => {
    n.children.sort((a, b) => a.name.localeCompare(b.name, 'zh-CN'))
    n.videos.sort((a, b) => a.title.localeCompare(b.title, 'zh-CN'))
    n.totalVideos = n.videos.length + n.children.reduce((s, c) => s + walk(c), 0)
    return n.totalVideos
  }
  walk(root)
  return root
}

/** 从 fileUrl 反推相对 video/ 目录的路径 */
function fileUrlToRelativePath(fileUrl: string): string {
  let p = fileUrl.replace(/^https?:\/\/[^/]+/, '')
  try { p = decodeURIComponent(p) } catch { /* keep raw */ }
  const prefix = '/api/video/file/'
  if (p.startsWith(prefix)) p = p.slice(prefix.length)
  return p.replace(/\\/g, '/')
}

/** 未入库视频的目录树 */
const dirTree = computed<DirTreeNode<LocalVideoFile>>(() => buildDirTree(unimportedVideos.value))

/** 学习库已入库视频（补上 relativePath）的目录树 */
const readyVideosWithPath = computed(() =>
  readyVideos.value.map(v => ({ ...v, relativePath: fileUrlToRelativePath(v.fileUrl) }))
)
const readyTree = computed(() => buildDirTree(readyVideosWithPath.value))

/** 顶层节点列表：若根目录下有直接视频，则额外插入「根目录」节点 */
function topNodes<T>(tree: DirTreeNode<T>): DirTreeNode<T>[] {
  const nodes: DirTreeNode<T>[] = [...tree.children]
  if (tree.videos.length) {
    nodes.unshift({ name: '根目录', path: '__root__', videos: tree.videos, children: [], totalVideos: tree.videos.length })
  }
  return nodes
}

const localTopNodes = computed(() => topNodes(dirTree.value))
const readyTopNodes = computed(() => topNodes(readyTree.value))

/** 已展开的目录集合（默认全部收起） */
const expandedDirs = ref<Set<string>>(new Set())

function isExpanded(path: string): boolean {
  return expandedDirs.value.has(path)
}

function toggleDir(path: string) {
  const next = new Set(expandedDirs.value)
  if (next.has(path)) next.delete(path)
  else next.add(path)
  expandedDirs.value = next
}

function collectPaths(tree: DirTreeNode<any>): string[] {
  const all: string[] = []
  const walk = (n: DirTreeNode<any>) => { if (n.path) all.push(n.path); n.children.forEach(walk) }
  walk(tree)
  return all
}

function setAllExpanded(tree: DirTreeNode<any>, expand: boolean) {
  const next = new Set(expandedDirs.value)
  const paths = collectPaths(tree)
  for (const p of paths) { if (expand) next.add(p); else next.delete(p) }
  expandedDirs.value = next
}

// 向递归子组件提供折叠状态
provide('dir-expand', { isExpanded, toggle: toggleDir })

function getSubjectName(id: string): string {
  return subjectStore.subjects.find(s => s.id === id)?.shortName || ''
}

function statusLabel(s: string): string {
  const m: Record<string, string> = {
    raw: '未处理', transcoding: '转码中', transcribing: '转写中',
    extracting: 'AI提取中', summarizing: '生成总结', matching: '匹配中',
    ready: '可学习', error: '处理失败',
  }
  return m[s] || s
}

function statusTag(s: string): 'default' | 'warning' | 'success' {
  if (s === 'ready') return 'success'
  if (s === 'error' || s === 'raw') return 'default'
  return 'warning'
}

function formatSize(bytes: number): string {
  const mb = bytes / (1024 * 1024)
  return mb >= 1 ? `${mb.toFixed(1)} MB` : `${(bytes / 1024).toFixed(1)} KB`
}

function startProgressPolling() {
  progressTimer = setInterval(async () => {
    const processing = allVideos.value.filter(v =>
      v.processingStatus !== 'ready' && v.processingStatus !== 'error' && v.processingStatus !== 'raw'
    )
    if (processing.length === 0) {
      if (progressTimer) { clearInterval(progressTimer); progressTimer = null }
      return
    }
    for (const v of processing) {
      try {
        const p = await videoRepo.getProcessingProgress(v.id)
        if (p) {
          v.processingProgress = p.percent
          v.processingStep = p.stepLabel
          v.processingStatus = p.step as any
        }
      } catch { /* ignore */ }
    }
  }, 3000)
}

async function handleScan() {
  isScanning.value = true
  try {
    localVideos.value = await videoRepo.scanLocalVideos()
    allVideos.value = await videoRepo.findAll()
  } finally {
    isScanning.value = false
  }
}

/** 管理员查看全部视频时，只能删除自己入库的视频（普通用户不受影响） */
function canDelete(video: Video): boolean {
  return !video.userId || video.userId === authStore.user?.id
}

function handleDelete(video: Video) {
  confirmDlg.value?.show({
    title: '删除视频',
    message: `确定要删除「${video.title}」吗？\n\n此操作不可恢复，但原始视频文件会保留在 video 目录中，可重新扫描入库。`,
    type: 'danger',
    confirmText: '确认删除',
    async onConfirm() {
      await videoRepo.delete(video.id)
      allVideos.value = allVideos.value.filter(v => v.id !== video.id)
    },
  })
}

async function addLocalToLibrary(lv: LocalVideoFile) {
  const existing = allVideos.value.find(v => normalizeUrl(v.fileUrl) === normalizeUrl(lv.url))
  if (existing) {
    router.push(`/videos/${existing.id}`)
    return
  }

  const id = generateId('vid_')
  const video: Video = {
    id,
    title: lv.title,
    description: `video 目录 · ${lv.relativePath || lv.filename}`,
    fileUrl: lv.url,
    duration: 0, fileSize: lv.size,
    subjectIds: [], knowledgePointIds: [],
    extractedSummary: '', extractedKeyPoints: [], extractedDifficultPoints: [],
    transcriptText: '', aiTranscript: '', aiSummary: '',
    ocrText: '', infoDraft: '', quizQuestions: [],
    status: 'ready',
    processingStatus: 'raw', processingError: '',
    processingProgress: 0, processingStep: '',
    uploadedAt: Date.now(), thumbnailUrl: '',
    format: lv.format as VideoFormat,
    transcodedVariants: [], subjectMatchResult: [],
  }

  await videoRepo.upsert(video)
  allVideos.value = await videoRepo.findAll()
  router.push(`/videos/${video.id}`)
}

onMounted(async () => {
  await subjectStore.loadSubjects()
  // 先扫描（扫描会同步修复移动过的视频路径），再拉取学习库列表
  try { localVideos.value = await videoRepo.scanLocalVideos() } catch { /* ignore */ }
  allVideos.value = await videoRepo.findAll()
  startProgressPolling()
})

onBeforeUnmount(() => {
  if (progressTimer) { clearInterval(progressTimer); progressTimer = null }
})
</script>

<style scoped>
.page-videos { /* width fills container */ }
.page-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 24px; flex-wrap: wrap; gap: 8px; }
.page-title { font-family: var(--tcm-font-decorative); font-size: var(--tcm-font-2xl); color: var(--tcm-text-primary); }
.header-actions { display: flex; gap: 8px; }

.section { margin-bottom: 32px; }
.section-title { font-size: var(--tcm-font-lg); font-weight: 600; color: var(--tcm-text-primary); margin-bottom: 4px; }
.section-desc { font-size: var(--tcm-font-sm); color: var(--tcm-text-secondary); margin-bottom: 16px; }
.section-head { display: flex; align-items: flex-start; justify-content: space-between; gap: 16px; flex-wrap: wrap; }
.section-actions { display: flex; gap: 4px; align-items: center; }

.dir-groups { display: flex; flex-direction: column; gap: 8px; }

.video-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 16px; }
.video-card { background: var(--tcm-bg-surface); border: 1px solid var(--tcm-border-light); border-radius: var(--tcm-radius-lg); overflow: hidden; cursor: pointer; transition: all 0.2s; position: relative; }
.video-card:hover { box-shadow: var(--tcm-shadow-md); transform: translateY(-2px); }
.video-card.local { border-color: var(--tcm-primary-300); }
.video-card.processing { border-color: var(--tcm-warning-400); }
.video-delete-btn { position: absolute; top: 6px; right: 6px; z-index: 2; width: 24px; height: 24px; border-radius: 50%; border: none; background: rgba(220,38,38,0.85); color: #fff; font-size: 14px; line-height: 1; cursor: pointer; display: flex; align-items: center; justify-content: center; opacity: 0; transition: opacity 0.2s; }
.video-card:hover .video-delete-btn { opacity: 1; }
.video-delete-btn:hover { background: rgba(220,38,38,1); transform: scale(1.15); }

.video-thumbnail { position: relative; height: 160px; background: linear-gradient(135deg, #2C1810, #5C1A00); display: flex; align-items: center; justify-content: center; }
.flv-thumbnail { background: linear-gradient(135deg, #1a1a2e, #16213e); }
.processing-bg { background: linear-gradient(135deg, #2d2d1a, #4a4a20); }
.video-thumbnail-placeholder { display: flex; align-items: center; justify-content: center; width: 100%; height: 100%; position: relative; }
.video-format-badge { position: absolute; top: 8px; left: 8px; padding: 2px 8px; background: rgba(0,0,0,0.6); color: #fff; font-size: 10px; border-radius: 4px; font-weight: 600; }
.video-play-icon { font-size: 48px; color: rgba(255,255,255,0.8); }
.processing-icon { font-size: 36px; opacity: 0.8; animation: spin 2s linear infinite; }
@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
.video-duration { position: absolute; bottom: 8px; right: 8px; padding: 2px 8px; background: rgba(0,0,0,0.7); color: #fff; font-size: var(--tcm-font-xs); border-radius: 4px; }
.video-kp-badge { position: absolute; bottom: 8px; left: 8px; padding: 2px 8px; background: rgba(0,180,100,0.8); color: #fff; font-size: 10px; border-radius: 4px; font-weight: 600; }

.processing-overlay { position: absolute; bottom: 0; left: 0; right: 0; padding: 8px 12px; background: rgba(0,0,0,0.75); }
.processing-progress-bar { height: 3px; background: rgba(255,255,255,0.2); border-radius: 2px; margin-bottom: 4px; }
.processing-fill { height: 100%; background: var(--tcm-primary-500); border-radius: 2px; transition: width 1s ease; }
.processing-text { color: #fff; font-size: 11px; }

.video-info { padding: 14px; }
.video-title { font-size: var(--tcm-font-md); font-weight: 600; color: var(--tcm-text-primary); margin-bottom: 4px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.video-desc { font-size: var(--tcm-font-sm); color: var(--tcm-text-secondary); margin-bottom: 8px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.video-meta { display: flex; align-items: center; gap: 8px; }
.video-subjects { font-size: var(--tcm-font-xs); color: var(--tcm-text-disabled); }
.video-path { font-size: var(--tcm-font-xs); color: var(--tcm-text-disabled); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; max-width: 120px; }
</style>
