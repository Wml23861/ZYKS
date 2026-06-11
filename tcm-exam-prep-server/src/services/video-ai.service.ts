/**
 * 视频 AI 分析服务
 *
 * 流程：
 * 1. 语音转文字：whisper.cpp 初稿 → DeepSeek 中医术语纠错
 * 2. DeepSeek 第1次：提取知识点 + 重难点（带时间戳）
 * 3. DeepSeek 第2次：生成全文稿整理 + 总结分析
 * 4. 科目章节自动匹配
 */
import { config } from '../config/env.js'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

// ═══════════════════════════════════════════
// DeepSeek API 调用封装
// ═══════════════════════════════════════════

interface ChatMessage {
  role: 'system' | 'user' | 'assistant'
  content: string
}

async function callDeepSeek(
  messages: ChatMessage[],
  maxTokens: number = 4096,
  temperature: number = 0.3,
): Promise<string> {
  const apiKey = config.AI_API_KEY
  const apiUrl = config.AI_API_URL || 'https://api.deepseek.com/v1/chat/completions'
  const model = config.AI_MODEL || 'deepseek-chat'

  if (!apiKey) {
    throw new Error('AI_API_KEY 未配置')
  }

  const res = await fetch(apiUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
    },
    body: JSON.stringify({ model, messages, temperature, max_tokens: maxTokens }),
  })

  if (!res.ok) {
    const err = await res.text().catch(() => '')
    throw new Error(`DeepSeek API 错误 (${res.status}): ${err}`)
  }

  const data = await res.json() as { choices: { message: { content: string } }[] }
  return data.choices[0]?.message?.content || ''
}

// ═══════════════════════════════════════════
// 中医术语词典（用于 ASR 后处理纠错）
// ═══════════════════════════════════════════

const TCM_TERMS = [
  // 基础理论
  '阴阳', '五行', '脏腑', '经络', '气血', '津液', '六淫', '七情',
  '营卫', '三焦', '腠理', '辨证论治', '四诊合参', '八纲辨证',
  '脏腑辨证', '六经辨证', '卫气营血辨证', '三焦辨证',
  // 中药
  '四气五味', '归经', '升降浮沉', '配伍', '君臣佐使',
  // 方剂
  '解表剂', '泻下剂', '和解剂', '清热剂', '温里剂',
  '补益剂', '固涩剂', '安神剂', '理气剂', '理血剂',
  // 常见中药名（常被 ASR 识别错误）
  '黄芪', '黄芩', '黄连', '黄柏', '大黄', '生地黄', '熟地黄',
  '当归', '川芎', '白芍', '赤芍', '丹参', '桃仁', '红花',
  '人参', '党参', '西洋参', '太子参', '白术', '茯苓', '甘草',
  '桂枝', '麻黄', '柴胡', '葛根', '升麻', '石膏', '知母',
  '麦冬', '天冬', '玉竹', '石斛', '沙参', '枸杞', '女贞子',
  '附子', '干姜', '肉桂', '吴茱萸', '细辛', '半夏', '陈皮',
  // 穴位
  '足三里', '合谷', '太冲', '三阴交', '关元', '气海', '百会',
  '涌泉', '内关', '曲池', '阳陵泉', '阴陵泉', '血海', '中脘',
  // 经典方剂
  '麻黄汤', '桂枝汤', '小青龙汤', '大青龙汤', '银翘散', '桑菊饮',
  '白虎汤', '黄连解毒汤', '龙胆泻肝汤', '四君子汤', '四物汤',
  '八珍汤', '六味地黄丸', '肾气丸', '逍遥散', '补中益气汤',
]

// ═══════════════════════════════════════════
// 1. 语音转文字
// ═══════════════════════════════════════════

export interface SttResult {
  /** whisper 原始输出 */
  rawTranscript: string
  /** DeepSeek 纠错后的文稿 */
  correctedTranscript: string
  /** 分段（含时间戳） */
  segments: { start: number; end: number; text: string }[]
}

// ═══════════════════════════════════════════
// Whisper 进程管理（支持取消）
// ═══════════════════════════════════════════

import type { ChildProcess } from 'node:child_process'

/** 正在运行的 whisper 进程 Map<outputBase, ChildProcess> */
const runningWhisperProcesses = new Map<string, ChildProcess>()

/** 取消指定的 whisper 进程 */
export function cancelWhisperProcess(outputBase: string): boolean {
  const proc = runningWhisperProcesses.get(outputBase)
  if (proc) {
    console.log(`[STT] 取消 whisper 进程: ${outputBase}`)
    proc.kill('SIGKILL')
    runningWhisperProcesses.delete(outputBase)
    // 清理可能残留的临时文件
    try { fs.unlinkSync(outputBase + '.json') } catch {}
    return true
  }
  return false
}

/** 取消所有运行中的 whisper 进程 */
export function cancelAllWhisperProcesses(): void {
  for (const [key, proc] of runningWhisperProcesses) {
    console.log(`[STT] 取消 whisper 进程: ${key}`)
    proc.kill('SIGKILL')
    try { fs.unlinkSync(key + '.json') } catch {}
  }
  runningWhisperProcesses.clear()
}

/** 查找 Python 可执行文件路径 */
function findPython(): string {
  if (process.env.PYTHON_BIN && fs.existsSync(process.env.PYTHON_BIN)) {
    return process.env.PYTHON_BIN
  }
  // 常见安装位置
  const candidates = [
    'F:/Program Files (x86)/python/python.exe',
    'C:/Program Files/Python311/python.exe',
    'C:/Python311/python.exe',
    path.resolve(process.env.LOCALAPPDATA || '', 'Programs/Python/Python311/python.exe'),
  ]
  for (const c of candidates) {
    if (fs.existsSync(c)) return c
  }
  return 'python'  // fallback to PATH
}

/**
 * 使用 faster-whisper (Python + CTranslate2) 进行语音转文字
 * 相比 whisper.cpp: CPU 推理快 2-4 倍，支持 int8 量化
 *
 * 环境要求:
 *   pip install faster-whisper
 *   脚本: tools/stt.py
 */
async function runWhisper(
  audioPath: string,
  onProgress?: (msg: string, pct: number) => void,
): Promise<SttResult['segments']> {
  const { spawn } = await import('node:child_process')
  const toolsDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..', 'tools')

  const pythonBin = findPython()
  const sttScript = path.join(toolsDir, 'stt.py')

  // faster-whisper 模型名 (非 GGML 格式)
  // small: 已预下载，CPU+int8 RTF≈1.1x，配合 DeepSeek 纠错准确度足够
  // 可选: tiny(极快) / medium(平衡) / large-v3(最准，需手动下载模型)
  const modelName = process.env.WHISPER_MODEL_NAME || 'small'
  const device = process.env.WHISPER_DEVICE || 'cpu'
  const computeType = process.env.WHISPER_COMPUTE_TYPE || 'int8'
  const beamSize = process.env.WHISPER_BEAM_SIZE || '1'

  if (!fs.existsSync(sttScript)) {
    throw new Error(`STT 脚本不存在: ${sttScript}`)
  }

  // 输出 JSON 到临时目录
  const outputBase = audioPath + '.whisper'
  const jsonPath = outputBase + '.json'

  // 先清理可能存在的旧输出文件
  try { fs.unlinkSync(jsonPath) } catch {}

  // 取消同个输出文件的旧进程
  cancelWhisperProcess(outputBase)

  onProgress?.('正在加载语音识别模型...', 0)
  console.log('[STT] faster-whisper model:', modelName, 'device:', device, 'compute_type:', computeType)
  console.log('[STT] python:', pythonBin)

  return new Promise((resolve, reject) => {
    const proc = spawn(pythonBin, [
      sttScript,
      '--audio', audioPath,
      '--model', modelName,
      '--output', jsonPath,
      '--language', 'zh',
      '--device', device,
      '--compute_type', computeType,
      '--beam-size', beamSize,
    ], {
      env: { ...process.env, PYTHONIOENCODING: 'utf-8' },
    })

    runningWhisperProcesses.set(outputBase, proc)

    let lastReportedPct = 0
    proc.stderr.on('data', (d: Buffer) => {
      const text = d.toString()
      // 按行处理，避免缓冲区合并导致进度丢失
      for (const line of text.split('\n')) {
        const msg = line.trim()
        if (!msg) continue
        // 进度格式: "[STT] 进度 42% | ..." — 中文可能被编码混淆，用 [STT] 前缀 + 数字% 匹配
        const pctMatch = msg.match(/\[STT\]\s*\S*\s*(\d+)%/)
        if (!pctMatch && msg.includes('%') && msg.includes('|')) {
          // 备选：纯数字后跟 % 的行
          const m2 = msg.match(/(\d+)%/)
          if (m2 && onProgress) {
            const pct = parseInt(m2[1])
            if (pct >= 1 && pct <= 100 && pct !== lastReportedPct) {
              lastReportedPct = pct
              console.log(`[STT-PROGRESS] whisper=${pct}% → 通知 pipeline`)
              onProgress(`转写中 ${pct}%`, pct)
            }
          }
        }
        if (pctMatch && onProgress) {
          const pct = parseInt(pctMatch[1])
          if (pct >= 1 && pct <= 100 && pct !== lastReportedPct) {
            lastReportedPct = pct
            console.log(`[STT-PROGRESS] whisper=${pct}% → 通知 pipeline`)
            onProgress(`转写中 ${pct}%`, pct)
          }
        }
        console.log(msg)
      }
    })

    proc.stdout.on('data', (d: Buffer) => {
      console.log(d.toString().trim())
    })

    proc.on('close', (code) => {
      const wasCancelled = !runningWhisperProcesses.has(outputBase)
      runningWhisperProcesses.delete(outputBase)

      // 进程被取消（用户手动重处理），静默忽略
      if (wasCancelled || code === null) {
        console.log('[STT] 进程已被取消，忽略')
        return resolve([])
      }

      if (code !== 0) {
        return reject(new Error(`faster-whisper exit code ${code}: 语音识别失败，请重试`))
      }

      try {
        const data = JSON.parse(fs.readFileSync(jsonPath, 'utf-8'))
        // 清理临时 JSON
        try { fs.unlinkSync(jsonPath) } catch {}

        const segments = (data.transcription || []).map((seg: any) => ({
          start: seg.start || 0,
          end: seg.end || 0,
          text: (seg.text || '').trim(),
        })).filter((s: { text: string }) => s.text.length > 0)

        console.log(`[STT] faster-whisper done: ${segments.length} segments, RTF=${data.info?.rtf || '?'}x`)
        resolve(segments)
      } catch (e) {
        reject(new Error(`Failed to parse STT output: ${e}`))
      }
    })

    proc.on('error', (e) => {
      runningWhisperProcesses.delete(outputBase)
      reject(new Error(`faster-whisper failed to start: ${e.message}`.replaceAll?.('\\', '/') || `faster-whisper failed to start: ${e.message}`))
    })
  })
}

/** 将分段按字符数分批，每批不超过限制 */
function chunkSegments(
  segments: { start: number; end: number; text: string }[],
  maxChars: number,
): { start: number; end: number; text: string }[][] {
  const chunks: { start: number; end: number; text: string }[][] = []
  let current: { start: number; end: number; text: string }[] = []
  let charCount = 0
  for (const seg of segments) {
    if (charCount + seg.text.length > maxChars && current.length > 0) {
      chunks.push(current)
      current = []
      charCount = 0
    }
    current.push(seg)
    charCount += seg.text.length
  }
  if (current.length > 0) chunks.push(current)
  return chunks
}

/** 纠错单批文本 */
async function correctOneBatch(
  batchSegments: { start: number; end: number; text: string }[],
  batchIndex: number,
  totalBatches: number,
): Promise<{ start: number; end: number; text: string }[]> {
  const rawText = batchSegments.map(s => `[${formatTime(s.start)}-${formatTime(s.end)}] ${s.text}`).join('\n')
  const batchLabel = totalBatches > 1 ? `（第 ${batchIndex + 1}/${totalBatches} 批）` : ''

  const prompt = `你是中医术语校正专家。以下是从中医教学视频中通过语音识别转写的文本${batchLabel}，存在同音字、术语识别错误等问题。

请逐段纠正：
1. 将错误的同音词替换为正确的中医术语（如"黄起"→"黄芪"、"脉象服"→"脉象浮"）
2. 修正标点符号和断句
3. 保持时间戳格式不变

原始转写：
${rawText}

请只返回 JSON，格式如下（不要 Markdown 代码块）：
{"segments": [{"start": 0, "end": 10, "text": "纠正后文本"}, ...]}`

  try {
    const response = await callDeepSeek([
      { role: 'system', content: '你是中医语音识别校正专家。只返回 JSON，不要额外解释。' },
      { role: 'user', content: prompt },
    ], 4096, 0.1)

    const jsonMatch = response.replace(/```json\s*/g, '').replace(/```\s*/g, '').match(/\{[\s\S]*\}/)
    if (!jsonMatch) {
      console.warn(`[STT] 第${batchIndex+1}批校正结果无 JSON，使用原始文本`)
      return batchSegments
    }

    try {
      const result = JSON.parse(jsonMatch[0])
      return result.segments || batchSegments
    } catch {
      // 尝试修复截断的 JSON
      let cleaned = jsonMatch[0].replace(/,\s*}/g, '}').replace(/,\s*]/g, ']')
      if (!cleaned.endsWith('}')) cleaned += ']}'
      const result = JSON.parse(cleaned)
      return result.segments || batchSegments
    }
  } catch (e) {
    console.warn(`[STT] 第${batchIndex+1}批校正失败:`, (e as Error).message?.slice(0, 80))
    return batchSegments
  }
}

/** 使用 DeepSeek 用中医术语知识纠正 whisper 转写错误 */
async function correctTranscriptWithDeepSeek(rawSegments: { start: number; end: number; text: string }[]): Promise<SttResult> {
  const rawText = rawSegments.map(s => `[${formatTime(s.start)}-${formatTime(s.end)}] ${s.text}`).join('\n')

  // 短文本直接纠错，长文本分批
  const MAX_CHARS_PER_BATCH = 3000
  if (rawText.length <= MAX_CHARS_PER_BATCH) {
    const corrected = await correctOneBatch(rawSegments, 0, 1)
    const correctedText = corrected.map(s => s.text).join('')
    return { rawTranscript: rawText, correctedTranscript: correctedText, segments: corrected }
  }

  // 长文本分批纠错
  const batches = chunkSegments(rawSegments, MAX_CHARS_PER_BATCH)
  console.log(`[STT] 转录文本 ${rawText.length} 字符，分 ${batches.length} 批纠错`)

  const allCorrected: { start: number; end: number; text: string }[] = []
  for (let i = 0; i < batches.length; i++) {
    const corrected = await correctOneBatch(batches[i], i, batches.length)
    allCorrected.push(...corrected)
  }

  const correctedText = allCorrected.map(s => s.text).join('')
  console.log(`[STT] 纠错完成，${allCorrected.length} 个分段`)
  return { rawTranscript: rawText, correctedTranscript: correctedText, segments: allCorrected }
}

/** 语音转文字主入口 */
export async function speechToText(
  audioPath: string,
  onProgress?: (msg: string, pct: number) => void,
): Promise<SttResult> {
  console.log('[STT] 开始语音转文字...')

  // 第一步：faster-whisper 转写
  console.log('[STT] 运行 Whisper 转写...')
  const segments = await runWhisper(audioPath, onProgress)

  if (!segments || segments.length === 0) {
    // 可能被取消（force 重处理），返回空结果让调用方处理
    console.log('[STT] 转写结果为空（可能已被取消）')
    return { rawTranscript: '', correctedTranscript: '', segments: [] }
  }

  console.log(`[STT] 转写完成，${segments.length} 个分段`)

  // 第二步：DeepSeek 中医术语纠错
  console.log('[STT] DeepSeek 中医术语纠错...')
  const result = await correctTranscriptWithDeepSeek(segments)
  console.log('[STT] 语音转文字完成')

  return result
}

// ═══════════════════════════════════════════
// 2. DeepSeek 第1次：提取知识点 + 重难点
// ═══════════════════════════════════════════

export interface ExtractedKnowledge {
  keyPoints: {
    title: string
    content: string
    timestamp: number
  }[]
  difficultPoints: {
    title: string
    content: string
    timestamp: number
    type: '重点' | '难点' | '考点'
  }[]
}

/** 分块分析长文稿：切成小段 → 并行提取 → 合并去重 */
export async function chunkedExtractKeyPoints(
  correctedTranscript: string,
  segments: { start: number; end: number; text: string }[],
  onProgress?: (msg: string, pct: number) => void,
): Promise<ExtractedKnowledge> {
  const MAX_CHUNK_CHARS = 3500
  if (correctedTranscript.length <= MAX_CHUNK_CHARS) {
    return extractKeyAndDifficultPoints(correctedTranscript, segments)
  }

  // 按字符数切块
  const chunks: string[] = []
  const chunkSegments: typeof segments[] = []
  let currentChunk = ''
  let currentSegs: typeof segments = []
  for (const seg of segments) {
    if (currentChunk.length + seg.text.length > MAX_CHUNK_CHARS && currentChunk.length > 500) {
      chunks.push(currentChunk)
      chunkSegments.push(currentSegs)
      currentChunk = ''
      currentSegs = []
    }
    currentChunk += seg.text
    currentSegs.push(seg)
  }
  if (currentChunk.length > 0) { chunks.push(currentChunk); chunkSegments.push(currentSegs) }

  console.log(`[AI] 文稿 ${correctedTranscript.length} 字符，分 ${chunks.length} 块提取知识点`)

  // 并行提取（最多 3 个并发）
  const allKeyPoints: ExtractedKnowledge['keyPoints'] = []
  const allDifficultPoints: ExtractedKnowledge['difficultPoints'] = []
  const CONCURRENCY = 3

  for (let i = 0; i < chunks.length; i += CONCURRENCY) {
    const batch = chunks.slice(i, i + CONCURRENCY).map((chunk, bi) => {
      const idx = i + bi
      onProgress?.(`AI 分析第 ${idx + 1}/${chunks.length} 段`, 72 + Math.floor((idx / chunks.length) * 10))
      return extractKeyAndDifficultPoints(chunk, chunkSegments[idx] || [])
    })
    const results = await Promise.all(batch)
    for (const r of results) {
      allKeyPoints.push(...r.keyPoints)
      allDifficultPoints.push(...r.difficultPoints)
    }
  }

  // 去重：标题相似度 > 80% 的合并
  const dedupe = (items: { title: string; content: string; timestamp: number }[]) => {
    const seen = new Set<string>()
    return items.filter(item => {
      const key = item.title.slice(0, 6)
      if (seen.has(key)) return false
      seen.add(key)
      return true
    })
  }

  const keyPoints = dedupe(allKeyPoints)
  const difficultPoints = dedupe(allDifficultPoints)
  console.log(`[AI] 合并后: ${keyPoints.length} 知识点, ${difficultPoints.length} 重难点 (原始 ${allKeyPoints.length}/${allDifficultPoints.length})`)
  return { keyPoints, difficultPoints }
}

export async function extractKeyAndDifficultPoints(
  transcript: string,
  segments: { start: number; end: number; text: string }[],
): Promise<ExtractedKnowledge> {
  console.log('[AI] 第1次调用: 提取知识点和重难点...')

  const segmentsText = segments.map(s =>
    `[${formatTime(s.start)}-${formatTime(s.end)}] ${s.text}`
  ).join('\n')

  const prompt = `你是中医执业医师考试辅导专家。请从以下中医教学视频文稿中尽可能多地提取知识点和重难点，不要遗漏任何内容。

要求：
1. **知识点**：提取文稿中出现的每一个中医知识点，每个必须包含：
   - title: 精确的知识点名称
   - content: 详细说明（定义、要点、记忆口诀、考试常见问法），字数不少于 30 字
   - timestamp: 对应视频时间

2. **重难点**：必须有 type 字段标注类型（"重点"/"难点"/"考点"），且每个必须包含 content 说明原因：
   - "重点" = 执业医师考试必考的高频内容
   - "难点" = 学生普遍不易理解/掌握的内容
   - "考点" = 历年真题出现过的考察点

3. 从文稿中提取全部内容，不要因为篇幅而删减，越多越好
4. 时间戳必须精确对应文稿中的时间

带时间戳的文稿：
${segmentsText}

请返回 JSON（不要 Markdown 代码块）：
{
  "keyPoints": [
    {"title": "知识点名", "content": "详细说明...", "timestamp": 120}
  ],
  "difficultPoints": [
    {"title": "重难点名", "content": "为什么重要/难/常考", "timestamp": 180, "type": "重点"}
  ]
}`

  const response = await callDeepSeek([
    { role: 'system', content: '你是中医考试辅导专家。只返回 JSON，不要额外解释，不要用代码块包裹。' },
    { role: 'user', content: prompt },
  ], 8192, 0.3)

  // 解析 JSON
  const jsonStr = response.replace(/```json\s*/g, '').replace(/```\s*/g, '').trim()
  const jsonMatch = jsonStr.match(/\{[\s\S]*\}/)
  if (!jsonMatch) {
    console.warn('[AI] 知识点提取 JSON 解析失败，返回空')
    return { keyPoints: [], difficultPoints: [] }
  }

  try {
    return JSON.parse(jsonMatch[0])
  } catch {
    const cleaned = recoverTruncatedJson(jsonMatch[0])
    try { return JSON.parse(cleaned) } catch {
      console.warn('[AI] 知识点提取 JSON 修复失败，返回空')
      return { keyPoints: [], difficultPoints: [] }
    }
  }
}

/** 修复被截断的 JSON：补全缺失的括号 */
function recoverTruncatedJson(json: string): string {
  let cleaned = json.replace(/,\s*}/g, '}').replace(/,\s*]/g, ']')
  let braceCount = 0, bracketCount = 0
  for (const ch of cleaned) {
    if (ch === '{') braceCount++
    else if (ch === '}') braceCount--
    else if (ch === '[') bracketCount++
    else if (ch === ']') bracketCount--
  }
  while (braceCount > 0) { cleaned += '}'; braceCount-- }
  while (bracketCount > 0) { cleaned += ']'; bracketCount-- }
  return cleaned
}

// ═══════════════════════════════════════════
// 3. DeepSeek 第2次：生成全文稿 + 总结分析
// ═══════════════════════════════════════════

export interface SummaryResult {
  transcript: string    // 整理后的全文稿
  summary: string       // 综合总结分析 (Markdown)
}

export async function generateTranscriptAndSummary(
  correctedTranscript: string,
  keyPoints: { title: string; content: string; timestamp: number }[],
  difficultPoints: { title: string; content: string; timestamp: number }[],
): Promise<SummaryResult> {
  console.log('[AI] 第2次调用: 生成全文稿和总结分析...')

  const kpList = keyPoints.map((kp, i) => `${i + 1}. [${formatTime(kp.timestamp)}] ${kp.title}`).join('\n')
  const dpList = difficultPoints.map((dp, i) => `${i + 1}. [${formatTime(dp.timestamp)}] ${dp.title}`).join('\n')

  const prompt = `你是中医教学内容的整理专家。根据以下信息，生成完整的教学文稿和总结分析。

已提取的知识点：
${kpList || '（暂无）'}

已提取的重难点：
${dpList || '（暂无）'}

原始文稿（已校正）：
${correctedTranscript}

请以 JSON 格式返回（不要Markdown代码块）：
{
  "transcript": "整理后的完整教学文稿（分段清晰、标点正确、术语准确，方便学员阅读复习）",
  "summary": "综合总结分析，用 Markdown 格式，包含：\\n## 内容概要\\n（一两句话概括）\\n\\n## 核心知识点\\n（列举本章节最核心的3-8个知识点）\\n\\n## 重点难点解析\\n（详细分析考试重点和难点）\\n\\n## 学习建议\\n（针对本视频内容的学习方法和记忆技巧）\\n\\n## 考试提示\\n（相关考点和出题方向）"
}`

  const response = await callDeepSeek([
    { role: 'system', content: '你是中医教学内容整理专家。只返回 JSON，不要额外解释。' },
    { role: 'user', content: prompt },
  ], 8192, 0.5)

  const jsonStr = response.replace(/```json\s*/g, '').replace(/```\s*/g, '').trim()
  const jsonMatch = jsonStr.match(/\{[\s\S]*\}/)
  if (!jsonMatch) {
    console.warn('[AI] 总结分析 JSON 解析失败，使用原始文稿')
    return { transcript: correctedTranscript, summary: '## 总结\n\n（AI 生成失败，请重试）' }
  }

  try {
    return JSON.parse(jsonMatch[0])
  } catch {
    const cleaned = recoverTruncatedJson(jsonMatch[0])
    try {
      const partial = JSON.parse(cleaned)
      return {
        transcript: partial.transcript || correctedTranscript,
        summary: partial.summary || '（总结部分被截断，请重试）',
      }
    } catch {
      console.warn('[AI] 总结分析 JSON 修复失败，使用原始文稿')
      return { transcript: correctedTranscript, summary: '## 总结\n\n（AI 生成失败，请重试）' }
    }
  }
}

// ═══════════════════════════════════════════
// 4. 科目章节自动匹配
// ═══════════════════════════════════════════

export interface SubjectMatchResult {
  videoKpIndex: number
  videoKpTitle: string
  subjectId: string
  chapterId: string
  chapterTitle: string
  confidence: number
  manual: boolean
}

interface SubjectInfo {
  id: string
  name: string
  chapters: { id: string; title: string }[]
}

export async function matchKnowledgeToSubjects(
  keyPoints: { title: string; content: string; timestamp: number }[],
  subjects: SubjectInfo[],
): Promise<SubjectMatchResult[]> {
  if (keyPoints.length === 0 || subjects.length === 0) return []

  console.log('[AI] 科目章节匹配...')

  const subjectsText = subjects.map(s =>
    `科目: ${s.name} (id:${s.id})\n章节: ${s.chapters.map(c => `${c.title}(id:${c.id})`).join(', ')}`
  ).join('\n\n')

  const kpText = keyPoints.map((kp, i) =>
    `[${i}] ${kp.title}: ${kp.content.slice(0, 200)}`
  ).join('\n')

  const prompt = `你是中医课程内容分类专家。将以下视频知识点匹配到对应的科目和章节。

现有科目体系：
${subjectsText}

视频知识点：
${kpText}

对每个知识点，判断它属于哪个科目和章节。如果一个知识点可能属于多个科目，选择最匹配的。
如果知识点无法匹配任何现有科目/章节，subjectId和chapterId设为空字符串。

请以 JSON 数组格式返回（不要Markdown代码块）：
[
  {"videoKpIndex": 0, "subjectId": "zhongji", "chapterId": "ch_xxx", "confidence": 0.95},
  ...
]`

  const response = await callDeepSeek([
    { role: 'system', content: '你是中医课程分类专家。只返回 JSON 数组，不要额外解释，不要用代码块。' },
    { role: 'user', content: prompt },
  ], 4096, 0.2)

  const jsonStr = response.replace(/```json\s*/g, '').replace(/```\s*/g, '').trim()
  const jsonMatch = jsonStr.match(/\[[\s\S]*\]/)
  if (!jsonMatch) {
    console.warn('[AI] 科目匹配结果解析失败，返回空')
    return keyPoints.map((_, i) => ({
      videoKpIndex: i,
      videoKpTitle: keyPoints[i].title,
      subjectId: '',
      chapterId: '',
      chapterTitle: '',
      confidence: 0,
      manual: false,
    }))
  }

  try {
    const matches = JSON.parse(jsonMatch[0]) as SubjectMatchResult[]
    return matches.map(m => ({
      ...m,
      videoKpTitle: keyPoints[m.videoKpIndex]?.title || '',
      chapterTitle: '',
      manual: false,
    }))
  } catch {
    try {
      const cleaned = recoverTruncatedJson(jsonMatch[0])
      const matches = JSON.parse(cleaned) as SubjectMatchResult[]
      return matches.map(m => ({
        ...m, videoKpTitle: keyPoints[m.videoKpIndex]?.title || '', chapterTitle: '', manual: false,
      }))
    } catch {
      return keyPoints.map((_, i) => ({
      videoKpIndex: i,
      videoKpTitle: keyPoints[i].title,
      subjectId: '',
      chapterId: '',
      chapterTitle: '',
      confidence: 0,
      manual: false,
    }))
  }
  }
}

// ═══════════════════════════════════════════
// 5. 信息稿整理 + 试题生成（新增功能）
// ═══════════════════════════════════════════

/** Debug: only show first 2 calls */
let _infoDraftCallCount = 0
let _quizCallCount = 0

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

/** DeepSeek 整理 OCR 信息稿 */
export async function generateInfoDraft(
  ocrText: string,
  keyPoints: { title: string; content: string; timestamp: number }[],
): Promise<string> {
  _infoDraftCallCount++
  const maxLen = 5000
  const truncated = ocrText.length > maxLen ? ocrText.slice(0, maxLen) + '\n...(后续内容省略)' : ocrText

  const prompt = `你是中医教学内容整理专家。以下是从中医教学视频画面中通过 OCR 识别到的文字，请整理为通畅的信息稿。

要求：
1. 删除重复和乱码文字
2. 按逻辑顺序排列（如 PPT 标题→小标题→要点）
3. 补充上下文使文字通顺
4. 保留所有中医术语原文

视频知识点参考：
${keyPoints.map(kp => `- ${kp.title}`).join('\n')}

OCR 原始文字：
${truncated}

请直接返回整理后的信息稿（纯文本，不要 Markdown），不要额外解释。`

  const response = await callDeepSeek([
    { role: 'system', content: '你是中医教学内容整理专家。直接返回整理后的文字，不要额外解释。' },
    { role: 'user', content: prompt },
  ], 4096, 0.3)

  return response.trim()
}

/** 从题库匹配相关试题 + AI 生成补充 */
export async function generateQuizQuestions(
  keyPoints: { title: string; content: string; timestamp: number }[],
  difficultPoints: { title: string; content: string; timestamp: number }[],
  summary: string,
  transcript: string,
  subjectIds: string[],
): Promise<QuizQuestionItem[]> {
  _quizCallCount++

  const allQuestions: QuizQuestionItem[] = []
  const matchedIds = new Set<string>()
  let subjectNames: string[] = []

  try {
    const { getDb } = await import('../config/database.js')
    const db = getDb()
    const subs = await db('subjects').select('id', 'name', 'short_name')
    subjectNames = subs.map((s: any) => `${s.short_name || s.name}(${s.id})`)

    const addRow = (r: any) => {
      if (matchedIds.has(r.id)) return
      matchedIds.add(r.id)
      let options: { key: string; text: string }[] = []
      try { options = JSON.parse(r.options_json) } catch {}
      allQuestions.push({
        questionId: r.id, source: 'matched' as const,
        stem: r.question_stem, options,
        correctAnswer: r.correct_answer, explanation: r.explanation || '',
        difficulty: r.difficulty || 3, subjectId: r.subject_id || '', chapterId: r.chapter_id || '',
      })
    }

    // 1) 按科目 ID 直接匹配（最精准，不需要关键词）
    if (subjectIds.length > 0) {
      const rows = await db('questions')
        .whereIn('subject_id', subjectIds)
        .select('id', 'question_stem', 'options_json', 'correct_answer', 'explanation', 'difficulty', 'subject_id', 'chapter_id')
        .limit(60)
      rows.forEach(addRow)
      console.log(`[AI] 科目匹配: ${rows.length} 道`)
    }

    // 2) 按知识点关键词搜索
    const kpText = [...keyPoints, ...difficultPoints]
      .map(kp => kp.title + ' ' + kp.content.slice(0, 200))
      .join(' ')
    const keywords = [...new Set(
      kpText.replace(/[《》""''「」『』、【】,.，。；;：:！!？?\s]+/g, ' ').split(' ')
        .filter(w => w.length >= 2 && w.length <= 8 && !/^\d+$/.test(w))
    )].slice(0, 50)

    for (const kw of keywords) {
      if (matchedIds.size >= 80) break
      try {
        const rows = await db('questions')
          .where(function(this: any) {
            this.where('question_stem', 'like', `%${kw}%`)
               .orWhere('tags_json', 'like', `%${kw}%`)
               .orWhere('explanation', 'like', `%${kw}%`)
          })
          .whereNotIn('id', [...matchedIds])
          .select('id', 'question_stem', 'options_json', 'correct_answer', 'explanation', 'difficulty', 'subject_id', 'chapter_id')
          .limit(5)
        rows.forEach(addRow)
      } catch { /* 关键词含特殊字符跳过 */ }
    }
    console.log(`[AI] 题库匹配总计: ${allQuestions.length} 道`)

  } catch (e) {
    console.warn('[AI] 题库匹配失败:', (e as Error).message)
  }

  // 3) AI 生成补充 — 按文稿长度缩放目标
  const totalLen = (summary + transcript).length
  const targetTotal = Math.min(60, Math.max(10, 10 + Math.floor(totalLen / 2000) * 10))
  const toGenerate = Math.max(0, targetTotal - allQuestions.length)
  if (_quizCallCount <= 1 && toGenerate > 0) {
    const genBatches = Math.ceil(toGenerate / 5)
    console.log(`[AI] 题库 ${allQuestions.length} 道，分 ${genBatches} 批生成 ${toGenerate} 道补充...`)

    for (let batch = 0; batch < genBatches && allQuestions.length < targetTotal; batch++) {
      const batchSize = Math.min(5, targetTotal - allQuestions.length)
      const kpList = keyPoints.slice(0, 5).map(kp => `- ${kp.title}: ${kp.content.slice(0, 80)}`).join('\n')
      const dpList = difficultPoints.slice(0, 3).map(dp => `- ${dp.title}: ${dp.content.slice(0, 80)}`).join('\n')
      const refText = (summary || transcript).slice(batch * 1000, (batch + 1) * 1000 + 500)

      const prompt = `你是中医执业医师考试命题专家。请生成 ${batchSize} 道 A1 型中医单选题。

知识点：${kpList}
重难点：${dpList}
参考内容：${refText}
科目体系：${subjectNames.join(', ')}

要求：5个选项(A-E)，难度1-5，解析详细，subjectId从科目体系选。
返回纯JSON数组（无Markdown代码块）：
[{"stem":"题干","options":[{"key":"A","text":"..."},...],"correctAnswer":"A","explanation":"...","difficulty":3,"subjectId":"zhongji"}]`

      try {
        const response = await callDeepSeek([
          { role: 'system', content: '你是中医命题专家。只返回JSON数组。' },
          { role: 'user', content: prompt },
        ], 2048, 0.5)

        const jsonStr = response.replace(/```json\s*/g, '').replace(/```\s*/g, '').trim()
        const jsonMatch = jsonStr.match(/\[[\s\S]*\]/)
        if (jsonMatch) {
          let parsed: any[]
          try {
            parsed = JSON.parse(jsonMatch[0])
          } catch {
            // 修复常见截断
            let cleaned = jsonMatch[0].replace(/,\s*$/, '').replace(/,\s*\]$/, ']')
            if (!cleaned.endsWith(']')) cleaned += ']'
            parsed = JSON.parse(cleaned)
          }
          for (const g of parsed) {
            allQuestions.push({
              questionId: `q-gen-${Date.now()}-${allQuestions.length}`,
              source: 'generated',
              stem: g.stem || '', options: g.options || [],
              correctAnswer: g.correctAnswer || '', explanation: g.explanation || '',
              difficulty: g.difficulty || 3, subjectId: g.subjectId || '', chapterId: g.chapterId || '',
            })
          }
        }
      } catch (e) {
        console.warn(`[AI] 第${batch+1}批生成失败:`, (e as Error).message?.slice(0, 80))
      }
    }
    console.log(`[AI] 总计 ${allQuestions.length} 道 (匹配${allQuestions.filter(q=>q.source==='matched').length} + 生成${allQuestions.filter(q=>q.source==='generated').length})`)
  }

  return allQuestions
}

// ═══════════════════════════════════════════
// 工具函数
// ═══════════════════════════════════════════

function formatTime(seconds: number): string {
  const h = Math.floor(seconds / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  const s = Math.floor(seconds % 60)
  if (h > 0) {
    return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
  }
  return `${m}:${String(s).padStart(2, '0')}`
}
