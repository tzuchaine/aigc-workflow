/**
 * 左侧垂直工具栏
 * 参照 Dify 的 operator/control.tsx，实现磨砂背景与悬浮阴影
 */

import { memo, useState, type ReactNode } from 'react';
import type { Node } from 'reactflow';
import { Hand, LayoutGrid, MousePointer2, Plus, StickyNote } from 'lucide-react';
import { cn } from '../../../utils/cn';
import { useAutoLayout } from '../hooks/useAutoLayout';
import { useWorkflowStore } from '../store/useWorkflowStore';
import { ControlMode, type WorkflowNodeData } from '../types';
import { Divider } from './Divider';
import { Tooltip } from './Tooltip';
import { NodeSelector } from './panels';
import { useWorkflowHistory } from '../hooks/useWorkflowHistory';
import { createWorkflowNode } from './nodeFactory';

export const Toolbar = memo(() => {
  const { controlMode, setControlMode, nodes, setNodes } = useWorkflowStore();
  const { organizeLayout } = useAutoLayout();
  const { saveStateToHistory } = useWorkflowHistory();
  const [selectorOpen, setSelectorOpen] = useState(false);

  const handleAddNote = () => {
    // TODO: 添加便签节点
    console.log('添加便签');
  };

  return (
    <>
      <div className="flex flex-col items-center space-y-0.5 rounded-lg border-[0.5px] border-components-actionbar-border bg-components-actionbar-bg p-0.5 shadow-lg backdrop-blur-[5px]">
        {/* 添加节点 */}
        <NodeSelector
          open={selectorOpen}
          onOpenChange={setSelectorOpen}
          trigger={(open) => (
            <Tooltip placement="right" title="添加节点">
              <ToolbarButton
                icon={<Plus className="w-4 h-4" />}
                onClick={() => setSelectorOpen(!open)}
              />
            </Tooltip>
          )}
          onSelect={(type, meta) => {
            const newNode: Node<WorkflowNodeData> = createWorkflowNode(type, meta, nodes.length);
            setNodes((prev) => [...prev, newNode]);
            setSelectorOpen(false);
            setTimeout(() => saveStateToHistory(), 0);
          }}
        />

        {/* 添加便签 */}
        <Tooltip placement='right' title="添加便签">
          <ToolbarButton icon={<StickyNote className="w-4 h-4" />} onClick={handleAddNote} />
        </Tooltip>

        <Divider type="horizontal" className="w-7 bg-components-actionbar-border" />

        {/* 指针模式 */}
        <Tooltip placement='right' title="指针模式" shortcuts={['V']}>
          <ToolbarButton
            icon={<MousePointer2 className="w-4 h-4" />}
            onClick={() => setControlMode(ControlMode.Pointer)}
            active={controlMode === ControlMode.Pointer}
          />
        </Tooltip>

        {/* 手掌模式 */}
        <Tooltip placement='right' title="手掌模式" shortcuts={['H']}>
          <ToolbarButton
            icon={<Hand className="w-4 h-4" />}
            onClick={() => setControlMode(ControlMode.Hand)}
            active={controlMode === ControlMode.Hand}
          />
        </Tooltip>

        <Divider type="horizontal" className="w-7 bg-components-actionbar-border" />

        {/* 整理布局 */}
        <Tooltip placement='right' title="整理布局" shortcuts={['Ctrl', 'O']}>
          <ToolbarButton icon={<LayoutGrid className="w-4 h-4" />} onClick={organizeLayout} />
        </Tooltip>
      </div>
    </>
  );
});

Toolbar.displayName = 'Toolbar';

/**
 * 工具栏按钮
 */
type ToolbarButtonProps = {
  icon: ReactNode;
  onClick: () => void;
  active?: boolean;
  disabled?: boolean;
};

const ToolbarButton = memo<ToolbarButtonProps>(
  ({ icon, onClick, active = false, disabled = false }) => {
    return (
      <button
        type="button"
        onClick={onClick}
        disabled={disabled}
        data-active={active}
        className={cn(
          'flex h-8 w-8 select-none items-center justify-center rounded-md px-1.5 text-text-tertiary transition-colors',
          'hover:bg-state-base-hover hover:text-text-secondary',
          'data-[active=true]:bg-state-base-hover data-[active=true]:text-text-secondary data-[active=true]:border data-[active=true]:border-components-actionbar-border',
          disabled &&
            'cursor-not-allowed text-text-disabled hover:bg-transparent hover:text-text-disabled'
        )}
      >
        {icon}
      </button>
    );
  }
);

ToolbarButton.displayName = 'ToolbarButton';
