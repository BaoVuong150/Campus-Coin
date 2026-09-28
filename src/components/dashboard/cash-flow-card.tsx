"use client";

import { useState } from "react";
import { BarChart3 } from "lucide-react";
import { CashFlowBars } from "@/components/charts/cash-flow-bars";
import { EmptyState, ErrorState } from "@/components/common/states";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Segmented } from "@/components/ui/segmented";
import { SkeletonChart } from "@/components/ui/skeleton";
import { useCashFlow } from "@/hooks/use-dashboard";
import type { CashFlowPreset } from "@/lib/utils/date";
import { formatVND } from "@/lib/utils/money";
import { useI18n } from "@/i18n/provider";

const RANGES: CashFlowPreset[] = ["7d", "30d", "3m", "6m", "12m"];

export function CashFlowCard() {
  const { t } = useI18n();
  const l = t.dashboard.cashFlow;
  const [range, setRange] = useState<CashFlowPreset>("6m");
  const { data, error, reload } = useCashFlow(range);
  const income = data?.reduce((a, p) => a + p.income, 0) ?? 0;
  const expense = data?.reduce((a, p) => a + p.expense, 0) ?? 0;
  const empty = data && income === 0 && expense === 0;

  return (
    <Card className="min-w-0">
      <CardHeader
        title={l.title}
        description={data && !empty ? l.totals(formatVND(income), formatVND(expense)) : l.description}
        action={
          <div className="max-w-full overflow-x-auto">
            <Segmented label={l.range} value={range} onChange={setRange} options={RANGES.map((value) => ({ value, label: l.ranges[value] }))} />
          </div>
        }
        className="flex-col sm:flex-row"
      />
      <CardContent>
        {error ? (
          <ErrorState message={l.error} onRetry={reload} />
        ) : !data ? (
          <SkeletonChart />
        ) : empty ? (
          <EmptyState compact icon={<BarChart3 />} title={l.emptyTitle} description={l.emptyBody} />
        ) : (
          <CashFlowBars data={data} />
        )}
      </CardContent>
    </Card>
  );
}
