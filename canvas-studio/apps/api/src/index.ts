import Fastify from "fastify";
import cors from "@fastify/cors";
import { loadEnv } from "./env.js";
import { createQueues } from "./queue.js";
import { registerHealthRoutes } from "./routes/health.js";
import { registerCanvasRoutes } from "./routes/canvas.js";
import { registerRunRoutes } from "./routes/run.js";
import { registerProviderRoutes } from "./routes/provider.js";
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

// 确保 demo-canvas 存在（用于快速测试）
const demoCanvas = store.getCanvas("demo-canvas");
if (!demoCanvas) {
  const now = new Date().toISOString();
  const graph = JSON.stringify({ nodes: [], edges: [], viewport: { x: 0, y: 0, zoom: 1 } });
  store.createCanvas({
    id: "demo-canvas",
    name: "Demo Canvas",
    graph_json: graph,
    created_at: now,
    updated_at: now,
  });
  app.log.info("✓ 创建 demo-canvas 用于测试");
}

const queues = createQueues(env.REDIS_URL);

await registerHealthRoutes(app);
await registerCanvasRoutes(app, store);
await registerRunRoutes(app, store, queues);
await registerProviderRoutes(app);

await app.listen({ host: env.API_HOST, port: env.API_PORT });
app.log.info(`API 已启动：http://${env.API_HOST}:${env.API_PORT}`);
