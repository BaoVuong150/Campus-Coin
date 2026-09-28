"use client";

import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { Field, Input, Select } from "@/components/ui/field";
import { MoneyInput } from "@/components/ui/money-input";
import { Segmented } from "@/components/ui/segmented";
import { useToast } from "@/context/ToastContext";
import { useCategories } from "@/hooks/use-categories";
import { useRecurringMutations } from "@/hooks/use-recurring";
import { RECURRING_FREQUENCIES, type RecurringFrequency } from "@/constants/finance";
import { useI18n } from "@/i18n/provider";
import { todayYmd, toYmd } from "@/lib/utils/date";
import { formatCurrencyInput, parseCurrencyInput } from "@/lib/utils/money";
import type { RecurringDTO, TransactionType } from "@/types/finance";

export function RecurringFormDialog({ item, onClose }: { item: RecurringDTO | null; onClose: () => void }) {
  const { data: categories } = useCategories();
  const { create, update } = useRecurringMutations();
  const { toast } = useToast();
  const { t, fmt } = useI18n();
  const l = t.recurring.form;
  const [type, setType] = useState<TransactionType>(item?.type ?? "expense");
  const [name, setName] = useState(item?.name ?? "");
  const [amount, setAmount] = useState(item ? formatCurrencyInput(item.amount) : "");
  const [categoryId, setCategoryId] = useState<number | "">(item?.categoryId ?? "");
  const [frequency, setFrequency] = useState<RecurringFrequency>(item?.frequency ?? "monthly");
  const [startDate, setStartDate] = useState(item ? toYmd(new Date(item.startDate)) : todayYmd());
  const [endDate, setEndDate] = useState(item?.endDate ? toYmd(new Date(item.endDate)) : "");
  const [isFixed, setIsFixed] = useState(item?.isFixed ?? true);
  const [errors, setErrors] = useState<Record<string, string | undefined>>({});
  const [saving, setSaving] = useState(false);

  const options = useMemo(() => (categories ?? []).filter((c) => c.type === type), [categories, type]);
  const selectedCategory = categoryId || options[0]?.id || "";

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const value = parseCurrencyInput(amount);
    const next = {
      name: name.trim() ? undefined : t.validation.nameRequired,
      amount: value > 0 ? undefined : t.validation.amountPositive,
      category: selectedCategory ? undefined : t.validation.categoryRequired,
      endDate: endDate && endDate < startDate ? t.validation.endAfterStart : undefined,
    };
    setErrors(next);
    if (Object.values(next).some(Boolean)) return;
    setSaving(true);
    try {
      const base = {
        name: name.trim(),
        amount: value,
        type,
        category_id: Number(selectedCategory),
        frequency,
        end_date: endDate || null,
        is_fixed: isFixed,
      };
      if (item) await update(item.id, base);
      else await create({ ...base, start_date: startDate });
      toast.success(item ? l.updated : l.created);
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
      title={item ? l.editTitle : l.newTitle}
      description={l.description}
      footer={
        <>
          <Button variant="outline" onClick={onClose}>
            {t.common.cancel}
          </Button>
          <Button type="submit" form="recurring-form" loading={saving}>
            {t.common.save}
          </Button>
        </>
      }
    >
      <form id="recurring-form" noValidate onSubmit={submit} className="space-y-4">
        <Segmented
          label={l.type}
          value={type}
          onChange={(t) => {
            setType(t);
            setCategoryId("");
          }}
          options={[
            { value: "expense", label: l.expense },
            { value: "income", label: l.income },
          ]}
          size="md"
          fullWidth
        />
        <Field label={l.name} error={errors.name} required>
          {(p) => <Input {...p} value={name} onChange={(e) => setName(e.target.value)} placeholder={l.namePlaceholder} maxLength={80} data-autofocus />}
        </Field>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label={l.amount} error={errors.amount} required>
            {(p) => <MoneyInput {...p} value={amount} onValueChange={setAmount} placeholder="0" />}
          </Field>
          <Field label={l.category} error={errors.category} required>
            {(p) => (
              <Select {...p} value={selectedCategory} onChange={(e) => setCategoryId(Number(e.target.value))}>
                {options.map((c) => (
                  <option key={c.id} value={c.id}>
                    {fmt.category(c.name)}
                  </option>
                ))}
              </Select>
            )}
          </Field>
          <Field label={l.frequency}>
            {(p) => (
              <Select {...p} value={frequency} onChange={(e) => setFrequency(e.target.value as RecurringFrequency)}>
                {RECURRING_FREQUENCIES.map((value) => (
                  <option key={value} value={value}>
                    {t.recurring.frequencies[value]}
                  </option>
                ))}
              </Select>
            )}
          </Field>
          <Field label={l.startDate} hint={item ? l.startLocked : undefined}>
            {(p) => <Input {...p} type="date" value={startDate} disabled={!!item} onChange={(e) => setStartDate(e.target.value)} />}
          </Field>
          <Field label={l.endDate} error={errors.endDate}>
            {(p) => <Input {...p} type="date" value={endDate} min={startDate} onChange={(e) => setEndDate(e.target.value)} />}
          </Field>
        </div>
        {type === "expense" && (
          <label className="flex cursor-pointer items-start gap-3 rounded-md border border-border p-3 hover:bg-surface-hover">
            <input type="checkbox" checked={isFixed} onChange={(e) => setIsFixed(e.target.checked)} className="mt-0.5 size-4 accent-primary" />
            <span>
              <span className="block text-sm font-medium text-foreground">{l.fixed}</span>
              <span className="block text-[12px] text-muted">{l.fixedHint}</span>
            </span>
          </label>
        )}
      </form>
    </Dialog>
  );
}
