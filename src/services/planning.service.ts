import { prisma } from "@/lib/database/prisma";
import { forecastConfidence, forecastMonthEnd, forecastNextMonth } from "@/lib/finance/forecast";
import { calculateSafeToSpend } from "@/lib/finance/safe-to-spend";
import { sampleDays, upcomingAllowance } from "@/lib/finance/sampling";
import { currentMonthKey, daysInMonth, monthRange, parseMonthKey, remainingDaysInMonth, shiftMonthKey } from "@/lib/utils/date";
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

/** Lịch sử quá ngắn (dưới 1 tuần có dữ liệu) thì không đủ tin cậy để làm tốc độ chi tham chiếu. */
const MIN_HISTORY_SAMPLE_DAYS = 7;

/**
 * Chi tiêu linh hoạt trung bình/ngày của 3 tháng trước. Mẫu số là số ngày THỰC SỰ có dữ liệu
 * (từ giao dịch đầu tiên của user), không phải toàn bộ ~90 ngày – nếu không, user mới sẽ bị đánh giá thấp tốc độ chi.
 */
async function historicalDailyVariable(userId: string, month: string, firstActivity: Date | null): Promise<number | null> {
  const start = monthRange(shiftMonthKey(month, -HISTORY_MONTHS)).start;
  const end = monthRange(month).start;
  const days = sampleDays(start, end, firstActivity);
  if (days < MIN_HISTORY_SAMPLE_DAYS) return null;
  return (await variableExpense(userId, start, end)) / days;
}

/** Số tháng gần nhất (tính cả tháng hiện tại) dùng làm xu hướng chi linh hoạt cho dự báo tháng tới. */
const NEXT_MONTH_TREND_MONTHS = 3;

/** Chi linh hoạt/ngày trong ~3 tháng gần nhất đến hết hôm nay; null khi chưa đủ 1 tuần dữ liệu. */
async function recentDailyVariable(userId: string, month: string, todayEnd: Date, firstActivity: Date | null) {
  const start = monthRange(shiftMonthKey(month, -(NEXT_MONTH_TREND_MONTHS - 1))).start;
  const days = sampleDays(start, todayEnd, firstActivity);
  if (days < MIN_HISTORY_SAMPLE_DAYS) return { daily: null, days };
  return { daily: (await variableExpense(userId, start, todayEnd)) / days, days };
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
  const monthStart = monthRange(month).start;
  const todayEnd = endOfToday(now);

  const first = await prisma.transaction.aggregate({ where: { user_id: userId }, _min: { date: true } });
  const firstActivity = first._min.date;

  const next = shiftMonthKey(month, 1);
  const [balance, recurringUpcoming, goalReserved, budget, user, variableSoFar, history, deposits, recurringIncomeCount, nextRecurring, recent] =
    await Promise.all([
      balanceBefore(userId, todayEnd),
      upcomingInMonth(userId, month, now),
      reservedInGoals(userId),
      getBudgetOverview(userId, month),
      prisma.user.findUnique({
        where: { id: userId },
        select: { monthly_savings_goal: true, monthly_allowance_baseline: true, salary_pay_day: true },
      }),
      variableExpense(userId, monthStart, todayEnd),
      historicalDailyVariable(userId, month, firstActivity),
      goalDepositsThisMonth(userId, month),
      prisma.recurringTransaction.count({ where: { user_id: userId, status: "active", type: "income" } }),
      upcomingInMonth(userId, next, now),
      recentDailyVariable(userId, month, todayEnd, firstActivity),
    ]);

  // Trợ cấp cơ bản trong Cài đặt được tính là thu nhập sắp nhận khi user chưa khai báo khoản thu định kỳ.
  const allowance = upcomingAllowance({
    allowance: toNumber(user?.monthly_allowance_baseline),
    payDay: user?.salary_pay_day ?? null,
    hasRecurringIncome: recurringIncomeCount > 0,
    now,
  });
  const upcoming = allowance
    ? [
        ...recurringUpcoming,
        { id: "allowance", name: "allowance", amount: allowance.amount, date: allowance.date, type: "income" as const, isFixed: true },
      ]
    : recurringUpcoming;

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
    // Số ngày có dữ liệu trong tháng (tính từ giao dịch đầu tiên nếu user mới bắt đầu giữa tháng).
    elapsedDays: sampleDays(monthStart, todayEnd, firstActivity),
    daysAfterToday: Math.max(0, remainingDays - 1),
    remainingFixedExpenses,
    expectedIncome,
    historicalDailyVariable: history,
  });

  // Tháng tới: lịch định kỳ của tháng đó + trợ cấp cơ bản (nếu chưa khai báo khoản thu định kỳ) + xu hướng chi linh hoạt.
  const { year: nextYear, month: nextMonthNumber } = parseMonthKey(next);
  const baselineAllowance = recurringIncomeCount === 0 ? toNumber(user?.monthly_allowance_baseline) : 0;
  const nextForecast = forecastNextMonth({
    fixedIncome: nextRecurring.filter((u) => u.type === "income").reduce((a, u) => a + u.amount, 0) + baselineAllowance,
    fixedExpenses: nextRecurring.filter((u) => u.type === "expense").reduce((a, u) => a + u.amount, 0),
    dailyVariable: recent.daily,
    daysInMonth: daysInMonth(nextYear, nextMonthNumber),
  });

  // Tổng số ngày có dữ liệu (từ giao dịch đầu tiên tới hôm nay) – hiển thị "Dựa trên N ngày dữ liệu".
  const dataDays = sampleDays(new Date(0), todayEnd, firstActivity);

  return {
    month,
    hasActivity: firstActivity !== null,
    remainingDays,
    currentBalance: balance,
    remainingFixedExpenses,
    expectedIncome,
    goalReserved,
    savingsTarget,
    monthlySavingsGoal: toNumber(user?.monthly_savings_goal),
    budgetRemaining,
    safeToSpend: safe,
    forecast: {
      ...forecast,
      variableSpentThisMonth: variableSoFar,
      dataDays,
      confidence: forecastConfidence(dataDays, forecast.paceSource),
    },
    upcomingFixed: upcoming.map((u) => ({
      id: u.id,
      name: u.name,
      amount: u.amount,
      date: u.date.toISOString(),
      type: u.type,
    })),
    nextMonth: nextForecast ? { month: next, basisDays: recent.days, ...nextForecast } : null,
  };
}
