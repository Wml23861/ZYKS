import express from 'express'
import cors from 'cors'
import path from 'node:path'
import fs from 'node:fs'
import { fileURLToPath } from 'node:url'
import { routes } from './routes/index.js'
import { errorHandler } from './middleware/error-handler.js'
import { config } from './config/env.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

function getVideoDir() {
  return path.resolve(__dirname, config.VIDEO_PATH)
}

function getTranscodedDir() {
  return path.resolve(__dirname, '..', 'data', 'transcoded')
}

export function createApp() {
  const app = express()

  app.use(cors())
  app.use(express.json({ limit: '10mb' }))

  // 健康检查
  app.get('/api/health', (_req, res) => {
    res.json({ success: true, data: { status: 'ok' } })
  })

  // ─── 视频文件流（直接服务原始文件，支持子目录和转码目录） ───
  app.get('/api/video/file/*', (req, res) => {
    const fileParam = req.path.replace('/api/video/file/', '')
    if (!fileParam) {
      return res.status(400).json({ success: false, error: 'Missing file path' })
    }

    const decodedPath = decodeURIComponent(fileParam)
    const videoDir = getVideoDir()
    const transcodedDir = getTranscodedDir()

    let filePath: string
    if (decodedPath.startsWith('transcoded/') || decodedPath.startsWith('transcoded\\')) {
      const name = decodedPath.replace(/^transcoded[/\\]/, '')
      filePath = path.join(transcodedDir, name)
      if (!filePath.startsWith(transcodedDir)) {
        return res.status(403).json({ success: false, error: 'Forbidden' })
      }
    } else {
      filePath = path.join(videoDir, decodedPath)
      if (!filePath.startsWith(videoDir)) {
        return res.status(403).json({ success: false, error: 'Forbidden' })
      }
    }

    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ success: false, error: 'File not found' })
    }

    const stat = fs.statSync(filePath)
    const fileSize = stat.size
    const range = req.headers.range

    const ext = path.extname(filePath).toLowerCase()
    const mimeMap: Record<string, string> = {
      '.flv': 'video/x-flv', '.mp4': 'video/mp4', '.webm': 'video/webm',
      '.mkv': 'video/x-matroska', '.avi': 'video/x-msvideo', '.mov': 'video/quicktime',
      '.wmv': 'video/x-ms-wmv',
    }
    const contentType = mimeMap[ext] || 'application/octet-stream'

    if (range) {
      const parts = range.replace(/bytes=/, '').split('-')
      const start = parseInt(parts[0], 10)
      const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1
      const chunkSize = end - start + 1

      const stream = fs.createReadStream(filePath, { start, end })
      res.writeHead(206, {
        'Content-Range': `bytes ${start}-${end}/${fileSize}`,
        'Accept-Ranges': 'bytes',
        'Content-Length': chunkSize,
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=86400',
      })
      stream.pipe(res)
    } else {
      res.writeHead(200, {
        'Content-Length': fileSize,
        'Content-Type': contentType,
        'Accept-Ranges': 'bytes',
        'Cache-Control': 'public, max-age=86400',
      })
      fs.createReadStream(filePath).pipe(res)
    }
  })

  // 所有业务路由挂载在 /api 下
  app.use('/api', routes)

  // 生产环境：提供前端静态文件
  const distPath = path.resolve(__dirname, '..', '..', 'tcm-exam-prep', 'dist')
  if (fs.existsSync(distPath)) {
    app.use(express.static(distPath))
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'))
    })
  }

  // 全局错误处理（必须在路由之后）
  app.use(errorHandler)

  return app
}
