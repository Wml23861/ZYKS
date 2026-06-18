/**
 * 视频转码服务
 * 使用 ffmpeg 将上传视频转为 H.264 MP4 多码率版本
 */
import { spawn } from 'node:child_process'
import path from 'node:path'
import fs from 'node:fs'

/** 将 npm-bundled 二进制复制到可 spawn 的临时目录（修复 Windows EBUSY） */
function stageBinary(srcPath: string, destDir: string, exeName: string): string {
  fs.mkdirSync(destDir, { recursive: true })
  const destPath = path.join(destDir, exeName)
  // 如果目标已存在且大小一致，跳过复制
  if (fs.existsSync(destPath) && fs.statSync(destPath).size === fs.statSync(srcPath).size) {
    return destPath
  }
  fs.copyFileSync(srcPath, destPath)
  return destPath
}

/** 自动检测 ffmpeg 路径：优先使用内置 @ffmpeg-installer，其次 PATH */
async function resolveFfmpeg(): Promise<{ ffmpeg: string; ffprobe: string }> {
  try {
    const ffmpegInstaller = await import('@ffmpeg-installer/ffmpeg')
    const bundledFfmpeg = (ffmpegInstaller as any).default?.path || (ffmpegInstaller as any).path || ffmpegInstaller
    if (typeof bundledFfmpeg === 'string' && fs.existsSync(bundledFfmpeg)) {
      // Windows 下 node_modules 中的 exe 可能被锁定（EBUSY），复制到 staging 目录
      let ffmpegPath = bundledFfmpeg
      let ffprobePath = 'ffprobe'
      if (process.platform === 'win32') {
        const { config } = await import('../config/env.js')
        const stagingDir = path.resolve(config.DB_PATH, '..', 'ffmpeg-staging')
        const ffmpegExe = 'ffmpeg.exe'
        const ffprobeExe = 'ffprobe.exe'
        ffmpegPath = stageBinary(bundledFfmpeg, stagingDir, ffmpegExe)
        // 同目录下的 ffprobe
        const bundledFfprobe = path.join(path.dirname(bundledFfmpeg), ffprobeExe)
        if (fs.existsSync(bundledFfprobe)) {
          ffprobePath = stageBinary(bundledFfprobe, stagingDir, ffprobeExe)
        }
      } else {
        ffmpegPath = bundledFfmpeg
      }
      // 非 Windows 或 staging 完成后，尝试加载 ffprobe
      if (ffprobePath === 'ffprobe') {
        try {
          const ffprobeInstaller = await import('@ffprobe-installer/ffprobe')
          const p = (ffprobeInstaller as any).default?.path || (ffprobeInstaller as any).path || ffprobeInstaller
          if (typeof p === 'string') ffprobePath = p
        } catch {
          const ffmpegDir = path.dirname(bundledFfmpeg)
          const probePath = path.join(ffmpegDir, process.platform === 'win32' ? 'ffprobe.exe' : 'ffprobe')
          if (fs.existsSync(probePath)) ffprobePath = probePath
        }
      }
      return { ffmpeg: ffmpegPath, ffprobe: ffprobePath }
    }
  } catch {
    // 未安装，回退到 PATH
  }
  return { ffmpeg: 'ffmpeg', ffprobe: 'ffprobe' }
}

let resolvedFfmpeg: { ffmpeg: string; ffprobe: string } | null = null

async function getFfmpegPaths() {
  if (!resolvedFfmpeg) {
    resolvedFfmpeg = await resolveFfmpeg()
  }
  return resolvedFfmpeg
}

export interface TranscodeVariant {
  quality: 'original' | '720p' | '480p'
  label: string
  url: string
  size: number
  filePath: string
}

export interface VideoInfo {
  duration: number
  width: number
  height: number
  codec: string
  format: string
}

export interface TranscodeProgress {
  percent: number
  fps: number
  speed: number
  time: string
}

export interface TranscodeCallbacks {
  onProgress: (progress: TranscodeProgress) => void
  onLog: (message: string) => void
}

let ffmpegPath = 'ffmpeg'
let ffprobePath = 'ffprobe'
let ffmpegResolved = false

/** 设置 ffmpeg 可执行文件路径 */
export function setFfmpegPath(ffmpeg: string, ffprobe: string) {
  ffmpegPath = ffmpeg
  ffprobePath = ffprobe
  ffmpegResolved = true
}

async function ensureResolved() {
  if (!ffmpegResolved) {
    const paths = await getFfmpegPaths()
    ffmpegPath = paths.ffmpeg
    ffprobePath = paths.ffprobe
    ffmpegResolved = true
  }
}

/** 检查 ffmpeg 是否可用 */
export async function checkFfmpeg(): Promise<boolean> {
  await ensureResolved()
  return new Promise((resolve) => {
    const proc = spawn(ffmpegPath, ['-version'])
    proc.on('close', (code) => resolve(code === 0))
    proc.on('error', () => resolve(false))
  })
}

/** 获取视频元信息 */
export function getVideoInfo(filePath: string): Promise<VideoInfo> {
  return new Promise((resolve, reject) => {
    const args = [
      '-v', 'quiet',
      '-print_format', 'json',
      '-show_format',
      '-show_streams',
      filePath,
    ]
    const proc = spawn(ffprobePath, args)
    let stdout = ''
    let stderr = ''
    proc.stdout.on('data', (d: Buffer) => { stdout += d.toString() })
    proc.stderr.on('data', (d: Buffer) => { stderr += d.toString() })
    proc.on('close', (code) => {
      if (code !== 0) return reject(new Error(`ffprobe error: ${stderr}`))
      try {
        const data = JSON.parse(stdout)
        const videoStream = data.streams?.find((s: any) => s.codec_type === 'video')
        resolve({
          duration: parseFloat(data.format?.duration || '0'),
          width: videoStream?.width || 0,
          height: videoStream?.height || 0,
          codec: videoStream?.codec_name || 'unknown',
          format: data.format?.format_name || 'unknown',
        })
      } catch (e) {
        reject(new Error(`Failed to parse ffprobe output: ${e}`))
      }
    })
    proc.on('error', reject)
  })
}

/** 从文件名提取纯名称 */
export function getBaseName(filePath: string): string {
  const ext = path.extname(filePath)
  return path.basename(filePath, ext)
}

/**
 * 转码视频到 H.264 MP4
 * @returns 生成的变体列表
 */
export async function transcodeVideo(
  inputPath: string,
  outputDir: string,
  videoId: string,
  callbacks: TranscodeCallbacks,
): Promise<TranscodeVariant[]> {
  const variants: TranscodeVariant[] = []
  const baseName = getBaseName(inputPath)
  const ext = path.extname(inputPath).toLowerCase()

  // 确保输出目录存在
  fs.mkdirSync(outputDir, { recursive: true })

  // 先获取视频信息
  const info = await getVideoInfo(inputPath)
  callbacks.onLog(`视频信息: ${info.width}x${info.height}, ${info.duration.toFixed(1)}s, ${info.codec}`)

  // 判断是否需要转码 (已经是 H.264 MP4 则可直接使用)
  const needsTranscode = ext !== '.mp4' || info.codec !== 'h264'

  // 1. 原始版本 (或转为 MP4 的原始品质版本)
  const originalPath = path.join(outputDir, `${videoId}_original.mp4`)
  const originalUrl = `/api/video/file/transcoded/${videoId}_original.mp4`

  if (needsTranscode || ext !== '.mp4') {
    callbacks.onLog('转码原始品质 MP4...')
    await runFfmpeg(
      buildTranscodeArgs(inputPath, originalPath, 'original', info),
      (p) => callbacks.onProgress({ ...p, speed: p.speed }),
      callbacks.onLog,
    )
  } else {
    // 已经是 H.264 MP4，直接复制
    callbacks.onLog('原始文件已是 H.264 MP4，直接使用')
    fs.copyFileSync(inputPath, originalPath)
  }

  const originalSize = fs.statSync(originalPath).size
  variants.push({
    quality: 'original',
    label: '原画',
    url: originalUrl,
    size: originalSize,
    filePath: originalPath,
  })

  // 2. 720p 版本 (如果源视频高于 720p)
  if (info.height > 720) {
    callbacks.onLog('转码 720p...')
    const path720 = path.join(outputDir, `${videoId}_720p.mp4`)
    await runFfmpeg(
      buildTranscodeArgs(inputPath, path720, '720p', info),
      (p) => callbacks.onProgress({ ...p }),
      callbacks.onLog,
    )
    variants.push({
      quality: '720p',
      label: '720p 高清',
      url: `/api/video/file/transcoded/${videoId}_720p.mp4`,
      size: fs.statSync(path720).size,
      filePath: path720,
    })
  }

  // 3. 480p 版本 (总有一个低码率版本供慢速网络)
  if (info.height > 480) {
    callbacks.onLog('转码 480p...')
    const path480 = path.join(outputDir, `${videoId}_480p.mp4`)
    await runFfmpeg(
      buildTranscodeArgs(inputPath, path480, '480p', info),
      (p) => callbacks.onProgress({ ...p }),
      callbacks.onLog,
    )
    variants.push({
      quality: '480p',
      label: '480p 流畅',
      url: `/api/video/file/transcoded/${videoId}_480p.mp4`,
      size: fs.statSync(path480).size,
      filePath: path480,
    })
  }

  return variants
}

/** 从视频提取音频 (16kHz 单声道 WAV，用于语音识别) */
export function extractAudio(
  inputPath: string,
  outputPath: string,
  callbacks?: TranscodeCallbacks,
): Promise<void> {
  return new Promise((resolve, reject) => {
    const args = [
      '-i', inputPath,
      '-vn',                // 不要视频
      '-acodec', 'pcm_s16le', // PCM 16-bit
      '-ar', '16000',       // 16kHz
      '-ac', '1',           // 单声道
      '-y',
      outputPath,
    ]
    callbacks?.onLog('提取音频...')
    const proc = spawn(ffmpegPath, args)
    proc.stderr.on('data', (d: Buffer) => {
      const msg = d.toString()
      callbacks?.onLog(msg)
      if (msg.includes('time=')) {
        const progress = parseFfmpegProgress(msg)
        if (progress) callbacks?.onProgress(progress)
      }
    })
    proc.on('close', (code) => {
      if (code !== 0) return reject(new Error('音频提取失败'))
      resolve()
    })
    proc.on('error', reject)
  })
}

// ─── 内部工具函数 ───

function buildTranscodeArgs(
  input: string,
  output: string,
  quality: 'original' | '720p' | '480p',
  info: VideoInfo,
): string[] {
  const args: string[] = ['-i', input]

  // 视频编码
  args.push('-c:v', 'libx264')
  args.push('-preset', 'medium')  // 平衡速度和压缩率
  args.push('-crf', quality === 'original' ? '18' : '23')
  args.push('-pix_fmt', 'yuv420p') // 兼容性最好

  // 分辨率
  if (quality === '720p' && info.height > 720) {
    args.push('-vf', 'scale=-2:720')
  } else if (quality === '480p') {
    args.push('-vf', 'scale=-2:480')
  }

  // 音频编码
  args.push('-c:a', 'aac')
  args.push('-b:a', '128k')
  args.push('-ar', '44100')

  // 快速启动 (moov atom 前置，便于流式播放)
  args.push('-movflags', '+faststart')

  args.push('-y') // 覆盖输出
  args.push(output)

  return args
}

function runFfmpeg(
  args: string[],
  onProgress: (p: TranscodeProgress) => void,
  onLog: (msg: string) => void,
): Promise<void> {
  return new Promise((resolve, reject) => {
    const proc = spawn(ffmpegPath, args)
    let stderr = ''

    proc.stderr.on('data', (d: Buffer) => {
      const msg = d.toString()
      stderr += msg
      const progress = parseFfmpegProgress(msg)
      if (progress) onProgress(progress)
    })

    proc.on('close', (code) => {
      if (code !== 0) {
        return reject(new Error(`ffmpeg exited with code ${code}: ${stderr.slice(-500)}`))
      }
      resolve()
    })

    proc.on('error', reject)
  })
}

function parseFfmpegProgress(line: string): TranscodeProgress | null {
  const timeMatch = line.match(/time=(\d{2}):(\d{2}):(\d{2})\.(\d+)/)
  if (!timeMatch) return null

  const hours = parseInt(timeMatch[1])
  const minutes = parseInt(timeMatch[2])
  const seconds = parseInt(timeMatch[3])
  const time = hours * 3600 + minutes * 60 + seconds

  // 尝试提取速度信息
  const speedMatch = line.match(/speed=\s*([\d.]+)x/)
  const speed = speedMatch ? parseFloat(speedMatch[1]) : 0

  // 估算进度（需要知道总时长，这里暂时只用 time 表示）
  const fpsMatch = line.match(/fps=\s*([\d.]+)/)
  const fps = fpsMatch ? parseFloat(fpsMatch[1]) : 0

  return {
    percent: 0, // 需要配合总时长计算，在 transcodeVideo 中处理
    fps,
    speed,
    time: `${hours}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`,
  }
}
