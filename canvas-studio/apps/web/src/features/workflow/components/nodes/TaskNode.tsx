import { memo, useEffect, useState, useCallback } from 'react';
import { Handle, Position, type NodeProps, useReactFlow } from 'reactflow';
import { Loader2, CheckCircle2, XCircle, Clock, RotateCw, X, ChevronDown, ChevronUp } from 'lucide-react';
import { cn } from '@/utils/cn';
import type { WorkflowNodeData, ImageData } from '../../types';

// 任务状态类型
type TaskStatus = 'idle' | 'queued' | 'running' | 'succeeded' | 'failed' | 'canceled';

// 任务类型
type TaskType = 'image' | 'video';

// 任务元数据
interface TaskMetadata {
  // 图片任务元数据
  prompt?: string;
  negativePrompt?: string;
  width?: number;
  height?: number;
  steps?: number;
  seed?: number;

  // 视频任务元数据
  frames?: number;
  fps?: number;
  duration?: number;

  // 通用元数据
  model?: string;
  scheduler?: string;
  [key: string]: unknown;
}

// 任务输出
interface TaskOutput {
  // 图片任务输出
  images?: ImageData[];

  // 视频任务输出
  videoUrl?: string;
  thumbnailUrl?: string;

  // 元数据
  metadata?: TaskMetadata;
}

// 状态配置
const STATUS_CONFIG: Record<TaskStatus, {
  label: string;
  borderColor: string;
  icon: typeof Loader2;
  iconColor: string;
}> = {
  idle: {
    label: '未执行',
    borderColor: 'border-neutral-200',
    icon: Clock,
    iconColor: 'text-neutral-400',
  },
  queued: {
    label: '排队中',
    borderColor: 'border-yellow-400',
    icon: Clock,
    iconColor: 'text-yellow-500',
  },
  running: {
    label: '执行中',
    borderColor: 'border-blue-500',
    icon: Loader2,
    iconColor: 'text-blue-500',
  },
  succeeded: {
    label: '执行成功',
    borderColor: 'border-green-500',
    icon: CheckCircle2,
    iconColor: 'text-green-500',
  },
  failed: {
    label: '执行失败',
    borderColor: 'border-red-500',
    icon: XCircle,
    iconColor: 'text-red-500',
  },
  canceled: {
    label: '已取消',
    borderColor: 'border-neutral-400',
    icon: XCircle,
    iconColor: 'text-neutral-500',
  },
};

export const TaskNode = memo(({ id, data, selected }: NodeProps<WorkflowNodeData>) => {
  const reactFlow = useReactFlow();

  // 从 runtime 读取状态
  const status: TaskStatus = data.runtime?.status ?? 'idle';
  const progress = data.runtime?.progress ?? 0;
  const errorMessage = data.runtime?.message;
  const output: TaskOutput | undefined = data.runtime?.output;
  const runId = data.runtime?.runId;

  // 推断任务类型（从输出或节点数据判断）
  const taskType: TaskType = output?.images ? 'image' : output?.videoUrl ? 'video' : 'image';

  // 元数据展开状态
  const [metadataExpanded, setMetadataExpanded] = useState(false);

  // 状态配置
  const config = STATUS_CONFIG[status];
  const Icon = config.icon;

  // 更新节点数据的辅助函数
  const updateNodeData = useCallback((updates: Partial<WorkflowNodeData['runtime']>) => {
    reactFlow.setNodes((nodes) =>
      nodes.map((node) => {
        if (node.id === id) {
          return {
            ...node,
            data: {
              ...node.data,
              runtime: {
                ...node.data.runtime,
                ...updates,
              },
            },
          };
        }
        return node;
      })
    );
  }, [id, reactFlow]);

  // SSE 事件监听
  useEffect(() => {
    if (!runId || status === 'succeeded' || status === 'failed' || status === 'canceled') {
      return;
    }

    const eventSource = new EventSource(`/api/runs/${runId}/events`);

    eventSource.addEventListener('run.progress', (e) => {
      const event = JSON.parse(e.data);
      console.log('[TaskNode] Progress event:', event);
      updateNodeData({
        status: 'running',
        progress: event.progress ?? 0,
      });
    });

    eventSource.addEventListener('run.succeeded', (e) => {
      const event = JSON.parse(e.data);
      console.log('[TaskNode] Success event:', event);
      updateNodeData({
        status: 'succeeded',
        progress: 100,
        output: event.output,
      });
    });

    eventSource.addEventListener('run.failed', (e) => {
      const event = JSON.parse(e.data);
      console.log('[TaskNode] Failed event:', event);
      updateNodeData({
        status: 'failed',
        message: event.message || '执行失败',
      });
    });

    return () => {
      eventSource.close();
    };
  }, [runId, status, updateNodeData]);

  // 操作处理
  const handleRetry = useCallback(() => {
    console.log('[TaskNode] Retry task:', id);
    // TODO: 调用 API 重试任务
  }, [id]);

  const handleCancel = useCallback(() => {
    console.log('[TaskNode] Cancel task:', id);
    // TODO: 调用 API 取消任务
  }, [id]);

  // 渲染元数据
  const renderMetadata = () => {
    const metadata = output?.metadata;
    if (!metadata || Object.keys(metadata).length === 0) return null;

    return (
      <div className="mt-2 border-t border-neutral-200 pt-2">
        <button
          onClick={() => setMetadataExpanded(!metadataExpanded)}
          className="flex w-full items-center justify-between text-xs text-neutral-600 hover:text-neutral-900"
        >
          <span className="font-medium">参数详情</span>
          {metadataExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
        </button>

        {metadataExpanded && (
          <div className="mt-2 space-y-1 text-xs text-neutral-600">
            {metadata.prompt && (
              <div>
                <span className="font-medium">Prompt:</span>
                <p className="mt-0.5 text-neutral-500">{metadata.prompt}</p>
              </div>
            )}
            {metadata.negativePrompt && (
              <div>
                <span className="font-medium">Negative:</span>
                <p className="mt-0.5 text-neutral-500">{metadata.negativePrompt}</p>
              </div>
            )}
            <div className="grid grid-cols-2 gap-1">
              {metadata.width && <div>宽度: {metadata.width}</div>}
              {metadata.height && <div>高度: {metadata.height}</div>}
              {metadata.steps && <div>步数: {metadata.steps}</div>}
              {metadata.seed && <div>种子: {metadata.seed}</div>}
              {metadata.frames && <div>帧数: {metadata.frames}</div>}
              {metadata.fps && <div>FPS: {metadata.fps}</div>}
            </div>
          </div>
        )}
      </div>
    );
  };

  // 渲染任务结果
  const renderTaskResult = () => {
    if (status !== 'succeeded' || !output) {
      return null;
    }

    if (taskType === 'image' && output.images && output.images.length > 0) {
      return (
        <div className="space-y-2">
          {/* 图片网格 */}
          <div className="grid grid-cols-2 gap-1">
            {output.images.slice(0, 4).map((img) => (
              <img
                key={img.id}
                src={img.url}
                alt={img.prompt}
                className="h-20 w-full rounded object-cover"
              />
            ))}
          </div>
          {output.images.length > 4 && (
            <div className="text-center text-xs text-neutral-500">
              +{output.images.length - 4} 张图片
            </div>
          )}
        </div>
      );
    }

    if (taskType === 'video' && output.videoUrl) {
      return (
        <div>
          <video
            src={output.videoUrl}
            poster={output.thumbnailUrl}
            controls
            className="w-full rounded"
          />
        </div>
      );
    }

    return null;
  };

  return (
    <div
      className={cn(
        'group relative w-[240px] rounded-[15px] border-2 bg-white shadow-sm transition-all',
        config.borderColor,
        selected && 'shadow-lg',
        !status && 'hover:shadow-md'
      )}
    >
      {/* 输入端口 */}
      <Handle
        type="target"
        id="input"
        position={Position.Left}
        className={cn(
          '!top-12 !-left-[9px] !translate-y-0',
          'z-[1] !h-4 !w-4 !rounded-none !border-none !bg-transparent !outline-none',
          'after:absolute after:left-1.5 after:top-1 after:h-2 after:w-0.5 after:bg-blue-500',
          'transition-all hover:scale-125',
          'before:absolute before:left-0 before:top-0 before:h-4 before:w-4',
          'before:rounded-full before:bg-blue-500 before:opacity-0',
          'before:transition-opacity before:duration-200',
          'before:content-[\'+\'] before:flex before:items-center before:justify-center',
          'before:text-white before:text-xs before:font-bold before:leading-none',
          'group-hover:before:opacity-100',
          selected && 'before:opacity-100'
        )}
      />

      {/* 输出端口 */}
      <Handle
        type="source"
        id="output"
        position={Position.Right}
        className={cn(
          '!top-12 !-right-[9px] !translate-y-0',
          'z-[1] !h-4 !w-4 !rounded-none !border-none !bg-transparent !outline-none',
          'after:absolute after:right-1.5 after:top-1 after:h-2 after:w-0.5 after:bg-blue-500',
          'transition-all hover:scale-125',
          'before:absolute before:left-0 before:top-0 before:h-4 before:w-4',
          'before:rounded-full before:bg-blue-500 before:opacity-0',
          'before:transition-opacity before:duration-200',
          'before:content-[\'+\'] before:flex before:items-center before:justify-center',
          'before:text-white before:text-xs before:font-bold before:leading-none',
          'group-hover:before:opacity-100',
          selected && 'before:opacity-100'
        )}
      />

      {/* 节点内容 */}
      <div className="p-3">
        {/* 标题栏 */}
        <div className="mb-2 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Icon
              size={16}
              className={cn(
                config.iconColor,
                status === 'running' && 'animate-spin'
              )}
            />
            <div>
              <div className="text-sm font-semibold text-neutral-900">
                {data.title}
              </div>
              {data.subtitle && (
                <div className="text-xs text-neutral-500">{data.subtitle}</div>
              )}
            </div>
          </div>
        </div>

        {/* 状态提示 */}
        <div className="mb-2 text-xs text-neutral-600">
          {config.label}
          {status === 'running' && ` (${progress}%)`}
        </div>

        {/* 进度条 */}
        {status === 'running' && (
          <div className="mb-2 h-1 w-full overflow-hidden rounded-full bg-neutral-200">
            <div
              className="h-full bg-blue-500 transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
        )}

        {/* 错误信息 */}
        {status === 'failed' && errorMessage && (
          <div className="mb-2 rounded bg-red-50 p-2 text-xs text-red-600">
            {errorMessage}
          </div>
        )}

        {/* 任务结果 */}
        {renderTaskResult()}

        {/* 元数据 */}
        {renderMetadata()}

        {/* 操作按钮 */}
        {(status === 'failed' || status === 'succeeded') && (
          <div className="mt-2 flex space-x-2">
            <button
              onClick={handleRetry}
              className="flex flex-1 items-center justify-center space-x-1 rounded bg-blue-500 px-2 py-1 text-xs text-white hover:bg-blue-600"
            >
              <RotateCw size={12} />
              <span>重试</span>
            </button>
          </div>
        )}

        {status === 'running' && (
          <div className="mt-2">
            <button
              onClick={handleCancel}
              className="flex w-full items-center justify-center space-x-1 rounded bg-red-500 px-2 py-1 text-xs text-white hover:bg-red-600"
            >
              <X size={12} />
              <span>取消</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
});

TaskNode.displayName = 'TaskNode';
