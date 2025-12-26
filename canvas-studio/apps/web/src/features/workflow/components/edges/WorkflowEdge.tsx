import { memo, useMemo } from 'react';
import {
  BaseEdge,
  EdgeLabelRenderer,
  getSmoothStepPath,
  MarkerType,
  type EdgeProps,
} from 'reactflow';
import { cn } from '../../../../utils/cn';
import type { WorkflowEdgeData } from '../../types';

const MODE_COLOR: Record<string, string> = {
  auto: '#94a3b8', // slate-400
  manual: '#c084fc', // violet-400
};

export const WorkflowEdge = memo(({ id, sourceX, sourceY, targetX, targetY, sourcePosition, targetPosition, data, selected, markerEnd, style }: EdgeProps<WorkflowEdgeData>) => {
  const [edgePath, labelX, labelY] = useMemo(
    () => getSmoothStepPath({ sourceX, sourceY, targetX, targetY, sourcePosition, targetPosition }),
    [sourceX, sourceY, targetX, targetY, sourcePosition, targetPosition]
  );

  const mode = data?.mode ?? 'auto';
  const stroke = selected ? '#38bdf8' : MODE_COLOR[mode] ?? '#cfd4dc';

  const pillLabel = data?.label ?? (mode === 'manual' ? '手动' : '自动');

  return (
    <>
      <BaseEdge
        id={id}
        path={edgePath}
        markerEnd={
          markerEnd ?? {
            type: MarkerType.ArrowClosed,
            color: stroke,
            width: 16,
            height: 16,
          }
        }
        style={{
          stroke,
          strokeWidth: selected ? 2.5 : 1.5,
          transition: 'stroke 0.2s ease, stroke-width 0.2s ease',
          ...style,
        }}
      />
      <EdgeLabelRenderer>
        <div
          className={cn(
            'pointer-events-auto select-none rounded-full border border-components-panel-border bg-white/90 px-2 py-[2px] text-[11px] text-text-secondary shadow-sm backdrop-blur-[2px]',
            'translate-x-[-50%] translate-y-[-50%]'
          )}
          style={{
            position: 'absolute',
            transform: `translate(-50%, -50%)`,
            left: labelX,
            top: labelY,
          }}
        >
          {pillLabel}
        </div>
      </EdgeLabelRenderer>
    </>
  );
});

WorkflowEdge.displayName = 'WorkflowEdge';
