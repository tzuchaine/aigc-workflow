import { memo, useCallback, useRef, useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Handle, Position, type NodeProps } from 'reactflow';
import { AnimatePresence, motion } from 'framer-motion';
import { cn } from '@/utils/cn';
import type { WorkflowNodeData, ImageData } from '../../types';

// ImageNode: 用于用户输入图片（上传/粘贴/拖入）
// 不需要状态机，只负责图片输入和传递

export const ImageNode = memo(({ id, data, selected }: NodeProps<WorkflowNodeData>) => {
  // 图片数据（用户上传/粘贴/拖入）
  const images = data.runtime?.output?.images ?? [];
  const legacyImageUrl = data.runtime?.output?.imageUrl;
  const legacyPrompt = data.runtime?.output?.prompt;

  // 如果有旧格式数据，转换为新格式
  const allImages: ImageData[] = legacyImageUrl
    ? [
        {
          id: 'legacy',
          url: legacyImageUrl,
          ...(legacyPrompt !== undefined && { prompt: legacyPrompt }),
          createdAt: new Date().toISOString(),
        },
      ]
    : images;

  const [isExpanded, setIsExpanded] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [isImageTransitioning, setIsImageTransitioning] = useState(false);
  const [nodeRect, setNodeRect] = useState<DOMRect | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const nodeRef = useRef<HTMLDivElement>(null);

  // 当前显示的图片（由 selectedImageIndex 决定）
  const currentImage = allImages[selectedImageIndex];
  const hasMultipleImages = allImages.length > 1;

  // 获取节点位置
  useEffect(() => {
    if (isExpanded && nodeRef.current) {
      setNodeRect(nodeRef.current.getBoundingClientRect());
    }
  }, [isExpanded]);

  // 处理文件选择
  const handleFileSelect = useCallback((files: FileList | null) => {
    if (!files || files.length === 0) return;

    const newImages: ImageData[] = [];
    Array.from(files).forEach((file) => {
      if (file.type.startsWith('image/')) {
        const blobUrl = URL.createObjectURL(file);
        newImages.push({
          id: `local-${Date.now()}-${Math.random()}`,
          url: blobUrl,
          createdAt: new Date().toISOString(),
        });
      }
    });

    // 更新节点数据
    const updateNodeData = (window as { __updateNodeData?: (id: string, data: Partial<WorkflowNodeData>) => void }).__updateNodeData;
    if (updateNodeData) {
      const updatedImages = [...allImages, ...newImages];
      updateNodeData(id, {
        runtime: {
          ...data.runtime,
          status: 'idle',
          output: {
            ...data.runtime?.output,
            images: updatedImages,
          },
        },
      });
    }
  }, [id, data.runtime, allImages]);


  // 拖入图片
  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragging(false);

      const files = e.dataTransfer.files;
      handleFileSelect(files);
    },
    [handleFileSelect]
  );

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }, []);

  // 切换展开/折叠
  const toggleExpanded = useCallback(() => {
    setIsExpanded((prev) => !prev);
  }, []);

  // 切换主图
  const handleImageClick = useCallback((index: number) => {
    if (index === selectedImageIndex) {
      setIsExpanded(false);
      return;
    }

    // 触发淡出动画
    setIsImageTransitioning(true);

    // 150ms 后切换图片并淡入
    setTimeout(() => {
      setSelectedImageIndex(index);
      setIsExpanded(false);
      setIsImageTransitioning(false);
    }, 150);
  }, [selectedImageIndex]);

  return (
    <>
      <div
        ref={nodeRef}
        data-selected={selected}
        className={cn(
          'group relative rounded-lg border-2 border-neutral-200 bg-white shadow-sm will-change-transform',
          'hover:shadow-md transition-all',
          'data-[selected=true]:border-sky-400 data-[selected=true]:shadow-lg',
          isDragging && 'border-sky-400 bg-sky-50'
        )}
        style={{
          width: currentImage ? 'auto' : '200px',
          minWidth: '120px',
          maxWidth: '240px',
          maxHeight: '240px',
        }}
      >
        {/* 输入端口 */}
        <Handle
          type="target"
          id="image"
          position={Position.Left}
          className={cn(
            '!top-12 !-left-[9px] !translate-y-0',
            'z-[1] !h-4 !w-4 !rounded-none !border-none !bg-transparent !outline-none',
            'after:absolute after:left-1.5 after:top-1 after:h-2 after:w-0.5 after:bg-blue-500',
            'transition-all hover:scale-125',
            // 添加伪元素按钮（节点 hover 或选中时显示）
            'before:absolute before:left-0 before:top-0 before:h-4 before:w-4',
            'before:rounded-full before:bg-blue-500 before:opacity-0',
            'before:transition-opacity before:duration-200',
            'before:content-[\'+\'] before:flex before:items-center before:justify-center',
            'before:text-white before:text-xs before:font-bold before:leading-none',
            'group-hover:before:opacity-100',
            selected && 'before:opacity-100'
          )}
        />

        {/* 输出端口 */}
        <Handle
          type="source"
          id="image"
          position={Position.Right}
          className={cn(
            '!top-12 !-right-[9px] !translate-y-0',
            'z-[1] !h-4 !w-4 !rounded-none !border-none !bg-transparent !outline-none',
            'after:absolute after:right-1.5 after:top-1 after:h-2 after:w-0.5 after:bg-blue-500',
            'transition-all hover:scale-125',
            // 添加伪元素按钮（节点 hover 或选中时显示）
            'before:absolute before:left-0 before:top-0 before:h-4 before:w-4',
            'before:rounded-full before:bg-blue-500 before:opacity-0',
            'before:transition-opacity before:duration-200',
            'before:content-[\'+\'] before:flex before:items-center before:justify-center',
            'before:text-white before:text-xs before:font-bold before:leading-none',
            'group-hover:before:opacity-100',
            selected && 'before:opacity-100'
          )}
        />

        {/* 隐藏的文件输入 */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          multiple
          className="hidden"
          onChange={(e) => handleFileSelect(e.target.files)}
        />

        {/* 图片内容区域 */}
        <div
          className="overflow-hidden rounded-md"
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
        >
          {currentImage ? (
            <div className="relative">
              {/* 主图片 */}
              <img
                src={currentImage.url}
                alt="Preview"
                className={cn(
                  "w-full h-auto object-cover transition-opacity duration-150",
                  isImageTransitioning ? "opacity-0" : "opacity-100"
                )}
                style={{
                  display: 'block',
                  maxHeight: '240px',
                  transitionTimingFunction: 'cubic-bezier(0.4, 0, 0.2, 1)',
                }}
              />

              {/* 多张图片计数按钮 */}
              {hasMultipleImages && (
                <button
                  type="button"
                  data-no-select="true"
                  onClick={toggleExpanded}
                  className={cn(
                    'absolute top-2 right-2 flex items-center gap-1',
                    'rounded-full bg-black/70 px-2.5 py-1 text-xs font-medium text-white',
                    'hover:bg-black/90 hover:scale-110 transition-all duration-200 backdrop-blur-sm',
                    'border border-white/20'
                  )}
                  style={{
                    transitionTimingFunction: 'cubic-bezier(0.4, 0, 0.2, 1)',
                  }}
                >
                  <span>{allImages.length}</span>
                </button>
              )}

              {/* Prompt 提示（hover 时显示） */}
              {currentImage.prompt && (
                <div
                  className={cn(
                    'absolute bottom-2 left-2 right-2',
                    'rounded-md bg-black/80 px-2 py-1.5 text-[10px] text-white',
                    'transition-all duration-200 opacity-0 group-hover:opacity-100 group-hover:translate-y-0 translate-y-1 backdrop-blur-sm',
                    'max-h-20 overflow-y-auto'
                  )}
                  style={{
                    transitionTimingFunction: 'cubic-bezier(0.4, 0, 0.2, 1)',
                  }}
                >
                  <div className="font-semibold text-emerald-400 mb-0.5">PROMPT</div>
                  {currentImage.prompt}
                </div>
              )}
            </div>
          ) : (
            // 空状态：等待图片
            <div className="flex h-32 w-full items-center justify-center text-xs text-neutral-400 bg-neutral-50">
              等待图片输入
            </div>
          )}
        </div>
      </div>

      {/* 图片网格（通过 Portal 渲染到 body） */}
      {hasMultipleImages && nodeRect && createPortal(
        <AnimatePresence>
          {isExpanded && (
            <>
              {/* 透明蒙层：拦截所有事件但不显示 */}
              <motion.div
                className="fixed inset-0"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2, ease: [0.4, 0, 0.2, 1] }}
                style={{
                  pointerEvents: 'auto',
                  zIndex: 999,
                  backgroundColor: 'transparent',
                }}
                onClick={(e) => {
                  e.stopPropagation();
                  toggleExpanded();
                }}
                onMouseDown={(e) => e.stopPropagation()}
                onMouseUp={(e) => e.stopPropagation()}
              />

              {/* 图片网格 */}
              <motion.div
                className="fixed grid gap-2"
                initial={{ opacity: 0, x: -16 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -16 }}
                transition={{ duration: 0.2, ease: [0.4, 0, 0.2, 1] }}
                style={{
                  left: nodeRect.right + 12,
                  top: nodeRect.top,
                  width: '480px',
                  gridTemplateColumns: 'repeat(4, 1fr)',
                  pointerEvents: 'none',
                  zIndex: 1000,
                }}
              >
                {allImages.map((image, index) => (
                  <div
                    key={image.id}
                    className={cn(
                      "group/item relative aspect-square overflow-hidden rounded-md border-2 bg-transparent hover:border-sky-400 transition-colors duration-200 cursor-pointer shadow-lg",
                      index === selectedImageIndex ? "border-sky-500 ring-2 ring-sky-500/50" : "border-white/30"
                    )}
                    style={{
                      transitionTimingFunction: 'cubic-bezier(0.4, 0, 0.2, 1)',
                      pointerEvents: 'auto',
                    }}
                    onClick={(e) => {
                      e.stopPropagation();
                      handleImageClick(index);
                    }}
                  >
                    <img
                      src={image.url}
                      alt={`Preview ${index + 1}`}
                      className="w-full h-full object-cover"
                      draggable
                      onDragStart={(e) => {
                        e.dataTransfer.setData(
                          'application/workflow-image',
                          JSON.stringify(image)
                        );
                        e.dataTransfer.effectAllowed = 'copy';
                      }}
                      onMouseDown={(e) => e.stopPropagation()}
                      onMouseUp={(e) => e.stopPropagation()}
                    />
                  </div>
                ))}
              </motion.div>
            </>
          )}
        </AnimatePresence>,
        document.body
      )}
    </>
  );
});

ImageNode.displayName = 'ImageNode';
