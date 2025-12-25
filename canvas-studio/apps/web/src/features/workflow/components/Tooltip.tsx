/**
 * Tooltip 提示组件
 * 基于 PortalToFollowElem 实现智能定位
 * 参考 Dify 的 tooltip + tip-popup 实现
 */

import { memo, useState, useEffect, useRef } from 'react';
import type { Placement } from '@floating-ui/react';
import {
  PortalToFollowElem,
  PortalToFollowElemContent,
  PortalToFollowElemTrigger,
} from '../../../components/PortalToFollowElem';
import { ShortcutsName } from '../../../components/ShortcutsName';
import { tooltipManager } from '../../../utils/TooltipManager';
import { cn } from '../../../utils/cn';

type TooltipProps = {
  title: string;
  children: React.ReactNode;
  shortcuts?: string[];
  placement?: Placement;
  disabled?: boolean;
  asChild?: boolean;
};

export const Tooltip = memo<TooltipProps>(
  ({ title, children, shortcuts, placement = 'top', disabled = false, asChild = true }) => {
    const [open, setOpen] = useState(false);
    const [isHoverPopup, setIsHoverPopup] = useState(false);
    const [isHoverTrigger, setIsHoverTrigger] = useState(false);

    const isHoverPopupRef = useRef(isHoverPopup);
    const isHoverTriggerRef = useRef(isHoverTrigger);

    useEffect(() => {
      isHoverPopupRef.current = isHoverPopup;
    }, [isHoverPopup]);

    useEffect(() => {
      isHoverTriggerRef.current = isHoverTrigger;
    }, [isHoverTrigger]);

    const close = () => setOpen(false);

    const handleLeave = (isTrigger: boolean) => {
      if (isTrigger) {
        setIsHoverTrigger(false);
      } else {
        setIsHoverPopup(false);
      }

      // 延迟关闭,给用户时间移动到 popup
      setTimeout(() => {
        if (!isHoverPopupRef.current && !isHoverTriggerRef.current) {
          setOpen(false);
          tooltipManager.clear(close);
        }
      }, 100);
    };

    return (
      <PortalToFollowElem open={disabled ? false : open} onOpenChange={setOpen} placement={placement} offset={4}>
        <PortalToFollowElemTrigger
          onMouseEnter={() => {
            setIsHoverTrigger(true);
            tooltipManager.register(close);
            setOpen(true);
          }}
          onMouseLeave={() => handleLeave(true)}
          asChild={asChild}
        >
          {children}
        </PortalToFollowElemTrigger>
        <PortalToFollowElemContent className="z-[9999]">
          <div
            className={cn(
              'flex items-center gap-1 rounded-lg border-[0.5px] border-components-panel-border bg-components-tooltip-bg p-1.5 shadow-lg backdrop-blur-[5px]'
            )}
            onMouseEnter={() => setIsHoverPopup(true)}
            onMouseLeave={() => handleLeave(false)}
          >
            <span className="whitespace-nowrap text-xs font-medium text-text-secondary">{title}</span>
            {shortcuts && shortcuts.length > 0 && <ShortcutsName keys={shortcuts} />}
          </div>
        </PortalToFollowElemContent>
      </PortalToFollowElem>
    );
  }
);

Tooltip.displayName = 'Tooltip';
