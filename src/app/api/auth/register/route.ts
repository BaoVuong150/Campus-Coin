import { handle, ok, parseBody } from "@/lib/api/response";
import { startSession } from "@/lib/auth/cookies";
import { AUTH_RATE_LIMIT, clientIp, rateLimit } from "@/lib/auth/rate-limit";
import { registerSchema } from "@/lib/validations/auth.schema";
import { registerStudent } from "@/services/user.service";

export const POST = handle(async (req) => {
  rateLimit(`register:${clientIp(req)}`, AUTH_RATE_LIMIT.limit, AUTH_RATE_LIMIT.windowMs);
  const input = await parseBody(req, registerSchema);
  const grant = await registerStudent(input);

  const response = ok({ user: grant.user }, { status: 201 });
  startSession(response, grant);
  return response;
});
