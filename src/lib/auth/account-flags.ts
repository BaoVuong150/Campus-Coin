import type { Prisma } from "@prisma/client";

/*
 * Trạng thái tài khoản lưu trong users.preferences (cột JSON sẵn có) nên không cần migration:
 * - mustChangePassword: admin đặt lại mật khẩu → bật; user đổi mật khẩu → tắt.
 * - sessionNonce: đổi giá trị để đăng xuất mọi thiết bị (xem sessionVersion trong jwt.ts).
 */
const FLAG = "mustChangePassword";
const NONCE = "sessionNonce";

function asObject(value: Prisma.JsonValue | null | undefined): Prisma.JsonObject {
  return value && typeof value === "object" && !Array.isArray(value) ? (value as Prisma.JsonObject) : {};
}

export function mustChangePassword(preferences: Prisma.JsonValue | null | undefined): boolean {
  return asObject(preferences)[FLAG] === true;
}

/** preferences mới với cờ bật/tắt, giữ nguyên các tùy chọn khác (thông báo…). */
export function withPasswordChangeFlag(preferences: Prisma.JsonValue | null | undefined, required: boolean): Prisma.JsonObject {
  const rest = { ...asObject(preferences) };
  delete rest[FLAG];
  return required ? { ...rest, [FLAG]: true } : rest;
}

export function sessionNonce(preferences: Prisma.JsonValue | null | undefined): string | null {
  const value = asObject(preferences)[NONCE];
  return typeof value === "string" ? value : null;
}

/** preferences mới với session nonce mới – mọi token phiên cũ mất hiệu lực. */
export function withSessionNonce(preferences: Prisma.JsonValue | null | undefined, nonce: string): Prisma.JsonObject {
  return { ...asObject(preferences), [NONCE]: nonce };
}

// ---------- Onboarding & đồng bộ trợ cấp ----------

const ONBOARDED = "onboardingCompleted";
const ALLOWANCE_RECURRING = "allowanceRecurringId";

export function isOnboarded(preferences: Prisma.JsonValue | null | undefined): boolean {
  return asObject(preferences)[ONBOARDED] === true;
}

/** Id khoản thu định kỳ "trợ cấp hằng tháng" do onboarding tạo – để Cài đặt đồng bộ khi đổi số tiền/ngày nhận. */
export function allowanceRecurringId(preferences: Prisma.JsonValue | null | undefined): string | null {
  const value = asObject(preferences)[ALLOWANCE_RECURRING];
  return typeof value === "string" ? value : null;
}

export function withOnboarding(
  preferences: Prisma.JsonValue | null | undefined,
  recurringId: string | null
): Prisma.JsonObject {
  const next: Prisma.JsonObject = { ...asObject(preferences), [ONBOARDED]: true };
  if (recurringId) next[ALLOWANCE_RECURRING] = recurringId;
  return next;
}
