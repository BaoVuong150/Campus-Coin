import bcrypt from "bcryptjs";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/database/prisma";
import { ApiError, Errors } from "@/lib/api/errors";
import type { SessionGrant } from "@/lib/auth/cookies";
import { sessionVersion, signResetToken, verifyResetToken, RESET_TOKEN_MAX_AGE_SECONDS } from "@/lib/auth/jwt";
import { sendMail } from "@/lib/mail/mailer";
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

export async function authenticate(input: LoginInput): Promise<SessionGrant> {
  const user = await prisma.user.findUnique({ where: { email: input.email } });
  const valid = await bcrypt.compare(input.password, user?.password_hash ?? DUMMY_HASH);
  if (!user || !valid) throw invalidCredentials();
  if (!user.is_active) throw Errors.accountDisabled();
  // Cổng admin chỉ chấp nhận admin; trả về lỗi chung để không lộ loại tài khoản.
  if (input.portal === "admin" && user.role !== "admin") throw invalidCredentials();

  await prisma.user.update({ where: { id: user.id }, data: { last_login_at: new Date() } });
  return {
    user: { id: user.id, name: user.name, email: user.email, role: user.role === "admin" ? "admin" : "student" },
    sv: sessionVersion(user.password_hash),
  };
}

export async function registerStudent(input: RegisterInput): Promise<SessionGrant> {
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
    return { user: { id: user.id, name: user.name, email: user.email, role: "student" }, sv: sessionVersion(user.password_hash) };
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

/** Đổi mật khẩu. Trả về phiên mới cho thiết bị hiện tại; mọi phiên cũ (thiết bị khác) tự mất hiệu lực. */
export async function changePassword(userId: string, currentPassword: string, newPassword: string): Promise<SessionGrant> {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user || !(await bcrypt.compare(currentPassword, user.password_hash))) {
    throw Errors.badRequest("Mật khẩu hiện tại không đúng.", { currentPassword: "Mật khẩu hiện tại không đúng." });
  }
  const password_hash = await hashPassword(newPassword);
  await prisma.user.update({ where: { id: userId }, data: { password_hash } });
  return {
    user: { id: user.id, name: user.name, email: user.email, role: user.role === "admin" ? "admin" : "student" },
    sv: sessionVersion(password_hash),
  };
}

// ---------- Quên mật khẩu ----------

/**
 * Gửi link đặt lại mật khẩu nếu email thuộc một tài khoản đang hoạt động. Luôn kết thúc "thành công"
 * ở phía gọi (không tiết lộ email có tồn tại hay không).
 */
export async function requestPasswordReset(email: string, baseUrl: string): Promise<void> {
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user || !user.is_active) return;
  if (!baseUrl) {
    console.warn("[auth] APP_URL chưa được cấu hình – không thể dựng link đặt lại mật khẩu.");
    return;
  }

  const token = signResetToken(user.id, sessionVersion(user.password_hash));
  const link = `${baseUrl}/reset-password?token=${encodeURIComponent(token)}`;
  const minutes = RESET_TOKEN_MAX_AGE_SECONDS / 60;
  await sendMail({
    to: user.email,
    subject: "Campus Coin – Đặt lại mật khẩu / Reset your password",
    text: [
      `Xin chào ${user.name},`,
      "",
      `Mở link sau để đặt lại mật khẩu (hiệu lực ${minutes} phút, dùng một lần):`,
      link,
      "",
      `Open this link to reset your password (valid for ${minutes} minutes, single use):`,
      link,
      "",
      "Nếu bạn không yêu cầu, hãy bỏ qua email này. / If you did not request this, ignore this email.",
    ].join("\n"),
    html:
      `<p>Xin chào ${escapeHtml(user.name)},</p>` +
      `<p>Nhấn vào link sau để đặt lại mật khẩu (hiệu lực ${minutes} phút, dùng một lần):<br>` +
      `<a href="${escapeHtml(link)}">Đặt lại mật khẩu / Reset password</a></p>` +
      "<p>Nếu bạn không yêu cầu, hãy bỏ qua email này. / If you did not request this, ignore this email.</p>",
  });
}

const invalidResetLink = () =>
  Errors.badRequest("Link đặt lại mật khẩu không hợp lệ hoặc đã hết hạn.", { token: "Link không hợp lệ hoặc đã hết hạn." });

/** Đặt mật khẩu mới bằng token trong email. Token chỉ dùng được một lần vì sv đổi ngay khi mật khẩu đổi. */
export async function resetPasswordWithToken(token: string, newPassword: string): Promise<void> {
  const payload = verifyResetToken(token);
  if (!payload) throw invalidResetLink();

  const user = await prisma.user.findUnique({ where: { id: payload.userId }, select: { password_hash: true, is_active: true } });
  if (!user || !user.is_active || sessionVersion(user.password_hash) !== payload.sv) throw invalidResetLink();

  // Điều kiện theo password_hash cũ: hai request dùng cùng token song song thì chỉ một request thành công.
  const { count } = await prisma.user.updateMany({
    where: { id: payload.userId, password_hash: user.password_hash },
    data: { password_hash: await hashPassword(newPassword) },
  });
  if (count === 0) throw invalidResetLink();
}

function escapeHtml(value: string): string {
  return value.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);
}
