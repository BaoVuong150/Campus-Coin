import { timingSafeEqual } from "node:crypto";
import { handle, ok } from "@/lib/api/response";
import { Errors } from "@/lib/api/errors";
import { requireEnv } from "@/lib/env";
import { processDueRecurring } from "@/services/recurring.service";

function authorized(req: Request): boolean {
  const expected = Buffer.from(`Bearer ${requireEnv("CRON_SECRET")}`);
  const received = Buffer.from(req.headers.get("authorization") ?? "");
  return expected.length === received.length && timingSafeEqual(expected, received);
}

/** Cron job (ví dụ Vercel Cron) sinh giao dịch định kỳ đến hạn cho toàn bộ user. Idempotent. */
export const GET = handle(async (req) => {
  if (!authorized(req)) throw Errors.unauthorized();
  return ok({ created: await processDueRecurring() });
});

export const POST = GET;
