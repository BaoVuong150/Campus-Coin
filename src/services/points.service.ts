import { prisma } from "@/lib/database/prisma";
import { computeBudget } from "@/lib/finance/budget";
import {
  ACHIEVEMENTS,
  computeStreak,
  levelFor,
  POINT_VALUES,
  unlockedAchievements,
} from "@/lib/finance/points";
import type { PointReason } from "@/i18n/templates";
import type { PointsSummaryDTO } from "@/types/points";
import { currentMonthKey, DAY_MS, monthRange, shiftMonthKey, todayYmd, toMonthKey, toYmd, vnParts, vnStartOfDay } from "@/lib/utils/date";
import { notify } from "./notification.service";
import { toNumber } from "./mappers";

const STREAK_WINDOW_DAYS = 120;
const WEEKS_TO_EVALUATE = 4;
const MONTHS_TO_EVALUATE = 2;
const HISTORY_LIMIT = 15;
/** Phần thưởng đủ lớn để báo thông báo (tránh spam với +2 mỗi ngày). */
const NOTIFY_REASONS = new Set<PointReason>(["budgetWeek", "monthlySavings"]);

/** Cộng điểm một lần duy nhất cho mỗi dedupeKey (unique user_id + dedupe_key). */
export async function awardPoints(userId: string, reason: PointReason, dedupeKey: string): Promise<boolean> {
  const points = POINT_VALUES[reason];
  const { count } = await prisma.pointEvent.createMany({
    data: [{ user_id: userId, reason, points, dedupe_key: dedupeKey }],
    skipDuplicates: true,
  });
  if (count > 0 && NOTIFY_REASONS.has(reason)) {
    await notify(userId, {
      kind: "goal",
      type: "success",
      template: "pointsEarned",
      params: { points, reason },
      link: "/points",
      dedupeKey: `points:${dedupeKey}`,
    });
  }
  return count > 0;
}

/** Gọi sau khi user ghi giao dịch: +10 lần đầu, +2 cho mỗi ngày có ghi chép. */
export async function onTransactionLogged(userId: string, now = new Date()) {
  await awardPoints(userId, "firstTransaction", "first-transaction");
  await awardPoints(userId, "dailyLog", `log:${todayYmd(now)}`);
}

/** +5 tối đa một lần mỗi ngày (theo user, không theo mục tiêu) để không thể "cày" điểm bằng nhiều mục tiêu nhỏ. */
export async function onGoalDeposit(userId: string, now = new Date()) {
  await awardPoints(userId, "goalDeposit", `deposit:${todayYmd(now)}`);
}

export async function onGoalCompleted(userId: string, goalId: string) {
  await awardPoints(userId, "goalCompleted", `goal:${goalId}`);
}

/**
 * Tuần (thứ Hai → Chủ nhật, giờ VN) đã kết thúc, có ghi chép và mọi ngân sách của tháng
 * đều chưa vượt tính đến cuối tuần → +10 điểm.
 */
async function evaluateBudgetWeeks(userId: string, now: Date): Promise<number> {
  let awarded = 0;
  const today = vnParts(now);
  const daysSinceMonday = (today.weekday + 6) % 7;
  const thisMonday = vnStartOfDay(today.year, today.month, today.day - daysSinceMonday);

  for (let i = 1; i <= WEEKS_TO_EVALUATE; i++) {
    const start = new Date(thisMonday.getTime() - i * 7 * DAY_MS);
    const end = new Date(start.getTime() + 7 * DAY_MS);
    const month = toMonthKey(new Date(end.getTime() - 1));
    const [budgets, activity] = await Promise.all([
      prisma.budget.findMany({ where: { user_id: userId, month } }),
      prisma.transaction.count({ where: { user_id: userId, date: { gte: start, lt: end } } }),
    ]);
    if (budgets.length === 0 || activity === 0) continue;

    const spent = await prisma.transaction.groupBy({
      by: ["category_id"],
      where: { user_id: userId, type: "expense", date: { gte: monthRange(month).start, lt: end } },
      _sum: { amount: true },
    });
    const spentMap = new Map(spent.map((s) => [s.category_id, toNumber(s._sum.amount)]));
    const kept = budgets.every((b) => computeBudget(toNumber(b.limit_amount), spentMap.get(b.category_id) ?? 0).status !== "exceeded");
    if (kept && (await awardPoints(userId, "budgetWeek", `budget-week:${toYmd(start)}`))) awarded += 1;
  }
  return awarded;
}

/** Tháng đã kết thúc có (thu − chi) ≥ mục tiêu tiết kiệm tháng → +25 điểm. */
async function evaluateMonthlySavings(userId: string, now: Date): Promise<number> {
  const user = await prisma.user.findUnique({ where: { id: userId }, select: { monthly_savings_goal: true } });
  const goal = toNumber(user?.monthly_savings_goal);
  if (goal <= 0) return 0;
  let awarded = 0;

  for (let i = 1; i <= MONTHS_TO_EVALUATE; i++) {
    const month = shiftMonthKey(currentMonthKey(now), -i);
    const { start, end } = monthRange(month);
    const rows = await prisma.transaction.groupBy({
      by: ["type"],
      where: { user_id: userId, date: { gte: start, lt: end } },
      _sum: { amount: true },
      orderBy: { type: "asc" },
    });
    const income = toNumber(rows.find((r) => r.type === "income")?._sum?.amount);
    const expense = toNumber(rows.find((r) => r.type === "expense")?._sum?.amount);
    if (income > 0 && income - expense >= goal && (await awardPoints(userId, "monthlySavings", `savings:${month}`))) awarded += 1;
  }
  return awarded;
}

/** Cộng điểm cho các tuần/tháng đã kết thúc (idempotent). Gọi từ POST /api/sync, không gọi trong GET. */
export async function evaluatePeriodicRewards(userId: string, now = new Date()): Promise<number> {
  return (await evaluateBudgetWeeks(userId, now)) + (await evaluateMonthlySavings(userId, now));
}

/** Chỉ đọc: điểm, cấp độ, chuỗi ngày, thành tựu. */
export async function getPointsSummary(userId: string, now = new Date()): Promise<PointsSummaryDTO> {

  const windowStart = new Date(now.getTime() - STREAK_WINDOW_DAYS * DAY_MS);
  const [total, history, days, transactionCount, goalDeposits, budgetWeeks, completedGoals, recurringCount] = await Promise.all([
    prisma.pointEvent.aggregate({ where: { user_id: userId }, _sum: { points: true } }),
    prisma.pointEvent.findMany({ where: { user_id: userId }, orderBy: { created_at: "desc" }, take: HISTORY_LIMIT }),
    prisma.$queryRaw<{ day: string }[]>`
      SELECT DISTINCT to_char("date" + INTERVAL '7 hours', 'YYYY-MM-DD') AS day
      FROM "transactions"
      WHERE "user_id" = ${userId} AND "recurring_id" IS NULL AND "date" >= ${windowStart}`,
    prisma.transaction.count({ where: { user_id: userId } }),
    prisma.goalContribution.count({ where: { goal: { user_id: userId }, amount: { gt: 0 } } }),
    prisma.pointEvent.count({ where: { user_id: userId, reason: "budgetWeek" } }),
    prisma.savingGoal.count({ where: { user_id: userId, status: "completed" } }),
    prisma.recurringTransaction.count({ where: { user_id: userId } }),
  ]);

  const points = total._sum.points ?? 0;
  const streak = computeStreak(
    days.map((d) => d.day),
    todayYmd(now)
  );
  const unlocked = unlockedAchievements({
    transactionCount,
    bestStreak: streak.best,
    goalDeposits,
    budgetWeeks,
    completedGoals,
    recurringCount,
  });

  return {
    total: points,
    level: levelFor(points),
    streak,
    achievements: ACHIEVEMENTS.map((id) => ({ id, unlocked: unlocked[id] })),
    history: history.map((h) => ({
      id: h.id,
      reason: h.reason as PointReason,
      points: h.points,
      createdAt: h.created_at.toISOString(),
    })),
    values: POINT_VALUES,
  };
}
