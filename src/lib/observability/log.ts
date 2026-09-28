/**
 * Sự kiện vận hành có cấu trúc (một dòng JSON) để tìm kiếm/cảnh báo trên log của nền tảng (Vercel, v.v.).
 * Quy tắc: không ghi mật khẩu, token, số dư hay nội dung giao dịch; chỉ ghi mã sự kiện và số liệu vận hành.
 */
export type LogLevel = "info" | "warn" | "error";

export type LogEvent =
  | "auth.login_rate_limited"
  | "auth.reset_requested"
  | "mail.sent"
  | "mail.failed"
  | "mail.not_configured"
  | "mail.unsafe_base_url"
  | "cron.recurring.completed"
  | "cron.recurring.failed"
  | "cron.unauthorized"
  | "recurring.item_failed"
  | "api.unexpected_error";

export function logEvent(level: LogLevel, event: LogEvent, data: Record<string, string | number | boolean | null | undefined> = {}) {
  const line = JSON.stringify({ ts: new Date().toISOString(), level, event, ...data });
  if (level === "error") console.error(line);
  else if (level === "warn") console.warn(line);
  else console.info(line);
}

/** Mô tả lỗi an toàn để ghi log (tên + thông điệp, không kèm dữ liệu request). */
export function errorSummary(error: unknown): string {
  if (error instanceof Error) return `${error.name}: ${error.message}`.slice(0, 500);
  return String(error).slice(0, 500);
}
