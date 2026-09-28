import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { Prisma } from "@prisma/client";

/**
 * Kiểm thử giai đoạn hoàn thiện: đăng xuất mọi thiết bị, độ tin cậy dự báo, onboarding + đồng bộ trợ cấp,
 * bảo vệ lịch sử mục tiêu, chống CSRF, URL email ở production, cô lập lỗi scheduler, health check.
 */

const cookieStore = { value: undefined as string | undefined };
vi.mock("next/headers", () => ({
  cookies: async () => ({ get: () => (cookieStore.value ? { value: cookieStore.value } : undefined) }),
}));

const db = vi.hoisted(() => ({
  user: { findUnique: vi.fn(), update: vi.fn() },
  savingGoal: { findUnique: vi.fn(), delete: vi.fn() },
  goalContribution: { count: vi.fn() },
  recurringTransaction: { findFirst: vi.fn(), findMany: vi.fn(), update: vi.fn(), updateMany: vi.fn() },
  notification: { createMany: vi.fn() },
  $transaction: vi.fn(),
  $queryRaw: vi.fn(),
}));
vi.mock("@/lib/database/prisma", () => ({ prisma: db }));

import { ApiError } from "@/lib/api/errors";
import { assertSameOrigin } from "@/lib/api/response";
import { sessionNonce, withSessionNonce } from "@/lib/auth/account-flags";
import { sessionVersion, signToken } from "@/lib/auth/jwt";
import { requireAuth } from "@/lib/auth/session";
import { FORECAST_CONFIDENCE_DAYS, forecastConfidence } from "@/lib/finance/forecast";
import { nextPayDate, suggestStarterBudgets } from "@/lib/finance/onboarding";
import { storageDate, toYmd } from "@/lib/utils/date";
import { onboardingSchema } from "@/lib/validations/onboarding.schema";
import { deleteGoal } from "@/services/goal.service";
import { syncAllowanceRecurring } from "@/services/onboarding.service";
import { runDueRecurring } from "@/services/recurring.service";
import { signOutAllDevices } from "@/services/user.service";
import { GET as health } from "@/app/api/health/route";

const USER_A = "11111111-1111-4111-8111-111111111111";
const GOAL = "44444444-4444-4444-8444-444444444444";
const REC = "55555555-5555-4555-8555-555555555555";
const HASH = "$2b$04$storedhashstoredhashstoredhashstoredhashstoredhash12";

beforeEach(() => {
  vi.clearAllMocks();
  cookieStore.value = undefined;
  db.notification.createMany.mockResolvedValue({ count: 1 });
  db.$transaction.mockImplementation((arg: unknown) =>
    typeof arg === "function" ? (arg as (tx: typeof db) => unknown)(db) : Promise.all(arg as unknown[])
  );
});

async function expectApiError(promise: Promise<unknown>, code: string) {
  const error = await promise.catch((e) => e);
  expect(error).toBeInstanceOf(ApiError);
  expect((error as ApiError).code).toBe(code);
}

const dbUser = (preferences: Prisma.JsonValue) => ({
  id: USER_A,
  name: "A",
  email: "a@test.dev",
  role: "student",
  is_active: true,
  password_hash: HASH,
  preferences,
});

describe("đăng xuất mọi thiết bị", () => {
  it("chưa từng dùng → phiên bản phiên giữ nguyên như cũ (không ai bị đăng xuất khi triển khai)", () => {
    expect(sessionVersion(HASH, null)).toBe(sessionVersion(HASH));
  });

  it("token cũ mất hiệu lực, thiết bị hiện tại nhận phiên mới hợp lệ", async () => {
    const oldToken = signToken({ userId: USER_A, email: "a", role: "student", name: "A", sv: sessionVersion(HASH) });
    db.user.findUnique.mockResolvedValue(dbUser({ notifications: { budget: false } }));
    const grant = await signOutAllDevices(USER_A);

    const saved = db.user.update.mock.calls[0][0].data.preferences as Prisma.JsonObject;
    expect(saved.notifications).toEqual({ budget: false });
    expect(sessionNonce(saved)).toBeTruthy();

    // Sau khi đổi nonce: token cũ → hết hạn; token mới → hợp lệ.
    db.user.findUnique.mockResolvedValue(dbUser(saved));
    cookieStore.value = oldToken;
    await expectApiError(requireAuth(), "SESSION_EXPIRED");
    cookieStore.value = signToken({ userId: USER_A, email: "a", role: "student", name: "A", sv: grant.sv });
    await expect(requireAuth()).resolves.toMatchObject({ id: USER_A });

    // Có thông báo bảo mật.
    expect(db.notification.createMany.mock.calls[0][0].data[0]).toMatchObject({ kind: "security", template: "sessionsRevoked" });
  });

  it("nonce mới mỗi lần", () => {
    expect(sessionNonce(withSessionNonce({}, "a"))).toBe("a");
    expect(sessionVersion(HASH, "a")).not.toBe(sessionVersion(HASH, "b"));
  });
});

describe("độ tin cậy dự báo", () => {
  it.each([
    [0, "current_month", "insufficient"],
    [FORECAST_CONFIDENCE_DAYS.minimum - 1, "current_month", "insufficient"],
    [FORECAST_CONFIDENCE_DAYS.minimum, "current_month", "low"],
    [20, "history", "medium"],
    [90, "current_month", "high"],
    [90, "none", "insufficient"],
  ] as const)("%d ngày, nguồn %s → %s", (days, source, expected) => {
    expect(forecastConfidence(days, source)).toBe(expected);
  });
});

describe("onboarding", () => {
  it("gợi ý ngân sách theo thu nhập, làm tròn 10.000 ₫", () => {
    const s = suggestStarterBudgets(3_000_000);
    expect(s.find((x) => x.category === "food")?.amount).toBe(1_050_000);
    expect(s.every((x) => x.amount % 10_000 === 0 && x.amount > 0)).toBe(true);
    expect(s.reduce((a, x) => a + x.amount, 0)).toBeLessThan(3_000_000);
    expect(suggestStarterBudgets(0)).toEqual([]);
    expect(suggestStarterBudgets(Number.NaN)).toEqual([]);
  });

  it.each([
    ["2026-09-03", 5, "2026-09-05"],
    ["2026-09-05", 5, "2026-10-05"],
    ["2026-01-31", 31, "2026-02-28"],
    ["2026-12-20", 10, "2027-01-10"],
  ])("hôm nay %s, ngày nhận %d → %s", (today, payDay, expected) => {
    const [y, m, d] = today.split("-").map(Number);
    expect(nextPayDate(payDay, storageDate(y, m, d))).toBe(expected);
  });

  it("schema: bỏ qua hợp lệ, ngày nhận ngoài 1–31 bị từ chối", () => {
    expect(onboardingSchema.safeParse({ skip: true }).success).toBe(true);
    const base = { skip: false, monthly_allowance: 3_000_000, monthly_savings_goal: 0, auto_allowance: true, budgets: [] };
    expect(onboardingSchema.safeParse({ ...base, pay_day: 5 }).success).toBe(true);
    expect(onboardingSchema.safeParse({ ...base, pay_day: 32 }).success).toBe(false);
    expect(onboardingSchema.safeParse({ ...base, pay_day: 5, monthly_allowance: -1 }).success).toBe(false);
  });

  it("đổi trợ cấp / ngày nhận trong Cài đặt → cập nhật khoản thu định kỳ đã liên kết", async () => {
    db.recurringTransaction.findFirst.mockResolvedValue({ id: REC, user_id: USER_A, anchor_day: 5, status: "active" });
    await syncAllowanceRecurring(USER_A, { allowanceRecurringId: REC }, 4_000_000, 10);
    const data = db.recurringTransaction.update.mock.calls[0][0].data;
    expect(data.amount).toBe(4_000_000);
    expect(data.anchor_day).toBe(10);
    expect(toYmd(data.next_run_date).endsWith("-10")).toBe(true);
    expect(db.recurringTransaction.findFirst.mock.calls[0][0].where).toMatchObject({ id: REC, user_id: USER_A });
  });

  it("trợ cấp = 0 → tạm dừng lịch; chưa liên kết → không làm gì", async () => {
    db.recurringTransaction.findFirst.mockResolvedValue({ id: REC, user_id: USER_A, anchor_day: 5, status: "active" });
    await syncAllowanceRecurring(USER_A, { allowanceRecurringId: REC }, 0, undefined);
    expect(db.recurringTransaction.update.mock.calls[0][0].data).toEqual({ status: "paused" });

    vi.clearAllMocks();
    await syncAllowanceRecurring(USER_A, {}, 4_000_000, 10);
    expect(db.recurringTransaction.findFirst).not.toHaveBeenCalled();
  });
});

describe("mục tiêu: không xóa mất lịch sử", () => {
  it("đã có lịch sử nạp/rút → 409, phải lưu trữ", async () => {
    db.savingGoal.findUnique.mockResolvedValue({ id: GOAL, user_id: USER_A });
    db.goalContribution.count.mockResolvedValue(3);
    await expectApiError(deleteGoal(USER_A, GOAL), "GOAL_HAS_HISTORY");
    expect(db.savingGoal.delete).not.toHaveBeenCalled();
  });

  it("chưa có lịch sử → xóa được", async () => {
    db.savingGoal.findUnique.mockResolvedValue({ id: GOAL, user_id: USER_A });
    db.goalContribution.count.mockResolvedValue(0);
    await deleteGoal(USER_A, GOAL);
    expect(db.savingGoal.delete).toHaveBeenCalledWith({ where: { id: GOAL } });
  });
});

describe("chống CSRF theo Origin", () => {
  const req = (method: string, headers: Record<string, string>) => new Request("https://campus.example/api/x", { method, headers });

  it("GET luôn được phép", () => {
    expect(() => assertSameOrigin(req("GET", { origin: "https://evil.example" }))).not.toThrow();
  });
  it("POST cùng origin được phép; không có Origin (cron, curl) được phép", () => {
    expect(() => assertSameOrigin(req("POST", { origin: "https://campus.example", host: "campus.example" }))).not.toThrow();
    expect(() => assertSameOrigin(req("POST", { host: "campus.example" }))).not.toThrow();
  });
  it("POST từ origin khác hoặc sec-fetch-site cross-site → 403", () => {
    expect(() => assertSameOrigin(req("POST", { origin: "https://evil.example", host: "campus.example" }))).toThrow(ApiError);
    expect(() => assertSameOrigin(req("DELETE", { "sec-fetch-site": "cross-site", host: "campus.example" }))).toThrow(ApiError);
    expect(() => assertSameOrigin(req("PATCH", { origin: "not a url", host: "campus.example" }))).toThrow(ApiError);
  });
});

describe("URL trong email ở production", () => {
  // isProduction được đọc lúc nạp module → nạp lại module sau khi đặt NODE_ENV.
  beforeEach(() => vi.resetModules());
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.resetModules();
  });

  const load = async () => (await import("@/lib/mail/mailer")).appBaseUrl(new Request("https://attacker.example/api/auth/forgot-password"));

  it.each([
    [undefined, ""],
    ["http://localhost:3000", ""],
    ["http://campus.example", ""],
    ["https://campus.example/", "https://campus.example"],
  ])("APP_URL=%s → %s (không bao giờ dùng Host của request)", async (appUrl, expected) => {
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("APP_URL", appUrl ?? "");
    const error = vi.spyOn(console, "error").mockImplementation(() => {});
    expect(await load()).toBe(expected);
    error.mockRestore();
  });
});

describe("scheduler: một lịch lỗi không chặn các lịch khác", () => {
  it("lỗi được đếm và ghi log, lịch còn lại vẫn chạy", async () => {
    const rec = (id: string) => ({
      id,
      user_id: USER_A,
      category_id: 6,
      name: "x",
      amount: new Prisma.Decimal(1000),
      type: "expense",
      frequency: "monthly",
      anchor_day: 5,
      start_date: storageDate(2026, 1, 5),
      next_run_date: storageDate(2026, 3, 5),
      end_date: null,
      status: "active",
      is_fixed: true,
    });
    db.recurringTransaction.findMany.mockResolvedValue([rec("bad"), rec("good")]);
    db.$transaction
      .mockImplementationOnce(async () => {
        throw new Error("boom");
      })
      .mockImplementationOnce(async () => 0);
    const log = vi.spyOn(console, "error").mockImplementation(() => {});
    const result = await runDueRecurring(undefined, storageDate(2026, 3, 10));
    expect(result).toEqual({ processed: 2, created: 0, failed: 1 });
    expect(db.$transaction).toHaveBeenCalledTimes(2);
    expect(String(log.mock.calls[0][0])).toContain('"event":"recurring.item_failed"');
    log.mockRestore();
  });
});

describe("health check", () => {
  it("DB ổn → 200, không lộ thông tin môi trường", async () => {
    db.$queryRaw.mockResolvedValue([{ "?column?": 1 }]);
    const res = await health();
    const body = await res.json();
    expect(res.status).toBe(200);
    expect(Object.keys(body).sort()).toEqual(["database", "status", "timestamp"]);
  });
  it("DB lỗi → 503", async () => {
    db.$queryRaw.mockRejectedValue(new Error("connection refused host=secret"));
    const res = await health();
    expect(res.status).toBe(503);
    expect(JSON.stringify(await res.json())).not.toContain("secret");
  });
});
