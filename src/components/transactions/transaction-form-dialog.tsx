"use client";

import { useEffect, useId, useMemo, useState } from "react";
import { Lightbulb, Repeat } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { Field, Input, Select } from "@/components/ui/field";
import { MoneyInput } from "@/components/ui/money-input";
import { Segmented } from "@/components/ui/segmented";
import { Skeleton } from "@/components/ui/skeleton";
import { CategoryPicker } from "./category-picker";
import { useToast } from "@/context/ToastContext";
import { useCategories, suggestCategory } from "@/hooks/use-categories";
import { useTransactionMutations } from "@/hooks/use-transactions";
import { useRecurringMutations } from "@/hooks/use-recurring";
import { useDebounce } from "@/hooks/use-debounce";
import { ApiClientError } from "@/lib/api-client";
import { MAX_DESCRIPTION_LENGTH, RECURRING_FREQUENCIES, type RecurringFrequency } from "@/constants/finance";
import { useI18n } from "@/i18n/provider";
import { formatCurrencyInput, formatVND, parseCurrencyInput } from "@/lib/utils/money";
import { formatDate, todayYmd, toYmd } from "@/lib/utils/date";
import type { CategorySuggestion, TransactionDTO, TransactionType } from "@/types/finance";

export interface TransactionFormDefaults {
  type?: TransactionType;
  categoryId?: number;
}

interface Props {
  open: boolean;
  onClose: () => void;
  transaction?: TransactionDTO | null;
  defaults?: TransactionFormDefaults;
}

type Errors = Partial<Record<"amount" | "description" | "category" | "date", string>>;

const SUGGEST_MIN_CHARS = 2;

export function TransactionFormDialog({ open, onClose, transaction, defaults }: Props) {
  const editing = !!transaction;
  const { toast, confirm } = useToast();
  const { t, fmt } = useI18n();
  const f = t.transactions.form;
  const { data: categories, isLoading: loadingCategories } = useCategories();
  const { create, update, check } = useTransactionMutations();
  const { create: createRecurring } = useRecurringMutations();
  const categoryLabelId = useId();

  // State khởi tạo từ props; provider đổi `key` mỗi lần mở nên form luôn bắt đầu sạch.
  const [type, setType] = useState<TransactionType>(transaction?.type ?? defaults?.type ?? "expense");
  const [amount, setAmount] = useState(transaction ? formatCurrencyInput(transaction.amount) : "");
  const [description, setDescription] = useState(transaction?.description ?? "");
  const [categoryId, setCategoryId] = useState<number | null>(transaction?.categoryId ?? defaults?.categoryId ?? null);
  const [categoryTouched, setCategoryTouched] = useState(!!transaction || !!defaults?.categoryId);
  const [date, setDate] = useState(() => (transaction ? toYmd(new Date(transaction.date)) : todayYmd()));
  const [recurring, setRecurring] = useState(false);
  const [frequency, setFrequency] = useState<RecurringFrequency>("monthly");
  const [fetchedSuggestion, setFetchedSuggestion] = useState<{ text: string; value: CategorySuggestion | null } | null>(null);
  const [errors, setErrors] = useState<Errors>({});
  const [saving, setSaving] = useState(false);

  const visibleCategories = useMemo(() => (categories ?? []).filter((c) => c.type === type), [categories, type]);

  const debouncedDescription = useDebounce(description.trim(), 300);
  const canSuggest = open && debouncedDescription.length >= SUGGEST_MIN_CHARS;
  const suggestionKey = `${type}:${debouncedDescription}`;
  const suggestion = canSuggest && fetchedSuggestion?.text === suggestionKey ? fetchedSuggestion.value : null;

  useEffect(() => {
    if (!canSuggest) return;
    const key = suggestionKey;
    let cancelled = false;
    suggestCategory(debouncedDescription, type)
      .then((value) => {
        if (cancelled) return;
        setFetchedSuggestion({ text: key, value });
        // Chỉ tự điền khi user chưa tự chọn danh mục; user luôn có quyền đổi lại.
        if (value && !categoryTouched) setCategoryId(value.categoryId);
      })
      .catch(() => undefined);
    return () => {
      cancelled = true;
    };
  }, [canSuggest, suggestionKey, debouncedDescription, type, categoryTouched]);

  const changeType = (next: TransactionType) => {
    setType(next);
    if (categories?.find((c) => c.id === categoryId)?.type !== next) {
      setCategoryId(null);
      setCategoryTouched(false);
    }
  };

  const validate = (): Errors => {
    const next: Errors = {};
    if (parseCurrencyInput(amount) <= 0) next.amount = t.validation.amountPositive;
    if (!description.trim()) next.description = t.validation.descriptionRequired;
    if (!categoryId) next.category = t.validation.categoryRequired;
    if (!date) next.date = t.validation.dateRequired;
    return next;
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const found = validate();
    setErrors(found);
    if (Object.keys(found).length > 0 || !categoryId) return;

    const input = {
      amount: parseCurrencyInput(amount),
      type,
      description: description.trim(),
      category_id: categoryId,
      date,
    };

    setSaving(true);
    try {
      if (!recurring) {
        const warnings = await check(input, transaction?.id);
        if (warnings.duplicate) {
          const proceed = await confirm({
            title: f.duplicateTitle,
            message: f.duplicateMessage(input.description, formatVND(input.amount), formatDate(warnings.duplicate.date)),
            confirmText: f.duplicateConfirm,
            cancelText: f.checkAgain,
          });
          if (!proceed) return;
        }
        if (warnings.unusual) {
          const proceed = await confirm({
            title: f.unusualTitle,
            message: f.unusualMessage(formatVND(warnings.unusual.typicalAmount)),
            confirmText: f.unusualConfirm,
            cancelText: f.fixIt,
          });
          if (!proceed) return;
        }
      }

      if (editing && transaction) {
        await update(transaction.id, input);
        toast.success(f.updated);
      } else if (recurring) {
        await createRecurring({
          name: input.description,
          amount: input.amount,
          type,
          category_id: categoryId,
          frequency,
          start_date: date,
        });
        toast.success(f.recurringCreated, `${t.recurring.frequencies[frequency]} · ${formatVND(input.amount)}`);
      } else {
        await create({ ...input, suggested_category_id: suggestion?.categoryId ?? null });
        toast.success(type === "income" ? f.savedIncome : f.savedExpense, `${formatVND(input.amount)} · ${input.description}`);
      }
      onClose();
    } catch (error) {
      if (error instanceof ApiClientError && error.fields) {
        setErrors({
          amount: fmt.fieldError(error.fields.amount),
          description: fmt.fieldError(error.fields.description),
          category: fmt.fieldError(error.fields.category_id),
          date: fmt.fieldError(error.fields.date),
        });
      }
      toast.error(f.saveFailed, fmt.error(error));
    } finally {
      setSaving(false);
    }
  };

  const suggestionName = suggestion && suggestion.categoryId !== categoryId ? fmt.category(suggestion.categoryName) : null;

  return (
    <Dialog
      open={open}
      onClose={onClose}
      title={editing ? f.editTitle : f.addTitle}
      footer={
        <>
          <Button variant="outline" onClick={onClose} disabled={saving}>
            {t.common.cancel}
          </Button>
          <Button type="submit" form="transaction-form" loading={saving}>
            {editing ? t.common.saveChanges : f.submitAdd}
          </Button>
        </>
      }
    >
      <form id="transaction-form" noValidate onSubmit={submit} className="space-y-5">
        <Segmented
          label={f.type}
          value={type}
          onChange={changeType}
          options={[
            { value: "expense", label: t.common.expense },
            { value: "income", label: t.common.income },
          ]}
          size="md"
          fullWidth
        />

        <Field label={f.amount} error={errors.amount} required>
          {(p) => (
            <MoneyInput {...p} size="xl" value={amount} onValueChange={setAmount} placeholder="0" data-autofocus />
          )}
        </Field>

        <Field
          label={f.description}
          error={errors.description}
          required
          hint={
            suggestionName ? (
              <button
                type="button"
                onClick={() => {
                  setCategoryId(suggestion!.categoryId);
                  setCategoryTouched(true);
                }}
                className="inline-flex items-center gap-1 rounded text-primary hover:underline"
              >
                <Lightbulb className="size-3.5" aria-hidden /> {f.suggestion(suggestionName)}
              </button>
            ) : undefined
          }
        >
          {(p) => (
            <Input
              {...p}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              maxLength={MAX_DESCRIPTION_LENGTH}
              placeholder={type === "expense" ? f.expensePlaceholder : f.incomePlaceholder}
            />
          )}
        </Field>

        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <span id={categoryLabelId} className="text-[13px] font-medium text-foreground">
              {f.category}<span className="ml-0.5 text-danger" aria-hidden>*</span>
            </span>
            {suggestion && suggestion.categoryId === categoryId && !categoryTouched && (
              <span className="text-[12px] text-subtle">{f.suggestedNote}</span>
            )}
          </div>
          {loadingCategories ? (
            <div className="grid grid-cols-3 gap-1.5 sm:grid-cols-4">
              {Array.from({ length: 8 }, (_, i) => (
                <Skeleton key={i} className="h-17" />
              ))}
            </div>
          ) : (
            <CategoryPicker
              categories={visibleCategories}
              value={categoryId}
              onChange={(id) => {
                setCategoryId(id);
                setCategoryTouched(true);
              }}
              labelledBy={categoryLabelId}
              invalid={!!errors.category}
            />
          )}
          {errors.category && (
            <p className="text-[12px] text-danger" role="alert">
              {errors.category}
            </p>
          )}
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <Field label={recurring ? f.startFrom : f.date} error={errors.date} required>
            {(p) => <Input {...p} type="date" value={date} onChange={(e) => setDate(e.target.value)} />}
          </Field>
          {!editing && recurring && (
            <Field label={f.frequency}>
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
          )}
        </div>

        {editing ? (
          transaction?.isRecurring && (
            <p className="flex items-center gap-2 text-[13px] text-muted">
              <Repeat className="size-4" aria-hidden /> {f.recurringFromSchedule}
            </p>
          )
        ) : (
          <label className="flex cursor-pointer items-start gap-3 rounded-md border border-border p-3 transition-colors hover:bg-surface-hover">
            <input
              type="checkbox"
              checked={recurring}
              onChange={(e) => setRecurring(e.target.checked)}
              className="mt-0.5 size-4 accent-primary"
            />
            <span>
              <span className="block text-sm font-medium text-foreground">{f.recurringLabel}</span>
              <span className="block text-[12px] text-muted">
                {f.recurringHint}
              </span>
            </span>
          </label>
        )}
      </form>
    </Dialog>
  );
}
