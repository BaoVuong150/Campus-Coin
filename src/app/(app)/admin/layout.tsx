import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth/session";

/** Chặn non-admin ngay ở server; API /api/admin/* vẫn tự kiểm tra requireAdmin() độc lập. */
export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const user = await getSession();
  if (!user) redirect("/admin/login");
  if (user.role !== "admin") redirect("/dashboard");
  return children;
}
