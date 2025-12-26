import { memo } from 'react';
import type { NodeProps } from 'reactflow';
import type { WorkflowNodeData } from '../../types';
import { BaseNode } from './BaseNode';

const defaultData: WorkflowNodeData = {
  title: 'ComfyUI 图片',
  subtitle: '图片生成',
  type: 'comfy-image',
  inputs: [
    { id: 'prompt', label: 'Prompt', dataType: 'string' },
    { id: 'negative', label: 'Negative', dataType: 'string' },
  ],
  outputs: [{ id: 'image', label: '图像', dataType: 'image' }],
  runtime: { status: 'idle' },
};

export const ComfyImageNode = memo((props: NodeProps<WorkflowNodeData>) => {
  const mergedData: WorkflowNodeData = {
    ...defaultData,
    ...props.data,
    inputs: props.data?.inputs ?? defaultData.inputs,
    outputs: props.data?.outputs ?? defaultData.outputs,
    runtime: props.data?.runtime ?? defaultData.runtime,
  };

  return <BaseNode {...props} data={mergedData} />;
});

ComfyImageNode.displayName = 'ComfyImageNode';
