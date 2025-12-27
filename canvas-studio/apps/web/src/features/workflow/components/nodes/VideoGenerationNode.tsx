/**
 * 视频生成节点
 * 支持多种 Provider（ComfyUI、Runway 等）
 * 参数配置通过侧边面板完成
 */

import { memo, useCallback, useState } from 'react';
import { Handle, Position, type NodeProps, useReactFlow } from 'reactflow';
import { Play, Loader2, Video, Settings } from 'lucide-react';
import { cn } from '@/utils/cn';
import type { WorkflowNodeData } from '../../types';

interface VideoGenerationNodeData extends WorkflowNodeData {
  providerId?: string;
  taskParams?: Record<string, unknown>;
}

export const VideoGenerationNode = memo(({ id, data, selected }: NodeProps<VideoGenerationNodeData>) => {
  const reactFlow = useReactFlow();
  const [isExecuting, setIsExecuting] = useState(false);

  // 当前配置
  const providerId = data.providerId || 'comfyui';
  const taskParams = data.taskParams || {};
  const hasPrompt = taskParams.prompt && String(taskParams.prompt).trim().length > 0;

  // 执行任务
  const handleExecute = useCallback(async () => {
    if (!hasPrompt) {
      alert('请先在右侧配置面板中填写提示词');
      return;
    }

    setIsExecuting(true);

    try {
      const canvasId = 'demo-canvas';

      const response = await fetch(`/api/canvases/${canvasId}/nodes/${id}/run`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          triggerSource: 'manual',
          providerId,
          taskType: 'text-to-video',
          params: taskParams,
        }),
      });

      if (!response.ok) {
        throw new Error(`执行失败: ${response.statusText}`);
      }

      const result = await response.json();
      console.log('[VideoGenerationNode] Run created:', result);

      // 自动创建 TaskNode
      createTaskNode(result.runId);
    } catch (error) {
      console.error('[VideoGenerationNode] Execute failed:', error);
      alert(`执行失败: ${error instanceof Error ? error.message : '未知错误'}`);
    } finally {
      setIsExecuting(false);
    }
  }, [id, providerId, taskParams, hasPrompt]);

  // 创建 TaskNode 并连接
  const createTaskNode = useCallback(
    (runId: string) => {
      const currentNode = reactFlow.getNode(id);
      if (!currentNode) return;

      const taskNode = {
        id: `task-${Date.now()}`,
        type: 'task-node',
        position: {
          x: currentNode.position.x + 350,
          y: currentNode.position.y,
        },
        data: {
          title: '视频生成任务',
          subtitle: `Run #${runId.slice(0, 8)}`,
          type: 'task-node',
          inputs: [{ id: 'input', label: '输入', dataType: 'any' }],
          outputs: [{ id: 'output', label: '输出', dataType: 'any' }],
          runtime: {
            status: 'queued',
            runId,
            progress: 0,
            output: {
              metadata: {
                providerId,
                taskType: 'text-to-video',
                ...taskParams,
              },
            },
          },
        },
      };

      const edge = {
        id: `edge-${id}-${taskNode.id}`,
        source: id,
        target: taskNode.id,
        sourceHandle: 'output',
        targetHandle: 'input',
        type: 'workflow-edge',
      };

      reactFlow.addNodes(taskNode);
      reactFlow.addEdges(edge);
    },
    [id, reactFlow, providerId, taskParams]
  );

  // 获取 Provider 显示名称
  const getProviderLabel = () => {
    const map: Record<string, string> = {
      comfyui: 'ComfyUI',
      runway: 'Runway',
      pika: 'Pika',
    };
    return map[providerId] || providerId;
  };

  return (
    <div
      className={cn(
        'group relative w-[240px] rounded-[15px] border-2 bg-white shadow-sm transition-all',
        selected ? 'border-purple-500 shadow-lg' : 'border-neutral-200',
        'hover:shadow-md'
      )}
    >
      {/* 输出端口（右侧） */}
      <Handle
        type="source"
        id="output"
        position={Position.Right}
        className={cn(
          '!top-12 !-right-[9px] !translate-y-0',
          'z-[1] !h-4 !w-4 !rounded-none !border-none !bg-transparent !outline-none',
          'after:absolute after:right-1.5 after:top-1 after:h-2 after:w-0.5 after:bg-purple-500',
          'transition-all hover:scale-125',
          'before:absolute before:left-0 before:top-0 before:h-4 before:w-4',
          'before:rounded-full before:bg-purple-500 before:opacity-0',
          'before:transition-opacity before:duration-200',
          'before:flex before:items-center before:justify-center',
          'before:text-white before:text-xs before:font-bold before:leading-none',
          'group-hover:before:opacity-100',
          selected && 'before:opacity-100'
        )}
      />

      {/* 节点内容 */}
      <div className="p-3">
        {/* 标题栏 */}
        <div className="mb-3 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Video size={16} className="text-purple-500" />
            <div>
              <div className="text-sm font-semibold text-neutral-900">视频生成</div>
              <div className="text-xs text-neutral-500">{getProviderLabel()}</div>
            </div>
          </div>
          {selected && (
            <Settings size={14} className="text-neutral-400" />
          )}
        </div>

        {/* 参数预览 */}
        <div className="mb-3 space-y-1">
          {taskParams.prompt ? (
            <div className="text-xs text-neutral-600">
              <span className="font-medium">Prompt:</span>
              <p className="mt-0.5 truncate text-neutral-500">
                {String(taskParams.prompt).slice(0, 50)}
                {String(taskParams.prompt).length > 50 ? '...' : ''}
              </p>
            </div>
          ) : (
            <div className="text-xs text-neutral-400">未配置提示词</div>
          )}

          {(taskParams.frames !== undefined || taskParams.fps !== undefined) && (
            <div className="text-xs text-neutral-500">
              {taskParams.frames !== undefined && `${taskParams.frames as number} 帧`}
              {taskParams.frames !== undefined && taskParams.fps !== undefined && ' @ '}
              {taskParams.fps !== undefined && `${taskParams.fps as number} FPS`}
            </div>
          )}
        </div>

        {/* 执行按钮 */}
        <button
          onClick={handleExecute}
          disabled={isExecuting || !hasPrompt}
          className={cn(
            'flex w-full items-center justify-center space-x-2 rounded-lg px-3 py-2 text-sm font-medium text-white transition-colors',
            isExecuting || !hasPrompt
              ? 'cursor-not-allowed bg-neutral-400'
              : 'bg-purple-500 hover:bg-purple-600'
          )}
        >
          {isExecuting ? (
            <>
              <Loader2 size={16} className="animate-spin" />
              <span>生成中...</span>
            </>
          ) : (
            <>
              <Play size={16} />
              <span>开始生成</span>
            </>
          )}
        </button>

        {!hasPrompt && (
          <div className="mt-2 text-center text-xs text-neutral-400">
            点击节点后在右侧配置参数
          </div>
        )}
      </div>
    </div>
  );
});

VideoGenerationNode.displayName = 'VideoGenerationNode';
