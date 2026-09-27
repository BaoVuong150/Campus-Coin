import type { Metadata } from "next";
import Link from "next/link";
import { AuthShell } from "@/components/auth/auth-shell";
import { RegisterForm } from "@/components/auth/register-form";
import { getServerMessages } from "@/i18n/server";

export async function generateMetadata(): Promise<Metadata> {
  return { title: (await getServerMessages()).meta.register };
}

export default async function RegisterPage() {
  const t = await getServerMessages();
  return (
    <AuthShell
      title={t.auth.registerTitle}
      description={t.auth.registerSubtitle}
      footer={
        <>
          {t.auth.haveAccount}{" "}
          <Link href="/login" className="font-medium text-primary hover:underline">
            {t.auth.submitLogin}
          </Link>
        </>
      }
    >
      <RegisterForm />
    </AuthShell>
  );
}
