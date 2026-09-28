"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Field, Input } from "@/components/ui/field";
import { useToast } from "@/context/ToastContext";
import { PASSWORD_MIN_LENGTH } from "@/constants/finance";
import { apiFetch } from "@/lib/api-client";
import { useI18n } from "@/i18n/provider";
import { isStrongPassword } from "@/lib/validations/rules";

/** Form đặt mật khẩu mới từ link trong email (?token=...). */
export function ResetPasswordForm() {
  const router = useRouter();
  const params = useSearchParams();
  const { toast } = useToast();
  const { t, fmt } = useI18n();
  const l = t.auth;
  const token = params.get("token") ?? "";
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [errors, setErrors] = useState<{ password?: string; confirm?: string }>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  if (!token) {
    return (
      <div className="space-y-4">
        <p className="flex items-start gap-2 rounded-md bg-danger-soft px-3 py-2.5 text-[13px] text-danger" role="alert">
          <AlertCircle className="mt-0.5 size-4 shrink-0" aria-hidden /> {l.resetMissingToken}
        </p>
        <Link href="/forgot-password" className="block text-center text-sm font-medium text-primary-ink hover:underline">
          {l.requestNewLink}
        </Link>
      </div>
    );
  }

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const next = {
      password: isStrongPassword(password) ? undefined : t.validation.passwordRule(PASSWORD_MIN_LENGTH),
      confirm: password === confirmPassword ? undefined : t.validation.passwordMismatch,
    };
    setErrors(next);
    setFormError(null);
    if (next.password || next.confirm) return;

    setLoading(true);
    try {
      await apiFetch("/api/auth/reset-password", { method: "POST", body: { token, password }, skipAuthRedirect: true });
      toast.success(l.resetDone);
      router.replace("/login");
    } catch (err) {
      setFormError(fmt.error(err));
      setLoading(false);
    }
  };

  return (
    <form noValidate onSubmit={submit} className="space-y-4">
      {formError && (
        <div className="space-y-2 rounded-md bg-danger-soft px-3 py-2.5 text-[13px] text-danger" role="alert">
          <p className="flex items-start gap-2">
            <AlertCircle className="mt-0.5 size-4 shrink-0" aria-hidden /> {formError}
          </p>
          <Link href="/forgot-password" className="inline-block font-medium underline">
            {l.requestNewLink}
          </Link>
        </div>
      )}
      <Field label={l.newPassword} error={errors.password} hint={l.passwordHint(PASSWORD_MIN_LENGTH)}>
        {(p) => <Input {...p} type="password" autoComplete="new-password" value={password} onChange={(e) => setPassword(e.target.value)} autoFocus />}
      </Field>
      <Field label={l.confirmPassword} error={errors.confirm}>
        {(p) => <Input {...p} type="password" autoComplete="new-password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} />}
      </Field>
      <Button type="submit" size="lg" className="w-full" loading={loading}>
        {l.resetSubmit}
      </Button>
    </form>
  );
}
