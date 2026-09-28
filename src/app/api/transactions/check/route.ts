import { z } from "zod";
import { handle, ok, parseBody } from "@/lib/api/response";
import { requireAuth } from "@/lib/auth/session";
import { createTransactionSchema } from "@/lib/validations/transaction.schema";
import { checkTransactionWarnings } from "@/services/transaction.service";

const checkSchema = createTransactionSchema
  .pick({ amount: true, type: true, description: true, category_id: true, date: true })
  .extend({ exclude_id: z.string().uuid().optional() });

/** Kiểm tra trùng lặp / bất thường trước khi lưu để UI hỏi xác nhận. */
export const POST = handle(async (req) => {
  const user = await requireAuth();
  const { exclude_id, ...input } = await parseBody(req, checkSchema);
  return ok(await checkTransactionWarnings(user.id, input, exclude_id));
});
