import { cookies } from "next/headers";
import { cache } from "react";
import { prisma } from "@/lib/database/prisma";
import { Errors } from "@/lib/api/errors";
import { SESSION_COOKIE, sessionVersion, verifyToken, type Role } from "./jwt";
import { mustChangePassword, sessionNonce } from "./account-flags";

export interface SessionUser {
  id: string;
  name: string;
  email: string;
  role: Role;
  /** Đăng nhập bằng mật khẩu tạm do admin cấp → phải đổi mật khẩu trước khi dùng app. */
  mustChangePassword: boolean;
}

export type SessionState =
  | { status: "authenticated"; user: SessionUser }
  | { status: "anonymous" }
  | { status: "expired" }
  | { status: "disabled" };

/**
 * Xác thực phiên từ cookie và đối chiếu lại với DB (user còn tồn tại, còn hoạt động, role hiện tại).
 * Role lấy từ DB chứ không tin vào token, để việc đổi quyền/vô hiệu hóa có hiệu lực ngay.
 */
export const getSessionState = cache(async (): Promise<SessionState> => {
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  if (!token) return { status: "anonymous" };

  const result = verifyToken(token);
  if (result.status === "expired") return { status: "expired" };
  if (result.status === "invalid") return { status: "anonymous" };

  const user = await prisma.user.findUnique({
    where: { id: result.payload.userId },
    select: { id: true, name: true, email: true, role: true, is_active: true, password_hash: true, preferences: true },
  });
  if (!user) return { status: "anonymous" };
  if (!user.is_active) return { status: "disabled" };
  // Mật khẩu đã đổi hoặc user đã "đăng xuất mọi thiết bị" sau khi token được cấp → phiên cũ hết hiệu lực.
  if (sessionVersion(user.password_hash, sessionNonce(user.preferences)) !== result.payload.sv) return { status: "expired" };

  return {
    status: "authenticated",
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role === "admin" ? "admin" : "student",
      mustChangePassword: mustChangePassword(user.preferences),
    },
  };
});

export async function getSession(): Promise<SessionUser | null> {
  const state = await getSessionState();
  return state.status === "authenticated" ? state.user : null;
}

interface RequireAuthOptions {
  /** Cho phép gọi khi user còn phải đổi mật khẩu tạm (chỉ dành cho API đổi mật khẩu / đọc phiên). */
  allowPendingPasswordChange?: boolean;
}

export async function requireAuth({ allowPendingPasswordChange = false }: RequireAuthOptions = {}): Promise<SessionUser> {
  const state = await getSessionState();
  if (state.status === "authenticated") {
    if (state.user.mustChangePassword && !allowPendingPasswordChange) throw Errors.passwordChangeRequired();
    return state.user;
  }
  if (state.status === "expired") throw Errors.sessionExpired();
  if (state.status === "disabled") throw Errors.accountDisabled();
  throw Errors.unauthorized();
}

export async function requireRole(...roles: Role[]): Promise<SessionUser> {
  const user = await requireAuth();
  if (!roles.includes(user.role)) throw Errors.forbidden();
  return user;
}

export function requireAdmin(): Promise<SessionUser> {
  return requireRole("admin");
}

export { assertResourceOwner } from "./ownership";
