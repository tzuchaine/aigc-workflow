/**
 * ComfyUI Provider 实现
 * 支持文生图、图生图、文生视频等任务
 */

import { BaseProvider } from './base.js';
import type {
  ProviderMetadata,
  ProviderTaskType,
  ParameterDefinition,
  ExecutionContext,
  ExecutionResult,
  ProviderHealth,
  ImageOutput,
} from './types.js';

export class ComfyUIProvider extends BaseProvider {
  readonly metadata: ProviderMetadata = {
    id: 'comfyui',
    name: 'ComfyUI',
    description: 'ComfyUI 本地部署或云端实例',
    version: '1.0.0',
    icon: '🎨',
    supportedTasks: ['text-to-image', 'image-to-image', 'text-to-video'],
  };

  /**
   * 配置参数定义
   */
  getConfigParameters(): ParameterDefinition[] {
    return [
      {
        name: 'endpoint',
        label: 'API 端点',
        type: 'string',
        required: true,
        placeholder: 'http://127.0.0.1:8188',
        description: 'ComfyUI 服务地址',
      },
      {
        name: 'apiKey',
        label: 'API Key',
        type: 'string',
        required: false,
        placeholder: '可选，用于云端认证',
        description: '云端实例可能需要 API Key',
      },
      {
        name: 'timeout',
        label: '超时时间 (秒)',
        type: 'number',
        required: false,
        default: 300,
        min: 10,
        max: 3600,
        description: '任务执行超时时间',
      },
    ];
  }

  /**
   * 获取任务参数定义
   */
  getTaskParameters(taskType: ProviderTaskType): ParameterDefinition[] {
    switch (taskType) {
      case 'text-to-image':
        return this.getTextToImageParameters();
      case 'image-to-image':
        return this.getImageToImageParameters();
      case 'text-to-video':
        return this.getTextToVideoParameters();
      default:
        return [];
    }
  }

  /**
   * 文生图参数
   */
  private getTextToImageParameters(): ParameterDefinition[] {
    return [
      {
        name: 'prompt',
        label: '正向提示词',
        type: 'textarea',
        required: true,
        placeholder: 'a beautiful landscape...',
        maxLength: 5000,
      },
      {
        name: 'negativePrompt',
        label: '反向提示词',
        type: 'textarea',
        required: false,
        placeholder: 'blur, low quality...',
        maxLength: 2000,
      },
      {
        name: 'width',
        label: '宽度',
        type: 'number',
        required: true,
        default: 512,
        min: 64,
        max: 2048,
        step: 64,
      },
      {
        name: 'height',
        label: '高度',
        type: 'number',
        required: true,
        default: 512,
        min: 64,
        max: 2048,
        step: 64,
      },
      {
        name: 'steps',
        label: '采样步数',
        type: 'number',
        required: true,
        default: 20,
        min: 1,
        max: 100,
      },
      {
        name: 'seed',
        label: '种子 (-1 为随机)',
        type: 'number',
        required: false,
        default: -1,
        min: -1,
        max: 2147483647,
      },
      {
        name: 'batchSize',
        label: '生成数量',
        type: 'number',
        required: false,
        default: 1,
        min: 1,
        max: 4,
      },
    ];
  }

  /**
   * 图生图参数
   */
  private getImageToImageParameters(): ParameterDefinition[] {
    return [
      {
        name: 'image',
        label: '输入图片',
        type: 'image',
        required: true,
      },
      {
        name: 'prompt',
        label: '正向提示词',
        type: 'textarea',
        required: true,
        placeholder: 'a beautiful landscape...',
        maxLength: 5000,
      },
      {
        name: 'negativePrompt',
        label: '反向提示词',
        type: 'textarea',
        required: false,
        placeholder: 'blur, low quality...',
        maxLength: 2000,
      },
      {
        name: 'denoisingStrength',
        label: '重绘幅度',
        type: 'number',
        required: true,
        default: 0.75,
        min: 0,
        max: 1,
        step: 0.05,
      },
      {
        name: 'steps',
        label: '采样步数',
        type: 'number',
        required: true,
        default: 20,
        min: 1,
        max: 100,
      },
    ];
  }

  /**
   * 文生视频参数
   */
  private getTextToVideoParameters(): ParameterDefinition[] {
    return [
      {
        name: 'prompt',
        label: '正向提示词',
        type: 'textarea',
        required: true,
        placeholder: 'a cat walking...',
        maxLength: 5000,
      },
      {
        name: 'negativePrompt',
        label: '反向提示词',
        type: 'textarea',
        required: false,
        placeholder: 'blur, distorted...',
        maxLength: 2000,
      },
      {
        name: 'frames',
        label: '帧数',
        type: 'number',
        required: true,
        default: 16,
        min: 8,
        max: 128,
      },
      {
        name: 'fps',
        label: '帧率',
        type: 'number',
        required: true,
        default: 8,
        min: 1,
        max: 60,
      },
      {
        name: 'width',
        label: '宽度',
        type: 'number',
        required: true,
        default: 512,
        min: 256,
        max: 1024,
        step: 64,
      },
      {
        name: 'height',
        label: '高度',
        type: 'number',
        required: true,
        default: 512,
        min: 256,
        max: 1024,
        step: 64,
      },
    ];
  }

  /**
   * 检查健康状态
   */
  async checkHealth(): Promise<ProviderHealth> {
    const endpoint = this.config.endpoint as string | undefined;
    if (!endpoint) {
      return {
        healthy: false,
        message: '未配置 API 端点',
      };
    }

    const startTime = Date.now();

    try {
      // 尝试访问 /system_stats 端点（ComfyUI 标准健康检查接口）
      const response = await fetch(`${endpoint}/system_stats`, {
        method: 'GET',
        signal: AbortSignal.timeout(5000), // 5秒超时
      });

      const latency = Date.now() - startTime;

      if (response.ok) {
        return {
          healthy: true,
          message: 'ComfyUI 连接正常',
          latency,
        };
      }

      return {
        healthy: false,
        message: `ComfyUI 响应异常: ${response.status} ${response.statusText}`,
        latency,
      };
    } catch (error) {
      return {
        healthy: false,
        message: `无法连接到 ComfyUI: ${error instanceof Error ? error.message : '未知错误'}`,
        latency: Date.now() - startTime,
      };
    }
  }

  /**
   * 执行任务
   */
  async execute(
    taskType: ProviderTaskType,
    context: ExecutionContext
  ): Promise<ExecutionResult> {
    const { parameters, onProgress, onLog } = context;

    // 验证配置
    const configValidation = this.validateConfig();
    if (!configValidation.valid) {
      return {
        success: false,
        error: `配置无效: ${configValidation.errors.join(', ')}`,
      };
    }

    // 验证参数
    const paramsValidation = this.validateTaskParameters(taskType, parameters);
    if (!paramsValidation.valid) {
      return {
        success: false,
        error: `参数无效: ${paramsValidation.errors.join(', ')}`,
      };
    }

    onLog('info', `开始执行 ${taskType} 任务`);
    onProgress(0, '准备提交任务');

    try {
      switch (taskType) {
        case 'text-to-image':
          return await this.executeTextToImage(parameters, context);
        case 'image-to-image':
          return await this.executeImageToImage(parameters, context);
        case 'text-to-video':
          return await this.executeTextToVideo(parameters, context);
        default:
          return {
            success: false,
            error: `不支持的任务类型: ${taskType}`,
          };
      }
    } catch (error) {
      onLog('error', `任务执行失败: ${error instanceof Error ? error.message : '未知错误'}`);
      return {
        success: false,
        error: error instanceof Error ? error.message : '未知错误',
      };
    }
  }

  /**
   * 执行文生图任务
   */
  private async executeTextToImage(
    parameters: Record<string, unknown>,
    context: ExecutionContext
  ): Promise<ExecutionResult> {
    const { onProgress, onLog } = context;
    const endpoint = this.config.endpoint as string;

    // TODO: 实际实现需要：
    // 1. 将参数转换为 ComfyUI workflow_api.json 格式
    // 2. 调用 /prompt API 提交任务
    // 3. 轮询 /history 或监听 WebSocket 获取进度
    // 4. 下载生成的图片
    // 5. 上传到 OSS（或返回 ComfyUI 的临时 URL）

    onProgress(10, '正在提交任务到 ComfyUI');
    onLog('info', `端点: ${endpoint}`);
    onLog('info', `参数: ${JSON.stringify(parameters, null, 2)}`);

    // 模拟执行（实际实现时替换）
    await this.simulateExecution(onProgress);

    // 模拟结果
    const images: ImageOutput[] = [
      {
        id: `img-${Date.now()}`,
        url: 'https://placehold.co/512x512/png?text=ComfyUI+Generated',
        width: Number(parameters.width) || 512,
        height: Number(parameters.height) || 512,
        seed: Number(parameters.seed) || -1,
      },
    ];

    onLog('info', '任务执行成功');

    return {
      success: true,
      images,
      metadata: {
        provider: 'comfyui',
        taskType: 'text-to-image',
        parameters,
      },
    };
  }

  /**
   * 执行图生图任务
   */
  private async executeImageToImage(
    parameters: Record<string, unknown>,
    context: ExecutionContext
  ): Promise<ExecutionResult> {
    const { onProgress } = context;

    // TODO: 实现图生图逻辑
    await this.simulateExecution(onProgress);

    return {
      success: true,
      images: [
        {
          id: `img-${Date.now()}`,
          url: 'https://placehold.co/512x512/png?text=Image2Image',
        },
      ],
      metadata: {
        provider: 'comfyui',
        taskType: 'image-to-image',
        parameters,
      },
    };
  }

  /**
   * 执行文生视频任务
   */
  private async executeTextToVideo(
    parameters: Record<string, unknown>,
    context: ExecutionContext
  ): Promise<ExecutionResult> {
    const { onProgress } = context;

    // TODO: 实现文生视频逻辑
    await this.simulateExecution(onProgress);

    return {
      success: true,
      videos: [
        {
          id: `video-${Date.now()}`,
          url: 'https://placehold.co/512x512.mp4',
          thumbnailUrl: 'https://placehold.co/512x512/png?text=Video',
        },
      ],
      metadata: {
        provider: 'comfyui',
        taskType: 'text-to-video',
        parameters,
      },
    };
  }

  /**
   * 模拟执行（用于测试）
   */
  private async simulateExecution(onProgress: (progress: number, message?: string) => void): Promise<void> {
    const steps = [
      { progress: 20, message: '正在初始化' },
      { progress: 40, message: '正在加载模型' },
      { progress: 60, message: '正在生成' },
      { progress: 80, message: '正在后处理' },
      { progress: 100, message: '完成' },
    ];

    for (const step of steps) {
      await new Promise((resolve) => setTimeout(resolve, 1000));
      onProgress(step.progress, step.message);
    }
  }
}
