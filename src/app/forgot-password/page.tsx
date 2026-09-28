import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { AuthShell } from "@/components/auth/auth-shell";
import { ForgotPasswordForm } from "@/components/auth/forgot-password-form";
import { getServerMessages } from "@/i18n/server";
import { canDeliverEmail } from "@/lib/mail/mailer";

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
      {canDeliverEmail() ? (
        <Suspense>
          <ForgotPasswordForm />
        </Suspense>
      ) : (
        // Production chưa cấu hình email: nói rõ và hướng dẫn liên hệ admin (admin có chức năng cấp mật khẩu tạm).
        <div className="rounded-md bg-warning-soft px-4 py-3 text-[13px] text-warning" role="status">
          <p className="font-medium">{t.auth.emailUnavailableTitle}</p>
          <p className="mt-1 leading-relaxed">{t.auth.emailUnavailableBody}</p>
        </div>
      )}
    </AuthShell>
  );
}
