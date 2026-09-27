import { prisma } from "@/lib/database/prisma";
import { forecastMonthEnd } from "@/lib/finance/forecast";
import { calculateSafeToSpend } from "@/lib/finance/safe-to-spend";
import {
  currentMonthKey,
  daysInMonth,
  elapsedDaysInMonth,
  monthRange,
  parseMonthKey,
  remainingDaysInMonth,
  shiftMonthKey,
} from "@/lib/utils/date";
import type { PlanningDTO } from "@/types/finance";
import { balanceBefore, endOfToday } from "./analytics.service";
import { getBudgetOverview } from "./budget.service";
import { reservedInGoals } from "./goal.service";
import { upcomingInMonth } from "./recurring.service";
import { toNumber } from "./mappers";

const HISTORY_MONTHS = 3;

/** Chi tiêu linh hoạt = khoản chi không sinh ra từ lịch định kỳ (các khoản cố định được dự báo riêng). */
async function variableExpense(userId: string, start: Date, end: Date): Promise<number> {
  const agg = await prisma.transaction.aggregate({
    where: { user_id: userId, type: "expense", recurring_id: null, date: { gte: start, lt: end } },
    _sum: { amount: true },
  });
  return toNumber(agg._sum.amount);
}

async function historicalDailyVariable(userId: string, month: string): Promise<number | null> {
  const first = shiftMonthKey(month, -HISTORY_MONTHS);
  const start = monthRange(first).start;
  const end = monthRange(month).start;
  const count = await prisma.transaction.count({ where: { user_id: userId, date: { gte: start, lt: end } } });
  if (count === 0) return null;
  let days = 0;
  for (let i = 0; i < HISTORY_MONTHS; i++) {
    const { year, month: m } = parseMonthKey(shiftMonthKey(first, i));
    days += daysInMonth(year, m);
  }
  return (await variableExpense(userId, start, end)) / days;
}

async function goalDepositsThisMonth(userId: string, month: string): Promise<number> {
  const { start, end } = monthRange(month);
  const agg = await prisma.goalContribution.aggregate({
    where: { goal: { user_id: userId }, created_at: { gte: start, lt: end } },
    _sum: { amount: true },
  });
  return Math.max(0, toNumber(agg._sum.amount));
}

export async function getPlanning(userId: string, now = new Date()): Promise<PlanningDTO> {
  const month = currentMonthKey(now);
  const todayEnd = endOfToday(now);

  const [balance, upcoming, goalReserved, budget, user, variableSoFar, history, deposits] = await Promise.all([
    balanceBefore(userId, todayEnd),
    upcomingInMonth(userId, month, now),
    reservedInGoals(userId),
    getBudgetOverview(userId, month),
    prisma.user.findUnique({ where: { id: userId }, select: { monthly_savings_goal: true } }),
    variableExpense(userId, monthRange(month).start, todayEnd),
    historicalDailyVariable(userId, month),
    goalDepositsThisMonth(userId, month),
  ]);

  const remainingFixedExpenses = upcoming.filter((u) => u.type === "expense").reduce((a, u) => a + u.amount, 0);
  const expectedIncome = upcoming.filter((u) => u.type === "income").reduce((a, u) => a + u.amount, 0);
  // Tiền đã nạp vào mục tiêu trong tháng được tính là phần tiết kiệm của tháng, tránh trừ hai lần.
  const savingsTarget = Math.max(0, toNumber(user?.monthly_savings_goal) - deposits);
  const remainingDays = remainingDaysInMonth(month, now);
  const budgetRemaining = budget.items.length ? budget.totals.remaining : null;

  const safe = calculateSafeToSpend({
    currentBalance: balance,
    remainingFixedExpenses,
    expectedIncome,
    goalReserved,
    savingsTarget,
    budgetRemaining,
    remainingDays,
  });

  const forecast = forecastMonthEnd({
    currentBalance: balance,
    variableSpentThisMonth: variableSoFar,
    elapsedDays: elapsedDaysInMonth(month, now),
    daysAfterToday: Math.max(0, remainingDays - 1),
    remainingFixedExpenses,
    expectedIncome,
    historicalDailyVariable: history,
  });

  return {
    month,
    remainingDays,
    currentBalance: balance,
    remainingFixedExpenses,
    expectedIncome,
    goalReserved,
    savingsTarget,
    budgetRemaining,
    safeToSpend: safe,
    forecast: { ...forecast, variableSpentThisMonth: variableSoFar },
    upcomingFixed: upcoming.map((u) => ({
      id: u.id,
      name: u.name,
      amount: u.amount,
      date: u.date.toISOString(),
      type: u.type,
    })),
  };
}
