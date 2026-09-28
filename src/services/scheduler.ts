import { processDueRecurring } from "./recurring.service";

/** Khoảng tối thiểu giữa hai lần xử lý định kỳ "lazy" cho cùng một user. */
const MIN_INTERVAL_MS = 5 * 60 * 1000;
const lastRun = new Map<string, number>();

/**
 * Scheduler dạng lazy: khi user mở app, sinh các giao dịch định kỳ đã đến hạn.
 * Bổ sung cho cron /api/cron/recurring; an toàn khi chạy trùng vì processDueRecurring là idempotent.
 */
export async function ensureRecurringProcessed(userId: string): Promise<void> {
  const now = Date.now();
  if (now - (lastRun.get(userId) ?? 0) < MIN_INTERVAL_MS) return;
  lastRun.set(userId, now);
  try {
    await processDueRecurring(userId);
  } catch (error) {
    lastRun.delete(userId);
    console.error("[recurring] lazy processing failed", error);
  }
}
