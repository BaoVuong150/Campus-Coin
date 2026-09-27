import Link from "next/link";
import { buttonClasses } from "@/components/ui/button";
import { LanguageToggle } from "@/components/layout/language-switcher";
import { Logo } from "@/components/layout/logo";
import { ThemeToggle } from "@/components/layout/theme-toggle";
import type { Messages } from "@/i18n";

/** Header cho các trang công khai (landing). Trong ứng dụng dùng AppShell. */
export default function PublicHeader({ t, signedIn = false }: { t: Messages; signedIn?: boolean }) {
  return (
    <header className="sticky top-0 z-20 border-b border-border bg-background/85 backdrop-blur">
      <div className="mx-auto flex h-14 max-w-6xl items-center gap-6 px-4 sm:px-6">
        <Link href="/" aria-label={t.brand.home}>
          <Logo />
        </Link>
        <nav aria-label={t.landing.publicNav} className="hidden items-center gap-5 text-sm text-muted md:flex">
          <a href="#features" className="hover:text-foreground">
            {t.landing.features}
          </a>
          <a href="#sitemap" className="hover:text-foreground">
            {t.landing.sitemap}
          </a>
        </nav>
        <div className="ml-auto flex items-center gap-1 sm:gap-2">
          <LanguageToggle />
          <ThemeToggle />
          {signedIn ? (
            <Link href="/dashboard" className={buttonClasses("primary", "md")}>
              {t.landing.ctaApp}
            </Link>
          ) : (
            <>
              <Link href="/login" className={buttonClasses("ghost", "md", "hidden sm:inline-flex")}>
                {t.landing.login}
              </Link>
              <Link href="/register" className={buttonClasses("primary", "md")}>
                {t.landing.register}
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
