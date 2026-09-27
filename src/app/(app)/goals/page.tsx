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
import { errorMessage } from "@/lib/api-client";
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
  const completed = goal.status === "completed";

  const setStatus = async (status: "active" | "completed") => {
    try {
      await update(goal.id, { status });
      toast.success(status === "completed" ? `Chúc mừng! Đã hoàn thành "${goal.name}"` : "Đã mở lại mục tiêu");
    } catch (e) {
      toast.error("Không thể cập nhật", errorMessage(e));
    }
  };

  const handleDelete = async () => {
    const ok = await confirm({
      title: "Xóa mục tiêu?",
      message: `"${goal.name}" và lịch sử nạp/rút sẽ bị xóa vĩnh viễn.`,
      confirmText: "Xóa mục tiêu",
      isDestructive: true,
    });
    if (!ok) return;
    try {
      await remove(goal.id);
      toast.success("Đã xóa mục tiêu");
    } catch (e) {
      toast.error("Không thể xóa mục tiêu", errorMessage(e));
    }
  };

  return (
    <Card className="flex flex-col p-5">
      <div className="flex items-start gap-3">
        <CategoryIcon icon={goal.icon} color="var(--primary)" />
        <div className="min-w-0 flex-1">
          <h2 className="truncate text-[15px] font-semibold text-foreground">{goal.name}</h2>
          <p className="text-[12px] text-muted">
            {goal.deadline ? `Hạn ${formatDate(goal.deadline)} · ` : ""}
            {goalMeta(goal)}
          </p>
        </div>
        {completed ? (
          <Badge tone="success">
            <CheckCircle2 /> Hoàn thành
          </Badge>
        ) : goal.overdue ? (
          <Badge tone="warning">Quá hạn</Badge>
        ) : null}
      </div>

      <div className="mt-4 mb-4">
        <div className="flex items-baseline justify-between gap-2">
          <p className="tabular text-xl font-semibold tracking-tight text-foreground">{formatVND(goal.currentAmount)}</p>
          <p className="tabular text-[13px] text-muted">/ {formatVND(goal.targetAmount)}</p>
        </div>
        <Progress className="mt-2" value={goal.percentage} label={`Tiến độ ${goal.name}`} />
        <div className="mt-2 flex justify-between text-[12px] text-muted">
          <span className="tabular">{goal.percentage}%</span>
          {!completed && goal.monthlyContribution !== null && goal.remaining > 0 && (
            <span>
              Cần <span className="tabular font-medium text-foreground">{formatVND(goal.monthlyContribution)}</span>/tháng
            </span>
          )}
          {!completed && goal.remaining === 0 && <span className="text-success">Đã đủ số tiền</span>}
        </div>
      </div>

      <div className="mt-auto flex flex-wrap items-center gap-1.5 border-t border-border pt-3">
        {!completed ? (
          <>
            <Button size="sm" onClick={() => onDialog({ kind: "contribution", goal, direction: "deposit" })}>
              <Plus /> Thêm tiền
            </Button>
            <Button size="sm" variant="outline" onClick={() => onDialog({ kind: "contribution", goal, direction: "withdraw" })} disabled={goal.currentAmount <= 0}>
              <Minus /> Rút
            </Button>
            <Button size="sm" variant="ghost" onClick={() => setStatus("completed")}>
              <CheckCircle2 /> Hoàn thành
            </Button>
          </>
        ) : (
          <Button size="sm" variant="outline" onClick={() => setStatus("active")}>
            <RotateCcw /> Mở lại
          </Button>
        )}
        <div className="ml-auto flex">
          <Button size="icon-sm" variant="ghost" onClick={() => onDialog({ kind: "form", goal })} aria-label={`Sửa ${goal.name}`}>
            <Pencil />
          </Button>
          <Button size="icon-sm" variant="ghost" onClick={handleDelete} aria-label={`Xóa ${goal.name}`}>
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
        title="Mục tiêu tiết kiệm"
        description={data && active.length > 0 ? `Đang để dành ${formatVND(totalSaved)} cho ${active.length} mục tiêu.` : "Để dành cho những điều quan trọng."}
        actions={
          <Button onClick={() => setDialog({ kind: "form", goal: null })}>
            <Plus /> Mục tiêu mới
          </Button>
        }
      />

      {error ? (
        <Card>
          <ErrorState message="Không thể tải mục tiêu." onRetry={reload} />
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
            title="Tạo mục tiêu tiết kiệm đầu tiên"
            description="Laptop mới, chuyến du lịch hay quỹ khẩn cấp – theo dõi tiến độ và số tiền cần để dành mỗi tháng."
            action={
              <Button size="sm" onClick={() => setDialog({ kind: "form", goal: null })}>
                <Plus /> Tạo mục tiêu
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
              <h2 className="mb-3 text-sm font-semibold text-muted">Đã hoàn thành</h2>
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
