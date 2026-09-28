import { z } from "zod";
import { amountSchema, categoryIdSchema, monthKeySchema } from "./common.schema";

export const upsertBudgetSchema = z.object({
  category_id: categoryIdSchema,
  month: monthKeySchema,
  limit_amount: amountSchema,
});

export const updateBudgetSchema = z.object({ limit_amount: amountSchema });

export const budgetQuerySchema = z.object({ month: monthKeySchema.optional() });

export type UpsertBudgetInput = z.infer<typeof upsertBudgetSchema>;
