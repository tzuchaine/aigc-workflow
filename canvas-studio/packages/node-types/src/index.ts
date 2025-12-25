import { z } from "zod";

export const PortTypeSchema = z.enum(["image", "video", "text", "json"]);
export type PortType = z.infer<typeof PortTypeSchema>;

export type NodePort = {
  key: string;
  name: string;
  type: PortType;
  required: boolean;
  multiple: boolean;
};

export type NodeTypeDefinition = {
  type: string;
  displayName: string;
  category: "comfy" | "third_party" | "asset" | "utility";
  version: number;
  inputs: NodePort[];
  outputs: NodePort[];
};

// 先给一个示例 NodeType，用于跑通“注册-展示-执行”的闭环
export const DemoSimulateNode: NodeTypeDefinition = {
  type: "demo.simulate.v1",
  displayName: "模拟节点",
  category: "utility",
  version: 1,
  inputs: [],
  outputs: [{ key: "output", name: "输出", type: "image", required: true, multiple: true }],
};

export const NodeTypeRegistry: Record<string, NodeTypeDefinition> = {
  [DemoSimulateNode.type]: DemoSimulateNode,
};

