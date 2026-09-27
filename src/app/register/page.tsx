import type { Metadata } from "next";
import Link from "next/link";
import { AuthShell } from "@/components/auth/auth-shell";
import { RegisterForm } from "@/components/auth/register-form";

export const metadata: Metadata = { title: "Đăng ký" };

export default function RegisterPage() {
  return (
    <AuthShell
      title="Tạo tài khoản"
      description="Bắt đầu quản lý chi tiêu chỉ trong một phút."
      footer={
        <>
          Đã có tài khoản?{" "}
          <Link href="/login" className="font-medium text-primary hover:underline">
            Đăng nhập
          </Link>
        </>
      }
    >
      <RegisterForm />
    </AuthShell>
  );
}
