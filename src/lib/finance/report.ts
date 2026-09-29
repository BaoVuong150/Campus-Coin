import { DAY_MS, dayRange, storageDate, toYmd, vnParts } from "@/lib/utils/date";

export interface DailyPoint {
  key: string; // YYYY-MM-DD
  income: number;
  expense: number;
}

export interface WeeklySummary {
  /** Ngày đầu (thứ Hai hoặc ngày đầu kỳ) và ngày cuối (Chủ nhật hoặc ngày cuối kỳ) của tuần. */
  start: string;
  end: string;
  income: number;
  expense: number;
}

/** Gộp chuỗi theo ngày thành từng tuần thứ Hai → Chủ nhật (tuần đầu/cuối có thể bị cắt theo kỳ báo cáo). */
export function groupByWeek(points: DailyPoint[]): WeeklySummary[] {
  const weeks: WeeklySummary[] = [];
  for (const p of points) {
    const [y, m, d] = p.key.split("-").map(Number);
    const monday = (vnParts(storageDate(y, m, d)).weekday + 6) % 7 === 0;
    const current = weeks[weeks.length - 1];
    if (!current || monday) weeks.push({ start: p.key, end: p.key, income: p.income, expense: p.expense });
    else {
      current.end = p.key;
      current.income += p.income;
      current.expense += p.expense;
    }
  }
  return weeks;
}

/** Danh sách ngày YYYY-MM-DD từ `from` đến `to` (bao gồm hai đầu). */
export function daysBetween(from: string, to: string): string[] {
  const keys: string[] = [];
  const end = dayRange(to).start.getTime();
  for (let t = dayRange(from).start.getTime(); t <= end; t += DAY_MS) keys.push(toYmd(new Date(t)));
  return keys;
}

/** Khoảng ngày tùy chọn tối đa cho báo cáo. */
export const MAX_CUSTOM_RANGE_DAYS = 366;
/** Khoảng ngắn hơn ngưỡng này hiển thị theo ngày, dài hơn theo tháng. */
export const DAILY_GRANULARITY_MAX_DAYS = 62;
