/**
 * 浮动定位组件 - 基于 @floating-ui/react
 * 参考 Dify 的 portal-to-follow-elem 实现
 */

import type { OffsetOptions, Placement } from '@floating-ui/react';
import {
  autoUpdate,
  flip,
  FloatingPortal,
  offset,
  shift,
  useDismiss,
  useFloating,
  useInteractions,
  useMergeRefs,
  useRole,
} from '@floating-ui/react';
import * as React from 'react';
import { useCallback, useState } from 'react';
import { cn } from '../utils/cn';

export type PortalToFollowElemOptions = {
  placement?: Placement;
  open?: boolean;
  offset?: number | OffsetOptions;
  onOpenChange?: (open: boolean) => void;
};

export function usePortalToFollowElem({
  placement = 'bottom',
  open: controlledOpen,
  offset: offsetValue = 0,
  onOpenChange: setControlledOpen,
}: PortalToFollowElemOptions = {}) {
  const [localOpen, setLocalOpen] = useState(false);
  const open = controlledOpen ?? localOpen;
  const handleOpenChange = useCallback(
    (newOpen: boolean) => {
      setLocalOpen(newOpen);
      setControlledOpen?.(newOpen);
    },
    [setControlledOpen, setLocalOpen]
  );

  const data = useFloating({
    placement,
    open,
    onOpenChange: handleOpenChange,
    whileElementsMounted: autoUpdate,
    middleware: [
      offset(offsetValue),
      flip({
        crossAxis: placement.includes('-'),
        fallbackAxisSideDirection: 'start',
        padding: 5,
      }),
      shift({ padding: 5 }),
    ],
  });

  const context = data.context;
  const dismiss = useDismiss(context);
  const role = useRole(context, { role: 'dialog' });
  const interactions = useInteractions([dismiss, role]);

  return React.useMemo(
    () => ({
      open,
      setOpen: handleOpenChange,
      ...interactions,
      ...data,
    }),
    [open, handleOpenChange, interactions, data]
  );
}

type ContextType = ReturnType<typeof usePortalToFollowElem> | null;

const PortalToFollowElemContext = React.createContext<ContextType>(null);

export function usePortalToFollowElemContext() {
  const context = React.useContext(PortalToFollowElemContext);

  if (context == null)
    throw new Error('PortalToFollowElem components must be wrapped in <PortalToFollowElem />');

  return context;
}

export function PortalToFollowElem({
  children,
  ...options
}: { children: React.ReactNode } & PortalToFollowElemOptions) {
  const tooltip = usePortalToFollowElem(options);
  return (
    <PortalToFollowElemContext.Provider value={tooltip}>{children}</PortalToFollowElemContext.Provider>
  );
}

export const PortalToFollowElemTrigger = ({
  ref: propRef,
  children,
  asChild = false,
  ...props
}: React.HTMLProps<HTMLElement> & { ref?: React.RefObject<HTMLElement | null>; asChild?: boolean }) => {
  const context = usePortalToFollowElemContext();
  const childrenRef = (children as { props?: { ref?: React.Ref<unknown> } }).props?.ref;
  const ref = useMergeRefs([context.refs.setReference, propRef, childrenRef]);

  if (asChild && React.isValidElement(children)) {
    const childProps = (children.props ?? {}) as Record<string, unknown>;
    return React.cloneElement(
      children,
      context.getReferenceProps({
        ref,
        ...props,
        ...childProps,
        'data-state': context.open ? 'open' : 'closed',
      } as React.HTMLProps<HTMLElement>)
    );
  }

  return (
    <div
      ref={ref}
      className={cn('inline-block', props.className)}
      data-state={context.open ? 'open' : 'closed'}
      {...context.getReferenceProps(props)}
    >
      {children}
    </div>
  );
};
PortalToFollowElemTrigger.displayName = 'PortalToFollowElemTrigger';

export const PortalToFollowElemContent = ({
  ref: propRef,
  style,
  ...props
}: React.HTMLProps<HTMLDivElement> & {
  ref?: React.RefObject<HTMLDivElement | null>;
}) => {
  const context = usePortalToFollowElemContext();
  const ref = useMergeRefs([context.refs.setFloating, propRef]);

  if (!context.open) return null;

  const body = document.body;

  return (
    <FloatingPortal root={body}>
      <div
        ref={ref}
        style={{
          ...context.floatingStyles,
          ...style,
        }}
        {...context.getFloatingProps(props)}
      />
    </FloatingPortal>
  );
};

PortalToFollowElemContent.displayName = 'PortalToFollowElemContent';
