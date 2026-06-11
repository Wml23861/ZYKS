<template>
  <div class="page-video-player">
    <router-link to="/videos" class="back-link">&#x2190; 返回视频列表</router-link>
    <h1 class="page-title">{{ video?.title || '视频播放' }}</h1>

    <div v-if="video" class="player-container">
      <!-- ── 视频播放器区域 ── -->
      <div class="player-wrapper" :class="{ 'is-fullscreen': isFullscreen }">
        <div class="player-inner" ref="playerInner">
          <video
            ref="videoEl"
            :src="currentSrc"
            class="video-element"
            :controls="!isLooping && !isTranscoding"
            @timeupdate="onTimeUpdate"
            @loadedmetadata="onLoaded"
            @ended="onVideoEnded"
          ></video>
          <!-- 转码进度遮罩 -->
          <div v-if="isTranscoding" class="transcode-overlay">
            <div class="transcode-box">
              <span class="transcode-spin">&#x2699;</span>
              <p>正在加载视频...</p>
              <p class="transcode-hint">首次播放需转换格式，以后秒开</p>
            </div>
          </div>
          <!-- 循环播放提示 -->
          <div v-if="isLooping" class="loop-indicator">
            <span class="loop-badge">循环 {{ loopCount }}/{{ loopTarget }}</span>
            <span class="loop-info">{{ loopLabel }}</span>
            <TcmButton size="sm" variant="outline" @click="stopLoop">退出循环</TcmButton>
          </div>
        </div>

        <!-- 播放器控制条（扩展） -->
        <div class="player-controls-ext">
          <div class="controls-left">
            <TcmTag :type="formatTag(video.format)" size="sm">{{ video.format?.toUpperCase() || 'MP4' }}</TcmTag>
            <!-- 清晰度切换 -->
            <select v-if="video.transcodedVariants.length > 0" v-model="selectedQuality" class="quality-select">
              <option v-for="v in video.transcodedVariants" :key="v.quality" :value="v.quality">
                {{ v.label }}
              </option>
            </select>
          </div>
          <div class="controls-right">
            <TcmButton v-if="video.processingStatus === 'ready'" size="sm" variant="outline" :loading="isStartingProcess" @click="startAIProcess">
              重新处理
            </TcmButton>
            <TcmButton size="sm" variant="outline" @click="toggleFullscreen">
              {{ isFullscreen ? '退出全屏' : '全屏' }}
            </TcmButton>
          </div>
        </div>
      </div>

      <!-- ── 处理中：进度条 + 取消按钮 ── -->
      <div v-if="isProcessing" class="processing-banner">
        <div class="processing-info">
          <span class="processing-spin">&#x2699;</span>
          <span>{{ video.processingStep || '处理中...' }}</span>
          <span v-if="processingElapsed" class="processing-elapsed">已耗时 {{ processingElapsed }}</span>
        </div>
        <div class="processing-bar-wrap">
          <div class="processing-bar-fill" :style="{ width: video.processingProgress + '%' }"></div>
        </div>
        <span class="processing-pct">{{ video.processingProgress }}%</span>
        <TcmButton size="sm" variant="outline" class="cancel-btn" @click="cancelAIProcess">取消处理</TcmButton>
      </div>

      <!-- ── 错误状态：显示错误 + 重新处理 ── -->
      <div v-else-if="video.processingStatus === 'error'" class="action-banner error-banner">
        <div class="error-msg">
          <p>处理失败：{{ video.processingError || '未知错误' }}</p>
        </div>
        <TcmButton variant="primary" :loading="isStartingProcess" @click="startAIProcess">
          重新处理
        </TcmButton>
      </div>

      <!-- ── 未处理：触发 AI 处理 ── -->
      <div v-else-if="video.processingStatus === 'raw'" class="action-banner">
        <TcmButton variant="primary" :loading="isStartingProcess" @click="startAIProcess">
          AI 分析视频内容
        </TcmButton>
        <p class="action-hint">将自动进行：转码多码率 → 语音转文字 → 提取知识点和重难点 → 生成总结分析</p>
      </div>

      <!-- ── 知识点/重难点/文稿/笔记 Tab ── -->
      <div class="tabs-section">
        <div class="tabs-header">
          <button
            v-for="tab in tabs"
            :key="tab.key"
            :class="['tab-btn', { active: activeTab === tab.key }]"
            @click="activeTab = tab.key"
          >
            {{ tab.label }}
            <span v-if="tab.count" class="tab-count">{{ tab.count }}</span>
          </button>
          <div class="tabs-actions">
            <TcmButton size="sm" variant="outline" @click="exportCurrentTab">导出当前页</TcmButton>
          </div>
        </div>

        <div class="tab-content">
          <!-- 知识点 -->
          <div v-if="activeTab === 'keypoints'" class="tab-panel">
            <div v-if="video.extractedKeyPoints.length === 0" class="empty-tab">
              <TcmEmpty description="暂无知识点，点击上方「AI 分析视频内容」按钮开始提取" />
            </div>
            <div v-else>
              <!-- 科目匹配筛选 -->
              <div class="match-filter" v-if="subjects.length > 0">
                <span class="filter-label">筛选科目：</span>
                <select v-model="kpSubjectFilter" class="filter-select">
                  <option value="">全部</option>
                  <option v-for="s in subjects" :key="s.id" :value="s.id">{{ s.shortName }}</option>
                </select>
              </div>

              <div v-for="(kp, idx) in filteredKeyPoints" :key="idx" class="kp-card">
                <div class="kp-header">
                  <span class="kp-timestamp" @click="toggleLoop(kp.timestamp, kp.title)">
                    {{ formatDuration(kp.timestamp) }}
                  </span>
                  <strong class="kp-title">{{ kp.title }}</strong>
                  <span v-if="kpMatch(kp, idx)" class="kp-match-tag">
                    {{ kpMatch(kp, idx)?.chapterTitle || kpMatch(kp, idx)?.subjectId }}
                  </span>
                </div>
                <p class="kp-content">{{ kp.content }}</p>
                <!-- 手动关联 -->
                <div class="kp-link-row">
                  <span class="link-label">关联到：</span>
                  <select
                    :value="kpMatch(kp, idx)?.chapterId || ''"
                    @change="updateMatch(idx, ($event.target as HTMLSelectElement).value)"
                    class="link-select"
                  >
                    <option value="">自动匹配 / 未匹配</option>
                    <optgroup v-for="s in subjects" :key="s.id" :label="s.name">
                      <option
                        v-for="ch in chaptersBySubject(s.id)"
                        :key="ch.id"
                        :value="ch.id"
                      >{{ ch.title }}</option>
                    </optgroup>
                  </select>
                </div>
              </div>
            </div>
          </div>

          <!-- 重难点 -->
          <div v-if="activeTab === 'difficult'" class="tab-panel">
            <div v-if="video.extractedDifficultPoints.length === 0" class="empty-tab">
              <TcmEmpty description="暂无重难点" />
            </div>
            <div v-else>
              <div v-for="(dp, idx) in video.extractedDifficultPoints" :key="idx" class="kp-card difficult">
                <div class="kp-header">
                  <span class="kp-timestamp" @click="toggleLoop(dp.timestamp, dp.title)">
                    {{ formatDuration(dp.timestamp) }}
                  </span>
                  <strong class="kp-title">{{ dp.title }}</strong>
                  <TcmTag v-if="dp.type === '重点'" type="high-frequency" size="sm">重点</TcmTag>
                  <TcmTag v-else-if="dp.type === '难点'" type="warning" size="sm">难点</TcmTag>
                  <TcmTag v-else-if="dp.type === '考点'" type="key" size="sm">考点</TcmTag>
                  <TcmTag v-else type="warning" size="sm">重难点</TcmTag>
                </div>
                <p class="kp-content">{{ dp.content }}</p>
              </div>
            </div>
          </div>

          <!-- 文稿 -->
          <div v-if="activeTab === 'transcript'" class="tab-panel">
            <div v-if="!video.aiTranscript && !video.transcriptText" class="empty-tab">
              <TcmEmpty description="暂无文稿" />
            </div>
            <div v-else class="transcript-content">
              <div v-if="video.aiSummary" class="summary-box">
                <h3>总结分析</h3>
                <div v-html="renderedAiSummary" class="markdown-body"></div>
              </div>
              <h3>全文稿</h3>
              <div class="transcript-text" v-html="renderedTranscript"></div>
            </div>
          </div>

          <!-- 相关试题 -->
          <div v-if="activeTab === 'quiz'" class="tab-panel">
            <div v-if="!video?.quizQuestions?.length" class="empty-tab">
              <TcmEmpty description="暂无相关试题，点击上方「AI 分析视频内容」开始匹配试题" />
            </div>
            <div v-else>
              <div v-for="(q, qi) in video.quizQuestions" :key="qi" class="quiz-item">
                <div class="quiz-header">
                  <TcmTag :type="q.source === 'matched' ? 'success' : 'warning'" size="sm">
                    {{ q.source === 'matched' ? '题库匹配' : 'AI 生成' }}
                  </TcmTag>
                  <TcmTag :type="difficultyTag(q.difficulty)" size="sm">
                    {{ difficultyLabel(q.difficulty) }}
                  </TcmTag>
                  <span class="quiz-index">第 {{ qi + 1 }} 题</span>
                </div>
                <div class="quiz-stem markdown-body" v-html="renderMarkdown(q.stem)"></div>
                <div class="quiz-options">
                  <div
                    v-for="opt in q.options"
                    :key="opt.key"
                    :class="['quiz-option', { correct: showedQuizAnswers[qi] && opt.key === q.correctAnswer }]"
                    @click="!showedQuizAnswers[qi] && toggleQuizAnswer(qi)"
                  >
                    <span class="quiz-opt-key">{{ opt.key }}</span>
                    <span class="quiz-opt-text">{{ opt.text }}</span>
                  </div>
                </div>
                <div v-if="showedQuizAnswers[qi]" class="quiz-explanation markdown-body" v-html="renderMarkdown(q.explanation)"></div>
              </div>
            </div>
          </div>

          <!-- 笔记 -->
          <div v-if="activeTab === 'notes'" class="tab-panel">
            <div class="add-note-row" v-if="currentTime > 0">
              <textarea
                v-model="newNoteText"
                rows="2"
                :placeholder="`在 ${formatDuration(currentTime)} 处添加笔记...`"
                class="note-input"
              ></textarea>
              <TcmButton size="sm" variant="primary" :disabled="!newNoteText.trim()" @click="addNote">
                添加笔记
              </TcmButton>
            </div>
            <div v-if="annotations.length === 0" class="empty-tab">
              <TcmEmpty description="暂无笔记，播放视频时点击上方添加" />
            </div>
            <div v-else class="notes-list">
              <div
                v-for="ann in annotations"
                :key="ann.id"
                class="note-item"
                @click="seekTo(ann.timestamp)"
              >
                <span class="note-timestamp">{{ formatDuration(ann.timestamp) }}</span>
                <p class="note-content">{{ ann.content }}</p>
                <button class="note-delete" @click.stop="deleteNote(ann.id)">&#x2715;</button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <TcmEmpty v-else description="视频加载失败" />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onBeforeUnmount } from 'vue'
import { useRoute } from 'vue-router'
import MarkdownIt from 'markdown-it'
import { videoRepo } from '@/db/repositories/videoRepo'
import { useSubjectStore } from '@/stores/useSubjectStore'
import { generateId } from '@/utils/id-generator'
import { formatDuration } from '@/utils/date'
import TcmButton from '@/components/ui/TcmButton.vue'
import TcmTag from '@/components/ui/TcmTag.vue'
import TcmEmpty from '@/components/ui/TcmEmpty.vue'
import type { Video, VideoAnnotation, ProcessingStatus } from '@/types'

const route = useRoute()
const videoId = route.params.videoId as string
const subjectStore = useSubjectStore()

const video = ref<Video | null>(null)
const annotations = ref<VideoAnnotation[]>([])
const videoEl = ref<HTMLVideoElement | null>(null)
const playerInner = ref<HTMLDivElement | null>(null)
const currentTime = ref(0)
const newNoteText = ref('')
const showedQuizAnswers = reactive<Record<number, boolean>>({})
const isFullscreen = ref(false)
const isStartingProcess = ref(false)
const selectedQuality = ref('original')

// 循环播放状态
const isLooping = ref(false)
const loopCount = ref(0)
const loopTarget = ref(3)
const loopStart = ref(0)
const loopEnd = ref(0)
const loopLabel = ref('')

// Tab 状态
const activeTab = ref<'keypoints' | 'difficult' | 'transcript' | 'quiz' | 'notes'>('keypoints')
const kpSubjectFilter = ref('')

let progressTimer: ReturnType<typeof setInterval> | null = null
let transcodeTimer: ReturnType<typeof setInterval> | null = null

const isTranscoding = ref(false)
const transcodeProgress = ref(0)

// 非 MP4/WebM 需要转码
const needsTranscode = computed(() => {
  if (!video.value) return false
  const fmt = video.value.format
  if (!fmt || fmt === 'mp4' || fmt === 'webm') return false
  // 已有转码缓存直接用
  if (video.value.transcodedVariants?.length > 0) return false
  return true
})

const md = new MarkdownIt({ html: false, breaks: true })
const renderedAiSummary = computed(() => md.render(video.value?.aiSummary || video.value?.extractedSummary || ''))
const renderedTranscript = computed(() => {
  const text = video.value?.aiTranscript || video.value?.transcriptText || ''
  return text ? text.replace(/\n/g, '<br>') : ''
})

const tabs = computed(() => [
  { key: 'keypoints' as const, label: '知识点', count: video.value?.extractedKeyPoints?.length || 0 },
  { key: 'difficult' as const, label: '重难点', count: video.value?.extractedDifficultPoints?.length || 0 },
  { key: 'transcript' as const, label: '文稿', count: video.value?.aiTranscript ? 1 : 0 },
  { key: 'quiz' as const, label: '相关试题', count: video.value?.quizQuestions?.length || 0 },
  { key: 'notes' as const, label: '笔记', count: annotations.value.length },
])

const currentSrc = computed(() => {
  if (isTranscoding.value) return undefined
  if (video.value?.transcodedVariants?.length) {
    const variant = video.value.transcodedVariants[0]
    if (variant) return variant.url
  }
  return video.value?.fileUrl
})

const subjects = computed(() => subjectStore.subjects)

// 筛选后的知识点（按科目过滤 + 匹配信息）
const filteredKeyPoints = computed(() => {
  if (!video.value) return []
  const kps = video.value.extractedKeyPoints
  if (!kpSubjectFilter.value) return kps
  return kps.filter((_, i) => {
    const match = video.value?.subjectMatchResult?.find(m => m.videoKpIndex === i)
    return match?.subjectId === kpSubjectFilter.value
  })
})

function kpMatch(_kp: any, idx: number) {
  return video.value?.subjectMatchResult?.find(m => m.videoKpIndex === idx)
}

function chaptersBySubject(subjectId: string) {
  // 简化：从 subjectMatchResult 中获取章节信息
  const matches = video.value?.subjectMatchResult || []
  const seen = new Set<string>()
  const result: { id: string; title: string }[] = []
  for (const m of matches) {
    if (m.subjectId === subjectId && m.chapterId && !seen.has(m.chapterId)) {
      seen.add(m.chapterId)
      result.push({ id: m.chapterId, title: m.chapterTitle || m.chapterId })
    }
  }
  return result
}

function formatTag(format: string): 'default' | 'warning' | 'success' {
  if (format === 'flv') return 'warning'
  if (format === 'mp4' || format === 'webm') return 'success'
  return 'default'
}

function onTimeUpdate() {
  if (videoEl.value) {
    currentTime.value = Math.floor(videoEl.value.currentTime)
    // 循环播放检测
    if (isLooping.value && videoEl.value.currentTime >= loopEnd.value) {
      if (loopCount.value < loopTarget.value) {
        loopCount.value++
        videoEl.value.currentTime = loopStart.value
        videoEl.value.play()
      } else {
        stopLoop()
      }
    }
  }
}

function onVideoEnded() {
  if (isLooping.value && loopCount.value < loopTarget.value) {
    loopCount.value++
    if (videoEl.value) {
      videoEl.value.currentTime = loopStart.value
      videoEl.value.play()
    }
  }
}

function onLoaded() {
  if (videoEl.value && video.value) {
    video.value.duration = Math.floor(videoEl.value.duration)
    videoRepo.update(videoId, { duration: video.value.duration })
  }
}

function seekTo(seconds: number) {
  if (videoEl.value) {
    videoEl.value.currentTime = seconds
    videoEl.value.play()
  }
}

// ─── 循环播放 ───

function toggleLoop(timestamp: number, title: string) {
  if (isLooping.value && loopStart.value === timestamp) {
    stopLoop()
    return
  }
  // 开始循环播放当前片段（30秒窗口）
  loopStart.value = timestamp
  loopEnd.value = timestamp + 30
  loopCount.value = 0
  loopTarget.value = 3
  loopLabel.value = title
  isLooping.value = true
  seekTo(timestamp)
}

function stopLoop() {
  isLooping.value = false
  loopCount.value = 0
  loopLabel.value = ''
}

// ─── 全屏 ───

function toggleFullscreen() {
  if (isFullscreen.value) {
    document.exitFullscreen?.()
  } else {
    playerInner.value?.requestFullscreen?.()
  }
}

function onFullscreenChange() {
  isFullscreen.value = !!document.fullscreenElement
}

// ─── AI 处理 ───

const processingElapsed = ref('')

function formatElapsed(seconds: number): string {
  if (seconds <= 0) return ''
  const h = Math.floor(seconds / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  const s = Math.floor(seconds % 60)
  if (h > 0) return `${h}时${m}分${s}秒`
  if (m > 0) return `${m}分${s}秒`
  return `${s}秒`
}

function renderMarkdown(text: string): string {
  return md.render(text)
}

function difficultyTag(d: number): 'default' | 'warning' | 'success' {
  if (d >= 4) return 'warning'
  if (d >= 3) return 'default'
  return 'success'
}
function difficultyLabel(d: number): string {
  if (d >= 5) return '真题难度'
  if (d >= 4) return '进阶'
  if (d >= 3) return '中等'
  return '基础'
}
function toggleQuizAnswer(qi: number) {
  showedQuizAnswers[qi] = !showedQuizAnswers[qi]
}

const isProcessing = computed(() => {
  const s = video.value?.processingStatus
  return s === 'transcribing' || s === 'extracting' || s === 'summarizing' || s === 'matching' || s === 'generating_quiz'
})

async function startAIProcess() {
  if (isProcessing.value) return // 防呆
  isStartingProcess.value = true
  try {
    await videoRepo.startProcessing(videoId, true)
    pollProcessingProgress()
  } catch (e) {
    alert(`启动失败: ${(e as Error).message}`)
  } finally {
    isStartingProcess.value = false
  }
}

async function cancelAIProcess() {
  try {
    await videoRepo.cancelProcessing(videoId)
    const v = await videoRepo.findById(videoId)
    if (v) video.value = v
  } catch (e) {
    alert(`取消失败: ${(e as Error).message}`)
  }
}

function pollProcessingProgress() {
  if (progressTimer) clearInterval(progressTimer)
  progressTimer = setInterval(async () => {
    if (!video.value) return
    try {
      const p = await videoRepo.getProcessingProgress(videoId)
      if (p && video.value) {
        video.value.processingProgress = p.percent
        video.value.processingStep = p.stepLabel
        video.value.processingStatus = p.step as ProcessingStatus
        processingElapsed.value = formatElapsed(p.elapsed || 0)

        if (p.step === 'ready' || p.step === 'error') {
          if (progressTimer) { clearInterval(progressTimer); progressTimer = null }
          // 重新加载视频数据
          const v = await videoRepo.findById(videoId)
          if (v) video.value = v
        }
      }
    } catch { /* ignore */ }
  }, 2000)
}

// ─── 笔记 ───

async function addNote() {
  if (!newNoteText.value.trim()) return
  const annotation: VideoAnnotation = {
    id: generateId('ann_'),
    videoId,
    timestamp: currentTime.value,
    content: newNoteText.value.trim(),
    createdAt: Date.now(),
  }
  await videoRepo.addAnnotation(annotation)
  annotations.value.unshift(annotation)
  newNoteText.value = ''
}

async function deleteNote(id: string) {
  await videoRepo.deleteAnnotation(videoId, id)
  annotations.value = annotations.value.filter(a => a.id !== id)
}

// ─── 手动关联知识点 ───

async function updateMatch(kpIndex: number, chapterId: string) {
  if (!video.value) return
  const matches = [...(video.value.subjectMatchResult || [])]
  const existing = matches.findIndex(m => m.videoKpIndex === kpIndex)

  if (existing >= 0) {
    matches[existing] = { ...matches[existing], chapterId, manual: true }
  } else {
    matches.push({
      videoKpIndex: kpIndex,
      videoKpTitle: video.value.extractedKeyPoints[kpIndex]?.title || '',
      subjectId: '', chapterId, chapterTitle: '', confidence: 1, manual: true,
    })
  }

  video.value.subjectMatchResult = matches
  await videoRepo.updateMatchResults(videoId, matches)
}

// ─── 导出 ───

function exportCurrentTab() {
  if (!video.value) return
  let content = ''
  let filename = ''

  switch (activeTab.value) {
    case 'keypoints': {
      filename = `${video.value.title}-知识点.txt`
      content = `# ${video.value.title} - 知识点\n\n`
      const kps = filteredKeyPoints.value
      for (const kp of kps) {
        content += `## [${formatDuration(kp.timestamp)}] ${kp.title}\n${kp.content}\n\n`
      }
      break
    }
    case 'difficult': {
      filename = `${video.value.title}-重难点.txt`
      content = `# ${video.value.title} - 重难点\n\n`
      for (const dp of video.value.extractedDifficultPoints) {
        content += `## [${formatDuration(dp.timestamp)}] ${dp.title}\n${dp.content}\n\n`
      }
      break
    }
    case 'transcript': {
      filename = `${video.value.title}-文稿.md`
      content = `# ${video.value.title}\n\n## 总结分析\n\n${video.value.aiSummary || video.value.extractedSummary}\n\n## 全文稿\n\n${video.value.aiTranscript || video.value.transcriptText}`
      break
    }
    case 'notes': {
      filename = `${video.value.title}-笔记.txt`
      content = `# ${video.value.title} - 笔记\n\n`
      for (const ann of annotations.value) {
        content += `[${formatDuration(ann.timestamp)}] ${ann.content}\n\n`
      }
      break
    }
  }

  const blob = new Blob([content], { type: 'text/plain;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}

// ─── 转码 ───

async function startTranscode() {
  if (!video.value) return

  try {
    const result = await videoRepo.transcodeForPlayback(videoId)

    if (result.status === 'done') {
      // 已经转好了，直接刷新播放
      const updated = await videoRepo.findById(videoId)
      if (updated) video.value = updated
      return
    }
  } catch { /* proceed with polling */ }

  // 转码进行中，显示进度
  isTranscoding.value = true
  transcodeProgress.value = 0

  transcodeTimer = setInterval(async () => {
    const updated = await videoRepo.findById(videoId)
    if (updated) {
      video.value = updated
      if (updated.transcodedVariants?.length > 0) {
        isTranscoding.value = false
        transcodeProgress.value = 100
        if (transcodeTimer) { clearInterval(transcodeTimer); transcodeTimer = null }
        return
      }
    }
    transcodeProgress.value = Math.min(95, transcodeProgress.value + Math.random() * 5 + 2)
  }, 2000)
}

// ─── Lifecycle ───

onMounted(async () => {
  await subjectStore.loadSubjects()
  const v = await videoRepo.findById(videoId)
  video.value = v || null
  annotations.value = await videoRepo.getAnnotations(videoId)

  // 如果正在处理中，轮询进度
  if (video.value && video.value.processingStatus !== 'ready' && video.value.processingStatus !== 'raw' && video.value.processingStatus !== 'error') {
    pollProcessingProgress()
  }

  if (video.value && needsTranscode.value) {
    startTranscode()
  }

  document.addEventListener('fullscreenchange', onFullscreenChange)
})

onBeforeUnmount(() => {
  if (progressTimer) clearInterval(progressTimer)
  if (transcodeTimer) clearInterval(transcodeTimer)
  document.removeEventListener('fullscreenchange', onFullscreenChange)
})
</script>

<style scoped>
.page-video-player { /* width fills container */ }
.back-link { color: var(--tcm-text-secondary); font-size: var(--tcm-font-sm); text-decoration: none; }
.back-link:hover { color: var(--tcm-primary-500); }
.page-title { font-family: var(--tcm-font-decorative); font-size: var(--tcm-font-2xl); color: var(--tcm-text-primary); margin: 12px 0 24px; }

/* ─── 播放器 ─── */
.player-container { display: flex; flex-direction: column; gap: 16px; }
.player-wrapper { border-radius: var(--tcm-radius-lg); overflow: hidden; background: #000; }
.player-wrapper.is-fullscreen { border-radius: 0; }
.player-inner { position: relative; background: #000; }
.video-element { width: 100%; display: block; max-height: 70vh; object-fit: contain; }
.is-fullscreen .video-element { max-height: 100vh; }

/* 转码遮罩 */
.transcode-overlay { position: absolute; inset: 0; display: flex; align-items: center; justify-content: center; background: rgba(0,0,0,0.85); z-index: 5; }
.transcode-box { text-align: center; color: #fff; }
.transcode-spin { font-size: 48px; display: block; animation: spin 2s linear infinite; margin-bottom: 16px; }
@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
.transcode-box p { margin: 4px 0; font-size: 16px; }
.transcode-hint { font-size: 13px; opacity: 0.6; }
.transcode-bar { width: 240px; height: 4px; background: rgba(255,255,255,0.2); border-radius: 2px; margin: 12px auto 4px; overflow: hidden; }
.transcode-fill { height: 100%; background: #4CAF50; border-radius: 2px; transition: width 0.5s; }
.transcode-pct { font-size: 13px; opacity: 0.7; }

.player-controls-ext {
  display: flex; align-items: center; justify-content: space-between;
  padding: 8px 12px; background: #1a1a1a; gap: 8px;
}
.controls-left, .controls-right { display: flex; align-items: center; gap: 8px; }
.quality-select {
  padding: 2px 8px; background: #333; color: #fff; border: 1px solid #555;
  border-radius: 4px; font-size: 12px; outline: none;
}

/* ─── 循环播放指示器 ─── */
.loop-indicator {
  position: absolute; top: 12px; left: 50%; transform: translateX(-50%);
  display: flex; align-items: center; gap: 12px;
  padding: 8px 16px; background: rgba(0,0,0,0.85); border-radius: 24px;
  z-index: 10;
}
.loop-badge { color: #fff; font-weight: 600; font-size: 14px;
  padding: 2px 10px; background: var(--tcm-primary-500); border-radius: 12px; }
.loop-info { color: #ccc; font-size: 13px; max-width: 200px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }

/* ─── 处理进度条 ─── */
.processing-banner {
  display: flex; align-items: center; gap: 12px;
  padding: 12px 16px; background: var(--tcm-bg-surface);
  border: 1px solid var(--tcm-border-light); border-radius: var(--tcm-radius-md);
}
.processing-info { display: flex; align-items: center; gap: 8px; font-size: var(--tcm-font-sm); color: var(--tcm-text-secondary); min-width: 180px; }
.processing-spin { font-size: 18px; animation: spin 2s linear infinite; }
@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
.processing-bar-wrap { flex: 1; height: 6px; background: rgba(0,0,0,0.08); border-radius: 3px; overflow: hidden; }
.processing-bar-fill {
  height: 100%; border-radius: 3px; transition: width 0.6s ease;
  background: linear-gradient(90deg, var(--tcm-primary-400, #b8860b), var(--tcm-primary-500, #8b6914));
  min-width: 2px;
  position: relative;
}
.processing-bar-fill::after {
  content: '';
  position: absolute; inset: 0;
  background: linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.25) 50%, transparent 100%);
  animation: barShimmer 2s ease-in-out infinite;
}
@keyframes barShimmer {
  0% { transform: translateX(-100%); }
  100% { transform: translateX(100%); }
}
.processing-pct { font-size: var(--tcm-font-sm); color: var(--tcm-text-secondary); min-width: 35px; text-align: right; }

/* ─── 触发 AI ─── */
.action-banner {
  display: flex; flex-direction: column; align-items: center; gap: 8px;
  padding: 20px; background: #FDF0ED; border: 1px solid var(--tcm-primary-300);
  border-radius: var(--tcm-radius-md); text-align: center;
}
.action-hint { font-size: var(--tcm-font-xs); color: var(--tcm-text-disabled); }
.error-msg { font-size: var(--tcm-font-sm); color: var(--tcm-warning-600); }

/* ─── Tab ─── */
.tabs-section { border: 1px solid var(--tcm-border-light); border-radius: var(--tcm-radius-lg); overflow: hidden; background: var(--tcm-bg-surface); }
.tabs-header { display: flex; align-items: center; border-bottom: 1px solid var(--tcm-border-light); background: var(--tcm-bg-elevated); }
.tab-btn { padding: 12px 20px; border: none; background: none; font-size: var(--tcm-font-sm); font-weight: 500; color: var(--tcm-text-secondary); cursor: pointer; border-bottom: 2px solid transparent; transition: all 0.15s; font-family: inherit; position: relative; }
.tab-btn:hover { color: var(--tcm-text-primary); }
.tab-btn.active { color: var(--tcm-primary-500); border-bottom-color: var(--tcm-primary-500); font-weight: 600; }
.tab-count { margin-left: 4px; padding: 1px 6px; background: var(--tcm-primary-100); color: var(--tcm-primary-500); border-radius: 10px; font-size: 11px; }
.tabs-actions { margin-left: auto; padding-right: 12px; }
.tab-content { padding: 16px 20px; max-height: 600px; overflow-y: auto; }

.empty-tab { padding: 40px 0; }

/* ─── 知识点卡片 ─── */
.kp-card { padding: 12px 16px; border: 1px solid var(--tcm-border-light); border-radius: var(--tcm-radius-md); margin-bottom: 12px; background: var(--tcm-bg-base); }
.kp-card.difficult { border-left: 3px solid var(--tcm-warning-500); }
.kp-header { display: flex; align-items: center; gap: 10px; margin-bottom: 6px; }
.kp-timestamp { color: var(--tcm-primary-500); font-size: var(--tcm-font-sm); font-weight: 600; cursor: pointer; min-width: 60px; }
.kp-timestamp:hover { text-decoration: underline; }
.kp-title { font-size: var(--tcm-font-md); color: var(--tcm-text-primary); }
.kp-match-tag { margin-left: auto; padding: 1px 8px; background: #e8f5e9; color: #2e7d32; font-size: 11px; border-radius: 10px; white-space: nowrap; }
.kp-content { font-size: var(--tcm-font-sm); color: var(--tcm-text-secondary); line-height: 1.7; margin-top: 4px; }
.kp-link-row { display: flex; align-items: center; gap: 8px; margin-top: 8px; padding-top: 8px; border-top: 1px solid var(--tcm-border-light); }
.link-label { font-size: 11px; color: var(--tcm-text-disabled); white-space: nowrap; }
.link-select, .filter-select {
  padding: 2px 8px; border: 1px solid var(--tcm-border); border-radius: 4px;
  font-size: 12px; background: var(--tcm-bg-base); color: var(--tcm-text-primary); outline: none;
  max-width: 250px;
}

/* ─── 筛选 ─── */
.match-filter { display: flex; align-items: center; gap: 8px; margin-bottom: 16px; }
.filter-label { font-size: var(--tcm-font-sm); color: var(--tcm-text-secondary); }

/* ─── 文稿 ─── */
.summary-box { padding: 16px; background: #faf8f5; border: 1px solid var(--tcm-border-light); border-radius: var(--tcm-radius-md); margin-bottom: 20px; }
.summary-box h3 { font-size: var(--tcm-font-md); margin-bottom: 8px; color: var(--tcm-text-primary); }
.transcript-text { font-size: var(--tcm-font-sm); line-height: 1.9; color: var(--tcm-text-secondary); }
.markdown-body { font-size: var(--tcm-font-sm); line-height: 1.8; color: var(--tcm-text-secondary); }

/* ─── 笔记 ─── */
.add-note-row { display: flex; gap: 8px; margin-bottom: 16px; align-items: flex-end; }
.note-input { flex: 1; padding: 8px 12px; border: 1px solid var(--tcm-border); border-radius: var(--tcm-radius-md); font-size: var(--tcm-font-sm); background: var(--tcm-bg-base); color: var(--tcm-text-primary); outline: none; font-family: inherit; resize: vertical; box-sizing: border-box; }
.note-input:focus { border-color: var(--tcm-primary-500); }
.notes-list { display: flex; flex-direction: column; gap: 8px; }
.note-item { display: flex; align-items: flex-start; gap: 10px; padding: 8px 12px; border-radius: var(--tcm-radius-sm); cursor: pointer; transition: background 0.15s; }
.note-item:hover { background: var(--tcm-bg-elevated); }
.note-timestamp { font-size: var(--tcm-font-xs); color: var(--tcm-primary-500); font-weight: 600; min-width: 55px; }
.note-content { font-size: var(--tcm-font-sm); color: var(--tcm-text-secondary); flex: 1; }
.note-delete { border: none; background: none; color: var(--tcm-text-disabled); cursor: pointer; padding: 2px 6px; font-size: 12px; }
.note-delete:hover { color: var(--tcm-warning-600); }

/* ─── 相关试题 ─── */
.quiz-item { border: 1px solid var(--tcm-border-light); border-radius: var(--tcm-radius-md); padding: 16px; margin-bottom: 12px; background: var(--tcm-bg-surface); }
.quiz-header { display: flex; align-items: center; gap: 8px; margin-bottom: 10px; }
.quiz-index { font-size: var(--tcm-font-xs); color: var(--tcm-text-disabled); margin-left: auto; }
.quiz-stem { font-size: var(--tcm-font-md); color: var(--tcm-text-primary); line-height: 1.7; margin-bottom: 10px; }
.quiz-options { display: flex; flex-direction: column; gap: 6px; }
.quiz-option { display: flex; align-items: center; gap: 10px; padding: 8px 12px; border: 1px solid var(--tcm-border-light); border-radius: var(--tcm-radius-sm); cursor: pointer; transition: all 0.15s; }
.quiz-option:hover { background: var(--tcm-bg-elevated); border-color: var(--tcm-primary-300); }
.quiz-option.correct { background: rgba(16,185,129,0.1); border-color: rgba(16,185,129,0.4); color: #10b981; }
.quiz-opt-key { width: 22px; height: 22px; border-radius: 50%; background: var(--tcm-bg-elevated); display: flex; align-items: center; justify-content: center; font-size: 12px; font-weight: 600; }
.quiz-option.correct .quiz-opt-key { background: #10b981; color: #fff; }
.quiz-opt-text { flex: 1; font-size: var(--tcm-font-sm); }
.quiz-explanation { margin-top: 10px; padding: 10px 12px; background: rgba(16,185,129,0.05); border-radius: var(--tcm-radius-sm); font-size: var(--tcm-font-sm); color: var(--tcm-text-secondary); }
</style>
