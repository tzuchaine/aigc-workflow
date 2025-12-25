import type { AssetRow, NodeRunRow, RunEventRow, Store } from "./types.js";

function migrate(db: any): void {
  db.exec(`
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
  };
}

