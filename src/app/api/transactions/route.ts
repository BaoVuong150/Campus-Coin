import { handle, ok, parseBody, parseQuery } from "@/lib/api/response";
import { requireAuth } from "@/lib/auth/session";
import { createTransactionSchema, transactionQuerySchema } from "@/lib/validations/transaction.schema";
import { createTransaction, flagUnusual, listTransactions } from "@/services/transaction.service";

export const GET = handle(async (req) => {
  const user = await requireAuth();
  const query = parseQuery(req, transactionQuerySchema);
  const result = await listTransactions(user.id, query);
  const unusual = await flagUnusual(user.id, result.items);
  return ok({ ...result, unusualIds: [...unusual] });
});

export const POST = handle(async (req) => {
  const user = await requireAuth();
  const input = await parseBody(req, createTransactionSchema);
  return ok(await createTransaction(user.id, input), { status: 201 });
});
