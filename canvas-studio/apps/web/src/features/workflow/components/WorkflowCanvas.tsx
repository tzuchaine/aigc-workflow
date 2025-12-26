/**
 * Workflow 画布主组件
 * 集成所有工具栏和控制面板
 */

import { memo, useCallback, useEffect, useRef } from 'react';
import ReactFlow, {
  Background,
  MiniMap,
  type NodeChange,
  type EdgeChange,
  type Connection,
  type NodeDragHandler,
  addEdge,
  applyNodeChanges,
  applyEdgeChanges,
  ReactFlowProvider,
  BackgroundVariant,
  useReactFlow,
} from 'reactflow';
import 'reactflow/dist/style.css';

import { useWorkflowStore, useHistoryStore } from '../store/useWorkflowStore';
import { useWorkflowHistory } from '../hooks/useWorkflowHistory';
import { UndoRedo } from './UndoRedo';
import { Toolbar } from './Toolbar';
import { ZoomControls } from './ZoomControls';
import { ControlMode } from '../types';
import { workflowNodeTypes } from './nodes';
import { workflowEdgeTypes } from './edges';
import { NodeConfigPanel } from './panels';
import { createWorkflowNode } from './nodeFactory';

const WorkflowCanvasInner = memo(() => {
  const { nodes, edges, setNodes, setEdges, controlMode } = useWorkflowStore();
  const { saveStateToHistory } = useWorkflowHistory();
  const { saveSnapshot } = useHistoryStore();
  const dragStartPositionRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const wrapperRef = useRef<HTMLDivElement>(null);
  const reactFlowInstance = useReactFlow();

  // 初始化：在第一次有节点时保存快照
  const hasInitializedRef = useRef(false);
  useEffect(() => {
    if (nodes.length > 0 && !hasInitializedRef.current) {
      hasInitializedRef.current = true;
      // 延迟保存，确保节点已经完全渲染
      setTimeout(() => {
        saveSnapshot(nodes, edges);
      }, 100);
    }
  }, [nodes, edges, saveSnapshot]);

  const onNodesChange = useCallback(
    (changes: NodeChange[]) => {
      setNodes((nds) => applyNodeChanges(changes, nds));
    },
    [setNodes]
  );

  const onEdgesChange = useCallback(
    (changes: EdgeChange[]) => {
      setEdges((eds) => applyEdgeChanges(changes, eds));
    },
    [setEdges]
  );

  const onConnect = useCallback(
    (connection: Connection) => {
      setEdges((eds) => addEdge(connection, eds));
      // 添加连线后保存快照
      setTimeout(() => saveStateToHistory(), 0);
    },
    [setEdges, saveStateToHistory]
  );

  // 拖拽开始：记录初始位置
  const onNodeDragStart: NodeDragHandler = useCallback((_, node) => {
    dragStartPositionRef.current = { x: node.position.x, y: node.position.y };
  }, []);

  // 拖拽结束：保存快照
  const onNodeDragStop: NodeDragHandler = useCallback(
    (_, node) => {
      const { x, y } = dragStartPositionRef.current;
      // 只有真正移动了才保存快照
      if (x !== node.position.x || y !== node.position.y) {
        saveStateToHistory();
      }
    },
    [saveStateToHistory]
  );

  const onDragOver = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
  }, []);

  const onDrop = useCallback(
    (event: React.DragEvent) => {
      event.preventDefault();
      const reactFlowBounds = wrapperRef.current?.getBoundingClientRect();
      if (!reactFlowBounds) return;

      const raw = event.dataTransfer.getData('application/reactflow');
      if (!raw) return;

      let payload: { type: string; meta?: { title: string; desc?: string } };
      try {
        payload = JSON.parse(raw);
      } catch {
        return;
      }

      const position = reactFlowInstance.project({
        x: event.clientX - reactFlowBounds.left,
        y: event.clientY - reactFlowBounds.top,
      });

      const newNode = createWorkflowNode(payload.type, payload.meta || { title: '新节点' }, nodes.length, position);
      setNodes((prev) => [...prev, newNode]);
      setTimeout(() => saveStateToHistory(), 0);
    },
    [nodes.length, reactFlowInstance, setNodes, saveStateToHistory]
  );

  return (
    <div className="relative h-full w-full" ref={wrapperRef}>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        nodeTypes={workflowNodeTypes}
        edgeTypes={workflowEdgeTypes}
        defaultEdgeOptions={{
          type: 'workflow-edge',
        }}
        defaultViewport={{ x: 0, y: 0, zoom: 1 }}
        fitViewOptions={{ maxZoom: 1 }}
        onDrop={onDrop}
        onDragOver={onDragOver}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onNodeDragStart={onNodeDragStart}
        onNodeDragStop={onNodeDragStop}
        fitView
        // 根据控制模式切换拖动行为
        panOnDrag={controlMode === ControlMode.Hand}
        selectionOnDrag={controlMode === ControlMode.Pointer}
        // 样式配置
        className="bg-neutral-50"
      >
        <Background
          variant={BackgroundVariant.Dots}
          gap={16}
          size={1}
          color="#e5e5e5"
        />

        {/* 右下角缩略图 */}
        <MiniMap
          className="!absolute !bottom-4 !right-4 !m-0 !rounded-lg !border !border-neutral-200 !shadow-lg"
          nodeColor="#3b82f6"
          maskColor="rgba(0, 0, 0, 0.1)"
        />
      </ReactFlow>

      {/* 左下角：撤销/重做 */}
      <div className="absolute bottom-4 left-4 z-10">
        <UndoRedo />
      </div>

      {/* 左侧：工具栏 */}
      <div className="absolute left-4 top-1/2 z-10 -translate-y-1/2">
        <Toolbar />
      </div>

      {/* 右下角：缩放控制（在缩略图下方） */}
      <div className="absolute bottom-[180px] right-4 z-10">
        <ZoomControls />
      </div>

      {/* 右侧：节点配置面板（简化版，后续接入表单/保存） */}
      <NodeConfigPanel />
    </div>
  );
});

WorkflowCanvasInner.displayName = 'WorkflowCanvasInner';

/**
 * 带 Provider 的导出组件
 */
export const WorkflowCanvas = memo(() => {
  return (
    <ReactFlowProvider>
      <WorkflowCanvasInner />
    </ReactFlowProvider>
  );
});

WorkflowCanvas.displayName = 'WorkflowCanvas';
