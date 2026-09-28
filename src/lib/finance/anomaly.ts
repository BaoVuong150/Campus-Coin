import {
  ANOMALY_CATEGORY_MULTIPLIER,
  ANOMALY_MIN_SAMPLES,
  ANOMALY_STD_MULTIPLIER,
} from "@/constants/finance";
import { mean, stdDev } from "./stats";

export interface AnomalyResult {
  unusual: boolean;
  reason: "std_dev" | "category_multiple" | null;
  typicalAmount: number;
}

/**
 * Khoản chi bất thường khi:
 *  - lớn hơn mean + 2σ của lịch sử chi tiêu cùng loại, hoặc
 *  - lớn hơn 3× mức trung bình của chính danh mục đó.
 * Chỉ đánh giá khi có đủ mẫu lịch sử để tránh cảnh báo giả với người dùng mới.
 */
export function detectAnomaly(
  amount: number,
  allExpenseHistory: number[],
  categoryHistory: number[]
): AnomalyResult {
  const typicalAmount = Math.round(mean(categoryHistory.length ? categoryHistory : allExpenseHistory));

  if (allExpenseHistory.length >= ANOMALY_MIN_SAMPLES) {
    const threshold = mean(allExpenseHistory) + ANOMALY_STD_MULTIPLIER * stdDev(allExpenseHistory);
    if (amount > threshold) return { unusual: true, reason: "std_dev", typicalAmount };
  }

  if (categoryHistory.length >= ANOMALY_MIN_SAMPLES) {
    if (amount > ANOMALY_CATEGORY_MULTIPLIER * mean(categoryHistory)) {
      return { unusual: true, reason: "category_multiple", typicalAmount };
    }
  }

  return { unusual: false, reason: null, typicalAmount };
}
