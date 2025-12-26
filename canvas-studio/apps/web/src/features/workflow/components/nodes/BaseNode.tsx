import { memo } from 'react';
import { Handle, Position, type NodeProps } from 'reactflow';
import { cn } from '@/utils/cn';
import type {
  WorkflowNodeData,
  WorkflowNodePort,
  WorkflowNodeStatusT,
} from '../../types';

type StatusToken = {
  label: string;
  className: string;
  dotClassName: string;
};

const STATUS_TOKENS: Record<WorkflowNodeStatusT, StatusToken> = {
  idle: {
    label: '待执行',
    className: 'border border-neutral-200 bg-neutral-50 text-neutral-600',
    dotClassName: 'bg-neutral-300',
  },
  queued: {
    label: '排队中',
    className: 'border border-amber-200 bg-amber-50 text-amber-600',
    dotClassName: 'bg-amber-400',
  },
  running: {
    label: '运行中',
    className: 'border border-sky-200 bg-sky-50 text-sky-600',
    dotClassName: 'bg-sky-400',
  },
  succeeded: {
    label: '已完成',
    className: 'border border-emerald-200 bg-emerald-50 text-emerald-600',
    dotClassName: 'bg-emerald-400',
  },
  failed: {
    label: '失败',
    className: 'border border-rose-200 bg-rose-50 text-rose-600',
    dotClassName: 'bg-rose-400',
  },
  canceled: {
    label: '已取消',
    className: 'border border-slate-200 bg-slate-50 text-slate-500',
    dotClassName: 'bg-slate-400',
  },
};

const progressSafe = (value?: number) => {
  if (typeof value !== 'number') return undefined;
  if (Number.isNaN(value)) return undefined;
  return Math.min(100, Math.max(0, value));
};

const Ports = ({
  inputs = [],
  outputs = [],
}: {
  inputs?: WorkflowNodePort[];
  outputs?: WorkflowNodePort[];
}) => {
  return (
    <div className="mt-3 grid grid-cols-2 gap-2 text-xs text-neutral-500">
      <div className="flex flex-col gap-1">
        {inputs.map((input) => (
          <div key={input.id} className="relative flex items-center gap-2 rounded-md">
            <Handle
              type="target"
              id={input.id}
              position={Position.Left}
              className="!h-3 !w-3 !-left-2 !border !border-neutral-300 !bg-white hover:!border-sky-400"
            />
            <span className="truncate">{input.label}</span>
          </div>
        ))}
      </div>
      <div className="flex flex-col items-end gap-1 text-right">
        {outputs.map((output) => (
          <div key={output.id} className="relative flex items-center gap-2 rounded-md">
            <span className="truncate">{output.label}</span>
            <Handle
              type="source"
              id={output.id}
              position={Position.Right}
              className="!h-3 !w-3 !-right-2 !border !border-neutral-300 !bg-white hover:!border-sky-400"
            />
          </div>
        ))}
      </div>
    </div>
  );
};

export const BaseNode = memo(
  ({ data, selected }: NodeProps<WorkflowNodeData>) => {
    const status = data.runtime?.status ?? 'idle';
    const statusToken = STATUS_TOKENS[status] ?? STATUS_TOKENS.idle;
    const progress = progressSafe(data.runtime?.progress);

    return (
      <div
        data-selected={selected}
        className={cn(
          'group relative w-[240px] rounded-xl border border-neutral-200 bg-white p-3 shadow-sm transition hover:shadow-md',
          'data-[selected=true]:border-sky-400 data-[selected=true]:shadow-lg'
        )}
      >
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="flex items-center gap-1.5">
              <span className={cn('h-2.5 w-2.5 shrink-0 rounded-full', statusToken.dotClassName)} />
              <div className="truncate text-sm font-semibold text-neutral-900">{data.title}</div>
            </div>
            {data.subtitle ? (
              <div className="mt-1 truncate text-xs text-neutral-500">{data.subtitle}</div>
            ) : null}
          </div>
          <span
            className={cn(
              'shrink-0 rounded-full px-2 py-0.5 text-[11px] font-medium leading-none',
              statusToken.className
            )}
          >
            {statusToken.label}
          </span>
        </div>

        {progress !== undefined ? (
          <div className="mt-3">
            <div className="h-1.5 w-full overflow-hidden rounded-full bg-neutral-100">
              <div
                className="h-full rounded-full bg-sky-500 transition-[width]"
                style={{ width: `${progress}%` }}
              />
            </div>
            <div className="mt-1 text-right text-[11px] text-neutral-500">{progress}%</div>
          </div>
        ) : null}

        {status === 'failed' && data.runtime?.message ? (
          <div className="mt-2 rounded-md border border-rose-200 bg-rose-50 px-2 py-1 text-xs text-rose-700">
            {data.runtime.message}
          </div>
        ) : null}

        <Ports inputs={data.inputs} outputs={data.outputs} />
      </div>
    );
  }
);

BaseNode.displayName = 'BaseNode';
