import { z } from "zod";
import { handle, ok, parseQuery } from "@/lib/api/response";
import { requireAuth } from "@/lib/auth/session";
import { currentMonthKey } from "@/lib/utils/date";
import { monthKeySchema } from "@/lib/validations/common.schema";
import { getReport } from "@/services/analytics.service";

const schema = z.object({
  period: z.enum(["month", "quarter", "year"]).default("month"),
  anchor: monthKeySchema.optional(),
});

export const GET = handle(async (req) => {
  const user = await requireAuth();
  const { period, anchor } = parseQuery(req, schema);
  return ok(await getReport(user.id, period, anchor ?? currentMonthKey()));
});
