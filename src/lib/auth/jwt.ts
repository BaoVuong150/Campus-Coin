import { createHash } from "node:crypto";
import jwt from "jsonwebtoken";
import { getJwtSecret } from "@/lib/env";

export const SESSION_COOKIE = "campuscoin_token";
export const SESSION_MAX_AGE_SECONDS = 7 * 24 * 60 * 60;
export const RESET_TOKEN_MAX_AGE_SECONDS = 30 * 60;

/** Audience riêng cho từng loại token: token đặt lại mật khẩu không thể dùng làm cookie phiên và ngược lại. */
const SESSION_AUDIENCE = "campuscoin:session";
const RESET_AUDIENCE = "campuscoin:password-reset";

export type Role = "student" | "admin";

export interface TokenPayload {
  userId: string;
  email: string;
  role: Role;
  name: string;
  /** Phiên bản phiên = dấu vân tay của password_hash hiện tại (xem sessionVersion). */
  sv: string;
}

export type VerifyResult =
  | { status: "valid"; payload: TokenPayload }
  | { status: "expired" }
  | { status: "invalid" };

/**
 * Dấu vân tay ngắn của password_hash. Đổi mật khẩu (tự đổi, admin đặt lại, quên mật khẩu) làm hash đổi,
 * nên mọi token cũ tự động mất hiệu lực mà không cần bảng lưu phiên. Không lộ hash vì chỉ là SHA-256 cắt ngắn.
 */
export function sessionVersion(passwordHash: string, nonce?: string | null): string {
  // nonce: đổi khi user chọn "Đăng xuất mọi thiết bị". Chưa có nonce → giữ nguyên giá trị cũ để phiên hiện tại không bị hủy.
  const source = nonce ? `${passwordHash}:${nonce}` : passwordHash;
  return createHash("sha256").update(source).digest("hex").slice(0, 16);
}

export function signToken(payload: TokenPayload): string {
  return jwt.sign(payload, getJwtSecret(), {
    expiresIn: SESSION_MAX_AGE_SECONDS,
    algorithm: "HS256",
    audience: SESSION_AUDIENCE,
  });
}

export function verifyToken(token: string): VerifyResult {
  try {
    const decoded = jwt.verify(token, getJwtSecret(), { algorithms: ["HS256"], audience: SESSION_AUDIENCE });
    if (typeof decoded !== "object" || !decoded || typeof decoded.userId !== "string" || typeof decoded.sv !== "string") {
      return { status: "invalid" };
    }
    return {
      status: "valid",
      payload: {
        userId: decoded.userId,
        email: String(decoded.email ?? ""),
        role: decoded.role === "admin" ? "admin" : "student",
        name: String(decoded.name ?? ""),
        sv: decoded.sv,
      },
    };
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) return { status: "expired" };
    return { status: "invalid" };
  }
}

/** Token đặt lại mật khẩu: hết hạn sau 30 phút và chỉ dùng được một lần (sv đổi ngay khi mật khẩu đổi). */
export function signResetToken(userId: string, sv: string): string {
  return jwt.sign({ userId, sv }, getJwtSecret(), {
    expiresIn: RESET_TOKEN_MAX_AGE_SECONDS,
    algorithm: "HS256",
    audience: RESET_AUDIENCE,
  });
}

export function verifyResetToken(token: string): { userId: string; sv: string } | null {
  try {
    const decoded = jwt.verify(token, getJwtSecret(), { algorithms: ["HS256"], audience: RESET_AUDIENCE });
    if (typeof decoded !== "object" || !decoded || typeof decoded.userId !== "string" || typeof decoded.sv !== "string") {
      return null;
    }
    return { userId: decoded.userId, sv: decoded.sv };
  } catch {
    return null;
  }
}
