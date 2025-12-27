import type { FastifyInstance } from "fastify";
import { z } from "zod";
import type { Queues } from "../queue.js";
import { newId, nowIso } from "../ids.js";
import { appendRunEvent, listRunEventsAfter } from "../events.js";
import type { Store } from "../store/types.js";

const CreateRunBody = z.object({
  triggerSource: z.enum(["manual", "auto"]).default("manual"),
  params: z.record(z.any()).optional(), // 节点参数（如 prompt, width, height 等）
});

export async function registerRunRoutes(app: FastifyInstance, store: Store, queues: Queues) {
  app.post("/api/canvases/:canvasId/nodes/:nodeId/run", async (req, reply) => {
    const { canvasId, nodeId } = req.params as { canvasId: string; nodeId: string };
    const body = CreateRunBody.parse(req.body);

    const canvas = store.getCanvas(canvasId);
    if (!canvas) return reply.code(404).send({ code: "CANVAS_NOT_FOUND", message: "画布不存在" });

    const runId = newId();
    const now = nowIso();
    const nodeType = "demo.simulate.v1";
    const inputSnapshot = { inputs: {} };
    const paramsSnapshot = { nodeTypeVersion: 1, params: body.params ?? {} };

    store.insertRun({
      id: runId,
      canvas_id: canvasId,
      node_id: nodeId,
      node_type: nodeType,
      status: "queued",
      trigger_source: body.triggerSource,
      input_snapshot_json: JSON.stringify(inputSnapshot),
      params_snapshot_json: JSON.stringify(paramsSnapshot),
      progress: 0,
      created_at: now,
      hop: 0,
    });

    appendRunEvent(store, runId, "run.created", { runId, canvasId, nodeId, nodeType, createdAt: now });
    await queues.nodeRunQueue.add("execute", { runId }, { removeOnComplete: 200, removeOnFail: 200 });

    return { runId };
  });

  app.get("/api/runs/:runId", async (req, reply) => {
    const { runId } = req.params as { runId: string };
    const row = store.getRun(runId);
    if (!row) return reply.code(404).send({ code: "RUN_NOT_FOUND", message: "运行记录不存在" });
    return row;
  });

  app.get("/api/runs/:runId/events", async (req, reply) => {
    const { runId } = req.params as { runId: string };
    const exists = store.getRun(runId);
    if (!exists) return reply.code(404).send({ code: "RUN_NOT_FOUND", message: "运行记录不存在" });

    reply.raw.writeHead(200, {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
      "Access-Control-Allow-Origin": "*",
    });

    let lastCreatedAt: string | null = null;
    const sendEvents = () => {
      const events = listRunEventsAfter(store, runId, lastCreatedAt);
      for (const ev of events) {
        lastCreatedAt = ev.created_at;
        reply.raw.write(`event: ${ev.type}\n`);
        reply.raw.write(`data: ${ev.payload_json}\n\n`);
      }
    };

    // 先发一次历史事件
    sendEvents();

    // 简单轮询推送（后续可改成 Redis Pub/Sub 或内存事件总线）
    const interval = setInterval(sendEvents, 500);

    req.raw.on("close", () => {
      clearInterval(interval);
    });
  });
}
