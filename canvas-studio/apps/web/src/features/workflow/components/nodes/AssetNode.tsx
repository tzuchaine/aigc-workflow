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

AssetNode.displayName = 'AssetNode';
