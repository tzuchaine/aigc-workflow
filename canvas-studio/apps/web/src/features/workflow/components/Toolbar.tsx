/**
 * 左侧垂直工具栏
 * 参考 Dify 的 operator/control.tsx 实现
 */

import { memo } from 'react';
import {
  Plus,
  StickyNote,
  MousePointer2,
  Hand,
  LayoutGrid,
} from 'lucide-react';
import { useWorkflowStore } from '../store/useWorkflowStore';
import { useAutoLayout } from '../hooks/useAutoLayout';
import { ControlMode } from '../types';
import { Tooltip } from './Tooltip';

export const Toolbar = memo(() => {
  const { controlMode, setControlMode } = useWorkflowStore();
  const { organizeLayout } = useAutoLayout();

  const handleAddNode = () => {
    // TODO: 打开添加节点面板
    console.log('添加节点');
  };

  const handleAddNote = () => {
    // TODO: 添加注释节点
    console.log('添加注释');
  };

  return (
    <div className="flex flex-col items-center gap-0.5 rounded-lg border border-neutral-200 bg-white p-0.5 shadow-lg">
      {/* 添加节点 */}
      <Tooltip title="添加节点">
        <ToolbarButton icon={<Plus className="h-4 w-4" />} onClick={handleAddNode} />
      </Tooltip>

      {/* 添加注释 */}
      <Tooltip title="添加注释">
        <ToolbarButton icon={<StickyNote className="h-4 w-4" />} onClick={handleAddNote} />
      </Tooltip>

      {/* 分割线 */}
      <div className="my-1 h-px w-3.5 bg-neutral-200" />

      {/* 指针模式 */}
      <Tooltip title="指针模式" shortcuts={['V']}>
        <ToolbarButton
          icon={<MousePointer2 className="h-4 w-4" />}
          onClick={() => setControlMode(ControlMode.Pointer)}
          active={controlMode === ControlMode.Pointer}
        />
      </Tooltip>

      {/* 手掌模式 */}
      <Tooltip title="手掌模式" shortcuts={['H']}>
        <ToolbarButton
          icon={<Hand className="h-4 w-4" />}
          onClick={() => setControlMode(ControlMode.Hand)}
          active={controlMode === ControlMode.Hand}
        />
      </Tooltip>

      {/* 分割线 */}
      <div className="my-1 h-px w-3.5 bg-neutral-200" />

      {/* 整理节点 */}
      <Tooltip title="整理节点" shortcuts={['Ctrl', 'O']}>
        <ToolbarButton icon={<LayoutGrid className="h-4 w-4" />} onClick={organizeLayout} />
      </Tooltip>
    </div>
  );
});

Toolbar.displayName = 'Toolbar';

/**
 * 工具栏按钮组件
 */
type ToolbarButtonProps = {
  icon: React.ReactNode;
  onClick: () => void;
  active?: boolean;
  disabled?: boolean;
};

const ToolbarButton = memo<ToolbarButtonProps>(
  ({ icon, onClick, active = false, disabled = false }) => {
    return (
      <button
        onClick={onClick}
        disabled={disabled}
        className={`
          flex h-8 w-8 items-center justify-center rounded-md
          transition-colors
          ${
            active
              ? 'bg-blue-100 text-blue-600'
              : disabled
                ? 'cursor-not-allowed text-neutral-300'
                : 'text-neutral-600 hover:bg-neutral-100 hover:text-neutral-900'
          }
        `}
      >
        {icon}
      </button>
    );
  }
);

ToolbarButton.displayName = 'ToolbarButton';
