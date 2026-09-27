import { z } from "zod";
import { handle, ok, parseBody } from "@/lib/api/response";
import { requireAuth } from "@/lib/auth/session";
import { monthKeySchema } from "@/lib/validations/common.schema";
import { copyBudgets } from "@/services/budget.service";

const schema = z.object({ from: monthKeySchema, to: monthKeySchema });

export const POST = handle(async (req) => {
  const user = await requireAuth();
  const { from, to } = await parseBody(req, schema);
  return ok({ copied: await copyBudgets(user.id, from, to) });
});
