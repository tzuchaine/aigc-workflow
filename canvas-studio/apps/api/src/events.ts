import { newId, nowIso } from "./ids.js";
import type { Store } from "./store/types.js";

export type RunEventType =
  | "run.created"
  | "run.started"
  | "run.progress"
  | "run.log"
  | "asset.created"
  | "run.succeeded"
  | "run.failed"
  | "run.canceled"
  | "auto.triggered";

export function appendRunEvent(store: Store, runId: string, type: RunEventType, payload: unknown): void {
  store.appendRunEvent({
    id: newId(),
    run_id: runId,
    type,
    payload_json: JSON.stringify(payload),
    created_at: nowIso(),
  });
}

export function listRunEventsAfter(store: Store, runId: string, afterCreatedAt: string | null) {
  return store.listRunEventsAfter(runId, afterCreatedAt, 200);
}
