/**
 * 视频处理 Pipeline 编排器
 *
 * 流程: 转码 → 语音转文字 → AI提取知识点/重难点 → AI生成总结 → 科目匹配
 * 支持断点恢复 + 进度追踪
 */
import { EventEmitter } from 'node:events'
import path from 'node:path'
import fs from 'node:fs'
import { fileURLToPath } from 'node:url'
import { getDb } from '../config/database.js'
import { config } from '../config/env.js'
import {
  checkFfmpeg,
  extractAudio,
  getVideoInfo,
} from './transcode.service.js'
import {
  speechToText,
  extractKeyAndDifficultPoints,
  chunkedExtractKeyPoints,
  generateTranscriptAndSummary,
  matchKnowledgeToSubjects,
  generateQuizQuestions,
  cancelWhisperProcess,
  cancelAllWhisperProcesses,
  type ExtractedKnowledge,
  type SummaryResult,
  type SubjectMatchResult,
} from './video-ai.service.js'

// ═══════════════════════════════════════════
// 类型定义
// ═══════════════════════════════════════════

export type PipelineStep =
  | 'transcoding'
  | 'transcribing'
  | 'extracting'
  | 'summarizing'
  | 'matching'
  | 'generating_quiz'
  | 'ready'
  | 'error'

export interface PipelineProgress {
  videoId: string
  step: PipelineStep
  stepLabel: string
  percent: number
  detail: string
  startedAt: number   // 处理开始时间戳
  elapsed: number     // 已耗时（秒）
}

// ═══════════════════════════════════════════
// Pipeline 事件总线
// ═══════════════════════════════════════════

export const pipelineEvents = new EventEmitter()
pipelineEvents.setMaxListeners(50)

// 正在处理的视频集合 — 同视频不重复，不同视频最多 3 个并发
const processingSet = new Set<string>()
const MAX_CONCURRENT = 3

// STT（whisper）步骤并发限制 — 模型加载占 ~500MB/进程，限制 2 个避免内存爆炸
let sttRunning = 0
const MAX_STT_CONCURRENT = 2
async function waitForSttSlot(videoId: string, myGen: number): Promise<void> {
  while (sttRunning >= MAX_STT_CONCURRENT) {
    await new Promise(r => setTimeout(r, 3000))
    if (!isCurrentGen(videoId, myGen)) throw new Error('STT_WAIT_CANCELLED')
  }
  sttRunning++
}
function releaseSttSlot(): void {
  sttRunning = Math.max(0, sttRunning - 1)
}

// 代数计数器：每次 force 重处理时 +1，旧流程检测到过期后静默退出
const generationMap = new Map<string, number>()

// 处理开始时间 Map<videoId, timestamp>
const startTimeMap = new Map<string, number>()

// ═══════════════════════════════════════════
// 核心流程
// ═══════════════════════════════════════════

function emitProgress(progress: Omit<PipelineProgress, 'startedAt' | 'elapsed'> & Partial<Pick<PipelineProgress, 'startedAt' | 'elapsed'>>) {
  progress.startedAt = startTimeMap.get(progress.videoId) || 0
  progress.elapsed = progress.startedAt ? Math.floor((Date.now() - progress.startedAt) / 1000) : 0
  pipelineEvents.emit('progress', progress)
  pipelineEvents.emit(`progress:${progress.videoId}`, progress)
}

function updateDbProgress(
  videoId: string,
  step: PipelineStep,
  stepLabel: string,
  percent: number,
  detail: string = '',
) {
  // 立即写内存（前端 API 优先读这里，保证实时同步）
  memoryProgress.set(videoId, { videoId, step, stepLabel, percent, detail, startedAt: 0, elapsed: 0 })
  console.log(`[DB-PROGRESS] ${videoId} ${step}=${percent}% "${stepLabel}"`)
  getDb()('videos')
    .where({ id: videoId })
    .update({
      processing_status: step,
      processing_step: stepLabel,
      processing_progress: percent,
    })
    .then(() => console.log(`[DB-PROGRESS] ${videoId} DB 写入成功`))
    .catch((e: any) => console.error(`[DB-PROGRESS] ${videoId} DB 写入失败:`, e?.message || e))

  emitProgress({ videoId, step, stepLabel, percent, detail })
}

function isCurrentGen(videoId: string, gen: number): boolean {
  return generationMap.get(videoId) === gen
}

/** 检查视频是否正在处理中 */
export function isVideoProcessing(videoId: string): boolean {
  return processingSet.has(videoId)
}

/** 内存中的最新进度，API 优先读这里（避免 DB 写入延迟导致前端慢） */
const memoryProgress = new Map<string, PipelineProgress>()

function memoryProgressGet(videoId: string): PipelineProgress | null {
  return memoryProgress.get(videoId) || null
}

async function setError(videoId: string, error: string, myGen?: number) {
  // 如果有代数号且已过期，不写 error（新流程正在跑）
  if (myGen !== undefined && !isCurrentGen(videoId, myGen)) {
    console.log(`[Pipeline] ${videoId} 旧流程错误已忽略: ${error}`)
    return
  }
  console.error(`[Pipeline] ${videoId} 处理失败: ${error}`)
  await getDb()('videos')
    .where({ id: videoId })
    .update({
      processing_status: 'error',
      processing_error: error,
    })
  processingSet.delete(videoId)
  emitProgress({ videoId, step: 'error', stepLabel: '处理失败', percent: 0, detail: error })
}

export async function processVideo(videoId: string, force: boolean = false): Promise<void> {
  const db = getDb()

  // 如果 force=true，先取消旧进程和重置状态
  if (force) {
    processingSet.delete(videoId)
    // 递增代数，旧流程检测到不匹配后静默退出
    const gen = (generationMap.get(videoId) || 0) + 1
    generationMap.set(videoId, gen)
    // 取消可能残留的 whisper 进程
    const transcodeDir = path.resolve(config.DB_PATH, '..', 'transcoded')
    cancelWhisperProcess(path.join(transcodeDir, `${videoId}_audio.wav.whisper`))
    // 短暂等待旧进程清理
    await new Promise(r => setTimeout(r, 300))
    await db('videos').where({ id: videoId }).update({
      processing_status: 'raw',
      processing_error: '',
      processing_step: '',
      processing_progress: 0,
    })
  }

  // 记录本流程的代数
  const myGen = generationMap.get(videoId) || 0

  // 防重：同名视频已在处理且非强制，跳过
  if (processingSet.has(videoId) && !force) {
    console.log(`[Pipeline] ${videoId} 正在处理中，跳过（如需强制重处理请使用 force=true）`)
    return
  }

  // 并发限制：最多 MAX_CONCURRENT 个视频同时处理（同名 force 不计）
  if (!processingSet.has(videoId) && processingSet.size >= MAX_CONCURRENT) {
    console.log(`[Pipeline] 当前 ${processingSet.size}/${MAX_CONCURRENT} 个视频处理中，${videoId} 排队等待...`)
    // 轮询等待
    while (processingSet.size >= MAX_CONCURRENT) {
      await new Promise(r => setTimeout(r, 2000))
      if (!isCurrentGen(videoId, myGen)) {
        console.log(`[Pipeline] ${videoId} 排队中被取消`)
        return
      }
    }
  }

  const video = await db('videos').where({ id: videoId }).first()

  if (!video) {
    throw new Error(`视频不存在: ${videoId}`)
  }

  // 如果不是强制重处理，且已经处理完成，跳过
  if (!force && video.processing_status === 'ready') {
    console.log(`[Pipeline] ${videoId} 已处理完成，跳过`)
    return
  }

  processingSet.add(videoId)
  startTimeMap.set(videoId, Date.now())

  // 清理旧错误
  await db('videos').where({ id: videoId }).update({ processing_error: '' })

  try {
    // 检查 ffmpeg
    const ffmpegAvailable = await checkFfmpeg()
    if (!ffmpegAvailable) {
      throw new Error('ffmpeg 未安装。请安装 ffmpeg: https://ffmpeg.org/download.html')
    }

    // 确定视频文件路径
    const inputPath = resolveVideoPath(video.file_url)

    if (!fs.existsSync(inputPath)) {
      throw new Error(`视频文件不存在: ${inputPath}`)
    }

    // ── Step 1: 获取视频信息 ──
    updateDbProgress(videoId, 'transcribing', '读取视频信息', 5, '读取视频元数据...')
    const videoInfo = await getVideoInfo(inputPath)

    // 更新视频时长
    if (videoInfo.duration > 0) {
      await db('videos').where({ id: videoId }).update({ duration: Math.floor(videoInfo.duration) })
    }

    // 获取或创建临时目录
    const transcodeDir = path.resolve(config.DB_PATH, '..', 'transcoded')
    fs.mkdirSync(transcodeDir, { recursive: true })

    // 注：视频播放转码由 app.ts 实时流式处理（ultrafast + 缓存），pipeline 跳过转码步骤

    // ── Step 2: 提取音频 ──
    updateDbProgress(videoId, 'transcribing', '提取音频', 10, '正在从视频提取音频（用于语音识别）...')

    const audioPath = path.join(transcodeDir, `${videoId}_audio.wav`)

    if (!force && fs.existsSync(audioPath) && fs.statSync(audioPath).size > 0) {
      console.log(`[Pipeline] ${videoId} 音频已存在，跳过提取`)
    } else {
      await extractAudio(inputPath, audioPath, {
        onProgress: (p) => {
          // p.time 格式: "0:00:15" 或 "HH:MM:SS"，计算提取进度百分比
          const timeParts = (p.time || '').split(':').map(Number)
          const elapsedSec = timeParts.length === 3 ? timeParts[0] * 3600 + timeParts[1] * 60 + (timeParts[2] || 0) : 0
          const durSec = videoInfo.duration || 1
          const pct = Math.min(99, Math.floor(elapsedSec / durSec * 100))
          const overall = 10 + Math.floor(pct * 0.05) // 10% → 15%
          updateDbProgress(videoId, 'transcribing', '提取音频中', overall, p.time || '')
        },
        onLog: () => {},
      })
    }

    // ── Step 3: 语音转文字 ──
    let sttResult
    const existingTranscript = video.transcript_text || ''

    if (!force && existingTranscript && existingTranscript.length > 100) {
      console.log(`[Pipeline] ${videoId} 已有转录文本，跳过 STT`)
      sttResult = {
        rawTranscript: existingTranscript,
        correctedTranscript: existingTranscript,
        segments: [],
      }
    } else {
      // STT 步骤限制并发（whisper 加载模型占 ~500MB 内存）
      try {
        updateDbProgress(videoId, 'transcribing', '等待语音识别资源...', 15,
          '正在排队等待语音识别资源（最多 2 个并发）...')
        await waitForSttSlot(videoId, myGen)
      } catch { return }

      try {
        updateDbProgress(videoId, 'transcribing', '语音转文字中', 15,
          '正在使用语音识别转写视频内容（可能需要数分钟）...')

        sttResult = await speechToText(audioPath, (msg: string, pct: number) => {
          // STT 步骤: 10% → 65%，whisper 原始 0-100% 线性映射
          const overallPct = 10 + Math.floor(pct * 0.55)
          console.log(`[Pipeline-PROGRESS] whisper=${pct}% → pipeline=${overallPct}%, step=transcribing`)
          updateDbProgress(videoId, 'transcribing', msg, overallPct)
        })
      } finally {
        releaseSttSlot()
      }

      // 检查是否有新流程启动（旧流程被取消后静默退出）
      if (!isCurrentGen(videoId, myGen)) {
        console.log(`[Pipeline] ${videoId} 流程已被新请求取代，退出`)
        return
      }

      // 空结果检查（进程被取消或音频无内容）
      if (!sttResult.segments || sttResult.segments.length === 0) {
        if (!isCurrentGen(videoId, myGen)) return // 二次确认非取消
        throw new Error('未识别到任何语音内容，请检查音频质量')
      }

      // 保存转录文本
      await db('videos').where({ id: videoId }).update({
        transcript_text: sttResult.rawTranscript,
      })
    }

    // ── Step 4: DeepSeek 第1次 ── 提取知识点 + 重难点
    updateDbProgress(videoId, 'extracting', 'AI 提取知识点和重难点', 72,
      'DeepSeek 正在分析视频内容，提取知识点和重难点...')

    let extraction: ExtractedKnowledge
    const existingKeyPoints = safeParseJson<ExtractedKnowledge['keyPoints']>(video.extracted_key_points_json || '[]', [])

    if (!force && existingKeyPoints.length > 0) {
      console.log(`[Pipeline] ${videoId} 已有提取结果，跳过 AI 提取`)
      extraction = {
        keyPoints: existingKeyPoints,
        difficultPoints: safeParseJson<ExtractedKnowledge['difficultPoints']>(video.extracted_difficult_points_json || '[]', []),
      }
    } else {
      // 长文稿自动分块分析（短文稿直接走原函数）
      extraction = await chunkedExtractKeyPoints(
        sttResult.correctedTranscript,
        sttResult.segments,
        (msg: string, pct: number) => {
          updateDbProgress(videoId, 'extracting', msg, 72 + Math.floor(pct * 0.12))
        },
      )

      if (!isCurrentGen(videoId, myGen)) { console.log(`[Pipeline] ${videoId} 已过期，退出`); return }

      // 保存提取结果
      await db('videos').where({ id: videoId }).update({
        extracted_key_points_json: JSON.stringify(extraction.keyPoints),
        extracted_difficult_points_json: JSON.stringify(extraction.difficultPoints),
      })
    }

    // ── Step 5: DeepSeek 第2次 ── 生成总结 + 整理文稿
    updateDbProgress(videoId, 'summarizing', 'AI 生成总结和文稿', 84,
      'DeepSeek 正在整理全文稿并生成学习总结...')

    let summary: SummaryResult
    const existingSummary = video.extracted_summary || ''

    if (!force && existingSummary && existingSummary.length > 50) {
      console.log(`[Pipeline] ${videoId} 已有总结，跳过`)
      summary = {
        transcript: video.ai_transcript || sttResult.correctedTranscript,
        summary: existingSummary,
      }
    } else {
      summary = await generateTranscriptAndSummary(
        sttResult.correctedTranscript,
        extraction.keyPoints,
        extraction.difficultPoints,
      )

      // 保存总结
      await db('videos').where({ id: videoId }).update({
        extracted_summary: summary.summary,
        ai_transcript: summary.transcript,
        ai_summary: summary.summary,
      })
    }

    // ── Step 6: 科目匹配 ──
    updateDbProgress(videoId, 'matching', '匹配科目章节', 85,
      '正在将知识点关联到对应科目章节...')

    const existingMatch = safeParseJson<SubjectMatchResult[]>(video.subject_match_json || '[]', [])
    let matchResults: SubjectMatchResult[]

    if (!force && existingMatch.length > 0) {
      console.log(`[Pipeline] ${videoId} 已有匹配结果，跳过`)
      matchResults = existingMatch
    } else {
      // 获取所有科目和章节
      const subjects = await db('subjects').select('id', 'name')
      const chapters = await db('chapters').select('id', 'title', 'subject_id')

      const subjectChapters = subjects.map((s: any) => ({
        id: s.id,
        name: s.name,
        chapters: chapters
          .filter((c: any) => c.subject_id === s.id)
          .map((c: any) => ({ id: c.id, title: c.title })),
      }))

      matchResults = await matchKnowledgeToSubjects(extraction.keyPoints, subjectChapters)

      // 补全章节标题
      for (const match of matchResults) {
        if (match.chapterId) {
          const ch = chapters.find((c: any) => c.id === match.chapterId)
          if (ch) match.chapterTitle = ch.title
        }
      }

      // 保存匹配结果
      await db('videos').where({ id: videoId }).update({
        subject_match_json: JSON.stringify(matchResults),
      })
    }

    // ── Step 7: 匹配和生成相关试题（基于全文稿 + 知识点）──
    updateDbProgress(videoId, 'generating_quiz', '匹配和生成试题', 85,
      '正在从题库匹配并生成相关练习试题...')

    try {
      const quizQuestions = await generateQuizQuestions(
        extraction.keyPoints, extraction.difficultPoints,
        summary.summary, sttResult.correctedTranscript,
        video.subjectIds || [],
      )
      await db('videos').where({ id: videoId }).update({
        quiz_questions_json: JSON.stringify(quizQuestions),
      })
      console.log(`[Pipeline] ${videoId} 试题生成完成: ${quizQuestions.length} 道`)
    } catch (e) {
      console.warn(`[Pipeline] ${videoId} 试题生成失败:`, (e as Error).message)
    }

    // ── 完成 ──
    await db('videos').where({ id: videoId }).update({
      processing_status: 'ready',
      processing_step: '处理完成',
      processing_progress: 100,
      status: 'ready',
    })

    updateDbProgress(videoId, 'ready', '处理完成', 100,
      `提取 ${extraction.keyPoints.length} 个知识点, ${extraction.difficultPoints.length} 个重难点`)

    console.log(`[Pipeline] ${videoId} 处理完成!`)
  } catch (err) {
    const msg = (err as Error).message
    await setError(videoId, msg, myGen)
  } finally {
    processingSet.delete(videoId)
    startTimeMap.delete(videoId)
    memoryProgress.delete(videoId)
  }
}

// ═══════════════════════════════════════════
// 断点恢复
// ═══════════════════════════════════════════

/** 启动时检查未处理完的视频，自动恢复 */
export async function resumeProcessing(): Promise<string[]> {
  const db = getDb()
  // 只恢复 extracting/summarizing/matching 这些"断点可恢复"的状态
  // transcribing 不自动恢复——whisper 进程已丢失，需用户手动触发
  const incomplete = await db('videos')
    .whereIn('processing_status', ['extracting', 'summarizing', 'matching'])
    .select('id', 'processing_status', 'title')

  // 把卡在 transcribing 的视频重置为 raw，让用户手动触发
  await db('videos')
    .where('processing_status', 'transcribing')
    .update({ processing_status: 'raw', processing_step: '', processing_progress: 0, processing_error: '' })

  const resumed: string[] = []
  for (const v of incomplete) {
    if (processingSet.size >= MAX_CONCURRENT) {
      console.log(`[Pipeline] 并发已满 (${MAX_CONCURRENT})，剩余视频稍后手动处理`)
      break
    }
    console.log(`[Pipeline] 恢复处理: ${v.title} (${v.processing_status})`)
    processVideo(v.id as string).catch((err) => {
      console.error(`[Pipeline] 恢复处理失败: ${v.id}`, err)
    })
    resumed.push(v.id as string)
  }

  return resumed
}

/** 取消处理 */
export async function cancelProcessing(videoId: string): Promise<void> {
  processingSet.delete(videoId)

  // 杀掉可能正在运行的 whisper 进程
  const transcodeDir = path.resolve(config.DB_PATH, '..', 'transcoded')
  cancelWhisperProcess(path.join(transcodeDir, `${videoId}_audio.wav.whisper`))

  await getDb()('videos')
    .where({ id: videoId })
    .update({
      processing_status: 'raw',
      processing_step: '',
      processing_progress: 0,
      processing_error: '',
    })
}

/** 获取处理进度（优先读内存，保证实时同步） */
export async function getProcessingProgress(videoId: string): Promise<PipelineProgress | null> {
  // 优先从内存读取（updateDbProgress 实时写入）
  const mem = memoryProgress.get(videoId)
  if (mem) {
    // 更新 elapsed
    const startedAt = startTimeMap.get(videoId) || mem.startedAt || 0
    return { ...mem, startedAt, elapsed: startedAt ? Math.floor((Date.now() - startedAt) / 1000) : 0 }
  }

  // 内存没有则回退 DB
  const db = getDb()
  const video = await db('videos')
    .where({ id: videoId })
    .select('processing_status', 'processing_step', 'processing_progress', 'processing_error')
    .first()

  if (!video) return null

  const startedAt = startTimeMap.get(videoId) || 0
  return {
    videoId,
    step: video.processing_status as PipelineStep,
    stepLabel: video.processing_step || '',
    percent: video.processing_progress || 0,
    detail: video.processing_status === 'error' ? (video.processing_error || '') : '',
    startedAt,
    elapsed: startedAt ? Math.floor((Date.now() - startedAt) / 1000) : 0,
  }
}

// ═══════════════════════════════════════════
// 工具函数
// ═══════════════════════════════════════════

const _videoDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', config.VIDEO_PATH)
const _transcodedDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..', 'data', 'transcoded')

function resolveVideoPath(fileUrl: string): string {
  // 处理相对路径 /api/video/file/xxx
  if (fileUrl.startsWith('/api/video/file/')) {
    const filename = decodeURIComponent(fileUrl.replace('/api/video/file/', ''))
    if (filename.startsWith('transcoded/') || filename.startsWith('transcoded\\')) {
      return path.join(_transcodedDir, filename.replace(/^transcoded[/\\]/, ''))
    }
    return path.join(_videoDir, filename)
  }

  // 绝对路径
  if (path.isAbsolute(fileUrl)) {
    return fileUrl
  }

  // 相对路径
  return path.resolve(fileUrl)
}

function safeParseJson<T>(json: string, fallback: T): T {
  try { return JSON.parse(json) } catch { return fallback }
}

