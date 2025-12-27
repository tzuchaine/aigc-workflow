/**
 * 通用 Provider 节点
 * 动态渲染 Provider 参数表单，支持任意 Provider + 任意任务类型
 */

import { memo, useState, useCallback, useEffect } from 'react';
import { Handle, Position, type NodeProps, useReactFlow } from 'reactflow';
import { Play, Loader2, Sparkles } from 'lucide-react';
import { cn } from '@/utils/cn';
import type { WorkflowNodeData } from '../../types';
import { useProviders, useTaskParameters } from '../../hooks/useProviders';
import { ParameterForm } from '../ParameterForm';

interface GenericProviderNodeData extends WorkflowNodeData {
  providerId?: string;
  taskType?: 'text-to-image' | 'image-to-image' | 'text-to-video' | 'image-to-video';
}

export const GenericProviderNode = memo(({ id, data, selected }: NodeProps<GenericProviderNodeData>) => {
  const reactFlow = useReactFlow();

  // 获取可用 Provider 列表
  const { providers } = useProviders();

  // 当前选择的 Provider 和任务类型
  const [selectedProviderId, setSelectedProviderId] = useState(data.providerId || 'comfyui');
  const [selectedTaskType, setSelectedTaskType] = useState<
    'text-to-image' | 'image-to-image' | 'text-to-video' | 'image-to-video'
  >(data.taskType || 'text-to-image');

  // 获取任务参数定义
  const { parameters, loading: paramsLoading } = useTaskParameters(selectedProviderId, selectedTaskType);

  // 参数值状态
  const [paramValues, setParamValues] = useState<Record<string, unknown>>({});

  // 执行状态
  const [isExecuting, setIsExecuting] = useState(false);

  // 初始化默认值
  useEffect(() => {
    if (parameters.length === 0) return;

    const defaults: Record<string, unknown> = {};
    for (const param of parameters) {
      if (param.default !== undefined) {
        defaults[param.name] = param.default;
      }
    }
    setParamValues((prev) => ({ ...defaults, ...prev }));
  }, [parameters]);

  // 参数变更处理
  const handleParamChange = useCallback((name: string, value: unknown) => {
    setParamValues((prev) => ({ ...prev, [name]: value }));
  }, []);

  // 执行任务
  const handleExecute = useCallback(async () => {
    // 验证必填参数
    const missingParams = parameters.filter(
      (p) => p.required && (paramValues[p.name] === undefined || paramValues[p.name] === '')
    );

    if (missingParams.length > 0) {
      alert(`请填写必填参数: ${missingParams.map((p) => p.label).join(', ')}`);
      return;
    }

    setIsExecuting(true);

    try {
      // TODO: 从上下文获取 canvasId
      const canvasId = 'demo-canvas';

      const response = await fetch(`/api/canvases/${canvasId}/nodes/${id}/run`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          triggerSource: 'manual',
          providerId: selectedProviderId,
          taskType: selectedTaskType,
          params: paramValues,
        }),
      });

      if (!response.ok) {
        throw new Error(`执行失败: ${response.statusText}`);
      }

      const result = await response.json();
      console.log('[GenericProviderNode] Run created:', result);

      // 自动创建 TaskNode
      createTaskNode(result.runId);
    } catch (error) {
      console.error('[GenericProviderNode] Execute failed:', error);
      alert(`执行失败: ${error instanceof Error ? error.message : '未知错误'}`);
    } finally {
      setIsExecuting(false);
    }
  }, [id, selectedProviderId, selectedTaskType, paramValues, parameters]);

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
          title: getTaskTitle(),
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
                providerId: selectedProviderId,
                taskType: selectedTaskType,
                ...paramValues,
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
    [id, reactFlow, selectedProviderId, selectedTaskType, paramValues]
  );

  // 获取任务标题
  const getTaskTitle = () => {
    const taskTypeMap = {
      'text-to-image': '文生图任务',
      'image-to-image': '图生图任务',
      'text-to-video': '文生视频任务',
      'image-to-video': '图生视频任务',
    };
    return taskTypeMap[selectedTaskType] || '生成任务';
  };

  // 获取当前 Provider 信息
  const currentProvider = providers.find((p) => p.id === selectedProviderId);

  return (
    <div
      className={cn(
        'group relative w-[320px] rounded-[15px] border-2 bg-white shadow-sm transition-all',
        selected ? 'border-blue-500 shadow-lg' : 'border-neutral-200',
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
          'after:absolute after:right-1.5 after:top-1 after:h-2 after:w-0.5 after:bg-blue-500',
          'transition-all hover:scale-125',
          'before:absolute before:left-0 before:top-0 before:h-4 before:w-4',
          'before:rounded-full before:bg-blue-500 before:opacity-0',
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
        <div className="mb-3 flex items-center space-x-2">
          <Sparkles size={16} className="text-purple-500" />
          <div>
            <div className="text-sm font-semibold text-neutral-900">AI 生成</div>
            <div className="text-xs text-neutral-500">
              {currentProvider?.name || 'Provider'}
            </div>
          </div>
        </div>

        {/* Provider 选择 */}
        <div className="mb-3">
          <label className="mb-1 block text-xs font-medium text-neutral-700">
            Provider
          </label>
          <select
            value={selectedProviderId}
            onChange={(e) => setSelectedProviderId(e.target.value)}
            className="w-full rounded border border-neutral-300 px-2 py-1 text-xs focus:border-blue-500 focus:outline-none"
          >
            {providers.map((p) => (
              <option key={p.id} value={p.id}>
                {p.icon} {p.name}
              </option>
            ))}
          </select>
        </div>

        {/* 任务类型选择 */}
        <div className="mb-3">
          <label className="mb-1 block text-xs font-medium text-neutral-700">
            任务类型
          </label>
          <select
            value={selectedTaskType}
            onChange={(e) =>
              setSelectedTaskType(
                e.target.value as 'text-to-image' | 'image-to-image' | 'text-to-video' | 'image-to-video'
              )
            }
            className="w-full rounded border border-neutral-300 px-2 py-1 text-xs focus:border-blue-500 focus:outline-none"
          >
            {currentProvider?.supportedTasks.map((task) => (
              <option key={task} value={task}>
                {task === 'text-to-image' && '文生图'}
                {task === 'image-to-image' && '图生图'}
                {task === 'text-to-video' && '文生视频'}
                {task === 'image-to-video' && '图生视频'}
              </option>
            ))}
          </select>
        </div>

        {/* 动态参数表单 */}
        {paramsLoading ? (
          <div className="flex items-center justify-center py-4 text-xs text-neutral-500">
            <Loader2 size={14} className="mr-1 animate-spin" />
            加载参数...
          </div>
        ) : (
          <ParameterForm
            parameters={parameters}
            values={paramValues}
            onChange={handleParamChange}
            disabled={isExecuting}
          />
        )}

        {/* 执行按钮 */}
        <button
          onClick={handleExecute}
          disabled={isExecuting || paramsLoading}
          className={cn(
            'mt-3 flex w-full items-center justify-center space-x-2 rounded-lg px-3 py-2 text-sm font-medium text-white transition-colors',
            isExecuting || paramsLoading
              ? 'cursor-not-allowed bg-neutral-400'
              : 'bg-purple-500 hover:bg-purple-600'
          )}
        >
          {isExecuting ? (
            <>
              <Loader2 size={16} className="animate-spin" />
              <span>提交中...</span>
            </>
          ) : (
            <>
              <Play size={16} />
              <span>开始生成</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
});

GenericProviderNode.displayName = 'GenericProviderNode';
