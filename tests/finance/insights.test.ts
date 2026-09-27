import { describe, expect, it } from "vitest";
import { generateInsights, type InsightInput } from "@/lib/finance/insights";

const empty: InsightInput = {
  categoryNames: { 6: "Ăn uống", 8: "Tiền trọ / KTX", 11: "Giải trí" },
  last7DaysByCategory: {},
  avgWeeklyByCategory: {},
  activeWeeksByCategory: {},
  monthToDateByCategory: {},
  lastMonthToDateByCategory: {},
  weekdayTotals: [0, 0, 0, 0, 0, 0, 0],
  weekdayOccurrences: [13, 13, 13, 13, 13, 13, 12],
  weekdayTransactionCount: 0,
  budgetStreaks: [],
  monthToDateExpense: 0,
  monthToDateIncome: 0,
  elapsedDays: 10,
};

describe("generateInsights", () => {
  it("không sinh insight khi chưa có dữ liệu", () => {
    expect(generateInsights(empty)).toEqual([]);
  });

  it("so sánh tuần cho danh mục chi đều đặn", () => {
    const r = generateInsights({
      ...empty,
      last7DaysByCategory: { 6: 590_000 },
      avgWeeklyByCategory: { 6: 500_000 },
      activeWeeksByCategory: { 6: 8 },
    });
    expect(r.find((i) => i.id === "weekly-6")?.description).toBe("Chi tiêu Ăn uống 7 ngày qua cao hơn trung bình 18%.");
  });

  it("bỏ qua khoản chi theo tháng (tiền trọ) khi so sánh theo tuần", () => {
    const r = generateInsights({
      ...empty,
      last7DaysByCategory: { 8: 0 },
      avgWeeklyByCategory: { 8: 500_000 },
      activeWeeksByCategory: { 8: 2 },
    });
    expect(r.some((i) => i.id.startsWith("weekly"))).toBe(false);
  });

  it("so với cùng kỳ tháng trước", () => {
    const r = generateInsights({
      ...empty,
      monthToDateByCategory: { 11: 360_000 },
      lastMonthToDateByCategory: { 11: 600_000 },
      monthToDateExpense: 360_000,
    });
    expect(r.find((i) => i.id === "monthly-11")?.description).toContain("ít hơn tháng trước 240.000 ₫");
  });

  it("chuỗi giữ ngân sách", () => {
    const r = generateInsights({ ...empty, budgetStreaks: [{ categoryId: 6, months: 3 }] });
    expect(r.find((i) => i.id === "streak-6")?.description).toBe("Bạn đã giữ ngân sách Ăn uống trong 3 tháng liên tiếp.");
  });

  it("ngày chi nhiều nhất cần đủ số giao dịch", () => {
    const totals = [100_000, 100_000, 100_000, 100_000, 100_000, 100_000, 900_000];
    expect(generateInsights({ ...empty, weekdayTotals: totals, weekdayTransactionCount: 5 }).some((i) => i.id === "weekday")).toBe(false);
    const r = generateInsights({ ...empty, weekdayTotals: totals, weekdayTransactionCount: 40 });
    expect(r.find((i) => i.id === "weekday")?.description).toContain("Thứ Bảy");
  });
});
