import { Prisma, type Category, type RecurringTransaction } from "@prisma/client";
import { z } from "zod";
import { prisma } from "@/lib/database/prisma";
import { Errors } from "@/lib/api/errors";
import type { RecurringFrequency, RecurringStatus } from "@/constants/finance";
import {
  anchorDayFor,
  collectDueOccurrences,
  firstOccurrenceFrom,
  monthlyEquivalent,
  occurrencesRemainingInMonth,
  type Schedule,
} from "@/lib/finance/recurring";
import { currentMonthKey, dayRange, todayYmd, toYmd, ymdToStorageDate } from "@/lib/utils/date";
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
  const anchorDay = anchorDayFor(input.frequency, start);
  // Ngày bắt đầu trong quá khứ: chỉ ghi bù các kỳ của tháng hiện tại, không sinh hàng loạt giao dịch
  // cho nhiều năm trước (scheduler sẽ tiếp tục bù 24 kỳ mỗi lần chạy nếu để next_run_date = start).
  const catchUpFrom = `${currentMonthKey()}-01`;
  const firstRun =
    input.start_date < catchUpFrom
      ? firstOccurrenceFrom({ frequency: input.frequency, anchorDay, startDate: start }, start, catchUpFrom)
      : start;
  const created = await prisma.recurringTransaction.create({
    data: {
      user_id: userId,
      name: input.name,
      amount: input.amount,
      type: input.type,
      category_id: input.category_id,
      frequency: input.frequency,
      anchor_day: anchorDay,
      start_date: start,
      next_run_date: firstRun,
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

  const endDate = input.end_date === undefined ? existing.end_date : input.end_date ? ymdToStorageDate(input.end_date) : null;
  if (endDate && toYmd(endDate) < toYmd(existing.start_date)) {
    throw Errors.badRequest("Ngày kết thúc phải sau ngày bắt đầu.", { end_date: "Ngày kết thúc phải sau ngày bắt đầu." });
  }

  const data: Prisma.RecurringTransactionUpdateInput = {
    name: input.name,
    amount: input.amount,
    type: input.type,
    category: input.category_id ? { connect: { id: input.category_id } } : undefined,
    is_fixed: input.is_fixed,
    status: input.status,
    end_date: input.end_date === undefined ? undefined : endDate,
  };

  if (input.frequency && input.frequency !== existing.frequency) {
    data.frequency = input.frequency;
    data.anchor_day = anchorDayFor(input.frequency, existing.next_run_date);
  }

  // Kích hoạt lại một lịch đã tạm dừng hoặc đã hủy: bỏ qua các kỳ đã lỡ, chạy lại từ kỳ kế tiếp
  // (không "bù" hàng loạt giao dịch cho khoảng thời gian lịch không chạy).
  if (input.status === "active" && existing.status !== "active") {
    const schedule: Schedule = {
      ...scheduleOf(existing),
      frequency: (input.frequency ?? existing.frequency) as RecurringFrequency,
      anchorDay: (data.anchor_day as number | undefined) ?? existing.anchor_day,
    };
    data.next_run_date = firstOccurrenceFrom(schedule, existing.next_run_date, todayYmd());
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
      // Cron chạy cho mọi user: bỏ qua tài khoản đã bị vô hiệu hóa.
      user: { is_active: true },
      ...(userId ? { user_id: userId } : {}),
    },
  });

  let created = 0;
  for (const rec of due) {
    const { due: dates, nextRunDate, finished } = collectDueOccurrences(scheduleOf(rec), rec.next_run_date, now);
    if (dates.length === 0 && !finished) continue;

    const inserted = await prisma.$transaction(async (tx) => {
      // "Giành quyền" xử lý kỳ này trước: chỉ tiến trình cập nhật được next_run_date cũ (và lịch vẫn đang
      // chạy) mới được sinh giao dịch. Tiến trình song song hoặc lịch vừa bị tạm dừng/hủy sẽ bỏ qua.
      const claim = await tx.recurringTransaction.updateMany({
        where: { id: rec.id, status: "active", next_run_date: rec.next_run_date },
        data: { next_run_date: nextRunDate, ...(finished ? { status: "cancelled" } : {}) },
      });
      if (claim.count === 0 || dates.length === 0) return 0;

      // Unique (recurring_id, date) + skipDuplicates là lớp bảo vệ thứ hai.
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
      return result.count;
    });

    created += inserted;
    if (inserted > 0) {
      const last = dates[dates.length - 1];
      await notify(rec.user_id, {
        kind: "recurring",
        type: "info",
        template: rec.type === "income" ? "recurringIncome" : "recurringExpense",
        params: { name: rec.name, amount: toNumber(rec.amount), date: last.toISOString(), next: nextRunDate.toISOString() },
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
