import { describe, expect, it } from "vitest";
import { computeBudget, summarizeBudgets } from "@/lib/finance/budget";
import { detectAnomaly } from "@/lib/finance/anomaly";
import { computeGoalProgress } from "@/lib/finance/goals";

describe("computeBudget", () => {
  it("bình thường dưới 80%", () => {
    expect(computeBudget(2_000_000, 1_000_000)).toMatchObject({ percentage: 50, status: "normal", remaining: 1_000_000 });
  });
  it("cảnh báo từ 80%", () => {
    expect(computeBudget(2_000_000, 1_650_000)).toMatchObject({ percentage: 83, status: "warning" });
  });
  it("vượt ngân sách", () => {
    expect(computeBudget(700_000, 900_000)).toMatchObject({ percentage: 129, status: "exceeded", remaining: 0, overBy: 200_000 });
  });
  it("tiêu đúng 100% chưa tính là vượt", () => {
    expect(computeBudget(500_000, 500_000).status).toBe("warning");
  });
  it("tổng hợp nhiều ngân sách", () => {
    const items = [computeBudget(2_000_000, 1_600_000), computeBudget(800_000, 500_000)];
    expect(summarizeBudgets(items)).toEqual({ limit: 2_800_000, spent: 2_100_000, remaining: 700_000, percentage: 75 });
  });
});

describe("detectAnomaly", () => {
  const history = [50_000, 60_000, 55_000, 45_000, 52_000, 58_000, 48_000];

  it("đánh dấu khoản vượt mean + 2σ", () => {
    expect(detectAnomaly(500_000, history, []).unusual).toBe(true);
  });
  it("không đánh dấu khoản bình thường", () => {
    expect(detectAnomaly(60_000, history, history).unusual).toBe(false);
  });
  it("không đánh giá khi chưa đủ mẫu lịch sử", () => {
    expect(detectAnomaly(5_000_000, [10_000, 20_000], [10_000]).unusual).toBe(false);
  });
  it("đánh dấu khi gấp 3 lần trung bình danh mục", () => {
    const broad = [10_000, 2_000_000, 30_000, 1_500_000, 40_000, 25_000];
    const category = [20_000, 25_000, 30_000, 22_000, 28_000];
    const r = detectAnomaly(200_000, broad, category);
    expect(r).toMatchObject({ unusual: true, reason: "category_multiple" });
  });
});

describe("computeGoalProgress", () => {
  const now = new Date("2026-09-27T03:00:00Z");
  it("tính % và số tiền cần mỗi tháng", () => {
    const r = computeGoalProgress(25_000_000, 12_500_000, new Date("2027-06-01T05:00:00Z"), now);
    expect(r.percentage).toBe(50);
    expect(r.remaining).toBe(12_500_000);
    expect(r.daysRemaining).toBe(247);
    expect(r.monthlyContribution).toBe(Math.ceil(12_500_000 / 9));
  });
  it("quá hạn khi chưa đạt", () => {
    expect(computeGoalProgress(1_000_000, 100_000, new Date("2026-09-01T05:00:00Z"), now).overdue).toBe(true);
  });
  it("không có hạn chót", () => {
    expect(computeGoalProgress(1_000_000, 0, null, now)).toMatchObject({ daysRemaining: null, monthlyContribution: null });
  });
});
