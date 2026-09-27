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
});

export type CreateTransactionInput = z.infer<typeof createTransactionSchema>;
export type UpdateTransactionInput = z.infer<typeof updateTransactionSchema>;
export type TransactionQuery = z.infer<typeof transactionQuerySchema>;
