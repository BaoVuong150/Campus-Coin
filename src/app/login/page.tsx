import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { AuthShell } from "@/components/auth/auth-shell";
import { LoginForm } from "@/components/auth/login-form";
import { getServerMessages } from "@/i18n/server";

export async function generateMetadata(): Promise<Metadata> {
  return { title: (await getServerMessages()).meta.login };
}

export default async function LoginPage() {
  const t = await getServerMessages();
  return (
    <AuthShell
      title={t.auth.loginTitle}
      description={t.auth.loginSubtitle}
      footer={
        <>
          {t.auth.noAccount}{" "}
          <Link href="/register" className="font-medium text-primary hover:underline">
            {t.auth.registerFree}
          </Link>
        </>
      }
    >
      <Suspense>
        <LoginForm portal="student" />
      </Suspense>
    </AuthShell>
  );
}
