<template>
  <div class="page-video-upload">
    <router-link to="/videos" class="back-link">&#x2190; 返回视频列表</router-link>
    <h1 class="page-title">上传视频</h1>

    <TcmCard title="视频信息">
      <div class="upload-form">
        <div class="form-group">
          <label>视频标题</label>
          <input v-model="title" type="text" placeholder="输入视频标题" class="form-input" />
        </div>
        <div class="form-group">
          <label>描述 (可选)</label>
          <textarea v-model="description" rows="3" placeholder="简要描述视频内容" class="form-input"></textarea>
        </div>
        <div class="form-group">
          <label>归类到科目</label>
          <div class="subject-tags">
            <span
              v-for="s in subjectStore.subjects"
              :key="s.id"
              :class="['subject-tag', { selected: selectedSubject === s.id }]"
              @click="selectedSubject = selectedSubject === s.id ? '' : s.id"
            >{{ s.shortName }}</span>
          </div>
          <p class="form-hint">视频将保存到 video/{{ selectedSubject || '根目录' }} 下</p>
        </div>
        <div class="form-group">
          <label>视频文件</label>
          <div class="upload-area" @click="triggerUpload" @dragover.prevent @drop.prevent="handleDrop">
            <div v-if="!videoFile" class="upload-placeholder">
              <span class="upload-icon">&#x1F4C1;</span>
              <p>点击选择视频文件或拖拽到此处</p>
              <p class="upload-hint">支持 MP4、WebM、FLV、MKV、AVI、MOV、WMV</p>
            </div>
            <div v-else class="upload-file-info">
              <span class="file-name">{{ videoFile.name }}</span>
              <span class="file-size">{{ formatSize(videoFile.size) }}</span>
              <TcmTag :type="detectFormat(videoFile.name) === 'flv' ? 'warning' : 'success'" size="sm">
                {{ detectFormat(videoFile.name).toUpperCase() }}
              </TcmTag>
            </div>
            <input ref="fileInput" type="file" accept="video/*,.flv,.mkv,.avi,.mov,.wmv" @change="handleFileSelect" hidden />
          </div>
        </div>

        <div class="form-group" v-if="videoFile">
          <label>
            <input type="checkbox" v-model="autoProcess" class="checkbox" />
            上传后自动 AI 处理（转码 → 语音转文字 → 提取知识点）
          </label>
        </div>

        <div class="form-actions">
          <TcmButton variant="primary" :disabled="!canSubmit" :loading="isUploading" @click="uploadVideo">
            {{ isUploading ? '上传中...' : '上传视频' }}
          </TcmButton>
        </div>
      </div>
    </TcmCard>

    <TcmCard title="格式说明" class="mt-4">
      <div class="format-info">
        <div class="format-row">
          <TcmTag type="success" size="sm">MP4 / WEBM</TcmTag>
          <span>浏览器原生支持，播放性能最佳。系统会自动转码为 H.264 MP4 多码率版本</span>
        </div>
        <div class="format-row">
          <TcmTag type="warning" size="sm">FLV / MKV / AVI / MOV / WMV</TcmTag>
          <span>需要后台转码为 MP4 后才能浏览器播放，处理时间视视频大小而定</span>
        </div>
      </div>
    </TcmCard>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { videoRepo } from '@/db/repositories/videoRepo'
import { useSubjectStore } from '@/stores/useSubjectStore'
import TcmCard from '@/components/ui/TcmCard.vue'
import TcmButton from '@/components/ui/TcmButton.vue'
import TcmTag from '@/components/ui/TcmTag.vue'
import type { VideoFormat } from '@/types'

const router = useRouter()
const subjectStore = useSubjectStore()

onMounted(async () => { await subjectStore.loadSubjects() })

const title = ref('')
const description = ref('')
const selectedSubject = ref('')
const videoFile = ref<File | null>(null)
const isUploading = ref(false)
const autoProcess = ref(true)
const fileInput = ref<HTMLInputElement | null>(null)

const canSubmit = computed(() => title.value && videoFile.value)

function detectFormat(filename: string): VideoFormat {
  const ext = filename.split('.').pop()?.toLowerCase() || ''
  const map: Record<string, VideoFormat> = {
    mp4: 'mp4', webm: 'webm', flv: 'flv', mkv: 'mkv', avi: 'avi', mov: 'mov', wmv: 'wmv',
  }
  return map[ext] || 'unknown'
}

function triggerUpload() { fileInput.value?.click() }
function handleFileSelect(e: Event) {
  const input = e.target as HTMLInputElement
  if (input.files?.[0]) videoFile.value = input.files[0]
}
function handleDrop(e: DragEvent) {
  const file = e.dataTransfer?.files[0]
  if (file) videoFile.value = file
}
function formatSize(bytes: number): string {
  const mb = bytes / (1024 * 1024)
  return mb >= 1 ? `${mb.toFixed(1)} MB` : `${(bytes / 1024).toFixed(1)} KB`
}

async function uploadVideo() {
  if (!canSubmit.value || !videoFile.value) return
  isUploading.value = true

  try {
    const formData = new FormData()
    formData.append('file', videoFile.value)
    formData.append('title', title.value)
    formData.append('description', description.value)
    formData.append('subjectId', selectedSubject.value)

    const video = await videoRepo.uploadFile(formData)

    // 自动触发 AI 处理
    if (autoProcess.value) {
      videoRepo.startProcessing(video.id).catch(() => {})
    }

    router.push('/videos')
  } catch (e) {
    console.error('上传失败:', e)
    alert(`上传失败: ${(e as Error).message}`)
  } finally {
    isUploading.value = false
  }
}
</script>

<style scoped>
.page-video-upload { /* width fills container */ }
.back-link { color: var(--tcm-text-secondary); font-size: var(--tcm-font-sm); text-decoration: none; }
.back-link:hover { color: var(--tcm-primary-500); }
.page-title { font-family: var(--tcm-font-decorative); font-size: var(--tcm-font-2xl); color: var(--tcm-text-primary); margin: 12px 0 24px; }
.upload-form { display: flex; flex-direction: column; gap: 20px; }
.form-group { display: flex; flex-direction: column; gap: 6px; }
.form-group label { font-size: var(--tcm-font-sm); font-weight: 600; color: var(--tcm-text-primary); }
.form-hint { font-size: var(--tcm-font-xs); color: var(--tcm-text-disabled); margin-top: 4px; }
.form-input { width: 100%; padding: 10px 14px; border: 1px solid var(--tcm-border); border-radius: var(--tcm-radius-md); font-size: var(--tcm-font-base); background: var(--tcm-bg-base); color: var(--tcm-text-primary); outline: none; font-family: inherit; box-sizing: border-box; }
.form-input:focus { border-color: var(--tcm-primary-500); }
textarea.form-input { resize: vertical; }
.checkbox { margin-right: 6px; }
.subject-tags { display: flex; flex-wrap: wrap; gap: 8px; }
.subject-tag { padding: 4px 12px; border: 1px solid var(--tcm-border); border-radius: 16px; font-size: var(--tcm-font-xs); cursor: pointer; transition: all 0.15s; color: var(--tcm-text-secondary); }
.subject-tag:hover { border-color: var(--tcm-primary-300); }
.subject-tag.selected { background: #FDF0ED; border-color: var(--tcm-primary-500); color: var(--tcm-primary-500); }
.upload-area { border: 2px dashed var(--tcm-border); border-radius: var(--tcm-radius-lg); padding: 40px; text-align: center; cursor: pointer; transition: border-color 0.2s; }
.upload-area:hover { border-color: var(--tcm-primary-300); }
.upload-icon { font-size: 48px; opacity: 0.5; }
.upload-placeholder p { margin-top: 8px; color: var(--tcm-text-secondary); }
.upload-hint { font-size: var(--tcm-font-xs); color: var(--tcm-text-disabled); }
.upload-file-info { display: flex; align-items: center; flex-direction: column; gap: 8px; }
.file-name { font-weight: 600; color: var(--tcm-text-primary); word-break: break-all; }
.file-size { font-size: var(--tcm-font-sm); color: var(--tcm-text-secondary); }
.form-actions { padding-top: 8px; }
.mt-4 { margin-top: 16px; }
.format-info { display: flex; flex-direction: column; gap: 12px; }
.format-row { display: flex; align-items: center; gap: 10px; font-size: var(--tcm-font-sm); color: var(--tcm-text-secondary); }
</style>
