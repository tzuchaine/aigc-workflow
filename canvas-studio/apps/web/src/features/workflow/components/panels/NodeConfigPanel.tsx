import { memo, useMemo } from 'react';
import { X } from 'lucide-react';
import type { Node } from 'reactflow';
import { motion, AnimatePresence } from 'framer-motion';
import type { WorkflowNodeData } from '../../types';
import { useWorkflowStore } from '../../store/useWorkflowStore';
import { Tooltip } from '../Tooltip';
import { GenerationNodeConfig } from './GenerationNodeConfig';
import { ComfyNodeConfig } from './ComfyNodeConfig';

export const NodeConfigPanel = memo(() => {
  const { nodes, setNodes } = useWorkflowStore();

  const selectedNode = useMemo<Node<WorkflowNodeData> | undefined>(
    () => nodes.find((n) => n.selected),
    [nodes]
  );

  const clearSelection = () => {
    setNodes((prev) => prev.map((n) => ({ ...n, selected: false })));
  };

  // 渲染节点配置内容
  const renderNodeConfig = () => {
    if (!selectedNode) return null;

    const nodeType = selectedNode.type;

    // 图片生成节点
    if (nodeType === 'image-generation') {
      return (
        <GenerationNodeConfig
          nodeId={selectedNode.id}
          nodeType="image-generation"
          nodeData={selectedNode.data}
        />
      );
    }

    // 视频生成节点
    if (nodeType === 'video-generation') {
      return (
        <GenerationNodeConfig
          nodeId={selectedNode.id}
          nodeType="video-generation"
          nodeData={selectedNode.data}
        />
      );
    }

    // ComfyUI 图片节点
    if (nodeType === 'comfy-image') {
      return (
        <ComfyNodeConfig
          nodeId={selectedNode.id}
          nodeType="comfy-image"
          nodeData={selectedNode.data}
        />
      );
    }

    // ComfyUI 视频节点
    if (nodeType === 'comfy-video') {
      return (
        <ComfyNodeConfig
          nodeId={selectedNode.id}
          nodeType="comfy-video"
          nodeData={selectedNode.data}
        />
      );
    }

    // 其他节点类型
    return (
      <div className="flex h-full items-center justify-center">
        <div className="text-center text-sm text-neutral-500">
          <p>此节点类型暂无可配置项</p>
        </div>
      </div>
    );
  };

  // 获取 Header 配置（可由节点自定义）
  const getHeaderConfig = () => {
    if (!selectedNode) return null;

    return {
      title: selectedNode.data.title || '未命名节点',
      subtitle: selectedNode.data.subtitle,
      type: selectedNode.type,
      icon: selectedNode.data.type?.slice(0, 2)?.toUpperCase() || 'ND',
      // 节点可以通过 data.headerActions 自定义操作按钮
      actions: selectedNode.data.headerActions as React.ReactNode | undefined,
    };
  };

  const headerConfig = getHeaderConfig();

  return (
    <AnimatePresence>
      {selectedNode && headerConfig && (
        <motion.div
          initial={{ x: 20, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          exit={{ x: 20, opacity: 0 }}
          transition={{ duration: 0.12, ease: 'easeOut' }}
          className="absolute right-4 top-4 bottom-4 z-10 w-[380px] rounded-2xl border-[0.5px] border-components-panel-border bg-components-panel-bg shadow-lg backdrop-blur-[6px] overflow-hidden"
        >
          <div className="flex h-full flex-col">
            {/* Header */}
            <div className="sticky top-0 z-10 border-b-[0.5px] border-components-panel-border bg-components-panel-bg/95 backdrop-blur-sm">
              <div className="flex items-center gap-3 px-4 pb-2 pt-4">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-neutral-100 text-sm font-semibold text-neutral-700">
                  {headerConfig.icon}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <div className="truncate text-base font-semibold text-neutral-900">
                      {headerConfig.title}
                    </div>
                    {headerConfig.type && (
                      <span className="shrink-0 rounded-full border border-neutral-200 bg-neutral-50 px-2 py-[2px] text-[11px] text-neutral-600">
                        {headerConfig.type}
                      </span>
                    )}
                  </div>
                  {headerConfig.subtitle && (
                    <div className="mt-0.5 truncate text-xs text-neutral-500">
                      {headerConfig.subtitle}
                    </div>
                  )}
                </div>
                <div className="flex shrink-0 items-center gap-1 text-text-tertiary">
                  {/* 自定义操作按钮 */}
                  {headerConfig.actions}

                  {/* 关闭按钮（始终存在） */}
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

            {/* 内容区（完全由节点组件控制） */}
            <div className="flex-1 overflow-auto">
              {renderNodeConfig()}
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
});

NodeConfigPanel.displayName = 'NodeConfigPanel';
