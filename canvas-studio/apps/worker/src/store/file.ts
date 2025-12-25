import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname } from "node:path";
import type { AssetRow, NodeRunRow, RunEventRow, Store } from "./types.js";

type FileDb = {
  canvases: Record<string, { id: string; name: string; graph_json: string; version: number; created_at: string; updated_at: string }>;
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
      void 0;
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
  };
}
