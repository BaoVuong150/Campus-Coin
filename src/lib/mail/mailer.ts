import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { isProduction } from "@/lib/env";
import { logEvent } from "@/lib/observability/log";

export interface MailMessage {
  to: string;
  subject: string;
  text: string;
  html: string;
  /** Loại email – chỉ dùng cho log vận hành (không ghi nội dung). */
  kind: "password_reset" | "report";
}

export type MailResult = "sent" | "saved_locally" | "not_configured" | "failed";

const RESEND_ENDPOINT = "https://api.resend.com/emails";
const SEND_TIMEOUT_MS = 10_000;
const LOCAL_HOST = /^https?:\/\/(localhost|127\.0\.0\.1|0\.0\.0\.0|\[::1\])(:\d+)?$/i;
/** Thư mục "hộp thư" khi phát triển (đã có trong .gitignore). */
const DEV_OUTBOX = path.join(process.cwd(), ".mail");

/**
 * Gửi email qua Resend (HTTP API, không cần thêm thư viện) khi có RESEND_API_KEY + MAIL_FROM.
 * Chưa cấu hình:
 * - development: lưu email ra thư mục .mail/ (mở file .html để bấm link) – không in token ra console;
 * - production: không gửi, ghi log cảnh báo. Không bao giờ giả vờ đã gửi thành công.
 */
/**
 * Email có thực sự gửi được không: production cần RESEND_API_KEY + MAIL_FROM + APP_URL https.
 * Dev luôn "được" (email lưu vào .mail/). Dùng để UI không hứa gửi email khi hệ thống không gửi được.
 */
export function canDeliverEmail(): boolean {
  if (!isProduction) return true;
  const appUrl = process.env.APP_URL?.trim() ?? "";
  return !!process.env.RESEND_API_KEY && !!process.env.MAIL_FROM && appUrl.startsWith("https://") && !LOCAL_HOST.test(appUrl.replace(/\/+$/, ""));
}

export async function sendMail(message: MailMessage): Promise<MailResult> {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.MAIL_FROM;

  if (!apiKey || !from) {
    if (isProduction) {
      logEvent("warn", "mail.not_configured", { kind: message.kind });
      return "not_configured";
    }
    return saveToDevOutbox(message);
  }

  try {
    const response = await fetch(RESEND_ENDPOINT, {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({ from, to: [message.to], subject: message.subject, text: message.text, html: message.html }),
      signal: AbortSignal.timeout(SEND_TIMEOUT_MS),
    });
    if (!response.ok) {
      logEvent("error", "mail.failed", { kind: message.kind, status: response.status });
      return "failed";
    }
    logEvent("info", "mail.sent", { kind: message.kind });
    return "sent";
  } catch (error) {
    logEvent("error", "mail.failed", { kind: message.kind, reason: error instanceof Error ? error.name : "unknown" });
    return "failed";
  }
}

async function saveToDevOutbox(message: MailMessage): Promise<MailResult> {
  try {
    await mkdir(DEV_OUTBOX, { recursive: true });
    const base = path.join(DEV_OUTBOX, `${new Date().toISOString().replace(/[:.]/g, "-")}-${message.kind}`);
    await writeFile(`${base}.html`, message.html, "utf8");
    await writeFile(`${base}.txt`, `To: ${message.to}\nSubject: ${message.subject}\n\n${message.text}`, "utf8");
    // Chỉ in đường dẫn file, không in link/token.
    console.info(`[mail:dev] Đã lưu email "${message.subject}" vào ${base}.html`);
    return "saved_locally";
  } catch (error) {
    logEvent("error", "mail.failed", { kind: message.kind, reason: "dev_outbox" });
    console.error(error);
    return "failed";
  }
}

/**
 * URL gốc để dựng link trong email. Production bắt buộc có APP_URL công khai (https, không phải localhost):
 * không dùng header Host của request vì kẻ tấn công có thể giả mạo Host để link đặt lại mật khẩu trỏ về trang của họ.
 */
export function appBaseUrl(req: Request): string {
  const configured = process.env.APP_URL?.trim().replace(/\/+$/, "");
  if (isProduction) {
    if (!configured || LOCAL_HOST.test(configured) || !configured.startsWith("https://")) {
      logEvent("error", "mail.unsafe_base_url", { configured: !!configured });
      return "";
    }
    return configured;
  }
  return configured || new URL(req.url).origin;
}

/** Escape HTML cho nội dung chèn vào email. */
export function escapeHtml(value: string): string {
  return value.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);
}

/**
 * Khung email đơn giản, hiển thị tốt trên điện thoại (bảng 1 cột, style inline, tối đa 560px)
 * và trong chế độ tối của ứng dụng mail (màu nút đủ tương phản).
 */
export function emailLayout({ heading, paragraphs, action, footer }: { heading: string; paragraphs: string[]; action: { label: string; url: string }; footer: string }): string {
  const body = paragraphs.map((p) => `<p style="margin:0 0 14px;font-size:15px;line-height:1.6;color:#27383a;">${escapeHtml(p)}</p>`).join("");
  return `<!doctype html><html lang="vi"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${escapeHtml(heading)}</title></head>
<body style="margin:0;padding:0;background:#f1f6f6;font-family:-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f1f6f6;padding:24px 12px;"><tr><td align="center">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background:#ffffff;border-radius:14px;border:1px solid #e3ecec;">
<tr><td style="padding:28px 28px 8px;"><p style="margin:0 0 18px;font-size:15px;font-weight:700;color:#0b1716;">Campus Coin</p>
<h1 style="margin:0 0 16px;font-size:22px;line-height:1.3;color:#0b1716;">${escapeHtml(heading)}</h1>${body}
<p style="margin:22px 0 26px;"><a href="${escapeHtml(action.url)}" style="display:inline-block;background:#2dd4bf;color:#042f2e;font-weight:600;font-size:15px;text-decoration:none;padding:12px 22px;border-radius:10px;">${escapeHtml(action.label)}</a></p>
<p style="margin:0 0 8px;font-size:12px;line-height:1.5;color:#647677;">Nếu nút không hoạt động, sao chép link sau vào trình duyệt / If the button doesn't work, copy this link:<br><span style="word-break:break-all;color:#0f766e;">${escapeHtml(action.url)}</span></p>
</td></tr><tr><td style="padding:14px 28px 24px;border-top:1px solid #e3ecec;font-size:12px;line-height:1.5;color:#647677;">${escapeHtml(footer)}</td></tr>
</table></td></tr></table></body></html>`;
}
