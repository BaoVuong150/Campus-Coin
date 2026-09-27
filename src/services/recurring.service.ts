import { Prisma, type Category, type RecurringTransaction } from "@prisma/client";
import { z } from "zod";
import { prisma } from "@/lib/database/prisma";
import { Errors } from "@/lib/api/errors";
import type { RecurringFrequency, RecurringStatus } from "@/constants/finance";
import {
  anchorDayFor,
  collectDueOccurrences,
  monthlyEquivalent,
  nextOccurrence,
  occurrencesRemainingInMonth,
  type Schedule,
} from "@/lib/finance/recurring";
import { dayRange, formatDate, todayYmd, toYmd, ymdToStorageDate } from "@/lib/utils/date";
import { formatVND } from "@/lib/utils/money";
import type { createRecurringSchema, updateRecurringSchema } from "@/lib/validations/recurring.schema";
import type { RecurringDTO, TransactionType } from "@/types/finance";
import { getUsableCategory } from "./category.service";
import { evaluateBudgetAlerts } from "./budget.service";
import { notify } from "./notification.service";
import { asType, toCategoryDTO, toNumber } from "./mappers";

type CreateInput = z.infer<typeof createRecurringSchema>;
type UpdateInput = z.infer<typeof updateRecurringSchema>;

const notFound = () => Errors.notFound("RECURRING_NOT_FOUND", "Không tìm thấy khoản định kỳ.");

function scheduleOf(r: RecurringTransaction): Schedule {
  return {
    frequency: r.frequency as RecurringFrequency,
    anchorDay: r.anchor_day,
    startDate: r.start_date,
    endDate: r.end_date,
  };
}

function toDTO(r: RecurringTransaction & { category: Category }): RecurringDTO {
  const amount = toNumber(r.amount);
  return {
    id: r.id,
    name: r.name,
    amount,
    type: asType(r.type),
    frequency: r.frequency as RecurringFrequency,
    status: r.status as RecurringStatus,
    isFixed: r.is_fixed,
    categoryId: r.category_id,
    category: toCategoryDTO(r.category),
    startDate: r.start_date.toISOString(),
    nextRunDate: r.next_run_date.toISOString(),
    endDate: r.end_date?.toISOString() ?? null,
    monthlyEquivalent: Math.round(monthlyEquivalent(amount, r.frequency as RecurringFrequency)),
  };
}

export async function listRecurring(userId: string): Promise<RecurringDTO[]> {
  const items = await prisma.recurringTransaction.findMany({
    where: { user_id: userId },
    include: { category: true },
    orderBy: [{ status: "asc" }, { next_run_date: "asc" }],
  });
  return items.map(toDTO);
}

export async function createRecurring(userId: string, input: CreateInput): Promise<RecurringDTO> {
  await getUsableCategory(userId, input.category_id, input.type);
  const start = ymdToStorageDate(input.start_date);
  if (input.end_date && input.end_date < input.start_date) {
    throw Errors.badRequest("Ngày kết thúc phải sau ngày bắt đầu.", { end_date: "Ngày kết thúc phải sau ngày bắt đầu." });
  }
  const created = await prisma.recurringTransaction.create({
    data: {
      user_id: userId,
      name: input.name,
      amount: input.amount,
      type: input.type,
      category_id: input.category_id,
      frequency: input.frequency,
      anchor_day: anchorDayFor(input.frequency, start),
      start_date: start,
      next_run_date: start,
      end_date: input.end_date ? ymdToStorageDate(input.end_date) : null,
      is_fixed: input.is_fixed,
    },
    include: { category: true },
  });
  await processDueRecurring(userId);
  const fresh = await prisma.recurringTransaction.findUniqueOrThrow({ where: { id: created.id }, include: { category: true } });
  return toDTO(fresh);
}

export async function updateRecurring(userId: string, id: string, input: UpdateInput): Promise<RecurringDTO> {
  const existing = await prisma.recurringTransaction.findFirst({ where: { id, user_id: userId } });
  if (!existing) throw notFound();

  const type = input.type ?? asType(existing.type);
  if (input.category_id || input.type) await getUsableCategory(userId, input.category_id ?? existing.category_id, type);

  const data: Prisma.RecurringTransactionUpdateInput = {
    name: input.name,
    amount: input.amount,
    type: input.type,
    category: input.category_id ? { connect: { id: input.category_id } } : undefined,
    is_fixed: input.is_fixed,
    status: input.status,
    end_date: input.end_date === undefined ? undefined : input.end_date ? ymdToStorageDate(input.end_date) : null,
  };

  if (input.frequency && input.frequency !== existing.frequency) {
    data.frequency = input.frequency;
    data.anchor_day = anchorDayFor(input.frequency, existing.next_run_date);
  }

  // Tiếp tục một lịch đã tạm dừng: bỏ qua các kỳ đã lỡ trong lúc dừng, chạy lại từ kỳ kế tiếp.
  if (input.status === "active" && existing.status === "paused") {
    const schedule = scheduleOf(existing);
    let cursor = existing.next_run_date;
    while (toYmd(cursor) < todayYmd()) cursor = nextOccurrence(schedule, cursor);
    data.next_run_date = cursor;
  }

  const updated = await prisma.recurringTransaction.update({ where: { id }, data, include: { category: true } });
  return toDTO(updated);
}

export async function deleteRecurring(userId: string, id: string): Promise<void> {
  const result = await prisma.recurringTransaction.deleteMany({ where: { id, user_id: userId } });
  if (result.count === 0) throw notFound();
}

/**
 * Tạo giao dịch cho các kỳ định kỳ đã đến hạn. Idempotent nhờ unique (recurring_id, date):
 * chạy lại nhiều lần hoặc chạy song song cũng không sinh giao dịch trùng.
 */
export async function processDueRecurring(userId?: string, now = new Date()): Promise<number> {
  const due = await prisma.recurringTransaction.findMany({
    where: {
      status: "active",
      next_run_date: { lt: dayRange(todayYmd(now)).end },
      ...(userId ? { user_id: userId } : {}),
    },
  });

  let created = 0;
  for (const rec of due) {
    const { due: dates, nextRunDate, finished } = collectDueOccurrences(scheduleOf(rec), rec.next_run_date, now);
    if (dates.length === 0 && !finished) continue;

    const inserted = await prisma.$transaction(async (tx) => {
      const result = await tx.transaction.createMany({
        data: dates.map((date) => ({
          user_id: rec.user_id,
          category_id: rec.category_id,
          amount: rec.amount,
          type: rec.type,
          description: rec.name,
          date,
          is_recurring: true,
          recurrence_period: rec.frequency,
          recurring_id: rec.id,
        })),
        skipDuplicates: true,
      });
      // Điều kiện next_run_date cũ đảm bảo chỉ một tiến trình được "tiến" lịch.
      await tx.recurringTransaction.updateMany({
        where: { id: rec.id, next_run_date: rec.next_run_date },
        data: { next_run_date: nextRunDate, ...(finished ? { status: "cancelled" } : {}) },
      });
      return result.count;
    });

    created += inserted;
    if (inserted > 0) {
      const last = dates[dates.length - 1];
      await notify(rec.user_id, {
        kind: "recurring",
        type: "info",
        title: rec.type === "income" ? "Đã ghi nhận khoản thu định kỳ" : "Đã ghi nhận khoản chi định kỳ",
        message: `${rec.name}: ${formatVND(toNumber(rec.amount))} (${formatDate(last)}). Kỳ tiếp theo: ${formatDate(nextRunDate)}.`,
        link: "/recurring",
        dedupeKey: `recurring:${rec.id}:${toYmd(last)}`,
      });
      if (rec.type === "expense") {
        const months = new Set(dates.map((d) => toYmd(d).slice(0, 7)));
        for (const month of months) await evaluateBudgetAlerts(rec.user_id, month, rec.category_id);
      }
    }
  }
  return created;
}

export interface UpcomingItem {
  id: string;
  name: string;
  amount: number;
  date: Date;
  type: TransactionType;
  isFixed: boolean;
}

/** Các kỳ định kỳ còn lại trong tháng (sau hôm nay) – đầu vào cho forecast & safe-to-spend. */
export async function upcomingInMonth(userId: string, monthKey: string, now = new Date()): Promise<UpcomingItem[]> {
  const active = await prisma.recurringTransaction.findMany({ where: { user_id: userId, status: "active" } });
  const items: UpcomingItem[] = [];
  for (const rec of active) {
    for (const date of occurrencesRemainingInMonth(scheduleOf(rec), rec.next_run_date, monthKey, now)) {
      items.push({
        id: rec.id,
        name: rec.name,
        amount: toNumber(rec.amount),
        date,
        type: asType(rec.type),
        isFixed: rec.is_fixed,
      });
    }
  }
  return items.sort((a, b) => a.date.getTime() - b.date.getTime());
}
