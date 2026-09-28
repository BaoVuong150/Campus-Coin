import { describe, expect, it } from "vitest";
import { computeStreak, levelFor, unlockedAchievements } from "@/lib/finance/points";

describe("Campus Points", () => {
  it("cấp độ theo mốc điểm", () => {
    expect(levelFor(0)).toMatchObject({ level: 1, nextLevelAt: 100, progress: 0 });
    expect(levelFor(150)).toMatchObject({ level: 2, currentLevelStart: 100, nextLevelAt: 300, progress: 25 });
    expect(levelFor(5000)).toMatchObject({ level: 5, nextLevelAt: null, progress: 100 });
  });

  it("chuỗi hiện tại tính cả khi hôm nay chưa ghi nhưng hôm qua có", () => {
    const days = ["2026-09-20", "2026-09-21", "2026-09-22", "2026-09-25", "2026-09-26"];
    expect(computeStreak(days, "2026-09-27")).toEqual({ current: 2, best: 3 });
    expect(computeStreak(days, "2026-09-26")).toEqual({ current: 2, best: 3 });
  });

  it("chuỗi bị ngắt khi bỏ lỡ hơn một ngày", () => {
    expect(computeStreak(["2026-09-20"], "2026-09-27")).toEqual({ current: 0, best: 1 });
    expect(computeStreak([], "2026-09-27")).toEqual({ current: 0, best: 0 });
  });

  it("chuỗi qua ranh giới tháng", () => {
    expect(computeStreak(["2026-08-30", "2026-08-31", "2026-09-01"], "2026-09-01").current).toBe(3);
  });

  it("thành tựu", () => {
    const r = unlockedAchievements({ transactionCount: 1, bestStreak: 7, goalDeposits: 0, budgetWeeks: 3, completedGoals: 0, recurringCount: 2 });
    expect(r).toEqual({ firstStep: true, streak7: true, saver: false, budgetKeeper: false, goalGetter: false, planner: true });
  });
});
