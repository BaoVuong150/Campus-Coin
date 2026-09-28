"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { AlertCircle } from "lucide-react";
import { CategoryIcon } from "@/components/common/category-icon";
import { Button } from "@/components/ui/button";
import { Field, Select } from "@/components/ui/field";
import { MoneyInput } from "@/components/ui/money-input";
import { useToast } from "@/context/ToastContext";
import { useCategories } from "@/hooks/use-categories";
import { apiFetch } from "@/lib/api-client";
import { CANONICAL_CATEGORY_NAMES, normalizeText } from "@/lib/finance/categorize";
import { suggestStarterBudgets } from "@/lib/finance/onboarding";
import { formatCurrencyInput, parseCurrencyInput } from "@/lib/utils/money";
import { useI18n } from "@/i18n/provider";

const PAY_DAYS = Array.from({ length: 31 }, (_, i) => i + 1);

interface Props {
  initialAllowance: number;
  initialPayDay: number;
  initialSavings: number;
}

/**
 * Thiết lập ban đầu (một màn hình): thu nhập, ngày nhận, tiết kiệm tháng và ngân sách khởi đầu gợi ý.
 * Người dùng luôn có thể bỏ qua; mọi giá trị sửa lại được trong Cài đặt / Ngân sách.
 */
export function OnboardingForm({ initialAllowance, initialPayDay, initialSavings }: Props) {
  const router = useRouter();
  const { toast } = useToast();
  const { t, fmt } = useI18n();
  const l = t.onboarding;
  const { data: categories } = useCategories();
  const [allowance, setAllowance] = useState(initialAllowance ? formatCurrencyInput(initialAllowance) : "");
  const [payDay, setPayDay] = useState(initialPayDay);
  const [savings, setSavings] = useState(initialSavings ? formatCurrencyInput(initialSavings) : "");
  const [autoAllowance, setAutoAllowance] = useState(true);
  // Ngân sách người dùng đã sửa/bỏ chọn; mục chưa đụng tới theo gợi ý từ thu nhập hiện tại.
  const [edits, setEdits] = useState<Record<number, { checked: boolean; amount: string }>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [loading, setLoading] = useState<"submit" | "skip" | null>(null);

  const income = parseCurrencyInput(allowance);
  const suggestions = useMemo(() => {
    const defaults = (categories ?? []).filter((c) => c.isDefault && c.type === "expense");
    return suggestStarterBudgets(income)
      .map((s) => ({ ...s, category: defaults.find((c) => normalizeText(c.name) === CANONICAL_CATEGORY_NAMES[s.category]) }))
      .filter((s): s is typeof s & { category: NonNullable<typeof s.category> } => !!s.category);
  }, [categories, income]);

  const rows = suggestions.map((s) => {
    const edit = edits[s.category.id];
    return { id: s.category.id, category: s.category, checked: edit?.checked ?? true, amount: edit?.amount ?? formatCurrencyInput(s.amount) };
  });

  const setRow = (id: number, patch: Partial<{ checked: boolean; amount: string }>) => {
    const row = rows.find((r) => r.id === id);
    if (!row) return;
    setEdits((prev) => ({ ...prev, [id]: { checked: row.checked, amount: row.amount, ...patch } }));
  };

  const finish = (target: string) => {
    router.replace(target);
    router.refresh();
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    setLoading("submit");
    try {
      await apiFetch("/api/onboarding", {
        method: "POST",
        body: {
          skip: false,
          monthly_allowance: income,
          pay_day: payDay,
          monthly_savings_goal: parseCurrencyInput(savings),
          auto_allowance: autoAllowance && income > 0,
          budgets: rows
            .filter((r) => r.checked && parseCurrencyInput(r.amount) > 0)
            .map((r) => ({ category_id: r.id, limit_amount: parseCurrencyInput(r.amount) })),
        },
      });
      toast.success(l.done);
      finish("/dashboard");
    } catch (err) {
      setFormError(fmt.error(err) || l.failed);
      setLoading(null);
    }
  };

  const skip = async () => {
    setLoading("skip");
    try {
      await apiFetch("/api/onboarding", { method: "POST", body: { skip: true } });
    } catch {
      // Bỏ qua thất bại cũng không chặn người dùng vào app.
    }
    finish("/dashboard");
  };

  return (
    <form noValidate onSubmit={submit} className="space-y-5">
      {formError && (
        <p className="flex items-start gap-2 rounded-md bg-danger-soft px-3 py-2.5 text-[13px] text-danger" role="alert">
          <AlertCircle className="mt-0.5 size-4 shrink-0" aria-hidden /> {formError}
        </p>
      )}

      <Field label={l.income} hint={l.incomeHint}>
        {(p) => <MoneyInput {...p} value={allowance} onValueChange={setAllowance} placeholder="0" autoFocus />}
      </Field>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label={l.payDay}>
          {(p) => (
            <Select {...p} value={payDay} onChange={(e) => setPayDay(Number(e.target.value))}>
              {PAY_DAYS.map((d) => (
                <option key={d} value={d}>
                  {l.payDayOption(d)}
                </option>
              ))}
            </Select>
          )}
        </Field>
        <Field label={l.savings} hint={l.savingsHint}>
          {(p) => <MoneyInput {...p} value={savings} onValueChange={setSavings} placeholder="0" />}
        </Field>
      </div>

      {income > 0 && (
        <label className="flex cursor-pointer items-start gap-3 rounded-lg border border-border bg-surface p-3">
          <input
            type="checkbox"
            checked={autoAllowance}
            onChange={(e) => setAutoAllowance(e.target.checked)}
            className="mt-0.5 size-4 shrink-0 accent-(--primary-ink)"
          />
          <span>
            <span className="block text-sm font-medium text-foreground">{l.autoAllowance}</span>
            <span className="block text-[12px] text-muted">{l.autoAllowanceHint}</span>
          </span>
        </label>
      )}

      {rows.length > 0 && (
        <fieldset className="space-y-2">
          <legend className="text-sm font-medium text-foreground">{l.budgetsTitle}</legend>
          <p className="text-[12px] text-muted">{l.budgetsHint}</p>
          <ul className="space-y-2 pt-1">
            {rows.map((row) => (
              <li key={row.id} className="flex items-center gap-3">
                <input
                  type="checkbox"
                  checked={row.checked}
                  onChange={(e) => setRow(row.id, { checked: e.target.checked })}
                  aria-label={fmt.category(row.category.name)}
                  className="size-4 shrink-0 accent-(--primary-ink)"
                />
                <CategoryIcon icon={row.category.icon} color={row.category.color} size="sm" />
                <span className="min-w-0 flex-1 truncate text-sm text-foreground">{fmt.category(row.category.name)}</span>
                <div className="w-36 shrink-0">
                  <MoneyInput
                    value={row.amount}
                    onValueChange={(amount) => setRow(row.id, { amount })}
                    disabled={!row.checked}
                    aria-label={fmt.category(row.category.name)}
                  />
                </div>
              </li>
            ))}
          </ul>
        </fieldset>
      )}

      <div className="space-y-2 pt-1">
        <Button type="submit" size="lg" className="w-full" loading={loading === "submit"} disabled={loading !== null}>
          {l.submit}
        </Button>
        <Button type="button" variant="ghost" size="lg" className="w-full" onClick={skip} loading={loading === "skip"} disabled={loading !== null}>
          {l.skip}
        </Button>
      </div>
    </form>
  );
}
