import { getDb } from '../config/database.js'
import { parseJson } from '../utils/sqlite-json.js'

function detectFormat(url: string): string {
  const ext = url.split('.').pop()?.split('?')[0]?.toLowerCase() || ''
  const map: Record<string, string> = { flv: 'flv', mp4: 'mp4', webm: 'webm', mkv: 'mkv', avi: 'avi', mov: 'mov', wmv: 'wmv' }
  return map[ext] || 'unknown'
}

interface VideoRow {
  id: string
  user_id: string
  title: string
  description: string
  file_url: string
  duration: number
  file_size: number
  subject_ids_json: string
  knowledge_point_ids_json: string
  extracted_summary: string
  extracted_key_points_json: string
  transcript_text: string
  status: string
  uploaded_at: number
  thumbnail_url: string
  format: string
  processing_status: string
  processing_error: string
  processing_progress: number
  processing_step: string
  transcoded_variants_json: string
  extracted_difficult_points_json: string
  subject_match_json: string
  ai_transcript: string
  ai_summary: string
  ocr_text: string
  info_draft: string
  quiz_questions_json: string
}

interface VideoRowWithOwner extends VideoRow {
  owner_username?: string
  owner_display_name?: string
}

interface AnnotationRow {
  id: string
  user_id: string
  video_id: string
  timestamp: number
  content: string
  created_at: number
}

function mapVideo(row: VideoRow) {
  return {
    id: row.id,
    title: row.title,
    description: row.description,
    fileUrl: row.file_url,
    duration: row.duration,
    fileSize: row.file_size,
    subjectIds: parseJson<string[]>(row.subject_ids_json, []),
    knowledgePointIds: parseJson<string[]>(row.knowledge_point_ids_json, []),
    extractedSummary: row.extracted_summary,
    extractedKeyPoints: parseJson<{ title: string; content: string; timestamp: number }[]>(
      row.extracted_key_points_json, [],
    ),
    transcriptText: row.transcript_text,
    status: row.status,
    uploadedAt: row.uploaded_at,
    thumbnailUrl: row.thumbnail_url,
    format: row.format || detectFormat(row.file_url),
    processingStatus: row.processing_status || 'raw',
    processingError: row.processing_error || '',
    processingProgress: row.processing_progress || 0,
    processingStep: row.processing_step || '',
    transcodedVariants: parseJson<{ quality: string; url: string; size: number; label: string }[]>(
      row.transcoded_variants_json, [],
    ),
    extractedDifficultPoints: parseJson<{ title: string; content: string; timestamp: number }[]>(
      row.extracted_difficult_points_json, [],
    ),
    subjectMatchResult: parseJson<{
      videoKpIndex: number; videoKpTitle: string; subjectId: string
      chapterId: string; chapterTitle: string; confidence: number; manual: boolean
    }[]>(row.subject_match_json, []),
    aiTranscript: row.ai_transcript || '',
    aiSummary: row.ai_summary || '',
    ocrText: row.ocr_text || '',
    infoDraft: row.info_draft || '',
    quizQuestions: parseJson<any[]>(row.quiz_questions_json, []),
  }
}

function mapAnnotation(row: AnnotationRow) {
  return {
    id: row.id,
    videoId: row.video_id,
    timestamp: row.timestamp,
    content: row.content,
    createdAt: row.created_at,
  }
}

export interface VideoCreateInput {
  id: string
  title: string
  description: string
  fileUrl: string
  duration: number
  fileSize: number
  subjectIds: string[]
  format: string
}

export const videoService = {
  async findAll(userId: string, isAdmin = false) {
    const db = getDb()
    if (!isAdmin) {
      const rows = await db<VideoRow>('videos')
        .where({ user_id: userId })
        .orderBy('uploaded_at', 'desc')
      return rows.map(mapVideo)
    }
    // 管理员：查看全部用户视频，按 file_url 去重并附带所属用户信息
    const rows = await db<VideoRowWithOwner>('videos as v')
      .leftJoin('users as u', 'v.user_id', 'u.id')
      .select('v.*', 'u.username as owner_username', 'u.display_name as owner_display_name')
      .orderBy('v.uploaded_at', 'desc')
    const seen = new Set<string>()
    const deduped = rows.filter((r) => {
      if (seen.has(r.file_url)) return false
      seen.add(r.file_url)
      return true
    })
    return deduped.map((r) => ({
      ...mapVideo(r),
      userId: r.user_id,
      ownerName: r.owner_display_name || r.owner_username || r.user_id,
    }))
  },

  async findById(userId: string, id: string, isAdmin = false) {
    const db = getDb()
    let query = db<VideoRow>('videos').where({ id })
    if (!isAdmin) query = query.where({ user_id: userId })
    const row = await query.first()
    return row ? mapVideo(row) : undefined
  },

  /**
   * 扫描后同步：若 DB 视频的文件已移动（旧路径失效），按文件名重新指向当前路径。
   * 返回修复条数。文件名重复（无法唯一确定）的跳过，避免误指。
   */
  async rematchFilePaths(videoDir: string, currentFiles: { relativePath: string }[]) {
    const db = getDb()
    const fs = await import('node:fs')
    const path = await import('node:path')

    // basename -> 当前相对路径（重复的文件名剔除，避免歧义）
    const index = new Map<string, string>()
    const dup = new Set<string>()
    for (const f of currentFiles) {
      const base = f.relativePath.split('/').pop()
      if (!base) continue
      if (index.has(base)) { dup.add(base); index.delete(base) }
      else if (!dup.has(base)) index.set(base, f.relativePath)
    }

    const rows = await db<VideoRow>('videos').select('id', 'file_url')
    let fixed = 0
    for (const r of rows) {
      const fu = r.file_url
      if (!fu || !fu.startsWith('/api/video/file/')) continue
      let rel: string
      try { rel = decodeURIComponent(fu.replace('/api/video/file/', '')) } catch { continue }
      if (rel.startsWith('transcoded/')) continue
      // 路径仍有效则跳过
      if (fs.existsSync(path.join(videoDir, rel))) continue
      const base = rel.split('/').pop()
      if (!base) continue
      const newRel = index.get(base)
      if (newRel && newRel !== rel) {
        await db('videos').where({ id: r.id }).update({ file_url: `/api/video/file/${encodeURIComponent(newRel)}` })
        fixed++
      }
    }
    return fixed
  },

  async create(userId: string, input: VideoCreateInput) {
    const db = getDb()
    const now = Date.now()
    await db('videos').insert({
      id: input.id,
      user_id: userId,
      title: input.title,
      description: input.description || '',
      file_url: input.fileUrl,
      duration: input.duration || 0,
      file_size: input.fileSize || 0,
      subject_ids_json: JSON.stringify(input.subjectIds || []),
      knowledge_point_ids_json: '[]',
      extracted_summary: '',
      extracted_key_points_json: '[]',
      transcript_text: '',
      status: 'ready',
      uploaded_at: now,
      thumbnail_url: '',
      format: input.format || detectFormat(input.fileUrl),
      processing_status: 'raw',
      processing_error: '',
      processing_progress: 0,
      processing_step: '',
      transcoded_variants_json: '[]',
      extracted_difficult_points_json: '[]',
      subject_match_json: '[]',
      ai_transcript: '',
      ai_summary: '',
    })
    return input
  },

  async upsert(userId: string, video: {
    id: string
    title: string
    description: string
    fileUrl: string
    duration: number
    fileSize: number
    subjectIds: string[]
    knowledgePointIds: string[]
    extractedSummary: string
    extractedKeyPoints: { title: string; content: string; timestamp: number }[]
    transcriptText: string
    status: string
    uploadedAt: number
    thumbnailUrl: string
    format?: string
  }) {
    const db = getDb()
    const row = {
      id: video.id,
      user_id: userId,
      title: video.title,
      description: video.description,
      file_url: video.fileUrl,
      duration: video.duration,
      file_size: video.fileSize,
      subject_ids_json: JSON.stringify(video.subjectIds),
      knowledge_point_ids_json: JSON.stringify(video.knowledgePointIds),
      extracted_summary: video.extractedSummary,
      extracted_key_points_json: JSON.stringify(video.extractedKeyPoints),
      transcript_text: video.transcriptText,
      status: video.status,
      uploaded_at: video.uploadedAt,
      thumbnail_url: video.thumbnailUrl,
      format: (video as any).format || detectFormat(video.fileUrl),
    }
    await db('videos')
      .insert(row)
      .onConflict(['id'])
      .merge()
    return video
  },

  async update(userId: string, id: string, data: Record<string, any>) {
    const db = getDb()
    const fieldMap: Record<string, string> = {
      fileUrl: 'file_url', fileSize: 'file_size',
      subjectIds: 'subject_ids_json', knowledgePointIds: 'knowledge_point_ids_json',
      extractedSummary: 'extracted_summary', extractedKeyPoints: 'extracted_key_points_json',
      extractedDifficultPoints: 'extracted_difficult_points_json',
      aiTranscript: 'ai_transcript', aiSummary: 'ai_summary',
      ocrText: 'ocr_text', infoDraft: 'info_draft',
      quizQuestions: 'quiz_questions_json',
      transcriptText: 'transcript_text', uploadedAt: 'uploaded_at',
      thumbnailUrl: 'thumbnail_url', processingStatus: 'processing_status',
      processingError: 'processing_error', processingProgress: 'processing_progress',
      processingStep: 'processing_step', subjectMatchResult: 'subject_match_json',
    }
    const dbData: Record<string, any> = {}
    for (const [key, value] of Object.entries(data)) {
      const dbKey = fieldMap[key] || key
      if (dbKey.endsWith('_json') && typeof value !== 'string') {
        dbData[dbKey] = JSON.stringify(value)
      } else {
        dbData[dbKey] = value
      }
    }
    await db('videos').where({ id, user_id: userId }).update(dbData)
  },

  async delete(userId: string, id: string) {
    const db = getDb()
    await db('video_annotations').where({ video_id: id, user_id: userId }).del()
    const deleted = await db('videos').where({ id, user_id: userId }).del()
    // 只有真正删除了记录，才清理关联的转码文件（避免误删他人视频的 AI 产物）
    if (deleted > 0) {
      try {
        const path = await import('node:path')
        const { fileURLToPath } = await import('node:url')
        const fs = await import('node:fs')
        const transcodeDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..', 'data', 'transcoded')
        for (const suffix of ['_audio.wav', '_audio.wav.whisper.json', '_original.mp4', '_720p.mp4', '_480p.mp4']) {
          try { fs.unlinkSync(path.join(transcodeDir, id + suffix)) } catch {}
        }
      } catch { /* 清理失败不影响删除 */ }
    }
    return deleted
  },

  async getAnnotations(userId: string, videoId: string) {
    const db = getDb()
    const rows = await db<AnnotationRow>('video_annotations')
      .where({ user_id: userId, video_id: videoId })
      .orderBy('timestamp', 'asc')
    return rows.map(mapAnnotation)
  },

  async addAnnotation(userId: string, annotation: {
    id: string; videoId: string; timestamp: number; content: string; createdAt: number
  }) {
    const db = getDb()
    await db('video_annotations').insert({
      id: annotation.id, user_id: userId, video_id: annotation.videoId,
      timestamp: annotation.timestamp, content: annotation.content,
      created_at: annotation.createdAt,
    })
    return annotation
  },

  async deleteAnnotation(userId: string, videoId: string, annotationId: string) {
    const db = getDb()
    await db('video_annotations')
      .where({ id: annotationId, video_id: videoId, user_id: userId }).del()
  },
}
