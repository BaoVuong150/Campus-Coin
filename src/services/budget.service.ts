import { prisma } from "@/lib/database/prisma";
import { Errors } from "@/lib/api/errors";
import { computeBudget, summarizeBudgets } from "@/lib/finance/budget";
import { monthLabel, monthRange } from "@/lib/utils/date";
import { formatVND } from "@/lib/utils/money";
import type { UpsertBudgetInput } from "@/lib/validations/budget.schema";
import type { BudgetItemDTO, BudgetOverviewDTO } from "@/types/finance";
import { getUsableCategory } from "./category.service";
import { notify } from "./notification.service";
import { toCategoryDTO, toNumber } from "./mappers";

const notFound = () => Errors.notFound("BUDGET_NOT_FOUND", "Không tìm thấy ngân sách.");

export async function spentByCategory(userId: string, month: string): Promise<Map<number, number>> {
  const { start, end } = monthRange(month);
  const rows = await prisma.transaction.groupBy({
    by: ["category_id"],
    where: { user_id: userId, type: "expense", date: { gte: start, lt: end } },
    _sum: { amount: true },
  });
  return new Map(rows.map((r) => [r.category_id, toNumber(r._sum.amount)]));
}

export async function getBudgetOverview(userId: string, month: string): Promise<BudgetOverviewDTO> {
  const [budgets, spent] = await Promise.all([
    prisma.budget.findMany({
      where: { user_id: userId, month },
      include: { category: true },
      orderBy: { category_id: "asc" },
    }),
    spentByCategory(userId, month),
  ]);

  const items: BudgetItemDTO[] = budgets.map((b) => ({
    id: b.id,
    month: b.month,
    categoryId: b.category_id,
    category: toCategoryDTO(b.category),
    ...computeBudget(toNumber(b.limit_amount), spent.get(b.category_id) ?? 0),
  }));
  items.sort((a, b) => b.percentage - a.percentage);

  return { month, items, totals: summarizeBudgets(items) };
}

export async function upsertBudget(userId: string, input: UpsertBudgetInput) {
  await getUsableCategory(userId, input.category_id, "expense");
  const budget = await prisma.budget.upsert({
    where: { user_id_category_id_month: { user_id: userId, category_id: input.category_id, month: input.month } },
    create: { user_id: userId, category_id: input.category_id, month: input.month, limit_amount: input.limit_amount },
    update: { limit_amount: input.limit_amount },
  });
  await evaluateBudgetAlerts(userId, input.month, input.category_id);
  return budget;
}

export async function updateBudgetLimit(userId: string, id: number, limit: number) {
  const existing = await prisma.budget.findFirst({ where: { id, user_id: userId } });
  if (!existing) throw notFound();
  const updated = await prisma.budget.update({ where: { id }, data: { limit_amount: limit } });
  await evaluateBudgetAlerts(userId, existing.month, existing.category_id);
  return updated;
}

export async function deleteBudget(userId: string, id: number) {
  const result = await prisma.budget.deleteMany({ where: { id, user_id: userId } });
  if (result.count === 0) throw notFound();
}

/** Sao chép ngân sách của tháng trước sang tháng mới (bỏ qua danh mục đã có). */
export async function copyBudgets(userId: string, fromMonth: string, toMonth: string): Promise<number> {
  const source = await prisma.budget.findMany({ where: { user_id: userId, month: fromMonth } });
  const result = await prisma.budget.createMany({
    data: source.map((b) => ({
      user_id: userId,
      category_id: b.category_id,
      month: toMonth,
      limit_amount: b.limit_amount,
    })),
    skipDuplicates: true,
  });
  return result.count;
}

/**
 * Gửi thông báo khi chi tiêu chạm 80% hoặc vượt ngân sách. dedupeKey theo tháng + danh mục + mức,
 * nên mỗi mức chỉ báo một lần mỗi tháng.
 */
export async function evaluateBudgetAlerts(userId: string, month: string, categoryId: number) {
  const budget = await prisma.budget.findUnique({
    where: { user_id_category_id_month: { user_id: userId, category_id: categoryId, month } },
    include: { category: true },
  });
  if (!budget) return;

  const spent = (await spentByCategory(userId, month)).get(categoryId) ?? 0;
  const result = computeBudget(toNumber(budget.limit_amount), spent);
  if (result.status === "normal") return;

  const name = budget.category.name;
  const exceeded = result.status === "exceeded";
  await notify(userId, {
    kind: exceeded ? "budget_exceeded" : "budget_warning",
    type: exceeded ? "alert" : "warning",
    title: exceeded ? `Vượt ngân sách ${name}` : `Sắp chạm ngân sách ${name}`,
    message: exceeded
      ? `Bạn đã chi ${formatVND(spent)} cho ${name} trong ${monthLabel(month).toLowerCase()}, vượt ${formatVND(result.overBy)} so với ngân sách.`
      : `Bạn đã sử dụng ${result.percentage}% ngân sách ${name} (${formatVND(spent)} / ${formatVND(result.limit)}).`,
    link: `/budgets?month=${month}`,
    dedupeKey: `budget:${month}:${categoryId}:${result.status}`,
  });
}
