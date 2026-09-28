import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { AuthShell } from "@/components/auth/auth-shell";
import { ResetPasswordForm } from "@/components/auth/reset-password-form";
import { getServerMessages } from "@/i18n/server";

export async function generateMetadata(): Promise<Metadata> {
  // Token nằm trên URL: không gửi Referer sang tài nguyên bên ngoài (font, ảnh) để token không bị lộ.
  return { title: (await getServerMessages()).meta.resetPassword, referrer: "no-referrer", robots: { index: false } };
}

export default async function Page() {
  const t = await getServerMessages();
  return (
    <AuthShell
      title={t.auth.resetTitle}
      description={t.auth.resetSubtitle}
      footer={
        <Link href="/login" className="font-medium text-primary-ink hover:underline">
          {t.auth.backToLogin}
        </Link>
      }
    >
      <Suspense>
        <ResetPasswordForm />
      </Suspense>
    </AuthShell>
  );
}
