import { beforeEach, describe, expect, it, vi } from "vitest";
import { Prisma } from "@prisma/client";
import { NextRequest } from "next/server";

/**
 * Kiểm thử các lỗi được phát hiện khi rà soát: race condition, phiên cũ sau khi đổi mật khẩu,
 * lịch định kỳ, mục tiêu, validate tiền/ngày và mã lỗi HTTP.
 */

const cookieStore = { value: undefined as string | undefined };
vi.mock("next/headers", () => ({
  cookies: async () => ({ get: () => (cookieStore.value ? { value: cookieStore.value } : undefined) }),
}));

const db = vi.hoisted(() => ({
  user: { findUnique: vi.fn(), update: vi.fn(), updateMany: vi.fn() },
  category: { findFirst: vi.fn(), findMany: vi.fn() },
  categoryPreference: { upsert: vi.fn() },
  transaction: { create: vi.fn(), createMany: vi.fn(), findMany: vi.fn() },
  transactionAudit: { create: vi.fn() },
  recurringTransaction: {
    findMany: vi.fn(),
    findFirst: vi.fn(),
    findUniqueOrThrow: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    updateMany: vi.fn(),
  },
  savingGoal: { findUnique: vi.fn(), findFirst: vi.fn(), findUniqueOrThrow: vi.fn(), update: vi.fn(), updateMany: vi.fn() },
  goalContribution: { create: vi.fn() },
  notification: { createMany: vi.fn() },
  pointEvent: { createMany: vi.fn() },
  budget: { findUnique: vi.fn() },
  $transaction: vi.fn(),
}));
vi.mock("@/lib/database/prisma", () => ({ prisma: db }));

import { ApiError } from "@/lib/api/errors";
import { toErrorResponse } from "@/lib/api/response";
import { sessionVersion, signResetToken, signToken, verifyResetToken, verifyToken } from "@/lib/auth/jwt";
import { requireAuth } from "@/lib/auth/session";
import { firstOccurrenceFrom, type Schedule } from "@/lib/finance/recurring";
import { currentMonthKey, storageDate, todayYmd, toYmd } from "@/lib/utils/date";
import { amountSchema, monthKeySchema, ymdSchema } from "@/lib/validations/common.schema";
import { transactionQuerySchema } from "@/lib/validations/transaction.schema";
import { generateTemporaryPassword, resetUserPassword } from "@/services/admin.service";
import { historyQuery } from "@/services/category.service";
import { contributeToGoal, reachedMilestone, updateGoal } from "@/services/goal.service";
import { createRecurring, processDueRecurring, updateRecurring } from "@/services/recurring.service";
import { createTransaction } from "@/services/transaction.service";
import { requestPasswordReset, resetPasswordWithToken } from "@/services/user.service";
import { isStrongPassword } from "@/lib/validations/rules";
import { proxy } from "@/proxy";
import { announcementDedupeKey } from "@/services/notification.service";

const USER_A = "11111111-1111-4111-8111-111111111111";
const USER_B = "22222222-2222-4222-8222-222222222222";
const GOAL = "44444444-4444-4444-8444-444444444444";
const REC = "55555555-5555-4555-8555-555555555555";
const OLD_HASH = "$2b$04$oldhasholdhasholdhasholdhasholdhasholdhasholdhash12";
const NEW_HASH = "$2b$04$newhashnewhashnewhashnewhashnewhashnewhashnewhash12";

beforeEach(() => {
  vi.clearAllMocks();
  cookieStore.value = undefined;
  // Mô phỏng prisma.$transaction: callback nhận chính client giả; mảng thì chạy song song.
  db.$transaction.mockImplementation((arg: unknown) =>
    typeof arg === "function" ? (arg as (tx: typeof db) => unknown)(db) : Promise.all(arg as unknown[])
  );
  db.user.findUnique.mockResolvedValue(null);
  db.budget.findUnique.mockResolvedValue(null);
  db.notification.createMany.mockResolvedValue({ count: 1 });
  db.pointEvent.createMany.mockResolvedValue({ count: 1 });
});

async function expectApiError(promise: Promise<unknown>, code: string) {
  const error = await promise.catch((e) => e);
  expect(error).toBeInstanceOf(ApiError);
  expect((error as ApiError).code).toBe(code);
}

const sessionUser = (hash: string) => ({
  id: USER_A,
  name: "A",
  email: "a@test.dev",
  role: "student",
  is_active: true,
  password_hash: hash,
});

describe("phiên đăng nhập sau khi đổi mật khẩu", () => {
  it("token cấp trước khi đổi mật khẩu bị từ chối (SESSION_EXPIRED)", async () => {
    cookieStore.value = signToken({ userId: USER_A, email: "a", role: "student", name: "A", sv: sessionVersion(OLD_HASH) });
    db.user.findUnique.mockResolvedValue(sessionUser(NEW_HASH));
    await expectApiError(requireAuth(), "SESSION_EXPIRED");
  });

  it("token khớp mật khẩu hiện tại vẫn hợp lệ", async () => {
    cookieStore.value = signToken({ userId: USER_A, email: "a", role: "student", name: "A", sv: sessionVersion(NEW_HASH) });
    db.user.findUnique.mockResolvedValue(sessionUser(NEW_HASH));
    await expect(requireAuth()).resolves.toMatchObject({ id: USER_A });
  });

  it("token đặt lại mật khẩu không dùng được làm cookie phiên và ngược lại", () => {
    const reset = signResetToken(USER_A, "abc");
    expect(verifyToken(reset).status).toBe("invalid");
    const session = signToken({ userId: USER_A, email: "a", role: "student", name: "A", sv: "abc" });
    expect(verifyResetToken(session)).toBeNull();
    expect(verifyResetToken(reset)).toEqual({ userId: USER_A, sv: "abc" });
  });

  it("session version không để lộ password hash", () => {
    expect(sessionVersion(OLD_HASH)).toHaveLength(16);
    expect(OLD_HASH).not.toContain(sessionVersion(OLD_HASH));
    expect(sessionVersion(OLD_HASH)).not.toBe(sessionVersion(NEW_HASH));
  });
});

describe("quên mật khẩu", () => {
  it("đặt lại thành công với token còn hiệu lực", async () => {
    const token = signResetToken(USER_A, sessionVersion(OLD_HASH));
    db.user.findUnique.mockResolvedValue({ password_hash: OLD_HASH, is_active: true });
    db.user.updateMany.mockResolvedValue({ count: 1 });
    await resetPasswordWithToken(token, "NewPass123");
    // Cập nhật có điều kiện theo hash cũ → hai request dùng cùng token song song chỉ một request thắng.
    expect(db.user.updateMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: { id: USER_A, password_hash: OLD_HASH } })
    );
  });

  it("token đã dùng (mật khẩu đã đổi) bị từ chối", async () => {
    const token = signResetToken(USER_A, sessionVersion(OLD_HASH));
    db.user.findUnique.mockResolvedValue({ password_hash: NEW_HASH, is_active: true });
    await expectApiError(resetPasswordWithToken(token, "NewPass123"), "VALIDATION_ERROR");
    expect(db.user.updateMany).not.toHaveBeenCalled();
  });

  it("request song song thua cuộc (updateMany = 0) bị từ chối", async () => {
    const token = signResetToken(USER_A, sessionVersion(OLD_HASH));
    db.user.findUnique.mockResolvedValue({ password_hash: OLD_HASH, is_active: true });
    db.user.updateMany.mockResolvedValue({ count: 0 });
    await expectApiError(resetPasswordWithToken(token, "NewPass123"), "VALIDATION_ERROR");
  });

  it("tài khoản bị vô hiệu hóa không đặt lại được", async () => {
    const token = signResetToken(USER_A, sessionVersion(OLD_HASH));
    db.user.findUnique.mockResolvedValue({ password_hash: OLD_HASH, is_active: false });
    await expectApiError(resetPasswordWithToken(token, "NewPass123"), "VALIDATION_ERROR");
  });

  it("token rác bị từ chối", async () => {
    await expectApiError(resetPasswordWithToken("not-a-token", "NewPass123"), "VALIDATION_ERROR");
  });

  it("email không tồn tại: không làm gì, không ném lỗi", async () => {
    const info = vi.spyOn(console, "info").mockImplementation(() => {});
    db.user.findUnique.mockResolvedValue(null);
    await expect(requestPasswordReset("x@test.dev", "http://localhost:3000")).resolves.toBeUndefined();
    expect(info).not.toHaveBeenCalled();
    info.mockRestore();
  });

  it("email tồn tại (dev, chưa cấu hình mail): link được in ra console server", async () => {
    const info = vi.spyOn(console, "info").mockImplementation(() => {});
    db.user.findUnique.mockResolvedValue({ ...sessionUser(OLD_HASH), email: "a@test.dev" });
    await requestPasswordReset("a@test.dev", "http://localhost:3000");
    expect(info).toHaveBeenCalledWith(expect.stringContaining("http://localhost:3000/reset-password?token="));
    info.mockRestore();
  });
});

describe("admin đặt lại mật khẩu", () => {
  it("mật khẩu tạm luôn đủ mạnh và ngẫu nhiên", () => {
    const seen = new Set<string>();
    for (let i = 0; i < 200; i++) {
      const p = generateTemporaryPassword();
      expect(isStrongPassword(p)).toBe(true);
      expect(p).toHaveLength(12);
      seen.add(p);
    }
    expect(seen.size).toBe(200);
  });

  it("không tự đặt lại mật khẩu của chính mình", async () => {
    await expectApiError(resetUserPassword(USER_A, USER_A), "VALIDATION_ERROR");
  });

  it("user không tồn tại → 404", async () => {
    db.user.updateMany.mockResolvedValue({ count: 0 });
    await expectApiError(resetUserPassword(USER_A, USER_B), "USER_NOT_FOUND");
  });
});

describe("mục tiêu tiết kiệm", () => {
  const goal = (overrides: Record<string, unknown> = {}) => ({
    id: GOAL,
    user_id: USER_A,
    name: "Laptop",
    target_amount: new Prisma.Decimal(1000),
    current_amount: new Prisma.Decimal(400),
    deadline: null,
    icon: null,
    status: "active",
    created_at: new Date(),
    updated_at: new Date(),
    ...overrides,
  });

  it("rút tiền: kiểm tra số dư nằm trong câu UPDATE có điều kiện (chống race)", async () => {
    db.savingGoal.findUnique.mockResolvedValue(goal());
    db.savingGoal.updateMany.mockResolvedValue({ count: 0 }); // một request khác vừa rút trước
    db.savingGoal.findFirst.mockResolvedValue({ status: "active" });
    await expectApiError(
      contributeToGoal(USER_A, GOAL, { amount: 300, direction: "withdraw" }),
      "INSUFFICIENT_GOAL_BALANCE"
    );
    expect(db.savingGoal.updateMany).toHaveBeenCalledWith({
      where: { id: GOAL, user_id: USER_A, status: { not: "archived" }, current_amount: { gte: 300 } },
      data: { current_amount: { increment: -300 } },
    });
    expect(db.goalContribution.create).not.toHaveBeenCalled();
  });

  it("mục tiêu bị xóa song song → 404 (không báo nhầm là thiếu số dư)", async () => {
    db.savingGoal.findUnique.mockResolvedValue(goal());
    db.savingGoal.updateMany.mockResolvedValue({ count: 0 });
    db.savingGoal.findFirst.mockResolvedValue(null);
    await expectApiError(contributeToGoal(USER_A, GOAL, { amount: 10, direction: "withdraw" }), "GOAL_NOT_FOUND");
  });

  it("mục tiêu đã lưu trữ không nạp/rút được", async () => {
    db.savingGoal.findUnique.mockResolvedValue(goal({ status: "archived" }));
    await expectApiError(contributeToGoal(USER_A, GOAL, { amount: 1, direction: "deposit" }), "VALIDATION_ERROR");
    expect(db.savingGoal.updateMany).not.toHaveBeenCalled();
  });

  it("IDOR: mục tiêu của người khác → 404", async () => {
    db.savingGoal.findUnique.mockResolvedValue(goal({ user_id: USER_B }));
    await expectApiError(contributeToGoal(USER_A, GOAL, { amount: 1, direction: "deposit" }), "GOAL_NOT_FOUND");
  });

  it("mốc tính từ số dư SAU cập nhật, không từ giá trị đọc trước đó", async () => {
    // Đọc thấy 400 nhưng một lần nạp song song đã đưa lên 900; lần nạp 100 này → 1000 = mốc 100% (không phải 50%).
    db.savingGoal.findUnique.mockResolvedValue(goal());
    db.savingGoal.updateMany.mockResolvedValue({ count: 1 });
    db.savingGoal.findUniqueOrThrow.mockResolvedValue(goal({ current_amount: new Prisma.Decimal(1000) }));
    await contributeToGoal(USER_A, GOAL, { amount: 100, direction: "deposit" });
    const notification = db.notification.createMany.mock.calls
      .map(([arg]) => arg.data[0])
      .find((n: { template: string }) => n.template === "goalMilestone");
    expect(notification.dedupe_key).toBe(`goal:${GOAL}:100`);
    expect(db.pointEvent.createMany).toHaveBeenCalledWith({
      data: [expect.objectContaining({ reason: "goalCompleted", dedupe_key: `goal:${GOAL}` })],
      skipDuplicates: true,
    });
  });

  it("điểm nạp mục tiêu tính theo ngày, không theo từng mục tiêu", async () => {
    db.savingGoal.findUnique.mockResolvedValue(goal());
    db.savingGoal.updateMany.mockResolvedValue({ count: 1 });
    db.savingGoal.findUniqueOrThrow.mockResolvedValue(goal({ current_amount: new Prisma.Decimal(410) }));
    await contributeToGoal(USER_A, GOAL, { amount: 10, direction: "deposit" });
    expect(db.pointEvent.createMany).toHaveBeenCalledWith({
      data: [expect.objectContaining({ reason: "goalDeposit", dedupe_key: `deposit:${todayYmd()}` })],
      skipDuplicates: true,
    });
  });

  it("bấm Hoàn thành khi chưa đủ tiền: không được cộng điểm", async () => {
    db.savingGoal.findUnique.mockResolvedValue(goal());
    db.savingGoal.update.mockResolvedValue(goal({ status: "completed" }));
    await updateGoal(USER_A, GOAL, { status: "completed" });
    expect(db.pointEvent.createMany).not.toHaveBeenCalled();
  });

  it("bấm Hoàn thành khi đã đủ tiền: được cộng điểm", async () => {
    db.savingGoal.findUnique.mockResolvedValue(goal({ current_amount: new Prisma.Decimal(1000) }));
    db.savingGoal.update.mockResolvedValue(goal({ status: "completed", current_amount: new Prisma.Decimal(1000) }));
    await updateGoal(USER_A, GOAL, { status: "completed" });
    expect(db.pointEvent.createMany).toHaveBeenCalledTimes(1);
  });

  it.each([
    [0, 500, 1000, 50],
    [400, 1000, 1000, 100],
    [600, 700, 1000, undefined],
    [0, 10, 0, undefined],
    [1000, 900, 1000, undefined],
  ])("reachedMilestone(%d → %d / %d) = %s", (before, after, target, expected) => {
    expect(reachedMilestone(before, after, target)).toBe(expected);
  });
});

describe("giao dịch định kỳ", () => {
  const rec = (overrides: Record<string, unknown> = {}) => ({
    id: REC,
    user_id: USER_A,
    category_id: 6,
    name: "Netflix",
    amount: new Prisma.Decimal(100000),
    type: "expense",
    frequency: "monthly",
    anchor_day: 5,
    start_date: storageDate(2026, 1, 5),
    next_run_date: storageDate(2026, 1, 5),
    end_date: null,
    status: "active",
    is_fixed: true,
    created_at: new Date(),
    updated_at: new Date(),
    category: { id: 6, name: "Dịch vụ số", type: "expense", user_id: null, icon: null, color: null },
    ...overrides,
  });

  it("tiến trình không giành được kỳ (song song / vừa bị tạm dừng) không sinh giao dịch", async () => {
    db.recurringTransaction.findMany.mockResolvedValue([rec({ next_run_date: storageDate(2026, 3, 5) })]);
    db.recurringTransaction.updateMany.mockResolvedValue({ count: 0 });
    const created = await processDueRecurring(undefined, storageDate(2026, 3, 10));
    expect(created).toBe(0);
    expect(db.recurringTransaction.updateMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: { id: REC, status: "active", next_run_date: storageDate(2026, 3, 5) } })
    );
    expect(db.transaction.createMany).not.toHaveBeenCalled();
    expect(db.notification.createMany).not.toHaveBeenCalled();
  });

  it("tiến trình giành được kỳ thì sinh giao dịch, cron bỏ qua user bị vô hiệu hóa", async () => {
    db.recurringTransaction.findMany.mockResolvedValue([rec({ next_run_date: storageDate(2026, 3, 5) })]);
    db.recurringTransaction.updateMany.mockResolvedValue({ count: 1 });
    db.transaction.createMany.mockResolvedValue({ count: 1 });
    const created = await processDueRecurring(undefined, storageDate(2026, 3, 10));
    expect(created).toBe(1);
    expect(db.recurringTransaction.findMany.mock.calls[0][0].where.user).toEqual({ is_active: true });
    expect(db.transaction.createMany.mock.calls[0][0].skipDuplicates).toBe(true);
  });

  it("kích hoạt lại lịch đã hủy: không bù các kỳ đã lỡ", async () => {
    db.recurringTransaction.findFirst.mockResolvedValue(rec({ status: "cancelled" }));
    db.recurringTransaction.update.mockResolvedValue(rec());
    await updateRecurring(USER_A, REC, { status: "active" });
    const next: Date = db.recurringTransaction.update.mock.calls[0][0].data.next_run_date;
    expect(toYmd(next) >= todayYmd()).toBe(true);
    expect(toYmd(next).endsWith("-05")).toBe(true);
  });

  it("sửa ngày kết thúc trước ngày bắt đầu bị từ chối", async () => {
    db.recurringTransaction.findFirst.mockResolvedValue(rec());
    await expectApiError(updateRecurring(USER_A, REC, { end_date: "2025-12-31" }), "VALIDATION_ERROR");
    expect(db.recurringTransaction.update).not.toHaveBeenCalled();
  });

  it("IDOR: sửa lịch của người khác → 404", async () => {
    db.recurringTransaction.findFirst.mockResolvedValue(null);
    await expectApiError(updateRecurring(USER_A, REC, { status: "paused" }), "RECURRING_NOT_FOUND");
    expect(db.recurringTransaction.findFirst).toHaveBeenCalledWith({ where: { id: REC, user_id: USER_A } });
  });

  it("tạo lịch với ngày bắt đầu nhiều năm trước: chỉ bù từ tháng hiện tại", async () => {
    db.category.findFirst.mockResolvedValue({ id: 6, type: "expense", user_id: null });
    db.recurringTransaction.create.mockResolvedValue(rec());
    db.recurringTransaction.findMany.mockResolvedValue([]);
    db.recurringTransaction.findUniqueOrThrow.mockResolvedValue(rec());
    await createRecurring(USER_A, {
      name: "Netflix",
      amount: 100000,
      type: "expense",
      category_id: 6,
      frequency: "weekly",
      start_date: "2020-01-06",
      is_fixed: true,
    });
    const next: Date = db.recurringTransaction.create.mock.calls[0][0].data.next_run_date;
    expect(toYmd(next) >= `${currentMonthKey()}-01`).toBe(true);
  });

  it("firstOccurrenceFrom giữ đúng ngày neo (31 → cuối tháng ngắn)", () => {
    const schedule: Schedule = { frequency: "monthly", anchorDay: 31, startDate: storageDate(2026, 1, 31) };
    expect(toYmd(firstOccurrenceFrom(schedule, storageDate(2026, 1, 31), "2026-02-15"))).toBe("2026-02-28");
    expect(toYmd(firstOccurrenceFrom(schedule, storageDate(2026, 1, 31), "2026-03-01"))).toBe("2026-03-31");
    expect(toYmd(firstOccurrenceFrom(schedule, storageDate(2026, 1, 31), "2026-01-01"))).toBe("2026-01-31");
  });
});

describe("giao dịch: danh mục gợi ý do client gửi", () => {
  it("không lưu id danh mục riêng của người khác làm gợi ý", async () => {
    db.category.findFirst
      .mockResolvedValueOnce({ id: 6, type: "expense", user_id: null }) // danh mục được chọn
      .mockResolvedValueOnce(null); // danh mục gợi ý không thuộc quyền user
    db.transaction.create.mockResolvedValue({
      id: "t1",
      user_id: USER_A,
      amount: new Prisma.Decimal(10),
      type: "income",
      description: "x",
      category_id: 6,
      date: new Date(),
      ai_suggested_category: null,
      is_recurring: false,
      recurrence_period: null,
      recurring_id: null,
      created_at: new Date(),
      updated_at: new Date(),
      category: { id: 6, name: "Ăn uống", type: "expense", user_id: null, icon: null, color: null },
    });
    await createTransaction(USER_A, {
      amount: 10,
      type: "expense",
      description: "x",
      category_id: 6,
      date: "2026-09-01",
      suggested_category_id: 999,
    });
    expect(db.transaction.create.mock.calls[0][0].data.ai_suggested_category).toBeNull();
  });
});

describe("validate tiền và ngày", () => {
  it("số tiền: tối đa 2 chữ số thập phân và vừa cột Decimal(12, 2)", () => {
    expect(amountSchema.safeParse(45000).success).toBe(true);
    expect(amountSchema.safeParse(12.5).success).toBe(true);
    expect(amountSchema.safeParse(0.1 + 0.2).success).toBe(true); // lỗi dấu phẩy động vẫn là 2 chữ số
    expect(amountSchema.safeParse(0.001).success).toBe(false);
    expect(amountSchema.safeParse(9_999_999_999).success).toBe(true);
    // Số lớn có 2 chữ số thập phân: không bị từ chối nhầm do sai số dấu phẩy động.
    expect(amountSchema.safeParse(1_234_567_890.13).success).toBe(true);
    for (let cents = 0; cents < 100; cents++) {
      expect(amountSchema.safeParse(9_999_999_998 + cents / 100).success).toBe(true);
    }
    expect(amountSchema.safeParse(1.005).success).toBe(false);
    expect(amountSchema.safeParse(123.456).success).toBe(false);
    expect(amountSchema.safeParse(10_000_000_000).success).toBe(false);
    expect(amountSchema.safeParse(-1).success).toBe(false);
    expect(amountSchema.safeParse(Number.NaN).success).toBe(false);
  });

  it("ngày: chặn năm ngoài 2000–2100", () => {
    expect(ymdSchema.safeParse("2026-02-28").success).toBe(true);
    expect(ymdSchema.safeParse("2026-02-30").success).toBe(false);
    expect(ymdSchema.safeParse("0001-01-01").success).toBe(false);
    expect(ymdSchema.safeParse("9999-12-31").success).toBe(false);
    expect(monthKeySchema.safeParse("1999-12").success).toBe(false);
  });

  it("bộ lọc giao dịch: khoảng bị đảo được hoán đổi, không báo lỗi", () => {
    expect(transactionQuerySchema.parse({ from: "2026-09-10", to: "2026-09-01" })).toMatchObject({ from: "2026-09-01", to: "2026-09-10" });
    expect(transactionQuerySchema.parse({ min: "500", max: "100" })).toMatchObject({ min: 100, max: 500 });
    expect(transactionQuerySchema.parse({ from: "2026-09-01", min: "5" })).toMatchObject({ from: "2026-09-01", min: 5 });
  });
});

describe("gợi ý danh mục: tách từ khóa", () => {
  it("tách theo khoảng trắng (không phải chữ 's')", () => {
    expect(historyQuery("  Campus   Cafe sáng ")).toBe("Campus Cafe");
    expect(historyQuery("Grab")).toBe("Grab");
  });
});

describe("mã lỗi HTTP cho lỗi Prisma", () => {
  const prismaError = (code: string) => new Prisma.PrismaClientKnownRequestError("x", { code, clientVersion: "6" });

  it.each([
    ["P2002", 409],
    ["P2003", 409],
    ["P2025", 404],
  ])("%s → %d", async (code, status) => {
    const response = toErrorResponse(prismaError(code));
    expect(response.status).toBe(status);
    expect((await response.json()).success).toBe(false);
  });

  it("lỗi không xác định → 500, không lộ chi tiết", async () => {
    const error = vi.spyOn(console, "error").mockImplementation(() => {});
    const response = toErrorResponse(new Error("secret connection string"));
    expect(response.status).toBe(500);
    expect(JSON.stringify(await response.json())).not.toContain("secret");
    error.mockRestore();
  });
});

describe("proxy: không tạo vòng lặp chuyển hướng", () => {
  const withCookie = (url: string) => {
    const token = signToken({ userId: USER_A, email: "a", role: "student", name: "A", sv: "stale" });
    return new NextRequest(url, { headers: { cookie: `campuscoin_token=${token}` } });
  };

  it("token còn chữ ký hợp lệ vào /login → về dashboard", () => {
    const res = proxy(withCookie("http://localhost/login"));
    expect(res.headers.get("location")).toBe("http://localhost/dashboard");
  });

  it("server đã từ chối phiên (?reason=...) → ở lại trang đăng nhập", () => {
    for (const reason of ["expired", "disabled", "required"]) {
      const res = proxy(withCookie(`http://localhost/login?reason=${reason}`));
      expect(res.headers.get("location")).toBeNull();
    }
  });

  it("chưa đăng nhập vào trang app → /login kèm next", () => {
    const res = proxy(new NextRequest("http://localhost/budgets?month=2026-09"));
    expect(res.headers.get("location")).toBe("http://localhost/login?next=%2Fbudgets%3Fmonth%3D2026-09");
  });

  it("student vào /admin → cổng đăng nhập admin", () => {
    const res = proxy(withCookie("http://localhost/admin/users"));
    expect(res.headers.get("location")).toBe("http://localhost/admin/login");
  });
});

describe("thông báo hệ thống: chống gửi trùng", () => {
  it("cùng nội dung trong cùng cửa sổ → cùng dedupe key; khác nội dung → khác key", () => {
    const t0 = 1_800_000_000_000 - (1_800_000_000_000 % (10 * 60 * 1000));
    expect(announcementDedupeKey("A", "B", t0)).toBe(announcementDedupeKey("A", "B", t0 + 60_000));
    expect(announcementDedupeKey("A", "B", t0)).not.toBe(announcementDedupeKey("A", "C", t0));
    expect(announcementDedupeKey("AB", "", t0)).not.toBe(announcementDedupeKey("A", "B", t0));
    expect(announcementDedupeKey("A", "B", t0)).not.toBe(announcementDedupeKey("A", "B", t0 + 10 * 60 * 1000));
  });
});
