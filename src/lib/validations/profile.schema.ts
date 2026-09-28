import { z } from "zod";

const moneyOrZero = z.number().min(0, "Số tiền không được âm.").max(1_000_000_000, "Số tiền quá lớn.");

export const notificationPreferencesSchema = z.object({
  budget: z.boolean().default(true),
  recurring: z.boolean().default(true),
  goal: z.boolean().default(true),
  unusual: z.boolean().default(true),
});

export const updateProfileSchema = z
  .object({
    name: z.string().trim().min(2, "Họ tên cần ít nhất 2 ký tự.").max(80),
    academic_year: z.string().trim().max(80).nullable(),
    monthly_allowance_baseline: moneyOrZero,
    monthly_savings_goal: moneyOrZero,
    salary_pay_day: z.number().int().min(1).max(31),
    notifications: notificationPreferencesSchema,
  })
  .partial()
  .refine((v) => Object.keys(v).length > 0, "Không có dữ liệu cần cập nhật.");

export type NotificationPreferences = z.infer<typeof notificationPreferencesSchema>;
export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;
