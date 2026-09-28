import { handle, ok, parseBody } from "@/lib/api/response";
import { startSession } from "@/lib/auth/cookies";
import { AUTH_RATE_LIMIT, clientIp, rateLimit, resetRateLimit } from "@/lib/auth/rate-limit";
import { loginSchema } from "@/lib/validations/auth.schema";
import { authenticate } from "@/services/user.service";

export const POST = handle(async (req) => {
  const input = await parseBody(req, loginSchema);
  const key = `login:${clientIp(req)}:${input.email}`;
  rateLimit(key, AUTH_RATE_LIMIT.limit, AUTH_RATE_LIMIT.windowMs);
  // Header X-Forwarded-For có thể bị giả mạo, nên giới hạn thêm theo riêng email (không phụ thuộc IP)
  // để không thể dò mật khẩu một tài khoản bằng cách đổi IP giả.
  const emailKey = `login-email:${input.email}`;
  rateLimit(emailKey, AUTH_RATE_LIMIT.limit * 3, AUTH_RATE_LIMIT.windowMs);

  const grant = await authenticate(input);
  resetRateLimit(key);
  resetRateLimit(emailKey);

  const response = ok({ user: grant.user });
  startSession(response, grant);
  return response;
});
