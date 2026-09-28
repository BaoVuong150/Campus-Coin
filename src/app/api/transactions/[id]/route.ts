import { handle, ok, parseBody } from "@/lib/api/response";
import { uuidParam, type IdContext } from "@/lib/api/params";
import { requireAuth } from "@/lib/auth/session";
import { updateTransactionSchema } from "@/lib/validations/transaction.schema";
import { deleteTransaction, getTransaction, updateTransaction } from "@/services/transaction.service";

export const GET = handle<IdContext>(async (_req, ctx) => {
  const user = await requireAuth();
  return ok(await getTransaction(user.id, await uuidParam(ctx)));
});

export const PATCH = handle<IdContext>(async (req, ctx) => {
  const user = await requireAuth();
  const id = await uuidParam(ctx);
  const input = await parseBody(req, updateTransactionSchema);
  return ok(await updateTransaction(user.id, id, input));
});

// Giữ PUT để tương thích client cũ.
export const PUT = PATCH;

export const DELETE = handle<IdContext>(async (_req, ctx) => {
  const user = await requireAuth();
  await deleteTransaction(user.id, await uuidParam(ctx));
  return ok({ deleted: true });
});
