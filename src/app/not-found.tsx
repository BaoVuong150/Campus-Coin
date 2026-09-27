import Link from "next/link";
import { buttonClasses } from "@/components/ui/button";
import { LogoMark } from "@/components/layout/logo";

export default function NotFound() {
  return (
    <main className="flex min-h-dvh flex-col items-center justify-center px-4 text-center">
      <LogoMark className="size-10" />
      <p className="mt-6 text-sm font-medium text-primary">404</p>
      <h1 className="mt-1 text-2xl font-semibold tracking-tight text-foreground">Không tìm thấy trang</h1>
      <p className="mt-2 text-muted">Trang bạn tìm không tồn tại hoặc đã được di chuyển.</p>
      <Link href="/" className={buttonClasses("primary", "md", "mt-6")}>
        Về trang chủ
      </Link>
    </main>
  );
}
