/**
 * ComfyUI 节点的配置内容
 * 支持 comfy-image 和 comfy-video 两种类型
 */

import { memo, useState, useCallback } from 'react';
import { useReactFlow } from 'reactflow';
import type { WorkflowNodeData } from '../../types';

interface ComfyNodeConfigProps {
  nodeId: string;
  nodeType: 'comfy-image' | 'comfy-video';
  nodeData: WorkflowNodeData;
}

// 常用分辨率预设
const RESOLUTION_PRESETS = [
  { label: '512×512 (小方形)', value: { width: 512, height: 512 } },
  { label: '1024×1024 (方形)', value: { width: 1024, height: 1024 } },
  { label: '1920×1080 (横屏)', value: { width: 1920, height: 1080 } },
  { label: '1080×1920 (竖屏)', value: { width: 1080, height: 1920 } },
];

export const ComfyNodeConfig = memo(({
  nodeId,
  nodeType,
  nodeData,
}: ComfyNodeConfigProps) => {
  const reactFlow = useReactFlow();

  // 当前配置
  const currentParams = (nodeData.taskParams as Record<string, unknown>) || {};

  // 状态
  const [prompt, setPrompt] = useState<string>((currentParams.prompt as string) || '');
  const [negativePrompt, setNegativePrompt] = useState<string>((currentParams.negativePrompt as string) || '');
  const [selectedResolution, setSelectedResolution] = useState(
    currentParams.width && currentParams.height
      ? `${currentParams.width}×${currentParams.height}`
      : '512×512'
  );
  const [steps, setSteps] = useState<number>((currentParams.steps as number) || 20);

  // 视频参数
  const [frames, setFrames] = useState<number>((currentParams.frames as number) || 16);
  const [fps, setFps] = useState<number>((currentParams.fps as number) || 8);

  // 保存配置到节点
  const handleSave = useCallback(() => {
    if (!prompt.trim()) {
      alert('请输入正向提示词');
      return;
    }

    // 解析分辨率
    const selectedPreset = RESOLUTION_PRESETS.find(r => `${r.value.width}×${r.value.height}` === selectedResolution);
    const resolution = selectedPreset?.value || { width: 512, height: 512 };

    const params: Record<string, unknown> = {
      prompt: prompt.trim(),
      negativePrompt: negativePrompt.trim(),
      width: resolution.width,
      height: resolution.height,
      steps,
    };

    // 视频特有参数
    if (nodeType === 'comfy-video') {
      params.frames = frames;
      params.fps = fps;
    }

    // 更新节点数据
    reactFlow.setNodes((nodes) =>
      nodes.map((node) => {
        if (node.id === nodeId) {
          return {
            ...node,
            data: {
              ...node.data,
              taskParams: params,
            },
            selected: false, // 保存后自动关闭面板
          };
        }
        return node;
      })
    );
  }, [nodeId, prompt, negativePrompt, selectedResolution, steps, frames, fps, nodeType, reactFlow]);

  // 取消
  const handleCancel = useCallback(() => {
    reactFlow.setNodes((nodes) =>
      nodes.map((node) => {
        if (node.id === nodeId) {
          return { ...node, selected: false };
        }
        return node;
      })
    );
  }, [nodeId, reactFlow]);

  return (
    <div className="flex h-full flex-col px-4 py-3">
      {/* 顶部：分辨率 + 步数 */}
      <div className="mb-4 flex gap-3">
        {/* 分辨率预设 */}
        <div className="flex-[2]">
          <label className="mb-1.5 block text-xs font-medium text-text-secondary">
            分辨率
          </label>
          <select
            value={selectedResolution}
            onChange={(e) => setSelectedResolution(e.target.value)}
            className="w-full rounded-lg border border-components-input-border bg-components-input-bg-normal px-3 py-2 text-sm text-text-primary transition-colors hover:bg-state-base-hover focus:border-components-input-border-focus focus:bg-components-input-bg-active focus:outline-none focus:ring-1 focus:ring-components-input-border-focus"
          >
            {RESOLUTION_PRESETS.map((preset) => (
              <option key={preset.label} value={`${preset.value.width}×${preset.value.height}`}>
                {preset.label}
              </option>
            ))}
          </select>
        </div>

        {/* 采样步数 */}
        <div className="flex-1">
          <label className="mb-1.5 block text-xs font-medium text-text-secondary">
            步数: {steps}
          </label>
          <input
            type="range"
            value={steps}
            onChange={(e) => setSteps(Number(e.target.value))}
            min={1}
            max={100}
            step={1}
            className="w-full accent-components-button-primary-bg"
          />
        </div>
      </div>

      {/* 视频参数（仅视频节点） */}
      {nodeType === 'comfy-video' && (
        <div className="mb-4 flex gap-3">
          <div className="flex-1">
            <label className="mb-1.5 block text-xs font-medium text-text-secondary">
              帧数
            </label>
            <input
              type="number"
              value={frames}
              onChange={(e) => setFrames(Number(e.target.value))}
              min={1}
              max={120}
              step={1}
              className="w-full rounded-lg border border-components-input-border bg-components-input-bg-normal px-3 py-2 text-sm text-text-primary transition-colors hover:bg-state-base-hover focus:border-components-input-border-focus focus:bg-components-input-bg-active focus:outline-none focus:ring-1 focus:ring-components-input-border-focus"
            />
          </div>
          <div className="flex-1">
            <label className="mb-1.5 block text-xs font-medium text-text-secondary">
              帧率 (FPS)
            </label>
            <input
              type="number"
              value={fps}
              onChange={(e) => setFps(Number(e.target.value))}
              min={1}
              max={60}
              step={1}
              className="w-full rounded-lg border border-components-input-border bg-components-input-bg-normal px-3 py-2 text-sm text-text-primary transition-colors hover:bg-state-base-hover focus:border-components-input-border-focus focus:bg-components-input-bg-active focus:outline-none focus:ring-1 focus:ring-components-input-border-focus"
            />
          </div>
        </div>
      )}

      {/* 中部：占位 */}
      <div className="flex-1" />

      {/* 底部：Prompt */}
      <div className="mb-3">
        <label className="mb-1.5 block text-xs font-medium text-text-secondary">
          正向提示词
        </label>
        <textarea
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder="a beautiful landscape with mountains and lake..."
          className="w-full resize-none rounded-lg border border-components-input-border bg-components-input-bg-normal px-3 py-2 text-sm text-text-primary placeholder:text-text-placeholder transition-colors hover:bg-state-base-hover focus:border-components-input-border-focus focus:bg-components-input-bg-active focus:outline-none focus:ring-1 focus:ring-components-input-border-focus"
          rows={4}
        />
      </div>

      <div className="mb-4">
        <label className="mb-1.5 block text-xs font-medium text-text-secondary">
          反向提示词
        </label>
        <textarea
          value={negativePrompt}
          onChange={(e) => setNegativePrompt(e.target.value)}
          placeholder="blur, low quality, distorted..."
          className="w-full resize-none rounded-lg border border-components-input-border bg-components-input-bg-normal px-3 py-2 text-sm text-text-primary placeholder:text-text-placeholder transition-colors hover:bg-state-base-hover focus:border-components-input-border-focus focus:bg-components-input-bg-active focus:outline-none focus:ring-1 focus:ring-components-input-border-focus"
          rows={3}
        />
      </div>

      {/* 底部按钮 */}
      <div className="flex items-center justify-end gap-2 border-t border-neutral-200 pt-3">
        <button
          type="button"
          onClick={handleCancel}
          className="rounded-md border border-neutral-200 px-3 py-1.5 text-sm text-neutral-700 hover:bg-neutral-50"
        >
          取消
        </button>
        <button
          type="button"
          onClick={handleSave}
          className="rounded-md bg-blue-600 px-3 py-1.5 text-sm font-medium text-white shadow hover:bg-blue-700"
        >
          保存配置
        </button>
      </div>
    </div>
  );
});

ComfyNodeConfig.displayName = 'ComfyNodeConfig';
