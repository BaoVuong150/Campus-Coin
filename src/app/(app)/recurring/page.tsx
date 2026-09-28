"use client";

import { useState } from "react";
import { Pause, Pencil, Play, Plus, Repeat, Trash2, XCircle } from "lucide-react";
import { Amount } from "@/components/common/amount";
import { CategoryIcon } from "@/components/common/category-icon";
import { EmptyState, ErrorState } from "@/components/common/states";
import { PageHeader } from "@/components/layout/page-header";
import { RecurringFormDialog } from "@/components/recurring/recurring-form-dialog";
import { Badge, type BadgeTone } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { SkeletonRows } from "@/components/ui/skeleton";
import type { RecurringStatus } from "@/constants/finance";
import { useI18n } from "@/i18n/provider";
import { useToast } from "@/context/ToastContext";
import { useRecurring, useRecurringMutations } from "@/hooks/use-recurring";
import { formatDate } from "@/lib/utils/date";
import { formatVND } from "@/lib/utils/money";
import type { RecurringDTO } from "@/types/finance";

const STATUS_TONE: Record<RecurringStatus, BadgeTone> = { active: "success", paused: "warning", cancelled: "neutral" };

function RecurringRow({ item, onEdit }: { item: RecurringDTO; onEdit: (item: RecurringDTO) => void }) {
  const { update, remove } = useRecurringMutations();
  const { toast, confirm } = useToast();
  const { t, fmt } = useI18n();
  const l = t.recurring;
  const [busy, setBusy] = useState(false);

  const setStatus = async (status: RecurringStatus) => {
    if (status === "cancelled") {
      const ok = await confirm({
        title: l.cancelTitle,
        message: l.cancelMessage(item.name),
        confirmText: l.cancelConfirm,
        isDestructive: true,
      });
      if (!ok) return;
    }
    setBusy(true);
    try {
      await update(item.id, { status });
      toast.success(l.statusChanged(l.statuses[status]));
    } catch (e) {
      toast.error(l.failed, fmt.error(e));
    } finally {
      setBusy(false);
    }
  };

  const handleDelete = async () => {
    const ok = await confirm({
      title: l.deleteTitle,
      message: l.deleteMessage(item.name),
      confirmText: t.common.delete,
      isDestructive: true,
    });
    if (!ok) return;
    try {
      await remove(item.id);
      toast.success(l.deleted);
    } catch (e) {
      toast.error(l.deleteFailed, fmt.error(e));
    }
  };

  return (
    <li className="flex flex-col gap-3 py-3.5 sm:flex-row sm:items-center">
      <div className="flex min-w-0 flex-1 items-center gap-3">
        <CategoryIcon icon={item.category.icon} color={item.category.color} />
        <div className="min-w-0">
          <p className="flex items-center gap-2 truncate text-sm font-medium text-foreground">
            <span className="truncate">{item.name}</span>
            <Badge tone={STATUS_TONE[item.status]}>{l.statuses[item.status]}</Badge>
          </p>
          <p className="text-[12px] text-muted">
            {l.frequencies[item.frequency]} · {fmt.category(item.category.name)}
            {item.status === "active" && <> · {l.nextRun(formatDate(item.nextRunDate))}</>}
          </p>
        </div>
      </div>
      <div className="flex items-center justify-between gap-2 sm:justify-end">
        <Amount value={item.amount} type={item.type} className="text-sm sm:mr-2" />
        <div className="flex items-center">
          {item.status === "active" && (
            <Button variant="ghost" size="icon-sm" onClick={() => setStatus("paused")} disabled={busy} aria-label={l.actionLabel(l.pause, item.name)} title={l.pause}>
              <Pause />
            </Button>
          )}
          {item.status !== "active" && (
            <Button variant="ghost" size="icon-sm" onClick={() => setStatus("active")} disabled={busy} aria-label={l.actionLabel(l.resume, item.name)} title={l.resume}>
              <Play />
            </Button>
          )}
          {item.status !== "cancelled" && (
            <Button variant="ghost" size="icon-sm" onClick={() => setStatus("cancelled")} disabled={busy} aria-label={l.actionLabel(l.cancel, item.name)} title={l.cancel}>
              <XCircle />
            </Button>
          )}
          <Button variant="ghost" size="icon-sm" onClick={() => onEdit(item)} aria-label={l.actionLabel(t.common.edit, item.name)} title={t.common.edit}>
            <Pencil />
          </Button>
          <Button variant="ghost" size="icon-sm" onClick={handleDelete} aria-label={l.actionLabel(t.common.delete, item.name)} title={t.common.delete}>
            <Trash2 />
          </Button>
        </div>
      </div>
    </li>
  );
}

export default function RecurringPage() {
  const { t } = useI18n();
  const l = t.recurring;
  const { data, error, reload } = useRecurring();
  const [dialog, setDialog] = useState<{ item: RecurringDTO | null } | null>(null);

  const fixed = (data ?? []).filter((r) => r.type === "expense" && r.isFixed);
  const others = (data ?? []).filter((r) => !(r.type === "expense" && r.isFixed));
  const fixedMonthly = fixed.filter((r) => r.status === "active").reduce((a, r) => a + r.monthlyEquivalent, 0);
  const incomeMonthly = (data ?? []).filter((r) => r.type === "income" && r.status === "active").reduce((a, r) => a + r.monthlyEquivalent, 0);

  const section = (title: string, description: string, items: RecurringDTO[]) => (
    <Card>
      <CardHeader title={title} description={description} />
      <CardContent className="pt-1">
        <ul className="divide-y divide-border">
          {items.map((item) => (
            <RecurringRow key={item.id} item={item} onEdit={(i) => setDialog({ item: i })} />
          ))}
        </ul>
      </CardContent>
    </Card>
  );

  return (
    <div>
      <PageHeader
        title={l.title}
        description={l.description}
        actions={
          <Button onClick={() => setDialog({ item: null })}>
            <Plus /> {l.new}
          </Button>
        }
      />

      {error ? (
        <Card>
          <ErrorState onRetry={reload} />
        </Card>
      ) : !data ? (
        <Card className="px-5">
          <SkeletonRows rows={4} />
        </Card>
      ) : data.length === 0 ? (
        <Card>
          <EmptyState
            icon={<Repeat />}
            title={l.emptyTitle}
            description={l.emptyBody}
            action={
              <Button size="sm" onClick={() => setDialog({ item: null })}>
                <Plus /> {l.add}
              </Button>
            }
          />
        </Card>
      ) : (
        <div className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <Card className="p-5">
              <p className="text-[13px] text-muted">{l.fixedMonthly}</p>
              <p className="tabular mt-1 text-2xl font-semibold tracking-tight text-foreground">{formatVND(fixedMonthly)}</p>
            </Card>
            <Card className="p-5">
              <p className="text-[13px] text-muted">{l.incomeMonthly}</p>
              <p className="tabular mt-1 text-2xl font-semibold tracking-tight text-foreground">{formatVND(incomeMonthly)}</p>
            </Card>
          </div>
          {fixed.length > 0 && section(l.fixedSection, l.fixedSectionHint, fixed)}
          {others.length > 0 && section(l.otherSection, l.otherSectionHint, others)}
        </div>
      )}

      {dialog && <RecurringFormDialog item={dialog.item} onClose={() => setDialog(null)} />}
    </div>
  );
}
