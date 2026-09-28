import type { CanonicalCategory } from "@/lib/finance/categorize";
import { daysInMonth, storageDate, toYmd, vnParts } from "@/lib/utils/date";

/**
 * Tỉ lệ gợi ý ngân sách khởi đầu theo thu nhập tháng (thói quen chi tiêu phổ biến của sinh viên).
 * Chỉ là gợi ý: người dùng bỏ chọn hoặc sửa số tiền trước khi tạo.
 */
export const STARTER_BUDGET_SHARES: { category: CanonicalCategory; share: number }[] = [
  { category: "food", share: 0.35 },
  { category: "transport", share: 0.1 },
  { category: "education", share: 0.1 },
  { category: "entertainment", share: 0.08 },
  { category: "shopping", share: 0.07 },
];

/** Làm tròn gợi ý về bội số 10.000 ₫ cho dễ đọc. */
const ROUND_TO = 10_000;

export function suggestStarterBudgets(monthlyIncome: number): { category: CanonicalCategory; amount: number }[] {
  if (!Number.isFinite(monthlyIncome) || monthlyIncome <= 0) return [];
  return STARTER_BUDGET_SHARES.map(({ category, share }) => ({
    category,
    amount: Math.max(ROUND_TO, Math.round((monthlyIncome * share) / ROUND_TO) * ROUND_TO),
  }));
}

/**
 * Ngày nhận trợ cấp kế tiếp (YYYY-MM-DD, giờ VN) kể từ ngày mai: ngày nhận tháng này nếu chưa tới,
 * ngược lại là tháng sau. Ngày 31 ở tháng ngắn lùi về ngày cuối tháng.
 */
export function nextPayDate(payDay: number, now = new Date()): string {
  const today = vnParts(now);
  const thisMonthDay = Math.min(payDay, daysInMonth(today.year, today.month));
  if (thisMonthDay > today.day) return toYmd(storageDate(today.year, today.month, thisMonthDay));
  const year = today.month === 12 ? today.year + 1 : today.year;
  const month = today.month === 12 ? 1 : today.month + 1;
  return toYmd(storageDate(year, month, Math.min(payDay, daysInMonth(year, month))));
}
