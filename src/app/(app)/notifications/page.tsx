"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { BellOff, CheckCheck } from "lucide-react";
import { EmptyState, ErrorState } from "@/components/common/states";
import { PageHeader } from "@/components/layout/page-header";
import { NotificationIcon } from "@/components/notifications/notification-icon";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Pagination } from "@/components/ui/pagination";
import { Segmented } from "@/components/ui/segmented";
import { SkeletonRows } from "@/components/ui/skeleton";
import { useToast } from "@/context/ToastContext";
import { useNotificationMutations, useNotifications } from "@/hooks/use-notifications";
import { renderNotification } from "@/i18n/format";
import { useI18n } from "@/i18n/provider";
import { formatDateTime } from "@/lib/utils/date";
import { cn } from "@/lib/utils/cn";

const PAGE_SIZE = 20;

export default function NotificationsPage() {
  const router = useRouter();
  const [filter, setFilter] = useState<"all" | "unread">("all");
  const [page, setPage] = useState(1);
  const { data, error, reload } = useNotifications(page, PAGE_SIZE, filter === "unread");
  const { markRead, markAllRead } = useNotificationMutations();
  const { toast } = useToast();
  const { t, fmt } = useI18n();
  const l = t.notifications;

  const handleMarkAll = async () => {
    try {
      await markAllRead();
      toast.success(l.markedAll);
    } catch (e) {
      toast.error(l.failed, fmt.error(e));
    }
  };

  return (
    <div>
      <PageHeader
        title={l.title}
        description={data ? l.unreadCount(data.unread) : l.description}
        actions={
          <>
            <Segmented
              label={l.filter}
              value={filter}
              onChange={(v) => {
                setFilter(v);
                setPage(1);
              }}
              options={[
                { value: "all", label: t.common.all },
                { value: "unread", label: l.unread },
              ]}
              size="md"
            />
            <Button variant="outline" onClick={handleMarkAll} disabled={!data?.unread}>
              <CheckCheck /> {l.markAll}
            </Button>
          </>
        }
      />
      <Card className="overflow-hidden">
        {error ? (
          <ErrorState onRetry={reload} />
        ) : !data ? (
          <div className="px-5">
            <SkeletonRows rows={6} />
          </div>
        ) : data.items.length === 0 ? (
          <EmptyState icon={<BellOff />} title={filter === "unread" ? l.emptyUnread : l.empty} description={l.emptyBody} />
        ) : (
          <ul className="divide-y divide-border">
            {data.items.map((n) => {
              const view = renderNotification(t, n);
              return (
              <li key={n.id}>
                <button
                  type="button"
                  onClick={() => {
                    if (!n.isRead) void markRead([n.id]);
                    if (n.link) router.push(n.link);
                  }}
                  className={cn("flex w-full gap-3 px-5 py-4 text-left transition-colors hover:bg-surface-hover", !n.isRead && "bg-primary-soft/40")}
                >
                  <NotificationIcon kind={n.kind} type={n.type} />
                  <span className="min-w-0 flex-1">
                    <span className="flex flex-wrap items-center gap-x-2">
                      <span className="text-sm font-medium text-foreground">{view.title}</span>
                      <span className="text-[11px] text-subtle">{l.kinds[n.kind]}</span>
                    </span>
                    <span className="mt-0.5 block text-[13px] text-muted">{view.message}</span>
                    <span className="mt-1 block text-[12px] text-subtle">{formatDateTime(n.createdAt)}</span>
                  </span>
                  {!n.isRead && <span className="mt-2 size-2 shrink-0 rounded-full bg-primary-ink" aria-label={t.header.unreadDot} />}
                </button>
              </li>
              );
            })}
          </ul>
        )}
        {data && data.total > PAGE_SIZE && (
          <div className="border-t border-border px-5 py-3">
            <Pagination page={data.page} totalPages={data.totalPages} total={data.total} pageSize={data.pageSize} onPageChange={setPage} />
          </div>
        )}
      </Card>
    </div>
  );
}
