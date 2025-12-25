import Fastify from "fastify";
import cors from "@fastify/cors";
import { loadEnv } from "./env.js";
import { createQueues } from "./queue.js";
import { registerHealthRoutes } from "./routes/health.js";
import { registerCanvasRoutes } from "./routes/canvas.js";
import { registerRunRoutes } from "./routes/run.js";
import { openStore } from "./store/index.js";

const env = loadEnv();

// 确保 sqlite 文件目录存在（自用项目，简单处理）
import { mkdirSync } from "node:fs";
import { dirname } from "node:path";
mkdirSync(dirname(env.DB_PATH), { recursive: true });

const app = Fastify({
  logger: true,
});

await app.register(cors, {
  origin: true,
});

const store = await openStore(env.DB_PATH, { warn: (msg) => app.log.warn(msg) });

const queues = createQueues(env.REDIS_URL);

await registerHealthRoutes(app);
await registerCanvasRoutes(app, store);
await registerRunRoutes(app, store, queues);

await app.listen({ host: env.API_HOST, port: env.API_PORT });
app.log.info(`API 已启动：http://${env.API_HOST}:${env.API_PORT}`);
