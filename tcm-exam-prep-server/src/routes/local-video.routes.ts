import { Router } from 'express'
import path from 'node:path'
import fs from 'node:fs'
import { fileURLToPath } from 'node:url'
import { config } from '../config/env.js'
import { requireAuth } from '../middleware/auth.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const router = Router()

function getVideoDir(): string {
  return path.resolve(__dirname, '..', config.VIDEO_PATH)
}

// GET /api/video/local — 递归扫描 video/ 目录（支持按科目归类）
router.get('/video/local', requireAuth, (_req, res) => {
  const videoDir = getVideoDir()
  if (!fs.existsSync(videoDir)) {
    return res.json({ success: true, data: [] })
  }

  const videos: {
    filename: string; title: string; format: string
    size: number; url: string; relativePath: string
  }[] = []

  function scanDir(dir: string, relativeBase: string = '') {
    const entries = fs.readdirSync(dir, { withFileTypes: true })
    for (const entry of entries) {
      if (entry.isDirectory() && !entry.name.startsWith('.')) {
        scanDir(path.join(dir, entry.name),
          relativeBase ? `${relativeBase}/${entry.name}` : entry.name)
      } else if (entry.isFile()) {
        const ext = path.extname(entry.name).toLowerCase()
        const formatMap: Record<string, string> = {
          '.flv': 'flv', '.mp4': 'mp4', '.webm': 'webm',
          '.mkv': 'mkv', '.avi': 'avi', '.mov': 'mov', '.wmv': 'wmv',
        }
        if (formatMap[ext]) {
          const stat = fs.statSync(path.join(dir, entry.name))
          const relPath = relativeBase ? `${relativeBase}/${entry.name}` : entry.name
          videos.push({
            filename: entry.name,
            title: path.basename(entry.name, ext),
            format: formatMap[ext],
            size: stat.size,
            url: `/api/video/file/${encodeURIComponent(relPath.replace(/\\/g, '/'))}`,
            relativePath: relPath.replace(/\\/g, '/'),
          })
        }
      }
    }
  }

  scanDir(videoDir)
  res.json({ success: true, data: videos })
})

// 注：GET /api/video/file/* 路由在 app.ts 中处理（需要支持子目录和转码目录）

export { router as localVideoRoutes }
