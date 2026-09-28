import type { Prisma, Transaction } from "@prisma/client";
import { prisma } from "@/lib/database/prisma";
import { Errors } from "@/lib/api/errors";
import { detectAnomaly } from "@/lib/finance/anomaly";
import { dayRange, toMonthKey, ymdToStorageDate } from "@/lib/utils/date";
import type {
  CreateTransactionInput,
  TransactionQuery,
  UpdateTransactionInput,
} from "@/lib/validations/transaction.schema";
import type { Paginated, TransactionDTO, TransactionWarnings } from "@/types/finance";
import { getUsableCategory, rememberCategoryChoice } from "./category.service";
import { evaluateBudgetAlerts } from "./budget.service";
import { notify } from "./notification.service";
import { onTransactionLogged } from "./points.service";
import { toNumber, toTransactionDTO } from "./mappers";

const notFound = () => Errors.notFound("TRANSACTION_NOT_FOUND", "Không tìm thấy giao dịch.");

/** Số giao dịch chi gần nhất dùng làm mẫu so sánh cho phát hiện bất thường. */
const ANOMALY_HISTORY_SIZE = 200;

function snapshot(t: Transaction): Prisma.InputJsonValue {
  return {
    amount: toNumber(t.amount),
    type: t.type,
    description: t.description,
    category_id: t.category_id,
    date: t.date.toISOString(),
    recurring_id: t.recurring_id,
  };
}

async function audit(tx: Prisma.TransactionClient, t: Transaction, action: "create" | "update" | "delete") {
  await tx.transactionAudit.create({
    data: { transaction_id: t.id, user_id: t.user_id, action, snapshot: snapshot(t) },
  });
}

function buildWhere(userId: string, q: TransactionQuery): Prisma.TransactionWhereInput {
  const where: Prisma.TransactionWhereInput = { user_id: userId };
  if (q.type !== "all") where.type = q.type;
  if (q.category_id) where.category_id = q.category_id;
  if (q.from || q.to) {
    where.date = {
      ...(q.from ? { gte: dayRange(q.from).start } : {}),
      ...(q.to ? { lt: dayRange(q.to).end } : {}),
    };
  }
  if (q.min !== undefined || q.max !== undefined) {
    where.amount = {
      ...(q.min !== undefined ? { gte: q.min } : {}),
      ...(q.max !== undefined ? { lte: q.max } : {}),
    };
  }
  if (q.q) {
    where.OR = [
      { description: { contains: q.q, mode: "insensitive" } },
      { category: { name: { contains: q.q, mode: "insensitive" } } },
    ];
  }
  return where;
}

const ORDER: Record<TransactionQuery["sort"], Prisma.TransactionOrderByWithRelationInput[]> = {
  date_desc: [{ date: "desc" }, { created_at: "desc" }],
  date_asc: [{ date: "asc" }, { created_at: "asc" }],
  amount_desc: [{ amount: "desc" }, { date: "desc" }],
  amount_asc: [{ amount: "asc" }, { date: "desc" }],
};

export async function listTransactions(
  userId: string,
  query: TransactionQuery
): Promise<Paginated<TransactionDTO> & { totals: { income: number; expense: number } }> {
  const where = buildWhere(userId, query);
  const [items, total, sums] = await prisma.$transaction([
    prisma.transaction.findMany({
      where,
      include: { category: true },
      orderBy: ORDER[query.sort],
      skip: (query.page - 1) * query.pageSize,
      take: query.pageSize,
    }),
    prisma.transaction.count({ where }),
    prisma.transaction.groupBy({ by: ["type"], where, _sum: { amount: true }, orderBy: { type: "asc" } }),
  ]);
  const totals = { income: 0, expense: 0 };
  for (const s of sums) totals[s.type === "income" ? "income" : "expense"] = toNumber(s._sum?.amount);

  return {
    items: items.map(toTransactionDTO),
    page: query.page,
    pageSize: query.pageSize,
    total,
    totalPages: Math.max(1, Math.ceil(total / query.pageSize)),
    totals,
  };
}

export async function getTransaction(userId: string, id: string): Promise<TransactionDTO> {
  const t = await prisma.transaction.findFirst({ where: { id, user_id: userId }, include: { category: true } });
  if (!t) throw notFound();
  return toTransactionDTO(t);
}


export async function createTransaction(userId: string, input: CreateTransactionInput): Promise<TransactionDTO> {
  await getUsableCategory(userId, input.category_id, input.type);

  const created = await prisma.$transaction(async (tx) => {
    const t = await tx.transaction.create({
      data: {
        user_id: userId,
        amount: input.amount,
        type: input.type,
        description: input.description,
        category_id: input.category_id,
        date: ymdToStorageDate(input.date),
        ai_suggested_category: input.suggested_category_id ?? null,
      },
      include: { category: true },
    });
    await audit(tx, t, "create");
    return t;
  });

  await rememberCategoryChoice(userId, input.description, input.category_id);
  await runPostWriteChecks(userId, created);
  await onTransactionLogged(userId);
  return toTransactionDTO(created);
}

export async function updateTransaction(
  userId: string,
  id: string,
  input: UpdateTransactionInput
): Promise<TransactionDTO> {
  const existing = await prisma.transaction.findFirst({ where: { id, user_id: userId } });
  if (!existing) throw notFound();

  const nextType = input.type ?? (existing.type as "income" | "expense");
  const nextCategoryId = input.category_id ?? existing.category_id;
  if (input.type || input.category_id) await getUsableCategory(userId, nextCategoryId, nextType);

  const updated = await prisma.$transaction(async (tx) => {
    await audit(tx, existing, "update");
    return tx.transaction.update({
      where: { id },
      data: {
        amount: input.amount,
        type: input.type,
        description: input.description,
        category_id: input.category_id,
        date: input.date ? ymdToStorageDate(input.date) : undefined,
      },
      include: { category: true },
    });
  });

  if (input.category_id && input.category_id !== existing.category_id) {
    await rememberCategoryChoice(userId, updated.description, input.category_id);
  }
  await runPostWriteChecks(userId, updated, false);
  return toTransactionDTO(updated);
}

export async function deleteTransaction(userId: string, id: string): Promise<void> {
  const existing = await prisma.transaction.findFirst({ where: { id, user_id: userId } });
  if (!existing) throw notFound();
  await prisma.$transaction(async (tx) => {
    await audit(tx, existing, "delete");
    await tx.transaction.delete({ where: { id } });
  });
}

async function expenseHistory(userId: string, categoryId: number, excludeId?: string) {
  const rows = await prisma.transaction.findMany({
    where: { user_id: userId, type: "expense", ...(excludeId ? { id: { not: excludeId } } : {}) },
    select: { amount: true, category_id: true },
    orderBy: { date: "desc" },
    take: ANOMALY_HISTORY_SIZE,
  });
  const all = rows.map((r) => toNumber(r.amount));
  const category = rows.filter((r) => r.category_id === categoryId).map((r) => toNumber(r.amount));
  return { all, category };
}

/** Kiểm tra trước khi lưu: khoản trùng trong cùng ngày và khoản chi cao bất thường. */
export async function checkTransactionWarnings(
  userId: string,
  input: Pick<CreateTransactionInput, "amount" | "type" | "description" | "category_id" | "date">,
  excludeId?: string
): Promise<TransactionWarnings> {
  const { start, end } = dayRange(input.date);
  const duplicate = await prisma.transaction.findFirst({
    where: {
      user_id: userId,
      type: input.type,
      amount: input.amount,
      description: { equals: input.description.trim(), mode: "insensitive" },
      date: { gte: start, lt: end },
      ...(excludeId ? { id: { not: excludeId } } : {}),
    },
    select: { id: true, date: true },
  });

  let unusual: TransactionWarnings["unusual"] = null;
  if (input.type === "expense") {
    const history = await expenseHistory(userId, input.category_id, excludeId);
    const result = detectAnomaly(input.amount, history.all, history.category);
    if (result.unusual) unusual = { typicalAmount: result.typicalAmount };
  }

  return { duplicate: duplicate ? { id: duplicate.id, date: duplicate.date.toISOString() } : null, unusual };
}

async function runPostWriteChecks(userId: string, t: Transaction & { category: { name: string } }, isNew = true) {
  if (t.type !== "expense") return;
  await evaluateBudgetAlerts(userId, toMonthKey(t.date), t.category_id);

  if (!isNew) return;
  const amount = toNumber(t.amount);
  const history = await expenseHistory(userId, t.category_id, t.id);
  const result = detectAnomaly(amount, history.all, history.category);
  if (result.unusual) {
    await notify(userId, {
      kind: "unusual",
      type: "warning",
      template: "unusualExpense",
      params: {
        description: t.description,
        amount,
        date: t.date.toISOString(),
        category: t.category.name,
        typical: result.typicalAmount,
      },
      link: `/transactions?focus=${t.id}`,
      dedupeKey: `unusual:${t.id}`,
    });
  }
}

/** Đánh dấu các giao dịch bất thường trong danh sách (dùng cho UI). */
export async function flagUnusual(userId: string, items: TransactionDTO[]): Promise<Set<string>> {
  const expenses = items.filter((i) => i.type === "expense");
  if (expenses.length === 0) return new Set();
  const rows = await prisma.transaction.findMany({
    where: { user_id: userId, type: "expense" },
    select: { amount: true, category_id: true },
    orderBy: { date: "desc" },
    take: ANOMALY_HISTORY_SIZE,
  });
  const all = rows.map((r) => toNumber(r.amount));
  const flagged = new Set<string>();
  for (const item of expenses) {
    const cat = rows.filter((r) => r.category_id === item.categoryId).map((r) => toNumber(r.amount));
    if (detectAnomaly(item.amount, all, cat).unusual) flagged.add(item.id);
  }
  return flagged;
}
