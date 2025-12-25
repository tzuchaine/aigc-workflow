/**
 * 自动布局 Hook
 * 使用 dagre 算法自动整理节点布局
 */

import { useCallback } from 'react';
import dagre from 'dagre';
import type { Node, Edge } from 'reactflow';
import { useWorkflowStore } from '../store/useWorkflowStore';
import { useWorkflowHistory } from './useWorkflowHistory';

// 布局配置
const LAYOUT_CONFIG = {
  rankdir: 'LR', // 从左到右布局 (LR) 或从上到下 (TB)
  nodesep: 80, // 节点水平间距
  ranksep: 120, // 层级垂直间距
  align: 'UL', // 对齐方式
} as const;

// 默认节点尺寸
const DEFAULT_NODE_SIZE = {
  width: 240,
  height: 100,
};

/**
 * 使用 dagre 计算节点布局
 */
export const useAutoLayout = () => {
  const { nodes, edges, setNodes } = useWorkflowStore();
  const { saveStateToHistory } = useWorkflowHistory();

  const organizeLayout = useCallback(() => {
    if (nodes.length === 0) return;

    // 创建 dagre 图
    const dagreGraph = new dagre.graphlib.Graph();
    dagreGraph.setDefaultEdgeLabel(() => ({}));
    dagreGraph.setGraph(LAYOUT_CONFIG);

    // 添加节点到 dagre 图
    nodes.forEach((node) => {
      dagreGraph.setNode(node.id, {
        width: node.width ?? DEFAULT_NODE_SIZE.width,
        height: node.height ?? DEFAULT_NODE_SIZE.height,
      });
    });

    // 添加边到 dagre 图
    edges.forEach((edge) => {
      dagreGraph.setEdge(edge.source, edge.target);
    });

    // 执行布局计算
    dagre.layout(dagreGraph);

    // 更新节点位置
    const layoutedNodes: Node[] = nodes.map((node) => {
      const nodeWithPosition = dagreGraph.node(node.id);

      // dagre 返回的是节点中心点坐标，需要转换为左上角坐标
      const x = nodeWithPosition.x - (node.width ?? DEFAULT_NODE_SIZE.width) / 2;
      const y = nodeWithPosition.y - (node.height ?? DEFAULT_NODE_SIZE.height) / 2;

      return {
        ...node,
        position: { x, y },
      };
    });

    setNodes(layoutedNodes);

    // 保存到历史
    setTimeout(() => saveStateToHistory(), 0);
  }, [nodes, edges, setNodes, saveStateToHistory]);

  return {
    organizeLayout,
  };
};
