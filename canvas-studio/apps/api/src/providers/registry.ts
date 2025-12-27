/**
 * Provider 注册中心
 * 管理所有可用的 Provider 实例
 */

import { BaseProvider } from './base.js';
import { ComfyUIProvider } from './comfyui.js';
import type { ProviderMetadata, ProviderConfig } from './types.js';

export class ProviderRegistry {
  private static instance: ProviderRegistry | null = null;
  private providers: Map<string, BaseProvider> = new Map();

  private constructor() {
    // 注册内置 Providers
    this.registerProvider(new ComfyUIProvider());

    // 后续可注册其他 Provider:
    // this.registerProvider(new DALLEProvider());
    // this.registerProvider(new StableDiffusionProvider());
  }

  /**
   * 获取单例实例
   */
  static getInstance(): ProviderRegistry {
    if (!ProviderRegistry.instance) {
      ProviderRegistry.instance = new ProviderRegistry();
    }
    return ProviderRegistry.instance;
  }

  /**
   * 注册 Provider
   */
  registerProvider(provider: BaseProvider): void {
    if (this.providers.has(provider.id)) {
      console.warn(`Provider ${provider.id} 已注册，将被覆盖`);
    }
    this.providers.set(provider.id, provider);
    console.log(`✓ Provider 注册成功: ${provider.name} (${provider.id})`);
  }

  /**
   * 获取所有 Provider 元数据列表
   */
  listProviders(): ProviderMetadata[] {
    return Array.from(this.providers.values()).map((p) => p.metadata);
  }

  /**
   * 获取指定 Provider 实例
   */
  getProvider(providerId: string): BaseProvider | undefined {
    return this.providers.get(providerId);
  }

  /**
   * 检查 Provider 是否存在
   */
  hasProvider(providerId: string): boolean {
    return this.providers.has(providerId);
  }

  /**
   * 为 Provider 设置配置
   */
  setProviderConfig(providerId: string, config: ProviderConfig): boolean {
    const provider = this.getProvider(providerId);
    if (!provider) {
      return false;
    }
    provider.setConfig(config);
    return true;
  }

  /**
   * 获取 Provider 配置
   */
  getProviderConfig(providerId: string): ProviderConfig | undefined {
    const provider = this.getProvider(providerId);
    return provider?.getConfig();
  }

  /**
   * 验证 Provider 配置
   */
  validateProviderConfig(providerId: string): { valid: boolean; errors: string[] } | undefined {
    const provider = this.getProvider(providerId);
    return provider?.validateConfig();
  }

  /**
   * 检查 Provider 健康状态
   */
  async checkProviderHealth(providerId: string) {
    const provider = this.getProvider(providerId);
    if (!provider) {
      return {
        healthy: false,
        message: 'Provider 不存在',
      };
    }
    return await provider.checkHealth();
  }
}

// 导出单例获取函数
export function getProviderRegistry(): ProviderRegistry {
  return ProviderRegistry.getInstance();
}
