import { cookies } from "next/headers";
import { cache } from "react";
import { prisma } from "@/lib/database/prisma";
import { Errors } from "@/lib/api/errors";
import { SESSION_COOKIE, sessionVersion, verifyToken, type Role } from "./jwt";

export interface SessionUser {
  id: string;
  name: string;
  email: string;
  role: Role;
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
    select: { id: true, name: true, email: true, role: true, is_active: true, password_hash: true },
  });
  if (!user) return { status: "anonymous" };
  if (!user.is_active) return { status: "disabled" };
  // Mật khẩu đã đổi sau khi token được cấp → phiên cũ hết hiệu lực (báo "hết hạn" để UI yêu cầu đăng nhập lại).
  if (sessionVersion(user.password_hash) !== result.payload.sv) return { status: "expired" };

  return {
    status: "authenticated",
    user: { id: user.id, name: user.name, email: user.email, role: user.role === "admin" ? "admin" : "student" },
  };
});

export async function getSession(): Promise<SessionUser | null> {
  const state = await getSessionState();
  return state.status === "authenticated" ? state.user : null;
}

export async function requireAuth(): Promise<SessionUser> {
  const state = await getSessionState();
  if (state.status === "authenticated") return state.user;
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
