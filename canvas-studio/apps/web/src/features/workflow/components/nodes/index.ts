import type { NodeTypes } from 'reactflow';
import { AssetNode } from './AssetNode';
import { ComfyImageNode } from './ComfyImageNode';
import { ComfyVideoNode } from './ComfyVideoNode';
import { ImageNode } from './ImageNode';
import { TaskNode } from './TaskNode';
import { ImageGenerationNode } from './ImageGenerationNode';
import { VideoGenerationNode } from './VideoGenerationNode';

export const workflowNodeTypes: NodeTypes = {
  'comfy-image': ComfyImageNode,
  'comfy-video': ComfyVideoNode,
  'image-node': ImageNode,
  'task-node': TaskNode,
  'image-generation': ImageGenerationNode,
  'video-generation': VideoGenerationNode,
  asset: AssetNode,
};

export {
  AssetNode,
  ComfyImageNode,
  ComfyVideoNode,
  ImageNode,
  TaskNode,
  ImageGenerationNode,
  VideoGenerationNode,
};
