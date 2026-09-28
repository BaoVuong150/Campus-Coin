import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/database/prisma";
import { Errors } from "@/lib/api/errors";
import { CANONICAL_CATEGORY_NAMES, normalizeText } from "@/lib/finance/categorize";
import { monthlyEquivalent } from "@/lib/finance/recurring";
import { generateSavingTips, type SavingTipSuggestion, type TipInput } from "@/lib/finance/tips";
import type { RecurringFrequency } from "@/constants/finance";
import { currentMonthKey, daysInMonth, elapsedDaysInMonth, monthRange, parseMonthKey, remainingDaysInMonth, shiftMonthKey } from "@/lib/utils/date";
import type { InsightHistoryDTO, SavingTipDTO, SystemTipDTO } from "@/types/finance";
import { endOfToday, getInsights, totalsInRange } from "./analytics.service";
import { getBudgetOverview } from "./budget.service";
import { getPlanning } from "./planning.service";
import { toNumber } from "./mappers";

const SMALL_PURCHASE_LIMIT = 50_000;
const HISTORY_MONTHS = 3;
const VN_SHIFT = Prisma.sql`INTERVAL '7 hours'`;

// ---------------------------------------------------------------------------
// Tính đầu vào cho động cơ gợi ý từ dữ liệu thật của user
// ---------------------------------------------------------------------------

async function buildTipInput(userId: string, now: Date): Promise<TipInput> {
  const month = currentMonthKey(now);
  const { start } = monthRange(month);
  const todayEnd = endOfToday(now);
  const historyStart = monthRange(shiftMonthKey(month, -HISTORY_MONTHS)).start;
  const { year, month: m } = parseMonthKey(month);

  const [categories, mtdRows, historyRows, budget, small, recurring, user, planning, totals] = await Promise.all([
    prisma.category.findMany({ where: { OR: [{ user_id: null }, { user_id: userId }] }, select: { id: true, name: true } }),
    prisma.transaction.groupBy({
      by: ["category_id"],
      where: { user_id: userId, type: "expense", date: { gte: start, lt: todayEnd } },
      _sum: { amount: true },
    }),
    prisma.$queryRaw<{ month: string; category_id: number; total: number }[]>`
      SELECT to_char("date" + ${VN_SHIFT}, 'YYYY-MM') AS month, "category_id", SUM("amount")::float8 AS total
      FROM "transactions"
      WHERE "user_id" = ${userId} AND "type" = 'expense' AND "date" >= ${historyStart} AND "date" < ${start}
      GROUP BY 1, 2`,
    getBudgetOverview(userId, month),
    prisma.transaction.aggregate({
      where: { user_id: userId, type: "expense", amount: { lt: SMALL_PURCHASE_LIMIT }, date: { gte: start, lt: todayEnd } },
      _count: { _all: true },
      _sum: { amount: true },
    }),
    prisma.recurringTransaction.findMany({
      where: { user_id: userId, status: "active", type: "expense" },
      select: { amount: true, frequency: true, category: { select: { name: true } } },
    }),
    prisma.user.findUnique({ where: { id: userId }, select: { monthly_savings_goal: true } }),
    getPlanning(userId, now),
    totalsInRange(userId, { start, end: todayEnd }),
  ]);

  // Trung bình theo tháng: chia cho số tháng user THỰC SỰ có chi tiêu (không chia cho tháng chưa dùng app).
  const activeMonths = new Set(historyRows.map((r) => r.month)).size;
  const monthlyAverage: Record<number, number> = {};
  if (activeMonths > 0) {
    for (const r of historyRows) monthlyAverage[r.category_id] = (monthlyAverage[r.category_id] ?? 0) + Number(r.total) / activeMonths;
  }

  const subs = recurring.filter((r) => normalizeText(r.category.name) === CANONICAL_CATEGORY_NAMES.subscriptions);
  const projectedExpense =
    totals.expense + planning.forecast.projectedVariableSpend + planning.remainingFixedExpenses;

  return {
    month,
    elapsedDays: elapsedDaysInMonth(month, now),
    daysInMonth: daysInMonth(year, m),
    remainingDays: remainingDaysInMonth(month, now),
    categoryNames: Object.fromEntries(categories.map((c) => [c.id, c.name])),
    monthToDate: Object.fromEntries(mtdRows.map((r) => [r.category_id, toNumber(r._sum.amount)])),
    monthlyAverage,
    budgets: budget.items.map((b) => ({ categoryId: b.categoryId, limit: b.limit, spent: b.spent })),
    smallPurchases: { count: small._count._all, total: toNumber(small._sum.amount) },
    subscriptions: {
      count: subs.length,
      monthly: subs.reduce((a, r) => a + monthlyEquivalent(toNumber(r.amount), r.frequency as RecurringFrequency), 0),
    },
    savingsGoal: toNumber(user?.monthly_savings_goal),
    projectedSavings: totals.income + planning.expectedIncome - projectedExpense,
  };
}

// ---------------------------------------------------------------------------
// Danh sách mẹo: cá nhân (tính toán) + mẹo hệ thống (admin) + mẹo riêng đã lưu, kèm ghim/bỏ qua
// ---------------------------------------------------------------------------

/** Khóa mẹo hợp lệ: mẹo cá nhân theo tháng, mẹo hệ thống, mẹo riêng của user. */
const PERSONAL_KEY = /^[a-z-]+(:\d+)?:\d{4}-\d{2}$/;
const SYSTEM_KEY = /^system:(\d+)$/;
const OWN_KEY = /^own:(\d+)$/;

export async function listSavingTips(userId: string, limit = 5, now = new Date()): Promise<{ items: SavingTipDTO[]; total: number }> {
  const [suggestions, stored, states] = await Promise.all([
    buildTipInput(userId, now).then(generateSavingTips),
    // Mẹo hệ thống (user_id null) và mẹo riêng từ phiên bản trước (của chính user, không có tip_key).
    prisma.savingTip.findMany({ where: { tip_key: null, OR: [{ user_id: null }, { user_id: userId }] }, orderBy: { id: "asc" } }),
    prisma.savingTip.findMany({ where: { user_id: userId, tip_key: { not: null } } }),
  ]);
  const state = new Map(states.map((s) => [s.tip_key!, s]));

  const all: (SavingTipDTO & { dismissed: boolean })[] = [
    ...suggestions.map((s) => ({ ...personalDto(s), pinned: state.get(s.key)?.is_pinned ?? false, dismissed: state.get(s.key)?.is_dismissed ?? false })),
    ...stored.map((row) => {
      const system = row.user_id === null;
      const key = system ? `system:${row.id}` : `own:${row.id}`;
      const st = system ? state.get(key) : row;
      return {
        key,
        source: system ? ("system" as const) : ("own" as const),
        title: row.title,
        content: row.content,
        potentialSaving: row.potential_saving === null ? null : toNumber(row.potential_saving),
        pinned: st?.is_pinned ?? false,
        dismissed: st?.is_dismissed ?? false,
      };
    }),
  ];

  const visible = all
    .filter((t) => !t.dismissed)
    .sort((a, b) => Number(b.pinned) - Number(a.pinned) || (b.potentialSaving ?? 0) - (a.potentialSaving ?? 0));
  const items = visible.slice(0, limit).map((tip) => {
    const copy: SavingTipDTO & { dismissed?: boolean } = { ...tip };
    delete copy.dismissed;
    return copy as SavingTipDTO;
  });
  return { items, total: visible.length };
}

function personalDto(s: SavingTipSuggestion): Omit<Extract<SavingTipDTO, { source: "personal" }>, "pinned"> {
  return { key: s.key, source: "personal", template: s.template, params: s.params as Record<string, unknown>, potentialSaving: s.potentialSaving };
}

export type TipAction = "pin" | "unpin" | "dismiss" | "restore";

/** Ghim / bỏ ghim / bỏ qua một mẹo. Mẹo riêng: cập nhật chính dòng đó; mẹo cá nhân và mẹo hệ thống: dòng trạng thái theo user. */
export async function setTipState(userId: string, key: string, action: TipAction): Promise<void> {
  const flags =
    action === "pin" ? { is_pinned: true, is_dismissed: false } : action === "unpin" ? { is_pinned: false } : action === "dismiss" ? { is_dismissed: true, is_pinned: false } : { is_dismissed: false };

  const own = OWN_KEY.exec(key);
  if (own) {
    const { count } = await prisma.savingTip.updateMany({ where: { id: Number(own[1]), user_id: userId, tip_key: null }, data: flags });
    if (count === 0) throw Errors.notFound("NOT_FOUND", "Không tìm thấy mẹo.");
    return;
  }
  const system = SYSTEM_KEY.exec(key);
  if (system) {
    const exists = await prisma.savingTip.count({ where: { id: Number(system[1]), user_id: null } });
    if (!exists) throw Errors.notFound("NOT_FOUND", "Không tìm thấy mẹo.");
  } else if (!PERSONAL_KEY.test(key)) {
    throw Errors.badRequest("Mẹo không hợp lệ.");
  }
  await prisma.savingTip.upsert({
    where: { user_id_tip_key: { user_id: userId, tip_key: key } },
    create: { user_id: userId, tip_key: key, title: key, content: "", ...flags },
    update: flags,
  });
}

// ---------------------------------------------------------------------------
// Mẹo hệ thống (admin)
// ---------------------------------------------------------------------------

export async function listSystemTips(): Promise<SystemTipDTO[]> {
  const rows = await prisma.savingTip.findMany({ where: { user_id: null, tip_key: null }, orderBy: { id: "desc" } });
  return rows.map((r) => ({
    id: r.id,
    title: r.title,
    content: r.content,
    potentialSaving: r.potential_saving === null ? null : toNumber(r.potential_saving),
    createdAt: r.created_at.toISOString(),
  }));
}

export async function createSystemTip(input: { title: string; content: string; potential_saving?: number | null }): Promise<SystemTipDTO> {
  const row = await prisma.savingTip.create({
    data: { user_id: null, title: input.title, content: input.content, potential_saving: input.potential_saving ?? null },
  });
  return { id: row.id, title: row.title, content: row.content, potentialSaving: row.potential_saving === null ? null : toNumber(row.potential_saving), createdAt: row.created_at.toISOString() };
}

export async function deleteSystemTip(id: number): Promise<void> {
  const { count } = await prisma.savingTip.deleteMany({ where: { id, user_id: null, tip_key: null } });
  if (count === 0) throw Errors.notFound("NOT_FOUND", "Không tìm thấy mẹo.");
  // Xóa luôn trạng thái ghim/bỏ qua của user với mẹo này.
  await prisma.savingTip.deleteMany({ where: { tip_key: `system:${id}` } });
}

// ---------------------------------------------------------------------------
// Lịch sử nhận định theo tháng (SRS 3.7) + đánh dấu (SRS 3.10)
// ---------------------------------------------------------------------------

const SNAPSHOT_VERSION = 1;

/** Lưu ảnh chụp nhận định + mẹo hàng đầu của tháng hiện tại (cập nhật lại mỗi lần đồng bộ; tháng đã qua giữ nguyên). */
export async function snapshotMonthlyInsights(userId: string, now = new Date()): Promise<void> {
  const month = currentMonthKey(now);
  const [insights, tips] = await Promise.all([getInsights(userId, now), buildTipInput(userId, now).then(generateSavingTips)]);
  if (insights.length === 0 && tips.length === 0) return;
  const summary = JSON.stringify({ v: SNAPSHOT_VERSION, insights });
  const tipText = JSON.stringify({ v: SNAPSHOT_VERSION, tips: tips.slice(0, 3).map(({ template, params, potentialSaving }) => ({ template, params, potentialSaving })) });
  await prisma.insight.upsert({
    where: { user_id_month: { user_id: userId, month } },
    create: { user_id: userId, month, summary_text: summary, tip_text: tipText },
    update: { summary_text: summary, tip_text: tipText, generated_at: new Date() },
  });
}

function parseSnapshot<T>(text: string, field: string): T[] | null {
  try {
    const parsed = JSON.parse(text) as Record<string, unknown>;
    return parsed?.v === SNAPSHOT_VERSION && Array.isArray(parsed[field]) ? (parsed[field] as T[]) : null;
  } catch {
    return null;
  }
}

export async function listInsightHistory(userId: string, limit = 12): Promise<InsightHistoryDTO[]> {
  const rows = await prisma.insight.findMany({
    where: { user_id: userId },
    orderBy: [{ is_pinned: "desc" }, { month: "desc" }],
    take: limit,
  });
  return rows.map((r) => {
    const insights = parseSnapshot<NonNullable<InsightHistoryDTO["insights"]>[number]>(r.summary_text, "insights");
    const tips = parseSnapshot<NonNullable<InsightHistoryDTO["tips"]>[number]>(r.tip_text, "tips");
    return {
      id: r.id,
      month: r.month,
      pinned: r.is_pinned,
      generatedAt: r.generated_at.toISOString(),
      insights,
      tips,
      // Dữ liệu từ phiên bản cũ (văn bản thuần) vẫn hiển thị.
      legacySummary: insights ? null : r.summary_text,
      legacyTip: tips ? null : r.tip_text,
    };
  });
}

export async function setInsightPinned(userId: string, id: number, pinned: boolean): Promise<void> {
  const { count } = await prisma.insight.updateMany({ where: { id, user_id: userId }, data: { is_pinned: pinned } });
  if (count === 0) throw Errors.notFound("NOT_FOUND", "Không tìm thấy nhận định.");
}
