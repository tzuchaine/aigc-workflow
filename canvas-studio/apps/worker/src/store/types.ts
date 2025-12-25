export type NodeRunRow = {
  id: string;
  canvas_id: string;
  node_id: string;
  node_type: string;
  status: "queued" | "running" | "succeeded" | "failed" | "canceled";
  trigger_source: "manual" | "auto";
  idempotency_key: string | null;
  input_snapshot_json: string;
  params_snapshot_json: string;
  output_json: string | null;
  error_json: string | null;
  progress: number;
  parent_run_id: string | null;
  hop: number;
  created_at: string;
  started_at: string | null;
  finished_at: string | null;
};

export type AssetRow = {
  id: string;
  canvas_id: string;
  type: "image" | "video";
  mime: string;
  size_bytes: number;
  width: number | null;
  height: number | null;
  duration_ms: number | null;
  oss_key: string | null;
  url: string;
  thumbnail_oss_key: string | null;
  thumbnail_url: string | null;
  meta_json: string;
  source_run_id: string;
  created_at: string;
};

export type RunEventRow = {
  id: string;
  run_id: string;
  type: string;
  payload_json: string;
  created_at: string;
};

export type Store = {
  kind: "sqlite" | "file";
  path: string;
  migrate(): void;

  getRun(runId: string): NodeRunRow | null;
  updateRun(runId: string, patch: Partial<Pick<NodeRunRow, "status" | "progress" | "output_json" | "error_json" | "started_at" | "finished_at">>): void;

  insertAsset(input: AssetRow): void;
  appendRunEvent(input: RunEventRow): void;
};

