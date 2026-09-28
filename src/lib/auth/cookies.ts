import type { NextResponse } from "next/server";
import { isProduction } from "@/lib/env";
import { SESSION_COOKIE, SESSION_MAX_AGE_SECONDS, signToken } from "./jwt";
import type { SessionUser } from "./session";

/** Kết quả xác thực thành công: user + phiên bản phiên (dấu vân tay mật khẩu hiện tại) để ký token. */
export interface SessionGrant {
  user: SessionUser;
  sv: string;
}

const baseCookie = {
  httpOnly: true,
  secure: isProduction,
  sameSite: "lax" as const,
  path: "/",
};

export function setSessionCookie(response: NextResponse, token: string) {
  response.cookies.set(SESSION_COOKIE, token, { ...baseCookie, maxAge: SESSION_MAX_AGE_SECONDS });
}

export function clearSessionCookie(response: NextResponse) {
  response.cookies.set(SESSION_COOKIE, "", { ...baseCookie, maxAge: 0 });
}

/** Ký token phiên và gắn cookie – điểm duy nhất cấp phiên (đăng nhập, đăng ký, sau khi đổi mật khẩu). */
export function startSession(response: NextResponse, { user, sv }: SessionGrant) {
  setSessionCookie(response, signToken({ userId: user.id, email: user.email, role: user.role, name: user.name, sv }));
}
