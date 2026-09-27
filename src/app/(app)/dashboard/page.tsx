"use client";

import { useMemo } from "react";
import { BudgetOverviewCard } from "@/components/dashboard/budget-overview-card";
import { CashFlowCard } from "@/components/dashboard/cash-flow-card";
import { CategoryBreakdownCard } from "@/components/dashboard/category-breakdown-card";
import { GoalsPreviewCard } from "@/components/dashboard/goals-preview-card";
import { InsightsCard } from "@/components/dashboard/insights-card";
import { PlanningCards } from "@/components/dashboard/planning-cards";
import { RecentTransactionsCard } from "@/components/dashboard/recent-transactions-card";
import { SummaryCards } from "@/components/dashboard/summary-cards";
import { PageHeader } from "@/components/layout/page-header";
import { useSessionUser } from "@/components/layout/session-context";
import { useSummary } from "@/hooks/use-dashboard";
import { currentMonthKey } from "@/lib/utils/date";
import { greeting } from "@/i18n/format";
import { useI18n } from "@/i18n/provider";

/** Dashboard: sắp xếp theo mức độ quan trọng – con số chính → kế hoạch → xu hướng → chi tiết. */
export default function DashboardPage() {
  const user = useSessionUser();
  const { t } = useI18n();
  const month = useMemo(() => currentMonthKey(), []);
  const { data: summary } = useSummary(month);
  const firstName = user.name.trim().split(/\s+/).pop() ?? user.name;

  return (
    <div className="space-y-6">
      <PageHeader
        title={`${greeting(t)}, ${firstName}`}
        description={t.dashboard.subtitle}
      />

      <SummaryCards summary={summary} />
      <PlanningCards />

      <div className="grid gap-4 xl:grid-cols-5">
        <div className="min-w-0 xl:col-span-3">
          <CashFlowCard />
        </div>
        <div className="min-w-0 xl:col-span-2">
          <CategoryBreakdownCard month={month} />
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <BudgetOverviewCard month={month} />
        <RecentTransactionsCard />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <InsightsCard />
        <GoalsPreviewCard />
      </div>
    </div>
  );
}
