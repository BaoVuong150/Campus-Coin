"use client";

import { useState, type ReactNode } from "react";
import { Globe, LogOut, Moon, Pencil, Sun, Trash2 } from "lucide-react";
import { CategoryEditDialog } from "@/components/common/category-edit-dialog";
import { CategoryIcon } from "@/components/common/category-icon";
import { LanguageSelect } from "@/components/layout/language-switcher";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Field, Input, Select } from "@/components/ui/field";
import { MoneyInput } from "@/components/ui/money-input";
import { Segmented } from "@/components/ui/segmented";
import { PASSWORD_MIN_LENGTH } from "@/constants/finance";
import { isStrongPassword } from "@/lib/validations/rules";
import { transactionTypeOptions } from "@/i18n/format";
import { useTheme, type FontSize } from "@/context/ThemeContext";
import { useToast } from "@/context/ToastContext";
import { useCategories, useCategoryMutations } from "@/hooks/use-categories";
import { useProfileMutations } from "@/hooks/use-profile";
import { useI18n } from "@/i18n/provider";
import { ApiClientError } from "@/lib/api-client";
import { APP_TIMEZONE } from "@/lib/utils/date";
import { formatCurrencyInput, parseCurrencyInput } from "@/lib/utils/money";
import type { CategoryDTO, ProfileDTO, TransactionType } from "@/types/finance";

const PAY_DAYS = Array.from({ length: 31 }, (_, i) => i + 1);
const NOTIFICATION_KEYS = ["budget", "recurring", "goal", "unusual"] as const;

function SettingRow({ title, hint, children }: { title: string; hint: string; children: ReactNode }) {
  return (
    <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <p className="text-sm font-medium text-foreground">{title}</p>
        <p className="text-[12px] text-muted">{hint}</p>
      </div>
      {children}
    </div>
  );
}

export function ProfileSection({ profile }: { profile: ProfileDTO }) {
  const { update } = useProfileMutations();
  const { toast } = useToast();
  const { t, fmt } = useI18n();
  const l = t.settings.profile;
  const [name, setName] = useState(profile.name);
  const [academicYear, setAcademicYear] = useState(profile.academicYear ?? "");
  const [error, setError] = useState<string>();
  const [saving, setSaving] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (name.trim().length < 2) return setError(t.validation.nameMin);
    setError(undefined);
    setSaving(true);
    try {
      await update({ name: name.trim(), academic_year: academicYear.trim() || null });
      toast.success(l.saved);
    } catch (err) {
      toast.error(l.failed, fmt.error(err));
    } finally {
      setSaving(false);
    }
  };

  return (
    <Card>
      <CardHeader title={l.title} description={l.description} />
      <CardContent>
        <form noValidate onSubmit={submit} className="grid gap-4 sm:grid-cols-2">
          <Field label={l.name} error={error} required>
            {(p) => <Input {...p} value={name} onChange={(e) => setName(e.target.value)} maxLength={80} />}
          </Field>
          <Field label={l.email} hint={l.emailHint}>
            {(p) => <Input {...p} value={profile.email} disabled readOnly />}
          </Field>
          <Field label={l.academicYear} className="sm:col-span-2">
            {(p) => <Input {...p} value={academicYear} onChange={(e) => setAcademicYear(e.target.value)} placeholder={l.academicYearPlaceholder} maxLength={80} />}
          </Field>
          <div className="sm:col-span-2">
            <Button type="submit" loading={saving}>
              {l.save}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}

export function AppearanceSection() {
  const { theme, setTheme, fontSize, setFontSize } = useTheme();
  const { t } = useI18n();
  const l = t.settings.appearance;
  return (
    <Card>
      <CardHeader title={l.title} description={l.description} />
      <CardContent className="space-y-5">
        <SettingRow title={l.language} hint={l.languageHint}>
          <LanguageSelect />
        </SettingRow>
        <SettingRow title={l.theme} hint={l.themeHint}>
          <div className="flex gap-2">
            <Button variant={theme === "light" ? "secondary" : "outline"} onClick={() => setTheme("light")} aria-pressed={theme === "light"}>
              <Sun /> {l.light}
            </Button>
            <Button variant={theme === "dark" ? "secondary" : "outline"} onClick={() => setTheme("dark")} aria-pressed={theme === "dark"}>
              <Moon /> {l.dark}
            </Button>
          </div>
        </SettingRow>
        <SettingRow title={l.fontSize} hint={l.fontSizeHint}>
          <Segmented<FontSize>
            label={l.fontSize}
            value={fontSize}
            onChange={setFontSize}
            options={(["normal", "large", "larger"] as const).map((value) => ({ value, label: l.fontSizes[value] }))}
            size="md"
          />
        </SettingRow>
      </CardContent>
    </Card>
  );
}

export function RegionSection() {
  const { t } = useI18n();
  const l = t.settings.region;
  return (
    <Card>
      <CardHeader title={l.title} icon={<Globe />} />
      <CardContent className="grid gap-4 text-sm sm:grid-cols-3">
        <div>
          <p className="text-[12px] text-muted">{l.currency}</p>
          <p className="mt-0.5 font-medium text-foreground">{l.currencyValue}</p>
          <p className="tabular text-[12px] text-subtle">1.250.000 ₫</p>
        </div>
        <div>
          <p className="text-[12px] text-muted">{l.dateFormat}</p>
          <p className="mt-0.5 font-medium text-foreground">dd/MM/yyyy</p>
        </div>
        <div>
          <p className="text-[12px] text-muted">{l.timezone}</p>
          <p className="mt-0.5 font-medium text-foreground">{APP_TIMEZONE} (GMT+7)</p>
        </div>
      </CardContent>
    </Card>
  );
}

export function FinanceSection({ profile }: { profile: ProfileDTO }) {
  const { update } = useProfileMutations();
  const { toast } = useToast();
  const { t, fmt } = useI18n();
  const l = t.settings.finance;
  const [allowance, setAllowance] = useState(formatCurrencyInput(profile.monthlyAllowance));
  const [savings, setSavings] = useState(formatCurrencyInput(profile.monthlySavingsGoal));
  const [payDay, setPayDay] = useState(profile.salaryPayDay);
  const [saving, setSaving] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await update({
        monthly_allowance_baseline: parseCurrencyInput(allowance),
        monthly_savings_goal: parseCurrencyInput(savings),
        salary_pay_day: payDay,
      });
      toast.success(l.saved);
    } catch (err) {
      toast.error(l.failed, fmt.error(err));
    } finally {
      setSaving(false);
    }
  };

  return (
    <Card>
      <CardHeader title={l.title} description={l.description} />
      <CardContent>
        <form noValidate onSubmit={submit} className="grid gap-4 sm:grid-cols-3">
          <Field label={l.income} hint={l.incomeHint}>
            {(p) => <MoneyInput {...p} value={allowance} onValueChange={setAllowance} placeholder="0" />}
          </Field>
          <Field label={l.savings} hint={l.savingsHint}>
            {(p) => <MoneyInput {...p} value={savings} onValueChange={setSavings} placeholder="0" />}
          </Field>
          <Field label={l.payDay}>
            {(p) => (
              <Select {...p} value={payDay} onChange={(e) => setPayDay(Number(e.target.value))}>
                {PAY_DAYS.map((d) => (
                  <option key={d} value={d}>
                    {l.day(d)}
                  </option>
                ))}
              </Select>
            )}
          </Field>
          <div className="sm:col-span-3">
            <Button type="submit" loading={saving}>
              {l.save}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}

export function CategoriesSection() {
  const { data } = useCategories();
  const { create, update, remove } = useCategoryMutations();
  const [editing, setEditing] = useState<CategoryDTO | null>(null);
  const { toast, confirm } = useToast();
  const { t, fmt } = useI18n();
  const l = t.settings.categories;
  const [name, setName] = useState("");
  const [type, setType] = useState<TransactionType>("expense");
  const [saving, setSaving] = useState(false);
  const own = (data ?? []).filter((c) => !c.isDefault);

  const add = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    setSaving(true);
    try {
      await create({ name: name.trim(), type });
      setName("");
      toast.success(l.added);
    } catch (err) {
      toast.error(l.addFailed, fmt.error(err));
    } finally {
      setSaving(false);
    }
  };

  const del = async (id: number, label: string) => {
    const ok = await confirm({ title: l.deleteTitle, message: l.deleteMessage(label), confirmText: t.common.delete, isDestructive: true });
    if (!ok) return;
    try {
      await remove(id);
      toast.success(l.deleted);
    } catch (err) {
      toast.error(l.deleteFailed, fmt.error(err));
    }
  };

  return (
    <Card>
      <CardHeader title={l.title} description={l.description} />
      <CardContent className="space-y-4">
        <form noValidate onSubmit={add} className="flex flex-col gap-2 sm:flex-row">
          <Input value={name} onChange={(e) => setName(e.target.value)} placeholder={l.newName} aria-label={l.newName} maxLength={80} className="sm:flex-1" />
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
        {own.length === 0 ? (
          <p className="text-[13px] text-muted">{l.empty}</p>
        ) : (
          <ul className="divide-y divide-border">
            {own.map((c) => (
              <li key={c.id} className="flex items-center gap-3 py-2.5">
                <CategoryIcon icon={c.icon} color={c.color} size="sm" />
                <span className="flex-1 text-sm text-foreground">{c.name}</span>
                <Badge tone={c.type === "income" ? "success" : "neutral"}>{c.type === "income" ? t.common.incomeShort : t.common.expenseShort}</Badge>
                <Button variant="ghost" size="icon-sm" onClick={() => setEditing(c)} aria-label={t.categoryEdit.editLabel(c.name)}>
                  <Pencil />
                </Button>
                <Button variant="ghost" size="icon-sm" onClick={() => del(c.id, c.name)} aria-label={l.deleteLabel(c.name)}>
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
          displayName={editing.name}
          onSave={async (input) => {
            await update(editing.id, input);
            toast.success(t.categoryEdit.saved);
          }}
          onClose={() => setEditing(null)}
        />
      )}
    </Card>
  );
}

export function SecuritySection() {
  const { changePassword, signOutOtherDevices } = useProfileMutations();
  const { toast, confirm } = useToast();
  const { t, fmt } = useI18n();
  const l = t.settings.security;
  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [confirmValue, setConfirmValue] = useState("");
  const [errors, setErrors] = useState<Record<string, string | undefined>>({});
  const [saving, setSaving] = useState(false);
  const [revoking, setRevoking] = useState(false);

  const signOutOthers = async () => {
    const ok = await confirm({ title: l.signOutAllTitle, message: l.signOutAllMessage, confirmText: l.signOutAll, isDestructive: true });
    if (!ok) return;
    setRevoking(true);
    try {
      await signOutOtherDevices();
      toast.success(l.signOutAllDone);
    } catch (err) {
      toast.error(l.signOutAllFailed, fmt.error(err));
    } finally {
      setRevoking(false);
    }
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const found = {
      current: current ? undefined : t.validation.currentPasswordRequired,
      next: isStrongPassword(next) ? undefined : t.validation.passwordRule(PASSWORD_MIN_LENGTH),
      confirm: next === confirmValue ? undefined : t.validation.passwordMismatch,
    };
    setErrors(found);
    if (Object.values(found).some(Boolean)) return;
    setSaving(true);
    try {
      await changePassword(current, next);
      setCurrent("");
      setNext("");
      setConfirmValue("");
      toast.success(l.changed);
    } catch (err) {
      if (err instanceof ApiClientError && err.fields) {
        setErrors({ current: fmt.fieldError(err.fields.currentPassword), next: fmt.fieldError(err.fields.newPassword) });
      }
      toast.error(l.failed, fmt.error(err));
    } finally {
      setSaving(false);
    }
  };

  return (
    <Card>
      <CardHeader title={l.title} description={l.description} />
      <CardContent>
        <form noValidate onSubmit={submit} className="grid gap-4 sm:grid-cols-3">
          <Field label={l.current} error={errors.current}>
            {(p) => <Input {...p} type="password" autoComplete="current-password" value={current} onChange={(e) => setCurrent(e.target.value)} />}
          </Field>
          <Field label={l.new} error={errors.next}>
            {(p) => <Input {...p} type="password" autoComplete="new-password" value={next} onChange={(e) => setNext(e.target.value)} />}
          </Field>
          <Field label={l.confirm} error={errors.confirm}>
            {(p) => <Input {...p} type="password" autoComplete="new-password" value={confirmValue} onChange={(e) => setConfirmValue(e.target.value)} />}
          </Field>
          <div className="sm:col-span-3">
            <Button type="submit" loading={saving}>
              {l.submit}
            </Button>
          </div>
        </form>
        <div className="mt-6 flex flex-col gap-3 border-t border-border pt-5 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0">
            <p className="text-sm font-medium text-foreground">{l.signOutAll}</p>
            <p className="mt-0.5 text-[13px] text-muted">{l.signOutAllHint}</p>
          </div>
          <Button variant="outline" onClick={signOutOthers} loading={revoking} className="shrink-0">
            <LogOut /> {l.signOutAll}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

export function NotificationSection({ profile }: { profile: ProfileDTO }) {
  const { update } = useProfileMutations();
  const { toast } = useToast();
  const { t, fmt } = useI18n();
  const l = t.settings.notifications;
  const [prefs, setPrefs] = useState(profile.notifications);

  const toggle = async (key: (typeof NOTIFICATION_KEYS)[number]) => {
    const next = { ...prefs, [key]: !prefs[key] };
    setPrefs(next);
    try {
      await update({ notifications: next });
    } catch (err) {
      setPrefs(prefs);
      toast.error(l.failed, fmt.error(err));
    }
  };

  return (
    <Card>
      <CardHeader title={l.title} description={l.description} />
      <CardContent className="divide-y divide-border pt-2">
        {NOTIFICATION_KEYS.map((key) => {
          const [label, description] = l.options[key];
          return (
            <label key={key} className="flex cursor-pointer items-center justify-between gap-4 py-3">
              <span>
                <span className="block text-sm font-medium text-foreground">{label}</span>
                <span className="block text-[12px] text-muted">{description}</span>
              </span>
              <input type="checkbox" role="switch" checked={prefs[key]} onChange={() => toggle(key)} className="size-4 accent-primary" aria-checked={prefs[key]} />
            </label>
          );
        })}
      </CardContent>
    </Card>
  );
}
