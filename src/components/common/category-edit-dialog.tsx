"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { Field, Input } from "@/components/ui/field";
import { Segmented } from "@/components/ui/segmented";
import { useI18n } from "@/i18n/provider";
import { transactionTypeOptions } from "@/i18n/format";
import type { CategoryDTO, TransactionType } from "@/types/finance";

interface Props {
  category: CategoryDTO;
  /** Tên đang hiển thị (danh mục hệ thống được dịch theo ngôn ngữ). */
  displayName: string;
  /** Ghi chú riêng cho danh mục hệ thống (đổi tên ảnh hưởng tới gợi ý tự động). */
  hint?: string;
  /** Chỉ chứa các trường thực sự thay đổi. */
  onSave: (input: { name?: string; type?: TransactionType }) => Promise<void>;
  onClose: () => void;
}

/**
 * Sửa tên / loại thu-chi của danh mục (cá nhân hoặc hệ thống). Server từ chối đổi loại khi danh mục
 * đang được giao dịch, khoản định kỳ hoặc ngân sách dùng – lỗi hiển thị ngay trong form.
 */
export function CategoryEditDialog({ category, displayName, hint, onSave, onClose }: Props) {
  const { t, fmt } = useI18n();
  const l = t.categoryEdit;
  const [name, setName] = useState(displayName);
  const [type, setType] = useState<TransactionType>(category.type);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (saving) return;
    if (!name.trim()) return setError(t.validation.nameRequired);
    // Chỉ gửi trường đã đổi: tên hiển thị của danh mục hệ thống là bản dịch – lưu nguyên sẽ vô tình đổi tên gốc.
    const input = {
      ...(name.trim() !== displayName ? { name: name.trim() } : {}),
      ...(type !== category.type ? { type } : {}),
    };
    if (Object.keys(input).length === 0) return onClose();
    setSaving(true);
    setError(null);
    try {
      await onSave(input);
      onClose();
    } catch (err) {
      setError(fmt.error(err));
      setSaving(false);
    }
  };

  return (
    <Dialog
      open
      onClose={onClose}
      size="sm"
      title={l.title}
      description={hint}
      footer={
        <>
          <Button variant="outline" onClick={onClose} disabled={saving}>
            {t.common.cancel}
          </Button>
          <Button type="submit" form="category-edit-form" loading={saving}>
            {t.common.save}
          </Button>
        </>
      }
    >
      <form id="category-edit-form" noValidate onSubmit={submit} className="space-y-4">
        <Field label={l.name} error={error ?? undefined}>
          {(p) => <Input {...p} value={name} onChange={(e) => setName(e.target.value)} maxLength={80} />}
        </Field>
        <div className="space-y-1.5">
          <p className="text-[13px] font-medium text-foreground">{l.type}</p>
          <Segmented label={l.type} value={type} onChange={setType} options={transactionTypeOptions(t)} size="md" />
          <p className="text-[12px] text-muted">{l.typeHint}</p>
        </div>
      </form>
    </Dialog>
  );
}
