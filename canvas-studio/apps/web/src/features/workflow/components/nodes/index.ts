import type { NodeTypes } from 'reactflow';
import { AssetNode } from './AssetNode';
import { ComfyImageNode } from './ComfyImageNode';
import { ComfyVideoNode } from './ComfyVideoNode';

export const workflowNodeTypes: NodeTypes = {
  'comfy-image': ComfyImageNode,
  'comfy-video': ComfyVideoNode,
  asset: AssetNode,
};

export { AssetNode, ComfyImageNode, ComfyVideoNode };
