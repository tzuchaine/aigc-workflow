/**
 * Workflow 类型定义
 */

// 控制模式枚举
export enum ControlMode {
  Pointer = 'pointer', // 指针模式（选择/移动节点）
  Hand = 'hand',       // 手掌模式（拖动画布）
}

// 工作流历史事件类型
export const WorkflowHistoryEvent = {
  NodeAdd: 'NodeAdd',
  NodeDelete: 'NodeDelete',
  NodeChange: 'NodeChange',
  NodeDragStop: 'NodeDragStop',
  EdgeAdd: 'EdgeAdd',
  EdgeDelete: 'EdgeDelete',
  NoteAdd: 'NoteAdd',
  NoteChange: 'NoteChange',
  NoteDelete: 'NoteDelete',
  LayoutOrganize: 'LayoutOrganize',
} as const;

export type WorkflowHistoryEventT = keyof typeof WorkflowHistoryEvent;

// 工作流历史事件元数据
export type WorkflowHistoryEventMeta = {
  nodeId?: string;
  nodeTitle?: string;
  nodeType?: string;
};

export * from './nodes';
export * from './edges';
