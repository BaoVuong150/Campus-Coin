"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Field, Input } from "@/components/ui/field";
import { useToast } from "@/context/ToastContext";
import { PASSWORD_MIN_LENGTH } from "@/constants/finance";
import { ApiClientError, apiFetch } from "@/lib/api-client";
import { useI18n } from "@/i18n/provider";
import { isStrongPassword } from "@/lib/validations/rules";

/** Đổi mật khẩu tạm do admin cấp (bắt buộc trước khi vào app). */
export function ForcePasswordForm({ home }: { home: string }) {
  const router = useRouter();
  const { toast } = useToast();
  const { t, fmt } = useI18n();
  const l = t.auth;
  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [confirmValue, setConfirmValue] = useState("");
  const [errors, setErrors] = useState<{ current?: string; next?: string; confirm?: string }>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const found = {
      current: current ? undefined : t.validation.currentPasswordRequired,
      next: isStrongPassword(next) ? undefined : t.validation.passwordRule(PASSWORD_MIN_LENGTH),
      confirm: next === confirmValue ? undefined : t.validation.passwordMismatch,
    };
    setErrors(found);
    setFormError(null);
    if (found.current || found.next || found.confirm) return;

    setLoading(true);
    try {
      await apiFetch("/api/auth/password", {
        method: "POST",
        body: { currentPassword: current, newPassword: next },
        skipAuthRedirect: true,
      });
      toast.success(l.forceChangeDone);
      router.replace(home);
      router.refresh();
    } catch (err) {
      if (err instanceof ApiClientError && err.fields) {
        setErrors({ current: fmt.fieldError(err.fields.currentPassword), next: fmt.fieldError(err.fields.newPassword) });
      }
      setFormError(fmt.error(err));
      setLoading(false);
    }
  };

  return (
    <form noValidate onSubmit={submit} className="space-y-4">
      {formError && (
        <p className="flex items-start gap-2 rounded-md bg-danger-soft px-3 py-2.5 text-[13px] text-danger" role="alert">
          <AlertCircle className="mt-0.5 size-4 shrink-0" aria-hidden /> {formError}
        </p>
      )}
      <Field label={l.temporaryPassword} error={errors.current}>
        {(p) => <Input {...p} type="password" autoComplete="current-password" value={current} onChange={(e) => setCurrent(e.target.value)} autoFocus />}
      </Field>
      <Field label={l.newPassword} error={errors.next} hint={l.passwordHint(PASSWORD_MIN_LENGTH)}>
        {(p) => <Input {...p} type="password" autoComplete="new-password" value={next} onChange={(e) => setNext(e.target.value)} />}
      </Field>
      <Field label={l.confirmPassword} error={errors.confirm}>
        {(p) => <Input {...p} type="password" autoComplete="new-password" value={confirmValue} onChange={(e) => setConfirmValue(e.target.value)} />}
      </Field>
      <Button type="submit" size="lg" className="w-full" loading={loading}>
        {l.forceChangeSubmit}
      </Button>
    </form>
  );
}
