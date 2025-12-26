import { memo } from 'react';
import type { NodeProps } from 'reactflow';
import type { WorkflowNodeData } from '../../types';
import { BaseNode } from './BaseNode';

const defaultData: WorkflowNodeData = {
  title: '资产输出',
  subtitle: '生成产物预览',
  type: 'asset',
  inputs: [{ id: 'asset', label: '资产', dataType: 'asset' }],
  outputs: [],
  runtime: { status: 'idle' },
};

export const AssetNode = memo((props: NodeProps<WorkflowNodeData>) => {
  const mergedData: WorkflowNodeData = {
    ...defaultData,
    ...props.data,
    inputs: props.data?.inputs ?? defaultData.inputs,
    outputs: props.data?.outputs ?? defaultData.outputs,
    runtime: props.data?.runtime ?? defaultData.runtime,
  };

  return <BaseNode {...props} data={mergedData} />;
});

AssetNode.displayName = 'AssetNode';
