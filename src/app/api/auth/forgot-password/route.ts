import { after } from "next/server";
import { handle, ok, parseBody } from "@/lib/api/response";
import { AUTH_RATE_LIMIT, clientIp, rateLimit } from "@/lib/auth/rate-limit";
import { appBaseUrl } from "@/lib/mail/mailer";
import { forgotPasswordSchema } from "@/lib/validations/auth.schema";
import { requestPasswordReset } from "@/services/user.service";

const REQUESTS_PER_EMAIL = 3;

/**
 * Yêu cầu link đặt lại mật khẩu. Luôn trả cùng một phản hồi và gửi email SAU khi phản hồi
 * (after), nên cả nội dung lẫn thời gian phản hồi đều không cho biết email có tồn tại hay không.
 */
export const POST = handle(async (req) => {
  rateLimit(`forgot:${clientIp(req)}`, AUTH_RATE_LIMIT.limit, AUTH_RATE_LIMIT.windowMs);
  const { email } = await parseBody(req, forgotPasswordSchema);
  rateLimit(`forgot-email:${email}`, REQUESTS_PER_EMAIL, AUTH_RATE_LIMIT.windowMs);

  const baseUrl = appBaseUrl(req);
  after(async () => {
    try {
      await requestPasswordReset(email, baseUrl);
    } catch (error) {
      console.error("[auth] forgot-password failed", error);
    }
  });
  return ok({ requested: true });
});
