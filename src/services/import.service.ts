import { randomUUID } from "node:crypto";
import { prisma } from "@/lib/database/prisma";
import { Errors } from "@/lib/api/errors";
import { normalizeText } from "@/lib/finance/categorize";
import { dayRange, toYmd, ymdToStorageDate } from "@/lib/utils/date";
import type { ImportTransactionsInput } from "@/lib/validations/import.schema";
import { usableCategoryWhere } from "./category.service";
import { evaluateBudgetAlerts } from "./budget.service";
import { onTransactionLogged } from "./points.service";
import { toNumber } from "./mappers";

export interface ImportResult {
  imported: number;
  skipped: number;
}

/** Khóa so trùng: cùng ngày, loại, số tiền và mô tả (không phân biệt hoa thường/dấu). */
const duplicateKey = (ymd: string, type: string, amount: number, description: string) =>
  `${ymd}|${type}|${Math.round(amount * 100)}|${normalizeText(description)}`;

/**
 * Nhập hàng loạt giao dịch đã được người dùng xem trước. Kiểm tra quyền dùng danh mục cho từng dòng,
 * bỏ qua dòng trùng với dữ liệu đã có (hoặc trùng nhau trong file), ghi audit và cảnh báo ngân sách.
 */
export async function importTransactions(userId: string, input: ImportTransactionsInput): Promise<ImportResult> {
  const categories = await prisma.category.findMany({ where: usableCategoryWhere(userId), select: { id: true, type: true } });
  const categoryType = new Map(categories.map((c) => [c.id, c.type]));
  input.rows.forEach((row, index) => {
    const type = categoryType.get(row.category_id);
    if (!type) throw Errors.notFound("CATEGORY_NOT_FOUND", `Dòng ${index + 1}: không tìm thấy danh mục.`);
    if (type !== row.type) throw Errors.badRequest(`Dòng ${index + 1}: danh mục không khớp loại thu/chi.`);
  });

  const dates = input.rows.map((r) => r.date).sort();
  const existing = input.skip_duplicates
    ? await prisma.transaction.findMany({
        where: { user_id: userId, date: { gte: dayRange(dates[0]).start, lt: dayRange(dates[dates.length - 1]).end } },
        select: { date: true, type: true, amount: true, description: true },
      })
    : [];
  const seen = new Set(existing.map((t) => duplicateKey(toYmd(t.date), t.type, toNumber(t.amount), t.description)));

  const rows = input.rows.filter((row) => {
    if (!input.skip_duplicates) return true;
    const key = duplicateKey(row.date, row.type, row.amount, row.description);
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });

  const data = rows.map((row) => ({
    id: randomUUID(),
    user_id: userId,
    amount: row.amount,
    type: row.type,
    description: row.description,
    category_id: row.category_id,
    date: ymdToStorageDate(row.date),
  }));

  await prisma.$transaction([
    prisma.transaction.createMany({ data }),
    prisma.transactionAudit.createMany({
      data: data.map((t) => ({
        transaction_id: t.id,
        user_id: userId,
        action: "create",
        snapshot: { amount: t.amount, type: t.type, description: t.description, category_id: t.category_id, date: t.date.toISOString(), source: "csv" },
      })),
    }),
  ]);

  const budgetKeys = new Set(data.filter((t) => t.type === "expense").map((t) => `${toYmd(t.date).slice(0, 7)}|${t.category_id}`));
  for (const key of budgetKeys) {
    const [month, categoryId] = key.split("|");
    await evaluateBudgetAlerts(userId, month, Number(categoryId));
  }
  if (data.length > 0) await onTransactionLogged(userId);

  return { imported: data.length, skipped: input.rows.length - data.length };
}
