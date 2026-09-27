import { Errors } from "@/lib/api/errors";

interface Bucket {
  count: number;
  resetAt: number;
}

const buckets = new Map<string, Bucket>();
const MAX_TRACKED_KEYS = 10_000;

/**
 * Rate limit dạng fixed-window trong bộ nhớ. Đủ cho một instance (demo/đồ án);
 * khi scale nhiều instance cần chuyển sang Redis/Upstash.
 */
export function rateLimit(key: string, limit: number, windowMs: number, now = Date.now()): void {
  const bucket = buckets.get(key);
  if (!bucket || bucket.resetAt <= now) {
    if (buckets.size >= MAX_TRACKED_KEYS) buckets.clear();
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return;
  }
  bucket.count += 1;
  if (bucket.count > limit) {
    throw Errors.rateLimited(Math.ceil((bucket.resetAt - now) / 1000));
  }
}

export function resetRateLimit(key: string) {
  buckets.delete(key);
}

export function clientIp(req: Request): string {
  const forwarded = req.headers.get("x-forwarded-for");
  return forwarded?.split(",")[0]?.trim() || req.headers.get("x-real-ip") || "unknown";
}

export const AUTH_RATE_LIMIT = { limit: 10, windowMs: 15 * 60 * 1000 };
