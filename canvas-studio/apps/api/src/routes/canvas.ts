import type { FastifyInstance } from "fastify";
import { z } from "zod";
import { newId, nowIso } from "../ids.js";
import type { Store } from "../store/types.js";

const CreateCanvasBody = z
  .object({
    name: z.string().min(1).max(100).optional(),
  })
  .default({});

const UpdateCanvasBody = z.object({
  graph_json: z.string(),
  version: z.number().int().positive(),
});

export async function registerCanvasRoutes(app: FastifyInstance, store: Store) {
  app.post("/api/canvases", async (req) => {
    const body = CreateCanvasBody.parse(req.body);
    const id = newId();
    const now = nowIso();
    const graph = JSON.stringify({ nodes: [], edges: [], viewport: { x: 0, y: 0, zoom: 1 } });
    const row = store.createCanvas({ id, name: body.name ?? "未命名画布", graph_json: graph, created_at: now, updated_at: now });
    return { id: row.id, name: row.name, graph_json: row.graph_json, version: row.version };
  });

  app.get("/api/canvases/:id", async (req, reply) => {
    const { id } = req.params as { id: string };
    const row = store.getCanvas(id);
    if (!row) return reply.code(404).send({ code: "CANVAS_NOT_FOUND", message: "画布不存在" });
    return row;
  });

  app.put("/api/canvases/:id", async (req, reply) => {
    const { id } = req.params as { id: string };
    const body = UpdateCanvasBody.parse(req.body);
    const now = nowIso();
    const result = store.updateCanvas({ id, graph_json: body.graph_json, expectedVersion: body.version, updated_at: now });
    if (result === "not_found") return reply.code(404).send({ code: "CANVAS_NOT_FOUND", message: "画布不存在" });
    if (result === "conflict") {
      return reply.code(409).send({ code: "CANVAS_VERSION_CONFLICT", message: "画布版本冲突，请刷新后重试" });
    }
    return result;
  });
}
