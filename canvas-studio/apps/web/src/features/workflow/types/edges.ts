/**
 * 边的运行模式
 */
export const EdgeMode = {
  Auto: 'auto',
  Manual: 'manual',
} as const;

export type EdgeModeT = (typeof EdgeMode)[keyof typeof EdgeMode];

/**
 * 边的数据结构
 */
export type WorkflowEdgeData = {
  mode?: EdgeModeT;
  label?: string;
};
