import bcrypt from "bcryptjs";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/database/prisma";
import { ApiError, Errors } from "@/lib/api/errors";
import type { SessionUser } from "@/lib/auth/session";
import type { LoginInput, RegisterInput } from "@/lib/validations/auth.schema";
import type { UpdateProfileInput } from "@/lib/validations/profile.schema";
import type { ProfileDTO } from "@/types/finance";
import { readNotificationPreferences } from "./notification.service";
import { toNumber } from "./mappers";

const BCRYPT_ROUNDS = 12;
/** Hash giả để so sánh khi email không tồn tại, giữ thời gian phản hồi đồng đều (chống dò email). */
const DUMMY_HASH = "$2b$12$2KUPfUvkxpkFKFnH3DzId.zA/WkYSXMVwoNW4VwLvh2qi224uPTeG";

export const INVALID_CREDENTIALS_MESSAGE = "Email hoặc mật khẩu không chính xác.";
const invalidCredentials = () => new ApiError(401, "INVALID_CREDENTIALS", INVALID_CREDENTIALS_MESSAGE);

export function hashPassword(password: string) {
  return bcrypt.hash(password, BCRYPT_ROUNDS);
}

export async function authenticate(input: LoginInput): Promise<SessionUser> {
  const user = await prisma.user.findUnique({ where: { email: input.email } });
  const valid = await bcrypt.compare(input.password, user?.password_hash ?? DUMMY_HASH);
  if (!user || !valid) throw invalidCredentials();
  if (!user.is_active) throw Errors.accountDisabled();
  // Cổng admin chỉ chấp nhận admin; trả về lỗi chung để không lộ loại tài khoản.
  if (input.portal === "admin" && user.role !== "admin") throw invalidCredentials();

  await prisma.user.update({ where: { id: user.id }, data: { last_login_at: new Date() } });
  return { id: user.id, name: user.name, email: user.email, role: user.role === "admin" ? "admin" : "student" };
}

export async function registerStudent(input: RegisterInput): Promise<SessionUser> {
  try {
    const user = await prisma.user.create({
      data: {
        name: input.name,
        email: input.email,
        password_hash: await hashPassword(input.password),
        role: "student",
        academic_year: input.academic_year || null,
        monthly_allowance_baseline: input.monthly_allowance_baseline ?? 0,
        monthly_savings_goal: input.monthly_savings_goal ?? 0,
        last_login_at: new Date(),
      },
    });
    return { id: user.id, name: user.name, email: user.email, role: "student" };
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      throw Errors.conflict("EMAIL_TAKEN", "Email này đã được sử dụng.");
    }
    throw error;
  }
}

export async function getProfile(userId: string): Promise<ProfileDTO> {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) throw Errors.notFound("USER_NOT_FOUND", "Không tìm thấy người dùng.");
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role === "admin" ? "admin" : "student",
    academicYear: user.academic_year,
    monthlyAllowance: toNumber(user.monthly_allowance_baseline),
    monthlySavingsGoal: toNumber(user.monthly_savings_goal),
    salaryPayDay: user.salary_pay_day ?? 1,
    notifications: readNotificationPreferences(user.preferences),
    createdAt: user.created_at.toISOString(),
  };
}

export async function updateProfile(userId: string, input: UpdateProfileInput): Promise<ProfileDTO> {
  const data: Prisma.UserUpdateInput = {
    name: input.name,
    academic_year: input.academic_year,
    monthly_allowance_baseline: input.monthly_allowance_baseline,
    monthly_savings_goal: input.monthly_savings_goal,
    salary_pay_day: input.salary_pay_day,
  };
  if (input.notifications) {
    const current = await prisma.user.findUnique({ where: { id: userId }, select: { preferences: true } });
    const base =
      current?.preferences && typeof current.preferences === "object" && !Array.isArray(current.preferences)
        ? (current.preferences as Prisma.JsonObject)
        : {};
    data.preferences = { ...base, notifications: input.notifications };
  }
  await prisma.user.update({ where: { id: userId }, data });
  return getProfile(userId);
}

export async function changePassword(userId: string, currentPassword: string, newPassword: string) {
  const user = await prisma.user.findUnique({ where: { id: userId }, select: { password_hash: true } });
  if (!user || !(await bcrypt.compare(currentPassword, user.password_hash))) {
    throw Errors.badRequest("Mật khẩu hiện tại không đúng.", { currentPassword: "Mật khẩu hiện tại không đúng." });
  }
  await prisma.user.update({ where: { id: userId }, data: { password_hash: await hashPassword(newPassword) } });
}
