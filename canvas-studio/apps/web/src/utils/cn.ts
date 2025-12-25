/**
 * 合并 Tailwind CSS 类名的工具函数
 * 基于 clsx + tailwind-merge 实现
 */

import type { ClassValue } from 'clsx';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
