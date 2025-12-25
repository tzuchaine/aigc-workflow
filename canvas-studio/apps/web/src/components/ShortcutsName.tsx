/**
 * 快捷键显示组件
 * 参考 Dify 的 shortcuts-name 实现
 */

import { memo } from 'react';
import { cn } from '../utils/cn';

type ShortcutsNameProps = {
  keys: string[];
  className?: string;
  textColor?: 'default' | 'secondary';
};

/**
 * 根据系统转换键名
 * macOS: Cmd、Option
 * Windows/Linux: Ctrl、Alt
 */
const getKeyboardKeyName = (key: string): string => {
  const isMac = typeof navigator !== 'undefined' && navigator.platform.toUpperCase().indexOf('MAC') >= 0;

  const keyMap: Record<string, { mac: string; win: string }> = {
    ctrl: { mac: '⌘', win: 'Ctrl' },
    cmd: { mac: '⌘', win: 'Ctrl' },
    alt: { mac: '⌥', win: 'Alt' },
    shift: { mac: '⇧', win: 'Shift' },
    enter: { mac: '↵', win: 'Enter' },
    backspace: { mac: '⌫', win: 'Backspace' },
    delete: { mac: '⌦', win: 'Delete' },
    tab: { mac: '⇥', win: 'Tab' },
    esc: { mac: '⎋', win: 'Esc' },
  };

  const lowerKey = key.toLowerCase();
  const mapping = keyMap[lowerKey];

  if (mapping) {
    return isMac ? mapping.mac : mapping.win;
  }

  // 单个字母或数字,直接返回大写
  return key.length === 1 ? key.toUpperCase() : key;
};

export const ShortcutsName = memo<ShortcutsNameProps>(
  ({ keys, className, textColor = 'default' }) => {
    return (
      <div className={cn('flex items-center gap-0.5', className)}>
        {keys.map((key, index) => (
          <div
            key={`${key}-${index}`}
            className={cn(
              'flex h-4 min-w-4 items-center justify-center rounded-[4px] bg-components-kbd-bg-gray px-1 text-[10px] font-semibold capitalize',
              textColor === 'secondary' ? 'text-text-tertiary' : 'text-text-secondary'
            )}
          >
            {getKeyboardKeyName(key)}
          </div>
        ))}
      </div>
    );
  }
);

ShortcutsName.displayName = 'ShortcutsName';
