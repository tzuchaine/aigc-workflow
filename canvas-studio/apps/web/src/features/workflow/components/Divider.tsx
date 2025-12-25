/**
 * 分割线组件
 * 参考 Dify 的 divider 实现
 */

import { type CSSProperties } from 'react';
import { cn } from '../../../utils/cn';

type DividerProps = {
  type?: 'horizontal' | 'vertical';
  className?: string;
  style?: CSSProperties;
};

export const Divider = ({ type = 'horizontal', className, style }: DividerProps) => {
  const baseClasses = 'shrink-0 bg-divider-regular';
  const typeClasses = {
    horizontal: 'w-full h-[0.5px] my-2',
    vertical: 'w-[1px] h-full mx-2',
  };

  return <div className={cn(baseClasses, typeClasses[type], className)} style={style} />;
};
