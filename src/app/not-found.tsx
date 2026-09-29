import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, LayoutDashboard, LogIn } from "lucide-react";
import { StatusScreen } from "@/components/common/status-screen";
import { buttonClasses } from "@/components/ui/button";
import { getSession } from "@/lib/auth/session";
import { getServerMessages } from "@/i18n/server";

export async function generateMetadata(): Promise<Metadata> {
  return { title: (await getServerMessages()).common.notFoundTitle, robots: { index: false } };
}

/** 404 toàn trang. Đã đăng nhập → ưu tiên quay về tổng quan; chưa đăng nhập → trang chủ + đăng nhập. */
export default async function NotFound() {
  const [t, user] = await Promise.all([getServerMessages(), getSession()]);
  const c = t.common;
  const action = "w-full phablet:w-auto";

  return (
    <StatusScreen
      code="404"
      eyebrow={c.notFoundCode}
      title={c.notFoundTitle}
      description={c.notFoundBody}
      homeLabel={t.brand.home}
      actions={
        user ? (
          <>
            <Link href="/dashboard" className={buttonClasses("primary", "lg", action)}>
              <LayoutDashboard /> {c.goDashboard}
            </Link>
            <Link href="/" className={buttonClasses("outline", "lg", action)}>
              {c.backHome}
            </Link>
          </>
        ) : (
          <>
            <Link href="/" className={buttonClasses("primary", "lg", action)}>
              <ArrowLeft /> {c.backHome}
            </Link>
            <Link href="/login" className={buttonClasses("outline", "lg", action)}>
              <LogIn /> {c.goLogin}
            </Link>
          </>
        )
      }
    />
  );
}
