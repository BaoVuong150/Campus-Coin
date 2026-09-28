import { readFileSync } from "node:fs";
import path from "node:path";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { Prisma } from "@prisma/client";

/**
 * Kiểm thử cho các lỗi phát hiện ở vòng rà soát cuối: CSV injection, xóa danh mục làm mất ngân sách,
 * mẫu số dự báo, đồng bộ trợ cấp/ngày nhận, trạng thái mục tiêu, bắt buộc đổi mật khẩu tạm,
 * nhật ký quản trị, rate limit Redis/bộ nhớ và API GET không ghi dữ liệu.
 */

const cookieStore = { value: undefined as string | undefined };
vi.mock("next/headers", () => ({
  cookies: async () => ({ get: () => (cookieStore.value ? { value: cookieStore.value } : undefined) }),
}));

const db = vi.hoisted(() => ({
  user: { findUnique: vi.fn(), update: vi.fn(), updateMany: vi.fn() },
  category: { findFirst: vi.fn(), delete: vi.fn() },
  transaction: { count: vi.fn() },
  recurringTransaction: { count: vi.fn() },
  budget: { count: vi.fn() },
  savingGoal: { findUnique: vi.fn(), update: vi.fn(), updateMany: vi.fn() },
  adminAudit: { create: vi.fn() },
  $transaction: vi.fn(),
}));
vi.mock("@/lib/database/prisma", () => ({ prisma: db }));

import { ApiError } from "@/lib/api/errors";
import { csvCell, toCsv } from "@/lib/csv/escape";
import { sessionVersion, signToken } from "@/lib/auth/jwt";
import { mustChangePassword, withPasswordChangeFlag } from "@/lib/auth/account-flags";
import { rateLimit } from "@/lib/auth/rate-limit";
import { requireAuth } from "@/lib/auth/session";
import { sampleDays, upcomingAllowance } from "@/lib/finance/sampling";
import { storageDate, toYmd, vnStartOfDay } from "@/lib/utils/date";
import { resetUserPassword } from "@/services/admin.service";
import { recordAdminAction } from "@/services/audit.service";
import { deleteDefaultCategory, deleteUserCategory } from "@/services/category.service";
import { contributeToGoal, updateGoal } from "@/services/goal.service";

const USER_A = "11111111-1111-4111-8111-111111111111";
const USER_B = "22222222-2222-4222-8222-222222222222";
const GOAL = "44444444-4444-4444-8444-444444444444";
const HASH = "$2b$04$storedhashstoredhashstoredhashstoredhashstoredhash12";

beforeEach(() => {
  vi.clearAllMocks();
  cookieStore.value = undefined;
  db.$transaction.mockImplementation((arg: unknown) =>
    typeof arg === "function" ? (arg as (tx: typeof db) => unknown)(db) : Promise.all(arg as unknown[])
  );
});

async function expectApiError(promise: Promise<unknown>, code: string) {
  const error = await promise.catch((e) => e);
  expect(error).toBeInstanceOf(ApiError);
  expect((error as ApiError).code).toBe(code);
}

describe("CSV: chống formula injection", () => {
  it.each([
    ['=HYPERLINK("http://evil","x")', `"'=HYPERLINK(""http://evil"",""x"")"`],
    ["+1234", `"'+1234"`],
    ["-cmd", `"'-cmd"`],
    ["@SUM(A1)", `"'@SUM(A1)"`],
    ["\tTab", `"'\tTab"`],
    ["Nguyễn Văn An", `"Nguyễn Văn An"`],
    ['Tên có "ngoặc"', `"Tên có ""ngoặc"""`],
  ])("%s", (input, expected) => {
    expect(csvCell(input)).toBe(expected);
  });

  it("số thật (kể cả số âm) không bị thêm dấu nháy", () => {
    expect(csvCell(-5000)).toBe('"-5000"');
    expect(csvCell(null)).toBe('""');
  });

  it("có BOM và xuống dòng CRLF", () => {
    expect(toCsv([["a", "b"], [1, "=x"]])).toBe('﻿"a","b"\r\n"1","\'=x"');
  });
});

describe("danh mục: không âm thầm xóa ngân sách", () => {
  it("danh mục cá nhân còn ngân sách → không xóa được", async () => {
    db.category.findFirst.mockResolvedValue({ id: 50, user_id: USER_A, type: "expense" });
    db.transaction.count.mockResolvedValue(0);
    db.recurringTransaction.count.mockResolvedValue(0);
    db.budget.count.mockResolvedValue(2);
    await expectApiError(deleteUserCategory(USER_A, 50), "CATEGORY_IN_USE");
    expect(db.category.delete).not.toHaveBeenCalled();
  });

  it("danh mục hệ thống còn ngân sách của bất kỳ user nào → không xóa được", async () => {
    db.category.findFirst.mockResolvedValue({ id: 6, user_id: null, type: "expense" });
    db.transaction.count.mockResolvedValue(0);
    db.recurringTransaction.count.mockResolvedValue(0);
    db.budget.count.mockResolvedValue(1);
    await expectApiError(deleteDefaultCategory(6), "CATEGORY_IN_USE");
    expect(db.category.delete).not.toHaveBeenCalled();
  });

  it("không dùng ở đâu → xóa được", async () => {
    db.category.findFirst.mockResolvedValue({ id: 50, user_id: USER_A, type: "expense" });
    db.transaction.count.mockResolvedValue(0);
    db.recurringTransaction.count.mockResolvedValue(0);
    db.budget.count.mockResolvedValue(0);
    await deleteUserCategory(USER_A, 50);
    expect(db.category.delete).toHaveBeenCalledWith({ where: { id: 50 } });
  });
});

describe("dự báo: mẫu số là số ngày có dữ liệu", () => {
  const start = vnStartOfDay(2026, 9, 1);
  const end = vnStartOfDay(2026, 9, 21); // hết ngày 20/9

  it("user bắt đầu ngày 15 → 6 ngày, không phải 20", () => {
    expect(sampleDays(start, end, storageDate(2026, 9, 15))).toBe(6);
  });
  it("dữ liệu có từ trước cửa sổ → toàn bộ cửa sổ", () => {
    expect(sampleDays(start, end, storageDate(2026, 6, 1))).toBe(20);
  });
  it("chưa có giao dịch nào → 0", () => {
    expect(sampleDays(start, end, null)).toBe(0);
  });
});

describe("trợ cấp / ngày nhận → thu nhập sắp nhận", () => {
  const now = storageDate(2026, 9, 3);

  it("ngày nhận chưa tới → tính là thu nhập sắp nhận", () => {
    const r = upcomingAllowance({ allowance: 3_000_000, payDay: 5, hasRecurringIncome: false, now });
    expect(r?.amount).toBe(3_000_000);
    expect(toYmd(r!.date)).toBe("2026-09-05");
  });
  it("ngày nhận đã qua hoặc là hôm nay → coi như đã nhận", () => {
    expect(upcomingAllowance({ allowance: 3_000_000, payDay: 3, hasRecurringIncome: false, now })).toBeNull();
  });
  it("đã có khoản thu định kỳ → không cộng trùng", () => {
    expect(upcomingAllowance({ allowance: 3_000_000, payDay: 20, hasRecurringIncome: true, now })).toBeNull();
  });
  it("ngày 31 ở tháng ngắn → lùi về cuối tháng", () => {
    const r = upcomingAllowance({ allowance: 1, payDay: 31, hasRecurringIncome: false, now: storageDate(2026, 2, 10) });
    expect(toYmd(r!.date)).toBe("2026-02-28");
  });
  it("chưa khai báo trợ cấp → không có gì", () => {
    expect(upcomingAllowance({ allowance: 0, payDay: 5, hasRecurringIncome: false, now })).toBeNull();
  });
});

describe("mục tiêu: chuyển trạng thái hợp lệ", () => {
  const goal = (status: string) => ({
    id: GOAL,
    user_id: USER_A,
    name: "Laptop",
    target_amount: new Prisma.Decimal(1000),
    current_amount: new Prisma.Decimal(100),
    deadline: null,
    icon: null,
    status,
    created_at: new Date(),
    updated_at: new Date(),
  });

  it("đã lưu trữ → không thể đánh dấu hoàn thành ngay", async () => {
    db.savingGoal.findUnique.mockResolvedValue(goal("archived"));
    await expectApiError(updateGoal(USER_A, GOAL, { status: "completed" }), "VALIDATION_ERROR");
    expect(db.savingGoal.update).not.toHaveBeenCalled();
  });

  it.each(["completed", "archived"])("mục tiêu %s không nạp/rút được", async (status) => {
    db.savingGoal.findUnique.mockResolvedValue(goal(status));
    await expectApiError(contributeToGoal(USER_A, GOAL, { amount: 10, direction: "deposit" }), "VALIDATION_ERROR");
    expect(db.savingGoal.updateMany).not.toHaveBeenCalled();
  });
});

describe("mật khẩu tạm do admin cấp: bắt buộc đổi", () => {
  const sessionUser = (preferences: unknown) => ({
    id: USER_A,
    name: "A",
    email: "a@test.dev",
    role: "student",
    is_active: true,
    password_hash: HASH,
    preferences,
  });

  it("cờ giữ nguyên các tùy chọn khác", () => {
    const prefs = { notifications: { budget: false } };
    const on = withPasswordChangeFlag(prefs, true);
    expect(on).toEqual({ notifications: { budget: false }, mustChangePassword: true });
    expect(mustChangePassword(on)).toBe(true);
    expect(withPasswordChangeFlag(on, false)).toEqual({ notifications: { budget: false } });
    expect(mustChangePassword(null)).toBe(false);
  });

  it("đang có cờ → API thường bị chặn (403 PASSWORD_CHANGE_REQUIRED)", async () => {
    cookieStore.value = signToken({ userId: USER_A, email: "a", role: "student", name: "A", sv: sessionVersion(HASH) });
    db.user.findUnique.mockResolvedValue(sessionUser({ mustChangePassword: true }));
    await expectApiError(requireAuth(), "PASSWORD_CHANGE_REQUIRED");
  });

  it("API đổi mật khẩu vẫn gọi được khi đang có cờ", async () => {
    cookieStore.value = signToken({ userId: USER_A, email: "a", role: "student", name: "A", sv: sessionVersion(HASH) });
    db.user.findUnique.mockResolvedValue(sessionUser({ mustChangePassword: true }));
    await expect(requireAuth({ allowPendingPasswordChange: true })).resolves.toMatchObject({ mustChangePassword: true });
  });

  it("admin đặt lại mật khẩu → bật cờ, không mất tùy chọn thông báo", async () => {
    db.user.findUnique.mockResolvedValue({ preferences: { notifications: { goal: false } } });
    db.user.updateMany.mockResolvedValue({ count: 1 });
    await resetUserPassword(USER_B, USER_A);
    expect(db.user.updateMany.mock.calls[0][0].data.preferences).toEqual({
      notifications: { goal: false },
      mustChangePassword: true,
    });
  });
});

describe("nhật ký quản trị", () => {
  it("ghi đúng người thực hiện, thao tác và đối tượng", async () => {
    db.adminAudit.create.mockResolvedValue({});
    await recordAdminAction(USER_B, { action: "user.update", targetType: "user", targetId: USER_A, details: { is_active: false } });
    expect(db.adminAudit.create).toHaveBeenCalledWith({
      data: { actor_id: USER_B, action: "user.update", target_type: "user", target_id: USER_A, details: { is_active: false } },
    });
  });

  it("DB chưa có bảng (chưa migrate) → không làm hỏng thao tác chính", async () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    db.adminAudit.create.mockRejectedValue(new Prisma.PrismaClientKnownRequestError("missing", { code: "P2021", clientVersion: "6" }));
    await expect(recordAdminAction(USER_B, { action: "users.export", targetType: "users" })).resolves.toBeUndefined();
    warn.mockRestore();
  });
});

describe("rate limit: Redis dùng chung, tự lùi về bộ nhớ", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.unstubAllEnvs();
  });

  it("không cấu hình Redis → đếm trong bộ nhớ, quá giới hạn thì 429", async () => {
    const key = `mem-${Math.random()}`;
    for (let i = 0; i < 3; i++) await rateLimit(key, 3, 60_000);
    await expectApiError(rateLimit(key, 3, 60_000), "RATE_LIMITED");
  });

  it("có Redis → dùng bộ đếm trên Redis (INCR + PEXPIRE NX + PTTL)", async () => {
    vi.stubEnv("UPSTASH_REDIS_REST_URL", "https://redis.example");
    vi.stubEnv("UPSTASH_REDIS_REST_TOKEN", "token");
    const fetchMock = vi.fn().mockResolvedValue(new Response(JSON.stringify([{ result: 4 }, { result: 0 }, { result: 9000 }])));
    vi.stubGlobal("fetch", fetchMock);
    const error = await rateLimit("redis-key", 3, 60_000).catch((e) => e);
    expect((error as ApiError).code).toBe("RATE_LIMITED");
    expect((error as ApiError).message).toContain("9 giây");
    const body = JSON.parse(fetchMock.mock.calls[0][1].body);
    expect(body[0]).toEqual(["INCR", "campuscoin:rl:redis-key"]);
    expect(body[1]).toEqual(["PEXPIRE", "campuscoin:rl:redis-key", 60_000, "NX"]);
  });

  it("Redis lỗi → không chặn nhầm, lùi về bộ nhớ", async () => {
    vi.stubEnv("UPSTASH_REDIS_REST_URL", "https://redis.example");
    vi.stubEnv("UPSTASH_REDIS_REST_TOKEN", "token");
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("down")));
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    const key = `fallback-${Math.random()}`;
    await expect(rateLimit(key, 1, 60_000)).resolves.toBeUndefined();
    await expectApiError(rateLimit(key, 1, 60_000), "RATE_LIMITED");
    warn.mockRestore();
  });
});

describe("API GET không ghi dữ liệu", () => {
  const read = (file: string) => readFileSync(path.resolve(__dirname, "../..", file), "utf8");

  it.each([
    "src/app/api/analytics/summary/route.ts",
    "src/app/api/planning/route.ts",
    "src/app/api/recurring/route.ts",
    "src/app/api/transactions/route.ts",
    "src/app/api/points/route.ts",
  ])("%s không gọi scheduler/cộng điểm", (file) => {
    const source = read(file);
    expect(source).not.toMatch(/ensureRecurringProcessed|syncUserData|processDueRecurring|evaluatePeriodicRewards|awardPoints/);
  });

  it("getPointsSummary chỉ đọc", () => {
    const source = read("src/services/points.service.ts");
    const body = source.slice(source.indexOf("export async function getPointsSummary"));
    expect(body).not.toMatch(/awardPoints|evaluate/);
  });

  it("việc ghi nằm ở POST /api/sync", () => {
    const source = read("src/app/api/sync/route.ts");
    expect(source).toMatch(/export const POST/);
    expect(source).not.toMatch(/export const GET/);
  });
});
