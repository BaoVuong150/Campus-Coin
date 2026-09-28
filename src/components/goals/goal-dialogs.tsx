"use client";

import { useState } from "react";
import { CategoryIcon, GOAL_ICON_OPTIONS } from "@/components/common/category-icon";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { Field, Input } from "@/components/ui/field";
import { MoneyInput } from "@/components/ui/money-input";
import { useToast } from "@/context/ToastContext";
import { useGoalMutations } from "@/hooks/use-goals";
import { useI18n } from "@/i18n/provider";
import { todayYmd, toYmd } from "@/lib/utils/date";
import { formatCurrencyInput, formatVND, parseCurrencyInput } from "@/lib/utils/money";
import { cn } from "@/lib/utils/cn";
import type { GoalDTO } from "@/types/finance";

export function GoalFormDialog({ goal, onClose }: { goal: GoalDTO | null; onClose: () => void }) {
  const { create, update } = useGoalMutations();
  const { toast } = useToast();
  const { t, fmt } = useI18n();
  const l = t.goals.form;
  const [name, setName] = useState(goal?.name ?? "");
  const [target, setTarget] = useState(goal ? formatCurrencyInput(goal.targetAmount) : "");
  const [deadline, setDeadline] = useState(goal?.deadline ? toYmd(new Date(goal.deadline)) : "");
  const [icon, setIcon] = useState(goal?.icon ?? "Target");
  const [errors, setErrors] = useState<{ name?: string; target?: string }>({});
  const [saving, setSaving] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (saving) return; // chống gửi trùng khi bấm đúp / nhấn Enter liên tiếp
    const amount = parseCurrencyInput(target);
    const next = { name: name.trim() ? undefined : l.nameRequired, target: amount > 0 ? undefined : l.targetRequired };
    setErrors(next);
    if (next.name || next.target) return;
    setSaving(true);
    try {
      const input = { name: name.trim(), target_amount: amount, deadline: deadline || null, icon };
      if (goal) await update(goal.id, input);
      else await create(input);
      toast.success(goal ? l.updated : l.created);
      onClose();
    } catch (error) {
      toast.error(l.failed, fmt.error(error));
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog
      open
      onClose={onClose}
      size="sm"
      title={goal ? l.editTitle : l.newTitle}
      footer={
        <>
          <Button variant="outline" onClick={onClose}>
            {t.common.cancel}
          </Button>
          <Button type="submit" form="goal-form" loading={saving}>
            {t.common.save}
          </Button>
        </>
      }
    >
      <form id="goal-form" noValidate onSubmit={submit} className="space-y-4">
        <Field label={l.name} error={errors.name} required>
          {(p) => <Input {...p} value={name} onChange={(e) => setName(e.target.value)} placeholder={l.namePlaceholder} maxLength={80} data-autofocus />}
        </Field>
        <Field label={l.target} error={errors.target} required>
          {(p) => <MoneyInput {...p} value={target} onValueChange={setTarget} placeholder="25.000.000" />}
        </Field>
        <Field label={l.deadline} hint={l.deadlineHint}>
          {(p) => <Input {...p} type="date" value={deadline} min={todayYmd()} onChange={(e) => setDeadline(e.target.value)} />}
        </Field>
        <fieldset>
          <legend className="mb-1.5 text-[13px] font-medium text-foreground">{l.icon}</legend>
          <div className="flex flex-wrap gap-1.5">
            {GOAL_ICON_OPTIONS.map((option) => (
              <button
                key={option}
                type="button"
                onClick={() => setIcon(option)}
                aria-pressed={icon === option}
                aria-label={option}
                className={cn("rounded-md border p-1.5 transition-colors", icon === option ? "border-primary-ink bg-primary-soft" : "border-border hover:bg-surface-hover")}
              >
                <CategoryIcon icon={option} color="var(--primary-ink)" size="sm" />
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
  const { t, fmt } = useI18n();
  const l = t.goals.contribution;
  const [amount, setAmount] = useState("");
  const [error, setError] = useState<string>();
  const [saving, setSaving] = useState(false);
  const deposit = direction === "deposit";

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (saving) return; // chống gửi trùng khi bấm đúp / nhấn Enter liên tiếp
    const value = parseCurrencyInput(amount);
    if (value <= 0) return setError(t.validation.amountPositive);
    if (!deposit && value > goal.currentAmount) return setError(t.validation.maxAmount(formatVND(goal.currentAmount)));
    setSaving(true);
    try {
      await contribute(goal.id, value, direction);
      toast.success(deposit ? l.deposited(formatVND(value), goal.name) : l.withdrawn(formatVND(value), goal.name));
      onClose();
    } catch (err) {
      toast.error(l.failed, fmt.error(err));
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog
      open
      onClose={onClose}
      size="sm"
      title={deposit ? l.depositTitle : l.withdrawTitle}
      description={l.current(goal.name, formatVND(goal.currentAmount))}
      footer={
        <>
          <Button variant="outline" onClick={onClose}>
            {t.common.cancel}
          </Button>
          <Button type="submit" form="contribution-form" loading={saving}>
            {deposit ? l.submitDeposit : l.submitWithdraw}
          </Button>
        </>
      }
    >
      <form id="contribution-form" noValidate onSubmit={submit}>
        <Field label={l.amount} error={error} required hint={deposit && goal.monthlyContribution ? l.suggestion(formatVND(goal.monthlyContribution)) : undefined}>
          {(p) => <MoneyInput {...p} size="xl" value={amount} onValueChange={setAmount} placeholder="0" data-autofocus />}
        </Field>
      </form>
    </Dialog>
  );
}
