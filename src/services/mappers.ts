import type { Category, Notification, Prisma, Transaction } from "@prisma/client";
import type { CategoryDTO, NotificationDTO, TransactionDTO, TransactionType } from "@/types/finance";
import type { NotificationKind } from "@/constants/finance";

export const toNumber = (value: Prisma.Decimal | number | null | undefined): number =>
  value === null || value === undefined ? 0 : Number(value);

export const asType = (value: string): TransactionType => (value === "income" ? "income" : "expense");

export function toCategoryDTO(c: Category): CategoryDTO {
  return {
    id: c.id,
    name: c.name,
    type: asType(c.type),
    icon: c.icon,
    color: c.color,
    isDefault: c.user_id === null,
  };
}

export function toTransactionDTO(t: Transaction & { category: Category }): TransactionDTO {
  return {
    id: t.id,
    amount: toNumber(t.amount),
    type: asType(t.type),
    description: t.description,
    date: t.date.toISOString(),
    categoryId: t.category_id,
    category: toCategoryDTO(t.category),
    suggestedCategoryId: t.ai_suggested_category,
    recurringId: t.recurring_id,
    isRecurring: t.is_recurring || t.recurring_id !== null,
    createdAt: t.created_at.toISOString(),
    updatedAt: t.updated_at.toISOString(),
  };
}

const NOTIFICATION_TYPES = ["info", "warning", "alert", "success"] as const;

export function toNotificationDTO(n: Notification): NotificationDTO {
  return {
    id: n.id,
    title: n.title,
    message: n.message,
    type: (NOTIFICATION_TYPES as readonly string[]).includes(n.type) ? (n.type as NotificationDTO["type"]) : "info",
    kind: n.kind as NotificationKind,
    template: n.template,
    params: n.params && typeof n.params === "object" && !Array.isArray(n.params) ? (n.params as Record<string, unknown>) : null,
    link: n.link,
    isRead: n.is_read,
    createdAt: n.created_at.toISOString(),
  };
}
