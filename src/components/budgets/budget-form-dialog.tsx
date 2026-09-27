"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { Field, Select } from "@/components/ui/field";
import { MoneyInput } from "@/components/ui/money-input";
import { useToast } from "@/context/ToastContext";
import { useBudgetMutations } from "@/hooks/use-budget";
import { errorMessage } from "@/lib/api-client";
import { monthLabel } from "@/lib/utils/date";
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
  const used = new Set(existing.map((b) => b.categoryId));
  const available = categories.filter((c) => c.type === "expense" && (!used.has(c.id) || c.id === editing?.categoryId));
  const [categoryId, setCategoryId] = useState<number | "">(editing?.categoryId ?? available[0]?.id ?? "");
  const [limit, setLimit] = useState(editing ? formatCurrencyInput(editing.limit) : "");
  const [errors, setErrors] = useState<{ category?: string; limit?: string }>({});
  const [saving, setSaving] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const amount = parseCurrencyInput(limit);
    const next = {
      category: categoryId ? undefined : "Chọn danh mục.",
      limit: amount > 0 ? undefined : "Nhập hạn mức lớn hơn 0.",
    };
    setErrors(next);
    if (next.category || next.limit) return;
    setSaving(true);
    try {
      if (editing) await updateLimit(editing.id, amount);
      else await save({ category_id: Number(categoryId), month, limit_amount: amount });
      toast.success(editing ? "Đã cập nhật ngân sách" : "Đã thêm ngân sách");
      onClose();
    } catch (error) {
      toast.error("Không thể lưu ngân sách", errorMessage(error));
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      size="sm"
      title={editing ? `Sửa ngân sách ${editing.category.name}` : "Thêm ngân sách"}
      description={monthLabel(month)}
      footer={
        <>
          <Button variant="outline" onClick={onClose}>
            Hủy
          </Button>
          <Button type="submit" form="budget-form" loading={saving}>
            Lưu
          </Button>
        </>
      }
    >
      <form id="budget-form" noValidate onSubmit={submit} className="space-y-4">
        {!editing && (
          <Field label="Danh mục" error={errors.category} required>
            {(p) =>
              available.length === 0 ? (
                <p className="text-[13px] text-muted">Tất cả danh mục chi đã có ngân sách trong tháng này.</p>
              ) : (
                <Select {...p} value={categoryId} onChange={(e) => setCategoryId(Number(e.target.value))}>
                  {available.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </Select>
              )
            }
          </Field>
        )}
        <Field label="Hạn mức tháng" error={errors.limit} required hint="Bạn sẽ được nhắc khi chi tiêu chạm 80% hạn mức.">
          {(p) => <MoneyInput {...p} value={limit} onValueChange={setLimit} placeholder="2.000.000" data-autofocus />}
        </Field>
      </form>
    </Dialog>
  );
}
