import { useEffect } from 'react';
import type { Edge, Node } from 'reactflow';
import type { WorkflowEdgeData, WorkflowNodeData } from '../types';
import { useWorkflowStore } from '../store/useWorkflowStore';

const STORAGE_KEY = 'workflow-canvas-state';

export const useCanvasPersist = () => {
  const { nodes, edges, setNodes, setEdges } = useWorkflowStore();

  useEffect(() => {
    const payload = { nodes, edges };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
  }, [nodes, edges]);

  const load = () => {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return;
    try {
      const parsed = JSON.parse(raw) as { nodes: Node<WorkflowNodeData>[]; edges: Edge<WorkflowEdgeData>[] };
      setNodes(parsed.nodes || []);
      setEdges(parsed.edges || []);
    } catch {
      // ignore
    }
  };

  return { load };
};
