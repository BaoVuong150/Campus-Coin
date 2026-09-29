import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

/**
 * Kiểm thử các tính năng trước đây "trông như có nhưng chưa hoàn chỉnh": động cơ mẹo tiết kiệm,
 * ghim/bỏ qua mẹo, lịch sử nhận định (kể cả dữ liệu cũ dạng văn bản), trạng thái gửi email thật sự.
 */

const db = vi.hoisted(() => ({
  savingTip: { updateMany: vi.fn(), count: vi.fn(), upsert: vi.fn(), deleteMany: vi.fn() },
  insight: { findMany: vi.fn(), updateMany: vi.fn() },
  transactionAudit: { findMany: vi.fn() },
}));
vi.mock("@/lib/database/prisma", () => ({ prisma: db }));

import { ApiError } from "@/lib/api/errors";
import { generateSavingTips, type TipInput } from "@/lib/finance/tips";
import { deleteSystemTip, listInsightHistory, setInsightPinned, setTipState } from "@/services/tips.service";
import { getTransactionHistory } from "@/services/transaction.service";

const USER_A = "11111111-1111-4111-8111-111111111111";

beforeEach(() => vi.clearAllMocks());

async function expectApiError(promise: Promise<unknown>, code: string) {
  const error = await promise.catch((e) => e);
  expect(error).toBeInstanceOf(ApiError);
  expect((error as ApiError).code).toBe(code);
}

const base = (overrides: Partial<TipInput> = {}): TipInput => ({
  month: "2026-09",
  elapsedDays: 15,
  daysInMonth: 30,
  remainingDays: 16,
  categoryNames: { 6: "Ăn uống", 7: "Đi lại" },
  monthToDate: {},
  monthlyAverage: {},
  budgets: [],
  smallPurchases: { count: 0, total: 0 },
  subscriptions: { count: 0, monthly: 0 },
  savingsGoal: 0,
  projectedSavings: 0,
  ...overrides,
});

describe("động cơ mẹo tiết kiệm", () => {
  it("không có dữ liệu → không có mẹo (không bịa)", () => {
    expect(generateSavingTips(base())).toEqual([]);
  });

  it("chi vượt trung bình: dự báo cả tháng so với trung bình, tiết kiệm = phần vượt", () => {
    // 15/30 ngày đã chi 1.200.000 → dự kiến 2.400.000; trung bình 1.500.000 → có thể tiết kiệm 900.000.
    const tips = generateSavingTips(base({ monthToDate: { 6: 1_200_000 }, monthlyAverage: { 6: 1_500_000 } }));
    expect(tips).toEqual([
      expect.objectContaining({
        key: "above-average:6:2026-09",
        template: "aboveAverage",
        params: { category: "Ăn uống", projected: 2_400_000, average: 1_500_000 },
        potentialSaving: 900_000,
      }),
    ]);
  });

  it("chưa đủ 7 ngày → chưa so với trung bình (tránh báo động giả đầu tháng)", () => {
    expect(generateSavingTips(base({ elapsedDays: 3, monthToDate: { 6: 900_000 }, monthlyAverage: { 6: 1_000_000 } }))).toEqual([]);
  });

  it("ngân sách sẽ vượt → gợi ý hạn mức mỗi tuần", () => {
    const [tip] = generateSavingTips(base({ budgets: [{ categoryId: 7, limit: 600_000, spent: 400_000 }] }));
    expect(tip).toMatchObject({ template: "budgetRisk", potentialSaving: 200_000, params: { category: "Đi lại", limit: 600_000, weekly: 67_000 } }); // 200.000 ₫ còn lại ÷ 3 tuần (16 ngày)
  });

  it("nhiều khoản nhỏ, dịch vụ số, thiếu mục tiêu tiết kiệm; xếp theo số tiền tiết kiệm giảm dần", () => {
    const tips = generateSavingTips(
      base({
        smallPurchases: { count: 12, total: 450_000 },
        subscriptions: { count: 3, monthly: 400_000 },
        savingsGoal: 1_000_000,
        projectedSavings: 200_000,
      })
    );
    expect(tips.map((t) => t.template)).toEqual(["savingsGap", "smallPurchases", "subscriptions"]);
    expect(tips.map((t) => t.potentialSaving)).toEqual([800_000, 270_000, 120_000]);
    expect(tips.every((t) => t.potentialSaving % 1000 === 0)).toBe(true);
  });

  it("đã đạt mục tiêu tiết kiệm → không nhắc", () => {
    expect(generateSavingTips(base({ savingsGoal: 500_000, projectedSavings: 900_000 }))).toEqual([]);
  });
});

describe("ghim / bỏ qua mẹo", () => {
  it("mẹo cá nhân: lưu trạng thái theo user + khóa", async () => {
    db.savingTip.upsert.mockResolvedValue({});
    await setTipState(USER_A, "above-average:6:2026-09", "pin");
    expect(db.savingTip.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { user_id_tip_key: { user_id: USER_A, tip_key: "above-average:6:2026-09" } },
        update: { is_pinned: true, is_dismissed: false },
      })
    );
  });

  it("mẹo riêng của user khác (IDOR) → 404, không cập nhật", async () => {
    db.savingTip.updateMany.mockResolvedValue({ count: 0 });
    await expectApiError(setTipState(USER_A, "own:3", "dismiss"), "NOT_FOUND");
    expect(db.savingTip.updateMany.mock.calls[0][0].where).toEqual({ id: 3, user_id: USER_A, tip_key: null });
  });

  it("mẹo hệ thống không tồn tại → 404; khóa rác → 400", async () => {
    db.savingTip.count.mockResolvedValue(0);
    await expectApiError(setTipState(USER_A, "system:99", "pin"), "NOT_FOUND");
    await expectApiError(setTipState(USER_A, "<script>", "pin"), "VALIDATION_ERROR");
    expect(db.savingTip.upsert).not.toHaveBeenCalled();
  });

  it("admin xóa mẫu mẹo → xóa luôn trạng thái ghim của mọi user", async () => {
    db.savingTip.deleteMany.mockResolvedValueOnce({ count: 1 }).mockResolvedValueOnce({ count: 4 });
    await deleteSystemTip(12);
    expect(db.savingTip.deleteMany.mock.calls[0][0].where).toEqual({ id: 12, user_id: null, tip_key: null });
    expect(db.savingTip.deleteMany.mock.calls[1][0].where).toEqual({ tip_key: "system:12" });
  });
});

describe("lịch sử nhận định", () => {
  it("đọc được cả ảnh chụp mới (JSON) lẫn dữ liệu cũ (văn bản)", async () => {
    db.insight.findMany.mockResolvedValue([
      {
        id: 1,
        month: "2026-09",
        is_pinned: true,
        generated_at: new Date(),
        summary_text: JSON.stringify({ v: 1, insights: [{ id: "x", tone: "neutral", icon: "pie", template: "dailyAverage", params: { amount: 1 } }] }),
        tip_text: JSON.stringify({ v: 1, tips: [{ template: "savingsGap", params: { goal: 1, daily: 1 }, potentialSaving: 1000 }] }),
      },
      { id: 2, month: "2026-08", is_pinned: false, generated_at: new Date(), summary_text: "Tháng 8 bạn chi 5.000.000đ", tip_text: "Đặt hạn mức ăn uống" },
    ]);
    const [fresh, legacy] = await listInsightHistory(USER_A);
    expect(fresh.insights).toHaveLength(1);
    expect(fresh.tips?.[0].template).toBe("savingsGap");
    expect(fresh.legacySummary).toBeNull();
    expect(legacy.insights).toBeNull();
    expect(legacy.legacySummary).toBe("Tháng 8 bạn chi 5.000.000đ");
    expect(legacy.legacyTip).toBe("Đặt hạn mức ăn uống");
    expect(db.insight.findMany.mock.calls[0][0].where).toEqual({ user_id: USER_A });
  });

  it("đánh dấu nhận định của người khác (IDOR) → 404", async () => {
    db.insight.updateMany.mockResolvedValue({ count: 0 });
    await expectApiError(setInsightPinned(USER_A, 5, true), "NOT_FOUND");
    expect(db.insight.updateMany.mock.calls[0][0].where).toEqual({ id: 5, user_id: USER_A });
  });
});

describe("lịch sử thay đổi giao dịch", () => {
  it("chỉ đọc nhật ký của chính user, mới nhất trước, chuyển snapshot sang DTO", async () => {
    db.transactionAudit.findMany.mockResolvedValue([
      { id: 2, action: "update", created_at: new Date("2026-09-10T03:00:00Z"), snapshot: { amount: 50000, type: "expense", description: "Cơm", category_id: 6, date: "2026-09-09T00:00:00.000Z" } },
      { id: 1, action: "create", created_at: new Date("2026-09-09T03:00:00Z"), snapshot: { amount: 45000, type: "expense", description: "Cơm", category_id: 6, date: "2026-09-09T00:00:00.000Z" } },
    ]);
    const history = await getTransactionHistory(USER_A, "tx-1");
    expect(db.transactionAudit.findMany.mock.calls[0][0]).toMatchObject({ where: { transaction_id: "tx-1", user_id: USER_A }, orderBy: { created_at: "desc" } });
    expect(history.map((h) => [h.action, h.snapshot.amount, h.snapshot.categoryId])).toEqual([
      ["update", 50000, 6],
      ["create", 45000, 6],
    ]);
  });
});

describe("email: không giả vờ gửi được", () => {
  beforeEach(() => vi.resetModules());
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.resetModules();
  });

  it("dev luôn gửi được (lưu .mail/); production cần đủ Resend + APP_URL https", async () => {
    vi.stubEnv("NODE_ENV", "development");
    expect((await import("@/lib/mail/mailer")).canDeliverEmail()).toBe(true);

    vi.resetModules();
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("RESEND_API_KEY", "");
    vi.stubEnv("MAIL_FROM", "");
    vi.stubEnv("APP_URL", "https://campus.example");
    expect((await import("@/lib/mail/mailer")).canDeliverEmail()).toBe(false);

    vi.resetModules();
    vi.stubEnv("RESEND_API_KEY", "re_x");
    vi.stubEnv("MAIL_FROM", "Campus Coin <no-reply@campus.example>");
    expect((await import("@/lib/mail/mailer")).canDeliverEmail()).toBe(true);

    vi.resetModules();
    vi.stubEnv("APP_URL", "http://localhost:3000");
    expect((await import("@/lib/mail/mailer")).canDeliverEmail()).toBe(false);
  });

  it("production chưa cấu hình email → quên mật khẩu trả 503, không báo \"đã gửi\"", async () => {
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("RESEND_API_KEY", "");
    vi.stubEnv("APP_URL", "https://campus.example");
    const { POST } = await import("@/app/api/auth/forgot-password/route");
    const res = await POST(
      new Request("https://campus.example/api/auth/forgot-password", {
        method: "POST",
        headers: { "content-type": "application/json", "x-forwarded-for": `203.0.113.${Math.floor(Math.random() * 200)}` },
        body: JSON.stringify({ email: "a@test.dev" }),
      }),
      undefined
    );
    expect(res.status).toBe(503);
    expect((await res.json()).error.code).toBe("EMAIL_UNAVAILABLE");
  });
});
