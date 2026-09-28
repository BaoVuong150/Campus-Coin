import { DAY_MS, daysInMonth, dayRange, storageDate, toYmd, vnParts } from "@/lib/utils/date";

/**
 * Số ngày thực sự có dữ liệu trong cửa sổ [start, end): tính từ ngày có giao dịch đầu tiên của user
 * (nếu muộn hơn start). Tránh chia chi tiêu cho cả những ngày user chưa dùng app – ví dụ đăng ký ngày 20
 * thì tốc độ chi/ngày tháng này phải chia cho 11 ngày, không phải 30.
 */
export function sampleDays(start: Date, end: Date, firstActivity: Date | null): number {
  if (!firstActivity) return 0;
  const from = Math.max(start.getTime(), dayRange(toYmd(firstActivity)).start.getTime());
  return Math.max(0, Math.round((end.getTime() - from) / DAY_MS));
}

export interface AllowanceInput {
  /** Trợ cấp/thu nhập cơ bản mỗi tháng (Cài đặt). */
  allowance: number;
  /** Ngày nhận trong tháng (1–31); tháng ngắn hơn thì lùi về ngày cuối tháng. */
  payDay: number | null;
  /** User đã khai báo khoản thu định kỳ đang chạy → dùng lịch đó, không cộng trùng trợ cấp cơ bản. */
  hasRecurringIncome: boolean;
  now: Date;
}

/**
 * Trợ cấp cơ bản còn sắp nhận trong tháng (đồng bộ Cài đặt → Safe-to-Spend/dự báo) khi user chưa tạo khoản thu
 * định kỳ. Ngày nhận đã qua (kể cả hôm nay) coi như đã nhận và đã nằm trong số dư nếu user ghi lại.
 */
export function upcomingAllowance(input: AllowanceInput): { amount: number; date: Date } | null {
  if (input.hasRecurringIncome || input.allowance <= 0 || !input.payDay) return null;
  const today = vnParts(input.now);
  const payDay = Math.min(input.payDay, daysInMonth(today.year, today.month));
  if (payDay <= today.day) return null;
  return { amount: input.allowance, date: storageDate(today.year, today.month, payDay) };
}
