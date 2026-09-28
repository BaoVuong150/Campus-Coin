import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { AuthShell } from "@/components/auth/auth-shell";
import { ForcePasswordForm } from "@/components/auth/force-password-form";
import { LogoutLink } from "@/components/auth/logout-link";
import { getSessionState } from "@/lib/auth/session";
import { getServerMessages } from "@/i18n/server";

export async function generateMetadata(): Promise<Metadata> {
  return { title: (await getServerMessages()).meta.changePassword, robots: { index: false } };
}

/** Bắt buộc đổi mật khẩu tạm do admin cấp. Chỉ vào được khi đã đăng nhập và đang có cờ phải đổi mật khẩu. */
export default async function ChangePasswordPage() {
  const [session, t] = await Promise.all([getSessionState(), getServerMessages()]);
  if (session.status !== "authenticated") redirect("/login?reason=required");
  const home = session.user.role === "admin" ? "/admin" : "/dashboard";
  if (!session.user.mustChangePassword) redirect(home);

  return (
    <AuthShell title={t.auth.forceChangeTitle} description={t.auth.forceChangeSubtitle} footer={<LogoutLink label={t.auth.forceChangeLogout} />}>
      <ForcePasswordForm home={home} />
    </AuthShell>
  );
}
