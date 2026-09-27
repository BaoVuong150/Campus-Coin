import { z } from "zod";
import { handle, ok, parseBody, parseQuery } from "@/lib/api/response";
import { requireAuth } from "@/lib/auth/session";
import { createGoalSchema } from "@/lib/validations/goal.schema";
import { createGoal, listGoals } from "@/services/goal.service";

const querySchema = z.object({ archived: z.enum(["true", "false"]).default("false") });

export const GET = handle(async (req) => {
  const user = await requireAuth();
  const { archived } = parseQuery(req, querySchema);
  return ok(await listGoals(user.id, archived === "true"));
});

export const POST = handle(async (req) => {
  const user = await requireAuth();
  const input = await parseBody(req, createGoalSchema);
  return ok(await createGoal(user.id, input), { status: 201 });
});
