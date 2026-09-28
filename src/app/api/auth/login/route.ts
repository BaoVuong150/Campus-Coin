import { handle, ok, parseBody } from "@/lib/api/response";
import { signToken } from "@/lib/auth/jwt";
import { setSessionCookie } from "@/lib/auth/cookies";
import { AUTH_RATE_LIMIT, clientIp, rateLimit, resetRateLimit } from "@/lib/auth/rate-limit";
import { loginSchema } from "@/lib/validations/auth.schema";
import { authenticate } from "@/services/user.service";

export const POST = handle(async (req) => {
  const input = await parseBody(req, loginSchema);
  const key = `login:${clientIp(req)}:${input.email}`;
  rateLimit(key, AUTH_RATE_LIMIT.limit, AUTH_RATE_LIMIT.windowMs);

  const user = await authenticate(input);
  resetRateLimit(key);

  const response = ok({ user });
  setSessionCookie(response, signToken({ userId: user.id, email: user.email, role: user.role, name: user.name }));
  return response;
});
