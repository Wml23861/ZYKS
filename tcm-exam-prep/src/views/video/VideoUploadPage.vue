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
          <label>关联科目</label>
          <div class="subject-tags">
            <span
              v-for="s in subjectStore.subjects"
              :key="s.id"
              :class="['subject-tag', { selected: selectedSubjects.includes(s.id) }]"
              @click="toggleSubject(s.id)"
            >{{ s.shortName }}</span>
          </div>
        </div>
        <div class="form-group">
          <label>视频文件</label>
          <div class="upload-area" @click="triggerUpload" @dragover.prevent @drop.prevent="handleDrop">
            <div v-if="!videoFile" class="upload-placeholder">
              <span class="upload-icon">&#x1F4C1;</span>
              <p>点击选择视频文件或拖拽到此处</p>
              <p class="upload-hint">支持 MP4、WebM 格式</p>
            </div>
            <div v-else class="upload-file-info">
              <span class="file-name">{{ videoFile.name }}</span>
              <span class="file-size">{{ formatSize(videoFile.size) }}</span>
            </div>
            <input ref="fileInput" type="file" accept="video/*" @change="handleFileSelect" hidden />
          </div>
        </div>

        <div class="form-actions">
          <TcmButton variant="primary" :disabled="!canSubmit" :loading="isUploading" @click="uploadVideo">
            {{ isUploading ? '上传中...' : '上传视频' }}
          </TcmButton>
        </div>
      </div>
    </TcmCard>

    <TcmCard title="知识提取说明" class="mt-4">
      <p class="text-tcm-text-s">
        视频上传后，你可以在播放时手动添加时间戳标注和笔记。
        未来的版本将支持 AI 自动提取视频中的知识点、生成闪卡和总结。
      </p>
    </TcmCard>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { videoRepo } from '@/db/repositories/videoRepo'
import { useSubjectStore } from '@/stores/useSubjectStore'
import { generateId } from '@/utils/id-generator'
import TcmCard from '@/components/ui/TcmCard.vue'
import TcmButton from '@/components/ui/TcmButton.vue'
import type { Video, VideoStatus } from '@/types'

const router = useRouter()
const subjectStore = useSubjectStore()

onMounted(async () => {
  await subjectStore.loadSubjects()
})

const title = ref('')
const description = ref('')
const selectedSubjects = ref<string[]>([])
const videoFile = ref<File | null>(null)
const isUploading = ref(false)
const fileInput = ref<HTMLInputElement | null>(null)

const canSubmit = computed(() => title.value && videoFile.value)

function toggleSubject(id: string) {
  const idx = selectedSubjects.value.indexOf(id)
  if (idx >= 0) selectedSubjects.value.splice(idx, 1)
  else selectedSubjects.value.push(id)
}

function triggerUpload() { fileInput.value?.click() }
function handleFileSelect(e: Event) {
  const input = e.target as HTMLInputElement
  if (input.files?.[0]) videoFile.value = input.files[0]
}
function handleDrop(e: DragEvent) {
  const file = e.dataTransfer?.files[0]
  if (file?.type.startsWith('video/')) videoFile.value = file
}
function formatSize(bytes: number): string {
  const mb = bytes / (1024 * 1024)
  return mb >= 1 ? `${mb.toFixed(1)} MB` : `${(bytes / 1024).toFixed(1)} KB`
}

async function uploadVideo() {
  if (!canSubmit.value || !videoFile.value) return
  isUploading.value = true

  const videoData: Video = {
    id: generateId('vid_'),
    title: title.value,
    description: description.value,
    fileUrl: URL.createObjectURL(videoFile.value),
    duration: 0,
    fileSize: videoFile.value.size,
    subjectIds: [...selectedSubjects.value],
    knowledgePointIds: [],
    extractedSummary: '',
    extractedKeyPoints: [],
    transcriptText: '',
    status: 'ready',
    uploadedAt: Date.now(),
    thumbnailUrl: '',
  }

  await videoRepo.upsert(videoData)
  isUploading.value = false
  router.push('/videos')
}
</script>

<style scoped>
.page-video-upload { /* 宽度动态填充 */ }
.back-link { color: var(--tcm-text-secondary); font-size: var(--tcm-font-sm); text-decoration: none; }
.back-link:hover { color: var(--tcm-primary-500); }
.page-title { font-family: var(--tcm-font-decorative); font-size: var(--tcm-font-2xl); color: var(--tcm-text-primary); margin: 12px 0 24px; }
.upload-form { display: flex; flex-direction: column; gap: 20px; }
.form-group { display: flex; flex-direction: column; gap: 6px; }
.form-group label { font-size: var(--tcm-font-sm); font-weight: 600; color: var(--tcm-text-primary); }
.form-input { width: 100%; padding: 10px 14px; border: 1px solid var(--tcm-border); border-radius: var(--tcm-radius-md); font-size: var(--tcm-font-base); background: var(--tcm-bg-base); color: var(--tcm-text-primary); outline: none; font-family: inherit; box-sizing: border-box; }
.form-input:focus { border-color: var(--tcm-primary-500); }
textarea.form-input { resize: vertical; }
.subject-tags { display: flex; flex-wrap: wrap; gap: 8px; }
.subject-tag { padding: 4px 12px; border: 1px solid var(--tcm-border); border-radius: 16px; font-size: var(--tcm-font-xs); cursor: pointer; transition: all 0.15s; color: var(--tcm-text-secondary); }
.subject-tag:hover { border-color: var(--tcm-primary-300); }
.subject-tag.selected { background: #FDF0ED; border-color: var(--tcm-primary-500); color: var(--tcm-primary-500); }
.upload-area { border: 2px dashed var(--tcm-border); border-radius: var(--tcm-radius-lg); padding: 40px; text-align: center; cursor: pointer; transition: border-color 0.2s; }
.upload-area:hover { border-color: var(--tcm-primary-300); }
.upload-icon { font-size: 48px; opacity: 0.5; }
.upload-placeholder p { margin-top: 8px; color: var(--tcm-text-secondary); }
.upload-hint { font-size: var(--tcm-font-xs); color: var(--tcm-text-disabled); }
.upload-file-info { display: flex; flex-direction: column; gap: 4px; }
.file-name { font-weight: 600; color: var(--tcm-text-primary); }
.file-size { font-size: var(--tcm-font-sm); color: var(--tcm-text-secondary); }
.form-actions { padding-top: 8px; }
.mt-4 { margin-top: 16px; }
.text-tcm-text-s { color: var(--tcm-text-secondary); line-height: 1.7; }
</style>
