import { handle, ok, parseBody } from "@/lib/api/response";
import { uuidParam, type IdContext } from "@/lib/api/params";
import { requireAuth } from "@/lib/auth/session";
import { goalContributionSchema } from "@/lib/validations/goal.schema";
import { contributeToGoal } from "@/services/goal.service";

export const POST = handle<IdContext>(async (req, ctx) => {
  const user = await requireAuth();
  const id = await uuidParam(ctx);
  const input = await parseBody(req, goalContributionSchema);
  return ok(await contributeToGoal(user.id, id, input));
});
