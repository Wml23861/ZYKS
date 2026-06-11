import { apiGet, apiPost, apiPut, apiDelete } from '@/utils/api-client'
import type { Video, VideoAnnotation, LocalVideoFile, ProcessingProgress } from '@/types'

export const videoRepo = {
  async findAll(): Promise<Video[]> {
    return apiGet<Video[]>('/api/videos')
  },

  async findById(id: string): Promise<Video | undefined> {
    try { return await apiGet<Video>(`/api/videos/${id}`) } catch { return undefined }
  },

  async upsert(video: Video): Promise<void> {
    await apiPost('/api/videos', video)
  },

  async update(id: string, data: Partial<Video>): Promise<void> {
    await apiPut(`/api/videos/${id}`, data)
  },

  async delete(id: string): Promise<void> {
    await apiDelete(`/api/videos/${id}`)
  },

  /** 扫描 video/ 目录下的本地视频文件 */
  async scanLocalVideos(): Promise<LocalVideoFile[]> {
    try { return await apiGet<LocalVideoFile[]>('/api/videos/scan') } catch { return [] }
  },

  /** 兼容旧的 listLocalVideos API */
  async listLocalVideos(): Promise<LocalVideoFile[]> {
    try { return await apiGet<LocalVideoFile[]>('/api/video/local') } catch { return [] }
  },

  /** 上传视频文件（FormData） */
  async uploadFile(formData: FormData): Promise<Video> {
    const token = (() => { try { return localStorage.getItem('tcm_auth_token') } catch { return null } })()

    const res = await fetch('/api/videos/upload', {
      method: 'POST',
      headers: token ? { 'Authorization': `Bearer ${token}` } : {},
      body: formData,
    })

    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: '上传失败' }))
      throw new Error(err.error || `上传失败 (${res.status})`)
    }

    const body = await res.json()
    return body.data
  },

  /** 触发 AI 处理 */
  async startProcessing(videoId: string, force: boolean = false): Promise<void> {
    await apiPost(`/api/videos/${videoId}/process`, { force })
  },

  /** 取消处理 */
  async cancelProcessing(videoId: string): Promise<void> {
    await apiPost(`/api/videos/${videoId}/cancel`, {})
  },

  /** 重新处理 */
  async retryProcessing(videoId: string): Promise<void> {
    await apiPost(`/api/videos/${videoId}/retry`, {})
  },

  /** 查询处理进度 */
  async getProcessingProgress(videoId: string): Promise<ProcessingProgress | null> {
    try { return await apiGet<ProcessingProgress>(`/api/videos/${videoId}/progress`) } catch { return null }
  },

  /** 快速转码为 MP4（用于播放） */
  async transcodeForPlayback(videoId: string): Promise<{ status: string; url: string }> {
    return apiPost(`/api/videos/${videoId}/transcode`, {})
  },

  /** 更新科目匹配结果 */
  async updateMatchResults(videoId: string, matchResults: any[]): Promise<void> {
    await apiPut(`/api/videos/${videoId}/match`, { matchResults })
  },

  // ═══ 视频笔记 ═══

  async getAnnotations(videoId: string): Promise<VideoAnnotation[]> {
    return apiGet<VideoAnnotation[]>(`/api/videos/${videoId}/annotations`)
  },

  async addAnnotation(annotation: VideoAnnotation): Promise<void> {
    await apiPost(`/api/videos/${annotation.videoId}/annotations`, annotation)
  },

  async deleteAnnotation(videoId: string, annotationId: string): Promise<void> {
    await apiDelete(`/api/videos/${videoId}/annotations/${annotationId}`)
  },
}
