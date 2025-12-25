import { z } from "zod";
import dotenv from "dotenv";
import { fileURLToPath } from "node:url";
import { resolve, isAbsolute } from "node:path";

const repoRoot = resolve(fileURLToPath(new URL(".", import.meta.url)), "../../../");
dotenv.config({ path: resolve(repoRoot, ".env") });

const EnvSchema = z.object({
  API_PORT: z.coerce.number().int().positive().default(8787),
  API_HOST: z.string().default("0.0.0.0"),
  REDIS_URL: z.string().default("redis://localhost:6379"),
  DB_PATH: z.string().default("./data/app.sqlite"),
});

export type Env = z.infer<typeof EnvSchema>;

export function loadEnv(): Env {
  const env = EnvSchema.parse(process.env);
  return {
    ...env,
    DB_PATH: isAbsolute(env.DB_PATH) ? env.DB_PATH : resolve(repoRoot, env.DB_PATH),
  };
}
