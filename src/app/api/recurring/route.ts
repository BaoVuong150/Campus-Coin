import { handle, ok, parseBody } from "@/lib/api/response";
import { requireAuth } from "@/lib/auth/session";
import { createRecurringSchema } from "@/lib/validations/recurring.schema";
import { createRecurring, listRecurring } from "@/services/recurring.service";
import { ensureRecurringProcessed } from "@/services/scheduler";

export const GET = handle(async () => {
  const user = await requireAuth();
  await ensureRecurringProcessed(user.id);
  return ok(await listRecurring(user.id));
});

export const POST = handle(async (req) => {
  const user = await requireAuth();
  const input = await parseBody(req, createRecurringSchema);
  return ok(await createRecurring(user.id, input), { status: 201 });
});
