import { NextResponse, type NextRequest } from "next/server";
import { SESSION_COOKIE, verifyToken, type VerifyResult } from "@/lib/auth/jwt";

const APP_PREFIXES = ["/dashboard", "/transactions", "/budgets", "/reports", "/goals", "/recurring", "/points", "/notifications", "/settings"];
const AUTH_PAGES = ["/login", "/register"];

function readSession(request: NextRequest): VerifyResult {
  const token = request.cookies.get(SESSION_COOKIE)?.value;
  if (!token) return { status: "invalid" };
  try {
    return verifyToken(token);
  } catch {
    return { status: "invalid" };
  }
}

function redirectTo(request: NextRequest, path: string, params?: Record<string, string>) {
  const url = new URL(path, request.url);
  for (const [k, v] of Object.entries(params ?? {})) url.searchParams.set(k, v);
  return NextResponse.redirect(url);
}

/**
 * Lớp chuyển hướng nhanh (optimistic). Đây KHÔNG phải lớp phân quyền duy nhất:
 * layout server và từng API route vẫn gọi requireAuth()/requireAdmin() và đối chiếu DB.
 */
export function proxy(request: NextRequest) {
  const { pathname, search } = request.nextUrl;
  const session = readSession(request);
  const user = session.status === "valid" ? session.payload : null;
  const home = user?.role === "admin" ? "/admin" : "/dashboard";

  if (AUTH_PAGES.includes(pathname) && user) return redirectTo(request, home);
  if (pathname === "/admin/login" && user?.role === "admin") return redirectTo(request, "/admin");

  const isApp = APP_PREFIXES.some((p) => pathname === p || pathname.startsWith(`${p}/`));
  if (isApp && !user) {
    return redirectTo(request, "/login", {
      next: `${pathname}${search}`,
      ...(session.status === "expired" ? { reason: "expired" } : {}),
    });
  }

  if (pathname.startsWith("/admin") && pathname !== "/admin/login" && user?.role !== "admin") {
    return redirectTo(request, "/admin/login", session.status === "expired" ? { reason: "expired" } : undefined);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/login",
    "/register",
    "/admin/:path*",
    "/dashboard/:path*",
    "/transactions/:path*",
    "/budgets/:path*",
    "/reports/:path*",
    "/goals/:path*",
    "/recurring/:path*",
    "/points/:path*",
    "/notifications/:path*",
    "/settings/:path*",
  ],
};
