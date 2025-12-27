import type { Node, XYPosition } from 'reactflow';
import type { WorkflowNodeData } from '../types';

type NodeMeta = { title: string; desc?: string };

const defaultMap: Record<string, WorkflowNodeData> = {
  'comfy-image': {
    title: 'ComfyUI 图片',
    subtitle: '图片生成',
    type: 'comfy-image',
    inputs: [
      { id: 'prompt', label: 'Prompt', dataType: 'string' },
      { id: 'negative', label: 'Negative', dataType: 'string' },
    ],
    outputs: [{ id: 'image', label: '图像', dataType: 'image' }],
    runtime: { status: 'idle' },
  },
  'comfy-video': {
    title: 'ComfyUI 视频',
    subtitle: '视频生成',
    type: 'comfy-video',
    inputs: [
      { id: 'prompt', label: 'Prompt', dataType: 'string' },
      { id: 'frames', label: '帧数', dataType: 'number' },
    ],
    outputs: [{ id: 'video', label: '视频', dataType: 'video' }],
    runtime: { status: 'idle' },
  },
  'image-generation': {
    title: '图片生成',
    subtitle: 'AI 图片生成',
    type: 'image-generation',
    inputs: [],
    outputs: [{ id: 'output', label: '图片', dataType: 'image' }],
    runtime: { status: 'idle' },
  },
  'video-generation': {
    title: '视频生成',
    subtitle: 'AI 视频生成',
    type: 'video-generation',
    inputs: [],
    outputs: [{ id: 'output', label: '视频', dataType: 'video' }],
    runtime: { status: 'idle' },
  },
  'image-node': {
    title: '图片输入',
    subtitle: '上传/粘贴/拖入图片',
    type: 'image-node',
    inputs: [],
    outputs: [{ id: 'image', label: '图片', dataType: 'image' }],
    runtime: { status: 'idle' },
  },
  'task-node': {
    title: '任务节点',
    subtitle: '展示任务执行状态',
    type: 'task-node',
    inputs: [{ id: 'input', label: '输入', dataType: 'any' }],
    outputs: [{ id: 'output', label: '输出', dataType: 'any' }],
    runtime: { status: 'idle' },
    // 标记：不允许手动添加，由上游节点派生
    _internal: true,
  },
  asset: {
    title: '资产输出',
    subtitle: '展示生成的产物',
    type: 'asset',
    inputs: [{ id: 'asset', label: '资产', dataType: 'asset' }],
    outputs: [],
    runtime: { status: 'idle' },
  },
};

export const createWorkflowNode = (
  type: string,
  meta: NodeMeta,
  index: number,
  position?: XYPosition
): Node<WorkflowNodeData> => {
  const base: WorkflowNodeData = defaultMap[type] ?? {
    title: meta.title || '新节点',
    ...(meta.desc !== undefined && { subtitle: meta.desc }),
    type,
    runtime: { status: 'idle' as const },
  };

  const subtitle = meta.desc !== undefined ? meta.desc : base.subtitle;

  return {
    id: `node-${Date.now()}`,
    type,
    position: position ?? {
      x: 120 + index * 40,
      y: 120 + index * 30,
    },
    data: {
      title: meta.title || base.title,
      ...(subtitle !== undefined && { subtitle }),
      ...(base.type !== undefined && { type: base.type }),
      ...(base.inputs !== undefined && { inputs: base.inputs }),
      ...(base.outputs !== undefined && { outputs: base.outputs }),
      ...(base.form !== undefined && { form: base.form }),
      ...(base.runtime !== undefined && { runtime: base.runtime }),
      ...(base.providerId !== undefined && { providerId: base.providerId }),
      ...(base.taskParams !== undefined && { taskParams: base.taskParams }),
      ...(base.headerActions !== undefined && { headerActions: base.headerActions }),
      ...(base._internal !== undefined && { _internal: base._internal }),
    },
  };
};
