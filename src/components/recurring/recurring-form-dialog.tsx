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
import { errorMessage } from "@/lib/api-client";
import { FREQUENCY_LABELS, type RecurringFrequency } from "@/constants/finance";
import { todayYmd, toYmd } from "@/lib/utils/date";
import { formatCurrencyInput, parseCurrencyInput } from "@/lib/utils/money";
import type { RecurringDTO, TransactionType } from "@/types/finance";

const TYPE_OPTIONS: { value: TransactionType; label: string }[] = [
  { value: "expense", label: "Khoản chi" },
  { value: "income", label: "Khoản thu" },
];

export function RecurringFormDialog({ item, onClose }: { item: RecurringDTO | null; onClose: () => void }) {
  const { data: categories } = useCategories();
  const { create, update } = useRecurringMutations();
  const { toast } = useToast();
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
      name: name.trim() ? undefined : "Nhập tên khoản định kỳ.",
      amount: value > 0 ? undefined : "Nhập số tiền lớn hơn 0.",
      category: selectedCategory ? undefined : "Chọn danh mục.",
      endDate: endDate && endDate < startDate ? "Ngày kết thúc phải sau ngày bắt đầu." : undefined,
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
      toast.success(item ? "Đã cập nhật khoản định kỳ" : "Đã tạo khoản định kỳ");
      onClose();
    } catch (error) {
      toast.error("Không thể lưu khoản định kỳ", errorMessage(error));
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog
      open
      onClose={onClose}
      title={item ? "Sửa khoản định kỳ" : "Khoản định kỳ mới"}
      description="Hệ thống tự ghi giao dịch khi đến hạn, không tạo trùng."
      footer={
        <>
          <Button variant="outline" onClick={onClose}>
            Hủy
          </Button>
          <Button type="submit" form="recurring-form" loading={saving}>
            Lưu
          </Button>
        </>
      }
    >
      <form id="recurring-form" noValidate onSubmit={submit} className="space-y-4">
        <Segmented
          label="Loại"
          value={type}
          onChange={(t) => {
            setType(t);
            setCategoryId("");
          }}
          options={TYPE_OPTIONS}
          size="md"
          fullWidth
        />
        <Field label="Tên" error={errors.name} required>
          {(p) => <Input {...p} value={name} onChange={(e) => setName(e.target.value)} placeholder="VD: Tiền nhà, Netflix, Trợ cấp" maxLength={80} data-autofocus />}
        </Field>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Số tiền" error={errors.amount} required>
            {(p) => <MoneyInput {...p} value={amount} onValueChange={setAmount} placeholder="0" />}
          </Field>
          <Field label="Danh mục" error={errors.category} required>
            {(p) => (
              <Select {...p} value={selectedCategory} onChange={(e) => setCategoryId(Number(e.target.value))}>
                {options.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </Select>
            )}
          </Field>
          <Field label="Chu kỳ">
            {(p) => (
              <Select {...p} value={frequency} onChange={(e) => setFrequency(e.target.value as RecurringFrequency)}>
                {Object.entries(FREQUENCY_LABELS).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </Select>
            )}
          </Field>
          <Field label="Bắt đầu từ" hint={item ? "Không đổi được sau khi tạo." : undefined}>
            {(p) => <Input {...p} type="date" value={startDate} disabled={!!item} onChange={(e) => setStartDate(e.target.value)} />}
          </Field>
          <Field label="Kết thúc (không bắt buộc)" error={errors.endDate}>
            {(p) => <Input {...p} type="date" value={endDate} min={startDate} onChange={(e) => setEndDate(e.target.value)} />}
          </Field>
        </div>
        {type === "expense" && (
          <label className="flex cursor-pointer items-start gap-3 rounded-md border border-border p-3 hover:bg-surface-hover">
            <input type="checkbox" checked={isFixed} onChange={(e) => setIsFixed(e.target.checked)} className="mt-0.5 size-4 accent-primary" />
            <span>
              <span className="block text-sm font-medium text-foreground">Chi phí cố định</span>
              <span className="block text-[12px] text-muted">Hiển thị trong mục Chi phí cố định (tiền nhà, học phí, điện thoại…).</span>
            </span>
          </label>
        )}
      </form>
    </Dialog>
  );
}
