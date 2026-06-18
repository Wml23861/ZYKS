---
name: AI集成与视频处理
description: DeepSeek AI、视频Pipeline、whisper STT、试题生成
type: project
---

# AI 集成与视频处理

## 视频 AI Pipeline（当前状态 2026-06-10）

### 流程
1. 音频提取 (ffmpeg) → WAV 16kHz 单声道
2. 语音转文字 (**faster-whisper** tiny 模型 + DeepSeek 中医术语纠错)
3. DeepSeek: 提取知识点 + 重难点（带时间戳）
4. DeepSeek: 生成全文稿 + 总结分析
5. 科目章节自动匹配
6. **试题生成**: 三重来源 — 关键词匹配(30道) + 科目匹配(+30道) + AI生成(补到20+道)

### STT 引擎
- **当前**: Python `faster-whisper` + CTranslate2, tiny 模型, int8 量化
- **Python 路径**: `C:/Users/Administrator/AppData/Local/Programs/Python/Python313/python.exe`（`findPython()` 自动扫描 `%LOCALAPPDATA%/Programs/Python/` 目录）
- **脚本**: `tools/stt.py`
- **RTF**: tiny 模型 ~0.6x（比 whisper.cpp 快 4-5 倍）
- **已删除**: whisper.cpp 全部二进制 + ggml-large-v3-turbo.bin (1.6GB)

### 关键文件
- `src/services/video-pipeline.ts` — 流程编排, 7 步 + 断点恢复 + 代数防冲突
- `src/services/video-ai.service.ts` — STT, DeepSeek 调用, 试题生成
- `tools/stt.py` — faster-whisper STT 脚本
- `.env` — AI_API_KEY 必须配置

### 进度系统
- 内存 Map 为实时进度源, DB 为备份
- API 优先读内存保证前端 2s 轮询实时同步
- 进度条有流光动画

### 已修复的关键问题
- whisper.cpp → faster-whisper 迁移 (更快)
- stderr 缓冲区合并导致进度丢失 → 逐行解析
- Python 编码导致中文正则匹配不到 → PYTHONIOENCODING=utf-8 + 数字兜底匹配
- DB 写入慢导致进度不同步 → 内存进度 Map
- 代数计数器防旧流程覆盖新流程
- UNIQUE 冲突导致种子中断 → run-all-seeds.ts 逐文件容错
- 长文本 DeepSeek 纠错超过上下文 → 分块处理
- 清除 ~1.7GB 无用的 whisper.cpp 文件

### AI 配置
```
AI_API_KEY=sk-...           # DeepSeek API密钥
AI_API_URL=https://api.deepseek.com/v1/chat/completions
AI_MODEL=deepseek-chat
```

### 种子恢复
```bash
npx tsx run-all-seeds.ts   # 逐文件导入, 单文件失败不中断
```
