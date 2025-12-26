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
  const base = defaultMap[type] ?? {
    title: meta.title || '新节点',
    subtitle: meta.desc,
    type,
    runtime: { status: 'idle' },
  };

  return {
    id: `node-${Date.now()}`,
    type,
    position: position ?? {
      x: 120 + index * 40,
      y: 120 + index * 30,
    },
    data: {
      ...base,
      title: meta.title || base.title,
      subtitle: meta.desc ?? base.subtitle,
    },
  };
};
