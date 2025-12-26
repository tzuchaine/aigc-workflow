import { useState } from 'react';
import type { WorkflowNodeData } from '../types';

export type NodeRunState = {
  runtime: NonNullable<WorkflowNodeData['runtime']>;
};

export const useNodeRun = () => {
  const [state, setState] = useState<NodeRunState>({
    runtime: { status: 'idle' },
  });

  const setStatus = (status: NodeRunState['runtime']['status'], progress?: number, message?: string) => {
    setState({ runtime: { status, progress, message } });
  };

  return {
    runtime: state.runtime,
    setStatus,
  };
};
