import { timingSafeEqual } from "node:crypto";
import { handle, ok } from "@/lib/api/response";
import { Errors } from "@/lib/api/errors";
import { requireEnv } from "@/lib/env";
import { errorSummary, logEvent } from "@/lib/observability/log";
import { runDueRecurring } from "@/services/recurring.service";

/** So sánh hằng thời gian với "Bearer <CRON_SECRET>" (Vercel Cron tự gửi header này khi có biến CRON_SECRET). */
function authorized(req: Request): boolean {
  const expected = Buffer.from(`Bearer ${requireEnv("CRON_SECRET")}`);
  const received = Buffer.from(req.headers.get("authorization") ?? "");
  return expected.length === received.length && timingSafeEqual(expected, received);
}

/**
 * Cron hằng ngày (vercel.json – 00:05 giờ Việt Nam): sinh giao dịch định kỳ đến hạn cho mọi user mà không cần
 * ai mở app. An toàn khi gọi lặp/song song: mỗi kỳ chỉ được "giành" một lần + unique (recurring_id, date).
 */
export const GET = handle(async (req) => {
  if (!authorized(req)) {
    logEvent("warn", "cron.unauthorized");
    throw Errors.unauthorized();
  }
  const started = Date.now();
  try {
    const result = await runDueRecurring();
    logEvent(result.failed > 0 ? "warn" : "info", "cron.recurring.completed", { ...result, ms: Date.now() - started });
    return ok(result);
  } catch (error) {
    logEvent("error", "cron.recurring.failed", { reason: errorSummary(error), ms: Date.now() - started });
    throw error;
  }
});

export const POST = GET;
