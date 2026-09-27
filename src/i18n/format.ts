import { CANONICAL_CATEGORY_NAMES, normalizeText, type CanonicalCategory } from "@/lib/finance/categorize";
import { DAY_MS, parseMonthKey, todayYmd, toYmd, vnHour } from "@/lib/utils/date";
import { ApiClientError } from "@/lib/api-client";
import type { Locale } from "./config";
import type { Messages } from "./index";
import type { NotificationParams, NotificationTemplate } from "./templates";

const CANONICAL_BY_NAME = new Map(
  (Object.entries(CANONICAL_CATEGORY_NAMES) as [CanonicalCategory, string][]).map(([key, name]) => [name, key])
);

/** Tên danh mục mặc định của hệ thống được dịch; danh mục người dùng tự tạo giữ nguyên. */
export function categoryName(t: Messages, name: string): string {
  const canonical = CANONICAL_BY_NAME.get(normalizeText(name));
  return canonical ? t.categories[canonical] : name;
}

export function monthLabel(t: Messages, key: string): string {
  const { year, month } = parseMonthKey(key);
  return t.dates.month(month, year);
}

export function shortMonthLabel(t: Messages, key: string): string {
  const { year, month } = parseMonthKey(key);
  return t.dates.shortMonth(month, year);
}

/** Nhãn kỳ báo cáo: "Tháng 9/2026", "Quý 3/2026", "Năm 2026" (hoặc bản tiếng Anh). */
export function periodLabel(t: Messages, period: "month" | "quarter" | "year", anchor: string): string {
  const { year, month } = parseMonthKey(anchor);
  if (period === "year") return t.dates.year(year);
  if (period === "quarter") return t.dates.quarter(Math.ceil(month / 3), year);
  return t.dates.month(month, year);
}

/** Nhãn trục biểu đồ: "YYYY-MM-DD" → "dd/MM", "YYYY-MM" → tháng rút gọn. */
export function bucketLabel(t: Messages, key: string): string {
  if (key.length === 10) {
    const [, m, d] = key.split("-");
    return `${d}/${m}`;
  }
  return shortMonthLabel(t, key);
}

export function relativeDay(t: Messages, value: Date | string, now = new Date()): string {
  const ymd = toYmd(new Date(value));
  if (ymd === todayYmd(now)) return t.dates.today;
  if (ymd === toYmd(new Date(now.getTime() - DAY_MS))) return t.dates.yesterday;
  const [y, m, d] = ymd.split("-");
  return `${d}/${m}/${y}`;
}

export function greeting(t: Messages, now = new Date()): string {
  const hour = vnHour(now);
  if (hour < 11) return t.dates.greeting.morning;
  if (hour < 14) return t.dates.greeting.noon;
  if (hour < 18) return t.dates.greeting.afternoon;
  return t.dates.greeting.evening;
}

/** Rút gọn số cho trục biểu đồ: 1.250.000 → "1,3tr" (vi) / "1.3M" (en). */
export function compact(t: Messages, locale: Locale, value: number): string {
  const abs = Math.abs(value);
  const sign = value < 0 ? "-" : "";
  const trim = (n: number) => {
    const text = n.toFixed(1).replace(/\.0$/, "");
    return locale === "vi" ? text.replace(".", ",") : text;
  };
  if (abs >= 1_000_000_000) return `${sign}${trim(abs / 1_000_000_000)}${t.dates.compact.billion}`;
  if (abs >= 1_000_000) return `${sign}${trim(abs / 1_000_000)}${t.dates.compact.million}`;
  if (abs >= 1_000) return `${sign}${Math.round(abs / 1_000)}${t.dates.compact.thousand}`;
  return `${sign}${Math.round(abs)}`;
}

/** Dựng tiêu đề/nội dung thông báo theo ngôn ngữ; không có template (dữ liệu cũ, thông báo admin) thì dùng văn bản gốc. */
export function renderNotification(
  t: Messages,
  n: { template: string | null; params: unknown; title: string; message: string }
): { title: string; message: string } {
  const template = n.template as NotificationTemplate | null;
  if (!template || !(template in t.notifications.templates) || !n.params) return { title: n.title, message: n.message };
  const entry = t.notifications.templates[template] as {
    title: (p: NotificationParams[NotificationTemplate]) => string;
    message: (p: NotificationParams[NotificationTemplate]) => string;
  };
  const params = localizeParams(t, n.params as Record<string, unknown>) as NotificationParams[NotificationTemplate];
  return { title: entry.title(params), message: entry.message(params) };
}

/** Tham số "category" trong template là tên danh mục gốc (tiếng Việt) → dịch theo ngôn ngữ hiện tại. */
export function localizeParams<T extends Record<string, unknown>>(t: Messages, params: T): T {
  return typeof params.category === "string" ? { ...params, category: categoryName(t, params.category) } : params;
}

/**
 * Thông báo lỗi cho người dùng: tiếng Việt dùng thông điệp chi tiết của server,
 * ngôn ngữ khác dùng bản dịch theo mã lỗi.
 */
export function errorText(t: Messages, locale: Locale, error: unknown): string {
  if (!(error instanceof ApiClientError)) return t.errors.INTERNAL_ERROR;
  if (locale === "vi" && error.code !== "NETWORK_ERROR") return error.message;
  return t.errors[error.code] ?? t.errors.INTERNAL_ERROR;
}

export interface Formatters {
  category: (name: string) => string;
  month: (key: string) => string;
  shortMonth: (key: string) => string;
  bucket: (key: string) => string;
  relativeDay: (value: Date | string) => string;
  compact: (value: number) => string;
  period: (period: "month" | "quarter" | "year", anchor: string) => string;
  error: (error: unknown) => string;
}

export function createFormatters(t: Messages, locale: Locale): Formatters {
  return {
    category: (name) => categoryName(t, name),
    month: (key) => monthLabel(t, key),
    shortMonth: (key) => shortMonthLabel(t, key),
    bucket: (key) => bucketLabel(t, key),
    relativeDay: (value) => relativeDay(t, value),
    compact: (value) => compact(t, locale, value),
    period: (period, anchor) => periodLabel(t, period, anchor),
    error: (error) => errorText(t, locale, error),
  };
}
