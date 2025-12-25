/**
 * Tooltip 单例管理器
 * 确保同一时间只有一个 Tooltip 显示
 */

class TooltipManager {
  private activeCloser: (() => void) | null = null;

  register(closeFn: () => void) {
    if (this.activeCloser) {
      this.activeCloser();
    }
    this.activeCloser = closeFn;
  }

  clear(closeFn: () => void) {
    if (this.activeCloser === closeFn) {
      this.activeCloser = null;
    }
  }

  /**
   * 关闭当前激活的 Tooltip
   */
  closeActiveTooltip() {
    if (this.activeCloser) {
      this.activeCloser();
      this.activeCloser = null;
    }
  }
}

export const tooltipManager = new TooltipManager();
