"use client";

import { useState } from "react";
import { History, Lightbulb, Megaphone, Pencil, Trash2 } from "lucide-react";
import { CategoryEditDialog } from "@/components/common/category-edit-dialog";
import { CategoryIcon } from "@/components/common/category-icon";
import { ErrorState } from "@/components/common/states";
import { PageHeader } from "@/components/layout/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Field, Input, Textarea } from "@/components/ui/field";
import { MoneyInput } from "@/components/ui/money-input";
import { Segmented } from "@/components/ui/segmented";
import { SkeletonRows } from "@/components/ui/skeleton";
import { useToast } from "@/context/ToastContext";
import { useAdminAudits, useAdminCategories, useAdminMutations, type AdminCategory } from "@/hooks/use-admin";
import { useSystemTips, useTipMutations } from "@/hooks/use-tips";
import { useI18n } from "@/i18n/provider";
import { transactionTypeOptions } from "@/i18n/format";
import { formatDateTime } from "@/lib/utils/date";
import { formatNumber, parseCurrencyInput } from "@/lib/utils/money";
import type { TransactionType } from "@/types/finance";

function DefaultCategories() {
  const { data, error, reload } = useAdminCategories();
  const { createCategory, updateCategory, deleteCategory } = useAdminMutations();
  const [editing, setEditing] = useState<AdminCategory | null>(null);
  const { toast, confirm } = useToast();
  const { t, fmt } = useI18n();
  const l = t.admin.system;
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
      toast.success(l.added);
    } catch (err) {
      toast.error(l.addFailed, fmt.error(err));
    } finally {
      setSaving(false);
    }
  };

  const remove = async (id: number, label: string, usage: number) => {
    if (usage > 0) {
      toast.warning(l.inUseTitle, l.inUse(label, formatNumber(usage)));
      return;
    }
    const ok = await confirm({ title: l.deleteTitle, message: l.deleteMessage(label), confirmText: t.common.delete, isDestructive: true });
    if (!ok) return;
    try {
      await deleteCategory(id);
      toast.success(l.deleted);
    } catch (err) {
      toast.error(l.deleteFailed, fmt.error(err));
    }
  };

  return (
    <Card>
      <CardHeader title={l.categories} description={l.categoriesHint} />
      <CardContent className="space-y-4">
        <form noValidate onSubmit={add} className="flex flex-col gap-2 sm:flex-row">
          <Input value={name} onChange={(e) => setName(e.target.value)} placeholder={l.categoryName} aria-label={l.categoryName} maxLength={80} className="sm:flex-1" />
          <Segmented
            label={l.type}
            value={type}
            onChange={setType}
            options={transactionTypeOptions(t)}
            size="md"
          />
          <Button type="submit" loading={saving} disabled={!name.trim()}>
            {t.common.add}
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
                <span className="flex-1 text-sm text-foreground">{fmt.category(c.name)}</span>
                <span className="tabular text-[12px] text-subtle">{l.usage(formatNumber(c.usage))}</span>
                <Badge tone={c.type === "income" ? "success" : "neutral"}>{c.type === "income" ? t.common.incomeShort : t.common.expenseShort}</Badge>
                <Button variant="ghost" size="icon-sm" onClick={() => setEditing(c)} aria-label={t.categoryEdit.editLabel(fmt.category(c.name))}>
                  <Pencil />
                </Button>
                <Button variant="ghost" size="icon-sm" onClick={() => remove(c.id, fmt.category(c.name), c.usage)} aria-label={`${t.common.delete} ${fmt.category(c.name)}`}>
                  <Trash2 />
                </Button>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
      {editing && (
        <CategoryEditDialog
          category={editing}
          displayName={fmt.category(editing.name)}
          hint={t.categoryEdit.systemHint}
          onSave={async (input) => {
            await updateCategory(editing.id, input);
            toast.success(t.categoryEdit.saved);
          }}
          onClose={() => setEditing(null)}
        />
      )}
    </Card>
  );
}

function Announcement() {
  const { announce } = useAdminMutations();
  const { toast, confirm } = useToast();
  const { t, fmt } = useI18n();
  const l = t.admin.system;
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [errors, setErrors] = useState<{ title?: string; message?: string }>({});
  const [sending, setSending] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const next = { title: title.trim() ? undefined : t.validation.titleRequired, message: message.trim() ? undefined : t.validation.messageRequired };
    setErrors(next);
    if (next.title || next.message) return;
    const ok = await confirm({ title: l.sendTitle, message: l.sendMessage, confirmText: l.sendConfirm });
    if (!ok) return;
    setSending(true);
    try {
      const { sent } = await announce(title.trim(), message.trim());
      setTitle("");
      setMessage("");
      toast.success(l.sent(formatNumber(sent)));
    } catch (err) {
      toast.error(l.sendFailed, fmt.error(err));
    } finally {
      setSending(false);
    }
  };

  return (
    <Card>
      <CardHeader title={l.announcement} description={l.announcementHint} icon={<Megaphone />} />
      <CardContent>
        <form noValidate onSubmit={submit} className="space-y-4">
          <Field label={l.titleLabel} error={errors.title} required>
            {(p) => <Input {...p} value={title} onChange={(e) => setTitle(e.target.value)} maxLength={120} />}
          </Field>
          <Field label={l.messageLabel} error={errors.message} required>
            {(p) => <Textarea {...p} value={message} onChange={(e) => setMessage(e.target.value)} maxLength={1000} rows={4} />}
          </Field>
          <Button type="submit" loading={sending}>
            {l.send}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}

/** Mẫu mẹo tiết kiệm dùng chung (SRS 3.11): hiển thị cho mọi sinh viên bên cạnh mẹo tính từ dữ liệu cá nhân. */
function SystemTips() {
  const { data, error, reload } = useSystemTips();
  const { createSystemTip, deleteSystemTip } = useTipMutations();
  const { toast, confirm } = useToast();
  const { t, fmt } = useI18n();
  const l = t.admin.tips;
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [potential, setPotential] = useState("");
  const [errors, setErrors] = useState<{ title?: string; content?: string }>({});
  const [saving, setSaving] = useState(false);

  const add = async (e: React.FormEvent) => {
    e.preventDefault();
    if (saving) return;
    const found = {
      title: title.trim() ? undefined : t.validation.titleRequired,
      content: content.trim() ? undefined : t.validation.messageRequired,
    };
    setErrors(found);
    if (found.title || found.content) return;
    setSaving(true);
    try {
      const amount = parseCurrencyInput(potential);
      await createSystemTip({ title: title.trim(), content: content.trim(), potential_saving: amount > 0 ? amount : null });
      setTitle("");
      setContent("");
      setPotential("");
      toast.success(l.added);
    } catch (err) {
      toast.error(l.addFailed, fmt.error(err));
    } finally {
      setSaving(false);
    }
  };

  const remove = async (id: number, name: string) => {
    const ok = await confirm({ title: l.deleteTitle, message: l.deleteMessage(name), confirmText: t.common.delete, isDestructive: true });
    if (!ok) return;
    try {
      await deleteSystemTip(id);
      toast.success(l.deleted);
    } catch (err) {
      toast.error(l.deleteFailed, fmt.error(err));
    }
  };

  return (
    <Card>
      <CardHeader title={l.title} description={l.hint} icon={<Lightbulb />} />
      <CardContent className="space-y-4">
        <form noValidate onSubmit={add} className="space-y-3">
          <Field label={l.titleLabel} error={errors.title} required>
            {(p) => <Input {...p} value={title} onChange={(e) => setTitle(e.target.value)} maxLength={120} />}
          </Field>
          <Field label={l.contentLabel} error={errors.content} required>
            {(p) => <Textarea {...p} value={content} onChange={(e) => setContent(e.target.value)} maxLength={1000} rows={3} />}
          </Field>
          <Field label={l.potentialLabel}>
            {(p) => <MoneyInput {...p} value={potential} onValueChange={setPotential} placeholder="0" />}
          </Field>
          <Button type="submit" loading={saving}>
            {l.add}
          </Button>
        </form>
        {error ? (
          <ErrorState onRetry={reload} />
        ) : !data ? (
          <SkeletonRows rows={3} />
        ) : data.length === 0 ? (
          <p className="text-[13px] text-muted">{l.empty}</p>
        ) : (
          <ul className="divide-y divide-border">
            {data.map((tip) => (
              <li key={tip.id} className="flex items-start gap-3 py-2.5">
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-foreground">{tip.title}</p>
                  <p className="mt-0.5 line-clamp-2 text-[13px] text-muted">{tip.content}</p>
                </div>
                <Button variant="ghost" size="icon-sm" onClick={() => remove(tip.id, tip.title)} aria-label={`${t.common.delete} ${tip.title}`}>
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

/** Nhật ký quản trị: ai làm gì, lúc nào (không có dữ liệu nhạy cảm). */
function AuditLog() {
  const { data, error, reload } = useAdminAudits();
  const { t } = useI18n();
  const l = t.admin.audit;
  return (
    <Card className="xl:col-span-2">
      <CardHeader title={l.title} description={l.hint} icon={<History />} />
      <CardContent>
        {error ? (
          <ErrorState onRetry={reload} />
        ) : !data ? (
          <SkeletonRows rows={4} />
        ) : data.length === 0 ? (
          <p className="py-4 text-center text-sm text-muted">{l.empty}</p>
        ) : (
          <ul className="divide-y divide-border">
            {data.map((a) => (
              <li key={a.id} className="flex flex-col gap-0.5 py-2.5 text-sm sm:flex-row sm:items-center sm:justify-between sm:gap-4">
                <span className="min-w-0">
                  <span className="font-medium text-foreground">{l.actions[a.action] ?? a.action}</span>
                  <span className="text-muted"> · {l.by(a.actorName ?? l.unknownActor)}</span>
                </span>
                <span className="shrink-0 text-[12px] text-subtle">{formatDateTime(a.createdAt)}</span>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}

export default function AdminSystemPage() {
  const { t } = useI18n();
  return (
    <div>
      <PageHeader title={t.nav.adminSystem} description={t.admin.system.description} />
      <div className="grid gap-4 xl:grid-cols-2">
        <DefaultCategories />
        <Announcement />
        <SystemTips />
        <AuditLog />
      </div>
    </div>
  );
}
