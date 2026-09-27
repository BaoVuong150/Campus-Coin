import type { RecurringFrequency } from "@/constants/finance";
import { DAY_MS, daysInMonth, monthRange, storageDate, toYmd, vnParts } from "@/lib/utils/date";

export interface Schedule {
  frequency: RecurringFrequency;
  /** monthly/yearly: ngày trong tháng (1-31); weekly: thứ trong tuần (0-6). */
  anchorDay: number;
  startDate: Date;
  endDate?: Date | null;
}

/** Giới hạn số kỳ bù khi scheduler lâu không chạy, tránh tạo hàng loạt giao dịch ngoài ý muốn. */
export const MAX_CATCH_UP_OCCURRENCES = 24;

export function anchorDayFor(frequency: RecurringFrequency, startDate: Date): number {
  const p = vnParts(startDate);
  return frequency === "weekly" ? p.weekday : p.day;
}

/** Kỳ kế tiếp sau kỳ `previous`. Ngày 31 tự lùi về ngày cuối của tháng ngắn hơn. */
export function nextOccurrence(schedule: Schedule, previous: Date): Date {
  if (schedule.frequency === "weekly") return new Date(previous.getTime() + 7 * DAY_MS);

  const prev = vnParts(previous);
  if (schedule.frequency === "monthly") {
    const year = prev.month === 12 ? prev.year + 1 : prev.year;
    const month = prev.month === 12 ? 1 : prev.month + 1;
    return storageDate(year, month, Math.min(schedule.anchorDay, daysInMonth(year, month)));
  }

  const startMonth = vnParts(schedule.startDate).month;
  const year = prev.year + 1;
  return storageDate(year, startMonth, Math.min(schedule.anchorDay, daysInMonth(year, startMonth)));
}

function isAfterEnd(schedule: Schedule, date: Date): boolean {
  return !!schedule.endDate && toYmd(date) > toYmd(schedule.endDate);
}

/**
 * Các kỳ đã đến hạn (ngày ≤ hôm nay theo giờ VN) tính từ nextRunDate, cùng với nextRunDate mới.
 */
export function collectDueOccurrences(
  schedule: Schedule,
  nextRunDate: Date,
  now: Date
): { due: Date[]; nextRunDate: Date; finished: boolean } {
  const today = toYmd(now);
  const due: Date[] = [];
  let cursor = nextRunDate;

  while (toYmd(cursor) <= today && due.length < MAX_CATCH_UP_OCCURRENCES) {
    if (isAfterEnd(schedule, cursor)) return { due, nextRunDate: cursor, finished: true };
    due.push(cursor);
    cursor = nextOccurrence(schedule, cursor);
  }
  return { due, nextRunDate: cursor, finished: isAfterEnd(schedule, cursor) };
}

/** Các kỳ còn lại trong tháng `monthKey` sau hôm nay (dùng cho dự báo). */
export function occurrencesRemainingInMonth(
  schedule: Schedule,
  nextRunDate: Date,
  monthKey: string,
  now: Date
): Date[] {
  const today = toYmd(now);
  const { end } = monthRange(monthKey);
  const result: Date[] = [];
  let cursor = nextRunDate;
  let guard = 0;
  while (cursor < end && guard < 40) {
    if (isAfterEnd(schedule, cursor)) break;
    if (toYmd(cursor) > today) result.push(cursor);
    cursor = nextOccurrence(schedule, cursor);
    guard += 1;
  }
  return result;
}

/** Quy đổi số tiền định kỳ về mức trung bình mỗi tháng. */
export function monthlyEquivalent(amount: number, frequency: RecurringFrequency): number {
  if (frequency === "weekly") return (amount * 52) / 12;
  if (frequency === "yearly") return amount / 12;
  return amount;
}
