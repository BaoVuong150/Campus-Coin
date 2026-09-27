import { z } from "zod";
import { PASSWORD_MIN_LENGTH } from "@/constants/finance";
import { isStrongPassword } from "./rules";

const emailSchema = z
  .string("Vui lòng nhập email.")
  .trim()
  .toLowerCase()
  .min(1, "Vui lòng nhập email.")
  .max(254, "Email quá dài.")
  .email("Email không hợp lệ.");

export const passwordSchema = z
  .string("Vui lòng nhập mật khẩu.")
  .min(PASSWORD_MIN_LENGTH, `Mật khẩu cần tối thiểu ${PASSWORD_MIN_LENGTH} ký tự.`)
  .max(72, "Mật khẩu tối đa 72 ký tự.")
  .refine(isStrongPassword, "Mật khẩu cần có cả chữ và số.");

export const loginSchema = z.object({
  email: emailSchema,
  password: z.string("Vui lòng nhập mật khẩu.").min(1, "Vui lòng nhập mật khẩu.").max(72),
  portal: z.enum(["student", "admin"]).default("student"),
});

export const registerSchema = z.object({
  name: z.string("Vui lòng nhập họ tên.").trim().min(2, "Họ tên cần ít nhất 2 ký tự.").max(80, "Họ tên quá dài."),
  email: emailSchema,
  password: passwordSchema,
  academic_year: z.string().trim().max(80).optional(),
  monthly_allowance_baseline: z.number().min(0).max(1_000_000_000).optional(),
  monthly_savings_goal: z.number().min(0).max(1_000_000_000).optional(),
});

export const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, "Vui lòng nhập mật khẩu hiện tại."),
    newPassword: passwordSchema,
  })
  .refine((v) => v.currentPassword !== v.newPassword, {
    message: "Mật khẩu mới phải khác mật khẩu hiện tại.",
    path: ["newPassword"],
  });

export type LoginInput = z.infer<typeof loginSchema>;
export type RegisterInput = z.infer<typeof registerSchema>;
