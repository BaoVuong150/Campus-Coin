"use client";

import { CalendarDays, Lightbulb, PieChart, PiggyBank, ShieldCheck, TrendingDown, TrendingUp, Wallet } from "lucide-react";
import { EmptyState, ErrorState } from "@/components/common/states";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { SkeletonRows } from "@/components/ui/skeleton";
import { useInsights } from "@/hooks/use-dashboard";
import { renderInsight } from "@/i18n/format";
import { useI18n } from "@/i18n/provider";
import { cn } from "@/lib/utils/cn";
import type { FinancialInsight } from "@/types/finance";

const ICONS: Record<FinancialInsight["icon"], typeof Lightbulb> = {
  "trend-up": TrendingUp,
  "trend-down": TrendingDown,
  calendar: CalendarDays,
  shield: ShieldCheck,
  wallet: Wallet,
  pie: PieChart,
  piggy: PiggyBank,
};

const TONES: Record<FinancialInsight["tone"], string> = {
  positive: "bg-success-soft text-success",
  negative: "bg-danger-soft text-danger",
  neutral: "bg-info-soft text-info",
};

export function InsightsCard({ limit = 4 }: { limit?: number }) {
  const { t } = useI18n();
  const { data, error, reload } = useInsights();
  const l = t.dashboard.insights;

  return (
    <Card className="min-w-0">
      <CardHeader title={l.title} description={l.description} />
      <CardContent className="pt-3">
        {error ? (
          <ErrorState onRetry={reload} />
        ) : !data ? (
          <SkeletonRows rows={3} />
        ) : data.length === 0 ? (
          <EmptyState compact icon={<Lightbulb />} title={l.emptyTitle} description={l.emptyBody} />
        ) : (
          <ul className="divide-y divide-border">
            {data.slice(0, limit).map((insight) => {
              const Icon = ICONS[insight.icon];
              const view = renderInsight(t, insight);
              return (
                <li key={insight.id} className="flex gap-3 py-3 first:pt-0 last:pb-0">
                  <span className={cn("flex size-8 shrink-0 items-center justify-center rounded-full", TONES[insight.tone])} aria-hidden>
                    <Icon className="size-4" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-baseline justify-between gap-3">
                      <p className="text-sm font-medium text-foreground">{view.title}</p>
                      <p className="tabular text-[13px] font-medium whitespace-nowrap text-foreground">{view.value}</p>
                    </div>
                    <p className="mt-0.5 text-[13px] text-muted">{view.description}</p>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
