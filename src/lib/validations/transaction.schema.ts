import { z } from "zod";
import { MAX_DESCRIPTION_LENGTH } from "@/constants/finance";
import {
  amountSchema,
  categoryIdSchema,
  paginationSchema,
  transactionTypeSchema,
  ymdSchema,
} from "./common.schema";

const descriptionSchema = z
  .string("Vui lòng nhập mô tả.")
  .trim()
  .min(1, "Vui lòng nhập mô tả.")
  .max(MAX_DESCRIPTION_LENGTH, `Mô tả tối đa ${MAX_DESCRIPTION_LENGTH} ký tự.`);

export const createTransactionSchema = z.object({
  amount: amountSchema,
  type: transactionTypeSchema,
  description: descriptionSchema,
  category_id: categoryIdSchema,
  date: ymdSchema,
  suggested_category_id: z.number().int().positive().nullish(),
});

export const updateTransactionSchema = createTransactionSchema
  .omit({ suggested_category_id: true })
  .partial()
  .refine((v) => Object.keys(v).length > 0, "Không có dữ liệu cần cập nhật.");

export const transactionQuerySchema = paginationSchema.extend({
  q: z.string().trim().max(100).optional(),
  type: z.enum(["income", "expense", "all"]).default("all"),
  category_id: z.coerce.number().int().positive().optional(),
  from: ymdSchema.optional(),
  to: ymdSchema.optional(),
  min: z.coerce.number().min(0).optional(),
  max: z.coerce.number().min(0).optional(),
  sort: z.enum(["date_desc", "date_asc", "amount_desc", "amount_asc"]).default("date_desc"),
})
  // Khoảng bị đảo (từ ngày > đến ngày, min > max – dễ xảy ra khi đang gõ bộ lọc) được tự hoán đổi
  // thay vì báo lỗi, để danh sách không chuyển sang màn hình lỗi.
  .transform((q) => {
    if (q.from && q.to && q.from > q.to) [q.from, q.to] = [q.to, q.from];
    if (q.min !== undefined && q.max !== undefined && q.min > q.max) [q.min, q.max] = [q.max, q.min];
    return q;
  });

export type CreateTransactionInput = z.infer<typeof createTransactionSchema>;
export type UpdateTransactionInput = z.infer<typeof updateTransactionSchema>;
export type TransactionQuery = z.infer<typeof transactionQuerySchema>;
