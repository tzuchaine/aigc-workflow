/**
 * Provider API 路由
 * 用于查询、配置和测试 Provider
 */

import type { FastifyInstance } from "fastify";
import { z } from "zod";
import { getProviderRegistry } from "../providers/index.js";

const SetConfigBody = z.object({
  config: z.record(z.any()),
});

const GetTaskParamsQuery = z.object({
  taskType: z.enum(["text-to-image", "image-to-image", "text-to-video", "image-to-video"]),
});

export async function registerProviderRoutes(app: FastifyInstance) {
  const registry = getProviderRegistry();

  /**
   * 获取所有可用的 Provider 列表
   */
  app.get("/api/providers", async () => {
    return {
      providers: registry.listProviders(),
    };
  });

  /**
   * 获取指定 Provider 详情
   */
  app.get<{ Params: { providerId: string } }>(
    "/api/providers/:providerId",
    async (req, reply) => {
      const { providerId } = req.params;
      const provider = registry.getProvider(providerId);

      if (!provider) {
        return reply.code(404).send({
          code: "PROVIDER_NOT_FOUND",
          message: "Provider 不存在",
        });
      }

      return provider.toJSON();
    }
  );

  /**
   * 获取 Provider 配置参数定义
   */
  app.get<{ Params: { providerId: string } }>(
    "/api/providers/:providerId/config-params",
    async (req, reply) => {
      const { providerId } = req.params;
      const provider = registry.getProvider(providerId);

      if (!provider) {
        return reply.code(404).send({
          code: "PROVIDER_NOT_FOUND",
          message: "Provider 不存在",
        });
      }

      return {
        parameters: provider.getConfigParameters(),
      };
    }
  );

  /**
   * 获取 Provider 任务参数定义
   */
  app.get<{
    Params: { providerId: string };
    Querystring: { taskType: string };
  }>(
    "/api/providers/:providerId/task-params",
    async (req, reply) => {
      const { providerId } = req.params;
      const query = GetTaskParamsQuery.parse(req.query);

      const provider = registry.getProvider(providerId);

      if (!provider) {
        return reply.code(404).send({
          code: "PROVIDER_NOT_FOUND",
          message: "Provider 不存在",
        });
      }

      if (!provider.supportsTask(query.taskType)) {
        return reply.code(400).send({
          code: "TASK_NOT_SUPPORTED",
          message: `Provider 不支持任务类型: ${query.taskType}`,
        });
      }

      return {
        taskType: query.taskType,
        parameters: provider.getTaskParameters(query.taskType),
      };
    }
  );

  /**
   * 设置 Provider 配置
   */
  app.post<{ Params: { providerId: string } }>(
    "/api/providers/:providerId/config",
    async (req, reply) => {
      const { providerId } = req.params;
      const body = SetConfigBody.parse(req.body);

      const success = registry.setProviderConfig(providerId, body.config);

      if (!success) {
        return reply.code(404).send({
          code: "PROVIDER_NOT_FOUND",
          message: "Provider 不存在",
        });
      }

      // 验证配置
      const validation = registry.validateProviderConfig(providerId);
      if (!validation?.valid) {
        return reply.code(400).send({
          code: "INVALID_CONFIG",
          message: "配置无效",
          errors: validation?.errors || [],
        });
      }

      return {
        success: true,
        config: registry.getProviderConfig(providerId),
      };
    }
  );

  /**
   * 获取 Provider 当前配置
   */
  app.get<{ Params: { providerId: string } }>(
    "/api/providers/:providerId/config",
    async (req, reply) => {
      const { providerId } = req.params;
      const config = registry.getProviderConfig(providerId);

      if (!config) {
        return reply.code(404).send({
          code: "PROVIDER_NOT_FOUND",
          message: "Provider 不存在",
        });
      }

      return {
        providerId,
        config,
      };
    }
  );

  /**
   * 检查 Provider 健康状态
   */
  app.get<{ Params: { providerId: string } }>(
    "/api/providers/:providerId/health",
    async (req, reply) => {
      const { providerId } = req.params;

      if (!registry.hasProvider(providerId)) {
        return reply.code(404).send({
          code: "PROVIDER_NOT_FOUND",
          message: "Provider 不存在",
        });
      }

      const health = await registry.checkProviderHealth(providerId);

      return {
        providerId,
        ...health,
      };
    }
  );
}
