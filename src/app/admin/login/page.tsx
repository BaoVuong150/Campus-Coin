import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { AuthShell } from "@/components/auth/auth-shell";
import { LoginForm } from "@/components/auth/login-form";
import { getServerMessages } from "@/i18n/server";

export async function generateMetadata(): Promise<Metadata> {
  return { title: (await getServerMessages()).meta.adminLogin };
}

/** Cổng đăng nhập riêng cho quản trị viên (SRS 3.1). Tài khoản sinh viên sẽ bị từ chối. */
export default async function AdminLoginPage() {
  const t = await getServerMessages();
  return (
    <AuthShell
      title={t.auth.adminTitle}
      description={t.auth.adminSubtitle}
      footer={
        <Link href="/login" className="font-medium text-primary hover:underline">
          {t.auth.backToStudent}
        </Link>
      }
    >
      <Suspense>
        <LoginForm portal="admin" />
      </Suspense>
    </AuthShell>
  );
}
