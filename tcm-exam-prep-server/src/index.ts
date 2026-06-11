import { createApp } from './app.js'
import { config } from './config/env.js'
import { getDb } from './config/database.js'
import { authService } from './services/auth.service.js'
import { resumeProcessing } from './services/video-pipeline.js'
import path from 'node:path'
import fs from 'node:fs'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

function ensureDataDir() {
  const dbPath = path.resolve(__dirname, '..', config.DB_PATH)
  const dir = path.dirname(dbPath)
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true })
  }
}

async function main() {
  ensureDataDir()

  // 运行数据库迁移
  const db = getDb()
  await db.migrate.latest()
  console.log('[DB] 数据库迁移完成')

  // 如果数据库为空，自动导入种子数据
  const subjectCount = await db('subjects').count('* as cnt').first()
  if ((subjectCount as { cnt: number }).cnt === 0) {
    console.log('[DB] 检测到空数据库，正在导入初始数据...')
    try {
      await db.seed.run()
      console.log('[DB] 初始数据导入完成')
    } catch (err) {
      console.error('[DB] 种子数据导入失败:', err)
      console.error('[DB] 请手动运行: npx tsx run-all-seeds.ts')
    }
  }

  // 确保默认管理员用户存在
  await authService.ensureDefaultUser()

  // 恢复未完成的视频处理任务
  try {
    const resumed = await resumeProcessing()
    if (resumed.length > 0) {
      console.log(`[Pipeline] 恢复 ${resumed.length} 个未完成的处理任务`)
    }
  } catch (e) {
    console.warn('[Pipeline] 恢复处理任务时出错:', e)
  }

  const app = createApp()
  app.listen(config.PORT, () => {
    console.log(`\n  TCM Exam Prep API 已启动`)
    console.log(`  地址: http://localhost:${config.PORT}`)
    console.log(`  默认账号: admin / tcm2024\n`)
  })
}

main().catch((err) => {
  console.error('启动失败:', err)
  process.exit(1)
})
