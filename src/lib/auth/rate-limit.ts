import { Errors } from "@/lib/api/errors";

/*
 * Rate limit dạng fixed-window.
 * - Có UPSTASH_REDIS_REST_URL + UPSTASH_REDIS_REST_TOKEN: đếm trên Redis (dùng chung cho mọi instance serverless).
 * - Không cấu hình, hoặc Redis lỗi/chậm quá 1 giây: tự chuyển sang bộ đếm trong bộ nhớ của instance hiện tại
 *   (vẫn chặn được dò mật khẩu trên từng instance, không làm sập đăng nhập khi Redis gặp sự cố).
 */

interface Bucket {
  count: number;
  resetAt: number;
}

interface Hit {
  count: number;
  /** Số mili-giây còn lại tới khi cửa sổ đếm hết hạn. */
  ttlMs: number;
}

const buckets = new Map<string, Bucket>();
const MAX_TRACKED_KEYS = 10_000;
const REDIS_TIMEOUT_MS = 1_000;
const KEY_PREFIX = "campuscoin:rl:";
let redisWarned = false;

function memoryHit(key: string, windowMs: number, now: number): Hit {
  const bucket = buckets.get(key);
  if (!bucket || bucket.resetAt <= now) {
    if (buckets.size >= MAX_TRACKED_KEYS) buckets.clear();
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return { count: 1, ttlMs: windowMs };
  }
  bucket.count += 1;
  return { count: bucket.count, ttlMs: bucket.resetAt - now };
}

function redisConfig(): { url: string; token: string } | null {
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  return url && token ? { url: url.replace(/\/+$/, ""), token } : null;
}

/** Gửi một pipeline lệnh tới Upstash REST; null nếu chưa cấu hình hoặc gặp lỗi (→ dùng bộ nhớ). */
async function redisPipeline(commands: (string | number)[][]): Promise<unknown[] | null> {
  const config = redisConfig();
  if (!config) return null;
  try {
    const response = await fetch(`${config.url}/pipeline`, {
      method: "POST",
      headers: { Authorization: `Bearer ${config.token}`, "Content-Type": "application/json" },
      body: JSON.stringify(commands),
      signal: AbortSignal.timeout(REDIS_TIMEOUT_MS),
      cache: "no-store",
    });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const results = (await response.json()) as { result?: unknown; error?: string }[];
    if (results.some((r) => r.error)) throw new Error(results.find((r) => r.error)?.error);
    return results.map((r) => r.result);
  } catch (error) {
    if (!redisWarned) console.warn("[rate-limit] Redis không khả dụng, dùng bộ đếm trong bộ nhớ:", error);
    redisWarned = true;
    return null;
  }
}

async function hit(key: string, windowMs: number, now: number): Promise<Hit> {
  const redisKey = KEY_PREFIX + key;
  // INCR + đặt hạn chỉ ở lần đầu (NX) + đọc thời gian còn lại, trong một round-trip.
  const result = await redisPipeline([
    ["INCR", redisKey],
    ["PEXPIRE", redisKey, windowMs, "NX"],
    ["PTTL", redisKey],
  ]);
  if (result && typeof result[0] === "number") {
    const ttl = typeof result[2] === "number" && result[2] > 0 ? result[2] : windowMs;
    return { count: result[0], ttlMs: ttl };
  }
  return memoryHit(key, windowMs, now);
}

export async function rateLimit(key: string, limit: number, windowMs: number, now = Date.now()): Promise<void> {
  const { count, ttlMs } = await hit(key, windowMs, now);
  if (count > limit) throw Errors.rateLimited(Math.max(1, Math.ceil(ttlMs / 1000)));
}

export async function resetRateLimit(key: string): Promise<void> {
  buckets.delete(key);
  await redisPipeline([["DEL", KEY_PREFIX + key]]);
}

export function clientIp(req: Request): string {
  const forwarded = req.headers.get("x-forwarded-for");
  return forwarded?.split(",")[0]?.trim() || req.headers.get("x-real-ip") || "unknown";
}

export const AUTH_RATE_LIMIT = { limit: 10, windowMs: 15 * 60 * 1000 };
