/**
 * Tiện ích ngày giờ theo múi giờ Asia/Ho_Chi_Minh (UTC+7, không có DST).
 * DB lưu thời điểm tuyệt đối (UTC); mọi phép tính "ngày", "tháng" đều quy về giờ Việt Nam.
 */
export const APP_TIMEZONE = "Asia/Ho_Chi_Minh";
const VN_OFFSET_MS = 7 * 60 * 60 * 1000;
export const DAY_MS = 24 * 60 * 60 * 1000;
/** Giờ lưu cho giao dịch chỉ có ngày: 12:00 giờ VN, tránh lệch ngày khi đổi múi giờ. */
const STORAGE_HOUR_UTC = 5;

const pad = (n: number) => String(n).padStart(2, "0");

export interface VnParts {
  year: number;
  month: number; // 1-12
  day: number;
  weekday: number; // 0 = Chủ nhật
}

export function vnParts(date: Date): VnParts {
  const shifted = new Date(date.getTime() + VN_OFFSET_MS);
  return {
    year: shifted.getUTCFullYear(),
    month: shifted.getUTCMonth() + 1,
    day: shifted.getUTCDate(),
    weekday: shifted.getUTCDay(),
  };
}

export function toYmd(date: Date): string {
  const p = vnParts(date);
  return `${p.year}-${pad(p.month)}-${pad(p.day)}`;
}

export function toMonthKey(date: Date): string {
  const p = vnParts(date);
  return `${p.year}-${pad(p.month)}`;
}

export const todayYmd = (now = new Date()) => toYmd(now);
export const currentMonthKey = (now = new Date()) => toMonthKey(now);

const YMD_RE = /^(\d{4})-(\d{2})-(\d{2})$/;
const MONTH_RE = /^(\d{4})-(\d{2})$/;

export function isValidYmd(value: string): boolean {
  const m = YMD_RE.exec(value);
  if (!m) return false;
  const [y, mo, d] = [Number(m[1]), Number(m[2]), Number(m[3])];
  if (mo < 1 || mo > 12 || d < 1) return false;
  return d <= daysInMonth(y, mo);
}

export function isValidMonthKey(value: string): boolean {
  const m = MONTH_RE.exec(value);
  return !!m && Number(m[2]) >= 1 && Number(m[2]) <= 12;
}

export function parseMonthKey(key: string): { year: number; month: number } {
  const [year, month] = key.split("-").map(Number);
  return { year, month };
}

export function daysInMonth(year: number, month: number): number {
  return new Date(Date.UTC(year, month, 0)).getUTCDate();
}

/** Thời điểm UTC tương ứng 00:00 giờ VN của ngày y-m-d (tự tràn tháng/năm). */
export function vnStartOfDay(year: number, month: number, day: number): Date {
  return new Date(Date.UTC(year, month - 1, day) - VN_OFFSET_MS);
}

/** Ngày "YYYY-MM-DD" → thời điểm lưu DB (12:00 giờ VN). */
export function ymdToStorageDate(ymd: string): Date {
  const [y, m, d] = ymd.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d, STORAGE_HOUR_UTC));
}

export function storageDate(year: number, month: number, day: number): Date {
  return new Date(Date.UTC(year, month - 1, day, STORAGE_HOUR_UTC));
}

export interface DateRange {
  start: Date; // bao gồm
  end: Date; // không bao gồm
}

export function monthRange(key: string): DateRange {
  const { year, month } = parseMonthKey(key);
  return { start: vnStartOfDay(year, month, 1), end: vnStartOfDay(year, month + 1, 1) };
}

export function dayRange(ymd: string): DateRange {
  const [y, m, d] = ymd.split("-").map(Number);
  return { start: vnStartOfDay(y, m, d), end: vnStartOfDay(y, m, d + 1) };
}

export function yearRange(year: number): DateRange {
  return { start: vnStartOfDay(year, 1, 1), end: vnStartOfDay(year + 1, 1, 1) };
}

export function quarterRange(year: number, quarter: number): DateRange {
  const firstMonth = (quarter - 1) * 3 + 1;
  return { start: vnStartOfDay(year, firstMonth, 1), end: vnStartOfDay(year, firstMonth + 3, 1) };
}

export function shiftMonthKey(key: string, delta: number): string {
  const { year, month } = parseMonthKey(key);
  const d = new Date(Date.UTC(year, month - 1 + delta, 1));
  return `${d.getUTCFullYear()}-${pad(d.getUTCMonth() + 1)}`;
}

export function monthLabel(key: string): string {
  const { year, month } = parseMonthKey(key);
  return `Tháng ${month}/${year}`;
}

export function shortMonthLabel(key: string): string {
  const { year, month } = parseMonthKey(key);
  return `T${month}/${String(year).slice(2)}`;
}

/** Số ngày còn lại trong tháng tính cả hôm nay (tháng quá khứ = 0, tháng tương lai = cả tháng). */
export function remainingDaysInMonth(key: string, now = new Date()): number {
  const { year, month } = parseMonthKey(key);
  const total = daysInMonth(year, month);
  const current = currentMonthKey(now);
  if (key < current) return 0;
  if (key > current) return total;
  return total - vnParts(now).day + 1;
}

export function elapsedDaysInMonth(key: string, now = new Date()): number {
  const { year, month } = parseMonthKey(key);
  const total = daysInMonth(year, month);
  const current = currentMonthKey(now);
  if (key < current) return total;
  if (key > current) return 0;
  return vnParts(now).day;
}

export function formatDate(value: Date | string): string {
  const p = vnParts(new Date(value));
  return `${pad(p.day)}/${pad(p.month)}/${p.year}`;
}

export function formatDateTime(value: Date | string): string {
  const date = new Date(value);
  const shifted = new Date(date.getTime() + VN_OFFSET_MS);
  return `${formatDate(date)} ${pad(shifted.getUTCHours())}:${pad(shifted.getUTCMinutes())}`;
}

const WEEKDAYS = ["Chủ nhật", "Thứ Hai", "Thứ Ba", "Thứ Tư", "Thứ Năm", "Thứ Sáu", "Thứ Bảy"];
export const weekdayName = (weekday: number) => WEEKDAYS[weekday] ?? "";

export function relativeDay(value: Date | string, now = new Date()): string {
  const ymd = toYmd(new Date(value));
  if (ymd === todayYmd(now)) return "Hôm nay";
  if (ymd === toYmd(new Date(now.getTime() - DAY_MS))) return "Hôm qua";
  return formatDate(value);
}

export function greeting(now = new Date()): string {
  const hour = new Date(now.getTime() + VN_OFFSET_MS).getUTCHours();
  if (hour < 11) return "Chào buổi sáng";
  if (hour < 14) return "Chào buổi trưa";
  if (hour < 18) return "Chào buổi chiều";
  return "Chào buổi tối";
}

/** Số ngày (theo lịch VN) từ hôm nay đến ngày đích; âm nếu đã qua. */
export function daysUntil(target: Date | string, now = new Date()): number {
  const a = ymdToStorageDate(toYmd(now)).getTime();
  const b = ymdToStorageDate(toYmd(new Date(target))).getTime();
  return Math.round((b - a) / DAY_MS);
}

export type CashFlowPreset = "7d" | "30d" | "3m" | "6m" | "12m";

export interface Bucketed {
  range: DateRange;
  granularity: "day" | "month";
  keys: string[];
}

/** Khoảng thời gian + danh sách bucket cho biểu đồ dòng tiền. */
export function cashFlowBuckets(preset: CashFlowPreset, now = new Date()): Bucketed {
  const today = vnParts(now);
  if (preset === "7d" || preset === "30d") {
    const days = preset === "7d" ? 7 : 30;
    const start = vnStartOfDay(today.year, today.month, today.day - days + 1);
    const end = vnStartOfDay(today.year, today.month, today.day + 1);
    const keys = Array.from({ length: days }, (_, i) => toYmd(new Date(start.getTime() + i * DAY_MS)));
    return { range: { start, end }, granularity: "day", keys };
  }
  const months = preset === "3m" ? 3 : preset === "6m" ? 6 : 12;
  const current = currentMonthKey(now);
  const keys = Array.from({ length: months }, (_, i) => shiftMonthKey(current, i - months + 1));
  return {
    range: { start: monthRange(keys[0]).start, end: monthRange(current).end },
    granularity: "month",
    keys,
  };
}
