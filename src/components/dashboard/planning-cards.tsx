"use client";

import { useState, type ReactNode } from "react";
import { AlertTriangle, CalendarClock, CheckCircle2, Gauge, Pencil, Plus, Target } from "lucide-react";
import { useTransactionUI } from "@/components/transactions/transaction-provider";
import { EmptyState, ErrorState } from "@/components/common/states";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Dialog } from "@/components/ui/dialog";
import { Field } from "@/components/ui/field";
import { InfoTip } from "@/components/ui/info-tip";
import { MoneyInput } from "@/components/ui/money-input";
import { Skeleton } from "@/components/ui/skeleton";
import { usePlanning } from "@/hooks/use-dashboard";
import { useProfileMutations } from "@/hooks/use-profile";
import { useToast } from "@/context/ToastContext";
import { useI18n } from "@/i18n/provider";
import { formatDate } from "@/lib/utils/date";
import { formatCurrencyInput, formatVND, parseCurrencyInput } from "@/lib/utils/money";
import { cn } from "@/lib/utils/cn";
import type { PlanningDTO } from "@/types/finance";

const UPCOMING_PREVIEW = 3;

function Line({ label, value, sign, strong }: { label: string; value: number; sign?: "+" | "−"; strong?: boolean }) {
  return (
    <div className={cn("flex items-center justify-between gap-3 py-1.5 text-[13px]", strong && "border-t border-border pt-2.5 font-semibold text-foreground")}>
      <span className={strong ? "" : "text-muted"}>{label}</span>
      <span className="tabular text-foreground">
        {sign && value !== 0 ? `${sign} ` : ""}
        {formatVND(Math.abs(value))}
      </span>
    </div>
  );
}

function LoadingBody() {
  return (
    <div className="space-y-3">
      <Skeleton className="h-9 w-40" />
      <Skeleton className="h-3.5 w-56" />
      <Skeleton className="h-3.5 w-48" />
    </div>
  );
}

function EditMonthlySavingsGoalDialog({
  open,
  onClose,
  currentGoal,
}: {
  open: boolean;
  onClose: () => void;
  currentGoal: number;
}) {
  const { t, fmt } = useI18n();
  const l = t.dashboard.planning;
  const { toast } = useToast();
  const { update } = useProfileMutations();
  // Dialog chỉ được mount khi mở (xem PlanningCards) nên giá trị ban đầu luôn là mục tiêu hiện tại – không cần effect đồng bộ.
  const [value, setValue] = useState(() => formatCurrencyInput(currentGoal));
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const numeric = parseCurrencyInput(value);
      await update({ monthly_savings_goal: numeric });
      toast.success(l.savingsGoalSuccess);
      onClose();
    } catch (err) {
      toast.error(l.savingsGoalFailed, fmt.error(err));
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      title={l.savingsGoalTitle}
      description={l.savingsGoalDesc}
      size="sm"
    >
      <form noValidate onSubmit={handleSubmit} className="space-y-4 pt-1">
        <Field label={l.savingsGoalTitle} hint="VND">
          {(p) => (
            <MoneyInput
              {...p}
              value={value}
              onValueChange={setValue}
              placeholder="0"
              size="xl"
              data-autofocus
            />
          )}
        </Field>
        <div className="flex items-center justify-end gap-2 pt-2">
          <Button type="button" variant="ghost" size="sm" onClick={onClose}>
            {t.common.cancel}
          </Button>
          <Button type="submit" variant="primary" size="sm" loading={saving}>
            {t.common.save}
          </Button>
        </div>
      </form>
    </Dialog>
  );
}

function SafeToSpendBody({ p, onEditGoal }: { p: PlanningDTO; onEditGoal: () => void }) {
  const { t } = useI18n();
  const l = t.dashboard.planning;
  const s = p.safeToSpend;
  const note =
    s.status === "negative"
      ? l.negative
      : s.limitedBy === "budget" && s.daily === 0
        ? l.budgetUsedUp(formatVND(s.dailyByBalance))
        : l.remaining(p.remainingDays);

  const goalAmount = p.monthlySavingsGoal ?? (p.savingsTarget > 0 ? p.savingsTarget : 0);

  return (
    <div className="space-y-3">
      <div>
        <p className="text-[13px] text-muted">{l.canSpend}</p>
        <p className={cn("tabular text-[32px] leading-tight font-semibold tracking-tight", s.status === "negative" ? "text-danger" : "text-foreground")}>
          {formatVND(s.daily)}
          <span className="text-base font-medium text-muted"> {t.common.perDay}</span>
        </p>
        <p className="mt-1 text-[13px] text-muted">{note}</p>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        {s.status === "healthy" && (
          <Badge tone="success">
            <CheckCircle2 /> {l.healthy}
          </Badge>
        )}
        {s.status === "tight" && (
          <Badge tone="warning">
            <AlertTriangle /> {l.tight}
          </Badge>
        )}
        {s.status === "negative" && (
          <Badge tone="danger">
            <AlertTriangle /> {l.shortfall}
          </Badge>
        )}
        {s.limitedBy === "budget" && <Badge tone="neutral">{l.limitedByBudget}</Badge>}
      </div>

      {/* Mục tiêu tiết kiệm tháng (lôi từ Cài đặt ra hiển thị và chỉnh sửa nhanh tại Dashboard) */}
      <div className="flex items-center justify-between gap-3 rounded-lg border border-border/80 bg-surface-secondary/70 p-2.5 text-[13px] transition-colors hover:bg-surface-secondary">
        <div className="flex items-center gap-2.5 min-w-0">
          <span className="flex size-7 shrink-0 items-center justify-center rounded-md bg-primary-soft text-primary-ink" aria-hidden>
            <Target className="size-4" />
          </span>
          <div className="min-w-0">
            <p className="text-[11px] font-medium text-muted uppercase tracking-wider">
              {l.savingsGoalTitle}
            </p>
            <p className="tabular font-semibold text-foreground truncate">
              {goalAmount > 0 ? (
                <>
                  {formatVND(goalAmount)}
                  <span className="ml-1.5 text-[11px] font-normal text-subtle">
                    {p.savingsTarget > 0 ? l.savingsGoalLocked : l.savingsGoalAchieved}
                  </span>
                </>
              ) : (
                <span className="text-subtle font-normal">{l.savingsGoalUnset}</span>
              )}
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={onEditGoal}
          className="flex items-center gap-1 rounded-md px-2 py-1 text-[12px] font-medium text-primary-ink hover:bg-primary-soft cursor-pointer transition-colors shrink-0"
          title={goalAmount > 0 ? l.savingsGoalChange : l.savingsGoalSet}
        >
          <Pencil className="size-3" aria-hidden />
          <span>{goalAmount > 0 ? l.savingsGoalChange : l.savingsGoalSet}</span>
        </button>
      </div>
    </div>
  );
}

function SafeToSpendExplain({ p }: { p: PlanningDTO }) {
  const { t } = useI18n();
  const l = t.dashboard.planning;
  const s = p.safeToSpend;
  return (
    <div className="space-y-1">
      <p className="mb-2 font-medium text-foreground">{l.howCalculated}</p>
      <Line label={l.balance} value={p.currentBalance} />
      <Line label={l.expectedIncome} value={p.expectedIncome} sign="+" />
      <Line label={l.fixedLeft} value={p.remainingFixedExpenses} sign="−" />
      <Line label={l.goalReserved} value={p.goalReserved} sign="−" />
      <Line label={l.savingsTarget} value={p.savingsTarget} sign="−" />
      <Line label={l.spendable} value={s.spendable} strong />
      <p className="pt-2">
        {l.explainDays(p.remainingDays, formatVND(s.dailyByBalance))}
        {s.dailyByBudget !== null && l.explainBudget(formatVND(p.budgetRemaining ?? 0), formatVND(s.dailyByBudget))}
        {l.explainMin}
      </p>
    </div>
  );
}

const CONFIDENCE_TONE = { insufficient: "neutral", low: "warning", medium: "info", high: "success" } as const;

function ForecastBody({ p }: { p: PlanningDTO }) {
  const { t } = useI18n();
  const l = t.dashboard.planning;
  const f = p.forecast;
  // Quá ít dữ liệu: không hiện con số dự báo (tránh độ chính xác giả).
  if (f.confidence === "insufficient") return <p className="text-sm text-muted">{l.forecastEmpty}</p>;
  return (
    <div>
      <div className="mb-2 flex flex-wrap items-center gap-2">
        <Badge tone={CONFIDENCE_TONE[f.confidence]}>{l.confidence[f.confidence]}</Badge>
        <span className="text-[12px] text-subtle">{l.basedOn(f.dataDays)}</span>
      </div>
      <Line label={l.balance} value={p.currentBalance} />
      {p.expectedIncome > 0 && <Line label={l.expectedIncome} value={p.expectedIncome} sign="+" />}
      <Line label={l.fixedLeft} value={p.remainingFixedExpenses} sign="−" />
      <Line label={l.projected} value={f.projectedVariableSpend} sign="−" />
      <div className="flex items-center justify-between gap-3 border-t border-border pt-2.5 text-sm">
        <span className="font-semibold text-foreground">{l.endOfMonth}</span>
        <span className={cn("tabular text-lg font-semibold", f.projectedEndBalance < 0 ? "text-danger" : "text-foreground")}>
          {f.projectedEndBalance < 0 ? "− " : ""}
          {formatVND(Math.abs(f.projectedEndBalance))}
        </span>
      </div>
      {f.shortfall > 0 ? (
        <p className="mt-3 flex items-start gap-2 rounded-md bg-danger-soft px-3 py-2 text-[13px] text-danger">
          <AlertTriangle className="mt-0.5 size-4 shrink-0" aria-hidden />
          {l.shortfallMessage(formatVND(f.shortfall))}
        </p>
      ) : (
        <p className="mt-3 text-[12px] text-muted">{l.pace(formatVND(f.dailyPace), f.paceSource === "history")}</p>
      )}
    </div>
  );
}

function PlanningCard({ title, icon, action, children }: { title: string; icon: ReactNode; action?: ReactNode; children: ReactNode }) {
  return (
    <Card className="min-w-0">
      <CardHeader title={title} icon={icon} action={action} />
      <CardContent>{children}</CardContent>
    </Card>
  );
}

export function PlanningCards() {
  const { t } = useI18n();
  const l = t.dashboard.planning;
  const { data, error, reload } = usePlanning();
  const upcoming = data?.upcomingFixed.filter((u) => u.type === "expense").slice(0, UPCOMING_PREVIEW) ?? [];
  const [goalDialogOpen, setGoalDialogOpen] = useState(false);
  const { openCreate } = useTransactionUI();

  return (
    <>
      {/* Hai thẻ cạnh nhau khi khối đủ rộng (≥ 768px), xếp dọc khi hẹp – kể cả ở cột 4/12 trên desktop lớn. */}
      <div className="@container">
        <div className="grid gap-4 @3xl:grid-cols-2">
          <PlanningCard
            title={l.safeTitle}
            icon={<Gauge />}
            action={
              data && (
                <InfoTip label={l.howCalculated}>
                  <SafeToSpendExplain p={data} />
                </InfoTip>
              )
            }
          >
            {error ? (
              <ErrorState onRetry={reload} />
            ) : !data ? (
              <LoadingBody />
            ) : !data.hasActivity ? (
              <EmptyState
                compact
                icon={<Gauge />}
                title={l.emptyTitle}
                description={l.emptyBody}
                action={
                  <Button size="sm" onClick={() => openCreate()}>
                    <Plus /> {l.addFirst}
                  </Button>
                }
              />
            ) : (
              <SafeToSpendBody p={data} onEditGoal={() => setGoalDialogOpen(true)} />
            )}
            {data && upcoming.length > 0 && (
              <div className="mt-4 border-t border-border pt-3">
                <p className="mb-1.5 text-[12px] font-medium text-subtle">{l.upcoming}</p>
                <ul className="space-y-1">
                  {upcoming.map((u) => (
                    <li key={`${u.id}-${u.date}`} className="flex items-center justify-between text-[13px]">
                      <span className="truncate text-muted">
                        {u.name} · {formatDate(u.date)}
                      </span>
                      <span className="tabular text-foreground">{formatVND(u.amount)}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </PlanningCard>
          <PlanningCard title={l.forecastTitle} icon={<CalendarClock />}>
            {error ? <ErrorState onRetry={reload} /> : !data ? <LoadingBody /> : <ForecastBody p={data} />}
          </PlanningCard>
        </div>
      </div>

      {data && goalDialogOpen && (
        <EditMonthlySavingsGoalDialog
          open
          onClose={() => setGoalDialogOpen(false)}
          currentGoal={data.monthlySavingsGoal ?? data.savingsTarget}
        />
      )}
    </>
  );
}

