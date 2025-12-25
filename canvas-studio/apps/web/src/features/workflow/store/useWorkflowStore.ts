/**
 * Workflow 状态管理 Store
 * 使用独立的 history store，手动控制快照创建（参考 Dify）
 */

import type { Edge, Node } from 'reactflow';
import { temporal } from 'zundo';
import { create } from 'zustand';
import type { WorkflowHistoryEventMeta, WorkflowHistoryEventT } from '../types';
import { ControlMode } from '../types';

/**
 * 工作流状态定义
 */
export type WorkflowState = {
  // ReactFlow 核心状态
  nodes: Node[];
  edges: Edge[];

  // 控制模式
  controlMode: ControlMode;

  // 画布最大化状态
  maximizeCanvas: boolean;

  // 快捷键启用状态
  shortcutsEnabled: boolean;
};

/**
 * 工作流操作方法
 */
export type WorkflowActions = {
  // 节点/边操作
  setNodes: (nodes: Node[] | ((prev: Node[]) => Node[])) => void;
  setEdges: (edges: Edge[] | ((prev: Edge[]) => Edge[])) => void;

  // 控制模式切换
  setControlMode: (mode: ControlMode) => void;

  // 画布最大化
  toggleMaximizeCanvas: () => void;

  // 快捷键控制
  setShortcutsEnabled: (enabled: boolean) => void;
};

/**
 * 主 Workflow Store（不包含历史记录）
 */
export const useWorkflowStore = create<WorkflowState & WorkflowActions>((set) => ({
  // 初始状态
  nodes: [],
  edges: [],
  controlMode: ControlMode.Pointer,
  maximizeCanvas: false,
  shortcutsEnabled: true,

  // 操作方法
  setNodes: (nodesOrUpdater) => {
    set((state) => ({
      nodes:
        typeof nodesOrUpdater === 'function' ? nodesOrUpdater(state.nodes) : nodesOrUpdater,
    }));
  },

  setEdges: (edgesOrUpdater) => {
    set((state) => ({
      edges:
        typeof edgesOrUpdater === 'function' ? edgesOrUpdater(state.edges) : edgesOrUpdater,
    }));
  },

  setControlMode: (mode) => set({ controlMode: mode }),

  toggleMaximizeCanvas: () => set((state) => ({ maximizeCanvas: !state.maximizeCanvas })),

  setShortcutsEnabled: (enabled) => set({ shortcutsEnabled: enabled }),
}));

/**
 * 历史记录状态
 */
type HistoryState = {
  nodes: Node[];
  edges: Edge[];
  workflowHistoryEvent: WorkflowHistoryEventT | undefined;
  workflowHistoryEventMeta: WorkflowHistoryEventMeta | undefined;
};

type HistoryActions = {
  saveSnapshot: (
    nodes: Node[],
    edges: Edge[],
    event?: WorkflowHistoryEventT,
    meta?: WorkflowHistoryEventMeta
  ) => void;
};

/**
 * 独立的历史记录 Store（使用 temporal）
 */
export const useHistoryStore = create<HistoryState & HistoryActions>()(
  temporal(
    (set) => ({
      nodes: [],
      edges: [],
      workflowHistoryEvent: undefined,
      workflowHistoryEventMeta: undefined,

      // 手动保存快照
      saveSnapshot: (nodes, edges, event, meta) => {
        set({
          nodes: nodes.map((node) => ({ ...node, selected: false, dragging: false })),
          edges: edges.map((edge) => ({ ...edge, selected: false })),
          workflowHistoryEvent: event,
          workflowHistoryEventMeta: meta,
        });
      },
    }),
    {
      limit: 50,
      equality: (past, current) => {
        return JSON.stringify(past) === JSON.stringify(current);
      },
    }
  )
);

/**
 * 使用 temporal store 访问撤销/重做功能
 */
export const useTemporalStore = () => useHistoryStore.temporal.getState();
