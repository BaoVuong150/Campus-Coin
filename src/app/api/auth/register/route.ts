import { handle, ok, parseBody } from "@/lib/api/response";
import { signToken } from "@/lib/auth/jwt";
import { setSessionCookie } from "@/lib/auth/cookies";
import { AUTH_RATE_LIMIT, clientIp, rateLimit } from "@/lib/auth/rate-limit";
import { registerSchema } from "@/lib/validations/auth.schema";
import { registerStudent } from "@/services/user.service";

export const POST = handle(async (req) => {
  rateLimit(`register:${clientIp(req)}`, AUTH_RATE_LIMIT.limit, AUTH_RATE_LIMIT.windowMs);
  const input = await parseBody(req, registerSchema);
  const user = await registerStudent(input);

  const response = ok({ user }, { status: 201 });
  setSessionCookie(response, signToken({ userId: user.id, email: user.email, role: user.role, name: user.name }));
  return response;
});
