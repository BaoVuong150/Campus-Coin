"use client";

import { Award, BadgeCheck, CalendarCheck, Flame, Footprints, Lock, PiggyBank, ShieldCheck, Target, type LucideIcon } from "lucide-react";
import { EmptyState, ErrorState } from "@/components/common/states";
import { PageHeader } from "@/components/layout/page-header";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { SkeletonCard } from "@/components/ui/skeleton";
import { usePoints } from "@/hooks/use-points";
import { useI18n } from "@/i18n/provider";
import type { PointReason } from "@/i18n/templates";
import type { AchievementId } from "@/lib/finance/points";
import { formatNumber } from "@/lib/utils/money";
import { cn } from "@/lib/utils/cn";

const ACHIEVEMENT_ICONS: Record<AchievementId, LucideIcon> = {
  firstStep: Footprints,
  streak7: Flame,
  saver: PiggyBank,
  budgetKeeper: ShieldCheck,
  goalGetter: Target,
  planner: CalendarCheck,
};

/** Thứ tự hiển thị các cách nhận điểm. */
const RULE_ORDER: PointReason[] = ["firstTransaction", "dailyLog", "goalDeposit", "budgetWeek", "monthlySavings", "goalCompleted"];

export default function PointsPage() {
  const { t, fmt } = useI18n();
  const l = t.points;
  const { data, error, reload } = usePoints();

  return (
    <div>
      <PageHeader title={l.title} description={l.description} />

      {error ? (
        <Card>
          <ErrorState message={l.error} onRetry={reload} />
        </Card>
      ) : !data ? (
        <div className="grid gap-4 md:grid-cols-2">
          <SkeletonCard lines={3} />
          <SkeletonCard lines={3} />
        </div>
      ) : (
        <div className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card className="p-5">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-[13px] font-medium text-muted">{l.total}</p>
                  <p className="tabular mt-1 text-3xl font-semibold tracking-tight text-foreground">{formatNumber(data.total)}</p>
                </div>
                <Badge tone="primary">
                  <Award /> {l.level(data.level.level)} · {l.levels[data.level.titleIndex]}
                </Badge>
              </div>
              <Progress className="mt-4" value={data.level.progress} label={l.level(data.level.level)} />
              <p className="mt-2 text-[12px] text-muted">
                {data.level.nextLevelAt === null ? l.maxLevel : l.toNext(data.level.nextLevelAt - data.total)}
              </p>
            </Card>

            <Card className="p-5">
              <p className="text-[13px] font-medium text-muted">{l.streak}</p>
              <p className="mt-1 flex items-center gap-2 text-3xl font-semibold tracking-tight text-foreground">
                <Flame className={cn("size-7", data.streak.current > 0 ? "text-warning" : "text-subtle")} aria-hidden />
                <span className="tabular">{l.streakDays(data.streak.current)}</span>
              </p>
              <p className="mt-2 text-[12px] text-muted">
                {l.bestStreak(data.streak.best)} · {l.streakHint}
              </p>
            </Card>
          </div>

          <div className="grid gap-4 lg:grid-cols-2">
            <Card className="min-w-0">
              <CardHeader title={l.achievements} />
              <CardContent className="grid gap-2 sm:grid-cols-2">
                {data.achievements.map(({ id, unlocked }) => {
                  const Icon = ACHIEVEMENT_ICONS[id];
                  const [name, description] = l.achievementList[id];
                  return (
                    <div
                      key={id}
                      className={cn("flex items-start gap-3 rounded-md border p-3", unlocked ? "border-primary/40 bg-primary-soft" : "border-border opacity-70")}
                    >
                      <span
                        className={cn(
                          "flex size-8 shrink-0 items-center justify-center rounded-full",
                          unlocked ? "bg-primary text-primary-foreground" : "bg-surface-secondary text-subtle"
                        )}
                        aria-hidden
                      >
                        {unlocked ? <Icon className="size-4" /> : <Lock className="size-4" />}
                      </span>
                      <span className="min-w-0">
                        <span className="block text-sm font-medium text-foreground">{name}</span>
                        <span className="block text-[12px] text-muted">{description}</span>
                        <span className="sr-only">{unlocked ? l.unlocked : l.locked}</span>
                      </span>
                    </div>
                  );
                })}
              </CardContent>
            </Card>

            <Card className="min-w-0">
              <CardHeader title={l.howToEarn} />
              <CardContent className="pt-2">
                <ul className="divide-y divide-border">
                  {RULE_ORDER.map((reason) => (
                    <li key={reason} className="flex items-center justify-between gap-3 py-2.5 text-sm">
                      <span className="text-foreground">{l.rules[reason]}</span>
                      <span className="tabular font-medium text-primary">+{data.values[reason]}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader title={l.history} />
            <CardContent className="pt-2">
              {data.history.length === 0 ? (
                <EmptyState compact icon={<BadgeCheck />} title={l.emptyHistory} />
              ) : (
                <ul className="divide-y divide-border">
                  {data.history.map((event) => (
                    <li key={event.id} className="flex items-center justify-between gap-3 py-2.5 text-sm">
                      <span className="min-w-0">
                        <span className="block truncate text-foreground">{l.reasons[event.reason]}</span>
                        <span className="block text-[12px] text-subtle">{fmt.relativeDay(event.createdAt)}</span>
                      </span>
                      <span className="tabular font-medium text-success">+{event.points}</span>
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
