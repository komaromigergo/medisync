import { Redis } from "@upstash/redis";

export interface Db {
  get(key: string): Promise<unknown>;
  set(key: string, value: unknown): Promise<void>;
  incr(key: string): Promise<number>;
}

const mem = new Map<string, unknown>();
let upstash: Redis | null | undefined;

/** Upstash Redis (Vercel Storage), különben null. Teszthez: MEDISYNC_MEMORY_DB=1 (memória, csak egy szerverpéldányon). */
export function getDb(): Db | null {
  if (process.env.MEDISYNC_MEMORY_DB === "1") {
    return {
      get: async (k) => mem.get(k) ?? null,
      set: async (k, v) => { mem.set(k, JSON.parse(JSON.stringify(v))); },
      incr: async (k) => { const n = Number(mem.get(k) ?? 0) + 1; mem.set(k, n); return n; },
    };
  }
  const url = process.env.UPSTASH_REDIS_REST_URL ?? process.env.KV_REST_API_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN ?? process.env.KV_REST_API_TOKEN;
  if (!url || !token) return null;
  if (upstash === undefined) upstash = new Redis({ url, token });
  const r = upstash!;
  return {
    get: (k) => r.get(k),
    set: async (k, v) => { await r.set(k, v); },
    incr: (k) => r.incr(k),
  };
}
