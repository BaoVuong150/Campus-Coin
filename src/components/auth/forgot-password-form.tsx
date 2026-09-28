"use client";

import { useState } from "react";
import { AlertCircle, MailCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Field, Input } from "@/components/ui/field";
import { apiFetch } from "@/lib/api-client";
import { useI18n } from "@/i18n/provider";
import { isEmailLike } from "@/lib/validations/rules";

/** Form yêu cầu link đặt lại mật khẩu. Luôn hiện cùng một thông báo (không tiết lộ email có tồn tại). */
export function ForgotPasswordForm() {
  const { t, fmt } = useI18n();
  const l = t.auth;
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | undefined>();
  const [formError, setFormError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const emailError = isEmailLike(email) ? undefined : t.validation.emailInvalid;
    setError(emailError);
    setFormError(null);
    if (emailError) return;

    setLoading(true);
    try {
      await apiFetch("/api/auth/forgot-password", { method: "POST", body: { email: email.trim() }, skipAuthRedirect: true });
      setSent(true);
    } catch (err) {
      setFormError(fmt.error(err));
    } finally {
      setLoading(false);
    }
  };

  if (sent) {
    return (
      <p className="flex items-start gap-2 rounded-md bg-success-soft px-3 py-2.5 text-[13px] text-success" role="status">
        <MailCheck className="mt-0.5 size-4 shrink-0" aria-hidden /> {l.forgotSent}
      </p>
    );
  }

  return (
    <form noValidate onSubmit={submit} className="space-y-4">
      {formError && (
        <p className="flex items-start gap-2 rounded-md bg-danger-soft px-3 py-2.5 text-[13px] text-danger" role="alert">
          <AlertCircle className="mt-0.5 size-4 shrink-0" aria-hidden /> {formError}
        </p>
      )}
      <Field label={l.email} error={error}>
        {(p) => <Input {...p} type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder={l.emailPlaceholder} autoFocus />}
      </Field>
      <Button type="submit" size="lg" className="w-full" loading={loading}>
        {l.forgotSubmit}
      </Button>
    </form>
  );
}
