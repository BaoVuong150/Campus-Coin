import { describe, expect, it } from "vitest";
import { forecastMonthEnd } from "@/lib/finance/forecast";

const base = {
  currentBalance: 3_800_000,
  variableSpentThisMonth: 1_500_000,
  elapsedDays: 15,
  daysAfterToday: 15,
  remainingFixedExpenses: 800_000,
  expectedIncome: 0,
  historicalDailyVariable: 90_000,
};

describe("forecastMonthEnd", () => {
  it("ngoại suy theo tốc độ chi tiêu tháng hiện tại", () => {
    const r = forecastMonthEnd(base);
    expect(r.dailyPace).toBe(100_000);
    expect(r.paceSource).toBe("current_month");
    expect(r.projectedVariableSpend).toBe(1_500_000);
    expect(r.projectedEndBalance).toBe(1_500_000);
    expect(r.shortfall).toBe(0);
  });

  it("đầu tháng (ít ngày dữ liệu) dùng trung bình lịch sử", () => {
    const r = forecastMonthEnd({ ...base, elapsedDays: 3, variableSpentThisMonth: 900_000, daysAfterToday: 27 });
    expect(r.paceSource).toBe("history");
    expect(r.dailyPace).toBe(90_000);
    expect(r.projectedVariableSpend).toBe(2_430_000);
  });

  it("báo thiếu hụt khi số dư dự kiến âm", () => {
    const r = forecastMonthEnd({ ...base, currentBalance: 1_880_000 });
    expect(r.projectedEndBalance).toBe(-420_000);
    expect(r.shortfall).toBe(420_000);
  });

  it("cộng thu nhập định kỳ sắp nhận", () => {
    const r = forecastMonthEnd({ ...base, expectedIncome: 2_000_000 });
    expect(r.projectedEndBalance).toBe(3_500_000);
  });

  it("user mới chưa có lịch sử vẫn dùng dữ liệu tháng hiện tại", () => {
    const r = forecastMonthEnd({ ...base, elapsedDays: 2, variableSpentThisMonth: 200_000, historicalDailyVariable: null });
    expect(r.paceSource).toBe("current_month");
    expect(r.dailyPace).toBe(100_000);
  });

  it("ngày cuối tháng không còn chi tiêu dự kiến", () => {
    const r = forecastMonthEnd({ ...base, daysAfterToday: 0, remainingFixedExpenses: 0 });
    expect(r.projectedVariableSpend).toBe(0);
    expect(r.projectedEndBalance).toBe(base.currentBalance);
  });
});
