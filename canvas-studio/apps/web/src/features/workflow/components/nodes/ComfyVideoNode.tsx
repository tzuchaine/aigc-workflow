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
  const mergedData: WorkflowNodeData = {
    ...defaultData,
    ...props.data,
    inputs: props.data?.inputs ?? defaultData.inputs,
    outputs: props.data?.outputs ?? defaultData.outputs,
    runtime: props.data?.runtime ?? defaultData.runtime,
  };

  return <BaseNode {...props} data={mergedData} />;
});

ComfyVideoNode.displayName = 'ComfyVideoNode';
