import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const JWT_SECRET = process.env.JWT_SECRET || "campuscoin_techwiz7_secret_key_2026";

/**
 * Xác thực HMAC-SHA256 JWT ngay tại Edge/Proxy bằng Web Crypto API tiêu chuẩn.
 * Không cần bất kỳ thư viện Node.js bên ngoài nào, chạy cực nhanh và an toàn tuyệt đối.
 */
async function verifyJwtEdge(
  token: string
): Promise<{ userId: string; role: string; email: string; name: string } | null> {
  try {
    const parts = token.split(".");
    if (parts.length !== 3) return null;
    const [headerB64, payloadB64, signatureB64] = parts;

    // 1. Giải mã Payload
    let base64 = payloadB64.replace(/-/g, "+").replace(/_/g, "/");
    while (base64.length % 4 !== 0) base64 += "=";
    const jsonStr = atob(base64);
    const payload = JSON.parse(jsonStr);

    // 2. Kiểm tra thời hạn Token
    if (payload.exp && payload.exp * 1000 < Date.now()) {
      return null;
    }

    // 3. Kiểm tra chữ ký mật mã
    const encoder = new TextEncoder();
    const key = await crypto.subtle.importKey(
      "raw",
      encoder.encode(JWT_SECRET),
      { name: "HMAC", hash: "SHA-256" },
      false,
      ["verify"]
    );

    let sigBase64 = signatureB64.replace(/-/g, "+").replace(/_/g, "/");
    while (sigBase64.length % 4 !== 0) sigBase64 += "=";
    const sigBinary = atob(sigBase64);
    const sigBytes = new Uint8Array(sigBinary.length);
    for (let i = 0; i < sigBinary.length; i++) {
      sigBytes[i] = sigBinary.charCodeAt(i);
    }

    const dataBytes = encoder.encode(`${headerB64}.${payloadB64}`);
    const isValid = await crypto.subtle.verify("HMAC", key, sigBytes, dataBytes);

    if (!isValid) return null;
    return payload;
  } catch {
    return null;
  }
}

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const token = request.cookies.get("campuscoin_token")?.value;
  const user = token ? await verifyJwtEdge(token) : null;

  // 1. CẤM TUYỆT ĐỐI: Người dùng đã đăng nhập thành công KHÔNG ĐƯỢC PHÉP vào lại /login hoặc /register
  if (pathname === "/login" || pathname === "/register") {
    if (user) {
      if (user.role === "admin") {
        return NextResponse.redirect(new URL("/admin", request.url));
      }
      return NextResponse.redirect(new URL("/dashboard", request.url));
    }
  }

  // 2. Cổng /admin/login: Nếu đã đăng nhập với quyền admin thì chuyển thẳng vào /admin
  if (pathname === "/admin/login") {
    if (user && user.role === "admin") {
      return NextResponse.redirect(new URL("/admin", request.url));
    }
  }

  // 3. Bảo vệ /dashboard: Nếu chưa đăng nhập thì chuyển hướng về /login
  if (pathname.startsWith("/dashboard")) {
    if (!user) {
      const loginUrl = new URL("/login", request.url);
      return NextResponse.redirect(loginUrl);
    }
  }

  // 4. Bảo vệ /admin (trừ cổng /admin/login): Yêu cầu quyền admin
  if (pathname.startsWith("/admin") && pathname !== "/admin/login") {
    if (!user || user.role !== "admin") {
      const adminLoginUrl = new URL("/admin/login", request.url);
      return NextResponse.redirect(adminLoginUrl);
    }
  }

  return NextResponse.next();
}

// Giữ alias middleware để tương thích đa nền tảng
export const middleware = proxy;

export const config = {
  matcher: [
    "/login",
    "/register",
    "/admin/login",
    "/dashboard/:path*",
    "/admin/:path*",
  ],
};
