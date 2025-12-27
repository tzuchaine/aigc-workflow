/**
 * Provider 数据获取 Hook
 */

import { useState, useEffect } from 'react';

// Provider 元数据
export interface ProviderMetadata {
  id: string;
  name: string;
  description: string;
  version: string;
  icon?: string;
  supportedTasks: ('text-to-image' | 'image-to-image' | 'text-to-video' | 'image-to-video')[];
}

// 参数定义
export interface ParameterDefinition {
  name: string;
  label: string;
  type: 'string' | 'number' | 'boolean' | 'select' | 'textarea' | 'image';
  required: boolean;
  default?: unknown;
  description?: string;
  min?: number;
  max?: number;
  step?: number;
  placeholder?: string;
  maxLength?: number;
  options?: { value: string; label: string }[];
}

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8787';

/**
 * 获取所有 Provider 列表
 */
export function useProviders() {
  const [providers, setProviders] = useState<ProviderMetadata[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch(`${API_BASE}/api/providers`)
      .then((res) => res.json())
      .then((data) => {
        setProviders(data.providers);
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message);
        setLoading(false);
      });
  }, []);

  return { providers, loading, error };
}

/**
 * 获取指定 Provider 的任务参数定义
 */
export function useTaskParameters(
  providerId: string | null,
  taskType: 'text-to-image' | 'image-to-image' | 'text-to-video' | 'image-to-video'
) {
  const [parameters, setParameters] = useState<ParameterDefinition[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!providerId) {
      setParameters([]);
      return;
    }

    setLoading(true);
    fetch(`${API_BASE}/api/providers/${providerId}/task-params?taskType=${taskType}`)
      .then((res) => res.json())
      .then((data) => {
        setParameters(data.parameters);
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message);
        setLoading(false);
      });
  }, [providerId, taskType]);

  return { parameters, loading, error };
}

/**
 * 获取 Provider 配置参数定义
 */
export function useProviderConfigParameters(providerId: string | null) {
  const [parameters, setParameters] = useState<ParameterDefinition[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!providerId) {
      setParameters([]);
      return;
    }

    setLoading(true);
    fetch(`${API_BASE}/api/providers/${providerId}/config-params`)
      .then((res) => res.json())
      .then((data) => {
        setParameters(data.parameters);
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message);
        setLoading(false);
      });
  }, [providerId]);

  return { parameters, loading, error };
}

/**
 * 设置 Provider 配置
 */
export async function setProviderConfig(providerId: string, config: Record<string, unknown>) {
  const response = await fetch(`${API_BASE}/api/providers/${providerId}/config`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ config }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || '设置配置失败');
  }

  return response.json();
}

/**
 * 检查 Provider 健康状态
 */
export async function checkProviderHealth(providerId: string) {
  const response = await fetch(`${API_BASE}/api/providers/${providerId}/health`);

  if (!response.ok) {
    throw new Error('健康检查失败');
  }

  return response.json();
}
