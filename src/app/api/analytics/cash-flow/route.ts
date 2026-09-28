import { z } from "zod";
import { handle, ok, parseQuery } from "@/lib/api/response";
import { requireAuth } from "@/lib/auth/session";
import { getCashFlow } from "@/services/analytics.service";

const schema = z.object({ range: z.enum(["7d", "30d", "3m", "6m", "12m"]).default("6m") });

export const GET = handle(async (req) => {
  const user = await requireAuth();
  const { range } = parseQuery(req, schema);
  return ok(await getCashFlow(user.id, range));
});
