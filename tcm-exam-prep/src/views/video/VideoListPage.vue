<template>
  <div class="page-videos">
    <div class="page-header">
      <h1 class="page-title">视频学习</h1>
      <router-link to="/videos/upload">
        <TcmButton variant="primary" size="sm">上传视频</TcmButton>
      </router-link>
    </div>

    <div v-if="videos.length > 0" class="video-grid">
      <div v-for="video in videos" :key="video.id" class="video-card" @click="$router.push(`/videos/${video.id}`)">
        <div class="video-thumbnail">
          <div class="video-thumbnail-placeholder">
            <span class="video-play-icon">&#x25B6;</span>
          </div>
          <span class="video-duration">{{ formatDuration(video.duration) }}</span>
        </div>
        <div class="video-info">
          <h3 class="video-title">{{ video.title }}</h3>
          <p class="video-desc">{{ video.description || '暂无描述' }}</p>
          <div class="video-meta">
            <TcmTag :type="statusTagType(video.status)" size="sm">{{ statusLabel(video.status) }}</TcmTag>
            <span class="video-subjects">{{ video.subjectIds.map(getSubjectName).join('、') }}</span>
          </div>
        </div>
      </div>
    </div>

    <TcmEmpty v-else description="还没有上传视频，点击上方按钮上传你的第一个学习视频" />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { videoRepo } from '@/db/repositories/videoRepo'
import { useSubjectStore } from '@/stores/useSubjectStore'
import TcmButton from '@/components/ui/TcmButton.vue'
import TcmTag from '@/components/ui/TcmTag.vue'
import TcmEmpty from '@/components/ui/TcmEmpty.vue'
import { formatDuration } from '@/utils/date'
import type { Video, VideoStatus } from '@/types'

const videos = ref<Video[]>([])
const subjectStore = useSubjectStore()

function getSubjectName(id: string): string {
  return subjectStore.subjects.find(s => s.id === id)?.shortName || id
}

function statusLabel(status: VideoStatus): string {
  const labels: Record<VideoStatus, string> = {
    uploading: '上传中', processing: '处理中', ready: '可学习', error: '失败',
  }
  return labels[status]
}

function statusTagType(status: VideoStatus): 'default' | 'warning' | 'success' {
  if (status === 'ready') return 'success'
  if (status === 'error') return 'warning'
  return 'default'
}

onMounted(async () => {
  await subjectStore.loadSubjects()
  videos.value = await videoRepo.findAll()
})
</script>

<style scoped>
.page-videos { /* 宽度动态填充 */ }
.page-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 24px; }
.page-title { font-family: var(--tcm-font-decorative); font-size: var(--tcm-font-2xl); color: var(--tcm-text-primary); }
.video-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 16px; }
.video-card { background: var(--tcm-bg-surface); border: 1px solid var(--tcm-border-light); border-radius: var(--tcm-radius-lg); overflow: hidden; cursor: pointer; transition: all 0.2s; }
.video-card:hover { box-shadow: var(--tcm-shadow-md); transform: translateY(-2px); }
.video-thumbnail { position: relative; height: 160px; background: linear-gradient(135deg, #2C1810, #5C1A00); display: flex; align-items: center; justify-content: center; }
.video-play-icon { font-size: 48px; color: rgba(255,255,255,0.8); }
.video-duration { position: absolute; bottom: 8px; right: 8px; padding: 2px 8px; background: rgba(0,0,0,0.7); color: #fff; font-size: var(--tcm-font-xs); border-radius: 4px; }
.video-info { padding: 14px; }
.video-title { font-size: var(--tcm-font-md); font-weight: 600; color: var(--tcm-text-primary); margin-bottom: 4px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.video-desc { font-size: var(--tcm-font-sm); color: var(--tcm-text-secondary); margin-bottom: 8px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.video-meta { display: flex; align-items: center; gap: 8px; }
.video-subjects { font-size: var(--tcm-font-xs); color: var(--tcm-text-disabled); }
</style>
