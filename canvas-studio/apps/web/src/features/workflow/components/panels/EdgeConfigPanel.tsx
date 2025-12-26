import { memo } from 'react';
import type { Edge } from 'reactflow';
import type { WorkflowEdgeData } from '../../types';

export type EdgeConfigPanelProps = {
  edge?: Edge<WorkflowEdgeData>;
};

export const EdgeConfigPanel = memo(({ edge }: EdgeConfigPanelProps) => {
  if (!edge) {
    return (
      <div className="rounded-lg border border-dashed border-components-panel-border bg-white/60 p-4 text-sm text-neutral-500">
        选择边以编辑配置
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      <div>
        <div className="text-sm font-semibold text-neutral-800">触发模式</div>
        <div className="mt-1 text-xs text-neutral-500">配置 auto/manual 模式</div>
      </div>
      <div className="rounded-lg border border-components-panel-border bg-white p-3 text-sm text-neutral-700">
        TODO：待接入真实字段（trigger_mode / trigger_policy）
      </div>
    </div>
  );
});

EdgeConfigPanel.displayName = 'EdgeConfigPanel';
