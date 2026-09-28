"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { Field, Select } from "@/components/ui/field";
import { MoneyInput } from "@/components/ui/money-input";
import { useToast } from "@/context/ToastContext";
import { useBudgetMutations } from "@/hooks/use-budget";
import { useI18n } from "@/i18n/provider";
import { formatCurrencyInput, parseCurrencyInput } from "@/lib/utils/money";
import type { BudgetItemDTO, CategoryDTO } from "@/types/finance";

interface Props {
  open: boolean;
  onClose: () => void;
  month: string;
  categories: CategoryDTO[];
  existing: BudgetItemDTO[];
  editing?: BudgetItemDTO | null;
}

export function BudgetFormDialog({ open, onClose, month, categories, existing, editing }: Props) {
  const { save, updateLimit } = useBudgetMutations();
  const { toast } = useToast();
  const { t, fmt } = useI18n();
  const l = t.budgets.form;
  const used = new Set(existing.map((b) => b.categoryId));
  const available = categories.filter((c) => c.type === "expense" && (!used.has(c.id) || c.id === editing?.categoryId));
  const [categoryId, setCategoryId] = useState<number | "">(editing?.categoryId ?? available[0]?.id ?? "");
  const [limit, setLimit] = useState(editing ? formatCurrencyInput(editing.limit) : "");
  const [errors, setErrors] = useState<{ category?: string; limit?: string }>({});
  const [saving, setSaving] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (saving) return; // chống gửi trùng khi bấm đúp / nhấn Enter liên tiếp
    const amount = parseCurrencyInput(limit);
    const next = {
      category: categoryId ? undefined : t.validation.categoryRequired,
      limit: amount > 0 ? undefined : l.limitRequired,
    };
    setErrors(next);
    if (next.category || next.limit) return;
    setSaving(true);
    try {
      if (editing) await updateLimit(editing.id, amount);
      else await save({ category_id: Number(categoryId), month, limit_amount: amount });
      toast.success(editing ? l.updated : l.added);
      onClose();
    } catch (error) {
      toast.error(l.failed, fmt.error(error));
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      size="sm"
      title={editing ? l.editTitle(fmt.category(editing.category.name)) : l.addTitle}
      description={fmt.month(month)}
      footer={
        <>
          <Button variant="outline" onClick={onClose}>
            {t.common.cancel}
          </Button>
          <Button type="submit" form="budget-form" loading={saving}>
            {t.common.save}
          </Button>
        </>
      }
    >
      <form id="budget-form" noValidate onSubmit={submit} className="space-y-4">
        {!editing && (
          <Field label={l.category} error={errors.category} required>
            {(p) =>
              available.length === 0 ? (
                <p className="text-[13px] text-muted">{l.allUsed}</p>
              ) : (
                <Select {...p} value={categoryId} onChange={(e) => setCategoryId(Number(e.target.value))}>
                  {available.map((c) => (
                    <option key={c.id} value={c.id}>
                      {fmt.category(c.name)}
                    </option>
                  ))}
                </Select>
              )
            }
          </Field>
        )}
        <Field label={l.limit} error={errors.limit} required hint={l.limitHint}>
          {(p) => <MoneyInput {...p} value={limit} onValueChange={setLimit} placeholder="2.000.000" data-autofocus />}
        </Field>
      </form>
    </Dialog>
  );
}
