"use client";

import Link from "next/link";
import { Wallet } from "lucide-react";
import { BudgetRow } from "@/components/budgets/budget-row";
import { EmptyState, ErrorState } from "@/components/common/states";
import { buttonClasses } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { SkeletonRows } from "@/components/ui/skeleton";
import { useBudgets } from "@/hooks/use-budget";
import { useI18n } from "@/i18n/provider";

const PREVIEW = 4;

export function BudgetOverviewCard({ month }: { month: string }) {
  const { data, error, reload } = useBudgets(month);
  const { t } = useI18n();
  const l = t.dashboard.budget;
  return (
    <Card className="min-w-0">
      <CardHeader
        title={l.title}
        action={
          <Link href="/budgets" className="text-[13px] font-medium text-primary hover:underline">
            {t.common.manage}
          </Link>
        }
      />
      <CardContent className="pt-2">
        {error ? (
          <ErrorState onRetry={reload} />
        ) : !data ? (
          <SkeletonRows rows={3} />
        ) : data.items.length === 0 ? (
          <EmptyState
            compact
            icon={<Wallet />}
            title={l.emptyTitle}
            description={l.emptyBody}
            action={
              <Link href="/budgets" className={buttonClasses("primary", "sm")}>
                {l.setBudget}
              </Link>
            }
          />
        ) : (
          <div className="divide-y divide-border">
            {data.items.slice(0, PREVIEW).map((item) => (
              <BudgetRow key={item.id} item={item} />
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
