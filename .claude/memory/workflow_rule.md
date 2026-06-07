---
name: workflow-rule
description: 每次任务必须先检查并调用匹配的 Skill，再回答问题或解决问题
metadata:
  type: feedback
---

每次收到用户请求时，必须按以下顺序执行：

1. 先扫描 `<system-reminder>` 中列出的所有可用 skill
2. 判断是否有 skill 匹配当前任务场景
3. 有匹配的 skill 就用 `Skill` 工具调用，让 skill 处理任务
4. 没有匹配的再用常规方式处理

常见匹配：
- 代码审查 → `code-review`
- 验证改动 → `verify`
- 启动项目 → `run`
- 代码简化 → `simplify`
- 深度调研 → `deep-research`
- 安全审查 → `security-review`
- 配置修改 → `update-config`
- Claude API 问题 → `claude-api`

**Why:** 用户明确要求每次都要先用 skill，避免遗漏更好的解决方案。

**How to apply:** 收到任何请求时，第一步不是思考答案，而是检查有哪些 skill 可用，匹配到就调用。
