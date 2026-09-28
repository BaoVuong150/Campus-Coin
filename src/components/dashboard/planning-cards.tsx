"use client";

import { AlertTriangle, CalendarClock, CheckCircle2, Gauge } from "lucide-react";
import type { ReactNode } from "react";
import { ErrorState } from "@/components/common/states";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { InfoTip } from "@/components/ui/info-tip";
import { Skeleton } from "@/components/ui/skeleton";
import { usePlanning } from "@/hooks/use-dashboard";
import { useI18n } from "@/i18n/provider";
import { formatDate } from "@/lib/utils/date";
import { formatVND } from "@/lib/utils/money";
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

function SafeToSpendBody({ p }: { p: PlanningDTO }) {
  const { t } = useI18n();
  const l = t.dashboard.planning;
  const s = p.safeToSpend;
  const note =
    s.status === "negative"
      ? l.negative
      : s.limitedBy === "budget" && s.daily === 0
        ? l.budgetUsedUp(formatVND(s.dailyByBalance))
        : l.remaining(p.remainingDays);

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

function ForecastBody({ p }: { p: PlanningDTO }) {
  const { t } = useI18n();
  const l = t.dashboard.planning;
  const f = p.forecast;
  return (
    <div>
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

  return (
    <div className="grid gap-4 lg:grid-cols-2">
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
        {error ? <ErrorState onRetry={reload} /> : !data ? <LoadingBody /> : <SafeToSpendBody p={data} />}
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
  );
}
