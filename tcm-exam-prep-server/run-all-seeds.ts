// 独立种子运行器——逐文件导入，单文件失败不中断
// 用法: npx tsx run-all-seeds.ts
import knexFactory from 'knex'
import fs from 'fs'
import path from 'path'
import { fileURLToPath, pathToFileURL } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const knex = knexFactory.default({
  client: 'better-sqlite3',
  connection: { filename: path.resolve(__dirname, 'data', 'tcm-exam.db') },
  useNullAsDefault: true,
})

const seedDir = path.resolve(__dirname, 'seeds')
const files = fs.readdirSync(seedDir).filter(f => f.endsWith('.ts')).sort()

let ok = 0, fail = 0
for (const f of files) {
  const start = Date.now()
  try {
    const mod = await import(pathToFileURL(path.join(seedDir, f)).href)
    if (mod.seed) { await mod.seed(knex); ok++; console.log(`  OK  ${f} (${Date.now() - start}ms)`) }
  } catch (e: any) { fail++; console.error(`  FAIL ${f}: ${e.message?.slice(0, 200)}`) }
}

const q = await knex('questions').count('* as cnt').first()
const fc = await knex('flashcards').count('* as cnt').first()
console.log(`\n${ok} OK / ${fail} FAIL | ${(q as any).cnt} 题 | ${(fc as any).cnt} 闪卡`)
await knex.destroy()
