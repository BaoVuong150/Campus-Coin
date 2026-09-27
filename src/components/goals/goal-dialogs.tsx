"use client";

import { useState } from "react";
import { CategoryIcon, GOAL_ICON_OPTIONS } from "@/components/common/category-icon";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { Field, Input } from "@/components/ui/field";
import { MoneyInput } from "@/components/ui/money-input";
import { useToast } from "@/context/ToastContext";
import { useGoalMutations } from "@/hooks/use-goals";
import { errorMessage } from "@/lib/api-client";
import { todayYmd, toYmd } from "@/lib/utils/date";
import { formatCurrencyInput, formatVND, parseCurrencyInput } from "@/lib/utils/money";
import { cn } from "@/lib/utils/cn";
import type { GoalDTO } from "@/types/finance";

export function GoalFormDialog({ goal, onClose }: { goal: GoalDTO | null; onClose: () => void }) {
  const { create, update } = useGoalMutations();
  const { toast } = useToast();
  const [name, setName] = useState(goal?.name ?? "");
  const [target, setTarget] = useState(goal ? formatCurrencyInput(goal.targetAmount) : "");
  const [deadline, setDeadline] = useState(goal?.deadline ? toYmd(new Date(goal.deadline)) : "");
  const [icon, setIcon] = useState(goal?.icon ?? "Target");
  const [errors, setErrors] = useState<{ name?: string; target?: string }>({});
  const [saving, setSaving] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const amount = parseCurrencyInput(target);
    const next = { name: name.trim() ? undefined : "Nhập tên mục tiêu.", target: amount > 0 ? undefined : "Nhập số tiền mục tiêu." };
    setErrors(next);
    if (next.name || next.target) return;
    setSaving(true);
    try {
      const input = { name: name.trim(), target_amount: amount, deadline: deadline || null, icon };
      if (goal) await update(goal.id, input);
      else await create(input);
      toast.success(goal ? "Đã cập nhật mục tiêu" : "Đã tạo mục tiêu");
      onClose();
    } catch (error) {
      toast.error("Không thể lưu mục tiêu", errorMessage(error));
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog
      open
      onClose={onClose}
      size="sm"
      title={goal ? "Sửa mục tiêu" : "Mục tiêu tiết kiệm mới"}
      footer={
        <>
          <Button variant="outline" onClick={onClose}>
            Hủy
          </Button>
          <Button type="submit" form="goal-form" loading={saving}>
            Lưu
          </Button>
        </>
      }
    >
      <form id="goal-form" noValidate onSubmit={submit} className="space-y-4">
        <Field label="Tên mục tiêu" error={errors.name} required>
          {(p) => <Input {...p} value={name} onChange={(e) => setName(e.target.value)} placeholder="VD: Laptop mới" maxLength={80} data-autofocus />}
        </Field>
        <Field label="Số tiền cần đạt" error={errors.target} required>
          {(p) => <MoneyInput {...p} value={target} onValueChange={setTarget} placeholder="25.000.000" />}
        </Field>
        <Field label="Hạn chót" hint="Không bắt buộc – dùng để tính số tiền cần để dành mỗi tháng.">
          {(p) => <Input {...p} type="date" value={deadline} min={todayYmd()} onChange={(e) => setDeadline(e.target.value)} />}
        </Field>
        <fieldset>
          <legend className="mb-1.5 text-[13px] font-medium text-foreground">Biểu tượng</legend>
          <div className="flex flex-wrap gap-1.5">
            {GOAL_ICON_OPTIONS.map((option) => (
              <button
                key={option}
                type="button"
                onClick={() => setIcon(option)}
                aria-pressed={icon === option}
                aria-label={option}
                className={cn("rounded-md border p-1.5 transition-colors", icon === option ? "border-primary bg-primary-soft" : "border-border hover:bg-surface-hover")}
              >
                <CategoryIcon icon={option} color="var(--primary)" size="sm" />
              </button>
            ))}
          </div>
        </fieldset>
      </form>
    </Dialog>
  );
}

export function ContributionDialog({
  goal,
  direction,
  onClose,
}: {
  goal: GoalDTO;
  direction: "deposit" | "withdraw";
  onClose: () => void;
}) {
  const { contribute } = useGoalMutations();
  const { toast } = useToast();
  const [amount, setAmount] = useState("");
  const [error, setError] = useState<string>();
  const [saving, setSaving] = useState(false);
  const deposit = direction === "deposit";

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const value = parseCurrencyInput(amount);
    if (value <= 0) return setError("Nhập số tiền lớn hơn 0.");
    if (!deposit && value > goal.currentAmount) return setError(`Tối đa ${formatVND(goal.currentAmount)}.`);
    setSaving(true);
    try {
      await contribute(goal.id, value, direction);
      toast.success(deposit ? `Đã thêm ${formatVND(value)} vào "${goal.name}"` : `Đã rút ${formatVND(value)} từ "${goal.name}"`);
      onClose();
    } catch (err) {
      toast.error("Không thể cập nhật mục tiêu", errorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog
      open
      onClose={onClose}
      size="sm"
      title={deposit ? "Thêm tiền vào mục tiêu" : "Rút tiền khỏi mục tiêu"}
      description={`${goal.name} · đang có ${formatVND(goal.currentAmount)}`}
      footer={
        <>
          <Button variant="outline" onClick={onClose}>
            Hủy
          </Button>
          <Button type="submit" form="contribution-form" loading={saving}>
            {deposit ? "Thêm tiền" : "Rút tiền"}
          </Button>
        </>
      }
    >
      <form id="contribution-form" noValidate onSubmit={submit}>
        <Field label="Số tiền" error={error} required hint={deposit && goal.monthlyContribution ? `Gợi ý mỗi tháng: ${formatVND(goal.monthlyContribution)}` : undefined}>
          {(p) => <MoneyInput {...p} size="xl" value={amount} onValueChange={setAmount} placeholder="0" data-autofocus />}
        </Field>
      </form>
    </Dialog>
  );
}
