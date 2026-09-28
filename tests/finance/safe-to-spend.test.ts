import { describe, expect, it } from "vitest";
import { calculateSafeToSpend, TIGHT_DAILY_THRESHOLD } from "@/lib/finance/safe-to-spend";

const base = {
  currentBalance: 3_800_000,
  remainingFixedExpenses: 800_000,
  expectedIncome: 0,
  goalReserved: 0,
  savingsTarget: 0,
  budgetRemaining: null,
  remainingDays: 10,
};

describe("calculateSafeToSpend", () => {
  it("chia số tiền khả dụng cho số ngày còn lại", () => {
    const r = calculateSafeToSpend(base);
    expect(r.spendable).toBe(3_000_000);
    expect(r.daily).toBe(300_000);
    expect(r.limitedBy).toBe("balance");
    expect(r.status).toBe("healthy");
  });

  it("trừ tiền mục tiêu và tiết kiệm tháng, cộng thu nhập định kỳ sắp nhận", () => {
    const r = calculateSafeToSpend({ ...base, goalReserved: 500_000, savingsTarget: 1_000_000, expectedIncome: 200_000 });
    expect(r.spendable).toBe(1_700_000);
    expect(r.daily).toBe(170_000);
  });

  it("bị giới hạn bởi ngân sách còn lại khi ngân sách chặt hơn số dư", () => {
    const r = calculateSafeToSpend({ ...base, budgetRemaining: 1_000_000 });
    expect(r.dailyByBudget).toBe(100_000);
    expect(r.daily).toBe(100_000);
    expect(r.limitedBy).toBe("budget");
  });

  it("không bao giờ trả về số âm mỗi ngày khi số dư không đủ", () => {
    const r = calculateSafeToSpend({ ...base, currentBalance: 500_000 });
    expect(r.spendable).toBe(-300_000);
    expect(r.daily).toBe(0);
    expect(r.status).toBe("negative");
  });

  it("ngày cuối tháng (còn 0 ngày) không chia cho 0", () => {
    const r = calculateSafeToSpend({ ...base, remainingDays: 0 });
    expect(Number.isFinite(r.daily)).toBe(true);
    expect(r.daily).toBe(3_000_000);
  });

  it("đánh dấu eo hẹp khi dưới ngưỡng mỗi ngày", () => {
    const r = calculateSafeToSpend({ ...base, currentBalance: 800_000 + (TIGHT_DAILY_THRESHOLD - 1) * 10 });
    expect(r.status).toBe("tight");
  });

  it("ngân sách đã tiêu hết → 0 đ/ngày dù số dư còn", () => {
    const r = calculateSafeToSpend({ ...base, budgetRemaining: 0 });
    expect(r.daily).toBe(0);
    expect(r.limitedBy).toBe("budget");
  });
});
