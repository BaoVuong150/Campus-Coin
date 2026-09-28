import { describe, expect, it } from "vitest";
import { generateInsights, type FinancialInsight, type InsightInput } from "@/lib/finance/insights";
import { vi } from "@/i18n/messages/vi";
import { en } from "@/i18n/messages/en";
import { localizeParams } from "@/i18n/format";

/** Hiển thị insight bằng từ điển, giống cách giao diện làm. */
const text = (i: FinancialInsight | undefined, dict = vi) =>
  i ? (dict.insights[i.template].description as (p: unknown) => string)(localizeParams(dict, i.params)) : undefined;

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
    expect(text(r.find((i) => i.id === "weekly-6"))).toBe("Chi tiêu Ăn uống 7 ngày qua cao hơn trung bình 18%.");
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
    expect(text(r.find((i) => i.id === "monthly-11"))).toContain("ít hơn tháng trước 240.000 ₫");
  });

  it("chuỗi giữ ngân sách", () => {
    const r = generateInsights({ ...empty, budgetStreaks: [{ categoryId: 6, months: 3 }] });
    expect(text(r.find((i) => i.id === "streak-6"))).toBe("Bạn đã giữ ngân sách Ăn uống trong 3 tháng liên tiếp.");
  });

  it("ngày chi nhiều nhất cần đủ số giao dịch", () => {
    const totals = [100_000, 100_000, 100_000, 100_000, 100_000, 100_000, 900_000];
    expect(generateInsights({ ...empty, weekdayTotals: totals, weekdayTransactionCount: 5 }).some((i) => i.id === "weekday")).toBe(false);
    const r = generateInsights({ ...empty, weekdayTotals: totals, weekdayTransactionCount: 40 });
    expect(text(r.find((i) => i.id === "weekday"))).toContain("Thứ Bảy");
  });

  it("cùng dữ liệu hiển thị được bằng tiếng Anh, kể cả tên danh mục mặc định", () => {
    const r = generateInsights({ ...empty, budgetStreaks: [{ categoryId: 6, months: 3 }] });
    expect(text(r[0], en)).toBe("You have stayed within your Food & drinks budget for 3 months in a row.");
  });
});
