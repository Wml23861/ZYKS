/** 视频相关类型定义 */

export type VideoStatus = 'uploading' | 'processing' | 'ready' | 'error'

/** 更细粒度的处理状态 */
export type ProcessingStatus =
  | 'raw'
  | 'transcoding'
  | 'transcribing'
  | 'extracting'
  | 'summarizing'
  | 'matching'
  | 'generating_quiz'
  | 'ready'
  | 'error'

export type VideoFormat = 'mp4' | 'webm' | 'flv' | 'mkv' | 'avi' | 'mov' | 'wmv' | 'unknown'

/** 视频清晰度变体 */
export interface VideoVariant {
  quality: 'original' | '720p' | '480p'
  url: string
  size: number
  label: string
}

export interface Video {
  id: string
  title: string
  description: string
  /** 原始视频文件 URL */
  fileUrl: string
  /** 时长 (秒) */
  duration: number
  /** 文件大小 (bytes) */
  fileSize: number
  /** 关联科目 ID */
  subjectIds: string[]
  /** 关联知识点 ID */
  knowledgePointIds: string[]
  /** AI 提取的总结 (Markdown) */
  extractedSummary: string
  /** AI 提取的知识点列表 (带时间戳) */
  extractedKeyPoints: VideoKeyPoint[]
  /** AI 提取的重难点列表 (带时间戳) */
  extractedDifficultPoints: VideoKeyPoint[]
  /** 原始转录文本 */
  transcriptText: string
  /** AI 整理后的全文稿 */
  aiTranscript: string
  /** AI 生成的综合总结分析 */
  aiSummary: string
  /** OCR 画面文字 */
  ocrText: string
  /** AI 整理的信息稿 */
  infoDraft: string
  /** 关联试题 */
  quizQuestions: QuizQuestionItem[]
  /** 处理状态 (兼容旧字段) */
  status: VideoStatus
  /** 处理 pipeline 状态 */
  processingStatus: ProcessingStatus
  /** 处理错误信息 */
  processingError: string
  /** 处理进度 0-100 */
  processingProgress: number
  /** 当前处理步骤描述 */
  processingStep: string
  /** 上传时间 */
  uploadedAt: number
  /** 缩略图 URL */
  thumbnailUrl: string
  /** 视频格式 */
  format: VideoFormat
  /** 转码后的多码率变体 */
  transcodedVariants: VideoVariant[]
  /** AI 科目匹配结果 */
  subjectMatchResult: SubjectMatchItem[]
}

/** 本地视频文件信息（来自 video/ 目录） */
export interface LocalVideoFile {
  filename: string
  title: string
  format: VideoFormat
  size: number
  url: string
  relativePath: string
}

export interface VideoKeyPoint {
  /** 知识点标题 */
  title: string
  /** 知识点内容 */
  content: string
  /** 视频中的时间戳 (秒) */
  timestamp: number
  /** 类型标注: 重点/难点/考点（仅重难点使用） */
  type?: '重点' | '难点' | '考点'
}

/** AI 科目匹配结果 */
export interface SubjectMatchItem {
  /** 视频知识点索引 */
  videoKpIndex: number
  /** 视频知识点标题 */
  videoKpTitle: string
  /** 匹配到的科目 ID */
  subjectId: string
  /** 匹配到的章节 ID（可能为空） */
  chapterId: string
  /** 匹配到的章节标题 */
  chapterTitle: string
  /** 匹配置信度 0-1 */
  confidence: number
  /** 是否手动关联 */
  manual: boolean
}

/** 视频笔记 */
export interface VideoAnnotation {
  id: string
  videoId: string
  /** 视频时间戳 (秒) */
  timestamp: number
  /** 标注内容 */
  content: string
  createdAt: number
}

/** AI 提取请求参数 */
export interface VideoExtractRequest {
  videoId: string
  /** 是否强制重新处理 */
  force?: boolean
}

/** 关联试题 */
export interface QuizQuestionItem {
  questionId: string
  source: 'matched' | 'generated'
  stem: string
  options: { key: string; text: string }[]
  correctAnswer: string
  explanation: string
  difficulty: number
  subjectId: string
  chapterId: string
}

/** 视频处理进度 */
export interface ProcessingProgress {
  videoId: string
  step: string
  stepLabel: string
  percent: number
  detail: string
  startedAt: number
  elapsed: number
}
