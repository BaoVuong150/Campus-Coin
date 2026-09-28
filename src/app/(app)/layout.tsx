import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { AppShell } from "@/components/layout/app-shell";
import { getSessionState } from "@/lib/auth/session";

/** Trang cá nhân: không cho công cụ tìm kiếm lập chỉ mục. */
export const metadata: Metadata = { robots: { index: false, follow: false } };

/** Mọi trang trong nhóm (app) đều được xác thực phía server (đối chiếu DB), không chỉ dựa vào proxy. */
export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const session = await getSessionState();
  if (session.status === "expired") redirect("/login?reason=expired");
  if (session.status === "disabled") redirect("/login?reason=disabled");
  // Token hợp lệ nhưng user không còn trong DB: kèm reason để proxy không chuyển hướng ngược lại.
  if (session.status !== "authenticated") redirect("/login?reason=required");
  // Mật khẩu tạm do admin cấp: phải đặt mật khẩu mới trước khi vào app.
  if (session.user.mustChangePassword) redirect("/change-password");
  return <AppShell user={session.user}>{children}</AppShell>;
}
