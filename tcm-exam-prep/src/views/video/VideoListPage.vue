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

    <!-- 学习库中已就绪的视频 -->
    <div v-if="readyVideos.length > 0" class="section">
      <h2 class="section-title">学习库</h2>
      <div class="video-grid">
        <div v-for="v in readyVideos" :key="v.id" class="video-card"
          @click="$router.push(`/videos/${v.id}`)">
          <button class="video-delete-btn" title="删除" @click.stop="handleDelete(v)">&times;</button>
          <div class="video-thumbnail">
            <div class="video-thumbnail-placeholder">
              <span class="video-format-badge">{{ v.format?.toUpperCase() || 'MP4' }}</span>
              <span class="video-play-icon">&#x25B6;</span>
            </div>
            <span v-if="v.duration > 0" class="video-duration">{{ formatDuration(v.duration) }}</span>
            <span v-if="v.extractedKeyPoints?.length" class="video-kp-badge">
              {{ v.extractedKeyPoints.length }} 知识点
            </span>
          </div>
          <div class="video-info">
            <h3 class="video-title">{{ v.title }}</h3>
            <p class="video-desc">{{ v.description || '暂无描述' }}</p>
            <div class="video-meta">
              <TcmTag :type="statusTag(v.processingStatus)" size="sm">
                {{ statusLabel(v.processingStatus) }}
              </TcmTag>
              <span class="video-subjects">{{ v.subjectIds.map(getSubjectName).filter(Boolean).join('、') || '未分类' }}</span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 本地 video/ 目录下未入库的视频 -->
    <div v-if="unimportedVideos.length > 0" class="section">
      <h2 class="section-title">video 目录</h2>
      <p class="section-desc">以下视频文件在 video 目录下，点击即可添加到学习库并播放</p>
      <div class="video-grid">
        <div v-for="lv in unimportedVideos" :key="lv.relativePath" class="video-card local"
          @click="addLocalToLibrary(lv)">
          <div class="video-thumbnail flv-thumbnail">
            <span class="video-format-badge">{{ lv.format.toUpperCase() }}</span>
            <span class="video-play-icon">&#x25B6;</span>
          </div>
          <div class="video-info">
            <h3 class="video-title">{{ lv.title }}</h3>
            <p class="video-desc">{{ formatSize(lv.size) }} · {{ lv.format.toUpperCase() }}</p>
            <div class="video-meta">
              <TcmTag type="default" size="sm">video 目录</TcmTag>
              <span v-if="lv.relativePath.includes('/')" class="video-path">{{ lv.relativePath }}</span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <TcmEmpty v-if="allVideos.length === 0 && unimportedVideos.length === 0"
      description="还没有视频。点击「上传视频」添加，或将视频文件放入 video 目录后点击「扫描 video 目录」" />

    <TcmConfirm ref="confirmDlg" />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onBeforeUnmount } from 'vue'
import { useRouter } from 'vue-router'
import { videoRepo } from '@/db/repositories/videoRepo'
import { useSubjectStore } from '@/stores/useSubjectStore'
import { generateId } from '@/utils/id-generator'
import { formatDuration } from '@/utils/date'
import TcmButton from '@/components/ui/TcmButton.vue'
import TcmTag from '@/components/ui/TcmTag.vue'
import TcmEmpty from '@/components/ui/TcmEmpty.vue'
import TcmConfirm from '@/components/ui/TcmConfirm.vue'
import type { Video, LocalVideoFile, VideoFormat } from '@/types'

const router = useRouter()
const subjectStore = useSubjectStore()
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
  } finally {
    isScanning.value = false
  }
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
  allVideos.value = await videoRepo.findAll()
  try { localVideos.value = await videoRepo.scanLocalVideos() } catch { /* ignore */ }
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
