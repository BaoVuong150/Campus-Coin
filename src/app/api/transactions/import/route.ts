import { handle, ok, parseBody } from "@/lib/api/response";
import { requireAuth } from "@/lib/auth/session";
import { rateLimit } from "@/lib/auth/rate-limit";
import { importTransactionsSchema } from "@/lib/validations/import.schema";
import { importTransactions } from "@/services/import.service";

const IMPORTS_PER_HOUR = 20;

export const POST = handle(async (req) => {
  const user = await requireAuth();
  rateLimit(`import:${user.id}`, IMPORTS_PER_HOUR, 60 * 60 * 1000);
  const input = await parseBody(req, importTransactionsSchema);
  return ok(await importTransactions(user.id, input), { status: 201 });
});
