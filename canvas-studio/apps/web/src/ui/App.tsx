/**
 * 主应用组件
 * 集成新的 Workflow 画布
 */

import { useEffect } from 'react';
import { WorkflowCanvas } from '../features/workflow/components/WorkflowCanvas';
import { useWorkflowStore } from '../features/workflow/store/useWorkflowStore';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8787';

export function App() {
  const { setNodes, setEdges } = useWorkflowStore();

  useEffect(() => {
    const init = async () => {
      // 创建画布
      const res = await fetch(`${API_BASE_URL}/api/canvases`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: '我的画布' }),
      });

      const canvas = await res.json();
      console.log('Canvas created:', canvas);

      // 设置初始节点（用于演示）
      setNodes([
        {
          id: 'demo-node-1',
          type: 'default',
          position: { x: 250, y: 150 },
          data: { label: '示例节点 1' },
        },
        {
          id: 'demo-node-2',
          type: 'default',
          position: { x: 550, y: 150 },
          data: { label: '示例节点 2' },
        },
      ]);

      setEdges([
        {
          id: 'e1-2',
          source: 'demo-node-1',
          target: 'demo-node-2',
          type: 'smoothstep',
        },
      ]);
    };

    void init();
  }, [setNodes, setEdges]);

  return (
    <div className="h-screen w-screen">
      <WorkflowCanvas />
    </div>
  );
}
