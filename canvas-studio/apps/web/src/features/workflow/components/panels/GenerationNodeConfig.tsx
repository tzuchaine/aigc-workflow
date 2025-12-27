/**
 * 图片/视频生成节点的配置内容
 * 简洁模式：分辨率预设 + 引擎选择 + Prompt 输入
 * 节点完全控制内容区，包括底部按钮
 */

import { memo, useState, useCallback, useMemo } from 'react';
import { Loader2 } from 'lucide-react';
import { useReactFlow } from 'reactflow';
import { useProviders } from '../../hooks/useProviders';
import type { WorkflowNodeData } from '../../types';
import { Select } from '@/components/Select';

interface GenerationNodeConfigProps {
  nodeId: string;
  nodeType: 'image-generation' | 'video-generation';
  nodeData: WorkflowNodeData;
}

// 常用分辨率预设
const RESOLUTION_PRESETS = {
  image: [
    { label: '1024×1024 (方形)', value: { width: 1024, height: 1024 } },
    { label: '1920×1080 (横屏)', value: { width: 1920, height: 1080 } },
    { label: '1080×1920 (竖屏)', value: { width: 1080, height: 1920 } },
    { label: '512×512 (小方形)', value: { width: 512, height: 512 } },
  ],
  video: [
    { label: '1920×1080 (横屏)', value: { width: 1920, height: 1080 } },
    { label: '1080×1920 (竖屏)', value: { width: 1080, height: 1920 } },
    { label: '1280×720 (HD)', value: { width: 1280, height: 720 } },
    { label: '720×1280 (HD竖屏)', value: { width: 720, height: 1280 } },
  ],
};

export const GenerationNodeConfig = memo(({
  nodeId,
  nodeType,
  nodeData,
}: GenerationNodeConfigProps) => {
  const reactFlow = useReactFlow();
  const { providers, loading: providersLoading } = useProviders();

  // 当前配置
  const currentProviderId = (nodeData.providerId as string) || 'comfyui';
  const currentParams = (nodeData.taskParams as Record<string, unknown>) || {};

  // 状态
  const [selectedProviderId, setSelectedProviderId] = useState(currentProviderId);
  const [prompt, setPrompt] = useState<string>((currentParams.prompt as string) || '');
  const [selectedResolution, setSelectedResolution] = useState(
    currentParams.width && currentParams.height
      ? `${currentParams.width}×${currentParams.height}`
      : nodeType === 'image-generation' ? '1024×1024' : '1920×1080'
  );

  // 任务类型和分辨率预设
  const taskType = nodeType === 'image-generation' ? 'text-to-image' : 'text-to-video';
  const resolutionPresets = nodeType === 'image-generation' ? RESOLUTION_PRESETS.image : RESOLUTION_PRESETS.video;

  // 转换为 Select 组件所需格式
  const resolutionOptions = useMemo(
    () =>
      resolutionPresets.map((preset) => ({
        label: preset.label,
        value: `${preset.value.width}×${preset.value.height}`,
      })),
    [resolutionPresets]
  );

  const providerOptions = useMemo(
    () =>
      providers
        .filter((p) => p.supportedTasks.includes(taskType))
        .map((p) => ({
          label: p.name,
          value: p.id,
        })),
    [providers, taskType]
  );

  // 保存配置到节点
  const handleSave = useCallback(() => {
    if (!prompt.trim()) {
      alert('请输入提示词');
      return;
    }

    // 解析分辨率
    const selectedPreset = resolutionPresets.find(r => `${r.value.width}×${r.value.height}` === selectedResolution);
    const resolution = selectedPreset?.value || { width: 1024, height: 1024 };

    const params: Record<string, unknown> = {
      prompt: prompt.trim(),
      width: resolution.width,
      height: resolution.height,
      steps: 20,
    };

    if (nodeType === 'video-generation') {
      params.frames = 16;
      params.fps = 8;
    }

    // 更新节点数据
    reactFlow.setNodes((nodes) =>
      nodes.map((node) => {
        if (node.id === nodeId) {
          return {
            ...node,
            data: {
              ...node.data,
              providerId: selectedProviderId,
              taskParams: params,
            },
            selected: false, // 保存后自动关闭面板
          };
        }
        return node;
      })
    );
  }, [nodeId, selectedProviderId, prompt, selectedResolution, nodeType, resolutionPresets, reactFlow]);

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
      {/* 顶部：分辨率 + 引擎 */}
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
            {resolutionPresets.map((preset) => (
              <option key={preset.label} value={`${preset.value.width}×${preset.value.height}`}>
                {preset.label}
              </option>
            ))}
          </select>
        </div>

        {/* 引擎选择 */}
        <div className="flex-1">
          <label className="mb-1.5 block text-xs font-medium text-text-secondary">
            引擎
          </label>
          {providersLoading ? (
            <div className="flex h-[38px] items-center justify-center rounded-lg border border-components-input-border bg-components-input-bg-normal text-xs text-text-tertiary">
              <Loader2 size={14} className="animate-spin" />
            </div>
          ) : (
            <select
              value={selectedProviderId}
              onChange={(e) => setSelectedProviderId(e.target.value)}
              className="w-full rounded-lg border border-components-input-border bg-components-input-bg-normal px-3 py-2 text-sm text-text-primary transition-colors hover:bg-state-base-hover focus:border-components-input-border-focus focus:bg-components-input-bg-active focus:outline-none focus:ring-1 focus:ring-components-input-border-focus"
            >
              {providers
                .filter((p) => p.supportedTasks.includes(taskType))
                .map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
            </select>
          )}
        </div>
      </div>

      {/* 中部：占位 */}
      <div className="flex-1" />

      {/* 底部：Prompt */}
      <div className="mb-4">
        <label className="mb-1.5 block text-xs font-medium text-text-secondary">
          提示词
        </label>
        <textarea
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder={nodeType === 'image-generation'
            ? 'a beautiful landscape with mountains and lake...'
            : 'a cat walking in the garden...'
          }
          className="w-full resize-none rounded-lg border border-components-input-border bg-components-input-bg-normal px-3 py-2 text-sm text-text-primary placeholder:text-text-placeholder transition-colors hover:bg-state-base-hover focus:border-components-input-border-focus focus:bg-components-input-bg-active focus:outline-none focus:ring-1 focus:ring-components-input-border-focus"
          rows={4}
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

GenerationNodeConfig.displayName = 'GenerationNodeConfig';
