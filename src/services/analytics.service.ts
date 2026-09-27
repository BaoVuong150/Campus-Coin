import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/database/prisma";
import { generateInsights, type CategoryAmounts, type FinancialInsight } from "@/lib/finance/insights";
import { computeBudget } from "@/lib/finance/budget";
import {
  cashFlowBuckets,
  currentMonthKey,
  DAY_MS,
  dayRange,
  daysInMonth,
  elapsedDaysInMonth,
  formatDate,
  monthLabel,
  monthRange,
  parseMonthKey,
  quarterRange,
  shiftMonthKey,
  shortMonthLabel,
  todayYmd,
  vnParts,
  vnStartOfDay,
  yearRange,
  type CashFlowPreset,
  type DateRange,
} from "@/lib/utils/date";
import type {
  CashFlowPoint,
  CategoryBreakdownItem,
  ReportDTO,
  ReportPeriod,
  SummaryDTO,
  TransactionType,
} from "@/types/finance";
import { getBudgetOverview } from "./budget.service";
import { toNumber, toTransactionDTO } from "./mappers";

const VN_SHIFT = Prisma.sql`INTERVAL '7 hours'`;

/** Số dư = tổng thu − tổng chi của mọi giao dịch trước thời điểm `before`. */
export async function balanceBefore(userId: string, before: Date): Promise<number> {
  const rows = await prisma.transaction.groupBy({
    by: ["type"],
    where: { user_id: userId, date: { lt: before } },
    _sum: { amount: true },
    orderBy: { type: "asc" },
  });
  let balance = 0;
  for (const r of rows) balance += (r.type === "income" ? 1 : -1) * toNumber(r._sum?.amount);
  return balance;
}

export async function totalsInRange(userId: string, range: DateRange) {
  const rows = await prisma.transaction.groupBy({
    by: ["type"],
    where: { user_id: userId, date: { gte: range.start, lt: range.end } },
    _sum: { amount: true },
    _count: { _all: true },
    orderBy: { type: "asc" },
  });
  const totals = { income: 0, expense: 0, count: 0 };
  for (const r of rows) {
    totals[r.type === "income" ? "income" : "expense"] = toNumber(r._sum?.amount);
    totals.count += typeof r._count === "object" && r._count ? (r._count._all ?? 0) : 0;
  }
  return totals;
}

/** Mốc "hết hôm nay" (giờ VN) – giao dịch hẹn ngày trong tương lai chưa tính vào số dư hiện tại. */
export const endOfToday = (now = new Date()) => dayRange(todayYmd(now)).end;

export async function getSummary(userId: string, month: string, now = new Date()): Promise<SummaryDTO> {
  const range = monthRange(month);
  const prevRange = monthRange(shiftMonthKey(month, -1));
  const balanceCutoff = month === currentMonthKey(now) ? endOfToday(now) : range.end;

  const [balance, previousBalance, current, previous, budget] = await Promise.all([
    balanceBefore(userId, balanceCutoff),
    balanceBefore(userId, range.start),
    totalsInRange(userId, range),
    totalsInRange(userId, prevRange),
    getBudgetOverview(userId, month),
  ]);

  return {
    month,
    balance,
    income: current.income,
    expense: current.expense,
    previousIncome: previous.income,
    previousExpense: previous.expense,
    previousBalance,
    budget: budget.items.length
      ? { limit: budget.totals.limit, remaining: budget.totals.remaining, percentage: budget.totals.percentage }
      : null,
  };
}

interface KeyedSum {
  key: string;
  type: string;
  total: number;
}

async function sumsByPeriod(userId: string, range: DateRange, granularity: "day" | "month"): Promise<KeyedSum[]> {
  const format = granularity === "day" ? "YYYY-MM-DD" : "YYYY-MM";
  return prisma.$queryRaw<KeyedSum[]>`
    SELECT to_char("date" + ${VN_SHIFT}, ${format}) AS key, "type", SUM("amount")::float8 AS total
    FROM "transactions"
    WHERE "user_id" = ${userId} AND "date" >= ${range.start} AND "date" < ${range.end}
    GROUP BY 1, 2`;
}

function dayLabel(ymd: string) {
  const [, m, d] = ymd.split("-");
  return `${d}/${m}`;
}

function toPoints(keys: string[], rows: KeyedSum[], granularity: "day" | "month"): CashFlowPoint[] {
  const map = new Map(keys.map((k) => [k, { income: 0, expense: 0 }]));
  for (const r of rows) {
    const slot = map.get(r.key);
    if (slot) slot[r.type === "income" ? "income" : "expense"] += Number(r.total);
  }
  return keys.map((key) => ({
    key,
    label: granularity === "day" ? dayLabel(key) : shortMonthLabel(key),
    ...map.get(key)!,
  }));
}

export async function getCashFlow(userId: string, preset: CashFlowPreset, now = new Date()): Promise<CashFlowPoint[]> {
  const { range, granularity, keys } = cashFlowBuckets(preset, now);
  return toPoints(keys, await sumsByPeriod(userId, range, granularity), granularity);
}

export async function getCategoryBreakdown(
  userId: string,
  range: DateRange,
  type: TransactionType = "expense"
): Promise<CategoryBreakdownItem[]> {
  const rows = await prisma.transaction.groupBy({
    by: ["category_id"],
    where: { user_id: userId, type, date: { gte: range.start, lt: range.end } },
    _sum: { amount: true },
  });
  if (rows.length === 0) return [];
  const categories = await prisma.category.findMany({ where: { id: { in: rows.map((r) => r.category_id) } } });
  const byId = new Map(categories.map((c) => [c.id, c]));
  const total = rows.reduce((acc, r) => acc + toNumber(r._sum.amount), 0);

  return rows
    .map((r) => {
      const c = byId.get(r.category_id);
      const amount = toNumber(r._sum.amount);
      return {
        categoryId: r.category_id,
        name: c?.name ?? "Khác",
        color: c?.color ?? null,
        icon: c?.icon ?? null,
        amount,
        percentage: total > 0 ? (amount / total) * 100 : 0,
      };
    })
    .sort((a, b) => b.amount - a.amount);
}

async function expenseByCategory(userId: string, range: DateRange): Promise<CategoryAmounts> {
  const rows = await prisma.transaction.groupBy({
    by: ["category_id"],
    where: { user_id: userId, type: "expense", date: { gte: range.start, lt: range.end } },
    _sum: { amount: true },
  });
  return Object.fromEntries(rows.map((r) => [r.category_id, toNumber(r._sum.amount)]));
}

const INSIGHT_WEEKDAY_WINDOW_DAYS = 90;
const INSIGHT_BASELINE_WEEKS = 8;
const STREAK_LOOKBACK_MONTHS = 6;

export async function getInsights(userId: string, now = new Date()): Promise<FinancialInsight[]> {
  const today = vnParts(now);
  const month = currentMonthKey(now);
  const todayEnd = endOfToday(now);
  const last7Start = vnStartOfDay(today.year, today.month, today.day - 6);
  const baselineStart = new Date(last7Start.getTime() - INSIGHT_BASELINE_WEEKS * 7 * DAY_MS);
  const monthStart = monthRange(month).start;

  const prevMonth = shiftMonthKey(month, -1);
  const prev = parseMonthKey(prevMonth);
  const prevSameDay = Math.min(today.day, daysInMonth(prev.year, prev.month));
  const prevMonthToDate = { start: monthRange(prevMonth).start, end: vnStartOfDay(prev.year, prev.month, prevSameDay + 1) };

  const weekdayStart = new Date(todayEnd.getTime() - INSIGHT_WEEKDAY_WINDOW_DAYS * DAY_MS);
  const streakFrom = shiftMonthKey(month, -STREAK_LOOKBACK_MONTHS);

  const [categories, last7, baseline, activeWeekRows, mtd, lastMtd, weekdayRows, totals, budgets, monthlySpend] = await Promise.all([
    prisma.category.findMany({ where: { OR: [{ user_id: null }, { user_id: userId }] }, select: { id: true, name: true } }),
    expenseByCategory(userId, { start: last7Start, end: todayEnd }),
    expenseByCategory(userId, { start: baselineStart, end: last7Start }),
    prisma.$queryRaw<{ category_id: number; weeks: number }[]>`
      SELECT "category_id", COUNT(DISTINCT FLOOR(EXTRACT(EPOCH FROM ("date" - ${baselineStart}::timestamp)) / 604800))::int AS weeks
      FROM "transactions"
      WHERE "user_id" = ${userId} AND "type" = 'expense' AND "date" >= ${baselineStart} AND "date" < ${last7Start}
      GROUP BY 1`,
    expenseByCategory(userId, { start: monthStart, end: todayEnd }),
    expenseByCategory(userId, prevMonthToDate),
    prisma.$queryRaw<{ dow: number; total: number; count: number }[]>`
      SELECT EXTRACT(DOW FROM "date" + ${VN_SHIFT})::int AS dow, SUM("amount")::float8 AS total, COUNT(*)::int AS count
      FROM "transactions"
      WHERE "user_id" = ${userId} AND "type" = 'expense' AND "date" >= ${weekdayStart} AND "date" < ${todayEnd}
      GROUP BY 1`,
    totalsInRange(userId, { start: monthStart, end: todayEnd }),
    prisma.budget.findMany({
      where: { user_id: userId, month: { gte: streakFrom, lt: month } },
      select: { category_id: true, month: true, limit_amount: true },
    }),
    prisma.$queryRaw<{ month: string; category_id: number; total: number }[]>`
      SELECT to_char("date" + ${VN_SHIFT}, 'YYYY-MM') AS month, "category_id", SUM("amount")::float8 AS total
      FROM "transactions"
      WHERE "user_id" = ${userId} AND "type" = 'expense' AND "date" >= ${monthRange(streakFrom).start} AND "date" < ${monthStart}
      GROUP BY 1, 2`,
  ]);

  const avgWeekly: CategoryAmounts = {};
  for (const [id, amount] of Object.entries(baseline)) avgWeekly[Number(id)] = amount / INSIGHT_BASELINE_WEEKS;

  const weekdayTotals = Array(7).fill(0);
  let weekdayCount = 0;
  for (const r of weekdayRows) {
    weekdayTotals[r.dow] = Number(r.total);
    weekdayCount += Number(r.count);
  }
  const weekdayOccurrences = Array(7).fill(0);
  for (let t = weekdayStart.getTime(); t < todayEnd.getTime(); t += DAY_MS) weekdayOccurrences[vnParts(new Date(t)).weekday] += 1;

  const spendMap = new Map(monthlySpend.map((r) => [`${r.month}:${r.category_id}`, Number(r.total)]));
  const budgetMap = new Map(budgets.map((b) => [`${b.month}:${b.category_id}`, toNumber(b.limit_amount)]));
  const streaks: { categoryId: number; months: number }[] = [];
  for (const categoryId of new Set(budgets.map((b) => b.category_id))) {
    let months = 0;
    for (let i = 1; i <= STREAK_LOOKBACK_MONTHS; i++) {
      const key = `${shiftMonthKey(month, -i)}:${categoryId}`;
      const limit = budgetMap.get(key);
      if (limit === undefined || computeBudget(limit, spendMap.get(key) ?? 0).status === "exceeded") break;
      months += 1;
    }
    streaks.push({ categoryId, months });
  }

  return generateInsights({
    categoryNames: Object.fromEntries(categories.map((c) => [c.id, c.name])),
    last7DaysByCategory: last7,
    avgWeeklyByCategory: avgWeekly,
    activeWeeksByCategory: Object.fromEntries(activeWeekRows.map((r) => [r.category_id, Number(r.weeks)])),
    monthToDateByCategory: mtd,
    lastMonthToDateByCategory: lastMtd,
    weekdayTotals,
    weekdayOccurrences,
    weekdayTransactionCount: weekdayCount,
    budgetStreaks: streaks,
    monthToDateExpense: totals.expense,
    monthToDateIncome: totals.income,
    elapsedDays: elapsedDaysInMonth(month, now),
  });
}

// ---------- Reports ----------

const LARGEST_TRANSACTIONS = 5;

function reportRange(period: ReportPeriod, anchor: string): { range: DateRange; label: string; months: string[] } {
  const { year, month } = parseMonthKey(anchor);
  if (period === "month") {
    return { range: monthRange(anchor), label: monthLabel(anchor), months: [anchor] };
  }
  if (period === "quarter") {
    const quarter = Math.ceil(month / 3);
    const first = `${year}-${String((quarter - 1) * 3 + 1).padStart(2, "0")}`;
    return {
      range: quarterRange(year, quarter),
      label: `Quý ${quarter}/${year}`,
      months: [0, 1, 2].map((i) => shiftMonthKey(first, i)),
    };
  }
  return {
    range: yearRange(year),
    label: `Năm ${year}`,
    months: Array.from({ length: 12 }, (_, i) => `${year}-${String(i + 1).padStart(2, "0")}`),
  };
}

export async function getReport(userId: string, period: ReportPeriod, anchor: string, now = new Date()): Promise<ReportDTO> {
  const { range, label, months } = reportRange(period, anchor);
  const granularity = period === "month" ? "day" : "month";
  const { year, month } = parseMonthKey(anchor);
  const keys =
    granularity === "day"
      ? Array.from({ length: daysInMonth(year, month) }, (_, i) => `${anchor}-${String(i + 1).padStart(2, "0")}`)
      : months;

  const [totals, trendRows, categories, largest, budgets] = await Promise.all([
    totalsInRange(userId, range),
    sumsByPeriod(userId, range, granularity),
    getCategoryBreakdown(userId, range, "expense"),
    prisma.transaction.findMany({
      where: { user_id: userId, type: "expense", date: { gte: range.start, lt: range.end } },
      include: { category: true },
      orderBy: { amount: "desc" },
      take: LARGEST_TRANSACTIONS,
    }),
    prisma.budget.findMany({ where: { user_id: userId, month: { in: months } }, include: { category: true } }),
  ]);

  const spentRows = budgets.length
    ? await prisma.$queryRaw<{ month: string; category_id: number; total: number }[]>`
        SELECT to_char("date" + ${VN_SHIFT}, 'YYYY-MM') AS month, "category_id", SUM("amount")::float8 AS total
        FROM "transactions"
        WHERE "user_id" = ${userId} AND "type" = 'expense' AND "date" >= ${range.start} AND "date" < ${range.end}
        GROUP BY 1, 2`
    : [];
  const spentMap = new Map(spentRows.map((r) => [`${r.month}:${r.category_id}`, Number(r.total)]));
  const perf = new Map<number, { categoryName: string; limit: number; spent: number }>();
  for (const b of budgets) {
    const entry = perf.get(b.category_id) ?? { categoryName: b.category.name, limit: 0, spent: 0 };
    entry.limit += toNumber(b.limit_amount);
    entry.spent += spentMap.get(`${b.month}:${b.category_id}`) ?? 0;
    perf.set(b.category_id, entry);
  }

  const effectiveEnd = Math.min(range.end.getTime(), endOfToday(now).getTime());
  const days = Math.max(1, Math.round((effectiveEnd - range.start.getTime()) / DAY_MS));

  return {
    period,
    label,
    from: formatDate(range.start),
    to: formatDate(new Date(range.end.getTime() - 1)),
    totals: {
      income: totals.income,
      expense: totals.expense,
      net: totals.income - totals.expense,
      transactionCount: totals.count,
      averageDailySpend: effectiveEnd > range.start.getTime() ? Math.round(totals.expense / days) : 0,
    },
    trend: toPoints(keys, trendRows, granularity),
    categories,
    largestTransactions: largest.map(toTransactionDTO),
    budgetPerformance: [...perf.values()]
      .map((p) => ({ ...p, percentage: p.limit > 0 ? Math.round((p.spent / p.limit) * 100) : 0 }))
      .sort((a, b) => b.percentage - a.percentage),
  };
}

