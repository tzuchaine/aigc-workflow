/**
 * Provider 基类
 * 所有具体 Provider（如 ComfyUI, DALL-E 等）都需要继承此类
 */

import type {
  ProviderMetadata,
  ProviderConfig,
  ProviderTaskType,
  ParameterDefinition,
  ExecutionContext,
  ExecutionResult,
  ProviderHealth,
} from './types.js';

export abstract class BaseProvider {
  // Provider 元数据（子类必须实现）
  abstract readonly metadata: ProviderMetadata;

  // 当前配置
  protected config: ProviderConfig = {};

  /**
   * 获取 Provider ID
   */
  get id(): string {
    return this.metadata.id;
  }

  /**
   * 获取 Provider 名称
   */
  get name(): string {
    return this.metadata.name;
  }

  /**
   * 检查是否支持指定任务类型
   */
  supportsTask(taskType: ProviderTaskType): boolean {
    return this.metadata.supportedTasks.includes(taskType);
  }

  /**
   * 设置配置
   */
  setConfig(config: ProviderConfig): void {
    this.config = { ...this.config, ...config };
    this.onConfigChanged();
  }

  /**
   * 获取当前配置
   */
  getConfig(): ProviderConfig {
    return { ...this.config };
  }

  /**
   * 配置变更钩子（子类可覆盖）
   */
  protected onConfigChanged(): void {
    // 默认空实现，子类可覆盖
  }

  /**
   * 获取配置参数定义（用于 UI 渲染配置表单）
   * 子类必须实现
   */
  abstract getConfigParameters(): ParameterDefinition[];

  /**
   * 获取指定任务类型的输入参数定义（用于 UI 渲染任务表单）
   * 子类必须实现
   */
  abstract getTaskParameters(taskType: ProviderTaskType): ParameterDefinition[];

  /**
   * 验证配置是否有效
   */
  validateConfig(): { valid: boolean; errors: string[] } {
    const errors: string[] = [];
    const configParams = this.getConfigParameters();

    for (const param of configParams) {
      if (param.required) {
        const value = this.config[param.name];
        if (value === undefined || value === null || value === '') {
          errors.push(`配置项 "${param.label}" 是必填的`);
        }
      }
    }

    return { valid: errors.length === 0, errors };
  }

  /**
   * 验证任务参数是否有效
   */
  validateTaskParameters(
    taskType: ProviderTaskType,
    parameters: Record<string, unknown>
  ): { valid: boolean; errors: string[] } {
    const errors: string[] = [];
    const taskParams = this.getTaskParameters(taskType);

    for (const param of taskParams) {
      const value = parameters[param.name];

      // 必填检查
      if (param.required && (value === undefined || value === null || value === '')) {
        errors.push(`参数 "${param.label}" 是必填的`);
        continue;
      }

      // 跳过可选且未填写的参数
      if (value === undefined || value === null) continue;

      // 类型检查
      if (param.type === 'number') {
        const numValue = Number(value);
        if (isNaN(numValue)) {
          errors.push(`参数 "${param.label}" 必须是数字`);
        } else {
          if (param.min !== undefined && numValue < param.min) {
            errors.push(`参数 "${param.label}" 不能小于 ${param.min}`);
          }
          if (param.max !== undefined && numValue > param.max) {
            errors.push(`参数 "${param.label}" 不能大于 ${param.max}`);
          }
        }
      }

      if ((param.type === 'string' || param.type === 'textarea') && typeof value === 'string') {
        if (param.maxLength !== undefined && value.length > param.maxLength) {
          errors.push(`参数 "${param.label}" 长度不能超过 ${param.maxLength}`);
        }
      }

      if (param.type === 'select' && param.options) {
        const validValues = param.options.map(o => o.value);
        if (!validValues.includes(String(value))) {
          errors.push(`参数 "${param.label}" 的值无效`);
        }
      }
    }

    return { valid: errors.length === 0, errors };
  }

  /**
   * 检查 Provider 健康状态
   * 子类必须实现
   */
  abstract checkHealth(): Promise<ProviderHealth>;

  /**
   * 执行任务
   * 子类必须实现
   */
  abstract execute(
    taskType: ProviderTaskType,
    context: ExecutionContext
  ): Promise<ExecutionResult>;

  /**
   * 取消执行中的任务（可选实现）
   */
  async cancel(runId: string): Promise<boolean> {
    // 默认返回 false，表示不支持取消
    // 子类可覆盖实现取消逻辑
    console.warn(`Provider ${this.id} 不支持取消任务: ${runId}`);
    return false;
  }

  /**
   * 序列化 Provider 信息（用于 API 返回）
   */
  toJSON(): ProviderMetadata & { configParameters: ParameterDefinition[] } {
    return {
      ...this.metadata,
      configParameters: this.getConfigParameters(),
    };
  }
}
