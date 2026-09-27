"use client";

import { AlertTriangle, CalendarClock, CheckCircle2, Gauge } from "lucide-react";
import type { ReactNode } from "react";
import { ErrorState } from "@/components/common/states";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { InfoTip } from "@/components/ui/info-tip";
import { Skeleton } from "@/components/ui/skeleton";
import { usePlanning } from "@/hooks/use-dashboard";
import { formatDate } from "@/lib/utils/date";
import { formatVND } from "@/lib/utils/money";
import { cn } from "@/lib/utils/cn";
import type { PlanningDTO } from "@/types/finance";

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
  const s = p.safeToSpend;
  return (
    <div className="space-y-3">
      <div>
        <p className="text-[13px] text-muted">Bạn có thể chi khoảng</p>
        <p className={cn("tabular text-[32px] leading-tight font-semibold tracking-tight", s.status === "negative" ? "text-danger" : "text-foreground")}>
          {formatVND(s.daily)}
          <span className="text-base font-medium text-muted"> / ngày</span>
        </p>
        <p className="mt-1 text-[13px] text-muted">
          {s.status === "negative"
            ? "Số dư hiện không đủ cho các khoản cố định và khoản tiết kiệm đã đặt."
            : s.limitedBy === "budget" && s.daily === 0
              ? `Bạn đã dùng hết ngân sách các danh mục đã đặt. Số dư vẫn cho phép khoảng ${formatVND(s.dailyByBalance)}/ngày.`
              : `trong ${p.remainingDays} ngày còn lại để duy trì kế hoạch hiện tại.`}
        </p>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        {s.status === "healthy" && (
          <Badge tone="success">
            <CheckCircle2 /> Ổn định
          </Badge>
        )}
        {s.status === "tight" && (
          <Badge tone="warning">
            <AlertTriangle /> Eo hẹp
          </Badge>
        )}
        {s.status === "negative" && (
          <Badge tone="danger">
            <AlertTriangle /> Thiếu hụt
          </Badge>
        )}
        {s.limitedBy === "budget" && <Badge tone="neutral">Giới hạn bởi ngân sách</Badge>}
      </div>
    </div>
  );
}

function SafeToSpendExplain({ p }: { p: PlanningDTO }) {
  const s = p.safeToSpend;
  return (
    <div className="space-y-1">
      <p className="mb-2 font-medium text-foreground">Cách tính</p>
      <Line label="Số dư hiện tại" value={p.currentBalance} />
      <Line label="Thu nhập định kỳ sắp nhận" value={p.expectedIncome} sign="+" />
      <Line label="Chi phí cố định còn lại" value={p.remainingFixedExpenses} sign="−" />
      <Line label="Tiền đang để dành cho mục tiêu" value={p.goalReserved} sign="−" />
      <Line label="Tiết kiệm tháng cần giữ" value={p.savingsTarget} sign="−" />
      <Line label="Có thể chi" value={s.spendable} strong />
      <p className="pt-2">
        Chia cho {p.remainingDays} ngày còn lại ≈ {formatVND(s.dailyByBalance)}/ngày.
        {s.dailyByBudget !== null && ` Ngân sách còn ${formatVND(p.budgetRemaining ?? 0)} ≈ ${formatVND(s.dailyByBudget)}/ngày.`} Lấy mức thấp hơn.
      </p>
    </div>
  );
}

function ForecastBody({ p }: { p: PlanningDTO }) {
  const f = p.forecast;
  return (
    <div>
      <Line label="Số dư hiện tại" value={p.currentBalance} />
      {p.expectedIncome > 0 && <Line label="Thu nhập định kỳ sắp nhận" value={p.expectedIncome} sign="+" />}
      <Line label="Chi phí cố định còn lại" value={p.remainingFixedExpenses} sign="−" />
      <Line label="Chi tiêu dự kiến" value={f.projectedVariableSpend} sign="−" />
      <div className="flex items-center justify-between gap-3 border-t border-border pt-2.5 text-sm">
        <span className="font-semibold text-foreground">Dự kiến cuối tháng</span>
        <span className={cn("tabular text-lg font-semibold", f.projectedEndBalance < 0 ? "text-danger" : "text-foreground")}>
          {f.projectedEndBalance < 0 ? "− " : ""}
          {formatVND(Math.abs(f.projectedEndBalance))}
        </span>
      </div>
      {f.shortfall > 0 ? (
        <p className="mt-3 flex items-start gap-2 rounded-md bg-danger-soft px-3 py-2 text-[13px] text-danger">
          <AlertTriangle className="mt-0.5 size-4 shrink-0" aria-hidden />
          Với tốc độ chi tiêu hiện tại, bạn có thể thiếu khoảng {formatVND(f.shortfall)}.
        </p>
      ) : (
        <p className="mt-3 text-[12px] text-muted">
          Dựa trên tốc độ chi {formatVND(f.dailyPace)}/ngày
          {f.paceSource === "history" ? " (trung bình 3 tháng trước, vì tháng này mới bắt đầu)" : " của tháng này"}.
        </p>
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
  const { data, error, reload } = usePlanning();
  const upcoming = data?.upcomingFixed.filter((u) => u.type === "expense").slice(0, 3) ?? [];

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <PlanningCard
        title="Số tiền có thể chi"
        icon={<Gauge />}
        action={
          data && (
            <InfoTip label="Cách tính">
              <SafeToSpendExplain p={data} />
            </InfoTip>
          )
        }
      >
        {error ? <ErrorState onRetry={reload} /> : !data ? <LoadingBody /> : <SafeToSpendBody p={data} />}
        {data && upcoming.length > 0 && (
          <div className="mt-4 border-t border-border pt-3">
            <p className="mb-1.5 text-[12px] font-medium text-subtle">Sắp đến hạn</p>
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
      <PlanningCard title="Dự kiến cuối tháng" icon={<CalendarClock />}>
        {error ? <ErrorState onRetry={reload} /> : !data ? <LoadingBody /> : <ForecastBody p={data} />}
      </PlanningCard>
    </div>
  );
}
