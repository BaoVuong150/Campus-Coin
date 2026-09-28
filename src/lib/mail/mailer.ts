import { isProduction } from "@/lib/env";

export interface MailMessage {
  to: string;
  subject: string;
  text: string;
  html: string;
}

export type MailResult = "sent" | "logged" | "not_configured" | "failed";

const RESEND_ENDPOINT = "https://api.resend.com/emails";

/**
 * Gửi email qua Resend (HTTP API, không cần thêm thư viện) khi có RESEND_API_KEY + MAIL_FROM.
 * Chưa cấu hình: môi trường dev in nội dung ra console của server để vẫn thử được luồng;
 * production thì không gửi và ghi cảnh báo (không bao giờ trả nội dung email về client).
 */
export async function sendMail(message: MailMessage): Promise<MailResult> {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.MAIL_FROM;

  if (!apiKey || !from) {
    if (isProduction) {
      console.warn("[mail] RESEND_API_KEY/MAIL_FROM chưa được cấu hình – email không được gửi.");
      return "not_configured";
    }
    console.info(`[mail:dev] To: ${message.to}\nSubject: ${message.subject}\n\n${message.text}`);
    return "logged";
  }

  try {
    const response = await fetch(RESEND_ENDPOINT, {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({ from, to: [message.to], subject: message.subject, text: message.text, html: message.html }),
    });
    if (!response.ok) {
      console.error("[mail] gửi thất bại", response.status);
      return "failed";
    }
    return "sent";
  } catch (error) {
    console.error("[mail] gửi thất bại", error);
    return "failed";
  }
}

/**
 * URL gốc của ứng dụng để dựng link trong email. Production bắt buộc có APP_URL: không dùng header Host
 * của request vì kẻ tấn công có thể giả mạo Host để link đặt lại mật khẩu trỏ về trang của họ.
 */
export function appBaseUrl(req: Request): string {
  const configured = process.env.APP_URL?.trim();
  if (configured) return configured.replace(/\/+$/, "");
  if (isProduction) return "";
  return new URL(req.url).origin;
}
