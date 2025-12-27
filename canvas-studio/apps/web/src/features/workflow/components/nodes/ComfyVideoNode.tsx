import { memo } from 'react';
import type { NodeProps } from 'reactflow';
import type { WorkflowNodeData } from '../../types';
import { BaseNode } from './BaseNode';

const defaultData: WorkflowNodeData = {
  title: 'ComfyUI 视频',
  subtitle: '视频生成',
  type: 'comfy-video',
  inputs: [
    { id: 'prompt', label: 'Prompt', dataType: 'string' },
    { id: 'frames', label: '帧数', dataType: 'number' },
  ],
  outputs: [{ id: 'video', label: '视频', dataType: 'video' }],
  runtime: { status: 'idle' },
};

export const ComfyVideoNode = memo((props: NodeProps<WorkflowNodeData>) => {
  const subtitle = props.data.subtitle ?? defaultData.subtitle;
  const typeValue = props.data.type ?? defaultData.type;
  const inputs = props.data.inputs ?? defaultData.inputs;
  const outputs = props.data.outputs ?? defaultData.outputs;
  const runtime = props.data.runtime ?? defaultData.runtime;

  const mergedData: WorkflowNodeData = {
    title: props.data.title ?? defaultData.title,
    ...(subtitle !== undefined && { subtitle }),
    ...(typeValue !== undefined && { type: typeValue }),
    ...(inputs !== undefined && { inputs }),
    ...(outputs !== undefined && { outputs }),
    ...(runtime !== undefined && { runtime }),
  };

  return <BaseNode {...props} data={mergedData} />;
});

ComfyVideoNode.displayName = 'ComfyVideoNode';
