import { evaluatePeriodicRewards } from "./points.service";
import { processDueRecurring } from "./recurring.service";
import { snapshotMonthlyInsights } from "./tips.service";
import { errorSummary, logEvent } from "@/lib/observability/log";

/** Khoảng tối thiểu giữa hai lần đồng bộ "lazy" cho cùng một user (mỗi instance). */
const MIN_INTERVAL_MS = 5 * 60 * 1000;
const lastRun = new Map<string, number>();

export interface SyncResult {
  /** Số giao dịch định kỳ vừa được sinh. */
  created: number;
  /** Số phần thưởng điểm vừa được cộng (tuần giữ ngân sách, tháng đạt tiết kiệm). */
  awarded: number;
  skipped: boolean;
}

/**
 * Đồng bộ dữ liệu phát sinh theo thời gian khi user mở app: sinh giao dịch định kỳ đến hạn, cộng điểm
 * cho các kỳ đã kết thúc và lưu nhận định của tháng. Chỉ gọi từ POST /api/sync – các API GET không ghi dữ liệu.
 * An toàn khi chạy trùng/song song: cả hai bước đều idempotent (unique key + cập nhật có điều kiện).
 */
export async function syncUserData(userId: string, now = new Date()): Promise<SyncResult> {
  const nowMs = now.getTime();
  if (nowMs - (lastRun.get(userId) ?? 0) < MIN_INTERVAL_MS) return { created: 0, awarded: 0, skipped: true };
  lastRun.set(userId, nowMs);
  try {
    const created = await processDueRecurring(userId, now);
    const awarded = await evaluatePeriodicRewards(userId, now);
    // Lưu ảnh chụp nhận định tháng này (lịch sử – SRS 3.7). Lỗi ở bước phụ này không làm hỏng đồng bộ.
    await snapshotMonthlyInsights(userId, now).catch((error) =>
      logEvent("warn", "api.unexpected_error", { step: "insight_snapshot", reason: errorSummary(error) })
    );
    return { created, awarded, skipped: false };
  } catch (error) {
    lastRun.delete(userId);
    throw error;
  }
}
