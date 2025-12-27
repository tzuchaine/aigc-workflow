/**
 * Workflow 画布主组件
 * 集成所有工具栏和控制面板
 */

import { memo, useCallback, useEffect, useRef } from 'react';
import ReactFlow, {
  Background,
  MiniMap,
  type Node,
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
  ConnectionLineType,
} from 'reactflow';
import 'reactflow/dist/style.css';

import { useWorkflowStore, useHistoryStore } from '../store/useWorkflowStore';
import { useWorkflowHistory } from '../hooks/useWorkflowHistory';
import { UndoRedo } from './UndoRedo';
import { Toolbar } from './Toolbar';
import { ZoomControls } from './ZoomControls';
import { ControlMode, type WorkflowNodeData } from '../types';
import { workflowNodeTypes } from './nodes';
import { workflowEdgeTypes } from './edges';
import { NodeConfigPanel } from './panels';
import { createWorkflowNode } from './nodeFactory';

const WorkflowCanvasInner = memo(() => {
  const { nodes, edges, setNodes, setEdges, controlMode } = useWorkflowStore();
  const { saveStateToHistory } = useWorkflowHistory();
  const { saveSnapshot } = useHistoryStore();
  const dragStartPositionRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const hasDraggedRef = useRef(false); // 是否真正发生了拖动（移动距离超过阈值）
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
      // 过滤掉选中状态的变更，由 onNodeClick 手动控制
      const filteredChanges = changes.filter((change) => {
        if (change.type === 'select') {
          return false;
        }
        return true;
      });
      setNodes((nds) => applyNodeChanges(filteredChanges, nds));
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
      setEdges((eds) => addEdge({ ...connection, type: 'workflow-edge' }, eds));
      // 添加连线后保存快照
      setTimeout(() => saveStateToHistory(), 0);
    },
    [setEdges, saveStateToHistory]
  );

  // 拖拽开始：记录初始位置，重置拖动标记
  const onNodeDragStart: NodeDragHandler = useCallback((_, node) => {
    hasDraggedRef.current = false;
    dragStartPositionRef.current = { x: node.position.x, y: node.position.y };
  }, []);

  // 拖拽结束：检查是否真的移动了，保存快照
  const onNodeDragStop: NodeDragHandler = useCallback(
    (_, node) => {
      const { x, y } = dragStartPositionRef.current;
      const hasMoved = x !== node.position.x || y !== node.position.y;

      // 标记是否发生了真正的拖动
      hasDraggedRef.current = hasMoved;

      // 只有真正移动了才保存快照
      if (hasMoved) {
        saveStateToHistory();
      }
    },
    [saveStateToHistory]
  );

  // 节点点击：仅在非拖动状态下选中节点
  const onNodeClick = useCallback(
    (event: React.MouseEvent, clickedNode: Node<WorkflowNodeData>) => {
      // 如果刚刚发生了拖动，不触发选中
      if (hasDraggedRef.current) {
        hasDraggedRef.current = false; // 重置标记
        return;
      }

      // 检查是否点击了标记为 data-no-select 的元素（如按钮、蒙层等）
      const target = event.target as HTMLElement;
      if (target.closest('[data-no-select="true"]')) {
        return;
      }

      // 否则正常切换选中状态
      setNodes((prevNodes) => {
        return prevNodes.map((n) => {
          if (n.id === clickedNode.id) {
            return { ...n, selected: !n.selected };
          }
          return { ...n, selected: false };
        });
      });
    },
    [setNodes]
  );

  // 更新节点数据（供子组件调用）
  const updateNodeData = useCallback(
    (nodeId: string, data: Partial<WorkflowNodeData>) => {
      setNodes((nds) =>
        nds.map((node) => {
          if (node.id === nodeId) {
            return { ...node, data: { ...node.data, ...data } };
          }
          return node;
        })
      );
    },
    [setNodes]
  );

  // 暴露 updateNodeData 方法到全局（供子组件访问）
  useEffect(() => {
    (window as { __updateNodeData?: (id: string, data: Partial<WorkflowNodeData>) => void }).__updateNodeData = updateNodeData;
    return () => {
      delete (window as { __updateNodeData?: (id: string, data: Partial<WorkflowNodeData>) => void }).__updateNodeData;
    };
  }, [updateNodeData]);

  const onDragOver = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
  }, []);

  const onDrop = useCallback(
    (event: React.DragEvent) => {
      event.preventDefault();
      const reactFlowBounds = wrapperRef.current?.getBoundingClientRect();
      if (!reactFlowBounds) return;

      // 计算鼠标在画布中的位置（考虑缩放和平移）
      const position = reactFlowInstance.project({
        x: event.clientX - reactFlowBounds.left,
        y: event.clientY - reactFlowBounds.top,
      });

      // 创建节点时，将位置偏移以节点中心为锚点（假设节点宽度约280px，高度约120px）
      const centeredPosition = {
        x: position.x - 140, // 宽度的一半
        y: position.y - 60,  // 高度的一半
      };

      // 优先处理节点类型拖拽
      const nodeTypeData = event.dataTransfer.getData('application/reactflow');
      if (nodeTypeData) {
        let payload: { type: string; meta?: { title: string; desc?: string } };
        try {
          payload = JSON.parse(nodeTypeData);
          const newNode = createWorkflowNode(payload.type, payload.meta || { title: '新节点' }, nodes.length, centeredPosition);
          setNodes((prev) => [...prev, newNode]);
          setTimeout(() => saveStateToHistory(), 0);
          return;
        } catch {
          // 继续处理其他类型
        }
      }

      // 处理图片文件拖拽（从文件系统拖入）
      const files = event.dataTransfer.files;
      if (files && files.length > 0) {
        const imageFiles = Array.from(files).filter((file) => file.type.startsWith('image/'));
        if (imageFiles.length > 0) {
          // 创建图片预览节点
          const images = imageFiles.map((file) => ({
            id: `local-${Date.now()}-${Math.random()}`,
            url: URL.createObjectURL(file),
            createdAt: new Date().toISOString(),
          }));

          const newNode = createWorkflowNode(
            'image-preview',
            { title: '图片展示', desc: '手动上传' },
            nodes.length,
            centeredPosition
          );
          newNode.data = {
            ...newNode.data,
            runtime: {
              status: 'idle',
              output: { images },
            },
          };
          setNodes((prev) => [...prev, newNode]);
          setTimeout(() => saveStateToHistory(), 0);
          return;
        }
      }

      // 处理从节点内拖出的图片（用于创建新节点）
      const imageData = event.dataTransfer.getData('application/workflow-image');
      if (imageData) {
        try {
          const image = JSON.parse(imageData);
          const newNode = createWorkflowNode(
            'image-preview',
            { title: '图片展示', desc: '拖拽创建' },
            nodes.length,
            centeredPosition
          );
          newNode.data = {
            ...newNode.data,
            runtime: {
              status: 'idle',
              output: { images: [image] },
            },
          };
          setNodes((prev) => [...prev, newNode]);
          setTimeout(() => saveStateToHistory(), 0);
        } catch {
          // 忽略解析错误
        }
      }
    },
    [nodes.length, reactFlowInstance, setNodes, saveStateToHistory]
  );

  // 监听全局粘贴事件（Ctrl+V）
  useEffect(() => {
    const handlePaste = (event: ClipboardEvent) => {
      const items = event.clipboardData?.items;
      if (!items) return;

      const imageItems = Array.from(items).filter((item) => item.type.startsWith('image/'));
      if (imageItems.length === 0) return;

      event.preventDefault();

      // 获取画布中心位置（作为粘贴位置）
      const bounds = wrapperRef.current?.getBoundingClientRect();
      if (!bounds) return;

      const centerPosition = reactFlowInstance.project({
        x: bounds.width / 2,
        y: bounds.height / 2,
      });

      // 处理粘贴的图片
      imageItems.forEach((item, index) => {
        const file = item.getAsFile();
        if (!file) return;

        const blobUrl = URL.createObjectURL(file);
        const image = {
          id: `paste-${Date.now()}-${Math.random()}`,
          url: blobUrl,
          createdAt: new Date().toISOString(),
        };

        // 创建节点，每个节点稍微错开位置
        const offset = index * 30;
        const newNode = createWorkflowNode(
          'image-preview',
          { title: '图片展示', desc: '粘贴创建' },
          nodes.length + index,
          {
            x: centerPosition.x - 140 + offset,
            y: centerPosition.y - 60 + offset,
          }
        );
        newNode.data = {
          ...newNode.data,
          runtime: {
            status: 'idle',
            output: { images: [image] },
          },
        };

        setNodes((prev) => [...prev, newNode]);
      });

      setTimeout(() => saveStateToHistory(), 0);
    };

    window.addEventListener('paste', handlePaste);
    return () => {
      window.removeEventListener('paste', handlePaste);
    };
  }, [nodes.length, reactFlowInstance, setNodes, saveStateToHistory]);

  return (
    <div className="relative h-full w-full overflow-hidden" ref={wrapperRef}>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        nodeTypes={workflowNodeTypes}
        edgeTypes={workflowEdgeTypes}
        defaultEdgeOptions={{
          type: 'workflow-edge',
        }}
        connectionLineType={ConnectionLineType.Bezier}
        defaultViewport={{ x: 0, y: 0, zoom: 1 }}
        fitViewOptions={{ maxZoom: 1 }}
        onDrop={onDrop}
        onDragOver={onDragOver}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onNodeClick={onNodeClick}
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
