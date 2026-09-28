"use client";

import { useState, useSyncExternalStore } from "react";
import Link from "next/link";
import { Menu } from "lucide-react";
import { LanguageToggle } from "@/components/layout/language-switcher";
import { Logo } from "@/components/layout/logo";
import { ThemeToggle } from "@/components/layout/theme-toggle";
import { Button, buttonClasses } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { useI18n } from "@/i18n/provider";
import { cn } from "@/lib/utils/cn";

const SCROLL_THRESHOLD = 8;

function subscribeScroll(onChange: () => void) {
  window.addEventListener("scroll", onChange, { passive: true });
  return () => window.removeEventListener("scroll", onChange);
}

/** true khi trang đã cuộn khỏi đầu – dùng để hiện nền mờ và viền dưới cho navbar. */
function useScrolled(): boolean {
  return useSyncExternalStore(subscribeScroll, () => window.scrollY > SCROLL_THRESHOLD, () => false);
}

export function LandingNavbar({ signedIn }: { signedIn: boolean }) {
  const { t } = useI18n();
  const n = t.landing.nav;
  const scrolled = useScrolled();
  const [menuOpen, setMenuOpen] = useState(false);
  const links = [
    { href: "#product", label: n.product },
    { href: "#how", label: n.how },
    { href: "#features", label: n.features },
    { href: "#security", label: n.security },
  ];
  const cta = signedIn ? { href: "/dashboard", label: n.openApp } : { href: "/register", label: n.start };

  return (
    <header
      className={cn(
        "sticky top-0 z-30 border-b pt-[env(safe-area-inset-top)] transition-[background-color,border-color] duration-200",
        scrolled ? "border-border bg-background/80 backdrop-blur-md" : "border-transparent bg-transparent"
      )}
    >
      {/* Cùng khung container-page với hero: logo thẳng mép trái nội dung, CTA thẳng mép phải mockup. */}
      <div className="container-page flex h-(--nav-height) items-center gap-4 lg:gap-6 xl:gap-8">
        <Link href="/" aria-label={t.brand.home} className="shrink-0">
          <Logo />
        </Link>

        <nav aria-label={n.label} className="hidden flex-1 justify-center lg:flex">
          <ul className="flex items-center gap-6 text-sm text-muted xl:gap-8">
            {links.map((link) => (
              <li key={link.href}>
                <a href={link.href} className="whitespace-nowrap transition-colors duration-150 hover:text-foreground">
                  {link.label}
                </a>
              </li>
            ))}
          </ul>
        </nav>

        <div className="ml-auto flex items-center gap-1 lg:ml-0">
          <LanguageToggle className="hidden sm:inline-flex" />
          <ThemeToggle />
          {!signedIn && (
            <Link href="/login" className={buttonClasses("ghost", "md", "hidden text-foreground lg:inline-flex")}>
              {n.login}
            </Link>
          )}
          <Link href={cta.href} className={buttonClasses("primary", "md", "ml-1 hidden h-10 rounded-[10px] px-4 sm:inline-flex")}>
            {cta.label}
          </Link>
          <Button variant="ghost" size="icon" className="size-11 lg:hidden" onClick={() => setMenuOpen(true)} aria-label={n.menu} aria-expanded={menuOpen}>
            <Menu />
          </Button>
        </div>
      </div>

      <Dialog open={menuOpen} onClose={() => setMenuOpen(false)} variant="sheet" title={n.menuTitle}>
        <nav aria-label={n.label}>
          <ul className="space-y-1">
            {links.map((link) => (
              <li key={link.href}>
                <a
                  href={link.href}
                  onClick={() => setMenuOpen(false)}
                  className="flex h-11 items-center rounded-lg px-3 text-[15px] text-foreground hover:bg-surface-hover"
                >
                  {link.label}
                </a>
              </li>
            ))}
          </ul>
          <div className="mt-6 space-y-2 border-t border-border pt-6">
            {!signedIn && (
              <Link href="/login" className={buttonClasses("outline", "lg", "w-full")}>
                {n.login}
              </Link>
            )}
            <Link href={cta.href} className={buttonClasses("primary", "lg", "w-full")}>
              {cta.label}
            </Link>
            <div className="flex justify-center pt-2">
              <LanguageToggle />
            </div>
          </div>
        </nav>
      </Dialog>
    </header>
  );
}
