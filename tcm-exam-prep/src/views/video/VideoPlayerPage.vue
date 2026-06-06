<template>
  <div class="page-video-player">
    <router-link to="/videos" class="back-link">&#x2190; 返回视频列表</router-link>
    <h1 class="page-title">{{ video?.title || '视频播放' }}</h1>

    <div v-if="video" class="player-layout">
      <div class="player-main">
        <div class="video-wrapper">
          <video
            ref="videoEl"
            :src="video.fileUrl"
            class="video-element"
            controls
            @timeupdate="onTimeUpdate"
            @loadedmetadata="onLoaded"
          ></video>
        </div>

        <div class="video-info-bar">
          <div class="video-subjects">
            <TcmTag v-for="sid in video.subjectIds" :key="sid" type="default" size="sm">
              {{ getSubjectName(sid) }}
            </TcmTag>
          </div>
          <span class="video-desc-text">{{ video.description || '暂无描述' }}</span>
        </div>

        <!-- AI知识提取展示区域 -->
        <TcmCard v-if="video.extractedSummary" title="AI 知识提取" class="mt-4">
          <div class="extracted-summary" v-html="renderedSummary"></div>
          <div v-if="video.extractedKeyPoints.length" class="extracted-points">
            <h4>提取的知识点</h4>
            <div v-for="(kp, idx) in video.extractedKeyPoints" :key="idx" class="keypoint-item">
              <span class="kp-timestamp" @click="seekTo(kp.timestamp)">{{ formatDuration(kp.timestamp) }}</span>
              <div>
                <strong>{{ kp.title }}</strong>
                <p>{{ kp.content }}</p>
              </div>
            </div>
          </div>
        </TcmCard>
      </div>

      <div class="player-sidebar">
        <TcmCard title="时间戳笔记">
          <div class="annotation-list" v-if="annotations.length > 0">
            <div
              v-for="ann in annotations"
              :key="ann.id"
              class="annotation-item"
              @click="seekTo(ann.timestamp)"
            >
              <span class="ann-timestamp">{{ formatDuration(ann.timestamp) }}</span>
              <p class="ann-content">{{ ann.content }}</p>
            </div>
          </div>
          <TcmEmpty v-else description="点击下方按钮添加笔记" />
        </TcmCard>

        <div class="add-annotation" v-if="currentTime > 0">
          <textarea
            v-model="newAnnotation"
            rows="2"
            placeholder="在此时间点添加笔记..."
            class="annotation-input"
          ></textarea>
          <TcmButton size="sm" variant="primary" :disabled="!newAnnotation.trim()" @click="addNote">
            添加笔记 ({{ formatDuration(currentTime) }})
          </TcmButton>
        </div>
      </div>
    </div>

    <TcmEmpty v-else description="视频加载失败" />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useRoute } from 'vue-router'
import MarkdownIt from 'markdown-it'
import { videoRepo } from '@/db/repositories/videoRepo'
import { useSubjectStore } from '@/stores/useSubjectStore'
import { generateId } from '@/utils/id-generator'
import { formatDuration } from '@/utils/date'
import TcmCard from '@/components/ui/TcmCard.vue'
import TcmButton from '@/components/ui/TcmButton.vue'
import TcmTag from '@/components/ui/TcmTag.vue'
import TcmEmpty from '@/components/ui/TcmEmpty.vue'
import type { Video, VideoAnnotation } from '@/types'

const route = useRoute()
const videoId = route.params.videoId as string

const video = ref<Video | null>(null)
const annotations = ref<VideoAnnotation[]>([])
const videoEl = ref<HTMLVideoElement | null>(null)
const currentTime = ref(0)
const newAnnotation = ref('')
const subjectStore = useSubjectStore()

const md = new MarkdownIt({ html: false, breaks: true })
const renderedSummary = computed(() => video.value ? md.render(video.value.extractedSummary) : '')

function getSubjectName(id: string): string {
  return subjectStore.subjects.find(s => s.id === id)?.shortName || id
}

function onTimeUpdate() {
  if (videoEl.value) currentTime.value = Math.floor(videoEl.value.currentTime)
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

async function addNote() {
  if (!newAnnotation.value.trim()) return
  const annotation: VideoAnnotation = {
    id: generateId('ann_'),
    videoId,
    timestamp: currentTime.value,
    content: newAnnotation.value.trim(),
    createdAt: Date.now(),
  }
  await videoRepo.addAnnotation(annotation)
  annotations.value.unshift(annotation)
  newAnnotation.value = ''
}

onMounted(async () => {
  await subjectStore.loadSubjects()
  const v = await videoRepo.findById(videoId)
  video.value = v || null
  annotations.value = await videoRepo.getAnnotations(videoId)
})
</script>

<style scoped>
.page-video-player { /* 宽度动态填充 */ }
.back-link { color: var(--tcm-text-secondary); font-size: var(--tcm-font-sm); text-decoration: none; }
.back-link:hover { color: var(--tcm-primary-500); }
.page-title { font-family: var(--tcm-font-decorative); font-size: var(--tcm-font-2xl); color: var(--tcm-text-primary); margin: 12px 0 24px; }

.player-layout { display: flex; gap: 24px; align-items: flex-start; }
@media (max-width: 768px) { .player-layout { flex-direction: column; } }

.player-main { flex: 1; min-width: 0; }
.video-wrapper { background: #000; border-radius: var(--tcm-radius-lg); overflow: hidden; }
.video-element { width: 100%; display: block; }
.video-info-bar { display: flex; align-items: center; gap: 12px; margin-top: 12px; flex-wrap: wrap; }
.video-desc-text { font-size: var(--tcm-font-sm); color: var(--tcm-text-secondary); }

.player-sidebar { width: 280px; flex-shrink: 0; }
@media (max-width: 768px) { .player-sidebar { width: 100%; } }

.annotation-list { max-height: 300px; overflow-y: auto; }
.annotation-item { padding: 8px 12px; border-radius: var(--tcm-radius-sm); cursor: pointer; transition: background 0.15s; margin-bottom: 4px; }
.annotation-item:hover { background: var(--tcm-bg-elevated); }
.ann-timestamp { font-size: var(--tcm-font-xs); color: var(--tcm-primary-500); font-weight: 600; }
.ann-content { font-size: var(--tcm-font-sm); color: var(--tcm-text-secondary); margin-top: 2px; }

.add-annotation { margin-top: 12px; display: flex; flex-direction: column; gap: 8px; }
.annotation-input { width: 100%; padding: 8px 12px; border: 1px solid var(--tcm-border); border-radius: var(--tcm-radius-md); font-size: var(--tcm-font-sm); background: var(--tcm-bg-base); color: var(--tcm-text-primary); outline: none; font-family: inherit; resize: vertical; box-sizing: border-box; }
.annotation-input:focus { border-color: var(--tcm-primary-500); }

.extracted-summary { font-size: var(--tcm-font-sm); color: var(--tcm-text-secondary); line-height: 1.8; }
.extracted-points { margin-top: 16px; }
.extracted-points h4 { font-size: var(--tcm-font-md); margin-bottom: 8px; }
.keypoint-item { display: flex; gap: 12px; padding: 8px 0; border-bottom: 1px solid var(--tcm-border-light); }
.kp-timestamp { color: var(--tcm-primary-500); font-size: var(--tcm-font-sm); font-weight: 600; cursor: pointer; min-width: 50px; }
.kp-timestamp:hover { text-decoration: underline; }
.keypoint-item strong { font-size: var(--tcm-font-sm); }
.keypoint-item p { font-size: var(--tcm-font-xs); color: var(--tcm-text-secondary); }
.mt-4 { margin-top: 16px; }
</style>
