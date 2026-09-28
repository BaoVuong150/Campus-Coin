import { createHash } from "node:crypto";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/database/prisma";
import type { NotificationKind } from "@/constants/finance";
import type { NotificationPreferences } from "@/lib/validations/profile.schema";
import type { NotificationDTO, Paginated } from "@/types/finance";
import { vi } from "@/i18n/messages/vi";
import type { NotificationParams, NotificationTemplate } from "@/i18n/templates";
import { toNotificationDTO } from "./mappers";

export type NotifyInput = {
  [K in NotificationTemplate]: {
    kind: NotificationKind;
    type: NotificationDTO["type"];
    template: K;
    params: NotificationParams[K];
    link?: string;
    /** Cùng dedupeKey chỉ tạo một lần cho mỗi user (chống spam). */
    dedupeKey?: string;
  };
}[NotificationTemplate];

/** Bản tiếng Việt lưu kèm làm dự phòng (xem DB, dữ liệu cũ); giao diện dựng lại theo ngôn ngữ từ template + params. */
function renderFallback(input: NotifyInput) {
  const entry = vi.notifications.templates[input.template] as {
    title: (p: NotifyInput["params"]) => string;
    message: (p: NotifyInput["params"]) => string;
  };
  return { title: entry.title(input.params), message: entry.message(input.params) };
}

const KIND_TO_PREFERENCE: Partial<Record<NotificationKind, keyof NotificationPreferences>> = {
  budget_warning: "budget",
  budget_exceeded: "budget",
  recurring: "recurring",
  goal: "goal",
  unusual: "unusual",
};

export function readNotificationPreferences(preferences: Prisma.JsonValue | null): NotificationPreferences {
  const raw =
    preferences && typeof preferences === "object" && !Array.isArray(preferences)
      ? (preferences as Record<string, unknown>).notifications
      : undefined;
  const value = raw && typeof raw === "object" ? (raw as Record<string, unknown>) : {};
  return {
    budget: value.budget !== false,
    recurring: value.recurring !== false,
    goal: value.goal !== false,
    unusual: value.unusual !== false,
  };
}

export async function notify(userId: string, input: NotifyInput): Promise<void> {
  const prefKey = KIND_TO_PREFERENCE[input.kind];
  if (prefKey) {
    const user = await prisma.user.findUnique({ where: { id: userId }, select: { preferences: true } });
    if (!readNotificationPreferences(user?.preferences ?? null)[prefKey]) return;
  }

  // skipDuplicates dựa trên unique (user_id, dedupe_key): sự kiện đã báo thì bỏ qua, không ném lỗi.
  await prisma.notification.createMany({
    data: [
      {
        user_id: userId,
        kind: input.kind,
        type: input.type,
        ...renderFallback(input),
        template: input.template,
        params: input.params as unknown as Prisma.InputJsonObject,
        link: input.link ?? null,
        dedupe_key: input.dedupeKey ?? null,
      },
    ],
    skipDuplicates: true,
  });
}

export async function listNotifications(
  userId: string,
  page: number,
  pageSize: number,
  unreadOnly: boolean
): Promise<Paginated<NotificationDTO> & { unread: number }> {
  const where: Prisma.NotificationWhereInput = { user_id: userId, ...(unreadOnly ? { is_read: false } : {}) };
  const [items, total, unread] = await prisma.$transaction([
    prisma.notification.findMany({
      where,
      orderBy: { created_at: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    prisma.notification.count({ where }),
    prisma.notification.count({ where: { user_id: userId, is_read: false } }),
  ]);
  return {
    items: items.map(toNotificationDTO),
    page,
    pageSize,
    total,
    totalPages: Math.max(1, Math.ceil(total / pageSize)),
    unread,
  };
}

/** updateMany với điều kiện user_id: không thể đánh dấu thông báo của người khác. */
export async function markRead(userId: string, ids: number[]): Promise<number> {
  const result = await prisma.notification.updateMany({
    where: { user_id: userId, id: { in: ids } },
    data: { is_read: true },
  });
  return result.count;
}

export async function markAllRead(userId: string): Promise<number> {
  const result = await prisma.notification.updateMany({
    where: { user_id: userId, is_read: false },
    data: { is_read: true },
  });
  return result.count;
}

/** Cửa sổ chống gửi trùng: cùng tiêu đề + nội dung trong 10 phút chỉ gửi một lần (bấm đúp, gửi lại do mạng chậm). */
const ANNOUNCEMENT_DEDUPE_WINDOW_MS = 10 * 60 * 1000;

export function announcementDedupeKey(title: string, message: string, now = Date.now()): string {
  const digest = createHash("sha256").update(`${title}\u0000${message}`).digest("hex").slice(0, 24);
  return `announcement:${digest}:${Math.floor(now / ANNOUNCEMENT_DEDUPE_WINDOW_MS)}`;
}

export async function broadcast(title: string, message: string, dedupeKey: string): Promise<number> {
  const users = await prisma.user.findMany({
    where: { role: "student", is_active: true },
    select: { id: true },
  });
  const result = await prisma.notification.createMany({
    data: users.map((u) => ({
      user_id: u.id,
      kind: "system",
      type: "info",
      title,
      message,
      dedupe_key: dedupeKey,
    })),
    skipDuplicates: true,
  });
  return result.count;
}
