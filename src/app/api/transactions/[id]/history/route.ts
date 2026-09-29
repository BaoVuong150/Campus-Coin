import { handle, ok } from "@/lib/api/response";
import { uuidParam, type IdContext } from "@/lib/api/params";
import { requireAuth } from "@/lib/auth/session";
import { getTransactionHistory } from "@/services/transaction.service";

/** GET /api/transactions/:id/history – nhật ký tạo/sửa/xóa của giao dịch thuộc user hiện tại. */
export const GET = handle<IdContext>(async (_req, ctx) => {
  const user = await requireAuth();
  return ok(await getTransactionHistory(user.id, await uuidParam(ctx)));
});
