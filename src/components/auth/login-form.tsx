"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { AlertCircle, Eye, EyeOff, Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Field, Input } from "@/components/ui/field";
import { apiFetch } from "@/lib/api-client";
import { useI18n } from "@/i18n/provider";
import type { SessionUser } from "@/lib/auth/session";

const REASONS = ["expired", "disabled", "required"] as const;

/** Chỉ cho phép chuyển hướng về đường dẫn nội bộ (chống open redirect). */
function safeNext(next: string | null, fallback: string): string {
  return next && next.startsWith("/") && !next.startsWith("//") && !next.startsWith("/api") ? next : fallback;
}

export function LoginForm({ portal }: { portal: "student" | "admin" }) {
  const router = useRouter();
  const params = useSearchParams();
  const { t, fmt } = useI18n();
  const l = t.auth;
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const reasonKey = REASONS.find((r) => r === params.get("reason"));
  const reason = reasonKey ? l.reasons[reasonKey] : null;

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const next = {
      email: /^\S+@\S+\.\S+$/.test(email.trim()) ? undefined : t.validation.emailInvalid,
      password: password ? undefined : t.validation.passwordRequired,
    };
    setErrors(next);
    setFormError(null);
    if (next.email || next.password) return;

    setLoading(true);
    try {
      const { user } = await apiFetch<{ user: SessionUser }>("/api/auth/login", {
        method: "POST",
        body: { email: email.trim(), password, portal },
        skipAuthRedirect: true,
      });
      const home = user.role === "admin" ? "/admin" : "/dashboard";
      router.replace(safeNext(params.get("next"), home));
      router.refresh();
    } catch (error) {
      setFormError(fmt.error(error) || l.loginFailed);
      setLoading(false);
    }
  };

  return (
    <form noValidate onSubmit={submit} className="space-y-4">
      {reason && !formError && (
        <p className="flex items-start gap-2 rounded-md bg-info-soft px-3 py-2.5 text-[13px] text-info" role="status">
          <Info className="mt-0.5 size-4 shrink-0" aria-hidden /> {reason}
        </p>
      )}
      {formError && (
        <p className="flex items-start gap-2 rounded-md bg-danger-soft px-3 py-2.5 text-[13px] text-danger" role="alert">
          <AlertCircle className="mt-0.5 size-4 shrink-0" aria-hidden /> {formError}
        </p>
      )}
      <Field label={l.email} error={errors.email}>
        {(p) => <Input {...p} type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder={l.emailPlaceholder} autoFocus />}
      </Field>
      <Field label={l.password} error={errors.password}>
        {(p) => (
          <div className="relative">
            <Input {...p} type={showPassword ? "text" : "password"} autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} className="pr-10" />
            <button
              type="button"
              onClick={() => setShowPassword((v) => !v)}
              aria-label={showPassword ? l.hidePassword : l.showPassword}
              className="absolute top-1/2 right-2 -translate-y-1/2 rounded p-1 text-subtle hover:text-foreground"
            >
              {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
            </button>
          </div>
        )}
      </Field>
      <Button type="submit" size="lg" className="w-full" loading={loading}>
        {portal === "admin" ? l.submitAdmin : l.submitLogin}
      </Button>
    </form>
  );
}
