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
 * 节点 runtime 数据
 */
export type WorkflowNodeRuntime = {
  status: WorkflowNodeStatusT;
  progress?: number; // 0-100
  message?: string;
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
