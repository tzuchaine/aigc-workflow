/**
 * 工作流历史记录 Hook
 * 提供撤销/重做功能和历史事件保存
 */

import { useCallback } from 'react';
import {
  useWorkflowStore,
  useHistoryStore,
  useTemporalStore,
} from '../store/useWorkflowStore';

export const useWorkflowHistory = () => {
  const { nodes, edges, setNodes, setEdges, shortcutsEnabled } = useWorkflowStore();
  const { saveSnapshot } = useHistoryStore();

  /**
   * 撤销操作
   */
  const undo = useCallback(() => {
    const temporal = useTemporalStore();
    if (temporal.pastStates.length > 0) {
      temporal.undo();
      // 将历史状态同步回主 store
      const historyState = useHistoryStore.getState();
      setNodes(historyState.nodes);
      setEdges(historyState.edges);
    }
  }, [setNodes, setEdges]);

  /**
   * 重做操作
   */
  const redo = useCallback(() => {
    const temporal = useTemporalStore();
    if (temporal.futureStates.length > 0) {
      temporal.redo();
      // 将历史状态同步回主 store
      const historyState = useHistoryStore.getState();
      setNodes(historyState.nodes);
      setEdges(historyState.edges);
    }
  }, [setNodes, setEdges]);

  /**
   * 手动保存快照
   */
  const saveStateToHistory = useCallback(() => {
    const currentNodes = useWorkflowStore.getState().nodes;
    const currentEdges = useWorkflowStore.getState().edges;
    saveSnapshot(currentNodes, currentEdges);
  }, [saveSnapshot]);

  /**
   * 获取是否可以撤销/重做
   */
  const canUndo = () => {
    const temporal = useTemporalStore();
    return temporal.pastStates.length > 0;
  };

  const canRedo = () => {
    const temporal = useTemporalStore();
    return temporal.futureStates.length > 0;
  };

  /**
   * 获取历史事件的可读标签
   */
  const getHistoryLabel = useCallback((event: string): string => {
    const labels: Record<string, string> = {
      NodeAdd: '添加节点',
      NodeDelete: '删除节点',
      NodeChange: '修改节点',
      NodeDragStop: '移动节点',
      EdgeAdd: '添加连线',
      EdgeDelete: '删除连线',
      NoteAdd: '添加注释',
      NoteChange: '修改注释',
      NoteDelete: '删除注释',
      LayoutOrganize: '整理布局',
    };
    return labels[event] || '操作';
  }, []);

  return {
    undo,
    redo,
    canUndo,
    canRedo,
    saveStateToHistory,
    getHistoryLabel,
    shortcutsEnabled,
  };
};
