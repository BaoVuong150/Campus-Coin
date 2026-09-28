import { z } from "zod";
import { MAX_NAME_LENGTH, RECURRING_FREQUENCIES, RECURRING_STATUSES } from "@/constants/finance";
import { amountSchema, categoryIdSchema, transactionTypeSchema, ymdSchema } from "./common.schema";

export const createRecurringSchema = z.object({
  name: z.string("Vui lòng nhập tên khoản định kỳ.").trim().min(1, "Vui lòng nhập tên khoản định kỳ.").max(MAX_NAME_LENGTH),
  amount: amountSchema,
  type: transactionTypeSchema,
  category_id: categoryIdSchema,
  frequency: z.enum(RECURRING_FREQUENCIES),
  start_date: ymdSchema,
  end_date: ymdSchema.nullish(),
  is_fixed: z.boolean().default(true),
});

export const updateRecurringSchema = createRecurringSchema
  .omit({ start_date: true })
  .partial()
  .extend({ status: z.enum(RECURRING_STATUSES).optional() });
