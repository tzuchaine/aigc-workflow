import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname } from "node:path";
import type { AssetRow, CanvasRow, NodeRunRow, RunEventRow, Store } from "./types.js";

type FileDb = {
  canvases: Record<string, CanvasRow>;
  runs: Record<string, NodeRunRow>;
  assets: Record<string, AssetRow>;
  events: RunEventRow[];
};

function emptyDb(): FileDb {
  return { canvases: {}, runs: {}, assets: {}, events: [] };
}

export function createFileStore(path: string): Store {
  mkdirSync(dirname(path), { recursive: true });
  if (!existsSync(path)) {
    writeFileSync(path, JSON.stringify(emptyDb(), null, 2), "utf-8");
  }

  const normalize = (raw: Partial<FileDb> | null | undefined): FileDb => ({
    canvases: raw?.canvases ?? {},
    runs: raw?.runs ?? {},
    assets: raw?.assets ?? {},
    events: raw?.events ?? [],
  });

  const load = (): FileDb => normalize(JSON.parse(readFileSync(path, "utf-8")) as Partial<FileDb>);
  const save = (db: FileDb) => writeFileSync(path, JSON.stringify(db, null, 2), "utf-8");

  return {
    kind: "file",
    path,

    migrate() {
      // file store 无需 migrate
      void 0;
    },

    createCanvas(input) {
      const db = load();
      const row: CanvasRow = { ...input, version: 1 };
      db.canvases[input.id] = row;
      save(db);
      return row;
    },

    getCanvas(id) {
      const db = load();
      return db.canvases[id] ?? null;
    },

    updateCanvas(input) {
      const db = load();
      const existing = db.canvases[input.id];
      if (!existing) return "not_found";
      if (existing.version !== input.expectedVersion) return "conflict";
      const updated: CanvasRow = { ...existing, graph_json: input.graph_json, version: existing.version + 1, updated_at: input.updated_at };
      db.canvases[input.id] = updated;
      save(db);
      return { id: input.id, version: updated.version, updated_at: input.updated_at };
    },

    insertRun(input) {
      const db = load();
      const row: NodeRunRow = {
        id: input.id,
        canvas_id: input.canvas_id,
        node_id: input.node_id,
        node_type: input.node_type,
        status: input.status,
        trigger_source: input.trigger_source,
        idempotency_key: input.idempotency_key ?? null,
        input_snapshot_json: input.input_snapshot_json,
        params_snapshot_json: input.params_snapshot_json,
        output_json: input.output_json ?? null,
        error_json: input.error_json ?? null,
        progress: input.progress,
        parent_run_id: input.parent_run_id ?? null,
        hop: input.hop,
        created_at: input.created_at,
        started_at: input.started_at ?? null,
        finished_at: input.finished_at ?? null,
      };
      db.runs[row.id] = row;
      save(db);
    },

    getRun(runId) {
      const db = load();
      return db.runs[runId] ?? null;
    },

    updateRun(runId, patch) {
      const db = load();
      const existing = db.runs[runId];
      if (!existing) return;
      db.runs[runId] = { ...existing, ...patch };
      save(db);
    },

    insertAsset(input) {
      const db = load();
      db.assets[input.id] = input;
      save(db);
    },

    appendRunEvent(input) {
      const db = load();
      db.events.push(input);
      save(db);
    },

    listRunEventsAfter(runId, afterCreatedAt, limit) {
      const db = load();
      const events = db.events
        .filter((e) => e.run_id === runId && (afterCreatedAt ? e.created_at > afterCreatedAt : true))
        .sort((a, b) => (a.created_at < b.created_at ? -1 : a.created_at > b.created_at ? 1 : 0))
        .slice(0, limit);
      return events.map((e) => ({ type: e.type, payload_json: e.payload_json, created_at: e.created_at }));
    },
  };
}
