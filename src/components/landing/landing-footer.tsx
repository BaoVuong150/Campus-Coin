import Link from "next/link";
import { LanguageToggle } from "@/components/layout/language-switcher";
import { Logo } from "@/components/layout/logo";
import { ThemeToggle } from "@/components/layout/theme-toggle";
import type { Messages } from "@/i18n";

export function LandingFooter({ t }: { t: Messages }) {
  const f = t.landing.footer;
  const columns = [
    {
      title: f.product,
      links: [
        { href: "#features", label: f.features },
        { href: "/budgets", label: f.budgets },
        { href: "/transactions", label: f.transactions },
        { href: "/goals", label: f.goals },
      ],
    },
    {
      title: f.resources,
      links: [
        { href: "#how", label: f.guide },
        { href: "#security", label: f.security },
        { href: "#sitemap", label: f.sitemap },
      ],
    },
    {
      title: f.other,
      links: [
        { href: "/login", label: f.login },
        { href: "/register", label: f.register },
        { href: "/admin/login", label: f.admin },
      ],
    },
  ];

  return (
    <footer className="border-t border-border bg-background">
      <div className="mx-auto max-w-7xl px-4 pt-14 pb-8 sm:px-6 lg:px-8">
        <div className="grid gap-10 md:grid-cols-[1.4fr_repeat(3,1fr)]">
          <div>
            <Logo />
            <p className="mt-3 max-w-xs text-sm text-muted">{f.tagline}</p>
          </div>
          {columns.map((col) => (
            <div key={col.title}>
              <p className="text-sm font-medium text-foreground">{col.title}</p>
              <ul className="mt-3 space-y-2 text-sm text-muted">
                {col.links.map((link) => (
                  <li key={link.href}>
                    <Link href={link.href} className="transition-colors duration-150 hover:text-foreground">
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <div className="mt-12 flex flex-col gap-4 border-t border-border pt-6 text-[13px] text-subtle sm:flex-row sm:items-center sm:justify-between">
          <p>{f.copyright}</p>
          <div className="flex items-center gap-1">
            <LanguageToggle />
            <ThemeToggle />
          </div>
        </div>
      </div>
    </footer>
  );
}
