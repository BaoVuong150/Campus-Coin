import { z } from "zod";
import { GOAL_STATUSES, MAX_NAME_LENGTH } from "@/constants/finance";
import { amountSchema, ymdSchema } from "./common.schema";

export const createGoalSchema = z.object({
  name: z.string("Vui lòng nhập tên mục tiêu.").trim().min(1, "Vui lòng nhập tên mục tiêu.").max(MAX_NAME_LENGTH),
  target_amount: amountSchema,
  deadline: ymdSchema.nullish(),
  icon: z.string().trim().max(40).optional(),
});

export const updateGoalSchema = createGoalSchema.partial().extend({
  status: z.enum(GOAL_STATUSES).optional(),
});

export const goalContributionSchema = z.object({
  amount: amountSchema,
  direction: z.enum(["deposit", "withdraw"]),
  note: z.string().trim().max(120).optional(),
});
