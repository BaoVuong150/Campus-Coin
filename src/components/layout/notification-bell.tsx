"use client";

import { useCallback, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Bell } from "lucide-react";
import { Button } from "@/components/ui/button";
import { NotificationIcon } from "@/components/notifications/notification-icon";
import { useDismiss } from "@/hooks/use-dismiss";
import { useNotificationMutations, useNotifications } from "@/hooks/use-notifications";
import { relativeDay } from "@/lib/utils/date";
import { cn } from "@/lib/utils/cn";

const PREVIEW_COUNT = 5;

export function NotificationBell() {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const router = useRouter();
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
        aria-label={unread ? `Thông báo, ${unread} chưa đọc` : "Thông báo"}
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

      {open && (
        <div className="absolute top-full right-0 z-40 mt-2 w-[min(22rem,calc(100vw-2rem))] animate-scale-in overflow-hidden rounded-lg border border-border bg-surface shadow-pop">
          <div className="flex items-center justify-between border-b border-border px-4 py-3">
            <p className="text-sm font-semibold text-foreground">Thông báo</p>
            {unread > 0 && (
              <button type="button" onClick={() => void markAllRead()} className="text-[12px] font-medium text-primary hover:underline">
                Đánh dấu đã đọc tất cả
              </button>
            )}
          </div>
          <ul className="max-h-96 divide-y divide-border overflow-y-auto">
            {(data?.items ?? []).length === 0 && (
              <li className="px-4 py-8 text-center text-[13px] text-muted">Bạn chưa có thông báo nào.</li>
            )}
            {data?.items.map((n) => (
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
                    <span className="block text-[13px] font-medium text-foreground">{n.title}</span>
                    <span className="mt-0.5 line-clamp-2 block text-[12px] text-muted">{n.message}</span>
                    <span className="mt-1 block text-[11px] text-subtle">{relativeDay(n.createdAt)}</span>
                  </span>
                  {!n.isRead && <span className="mt-1.5 size-2 shrink-0 rounded-full bg-primary" aria-label="Chưa đọc" />}
                </button>
              </li>
            ))}
          </ul>
          <Link
            href="/notifications"
            onClick={() => setOpen(false)}
            className="block border-t border-border px-4 py-2.5 text-center text-[13px] font-medium text-primary hover:bg-surface-hover"
          >
            Xem tất cả
          </Link>
        </div>
      )}
    </div>
  );
}
