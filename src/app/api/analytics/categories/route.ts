import { z } from "zod";
import { handle, ok, parseQuery } from "@/lib/api/response";
import { requireAuth } from "@/lib/auth/session";
import { currentMonthKey, monthRange } from "@/lib/utils/date";
import { monthKeySchema } from "@/lib/validations/common.schema";
import { getCategoryBreakdown } from "@/services/analytics.service";

const schema = z.object({
  month: monthKeySchema.optional(),
  type: z.enum(["income", "expense"]).default("expense"),
});

export const GET = handle(async (req) => {
  const user = await requireAuth();
  const { month, type } = parseQuery(req, schema);
  return ok(await getCategoryBreakdown(user.id, monthRange(month ?? currentMonthKey()), type));
});
