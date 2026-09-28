import type { PointReason } from "@/i18n/templates";
import { DAY_MS, toYmd, ymdToStorageDate } from "@/lib/utils/date";

/**
 * Campus Points – điểm thưởng nội bộ cho thói quen tài chính tốt.
 * Không phải tiền: không quy đổi, không mua bán, không chuyển nhượng.
 */
export const POINT_VALUES: Record<PointReason, number> = {
  firstTransaction: 10,
  dailyLog: 2,
  goalDeposit: 5,
  budgetWeek: 10,
  monthlySavings: 25,
  goalCompleted: 25,
};

/** Mốc điểm bắt đầu của từng cấp (cấp 1 → cấp 5). */
export const LEVEL_THRESHOLDS = [0, 100, 300, 600, 1000];

export interface LevelInfo {
  level: number;
  /** Chỉ số tên cấp trong từ điển (t.points.levels). */
  titleIndex: number;
  currentLevelStart: number;
  nextLevelAt: number | null;
  progress: number;
}

export function levelFor(total: number): LevelInfo {
  let index = 0;
  for (let i = 0; i < LEVEL_THRESHOLDS.length; i++) if (total >= LEVEL_THRESHOLDS[i]) index = i;
  const start = LEVEL_THRESHOLDS[index];
  const next = LEVEL_THRESHOLDS[index + 1] ?? null;
  return {
    level: index + 1,
    titleIndex: index,
    currentLevelStart: start,
    nextLevelAt: next,
    progress: next === null ? 100 : Math.round(((total - start) / (next - start)) * 100),
  };
}

/**
 * Chuỗi ngày ghi chép: số ngày liên tiếp có ít nhất một giao dịch.
 * Chuỗi hiện tại vẫn được giữ nếu hôm nay chưa ghi nhưng hôm qua có ghi.
 */
export function computeStreak(days: string[], today: string): { current: number; best: number } {
  const set = new Set(days);
  const sorted = [...set].sort();
  let best = 0;
  let run = 0;
  let prev: string | null = null;
  for (const day of sorted) {
    run = prev && ymdToStorageDate(day).getTime() - ymdToStorageDate(prev).getTime() === DAY_MS ? run + 1 : 1;
    best = Math.max(best, run);
    prev = day;
  }

  const shift = (ymd: string, delta: number) => toYmd(new Date(ymdToStorageDate(ymd).getTime() + delta * DAY_MS));
  let cursor = set.has(today) ? today : shift(today, -1);
  let current = 0;
  while (set.has(cursor)) {
    current += 1;
    cursor = shift(cursor, -1);
  }
  return { current, best };
}

export const ACHIEVEMENTS = ["firstStep", "streak7", "saver", "budgetKeeper", "goalGetter", "planner"] as const;
export type AchievementId = (typeof ACHIEVEMENTS)[number];

export interface AchievementStats {
  transactionCount: number;
  bestStreak: number;
  goalDeposits: number;
  budgetWeeks: number;
  completedGoals: number;
  recurringCount: number;
}

const BUDGET_KEEPER_WEEKS = 4;
const STREAK_ACHIEVEMENT_DAYS = 7;

export function unlockedAchievements(stats: AchievementStats): Record<AchievementId, boolean> {
  return {
    firstStep: stats.transactionCount > 0,
    streak7: stats.bestStreak >= STREAK_ACHIEVEMENT_DAYS,
    saver: stats.goalDeposits > 0,
    budgetKeeper: stats.budgetWeeks >= BUDGET_KEEPER_WEEKS,
    goalGetter: stats.completedGoals > 0,
    planner: stats.recurringCount > 0,
  };
}
