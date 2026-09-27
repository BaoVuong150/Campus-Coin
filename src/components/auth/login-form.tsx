"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { AlertCircle, Eye, EyeOff, Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Field, Input } from "@/components/ui/field";
import { apiFetch, errorMessage } from "@/lib/api-client";
import type { SessionUser } from "@/lib/auth/session";

const REASONS: Record<string, string> = {
  expired: "Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.",
  disabled: "Tài khoản đã bị vô hiệu hóa. Vui lòng liên hệ quản trị viên.",
  required: "Vui lòng đăng nhập để tiếp tục.",
};

/** Chỉ cho phép chuyển hướng về đường dẫn nội bộ (chống open redirect). */
function safeNext(next: string | null, fallback: string): string {
  return next && next.startsWith("/") && !next.startsWith("//") && !next.startsWith("/api") ? next : fallback;
}

export function LoginForm({ portal }: { portal: "student" | "admin" }) {
  const router = useRouter();
  const params = useSearchParams();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const reason = REASONS[params.get("reason") ?? ""];

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const next = {
      email: /^\S+@\S+\.\S+$/.test(email.trim()) ? undefined : "Nhập email hợp lệ.",
      password: password ? undefined : "Nhập mật khẩu.",
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
      setFormError(errorMessage(error, "Đăng nhập không thành công."));
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
      <Field label="Email" error={errors.email}>
        {(p) => <Input {...p} type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="ban@truong.edu.vn" autoFocus />}
      </Field>
      <Field label="Mật khẩu" error={errors.password}>
        {(p) => (
          <div className="relative">
            <Input {...p} type={showPassword ? "text" : "password"} autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} className="pr-10" />
            <button
              type="button"
              onClick={() => setShowPassword((v) => !v)}
              aria-label={showPassword ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
              className="absolute top-1/2 right-2 -translate-y-1/2 rounded p-1 text-subtle hover:text-foreground"
            >
              {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
            </button>
          </div>
        )}
      </Field>
      <Button type="submit" size="lg" className="w-full" loading={loading}>
        {portal === "admin" ? "Đăng nhập quản trị" : "Đăng nhập"}
      </Button>
    </form>
  );
}
