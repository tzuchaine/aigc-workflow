# AIGC Canvas Studio

一个“自由画布 + 节点即作业 + 自动触发”的自用 AIGC 工作台（前后端同仓库、可一键启动）。

## 环境要求

- Node.js 22+
- pnpm 10+
- Docker（用于启动 Redis）

## 本地启动（推荐）

```bash
cd canvas-studio
cp .env.example .env

pnpm install
pnpm dev
```

默认端口：
- Web：`http://localhost:5173`
- API：`http://localhost:8787`

## Windows 提示：SQLite 依赖问题

本项目默认优先使用 `better-sqlite3`（SQLite），但在 Windows 上如果缺少原生编译环境或预编译包不可用，可能会启动失败。

为保证“开箱即跑”，API/Worker 已内置自动降级：当 SQLite 不可用时会改用 `DB_PATH` 同路径的 `.json` 文件存储（单人自用开发够用）。

如你希望启用 SQLite，请安装 Visual Studio Build Tools（C++）后重新安装依赖，再运行。

## 仅容器化 API / Worker（Web 本地运行）

如果不想在宿主机安装原生依赖，可以用 Docker 跑 API、Worker，Web 继续本地 `pnpm dev`：

```bash
cd canvas-studio
docker compose -f docker/docker-compose.yml up -d   # 启动 redis + api + worker

pnpm install
pnpm dev   # 本地同时启动 web（5173），API 仍走 8787
```

说明：
- `docker-compose` 会挂载源码到容器并启用 `--inspect`：API 调试端口 `9229`，Worker 调试端口 `9230`
- 数据文件：容器内路径 `/app/data/app.sqlite`（如 SQLite 不可用会自动写 `/app/data/app.json`），已挂载到宿主的 `canvas-studio/data/`
- 环境变量：容器内已经读取仓库根的 `.env`

## 当前状态

- 已完成：monorepo 脚手架、Fastify API、BullMQ worker、SSE 事件通道、Web 画布 Demo 页面
- 运行任务：当前为“模拟任务”，用于打通 run→事件→前端展示链路
