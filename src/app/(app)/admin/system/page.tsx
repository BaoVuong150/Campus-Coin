"use client";

import { useState } from "react";
import { Megaphone, Trash2 } from "lucide-react";
import { CategoryIcon } from "@/components/common/category-icon";
import { ErrorState } from "@/components/common/states";
import { PageHeader } from "@/components/layout/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Field, Input, Textarea } from "@/components/ui/field";
import { Segmented } from "@/components/ui/segmented";
import { SkeletonRows } from "@/components/ui/skeleton";
import { useToast } from "@/context/ToastContext";
import { useAdminCategories, useAdminMutations } from "@/hooks/use-admin";
import { errorMessage } from "@/lib/api-client";
import { formatNumber } from "@/lib/utils/money";
import type { TransactionType } from "@/types/finance";

function DefaultCategories() {
  const { data, error, reload } = useAdminCategories();
  const { createCategory, deleteCategory } = useAdminMutations();
  const { toast, confirm } = useToast();
  const [name, setName] = useState("");
  const [type, setType] = useState<TransactionType>("expense");
  const [saving, setSaving] = useState(false);

  const add = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    setSaving(true);
    try {
      await createCategory({ name: name.trim(), type });
      setName("");
      toast.success("Đã thêm danh mục hệ thống");
    } catch (err) {
      toast.error("Không thể thêm danh mục", errorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  const remove = async (id: number, label: string, usage: number) => {
    if (usage > 0) {
      toast.warning("Không thể xóa", `"${label}" đang được dùng trong ${formatNumber(usage)} giao dịch.`);
      return;
    }
    const ok = await confirm({ title: "Xóa danh mục hệ thống?", message: `"${label}" sẽ biến mất khỏi danh sách của mọi người dùng.`, confirmText: "Xóa", isDestructive: true });
    if (!ok) return;
    try {
      await deleteCategory(id);
      toast.success("Đã xóa danh mục");
    } catch (err) {
      toast.error("Không thể xóa danh mục", errorMessage(err));
    }
  };

  return (
    <Card>
      <CardHeader title="Danh mục mặc định" description="Áp dụng cho toàn bộ người dùng." />
      <CardContent className="space-y-4">
        <form noValidate onSubmit={add} className="flex flex-col gap-2 sm:flex-row">
          <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Tên danh mục" aria-label="Tên danh mục" maxLength={80} className="sm:flex-1" />
          <Segmented label="Loại" value={type} onChange={setType} options={[{ value: "expense", label: "Chi" }, { value: "income", label: "Thu" }]} size="md" />
          <Button type="submit" loading={saving} disabled={!name.trim()}>
            Thêm
          </Button>
        </form>
        {error ? (
          <ErrorState onRetry={reload} />
        ) : !data ? (
          <SkeletonRows rows={5} />
        ) : (
          <ul className="divide-y divide-border">
            {data.map((c) => (
              <li key={c.id} className="flex items-center gap-3 py-2.5">
                <CategoryIcon icon={c.icon} color={c.color} size="sm" />
                <span className="flex-1 text-sm text-foreground">{c.name}</span>
                <span className="tabular text-[12px] text-subtle">{formatNumber(c.usage)} giao dịch</span>
                <Badge tone={c.type === "income" ? "success" : "neutral"}>{c.type === "income" ? "Thu" : "Chi"}</Badge>
                <Button variant="ghost" size="icon-sm" onClick={() => remove(c.id, c.name, c.usage)} aria-label={`Xóa ${c.name}`}>
                  <Trash2 />
                </Button>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}

function Announcement() {
  const { announce } = useAdminMutations();
  const { toast, confirm } = useToast();
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [errors, setErrors] = useState<{ title?: string; message?: string }>({});
  const [sending, setSending] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const next = { title: title.trim() ? undefined : "Nhập tiêu đề.", message: message.trim() ? undefined : "Nhập nội dung." };
    setErrors(next);
    if (next.title || next.message) return;
    const ok = await confirm({ title: "Gửi thông báo?", message: "Thông báo sẽ được gửi tới tất cả sinh viên đang hoạt động.", confirmText: "Gửi" });
    if (!ok) return;
    setSending(true);
    try {
      const { sent } = await announce(title.trim(), message.trim());
      setTitle("");
      setMessage("");
      toast.success(`Đã gửi tới ${formatNumber(sent)} người dùng`);
    } catch (err) {
      toast.error("Không thể gửi thông báo", errorMessage(err));
    } finally {
      setSending(false);
    }
  };

  return (
    <Card>
      <CardHeader title="Thông báo hệ thống" description="Gửi thông báo trong ứng dụng tới toàn bộ sinh viên." icon={<Megaphone />} />
      <CardContent>
        <form noValidate onSubmit={submit} className="space-y-4">
          <Field label="Tiêu đề" error={errors.title} required>
            {(p) => <Input {...p} value={title} onChange={(e) => setTitle(e.target.value)} maxLength={120} />}
          </Field>
          <Field label="Nội dung" error={errors.message} required>
            {(p) => <Textarea {...p} value={message} onChange={(e) => setMessage(e.target.value)} maxLength={1000} rows={4} />}
          </Field>
          <Button type="submit" loading={sending}>
            Gửi thông báo
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}

export default function AdminSystemPage() {
  return (
    <div>
      <PageHeader title="Hệ thống" description="Danh mục mặc định và thông báo toàn hệ thống." />
      <div className="grid gap-4 xl:grid-cols-2">
        <DefaultCategories />
        <Announcement />
      </div>
    </div>
  );
}
