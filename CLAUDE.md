# CLAUDE.md

## 工作规则

### 每次任务必须执行的前置步骤

在回答或解决任何问题之前，**必须先检查并调用相关 Skill**：

1. **扫描可用 Skill**：查看当前会话中 `<system-reminder>` 列出的所有可用 skill
2. **匹配适用场景**：根据用户请求，判断是否有 skill 能更好地完成该任务
3. **优先调用 Skill**：使用 `Skill` 工具调用匹配的 skill，让 skill 处理任务

### 常用 Skill 对应场景

| 场景 | Skill |
|------|-------|
| 代码审查 / PR Review | `code-review` |
| 验证代码改动是否生效 | `verify` |
| 启动/运行项目查看效果 | `run` |
| 代码简化重构 | `simplify` |
| 深度调研 | `deep-research` |
| 安全审查 | `security-review` |
| 减少权限弹窗 | `fewer-permission-prompts` |
| 配置 Claude Code | `update-config` |
| Claude API / SDK 问题 | `claude-api` |

### 其他规则

- 优先使用中文回复
- 修改代码前先阅读相关文件
- 用 markdown 链接语法引用文件：`[文件名](相对路径)`
