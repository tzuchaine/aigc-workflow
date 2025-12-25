# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 项目概述

AIGC Canvas Studio - 一个"自由画布 + 节点即作业 + 自动触发"的自用 AIGC 工作台。采用 Monorepo 架构，前后端同仓库，支持一键启动。

**核心特性**:
- 可视化画布编辑器（基于 ReactFlow）
- 节点任务队列系统（基于 BullMQ）
- SSE 实时事件推送
- 自动存储降级（SQLite → JSON 文件）

## 技术栈

- **包管理**: pnpm workspace (v10+)
- **前端**: React 19 + Vite + ReactFlow + TailwindCSS
- **后端**: Fastify 5 + BullMQ + Pino
- **存储**: Better-SQLite3 (自动降级到 JSON 文件存储)
- **队列**: Redis + BullMQ
- **类型**: TypeScript 5 + Zod
- **容器**: Docker Compose (可选)

## 常用命令

### 开发环境

```bash
# 本地全栈开发（推荐）
pnpm install
cp .env.example .env
pnpm dev  # 同时启动 api (8787) + worker + web (5173)

# 容器化运行（解决 Windows SQLite 编译问题）
pnpm docker:up    # 启动 redis + api + worker 容器
pnpm dev          # 本地仅启动 web，API 走容器 8787
pnpm docker:down  # 停止所有容器
```

### 单独启动各服务

```bash
pnpm -C apps/api dev      # API 服务 (http://localhost:8787)
pnpm -C apps/worker dev   # Worker 后台任务处理
pnpm -C apps/web dev      # Web 前端 (http://localhost:5173)
```

### 构建与质量检查

```bash
pnpm build        # 构建所有包 (api + worker + web)
pnpm lint         # 检查所有包的代码风格
pnpm type-check   # TypeScript 类型检查
```

### 单包操作示例

```bash
# 单独构建/检查某个包
pnpm -C apps/api build
pnpm -C apps/web lint
pnpm -C apps/worker type-check

# 启动生产构建
pnpm -C apps/api start   # 需先 build
```

## 项目架构

### Monorepo 结构

```
canvas-studio/
├── apps/
│   ├── api/          # Fastify API 服务
│   ├── web/          # React 前端
│   └── worker/       # BullMQ 任务处理器
├── packages/
│   ├── shared/       # 跨端共享类型（Zod schemas）
│   └── node-types/   # 节点类型定义（待实现）
├── docker/           # Docker 编排配置
└── data/             # 本地数据目录（SQLite/JSON）
```

### 核心架构模式

#### 1. 数据流：任务执行链路

```
Web UI 发起运行
  ↓
API: POST /api/canvases/:canvasId/nodes/:nodeId/run
  ↓
创建 NodeRun 记录 → 写入 BullMQ 队列
  ↓
Worker 消费任务 → 更新进度 → 写入 RunEvent
  ↓
API: SSE /api/runs/:runId/events (轮询推送)
  ↓
Web UI 监听 EventSource → 更新节点状态/新增产物节点
```

#### 2. 存储层自动降级

- **优先模式**: Better-SQLite3（高性能本地数据库）
- **降级模式**: JSON 文件存储（Windows 无编译环境时自动启用）
- **实现位置**: `apps/api/src/store/index.ts` 的 `openStore()` 函数
- **降级逻辑**: 启动时尝试加载 SQLite，失败则自动切换到 `.json` 文件

#### 3. 事件系统（SSE）

- **路由**: `GET /api/runs/:runId/events`
- **实现**: 基于 `text/event-stream` 的简单轮询推送（500ms 间隔）
- **事件类型**: `run.created`, `run.started`, `run.progress`, `run.succeeded`, `run.failed`, `asset.created`
- **后续优化方向**: 可改用 Redis Pub/Sub 或内存事件总线

### 关键数据模型

#### Canvas (画布)
```typescript
{
  id: string;
  name: string;
  graph_json: string;  // ReactFlow 图结构序列化
  version: number;     // 乐观锁版本控制
  created_at/updated_at: string;
}
```

#### NodeRun (节点执行记录)
```typescript
{
  id: string;
  canvas_id: string;
  node_id: string;
  status: "queued" | "running" | "succeeded" | "failed" | "canceled";
  trigger_source: "manual" | "auto";
  input_snapshot_json: string;   // 执行时的输入快照
  params_snapshot_json: string;  // 执行时的参数快照
  output_json: string | null;    // 执行结果
  progress: number;              // 0-100
  hop: number;                   // 链式执行深度
  // ... 时间戳字段
}
```

#### Asset (产物)
```typescript
{
  id: string;
  canvas_id: string;
  type: "image" | "video";
  url: string;                   // 当前为占位 URL
  source_run_id: string;         // 来源 RunId
  // ... OSS 相关字段（待接入）
}
```

## 重要约定

### 环境变量管理

- **配置文件**: `.env` (从 `.env.example` 复制)
- **关键变量**:
  - `DB_PATH`: 数据库路径（默认 `./data/app.sqlite`）
  - `REDIS_URL`: Redis 连接字符串
  - `VITE_API_BASE_URL`: 前端 API 基础 URL
  - `COMFY_ENDPOINT`: ComfyUI 接口地址（待接入）

### ID 生成规则

- 使用 `crypto.randomUUID()` 生成全局唯一 ID
- 时间戳使用 ISO 8601 格式（`new Date().toISOString()`）
- 参考: `apps/api/src/ids.ts`

### TypeScript 配置

- 启用严格模式（`strict: true`）
- 强制索引访问检查（`noUncheckedIndexedAccess: true`）
- 精确可选属性类型（`exactOptionalPropertyTypes: true`）
- 模块解析策略: `Bundler` (支持 workspace 别名)

### 代码风格

- 使用 ESLint 9 Flat Config（`@eslint/js` + `typescript-eslint`）
- 运行 `pnpm lint` 检查所有包
- 单文件修复: `pnpm -C apps/api lint --fix`

## 调试配置

### Docker 容器调试

- **API 调试端口**: `9229` (映射到宿主机 9229)
- **Worker 调试端口**: `9230` (映射到宿主机 9230)
- **启用方式**: 容器内自动启用 `--inspect=0.0.0.0:9229/9230`
- **VS Code 配置示例**:
  ```json
  {
    "type": "node",
    "request": "attach",
    "name": "Attach to API",
    "port": 9229,
    "restart": true,
    "sourceMaps": true
  }
  ```

## 当前状态与待办

### 已完成
- ✅ Monorepo 脚手架搭建
- ✅ Fastify API 基础架构
- ✅ BullMQ 队列 + Worker 执行链路
- ✅ SSE 事件推送机制
- ✅ SQLite/JSON 存储双模式
- ✅ Web 画布 Demo（ReactFlow 集成）
- ✅ 模拟任务链路（run → events → 前端展示）

### 待接入
- ⏳ ComfyUI 真实任务执行器（替换 `apps/worker/src/index.ts` 的模拟逻辑）
- ⏳ OSS 存储服务（S3 兼容，上传产物）
- ⏳ 节点类型系统（`packages/node-types`）
- ⏳ 自动触发机制（基于边的 trigger_mode）
- ⏳ 链式执行（parent_run_id + hop）

## 故障排查

### Windows 环境 SQLite 安装失败

**现象**: `pnpm install` 时 `better-sqlite3` 编译失败

**解决方案**:
1. **推荐**: 使用 Docker 容器运行 API/Worker（自动处理编译）
2. **本地安装**: 安装 Visual Studio Build Tools (C++ 桌面开发)
3. **自动降级**: 项目已内置降级，会自动切换到 JSON 文件存储

### API 启动后 Worker 无法消费任务

**检查清单**:
1. 确认 Redis 已启动 (`docker ps` 或 `redis-cli ping`)
2. 检查 `.env` 中 `REDIS_URL` 配置是否正确
3. 查看 Worker 日志是否有连接错误

### SSE 事件未推送

**原因**: 当前使用简单轮询（500ms），可能存在短暂延迟

**优化方向**: 改用 Redis Pub/Sub 或内存事件总线实现实时推送
