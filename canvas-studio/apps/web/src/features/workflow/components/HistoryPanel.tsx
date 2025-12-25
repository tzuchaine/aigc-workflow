/**
 * 历史记录面板
 * 参考 Dify 的 view-workflow-history.tsx 实现
 */

import { memo, useState, useCallback, useMemo } from 'react';
import { History, X } from 'lucide-react';
import { useHistoryStore, useWorkflowStore, useTemporalStore } from '../store/useWorkflowStore';
import { useWorkflowHistory } from '../hooks/useWorkflowHistory';
import { Divider } from './Divider';
import { cn } from '../../../utils/cn';
import {
  PortalToFollowElem,
  PortalToFollowElemContent,
  PortalToFollowElemTrigger,
} from '../../../components/PortalToFollowElem';

type HistoryEntry = {
  label: string;
  index: number; // 相对于当前状态的偏移
  timestamp?: string;
};

type HistoryState = {
  nodes: any[];
  edges: any[];
  workflowHistoryEvent?: string;
  workflowHistoryEventMeta?: any;
};

export const HistoryPanel = memo(() => {
  const [open, setOpen] = useState(false);
  const { setNodes, setEdges } = useWorkflowStore();
  const { getHistoryLabel } = useWorkflowHistory();

  const { pastStates, futureStates, undo, redo, clear } = useTemporalStore();

  const handleJumpToState = useCallback(
    (index: number) => {
      if (index === 0) return;

      if (index < 0) {
        // 跳转到过去的状态
        undo(index * -1);
      } else {
        // 跳转到未来的状态
        redo(index);
      }

      // 同步状态到主 store
      const state = useHistoryStore.getState();
      setNodes(state.nodes);
      setEdges(state.edges);
      setOpen(false);
    },
    [setNodes, setEdges, undo, redo]
  );

  const handleClearHistory = useCallback(() => {
    clear();
    setOpen(false);
  }, [clear]);

  const historyList = useMemo(() => {
    // 过去的状态（倒序）
    const past: HistoryEntry[] = (pastStates as HistoryState[])
      .map((state: HistoryState, idx: number) => ({
        label: state.workflowHistoryEvent
          ? getHistoryLabel(state.workflowHistoryEvent)
          : '初始状态',
        index: -(pastStates.length - idx), // 负数表示过去
      }))
      .reverse();

    // 当前状态
    const current: HistoryEntry = {
      label: '当前状态',
      index: 0,
    };

    // 未来的状态
    const future: HistoryEntry[] = (futureStates as HistoryState[]).map(
      (state: HistoryState, idx: number) => ({
        label: state.workflowHistoryEvent
          ? getHistoryLabel(state.workflowHistoryEvent)
          : '未来状态',
        index: idx + 1, // 正数表示未来
      })
    );

    return [...past, current, ...future];
  }, [pastStates, futureStates, getHistoryLabel]);

  const totalStates = pastStates.length + futureStates.length;

  return (
    <PortalToFollowElem
      placement="bottom-end"
      offset={{
        mainAxis: 4,
        crossAxis: 0,
      }}
      open={open}
      onOpenChange={setOpen}
    >
      <PortalToFollowElemTrigger onClick={() => setOpen((v) => !v)}>
        <div
          className={cn(
            'flex h-8 w-8 cursor-pointer items-center justify-center rounded-md text-text-tertiary hover:bg-state-base-hover hover:text-text-secondary',
            open && 'bg-state-accent-active text-text-accent'
          )}
        >
          <History className="h-4 w-4" />
        </div>
      </PortalToFollowElemTrigger>
      <PortalToFollowElemContent className="z-[12]">
        <div className="ml-2 flex min-w-[240px] max-w-[360px] flex-col overflow-y-auto rounded-xl border-[0.5px] border-components-panel-border bg-components-panel-bg-blur shadow-xl backdrop-blur-[5px]">
          {/* 头部 */}
          <div className="sticky top-0 flex items-center justify-between px-4 pt-3">
            <div className="grow text-text-secondary">变更历史</div>
            <div
              className="flex h-6 w-6 shrink-0 cursor-pointer items-center justify-center"
              onClick={() => setOpen(false)}
            >
              <X className="h-4 w-4 text-text-secondary" />
            </div>
          </div>

        {/* 历史列表 */}
        <div className="overflow-y-auto p-2" style={{ maxHeight: 'calc(1 / 2 * 100vh)' }}>
          {totalStates === 0 ? (
            <div className="py-12">
              <History className="mx-auto mb-2 h-8 w-8 text-text-empty-state-icon" />
              <div className="text-center text-[13px] text-text-tertiary">暂无历史记录</div>
            </div>
          ) : (
            <div className="flex flex-col">
              {historyList.map((entry, idx) => (
                <div
                  key={idx}
                  className={cn(
                    'mb-0.5 flex cursor-pointer rounded-lg px-2 py-[7px] text-text-secondary hover:bg-state-base-hover',
                    entry.index === 0 && 'bg-state-base-hover'
                  )}
                  onClick={() => {
                    handleJumpToState(entry.index);
                    setOpen(false);
                  }}
                >
                  <div>
                    <div className="flex items-center text-[13px] font-medium leading-[18px] text-text-secondary">
                      {entry.label}
                      {entry.index !== 0 && (
                        <span className="ml-2 text-text-tertiary">
                          ({entry.index > 0 ? `前进 ${entry.index} 步` : `后退 ${-entry.index} 步`})
                        </span>
                      )}
                      {entry.index === 0 && <span className="ml-2 text-text-tertiary">(当前状态)</span>}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* 底部操作 */}
        {totalStates > 0 && (
          <div className="px-0.5">
            <Divider className="m-0" />
            <div
              className={cn(
                'my-0.5 flex cursor-pointer rounded-lg px-2 py-[7px] text-text-secondary hover:bg-state-base-hover'
              )}
              onClick={() => {
                handleClearHistory();
                setOpen(false);
              }}
            >
              <div>
                <div className="flex items-center text-[13px] font-medium leading-[18px]">清除所有历史记录</div>
              </div>
            </div>
          </div>
        )}

        {/* 提示信息 */}
        <div className="w-[240px] px-3 py-2 text-xs text-text-tertiary">
          <div className="mb-1 flex h-[22px] items-center font-medium uppercase">提示</div>
          <div className="mb-1 leading-[18px] text-text-tertiary">
            历史记录仅保存在当前会话中，刷新页面后将清空。
          </div>
        </div>
        </div>
      </PortalToFollowElemContent>
    </PortalToFollowElem>
  );
});

HistoryPanel.displayName = 'HistoryPanel';
