import { resolve } from "node:path";
import { createFileStore } from "./file.js";
import { tryCreateSqliteStore } from "./sqlite.js";
import type { Store } from "./types.js";

function toJsonPath(dbPath: string): string {
  if (dbPath.toLowerCase().endsWith(".sqlite")) return dbPath.slice(0, -".sqlite".length) + ".json";
  if (dbPath.toLowerCase().endsWith(".db")) return dbPath.slice(0, -".db".length) + ".json";
  return dbPath + ".json";
}

export async function openStore(dbPath: string, logger: { warn: (msg: string) => void }): Promise<Store> {
  try {
    const store = await tryCreateSqliteStore(dbPath);
    store.migrate();
    return store;
  } catch (err) {
    const jsonPath = toJsonPath(dbPath);
    logger.warn(`SQLite 不可用，降级为文件存储：${resolve(jsonPath)}`);
    const store = createFileStore(jsonPath);
    store.migrate();
    return store;
  }
}

