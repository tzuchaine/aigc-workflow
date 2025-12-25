/**
 * 撤销/重做组件
 * 参考 Dify 的 undo-redo.tsx 实现
 */

import { memo, useEffect, useState } from 'react';
import { Undo2, Redo2 } from 'lucide-react';
import { useWorkflowHistory } from '../hooks/useWorkflowHistory';
import { useHistoryStore, useTemporalStore } from '../store/useWorkflowStore';
import { Tooltip } from './Tooltip';
import { HistoryPanel } from './HistoryPanel';
import { Divider } from './Divider';
import { cn } from '../../../utils/cn';

export const UndoRedo = memo(() => {
  const { undo, redo, shortcutsEnabled } = useWorkflowHistory();
  const [buttonsDisabled, setButtonsDisabled] = useState({
    undo: true,
    redo: true,
  });

  // 监听历史状态变化，动态更新按钮禁用状态
  useEffect(() => {
    const unsubscribe = useHistoryStore.temporal.subscribe((state) => {
      setButtonsDisabled({
        undo: state.pastStates.length === 0,
        redo: state.futureStates.length === 0,
      });
    });

    // 初始化状态
    const temporal = useTemporalStore();
    setButtonsDisabled({
      undo: temporal.pastStates.length === 0,
      redo: temporal.futureStates.length === 0,
    });

    return () => unsubscribe();
  }, []);

  // 快捷键处理
  useEffect(() => {
    if (!shortcutsEnabled) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      // Ctrl+Z: 撤销
      if (e.ctrlKey && e.key === 'z' && !e.shiftKey) {
        e.preventDefault();
        if (!buttonsDisabled.undo) undo();
      }
      // Ctrl+Shift+Z 或 Ctrl+Y: 重做
      if ((e.ctrlKey && e.shiftKey && e.key === 'z') || (e.ctrlKey && e.key === 'y')) {
        e.preventDefault();
        if (!buttonsDisabled.redo) redo();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [shortcutsEnabled, buttonsDisabled, undo, redo]);

  return (
    <div className="flex items-center space-x-0.5 rounded-lg border-[0.5px] border-components-actionbar-border bg-components-actionbar-bg p-0.5 shadow-lg backdrop-blur-[5px]">
      {/* 撤销按钮 */}
      <Tooltip title="撤销" shortcuts={['Ctrl', 'Z']}>
        <div
          onClick={() => !buttonsDisabled.undo && undo()}
          className={cn(
            'flex h-8 w-8 cursor-pointer select-none items-center justify-center rounded-md px-1.5 text-text-tertiary hover:bg-state-base-hover hover:text-text-secondary',
            buttonsDisabled.undo &&
              'cursor-not-allowed text-text-disabled hover:bg-transparent hover:text-text-disabled'
          )}
        >
          <Undo2 className="h-4 w-4" />
        </div>
      </Tooltip>

      {/* 重做按钮 */}
      <Tooltip title="重做" shortcuts={['Ctrl', 'Y']}>
        <div
          onClick={() => !buttonsDisabled.redo && redo()}
          className={cn(
            'flex h-8 w-8 cursor-pointer select-none items-center justify-center rounded-md px-1.5 text-text-tertiary hover:bg-state-base-hover hover:text-text-secondary',
            buttonsDisabled.redo &&
              'cursor-not-allowed text-text-disabled hover:bg-transparent hover:text-text-disabled'
          )}
        >
          <Redo2 className="h-4 w-4" />
        </div>
      </Tooltip>

      {/* 分割线 */}
      <Divider type="vertical" className="mx-0.5 h-3.5" />

      {/* 历史记录面板 */}
      <Tooltip title="查看历史记录">
        <div className="inline-block">
          <HistoryPanel />
        </div>
      </Tooltip>
    </div>
  );
});

UndoRedo.displayName = 'UndoRedo';
