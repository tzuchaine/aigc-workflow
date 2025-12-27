/**
 * 自定义 Select 组件，对齐 Dify 设计风格
 * 基于 floating-ui 实现下拉定位
 */

import { memo, useState, useRef, useCallback } from 'react';
import { ChevronDown, Check } from 'lucide-react';
import {
  useFloating,
  useClick,
  useDismiss,
  useRole,
  useInteractions,
  FloatingFocusManager,
  offset,
  flip,
  size,
  autoUpdate,
  FloatingPortal,
} from '@floating-ui/react';
import { cn } from '../utils/cn';

export interface SelectOption {
  label: string;
  value: string;
}

export interface SelectProps {
  value: string;
  onChange: (value: string) => void;
  options: SelectOption[];
  placeholder?: string;
  disabled?: boolean;
  className?: string;
}

export const Select = memo(({
  value,
  onChange,
  options,
  placeholder = '请选择',
  disabled = false,
  className,
}: SelectProps) => {
  const [isOpen, setIsOpen] = useState(false);

  const { refs, floatingStyles, context } = useFloating({
    open: isOpen,
    onOpenChange: setIsOpen,
    middleware: [
      offset(4),
      flip({ padding: 8 }),
      size({
        apply({ rects, elements }) {
          Object.assign(elements.floating.style, {
            minWidth: `${rects.reference.width}px`,
          });
        },
        padding: 8,
      }),
    ],
    whileElementsMounted: autoUpdate,
  });

  const click = useClick(context);
  const dismiss = useDismiss(context);
  const role = useRole(context);

  const { getReferenceProps, getFloatingProps } = useInteractions([
    click,
    dismiss,
    role,
  ]);

  const selectedOption = options.find((opt) => opt.value === value);

  const handleSelect = useCallback(
    (optionValue: string) => {
      onChange(optionValue);
      setIsOpen(false);
    },
    [onChange]
  );

  return (
    <>
      {/* Trigger Button */}
      <button
        ref={refs.setReference}
        type="button"
        disabled={disabled}
        {...getReferenceProps()}
        className={cn(
          'flex w-full items-center justify-between gap-2 rounded-lg border px-3 py-2 text-sm transition-colors',
          'border-components-input-border bg-components-input-bg-normal text-text-primary',
          !disabled && 'hover:bg-state-base-hover',
          isOpen && 'border-components-input-border-focus bg-components-input-bg-active ring-1 ring-components-input-border-focus',
          disabled && 'cursor-not-allowed opacity-50',
          className
        )}
      >
        <span className={cn(!selectedOption && 'text-text-placeholder')}>
          {selectedOption?.label || placeholder}
        </span>
        <ChevronDown
          size={16}
          className={cn(
            'shrink-0 text-text-tertiary transition-transform',
            isOpen && 'rotate-180'
          )}
        />
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <FloatingPortal>
          <FloatingFocusManager context={context} modal={false}>
            <div
              ref={refs.setFloating}
              style={floatingStyles}
              {...getFloatingProps()}
              className="z-50 max-h-[280px] overflow-y-auto rounded-lg border border-components-panel-border bg-components-panel-bg shadow-lg"
            >
              <div className="py-1">
                {options.map((option) => {
                  const isSelected = option.value === value;
                  return (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() => handleSelect(option.value)}
                      className={cn(
                        'flex w-full items-center justify-between gap-2 px-3 py-2 text-left text-sm transition-colors',
                        isSelected
                          ? 'bg-state-accent-hover text-text-accent'
                          : 'text-text-primary hover:bg-state-base-hover'
                      )}
                    >
                      <span>{option.label}</span>
                      {isSelected && (
                        <Check size={16} className="shrink-0 text-text-accent" />
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          </FloatingFocusManager>
        </FloatingPortal>
      )}
    </>
  );
});

Select.displayName = 'Select';
