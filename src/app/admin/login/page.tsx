import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { AuthShell } from "@/components/auth/auth-shell";
import { LoginForm } from "@/components/auth/login-form";

export const metadata: Metadata = { title: "Đăng nhập quản trị" };

/** Cổng đăng nhập riêng cho quản trị viên (SRS 3.1). Tài khoản sinh viên sẽ bị từ chối. */
export default function AdminLoginPage() {
  return (
    <AuthShell
      title="Cổng quản trị"
      description="Chỉ dành cho quản trị viên Campus Coin."
      footer={
        <Link href="/login" className="font-medium text-primary hover:underline">
          ← Đăng nhập sinh viên
        </Link>
      }
    >
      <Suspense>
        <LoginForm portal="admin" />
      </Suspense>
    </AuthShell>
  );
}
