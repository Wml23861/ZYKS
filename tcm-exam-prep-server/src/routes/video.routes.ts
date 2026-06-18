import { Router } from 'express'
import multer from 'multer'
import path from 'node:path'
import fs from 'node:fs'
import { requireAuth } from '../middleware/auth.js'
import { videoService } from '../services/video.service.js'
import { processVideo, resumeProcessing, cancelProcessing, getProcessingProgress, isVideoProcessing } from '../services/video-pipeline.js'
import { config } from '../config/env.js'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const router = Router()
router.use(requireAuth)

function getVideoDir() {
  return path.resolve(__dirname, '..', config.VIDEO_PATH)
}

function getTranscodedDir() {
  return path.resolve(__dirname, '..', '..', 'data', 'transcoded')
}

// 配置 multer 用于视频上传
const videoStorage = multer.diskStorage({
  destination: (req, _file, cb) => {
    // 按科目归类目录: video/科目名/
    const subjectId = (req as any).body?.subjectId || ''
    let uploadDir = getVideoDir()
    if (subjectId) {
      uploadDir = path.join(uploadDir, subjectId)
    }
    fs.mkdirSync(uploadDir, { recursive: true })
    cb(null, uploadDir)
  },
  filename: (_req, file, cb) => {
    // 保留中文文件名
    const ext = path.extname(file.originalname)
    const baseName = path.basename(file.originalname, ext)
    cb(null, `${baseName}${ext}`)
  },
})

const upload = multer({
  storage: videoStorage,
  limits: { fileSize: 4 * 1024 * 1024 * 1024 }, // 4GB
  fileFilter: (_req, file, cb) => {
    const allowed = ['.flv', '.mp4', '.webm', '.mkv', '.avi', '.mov', '.wmv']
    const ext = path.extname(file.originalname).toLowerCase()
    if (allowed.includes(ext)) {
      cb(null, true)
    } else {
      cb(new Error(`不支持的视频格式: ${ext}`))
    }
  },
})

// GET /api/videos
router.get('/videos', async (req, res, next) => {
  try {
    const videos = await videoService.findAll(req.userId!)
    res.json({ success: true, data: videos })
  } catch (err) {
    next(err)
  }
})

// GET /api/videos/scan — 扫描 video/ 目录
router.get('/videos/scan', async (req, res, next) => {
  try {
    const videoDir = getVideoDir()
    if (!fs.existsSync(videoDir)) {
      return res.json({ success: true, data: [] })
    }

    const results: { filename: string; title: string; format: string; size: number; url: string; relativePath: string }[] = []

    function scanDir(dir: string, basePath: string = '') {
      const entries = fs.readdirSync(dir, { withFileTypes: true })
      for (const entry of entries) {
        if (entry.isDirectory() && !entry.name.startsWith('.')) {
          scanDir(path.join(dir, entry.name), path.join(basePath, entry.name))
        } else if (entry.isFile()) {
          const ext = path.extname(entry.name).toLowerCase()
          const formatMap: Record<string, string> = {
            '.flv': 'flv', '.mp4': 'mp4', '.webm': 'webm',
            '.mkv': 'mkv', '.avi': 'avi', '.mov': 'mov', '.wmv': 'wmv',
          }
          if (formatMap[ext]) {
            const stat = fs.statSync(path.join(dir, entry.name))
            const relativePath = basePath ? `${basePath}/${entry.name}` : entry.name
            results.push({
              filename: entry.name,
              title: path.basename(entry.name, ext),
              format: formatMap[ext],
              size: stat.size,
              url: `/api/video/file/${encodeURIComponent(relativePath)}`,
              relativePath,
            })
          }
        }
      }
    }

    scanDir(videoDir)
    res.json({ success: true, data: results })
  } catch (err) {
    next(err)
  }
})

// POST /api/videos/upload — 上传视频文件
router.post('/videos/upload', upload.single('file'), async (req, res, next) => {
  try {
    const file = req.file
    if (!file) {
      return res.status(400).json({ success: false, error: '请选择视频文件' })
    }

    const { title, description, subjectId } = req.body as {
      title?: string; description?: string; subjectId?: string
    }

    const ext = path.extname(file.originalname).toLowerCase()
    const baseName = path.basename(file.originalname, ext)
    const formatMap: Record<string, string> = {
      '.flv': 'flv', '.mp4': 'mp4', '.webm': 'webm',
      '.mkv': 'mkv', '.avi': 'avi', '.mov': 'mov', '.wmv': 'wmv',
    }

    // 生成相对于 video/ 目录的路径
    const videoDir = getVideoDir()
    const relativePath = path.relative(videoDir, file.path).replace(/\\/g, '/')

    // 生成唯一 ID
    const id = `vid_${Date.now().toString(36)}${Math.random().toString(36).substring(2, 6)}`

    const video = await videoService.create(req.userId!, {
      id,
      title: title || baseName,
      description: description || '',
      fileUrl: `/api/video/file/${encodeURIComponent(relativePath)}`,
      duration: 0,
      fileSize: file.size,
      subjectIds: subjectId ? [subjectId] : [],
      format: formatMap[ext] || 'unknown',
    })

    res.status(201).json({ success: true, data: video })
  } catch (err) {
    next(err)
  }
})

// GET /api/videos/:id
router.get('/videos/:id', async (req, res, next) => {
  try {
    const video = await videoService.findById(req.userId!, req.params.id)
    if (!video) return res.status(404).json({ success: false, error: '视频不存在' })
    res.json({ success: true, data: video })
  } catch (err) {
    next(err)
  }
})

// POST /api/videos — 创建视频记录（不包含文件，用于扫描加载）
router.post('/videos', async (req, res, next) => {
  try {
    const video = await videoService.upsert(req.userId!, req.body)
    res.status(201).json({ success: true, data: video })
  } catch (err) {
    next(err)
  }
})

// PUT /api/videos/:id
router.put('/videos/:id', async (req, res, next) => {
  try {
    await videoService.update(req.userId!, req.params.id, req.body)
    res.json({ success: true, data: { id: req.params.id } })
  } catch (err) {
    next(err)
  }
})

// DELETE /api/videos/:id
router.delete('/videos/:id', async (req, res, next) => {
  try {
    await videoService.delete(req.userId!, req.params.id)
    res.status(204).send()
  } catch (err) {
    next(err)
  }
})

// POST /api/videos/:id/process — 触发 AI 处理
router.post('/videos/:id/process', async (req, res, next) => {
  try {
    const video = await videoService.findById(req.userId!, req.params.id)
    if (!video) return res.status(404).json({ success: false, error: '视频不存在' })

    const { force } = req.body as { force?: boolean }

    // 防呆：如果正在处理且非强制，直接拒绝
    if (!force && isVideoProcessing(req.params.id)) {
      return res.json({
        success: true,
        data: { videoId: req.params.id, message: '正在处理中，请等待完成' },
      })
    }

    // 异步启动处理，不阻塞响应
    processVideo(req.params.id, force).catch((err) => {
      console.error(`[Video Routes] 处理失败: ${req.params.id}`, err)
    })

    res.json({
      success: true,
      data: { videoId: req.params.id, message: force ? '重新处理已启动' : '处理已启动' },
    })
  } catch (err) {
    next(err)
  }
})

// POST /api/videos/:id/transcode — 快速转换为 MP4（用于播放）
router.post('/videos/:id/transcode', async (req, res, next) => {
  try {
    const video = await videoService.findById(req.userId!, req.params.id)
    if (!video) return res.status(404).json({ success: false, error: '视频不存在' })

    const ext = path.extname(video.fileUrl).toLowerCase()
    if (ext === '.mp4') {
      return res.json({ success: true, data: { status: 'done', url: video.fileUrl } })
    }

    // 获取视频文件路径
    const videoDir = getVideoDir()
    const fileParam = decodeURIComponent(video.fileUrl.replace('/api/video/file/', ''))
    const inputPath = path.join(videoDir, fileParam)
    if (!fs.existsSync(inputPath)) {
      return res.status(404).json({ success: false, error: '源文件不存在' })
    }

    // 缓存目录
    const transcodedDir = getTranscodedDir()
    fs.mkdirSync(transcodedDir, { recursive: true })
    const cacheName = req.params.id + '_play.mp4'
    const cachePath = path.join(transcodedDir, cacheName)

    // 已有缓存直接返回
    if (fs.existsSync(cachePath) && fs.statSync(cachePath).size > 0) {
      return res.json({
        success: true,
        data: { status: 'done', url: `/api/video/file/transcoded/${cacheName}` },
      })
    }

    const transcodedUrl = `/api/video/file/transcoded/${cacheName}`

    const { spawn } = await import('node:child_process')
    const fsSync = await import('node:fs')
    const nodePath = await import('node:path')
    let ffmpegPath = 'ffmpeg'
    try {
      const m = await import('@ffmpeg-installer/ffmpeg')
      const bundledPath = (m as any).default?.path || (m as any).path || 'ffmpeg'
      // Windows 下 node_modules 中的 exe 可能被锁定（EBUSY），复制到 staging 目录
      if (process.platform === 'win32' && typeof bundledPath === 'string') {
        const stagingDir = nodePath.default.resolve(config.DB_PATH, '..', 'ffmpeg-staging')
        fsSync.default.mkdirSync(stagingDir, { recursive: true })
        ffmpegPath = nodePath.default.join(stagingDir, 'ffmpeg.exe')
        if (!fsSync.default.existsSync(ffmpegPath) || fsSync.default.statSync(ffmpegPath).size !== fsSync.default.statSync(bundledPath).size) {
          fsSync.default.copyFileSync(bundledPath, ffmpegPath)
        }
      } else {
        ffmpegPath = bundledPath
      }
    } catch { /* use PATH */ }

    const doTranscode = (useCopy: boolean) => {
      const args = useCopy
        ? ['-i', inputPath, '-c', 'copy', '-movflags', '+faststart', '-y', cachePath]
        : [
            '-i', inputPath,
            '-c:v', 'libx264', '-preset', 'ultrafast', '-crf', '26',
            '-c:a', 'aac', '-b:a', '128k',
            '-movflags', 'frag_keyframe+empty_moov+faststart',
            '-y', cachePath,
          ]

      const proc = spawn(ffmpegPath, args)
      let stderr = ''
      proc.stderr.on('data', (d: Buffer) => { stderr += d.toString() })

      // 对于重编码，文件开始写入后即可播放
      if (!useCopy) {
        setTimeout(() => {
          if (fs.existsSync(cachePath) && fs.statSync(cachePath).size > 1024) {
            videoService.update(req.userId!, req.params.id, {
              transcodedVariants: [{ quality: 'original', label: 'MP4', url: transcodedUrl, size: 0 }],
            }).catch(() => {})
          }
        }, 2000) // 等 2 秒让 ffmpeg 写出初始数据
      }

      proc.on('close', (code) => {
        if (code === 0 && fs.existsSync(cachePath) && fs.statSync(cachePath).size > 0) {
          videoService.update(req.userId!, req.params.id, {
            transcodedVariants: [{ quality: 'original', label: 'MP4', url: transcodedUrl, size: fs.statSync(cachePath).size }],
          }).catch(() => {})
        } else if (useCopy) {
          console.log(`[Transcode] Remux failed, falling back to re-encode`)
          try { fs.unlinkSync(cachePath) } catch {}
          doTranscode(false)
        } else {
          console.error(`[Transcode] Failed: ${stderr.slice(-200)}`)
        }
      })
    }

    // 先尝试无损重封装（秒级，瞬时完成）
    doTranscode(true)

    // 立即返回 URL，前端可以开始播放（重封装秒完，重编码边写边播）
    res.json({ success: true, data: { status: 'started', url: transcodedUrl } })
  } catch (err) {
    next(err)
  }
})

// GET /api/videos/:id/progress — 查询处理进度
router.get('/videos/:id/progress', async (req, res, next) => {
  try {
    const progress = await getProcessingProgress(req.params.id)
    if (!progress) return res.status(404).json({ success: false, error: '视频不存在' })
    console.log(`[API-PROGRESS] ${req.params.id} → step=${progress.step}, percent=${progress.percent}%, elapsed=${progress.elapsed}s`)
    res.json({ success: true, data: progress })
  } catch (err) {
    next(err)
  }
})

// POST /api/videos/:id/cancel — 取消处理（仅重置，不重新启动）
router.post('/videos/:id/cancel', async (req, res, next) => {
  try {
    await cancelProcessing(req.params.id)
    res.json({ success: true, data: { videoId: req.params.id, message: '处理已取消' } })
  } catch (err) {
    next(err)
  }
})

// POST /api/videos/:id/retry — 重新处理
router.post('/videos/:id/retry', async (req, res, next) => {
  try {
    await cancelProcessing(req.params.id)
    processVideo(req.params.id, true).catch((err) => {
      console.error(`[Video Routes] 重新处理失败: ${req.params.id}`, err)
    })
    res.json({ success: true, data: { videoId: req.params.id, message: '重新处理已启动' } })
  } catch (err) {
    next(err)
  }
})

// PUT /api/videos/:id/match — 更新科目匹配结果
router.put('/videos/:id/match', async (req, res, next) => {
  try {
    const { matchResults } = req.body as { matchResults: any[] }
    await videoService.update(req.userId!, req.params.id, {
      subjectMatchResult: matchResults,
      subjectIds: [...new Set(matchResults.filter((m: any) => m.subjectId).map((m: any) => m.subjectId))],
    })
    res.json({ success: true })
  } catch (err) {
    next(err)
  }
})

// ═══ 视频笔记 ═══

// GET /api/videos/:id/annotations
router.get('/videos/:id/annotations', async (req, res, next) => {
  try {
    const annotations = await videoService.getAnnotations(req.userId!, req.params.id)
    res.json({ success: true, data: annotations })
  } catch (err) {
    next(err)
  }
})

// POST /api/videos/:id/annotations
router.post('/videos/:id/annotations', async (req, res, next) => {
  try {
    const annotation = await videoService.addAnnotation(req.userId!, req.body)
    res.status(201).json({ success: true, data: annotation })
  } catch (err) {
    next(err)
  }
})

// DELETE /api/videos/:vid/annotations/:id
router.delete('/videos/:vid/annotations/:id', async (req, res, next) => {
  try {
    await videoService.deleteAnnotation(req.userId!, req.params.vid, req.params.id)
    res.status(204).send()
  } catch (err) {
    next(err)
  }
})

export { router as videoRoutes }
