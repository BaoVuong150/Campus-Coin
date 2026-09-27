"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { BellOff, CheckCheck } from "lucide-react";
import { EmptyState, ErrorState } from "@/components/common/states";
import { PageHeader } from "@/components/layout/page-header";
import { NOTIFICATION_KIND_LABELS, NotificationIcon } from "@/components/notifications/notification-icon";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Pagination } from "@/components/ui/pagination";
import { Segmented } from "@/components/ui/segmented";
import { SkeletonRows } from "@/components/ui/skeleton";
import { useToast } from "@/context/ToastContext";
import { useNotificationMutations, useNotifications } from "@/hooks/use-notifications";
import { errorMessage } from "@/lib/api-client";
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

  const handleMarkAll = async () => {
    try {
      await markAllRead();
      toast.success("Đã đánh dấu tất cả là đã đọc");
    } catch (e) {
      toast.error("Không thể cập nhật", errorMessage(e));
    }
  };

  return (
    <div>
      <PageHeader
        title="Thông báo"
        description={data ? `${data.unread} thông báo chưa đọc` : "Cảnh báo ngân sách, khoản định kỳ và mục tiêu."}
        actions={
          <>
            <Segmented
              label="Lọc thông báo"
              value={filter}
              onChange={(v) => {
                setFilter(v);
                setPage(1);
              }}
              options={[
                { value: "all", label: "Tất cả" },
                { value: "unread", label: "Chưa đọc" },
              ]}
              size="md"
            />
            <Button variant="outline" onClick={handleMarkAll} disabled={!data?.unread}>
              <CheckCheck /> Đánh dấu đã đọc tất cả
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
          <EmptyState icon={<BellOff />} title={filter === "unread" ? "Không có thông báo chưa đọc" : "Chưa có thông báo"} description="Bạn sẽ nhận thông báo khi chi tiêu gần chạm ngân sách, có khoản định kỳ được ghi hoặc đạt mốc mục tiêu." />
        ) : (
          <ul className="divide-y divide-border">
            {data.items.map((n) => (
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
                      <span className="text-sm font-medium text-foreground">{n.title}</span>
                      <span className="text-[11px] text-subtle">{NOTIFICATION_KIND_LABELS[n.kind]}</span>
                    </span>
                    <span className="mt-0.5 block text-[13px] text-muted">{n.message}</span>
                    <span className="mt-1 block text-[12px] text-subtle">{formatDateTime(n.createdAt)}</span>
                  </span>
                  {!n.isRead && <span className="mt-2 size-2 shrink-0 rounded-full bg-primary" aria-label="Chưa đọc" />}
                </button>
              </li>
            ))}
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
