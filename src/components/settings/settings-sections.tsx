"use client";

import { useState } from "react";
import { Monitor, Moon, Sun, Trash2 } from "lucide-react";
import { CategoryIcon } from "@/components/common/category-icon";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Field, Input, Select } from "@/components/ui/field";
import { MoneyInput } from "@/components/ui/money-input";
import { Segmented } from "@/components/ui/segmented";
import { useTheme, type FontSize } from "@/context/ThemeContext";
import { useToast } from "@/context/ToastContext";
import { useCategories, useCategoryMutations } from "@/hooks/use-categories";
import { useProfileMutations } from "@/hooks/use-profile";
import { ApiClientError, errorMessage } from "@/lib/api-client";
import { APP_TIMEZONE } from "@/lib/utils/date";
import { formatCurrencyInput, parseCurrencyInput } from "@/lib/utils/money";
import type { ProfileDTO, TransactionType } from "@/types/finance";

export function ProfileSection({ profile }: { profile: ProfileDTO }) {
  const { update } = useProfileMutations();
  const { toast } = useToast();
  const [name, setName] = useState(profile.name);
  const [academicYear, setAcademicYear] = useState(profile.academicYear ?? "");
  const [error, setError] = useState<string>();
  const [saving, setSaving] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (name.trim().length < 2) return setError("Họ tên cần ít nhất 2 ký tự.");
    setError(undefined);
    setSaving(true);
    try {
      await update({ name: name.trim(), academic_year: academicYear.trim() || null });
      toast.success("Đã lưu hồ sơ");
    } catch (err) {
      toast.error("Không thể lưu hồ sơ", errorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  return (
    <Card>
      <CardHeader title="Hồ sơ" description="Thông tin hiển thị trong ứng dụng." />
      <CardContent>
        <form noValidate onSubmit={submit} className="grid gap-4 sm:grid-cols-2">
          <Field label="Họ tên" error={error} required>
            {(p) => <Input {...p} value={name} onChange={(e) => setName(e.target.value)} maxLength={80} />}
          </Field>
          <Field label="Email" hint="Email đăng nhập không thể thay đổi.">
            {(p) => <Input {...p} value={profile.email} disabled readOnly />}
          </Field>
          <Field label="Năm học / Ngành" className="sm:col-span-2">
            {(p) => <Input {...p} value={academicYear} onChange={(e) => setAcademicYear(e.target.value)} placeholder="VD: Năm 2 – Kinh tế" maxLength={80} />}
          </Field>
          <div className="sm:col-span-2">
            <Button type="submit" loading={saving}>
              Lưu hồ sơ
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}

export function AppearanceSection() {
  const { theme, setTheme, fontSize, setFontSize } = useTheme();
  return (
    <Card>
      <CardHeader title="Giao diện" description="Chế độ màu và cỡ chữ được lưu trên trình duyệt này." />
      <CardContent className="space-y-5">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-medium text-foreground">Chế độ màu</p>
            <p className="text-[12px] text-muted">Mặc định theo cài đặt hệ điều hành.</p>
          </div>
          <div className="flex gap-2">
            <Button variant={theme === "light" ? "secondary" : "outline"} onClick={() => setTheme("light")} aria-pressed={theme === "light"}>
              <Sun /> Sáng
            </Button>
            <Button variant={theme === "dark" ? "secondary" : "outline"} onClick={() => setTheme("dark")} aria-pressed={theme === "dark"}>
              <Moon /> Tối
            </Button>
          </div>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-medium text-foreground">Cỡ chữ</p>
            <p className="text-[12px] text-muted">Tăng cỡ chữ toàn ứng dụng để dễ đọc hơn.</p>
          </div>
          <Segmented<FontSize>
            label="Cỡ chữ"
            value={fontSize}
            onChange={setFontSize}
            options={[
              { value: "normal", label: "Chuẩn" },
              { value: "large", label: "Lớn" },
              { value: "larger", label: "Rất lớn" },
            ]}
            size="md"
          />
        </div>
      </CardContent>
    </Card>
  );
}

export function RegionSection() {
  return (
    <Card>
      <CardHeader title="Tiền tệ & khu vực" icon={<Monitor />} />
      <CardContent className="grid gap-4 text-sm sm:grid-cols-3">
        <div>
          <p className="text-[12px] text-muted">Tiền tệ</p>
          <p className="mt-0.5 font-medium text-foreground">Việt Nam Đồng (VND)</p>
          <p className="tabular text-[12px] text-subtle">1.250.000 ₫</p>
        </div>
        <div>
          <p className="text-[12px] text-muted">Định dạng ngày</p>
          <p className="mt-0.5 font-medium text-foreground">dd/MM/yyyy</p>
        </div>
        <div>
          <p className="text-[12px] text-muted">Múi giờ</p>
          <p className="mt-0.5 font-medium text-foreground">{APP_TIMEZONE} (GMT+7)</p>
        </div>
      </CardContent>
    </Card>
  );
}

export function FinanceSection({ profile }: { profile: ProfileDTO }) {
  const { update } = useProfileMutations();
  const { toast } = useToast();
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
      toast.success("Đã lưu thiết lập tài chính");
    } catch (err) {
      toast.error("Không thể lưu", errorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  return (
    <Card>
      <CardHeader title="Thiết lập tài chính" description="Dùng để tính Số tiền có thể chi và dự báo cuối tháng." />
      <CardContent>
        <form noValidate onSubmit={submit} className="grid gap-4 sm:grid-cols-3">
          <Field label="Thu nhập cơ bản / tháng" hint="Trợ cấp, lương làm thêm dự kiến.">
            {(p) => <MoneyInput {...p} value={allowance} onValueChange={setAllowance} placeholder="0" />}
          </Field>
          <Field label="Tiết kiệm mỗi tháng" hint="Số tiền muốn giữ lại cuối tháng.">
            {(p) => <MoneyInput {...p} value={savings} onValueChange={setSavings} placeholder="0" />}
          </Field>
          <Field label="Ngày nhận tiền">
            {(p) => (
              <Select {...p} value={payDay} onChange={(e) => setPayDay(Number(e.target.value))}>
                {Array.from({ length: 31 }, (_, i) => i + 1).map((d) => (
                  <option key={d} value={d}>
                    Ngày {d}
                  </option>
                ))}
              </Select>
            )}
          </Field>
          <div className="sm:col-span-3">
            <Button type="submit" loading={saving}>
              Lưu thiết lập
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}

export function CategoriesSection() {
  const { data } = useCategories();
  const { create, remove } = useCategoryMutations();
  const { toast, confirm } = useToast();
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
      toast.success("Đã thêm danh mục");
    } catch (err) {
      toast.error("Không thể thêm danh mục", errorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  const del = async (id: number, label: string) => {
    const ok = await confirm({ title: "Xóa danh mục?", message: `Xóa danh mục "${label}".`, confirmText: "Xóa", isDestructive: true });
    if (!ok) return;
    try {
      await remove(id);
      toast.success("Đã xóa danh mục");
    } catch (err) {
      toast.error("Không thể xóa danh mục", errorMessage(err));
    }
  };

  return (
    <Card>
      <CardHeader title="Danh mục cá nhân" description="Thêm danh mục riêng ngoài danh mục mặc định của hệ thống." />
      <CardContent className="space-y-4">
        <form noValidate onSubmit={add} className="flex flex-col gap-2 sm:flex-row">
          <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Tên danh mục mới" aria-label="Tên danh mục mới" maxLength={80} className="sm:flex-1" />
          <Segmented label="Loại danh mục" value={type} onChange={setType} options={[{ value: "expense", label: "Chi" }, { value: "income", label: "Thu" }]} size="md" />
          <Button type="submit" loading={saving} disabled={!name.trim()}>
            Thêm
          </Button>
        </form>
        {own.length === 0 ? (
          <p className="text-[13px] text-muted">Bạn chưa có danh mục riêng.</p>
        ) : (
          <ul className="divide-y divide-border">
            {own.map((c) => (
              <li key={c.id} className="flex items-center gap-3 py-2.5">
                <CategoryIcon icon={c.icon} color={c.color} size="sm" />
                <span className="flex-1 text-sm text-foreground">{c.name}</span>
                <Badge tone={c.type === "income" ? "success" : "neutral"}>{c.type === "income" ? "Thu" : "Chi"}</Badge>
                <Button variant="ghost" size="icon-sm" onClick={() => del(c.id, c.name)} aria-label={`Xóa danh mục ${c.name}`}>
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

export function SecuritySection() {
  const { changePassword } = useProfileMutations();
  const { toast } = useToast();
  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [confirmValue, setConfirmValue] = useState("");
  const [errors, setErrors] = useState<Record<string, string | undefined>>({});
  const [saving, setSaving] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const found = {
      current: current ? undefined : "Nhập mật khẩu hiện tại.",
      next: next.length >= 8 && /[A-Za-z]/.test(next) && /\d/.test(next) ? undefined : "Tối thiểu 8 ký tự, gồm cả chữ và số.",
      confirm: next === confirmValue ? undefined : "Mật khẩu nhập lại không khớp.",
    };
    setErrors(found);
    if (Object.values(found).some(Boolean)) return;
    setSaving(true);
    try {
      await changePassword(current, next);
      setCurrent("");
      setNext("");
      setConfirmValue("");
      toast.success("Đã đổi mật khẩu");
    } catch (err) {
      if (err instanceof ApiClientError && err.fields) setErrors({ current: err.fields.currentPassword, next: err.fields.newPassword });
      toast.error("Không thể đổi mật khẩu", errorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  return (
    <Card>
      <CardHeader title="Bảo mật" description="Đổi mật khẩu đăng nhập." />
      <CardContent>
        <form noValidate onSubmit={submit} className="grid gap-4 sm:grid-cols-3">
          <Field label="Mật khẩu hiện tại" error={errors.current}>
            {(p) => <Input {...p} type="password" autoComplete="current-password" value={current} onChange={(e) => setCurrent(e.target.value)} />}
          </Field>
          <Field label="Mật khẩu mới" error={errors.next}>
            {(p) => <Input {...p} type="password" autoComplete="new-password" value={next} onChange={(e) => setNext(e.target.value)} />}
          </Field>
          <Field label="Nhập lại mật khẩu mới" error={errors.confirm}>
            {(p) => <Input {...p} type="password" autoComplete="new-password" value={confirmValue} onChange={(e) => setConfirmValue(e.target.value)} />}
          </Field>
          <div className="sm:col-span-3">
            <Button type="submit" loading={saving}>
              Đổi mật khẩu
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}

const NOTIFICATION_OPTIONS: { key: keyof ProfileDTO["notifications"]; label: string; description: string }[] = [
  { key: "budget", label: "Ngân sách", description: "Khi chi tiêu chạm 80% hoặc vượt ngân sách." },
  { key: "recurring", label: "Khoản định kỳ", description: "Khi một khoản định kỳ được tự động ghi nhận." },
  { key: "goal", label: "Mục tiêu", description: "Khi đạt 50% và 100% mục tiêu tiết kiệm." },
  { key: "unusual", label: "Chi tiêu bất thường", description: "Khi một khoản chi cao hơn mức thường thấy." },
];

export function NotificationSection({ profile }: { profile: ProfileDTO }) {
  const { update } = useProfileMutations();
  const { toast } = useToast();
  const [prefs, setPrefs] = useState(profile.notifications);

  const toggle = async (key: keyof ProfileDTO["notifications"]) => {
    const next = { ...prefs, [key]: !prefs[key] };
    setPrefs(next);
    try {
      await update({ notifications: next });
    } catch (err) {
      setPrefs(prefs);
      toast.error("Không thể lưu tùy chọn", errorMessage(err));
    }
  };

  return (
    <Card>
      <CardHeader title="Thông báo" description="Chọn loại thông báo bạn muốn nhận trong ứng dụng." />
      <CardContent className="divide-y divide-border pt-2">
        {NOTIFICATION_OPTIONS.map((o) => (
          <label key={o.key} className="flex cursor-pointer items-center justify-between gap-4 py-3">
            <span>
              <span className="block text-sm font-medium text-foreground">{o.label}</span>
              <span className="block text-[12px] text-muted">{o.description}</span>
            </span>
            <input type="checkbox" role="switch" checked={prefs[o.key]} onChange={() => toggle(o.key)} className="size-4 accent-primary" aria-checked={prefs[o.key]} />
          </label>
        ))}
      </CardContent>
    </Card>
  );
}
