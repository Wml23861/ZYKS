---
name: save-memory-after-session
description: 每次解决完问题后，必须把相关记忆记录到 .claude/memory/ 目录
type: feedback
---

**规则**: 每轮问题解决完成后，检查是否有新的项目知识/修复经验/配置变更需要记录，如果有就更新 `.claude/memory/` 下的相关文件。

**Why:** 用户在不同电脑上使用项目，git clone 后如果没有记忆文件，每次都要重新排查相同的问题。

**How to apply:** 完成一个任务后，检查以下内容是否需要更新记忆：
- 新增/修改的服务或工具 → 更新对应 memory 文件
- 修复的 bug 和解决方案 → 记录到对应模块的 memory
- 配置变更 (端口/路径/依赖) → 更新 project_overview 或对应文件
- 新发现的约定或规则 → 写 feedback 类型记忆

记忆文件在 `.claude/memory/` 目录，索引在 `MEMORY.md`。
新增文件需要在 `MEMORY.md` 加一行索引。
