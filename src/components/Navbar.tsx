import Link from "next/link";
import { buttonClasses } from "@/components/ui/button";
import { Logo } from "@/components/layout/logo";
import { ThemeToggle } from "@/components/layout/theme-toggle";

/** Header cho các trang công khai (landing). Trong ứng dụng dùng AppShell. */
export default function PublicHeader({ signedIn = false }: { signedIn?: boolean }) {
  return (
    <header className="sticky top-0 z-20 border-b border-border bg-background/85 backdrop-blur">
      <div className="mx-auto flex h-14 max-w-6xl items-center gap-6 px-4 sm:px-6">
        <Link href="/" aria-label="Campus Coin – Trang chủ">
          <Logo />
        </Link>
        <nav aria-label="Trang công khai" className="hidden items-center gap-5 text-sm text-muted md:flex">
          <a href="#features" className="hover:text-foreground">
            Tính năng
          </a>
          <a href="#sitemap" className="hover:text-foreground">
            Sơ đồ trang
          </a>
        </nav>
        <div className="ml-auto flex items-center gap-2">
          <ThemeToggle />
          {signedIn ? (
            <Link href="/dashboard" className={buttonClasses("primary", "md")}>
              Vào ứng dụng
            </Link>
          ) : (
            <>
              <Link href="/login" className={buttonClasses("ghost", "md", "hidden sm:inline-flex")}>
                Đăng nhập
              </Link>
              <Link href="/register" className={buttonClasses("primary", "md")}>
                Đăng ký
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
