"use client";

import Link from "next/link";
import { Target } from "lucide-react";
import { GoalProgressRow } from "@/components/goals/goal-progress";
import { EmptyState, ErrorState } from "@/components/common/states";
import { buttonClasses } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { SkeletonRows } from "@/components/ui/skeleton";
import { useGoals } from "@/hooks/use-goals";
import { useI18n } from "@/i18n/provider";

const PREVIEW = 3;

export function GoalsPreviewCard() {
  const { data, error, reload } = useGoals();
  const { t } = useI18n();
  const l = t.dashboard.goals;
  const active = (data ?? []).filter((g) => g.status === "active");
  return (
    <Card className="min-w-0">
      <CardHeader
        title={l.title}
        action={
          <Link href="/goals" className="text-[13px] font-medium text-primary-ink hover:underline">
            {t.common.viewAll}
          </Link>
        }
      />
      <CardContent className="pt-2">
        {error ? (
          <ErrorState onRetry={reload} />
        ) : !data ? (
          <SkeletonRows rows={2} />
        ) : active.length === 0 ? (
          <EmptyState
            compact
            icon={<Target />}
            title={l.emptyTitle}
            description={l.emptyBody}
            action={
              <Link href="/goals?new=1" className={buttonClasses("primary", "sm")}>
                {l.create}
              </Link>
            }
          />
        ) : (
          <div className="divide-y divide-border">
            {active.slice(0, PREVIEW).map((g) => (
              <GoalProgressRow key={g.id} goal={g} />
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
