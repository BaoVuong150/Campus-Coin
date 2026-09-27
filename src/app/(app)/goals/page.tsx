"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { CheckCircle2, Minus, Pencil, Plus, RotateCcw, Target, Trash2 } from "lucide-react";
import { CategoryIcon } from "@/components/common/category-icon";
import { EmptyState, ErrorState } from "@/components/common/states";
import { ContributionDialog, GoalFormDialog } from "@/components/goals/goal-dialogs";
import { goalMeta } from "@/components/goals/goal-progress";
import { PageHeader } from "@/components/layout/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { SkeletonCard } from "@/components/ui/skeleton";
import { useToast } from "@/context/ToastContext";
import { useGoalMutations, useGoals } from "@/hooks/use-goals";
import { useI18n } from "@/i18n/provider";
import { formatDate } from "@/lib/utils/date";
import { formatVND } from "@/lib/utils/money";
import type { GoalDTO } from "@/types/finance";

type DialogState =
  | { kind: "form"; goal: GoalDTO | null }
  | { kind: "contribution"; goal: GoalDTO; direction: "deposit" | "withdraw" }
  | null;

function GoalCard({ goal, onDialog }: { goal: GoalDTO; onDialog: (d: DialogState) => void }) {
  const { update, remove } = useGoalMutations();
  const { toast, confirm } = useToast();
  const { t, fmt } = useI18n();
  const l = t.goals;
  const completed = goal.status === "completed";

  const setStatus = async (status: "active" | "completed") => {
    try {
      await update(goal.id, { status });
      toast.success(status === "completed" ? l.completedToast(goal.name) : l.reopened);
    } catch (e) {
      toast.error(l.updateFailed, fmt.error(e));
    }
  };

  const handleDelete = async () => {
    const ok = await confirm({
      title: l.deleteTitle,
      message: l.deleteMessage(goal.name),
      confirmText: l.deleteConfirm,
      isDestructive: true,
    });
    if (!ok) return;
    try {
      await remove(goal.id);
      toast.success(l.deleted);
    } catch (e) {
      toast.error(l.deleteFailed, fmt.error(e));
    }
  };

  return (
    <Card className="flex flex-col p-5">
      <div className="flex items-start gap-3">
        <CategoryIcon icon={goal.icon} color="var(--primary-ink)" />
        <div className="min-w-0 flex-1">
          <h2 className="truncate text-[15px] font-semibold text-foreground">{goal.name}</h2>
          <p className="text-[12px] text-muted">
            {goal.deadline ? `${l.deadline(formatDate(goal.deadline))} · ` : ""}
            {goalMeta(t, goal)}
          </p>
        </div>
        {completed ? (
          <Badge tone="success">
            <CheckCircle2 /> {l.completed}
          </Badge>
        ) : goal.overdue ? (
          <Badge tone="warning">{l.overdue}</Badge>
        ) : null}
      </div>

      <div className="mt-4 mb-4">
        <div className="flex items-baseline justify-between gap-2">
          <p className="tabular text-xl font-semibold tracking-tight text-foreground">{formatVND(goal.currentAmount)}</p>
          <p className="tabular text-[13px] text-muted">/ {formatVND(goal.targetAmount)}</p>
        </div>
        <Progress className="mt-2" value={goal.percentage} label={l.progressLabel(goal.name)} />
        <div className="mt-2 flex justify-between text-[12px] text-muted">
          <span className="tabular">{goal.percentage}%</span>
          {!completed && goal.monthlyContribution !== null && goal.remaining > 0 && (
            <span>
              {l.need} <span className="tabular font-medium text-foreground">{formatVND(goal.monthlyContribution)}</span>
              {l.perMonth}
            </span>
          )}
          {!completed && goal.remaining === 0 && <span className="text-success">{l.reached}</span>}
        </div>
      </div>

      <div className="mt-auto flex flex-wrap items-center gap-1.5 border-t border-border pt-3">
        {!completed ? (
          <>
            <Button size="sm" onClick={() => onDialog({ kind: "contribution", goal, direction: "deposit" })}>
              <Plus /> {l.deposit}
            </Button>
            <Button size="sm" variant="outline" onClick={() => onDialog({ kind: "contribution", goal, direction: "withdraw" })} disabled={goal.currentAmount <= 0}>
              <Minus /> {l.withdraw}
            </Button>
            <Button size="sm" variant="ghost" onClick={() => setStatus("completed")}>
              <CheckCircle2 /> {l.complete}
            </Button>
          </>
        ) : (
          <Button size="sm" variant="outline" onClick={() => setStatus("active")}>
            <RotateCcw /> {l.reopen}
          </Button>
        )}
        <div className="ml-auto flex">
          <Button size="icon-sm" variant="ghost" onClick={() => onDialog({ kind: "form", goal })} aria-label={l.editLabel(goal.name)}>
            <Pencil />
          </Button>
          <Button size="icon-sm" variant="ghost" onClick={handleDelete} aria-label={l.deleteLabel(goal.name)}>
            <Trash2 />
          </Button>
        </div>
      </div>
    </Card>
  );
}

function GoalsView() {
  const params = useSearchParams();
  const router = useRouter();
  const { data, error, reload } = useGoals();
  const { t } = useI18n();
  const l = t.goals;
  const [dialog, setDialog] = useState<DialogState>(params.get("new") === "1" ? { kind: "form", goal: null } : null);

  const close = () => {
    setDialog(null);
    if (params.get("new")) router.replace("/goals", { scroll: false });
  };

  const active = data?.filter((g) => g.status === "active") ?? [];
  const completed = data?.filter((g) => g.status === "completed") ?? [];
  const totalSaved = active.reduce((a, g) => a + g.currentAmount, 0);

  return (
    <div>
      <PageHeader
        title={l.title}
        description={data && active.length > 0 ? l.saving(formatVND(totalSaved), active.length) : l.description}
        actions={
          <Button onClick={() => setDialog({ kind: "form", goal: null })}>
            <Plus /> {l.new}
          </Button>
        }
      />

      {error ? (
        <Card>
          <ErrorState message={l.error} onRetry={reload} />
        </Card>
      ) : !data ? (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 3 }, (_, i) => (
            <SkeletonCard key={i} lines={3} />
          ))}
        </div>
      ) : data.length === 0 ? (
        <Card>
          <EmptyState
            icon={<Target />}
            title={l.emptyTitle}
            description={l.emptyBody}
            action={
              <Button size="sm" onClick={() => setDialog({ kind: "form", goal: null })}>
                <Plus /> {l.create}
              </Button>
            }
          />
        </Card>
      ) : (
        <div className="space-y-8">
          {active.length > 0 && (
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {active.map((g) => (
                <GoalCard key={g.id} goal={g} onDialog={setDialog} />
              ))}
            </div>
          )}
          {completed.length > 0 && (
            <section>
              <h2 className="mb-3 text-sm font-semibold text-muted">{l.completedSection}</h2>
              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                {completed.map((g) => (
                  <GoalCard key={g.id} goal={g} onDialog={setDialog} />
                ))}
              </div>
            </section>
          )}
        </div>
      )}

      {dialog?.kind === "form" && <GoalFormDialog goal={dialog.goal} onClose={close} />}
      {dialog?.kind === "contribution" && <ContributionDialog goal={dialog.goal} direction={dialog.direction} onClose={close} />}
    </div>
  );
}

export default function GoalsPage() {
  return (
    <Suspense fallback={<SkeletonCard lines={3} />}>
      <GoalsView />
    </Suspense>
  );
}
