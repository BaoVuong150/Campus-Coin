"use client";

import { useCallback, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Bell } from "lucide-react";
import { Button } from "@/components/ui/button";
import { NotificationIcon } from "@/components/notifications/notification-icon";
import { useDismiss } from "@/hooks/use-dismiss";
import { useNotificationMutations, useNotifications } from "@/hooks/use-notifications";
import { renderNotification } from "@/i18n/format";
import { useI18n } from "@/i18n/provider";
import { cn } from "@/lib/utils/cn";

const PREVIEW_COUNT = 5;

export function NotificationBell() {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const { t, fmt } = useI18n();
  const { data } = useNotifications(1, PREVIEW_COUNT);
  const { markRead, markAllRead } = useNotificationMutations();
  const close = useCallback(() => setOpen(false), []);
  useDismiss(ref, open, close);
  const unread = data?.unread ?? 0;

  return (
    <div ref={ref} className="relative">
      <Button
        variant="ghost"
        size="icon"
        aria-label={unread ? t.header.notificationsUnread(unread) : t.header.notifications}
        aria-expanded={open}
        aria-haspopup="true"
        onClick={() => setOpen((v) => !v)}
        className="relative"
      >
        <Bell />
        {unread > 0 && (
          <span className="tabular absolute top-1 right-1 flex min-w-4 items-center justify-center rounded-full bg-danger px-1 text-[10px] leading-4 font-semibold text-danger-foreground">
            {unread > 9 ? "9+" : unread}
          </span>
        )}
      </Button>

      {/* Mobile: neo theo viewport (chuông không nằm sát mép phải nên neo theo nút sẽ tràn ra mép trái). */}
      {open && (
        <div className="fixed inset-x-(--app-gutter) top-[calc(var(--app-header-height)_+_env(safe-area-inset-top)_+_8px)] z-40 animate-scale-in overflow-hidden rounded-lg border border-border bg-surface shadow-pop sm:absolute sm:inset-x-auto sm:top-full sm:right-0 sm:mt-2 sm:w-[22rem]">
          <div className="flex items-center justify-between border-b border-border px-4 py-3">
            <p className="text-sm font-semibold text-foreground">{t.header.notifications}</p>
            {unread > 0 && (
              <button type="button" onClick={() => void markAllRead()} className="text-[12px] font-medium text-primary-ink hover:underline">
                {t.header.markAllRead}
              </button>
            )}
          </div>
          <ul className="max-h-96 divide-y divide-border overflow-y-auto">
            {(data?.items ?? []).length === 0 && <li className="px-4 py-8 text-center text-[13px] text-muted">{t.header.noNotifications}</li>}
            {data?.items.map((n) => {
              const view = renderNotification(t, n);
              return (
                <li key={n.id}>
                  <button
                    type="button"
                    onClick={() => {
                      if (!n.isRead) void markRead([n.id]);
                      setOpen(false);
                      if (n.link) router.push(n.link);
                    }}
                    className={cn("flex w-full gap-3 px-4 py-3 text-left transition-colors hover:bg-surface-hover", !n.isRead && "bg-primary-soft/40")}
                  >
                    <NotificationIcon kind={n.kind} type={n.type} />
                    <span className="min-w-0 flex-1">
                      <span className="block text-[13px] font-medium text-foreground">{view.title}</span>
                      <span className="mt-0.5 line-clamp-2 block text-[12px] text-muted">{view.message}</span>
                      <span className="mt-1 block text-[11px] text-subtle">{fmt.relativeDay(n.createdAt)}</span>
                    </span>
                    {!n.isRead && <span className="mt-1.5 size-2 shrink-0 rounded-full bg-primary-ink" aria-label={t.header.unreadDot} />}
                  </button>
                </li>
              );
            })}
          </ul>
          <Link
            href="/notifications"
            onClick={() => setOpen(false)}
            className="block border-t border-border px-4 py-2.5 text-center text-[13px] font-medium text-primary-ink hover:bg-surface-hover"
          >
            {t.common.viewAll}
          </Link>
        </div>
      )}
    </div>
  );
}
