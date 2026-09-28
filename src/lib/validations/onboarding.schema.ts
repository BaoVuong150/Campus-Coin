import { z } from "zod";
import { amountSchema, categoryIdSchema } from "./common.schema";

const moneyOrZero = z.number().min(0, "Số tiền không được âm.").max(1_000_000_000, "Số tiền quá lớn.");

export const onboardingSchema = z.discriminatedUnion("skip", [
  z.object({ skip: z.literal(true) }),
  z.object({
    skip: z.literal(false),
    monthly_allowance: moneyOrZero,
    pay_day: z.number().int().min(1, "Ngày nhận từ 1 đến 31.").max(31, "Ngày nhận từ 1 đến 31."),
    monthly_savings_goal: moneyOrZero,
    /** Tự ghi khoản trợ cấp vào ngày nhận mỗi tháng (tạo khoản thu định kỳ). */
    auto_allowance: z.boolean(),
    budgets: z
      .array(z.object({ category_id: categoryIdSchema, limit_amount: amountSchema }))
      .max(10, "Tối đa 10 ngân sách khởi đầu."),
  }),
]);

export type OnboardingInput = z.infer<typeof onboardingSchema>;
