import type { Store, CanvasRow, NodeRunRow, AssetRow, RunEventRow } from "./types.js";

function migrate(db: any): void {
  db.exec(`
    CREATE TABLE IF NOT EXISTS canvas (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      graph_json TEXT NOT NULL,
      version INTEGER NOT NULL DEFAULT 1,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS node_run (
      id TEXT PRIMARY KEY,
      canvas_id TEXT NOT NULL,
      node_id TEXT NOT NULL,
      node_type TEXT NOT NULL,
      status TEXT NOT NULL,
      trigger_source TEXT NOT NULL,
      idempotency_key TEXT,
      input_snapshot_json TEXT NOT NULL,
      params_snapshot_json TEXT NOT NULL,
      output_json TEXT,
      error_json TEXT,
      progress INTEGER NOT NULL DEFAULT 0,
      parent_run_id TEXT,
      hop INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL,
      started_at TEXT,
      finished_at TEXT
    );
    CREATE UNIQUE INDEX IF NOT EXISTS idx_node_run_idempotency_key ON node_run(idempotency_key);

    CREATE TABLE IF NOT EXISTS asset (
      id TEXT PRIMARY KEY,
      canvas_id TEXT NOT NULL,
      type TEXT NOT NULL,
      mime TEXT NOT NULL,
      size_bytes INTEGER NOT NULL,
      width INTEGER,
      height INTEGER,
      duration_ms INTEGER,
      oss_key TEXT,
      url TEXT NOT NULL,
      thumbnail_oss_key TEXT,
      thumbnail_url TEXT,
      meta_json TEXT NOT NULL,
      source_run_id TEXT NOT NULL,
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS run_event (
      id TEXT PRIMARY KEY,
      run_id TEXT NOT NULL,
      type TEXT NOT NULL,
      payload_json TEXT NOT NULL,
      created_at TEXT NOT NULL
    );
    CREATE INDEX IF NOT EXISTS idx_run_event_run_id_created_at ON run_event(run_id, created_at);
  `);
}

export async function tryCreateSqliteStore(path: string): Promise<Store> {
  const mod = (await import("better-sqlite3")) as unknown as { default: any };
  const db = new mod.default(path);
  db.pragma("journal_mode = WAL");

  return {
    kind: "sqlite",
    path,

    migrate() {
      migrate(db);
    },

    createCanvas(input) {
      const row: CanvasRow = { ...input, version: 1 };
      db.prepare(
        "INSERT INTO canvas (id, name, graph_json, version, created_at, updated_at) VALUES (@id, @name, @graph_json, @version, @created_at, @updated_at)"
      ).run(row);
      return row;
    },

    getCanvas(id) {
      const row = db.prepare("SELECT * FROM canvas WHERE id = ?").get(id) as CanvasRow | undefined;
      return row ?? null;
    },

    updateCanvas(input) {
      const existing = db.prepare("SELECT version FROM canvas WHERE id = ?").get(input.id) as { version: number } | undefined;
      if (!existing) return "not_found";
      if (existing.version !== input.expectedVersion) return "conflict";
      const newVersion = existing.version + 1;
      db.prepare("UPDATE canvas SET graph_json = ?, version = ?, updated_at = ? WHERE id = ?").run(
        input.graph_json,
        newVersion,
        input.updated_at,
        input.id
      );
      return { id: input.id, version: newVersion, updated_at: input.updated_at };
    },

    insertRun(input) {
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
      db.prepare(
        `INSERT INTO node_run
          (id, canvas_id, node_id, node_type, status, trigger_source, idempotency_key, input_snapshot_json, params_snapshot_json, output_json, error_json, progress, parent_run_id, hop, created_at, started_at, finished_at)
         VALUES
          (@id, @canvas_id, @node_id, @node_type, @status, @trigger_source, @idempotency_key, @input_snapshot_json, @params_snapshot_json, @output_json, @error_json, @progress, @parent_run_id, @hop, @created_at, @started_at, @finished_at)`
      ).run(row);
    },

    getRun(runId) {
      return (db.prepare("SELECT * FROM node_run WHERE id = ?").get(runId) as NodeRunRow | undefined) || null;
    },

    updateRun(runId, patch) {
      const existing = db.prepare("SELECT * FROM node_run WHERE id = ?").get(runId) as NodeRunRow | undefined;
      if (!existing) return;
      const next = { ...existing, ...patch };
      db.prepare(
        "UPDATE node_run SET status = @status, progress = @progress, output_json = @output_json, error_json = @error_json, started_at = @started_at, finished_at = @finished_at WHERE id = @id"
      ).run(next);
    },

    insertAsset(input) {
      const row: AssetRow = input;
      db.prepare(
        `INSERT INTO asset
          (id, canvas_id, type, mime, size_bytes, width, height, duration_ms, oss_key, url, thumbnail_oss_key, thumbnail_url, meta_json, source_run_id, created_at)
         VALUES
          (@id, @canvas_id, @type, @mime, @size_bytes, @width, @height, @duration_ms, @oss_key, @url, @thumbnail_oss_key, @thumbnail_url, @meta_json, @source_run_id, @created_at)`
      ).run(row);
    },

    appendRunEvent(input) {
      const row: RunEventRow = input;
      db.prepare("INSERT INTO run_event (id, run_id, type, payload_json, created_at) VALUES (@id, @run_id, @type, @payload_json, @created_at)").run(row);
    },

    listRunEventsAfter(runId, afterCreatedAt, limit) {
      if (!afterCreatedAt) {
        return db
          .prepare("SELECT type, payload_json, created_at FROM run_event WHERE run_id = ? ORDER BY created_at ASC LIMIT ?")
          .all(runId, limit) as Array<{ type: string; payload_json: string; created_at: string }>;
      }
      return db
        .prepare(
          "SELECT type, payload_json, created_at FROM run_event WHERE run_id = ? AND created_at > ? ORDER BY created_at ASC LIMIT ?"
        )
        .all(runId, afterCreatedAt, limit) as Array<{ type: string; payload_json: string; created_at: string }>;
    },
  };
}
