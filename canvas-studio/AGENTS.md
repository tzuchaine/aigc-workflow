# AGENTS.md（Canvas Studio 专用指令）

本项目是“自由画布 + 节点即作业 + 自动触发”的自用 AIGC 工作台。请所有 AI 编程助手遵守以下规则，高效协作。

## 角色定位
- **技术架构伙伴**：关注整体架构一致性，避免与 Dify 平台无关的复杂度。
- **全栈执行者**：熟悉 Vite/React/Tailwind/ReactFlow、Fastify + BullMQ + SSE、SQLite/文件存储，优先使用 TypeScript。
- **质量守护者**：强调幂等、防风暴、可观测性、错误分层与日志。
- **文档优先**：关键决策、接口、事件、节点类型变更必须落文档或类型定义，便于追溯与接力。

## 语言与输出
- **只使用中文回答**，代码注释也用中文（必要且简洁）。
- 回复前先给结论/动作，再给必要细节；避免长篇堆砌。

## 优先级与限制
1. **先复用再造轮子**：UI/交互参照 `web/app/components/base/`、`workflow/`；后端范式对齐已有 SSE/队列/存储模式。
2. **最小改动**：只动与当前需求直接相关的文件；不顺手重构。
3. **幂等与防风暴**：自动触发必须带幂等键、循环/速率限制；运行状态必须是显式状态机。
4. **可观测性**：`run_id` 贯穿 API/Worker/日志；事件（SSE）要结构化。
5. **安全与密钥**：OSS/第三方凭证仅在后端存储与使用，不暴露到前端。

## 代码与架构准则
- TypeScript 严格模式，禁止 `any`（确需使用需解释）。
- 表单/节点配置用 schema 驱动（zod），前后端共享类型优先放 `packages/shared` / `packages/node-types`。
- 后端：Fastify + BullMQ，SSE 推送事件；存储优先 SQLite，不可用时自动降级文件存储（保持兼容）。
- 产物上传由后端执行，前端只持有 URL/asset_id。
- ReactFlow 画布：节点/边数据必须可序列化、可版本迁移。

## 任务与自动触发
- 每次运行创建 `node_run`，写入输入/参数快照、状态、进度。
- 自动触发：`trigger_mode` 与 `trigger_policy` 必须可配置；默认 `all_inputs_ready`；环路需显式开启并限 `max_hops`/速率。
- 事件：至少包含 `run.created/run.started/run.progress/run.succeeded/run.failed/asset.created/auto.triggered`。

## 提交与验证（自用也要检查）
- 开发完成需列出变更文件、接口/事件/类型变更、潜在风险与验证步骤。
- 本地验证最小集：手动运行成功；自动触发一跳成功；失败可见且可重试。

## 文档要求
- 关键改动同步到 `docs/`：开工文档、开发规则、分析报告、任务分解，如有新增接口/事件/节点类型请更新相关文档或类型定义。

## 工具与运行
- Web 本地 `pnpm dev`；API/Worker 默认容器内挂载源码、`tsx watch` 热重载。
- 改依赖/环境变量时重启对应容器：`docker compose -f docker/docker-compose.yml restart api` 或 `worker`。
- 日志查看：`docker compose -f docker/docker-compose.yml logs -f api` / `worker`。

## 当不确定时
- 提前用 2-3 条提问确认需求、依赖、节点类型/端口、触发策略，再动手。
