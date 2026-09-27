import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { AuthShell } from "@/components/auth/auth-shell";
import { LoginForm } from "@/components/auth/login-form";

export const metadata: Metadata = { title: "Đăng nhập" };

export default function LoginPage() {
  return (
    <AuthShell
      title="Đăng nhập"
      description="Chào mừng trở lại Campus Coin."
      footer={
        <>
          Chưa có tài khoản?{" "}
          <Link href="/register" className="font-medium text-primary hover:underline">
            Đăng ký miễn phí
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
