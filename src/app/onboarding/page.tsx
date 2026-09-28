import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { AuthShell } from "@/components/auth/auth-shell";
import { OnboardingForm } from "@/components/auth/onboarding-form";
import { getSessionState } from "@/lib/auth/session";
import { getServerMessages } from "@/i18n/server";
import { getOnboardingState } from "@/services/onboarding.service";

export async function generateMetadata(): Promise<Metadata> {
  return { title: (await getServerMessages()).meta.onboarding, robots: { index: false } };
}

/** Thiết lập ban đầu cho sinh viên mới đăng ký. Đã hoàn tất (hoặc bỏ qua) thì đi thẳng vào dashboard. */
export default async function OnboardingPage() {
  const [session, t] = await Promise.all([getSessionState(), getServerMessages()]);
  if (session.status !== "authenticated") redirect("/login?reason=required");
  if (session.user.mustChangePassword) redirect("/change-password");
  if (session.user.role === "admin") redirect("/admin");
  const state = await getOnboardingState(session.user.id);
  if (state.completed) redirect("/dashboard");

  return (
    <AuthShell title={t.onboarding.title} description={t.onboarding.subtitle}>
      <OnboardingForm initialAllowance={state.monthlyAllowance} initialPayDay={state.payDay} initialSavings={state.monthlySavingsGoal} />
    </AuthShell>
  );
}
