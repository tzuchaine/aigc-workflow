import { memo, useCallback, useMemo, useState } from 'react';
import { Search } from 'lucide-react';
import type { OffsetOptions, Placement } from '@floating-ui/react';
import { cn } from '../../../../utils/cn';
import {
  PortalToFollowElem,
  PortalToFollowElemContent,
  PortalToFollowElemTrigger,
} from '../../../../components/PortalToFollowElem';

export type NodeSelectorProps = {
  trigger?: (open: boolean) => React.ReactNode;
  onSelect: (type: string, meta: { title: string; desc?: string }) => void;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  placement?: Placement;
  offset?: number | OffsetOptions;
};

const MOCK_GROUPS = [
  {
    title: 'AI 生成',
    items: [
      { id: 'image-generation', title: '图片生成', desc: '支持多种 AI 图片生成引擎', type: 'image-generation' },
      { id: 'video-generation', title: '视频生成', desc: '支持多种 AI 视频生成引擎', type: 'video-generation' },
    ],
  },
  {
    title: 'ComfyUI (旧版)',
    items: [
      { id: 'comfy-image', title: 'ComfyUI 图片', desc: '旧版文生图节点', type: 'comfy-image' },
      { id: 'comfy-video', title: 'ComfyUI 视频', desc: '旧版文生视频节点', type: 'comfy-video' },
    ],
  },
  {
    title: '输入输出',
    items: [
      { id: 'image-node', title: '图片输入', desc: '上传/粘贴/拖入图片', type: 'image-node' },
      { id: 'asset', title: '资产输出', desc: '展示生成的产物', type: 'asset' },
    ],
  },
];

export const NodeSelector = memo(
  ({
    trigger,
    onSelect,
    open: openFromProps,
    onOpenChange,
    placement = 'right',
    offset = 8,
  }: NodeSelectorProps) => {
    const [localOpen, setLocalOpen] = useState(false);
    const open = openFromProps ?? localOpen;

    const handleOpenChange = useCallback(
      (next: boolean) => {
        setLocalOpen(next);
        onOpenChange?.(next);
      },
      [onOpenChange]
    );

    const renderTrigger = useMemo(
      () =>
        trigger
          ? trigger(open)
          : (
            <div className="flex h-8 w-8 items-center justify-center rounded-md bg-components-button-primary-bg text-white hover:bg-components-button-primary-bg-hover">
              +
            </div>
            ),
      [trigger, open]
    );

    return (
      <PortalToFollowElem open={open} onOpenChange={handleOpenChange} placement={placement} offset={offset}>
        <PortalToFollowElemTrigger asChild>
          <div onClick={() => handleOpenChange(!open)}>{renderTrigger}</div>
        </PortalToFollowElemTrigger>
        <PortalToFollowElemContent className="z-[1000]">
          <div className="w-[360px] rounded-lg border-[0.5px] border-components-panel-border bg-components-panel-bg shadow-lg">
            <div className="border-b border-components-panel-border p-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-tertiary" />
                <input
                  className="h-9 w-full rounded-lg border border-components-panel-border bg-white px-9 text-sm text-text-primary placeholder:text-text-tertiary focus:border-state-accent-outline focus:outline-none"
                  placeholder="搜索节点类型..."
                />
              </div>
            </div>

            <div className="max-h-[420px] overflow-y-auto p-3">
              <div className="flex flex-col gap-3">
                {MOCK_GROUPS.map((group) => (
                  <div
                    key={group.title}
                    className="rounded-xl border border-components-panel-border bg-white/80 p-3 shadow-sm"
                  >
                    <div className="mb-2 text-xs font-semibold uppercase text-text-tertiary">
                      {group.title}
                    </div>
                    <div className="flex flex-col gap-2">
                      {group.items.map((item) => (
                        <button
                          key={item.id}
                          type="button"
                      className={cn(
                        'flex items-start justify-between rounded-lg border border-transparent bg-white px-3 py-2 text-left shadow-sm transition',
                        'hover:border-state-accent-outline hover:shadow-md'
                      )}
                      draggable
                      onDragStart={(e) => {
                        e.dataTransfer.setData(
                          'application/reactflow',
                          JSON.stringify({ type: item.type, meta: { title: item.title, desc: item.desc } })
                        );
                        e.dataTransfer.effectAllowed = 'move';
                      }}
                      onClick={() => {
                        handleOpenChange(false);
                        onSelect(item.type, { title: item.title, desc: item.desc });
                      }}
                    >
                          <div className="min-w-0">
                            <div className="truncate text-sm font-semibold text-text-primary">
                              {item.title}
                            </div>
                            <div className="mt-0.5 truncate text-xs text-text-tertiary">{item.desc}</div>
                          </div>
                          <div className="ml-2 shrink-0 rounded-full bg-state-base-hover px-2 py-[2px] text-[10px] text-text-secondary">
                            {item.type}
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </PortalToFollowElemContent>
      </PortalToFollowElem>
    );
  }
);

NodeSelector.displayName = 'NodeSelector';
