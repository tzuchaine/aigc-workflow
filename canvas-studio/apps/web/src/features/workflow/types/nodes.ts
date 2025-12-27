import type { z } from 'zod';

/**
 * 节点运行状态
 */
export const WorkflowNodeStatus = {
  Idle: 'idle',
  Queued: 'queued',
  Running: 'running',
  Succeeded: 'succeeded',
  Failed: 'failed',
  Canceled: 'canceled',
} as const;

export type WorkflowNodeStatusT = (typeof WorkflowNodeStatus)[keyof typeof WorkflowNodeStatus];

/**
 * 节点端口定义
 */
export type WorkflowNodePort = {
  id: string;
  label: string;
  description?: string;
  dataType?: string; // 例如 image/video/asset
  required?: boolean;
};

/**
 * 节点表单 schema 与初始值
 */
export type WorkflowNodeFormSchema<TFormValues extends z.ZodTypeAny = z.ZodTypeAny> = {
  schema: TFormValues;
  initialValues?: z.infer<TFormValues>;
};

/**
 * 图片数据结构
 */
export type ImageData = {
  id: string; // 唯一标识
  url: string; // Blob URL 或 OSS URL
  prompt?: string; // AI 生成时的提示词
  runId?: string; // 来源 runId（手动上传无此字段）
  createdAt: string; // 创建时间
};

/**
 * 节点 runtime 数据
 */
export type WorkflowNodeRuntime = {
  status: WorkflowNodeStatusT;
  progress?: number; // 0-100
  message?: string;
  runId?: string; // 任务运行 ID
  output?: {
    imageUrl?: string; // 单张图片（向后兼容）
    images?: ImageData[]; // 多张图片
    prompt?: string; // 单张图片提示词（向后兼容）
    metadata?: Record<string, unknown>; // 任务元数据
  };
};

/**
 * 节点 data 约定
 */
export type WorkflowNodeData<TFormValues extends z.ZodTypeAny = z.ZodTypeAny> = {
  title: string;
  subtitle?: string;
  type?: string;
  inputs?: WorkflowNodePort[];
  outputs?: WorkflowNodePort[];
  form?: WorkflowNodeFormSchema<TFormValues>;
  runtime?: WorkflowNodeRuntime;
  // GenerationNode 配置
  providerId?: string;
  taskParams?: Record<string, unknown>;
  // Header 自定义操作按钮
  headerActions?: React.ReactNode;
  // 内部标记（不允许手动添加）
  _internal?: boolean;
};

/**
 * 节点类型注册信息
 */
export type WorkflowNodeDefinition<TFormValues extends z.ZodTypeAny = z.ZodTypeAny> = {
  type: string;
  label: string;
  description?: string;
  icon?: string;
  inputs?: WorkflowNodePort[];
  outputs?: WorkflowNodePort[];
  form?: WorkflowNodeFormSchema<TFormValues>;
};
