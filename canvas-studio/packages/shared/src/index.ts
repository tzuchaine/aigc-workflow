import { z } from "zod";

// 这里放跨端共享的类型与 schema（后续会逐步补齐）

export const NodeRunStatusSchema = z.enum(["queued", "running", "succeeded", "failed", "canceled"]);
export type NodeRunStatus = z.infer<typeof NodeRunStatusSchema>;

export const TriggerSourceSchema = z.enum(["manual", "auto"]);
export type TriggerSource = z.infer<typeof TriggerSourceSchema>;

