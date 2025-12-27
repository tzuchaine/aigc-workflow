# Provider 系统使用指南

## 概述

Provider 系统允许用户配置和使用不同的 AI 生成服务（如 ComfyUI、DALL-E 等）。

## 架构设计

```
BaseProvider (抽象基类)
  ├── ComfyUIProvider
  ├── DALLEProvider (待实现)
  └── StableDiffusionProvider (待实现)
```

### 核心组件

1. **BaseProvider** (`providers/base.ts`)
   - 抽象基类，定义通用接口
   - 提供配置管理、参数验证等公共方法

2. **ComfyUIProvider** (`providers/comfyui.ts`)
   - ComfyUI 实现
   - 支持文生图、图生图、文生视频

3. **ProviderRegistry** (`providers/registry.ts`)
   - 单例注册中心
   - 管理所有 Provider 实例

4. **Provider Routes** (`routes/provider.ts`)
   - RESTful API 接口
   - 提供查询、配置、健康检查等功能

## API 接口

### 1. 查询所有 Provider

```http
GET /api/providers
```

响应示例：
```json
{
  "providers": [
    {
      "id": "comfyui",
      "name": "ComfyUI",
      "description": "ComfyUI 本地部署或云端实例",
      "version": "1.0.0",
      "icon": "🎨",
      "supportedTasks": ["text-to-image", "image-to-image", "text-to-video"]
    }
  ]
}
```

### 2. 获取 Provider 详情

```http
GET /api/providers/:providerId
```

响应示例：
```json
{
  "id": "comfyui",
  "name": "ComfyUI",
  "description": "ComfyUI 本地部署或云端实例",
  "version": "1.0.0",
  "icon": "🎨",
  "supportedTasks": ["text-to-image", "image-to-image", "text-to-video"],
  "configParameters": [
    {
      "name": "endpoint",
      "label": "API 端点",
      "type": "string",
      "required": true,
      "placeholder": "http://127.0.0.1:8188",
      "description": "ComfyUI 服务地址"
    },
    {
      "name": "apiKey",
      "label": "API Key",
      "type": "string",
      "required": false,
      "placeholder": "可选，用于云端认证"
    }
  ]
}
```

### 3. 获取任务参数定义

```http
GET /api/providers/:providerId/task-params?taskType=text-to-image
```

响应示例：
```json
{
  "taskType": "text-to-image",
  "parameters": [
    {
      "name": "prompt",
      "label": "正向提示词",
      "type": "textarea",
      "required": true,
      "placeholder": "a beautiful landscape...",
      "maxLength": 5000
    },
    {
      "name": "width",
      "label": "宽度",
      "type": "number",
      "required": true,
      "default": 512,
      "min": 64,
      "max": 2048,
      "step": 64
    }
  ]
}
```

### 4. 设置 Provider 配置

```http
POST /api/providers/:providerId/config
Content-Type: application/json

{
  "config": {
    "endpoint": "http://127.0.0.1:8188",
    "apiKey": "optional-api-key",
    "timeout": 300
  }
}
```

响应示例：
```json
{
  "success": true,
  "config": {
    "endpoint": "http://127.0.0.1:8188",
    "apiKey": "optional-api-key",
    "timeout": 300
  }
}
```

### 5. 健康检查

```http
GET /api/providers/:providerId/health
```

响应示例：
```json
{
  "providerId": "comfyui",
  "healthy": true,
  "message": "ComfyUI 连接正常",
  "latency": 123
}
```

## 扩展 Provider

### 创建新 Provider

1. 创建类文件 `providers/my-provider.ts`：

```typescript
import { BaseProvider } from './base.js';
import type { ProviderMetadata, /* ... */ } from './types.js';

export class MyProvider extends BaseProvider {
  readonly metadata: ProviderMetadata = {
    id: 'my-provider',
    name: 'My Provider',
    description: '自定义 Provider',
    version: '1.0.0',
    supportedTasks: ['text-to-image'],
  };

  getConfigParameters(): ParameterDefinition[] {
    return [
      {
        name: 'apiKey',
        label: 'API Key',
        type: 'string',
        required: true,
      },
    ];
  }

  getTaskParameters(taskType: ProviderTaskType): ParameterDefinition[] {
    // 返回任务参数定义
    return [];
  }

  async checkHealth(): Promise<ProviderHealth> {
    // 实现健康检查
    return { healthy: true };
  }

  async execute(taskType: ProviderTaskType, context: ExecutionContext): Promise<ExecutionResult> {
    // 实现任务执行
    return { success: true };
  }
}
```

2. 在 `providers/registry.ts` 中注册：

```typescript
import { MyProvider } from './my-provider.js';

private constructor() {
  this.registerProvider(new ComfyUIProvider());
  this.registerProvider(new MyProvider()); // 新增
}
```

## 前端集成

前端可以通过以下步骤集成 Provider：

1. 查询可用 Provider 列表
2. 获取 Provider 配置参数定义，渲染配置表单
3. 用户填写配置后，调用设置接口
4. 获取任务参数定义，渲染任务表单
5. 用户执行任务时，将 providerId 和参数传递给后端

## 待完成事项

- [ ] 将 Provider 配置持久化到数据库
- [ ] 在 Worker 中集成 Provider 执行
- [ ] 实现 ComfyUI 的真实 API 对接
- [ ] 添加更多 Provider（DALL-E、Stable Diffusion 等）
- [ ] 支持用户上传自定义 ComfyUI workflow_api.json
