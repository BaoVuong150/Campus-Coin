import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { AuthShell } from "@/components/auth/auth-shell";
import { ForgotPasswordForm } from "@/components/auth/forgot-password-form";
import { getServerMessages } from "@/i18n/server";

export async function generateMetadata(): Promise<Metadata> {
  return { title: (await getServerMessages()).meta.forgotPassword };
}

export default async function Page() {
  const t = await getServerMessages();
  return (
    <AuthShell
      title={t.auth.forgotTitle}
      description={t.auth.forgotSubtitle}
      footer={
        <Link href="/login" className="font-medium text-primary-ink hover:underline">
          {t.auth.backToLogin}
        </Link>
      }
    >
      <Suspense>
        <ForgotPasswordForm />
      </Suspense>
    </AuthShell>
  );
}
