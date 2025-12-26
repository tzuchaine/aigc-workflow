import { memo, useMemo } from 'react';
import { HelpCircle, Play, X } from 'lucide-react';
import type { Node } from 'reactflow';
import type { WorkflowNodeData, WorkflowNodeStatusT } from '../../types';
import { useWorkflowStore } from '../../store/useWorkflowStore';
import { cn } from '../../../../utils/cn';
import { Tooltip } from '../Tooltip';

const STATUS_TOKEN: Record<WorkflowNodeStatusT, { label: string; className: string }> = {
  idle: { label: '待执行', className: 'border border-neutral-200 bg-neutral-50 text-neutral-600' },
  queued: { label: '排队中', className: 'border border-amber-200 bg-amber-50 text-amber-600' },
  running: { label: '运行中', className: 'border border-sky-200 bg-sky-50 text-sky-600' },
  succeeded: { label: '已完成', className: 'border border-emerald-200 bg-emerald-50 text-emerald-600' },
  failed: { label: '失败', className: 'border border-rose-200 bg-rose-50 text-rose-600' },
  canceled: { label: '已取消', className: 'border border-slate-200 bg-slate-50 text-slate-500' },
};

export const NodeConfigPanel = memo(() => {
  const { nodes, setNodes } = useWorkflowStore();

  const selectedNode = useMemo<Node<WorkflowNodeData> | undefined>(
    () => nodes.find((n) => n.selected),
    [nodes]
  );

  const runtime = selectedNode?.data?.runtime;
  const status = runtime?.status ?? 'idle';
  const statusToken = STATUS_TOKEN[status] ?? STATUS_TOKEN.idle;

  const clearSelection = () => {
    setNodes((prev) => prev.map((n) => ({ ...n, selected: false })));
  };

  return (
    <div className="absolute right-4 top-4 bottom-4 z-10 w-[380px] rounded-2xl border-[0.5px] border-components-panel-border bg-components-panel-bg shadow-lg backdrop-blur-[6px]">
      {!selectedNode ? (
        <div className="flex h-full items-center justify-center p-6 text-sm text-neutral-500">
          选择节点以编辑配置
        </div>
      ) : (
        <div className="flex h-full flex-col">
          <div className="sticky top-0 z-10 border-b-[0.5px] border-components-panel-border bg-components-panel-bg">
            <div className="flex items-center gap-3 px-4 pb-2 pt-4">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-neutral-100 text-sm font-semibold text-neutral-700">
                {selectedNode.data.type?.slice(0, 2)?.toUpperCase() || 'ND'}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <div className="truncate text-base font-semibold text-neutral-900">
                    {selectedNode.data.title || '未命名节点'}
                  </div>
                  {selectedNode.type ? (
                    <span className="shrink-0 rounded-full border border-neutral-200 bg-neutral-50 px-2 py-[2px] text-[11px] text-neutral-600">
                      {selectedNode.type}
                    </span>
                  ) : null}
                </div>
                <div className="mt-1 flex items-center gap-2">
                  <span
                    className={cn(
                      'inline-flex items-center rounded-full px-2 py-[2px] text-[11px] font-medium',
                      statusToken.className
                    )}
                  >
                    {statusToken.label}
                  </span>
                </div>
              </div>
              <div className="flex shrink-0 items-center gap-1 text-text-tertiary">
                <Tooltip title="运行此节点">
                  <button
                    type="button"
                    className="flex h-7 w-7 items-center justify-center rounded-md hover:bg-state-base-hover"
                    onClick={() => console.log('单步运行（待实现）')}
                  >
                    <Play className="h-4 w-4" />
                  </button>
                </Tooltip>
                <Tooltip title="帮助">
                  <button
                    type="button"
                    className="flex h-7 w-7 items-center justify-center rounded-md hover:bg-state-base-hover"
                    onClick={() => console.log('查看帮助（待实现）')}
                  >
                    <HelpCircle className="h-4 w-4" />
                  </button>
                </Tooltip>
                <div className="mx-1 h-3.5 w-[1px] bg-divider-regular" />
                <Tooltip title="关闭面板">
                  <button
                    type="button"
                    className="flex h-7 w-7 items-center justify-center rounded-md hover:bg-state-base-hover"
                    onClick={clearSelection}
                  >
                    <X className="h-4 w-4" />
                  </button>
                </Tooltip>
              </div>
            </div>
          </div>

          <div className="flex-1 overflow-auto px-4 py-3">
            <div className="rounded-lg border border-dashed border-components-panel-border bg-white/60 p-4 text-sm text-neutral-500">
              表单渲染 TODO：待接入 schema 驱动的表单组件，当前为占位。
            </div>
          </div>

          <div className="sticky bottom-0 flex items-center justify-end gap-2 border-t border-components-panel-border bg-components-panel-bg px-4 py-3 backdrop-blur-[6px]">
            <button
              type="button"
              className="rounded-md border border-neutral-200 px-3 py-2 text-sm text-neutral-700 hover:bg-neutral-50"
              onClick={() => {
                // TODO: 恢复表单到上次保存状态
                console.log('取消（待实现：表单恢复）');
              }}
            >
              取消
            </button>
            <button
              type="button"
              className="rounded-md bg-blue-600 px-3 py-2 text-sm font-medium text-white shadow hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
              disabled
              onClick={() => {
                // TODO: 提交表单并写回节点 data
                console.log('保存（待实现：表单提交）');
              }}
            >
              保存（待接入）
            </button>
          </div>
        </div>
      )}
    </div>
  );
});

NodeConfigPanel.displayName = 'NodeConfigPanel';
