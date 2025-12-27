/**
 * Provider 系统类型定义
 */

// Provider 支持的任务类型
export type ProviderTaskType = 'text-to-image' | 'image-to-image' | 'text-to-video' | 'image-to-video';

// 参数类型
export type ParameterType = 'string' | 'number' | 'boolean' | 'select' | 'textarea' | 'image';

// 参数选项（用于 select 类型）
export interface ParameterOption {
  value: string;
  label: string;
}

// 参数定义
export interface ParameterDefinition {
  name: string;
  label: string;
  type: ParameterType;
  required: boolean;
  default?: unknown;
  description?: string;

  // 数字类型专用
  min?: number;
  max?: number;
  step?: number;

  // 字符串/文本类型专用
  placeholder?: string;
  maxLength?: number;

  // 选择类型专用
  options?: ParameterOption[];
}

// Provider 配置（用户可配置项）
export interface ProviderConfig {
  [key: string]: unknown;
}

// Provider 元数据
export interface ProviderMetadata {
  id: string;
  name: string;
  description: string;
  version: string;
  icon?: string;
  supportedTasks: ProviderTaskType[];
}

// 执行上下文
export interface ExecutionContext {
  runId: string;
  canvasId: string;
  nodeId: string;
  parameters: Record<string, unknown>;
  config: ProviderConfig;

  // 回调函数
  onProgress: (progress: number, message?: string) => void;
  onLog: (level: 'info' | 'warn' | 'error', message: string) => void;
}

// 执行结果 - 图片
export interface ImageOutput {
  id: string;
  url: string;
  width?: number;
  height?: number;
  format?: string;
  seed?: number;
}

// 执行结果 - 视频
export interface VideoOutput {
  id: string;
  url: string;
  thumbnailUrl?: string;
  width?: number;
  height?: number;
  duration?: number;
  fps?: number;
  format?: string;
}

// 执行结果
export interface ExecutionResult {
  success: boolean;
  images?: ImageOutput[];
  videos?: VideoOutput[];
  error?: string;
  metadata?: Record<string, unknown>;
}

// Provider 健康状态
export interface ProviderHealth {
  healthy: boolean;
  message?: string;
  latency?: number;
}
