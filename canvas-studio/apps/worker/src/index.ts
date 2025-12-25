import "dotenv/config";
import { Worker } from "bullmq";
import { mkdirSync } from "node:fs";
import { dirname } from "node:path";
import { loadEnv } from "./env.js";
import { appendRunEvent } from "./events.js";
import { newId, nowIso } from "./ids.js";
import { openStore } from "./store/index.js";

const env = loadEnv();
mkdirSync(dirname(env.DB_PATH), { recursive: true });
const store = await openStore(env.DB_PATH, { warn: (msg) => console.warn(msg) });

const connection = { url: env.REDIS_URL };

// 自用项目先用“模拟执行”把链路跑通：run -> progress -> asset -> succeeded
// 后续接入 ComfyUI/第三方 API 时，只替换这段 handler 的内部逻辑即可。
const worker = new Worker(
  "node-run",
  async (job) => {
    const { runId } = job.data as { runId: string };

    const now = nowIso();
    store.updateRun(runId, { status: "running", started_at: now });
    appendRunEvent(store, runId, "run.started", { runId, startedAt: now });

    for (let p = 10; p <= 90; p += 20) {
      await new Promise((r) => setTimeout(r, 300));
      store.updateRun(runId, { progress: p });
      appendRunEvent(store, runId, "run.progress", { runId, progress: p, message: "模拟执行中" });
    }

    // 产物：先用占位 URL（后续改为上传 OSS 后的真实 URL）
    const assetId = newId();
    const runRow = store.getRun(runId);
    if (!runRow) throw new Error(`runId 不存在：${runId}`);
    const createdAt = nowIso();
    const url = `https://example.com/assets/${assetId}.png`;
    store.insertAsset({
      id: assetId,
      canvas_id: runRow.canvas_id,
      type: "image",
      mime: "image/png",
      size_bytes: 0,
      width: null,
      height: null,
      duration_ms: null,
      oss_key: null,
      url,
      thumbnail_oss_key: null,
      thumbnail_url: null,
      meta_json: JSON.stringify({ note: "模拟产物" }),
      source_run_id: runId,
      created_at: createdAt,
    });
    appendRunEvent(store, runId, "asset.created", { runId, asset: { id: assetId, type: "image", url } });

    const finishedAt = nowIso();
    store.updateRun(runId, {
      status: "succeeded",
      progress: 100,
      output_json: JSON.stringify({ assets: [assetId], byPort: { output: [assetId] } }),
      finished_at: finishedAt,
    });
    appendRunEvent(store, runId, "run.succeeded", {
      runId,
      finishedAt,
      outputs: { assets: [assetId], byPort: { output: [assetId] } },
    });
  },
  { connection }
);

worker.on("completed", (job) => {
  // eslint-disable-next-line no-console
  console.log(`[worker] completed job ${job.id}`);
});

worker.on("failed", (job, err) => {
  // eslint-disable-next-line no-console
  console.error(`[worker] failed job ${job?.id}`, err);
});
