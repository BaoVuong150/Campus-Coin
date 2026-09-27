import jwt from "jsonwebtoken";
import { getJwtSecret } from "@/lib/env";

export const SESSION_COOKIE = "campuscoin_token";
export const SESSION_MAX_AGE_SECONDS = 7 * 24 * 60 * 60;

export type Role = "student" | "admin";

export interface TokenPayload {
  userId: string;
  email: string;
  role: Role;
  name: string;
}

export type VerifyResult =
  | { status: "valid"; payload: TokenPayload }
  | { status: "expired" }
  | { status: "invalid" };

export function signToken(payload: TokenPayload): string {
  return jwt.sign(payload, getJwtSecret(), { expiresIn: SESSION_MAX_AGE_SECONDS, algorithm: "HS256" });
}

export function verifyToken(token: string): VerifyResult {
  try {
    const decoded = jwt.verify(token, getJwtSecret(), { algorithms: ["HS256"] });
    if (typeof decoded !== "object" || !decoded || typeof decoded.userId !== "string") {
      return { status: "invalid" };
    }
    return {
      status: "valid",
      payload: {
        userId: decoded.userId,
        email: String(decoded.email ?? ""),
        role: decoded.role === "admin" ? "admin" : "student",
        name: String(decoded.name ?? ""),
      },
    };
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) return { status: "expired" };
    return { status: "invalid" };
  }
}
