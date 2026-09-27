"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Field, Input } from "@/components/ui/field";
import { MoneyInput } from "@/components/ui/money-input";
import { ApiClientError, apiFetch } from "@/lib/api-client";
import { useI18n } from "@/i18n/provider";
import { parseCurrencyInput } from "@/lib/utils/money";
import { PASSWORD_MIN_LENGTH } from "@/constants/finance";

type Errors = Partial<Record<"name" | "email" | "password" | "confirm", string>>;

export function RegisterForm() {
  const router = useRouter();
  const { t, fmt, locale } = useI18n();
  const l = t.auth;
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [allowance, setAllowance] = useState("");
  const [errors, setErrors] = useState<Errors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const next: Errors = {
      name: name.trim().length >= 2 ? undefined : t.validation.nameMin,
      email: /^\S+@\S+\.\S+$/.test(email.trim()) ? undefined : t.validation.emailInvalid,
      password:
        password.length >= PASSWORD_MIN_LENGTH && /[A-Za-z]/.test(password) && /\d/.test(password)
          ? undefined
          : t.validation.passwordRule(PASSWORD_MIN_LENGTH),
      confirm: password === confirm ? undefined : t.validation.passwordMismatch,
    };
    setErrors(next);
    setFormError(null);
    if (Object.values(next).some(Boolean)) return;

    setLoading(true);
    try {
      await apiFetch("/api/auth/register", {
        method: "POST",
        body: {
          name: name.trim(),
          email: email.trim(),
          password,
          monthly_allowance_baseline: parseCurrencyInput(allowance) || undefined,
        },
        skipAuthRedirect: true,
      });
      router.replace("/dashboard");
      router.refresh();
    } catch (error) {
      if (error instanceof ApiClientError && error.code === "EMAIL_TAKEN") setErrors({ email: t.errors.EMAIL_TAKEN });
      else if (error instanceof ApiClientError && error.fields && locale === "vi") setErrors(error.fields as Errors);
      setFormError(fmt.error(error) || l.registerFailed);
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
      <Field label={l.fullName} error={errors.name}>
        {(p) => <Input {...p} autoComplete="name" value={name} onChange={(e) => setName(e.target.value)} autoFocus />}
      </Field>
      <Field label={l.email} error={errors.email}>
        {(p) => <Input {...p} type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} />}
      </Field>
      <Field label={l.password} error={errors.password} hint={l.passwordHint(PASSWORD_MIN_LENGTH)}>
        {(p) => <Input {...p} type="password" autoComplete="new-password" value={password} onChange={(e) => setPassword(e.target.value)} />}
      </Field>
      <Field label={l.confirmPassword} error={errors.confirm}>
        {(p) => <Input {...p} type="password" autoComplete="new-password" value={confirm} onChange={(e) => setConfirm(e.target.value)} />}
      </Field>
      <Field label={l.monthlyIncome} hint={l.monthlyIncomeHint}>
        {(p) => <MoneyInput {...p} value={allowance} onValueChange={setAllowance} placeholder="0" />}
      </Field>
      <Button type="submit" size="lg" className="w-full" loading={loading}>
        {l.submitRegister}
      </Button>
    </form>
  );
}
