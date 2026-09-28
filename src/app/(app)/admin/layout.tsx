import { redirect } from "next/navigation";
import { getSessionState } from "@/lib/auth/session";

/** Chặn non-admin ngay ở server; API /api/admin/* vẫn tự kiểm tra requireAdmin() độc lập. */
export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await getSessionState();
  // Luôn kèm `reason` để proxy không đẩy ngược về /admin khi token còn chữ ký hợp lệ (tránh vòng lặp).
  if (session.status === "expired") redirect("/admin/login?reason=expired");
  if (session.status === "disabled") redirect("/admin/login?reason=disabled");
  if (session.status !== "authenticated") redirect("/admin/login?reason=required");
  if (session.user.role !== "admin") redirect("/dashboard");
  return children;
}
