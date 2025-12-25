/**
 * 自定义缩放控制器（横向排列）
 * 提供 +/-/fit/显示缩放比例 功能
 */

import { memo } from 'react';
import { useReactFlow } from 'reactflow';
import { ZoomIn, ZoomOut, Maximize } from 'lucide-react';

export const ZoomControls = memo(() => {
  const { zoomIn, zoomOut, fitView, getZoom } = useReactFlow();
  const currentZoom = getZoom();
  const zoomPercentage = Math.round(currentZoom * 100);

  const handleZoomIn = () => {
    zoomIn({ duration: 200 });
  };

  const handleZoomOut = () => {
    zoomOut({ duration: 200 });
  };

  const handleFitView = () => {
    fitView({ padding: 0.2, duration: 200 });
  };

  return (
    <div className="flex items-center gap-0.5 rounded-lg border border-neutral-200 bg-white p-0.5 shadow-lg">
      {/* 缩小 */}
      <button
        onClick={handleZoomOut}
        title="缩小 (-)"
        className="flex h-8 w-8 items-center justify-center rounded-md text-neutral-600 transition-colors hover:bg-neutral-100 hover:text-neutral-900"
      >
        <ZoomOut className="h-4 w-4" />
      </button>

      {/* 缩放比例显示 */}
      <div className="flex h-8 min-w-[48px] items-center justify-center px-2 text-xs font-medium text-neutral-600">
        {zoomPercentage}%
      </div>

      {/* 放大 */}
      <button
        onClick={handleZoomIn}
        title="放大 (+)"
        className="flex h-8 w-8 items-center justify-center rounded-md text-neutral-600 transition-colors hover:bg-neutral-100 hover:text-neutral-900"
      >
        <ZoomIn className="h-4 w-4" />
      </button>

      {/* 分割线 */}
      <div className="mx-0.5 h-4 w-px bg-neutral-200" />

      {/* 适应画布 */}
      <button
        onClick={handleFitView}
        title="适应画布 (Shift+1)"
        className="flex h-8 w-8 items-center justify-center rounded-md text-neutral-600 transition-colors hover:bg-neutral-100 hover:text-neutral-900"
      >
        <Maximize className="h-4 w-4" />
      </button>
    </div>
  );
});

ZoomControls.displayName = 'ZoomControls';
