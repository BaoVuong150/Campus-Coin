import { z } from "zod";
import { ApiError } from "@/lib/api/errors";
import { handle, ok, parseBody } from "@/lib/api/response";
import { rateLimit } from "@/lib/auth/rate-limit";
import { requireAuth } from "@/lib/auth/session";
import { appBaseUrl, canDeliverEmail } from "@/lib/mail/mailer";
import { monthKeySchema } from "@/lib/validations/common.schema";
import { getServerMessages } from "@/i18n/server";
import { emailReport } from "@/services/report-email.service";

const schema = z.object({ period: z.enum(["month", "quarter", "year"]), anchor: monthKeySchema });
const EMAILS_PER_HOUR = 5;

/** Giao diện hỏi trước để chỉ hiện nút "Gửi qua email" khi hệ thống thực sự gửi được. */
export const GET = handle(async () => {
  await requireAuth();
  return ok({ enabled: canDeliverEmail() });
});

/** Gửi tóm tắt báo cáo tới email của chính người dùng. */
export const POST = handle(async (req) => {
  const user = await requireAuth();
  if (!canDeliverEmail()) throw new ApiError(503, "EMAIL_UNAVAILABLE", "Hệ thống chưa bật gửi email.");
  await rateLimit(`report-email:${user.id}`, EMAILS_PER_HOUR, 60 * 60 * 1000);
  const { period, anchor } = await parseBody(req, schema);
  const delivery = await emailReport(user.id, period, anchor, await getServerMessages(), appBaseUrl(req));
  return ok({ delivery, to: user.email });
});
