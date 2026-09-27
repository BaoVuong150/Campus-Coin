import Link from "next/link";
import type { ReactNode } from "react";
import { CheckCircle2 } from "lucide-react";
import { LanguageToggle } from "@/components/layout/language-switcher";
import { Logo } from "@/components/layout/logo";
import { ThemeToggle } from "@/components/layout/theme-toggle";
import { getServerMessages } from "@/i18n/server";

interface AuthShellProps {
  title: string;
  description: string;
  children: ReactNode;
  footer?: ReactNode;
}

export async function AuthShell({ title, description, children, footer }: AuthShellProps) {
  const t = await getServerMessages();
  return (
    <div className="grid min-h-dvh lg:grid-cols-2">
      <aside className="hidden flex-col justify-between border-r border-border bg-surface p-10 lg:flex">
        <Link href="/" aria-label={t.brand.home}>
          <Logo />
        </Link>
        <div className="max-w-md">
          <p className="text-3xl leading-tight font-semibold tracking-tight text-foreground">{t.brand.tagline}</p>
          <p className="mt-3 text-muted">{t.brand.subtitle}</p>
          <ul className="mt-8 space-y-3">
            {t.auth.points.map((point) => (
              <li key={point} className="flex items-center gap-2.5 text-sm text-foreground">
                <CheckCircle2 className="size-4 text-primary" aria-hidden /> {point}
              </li>
            ))}
          </ul>
        </div>
        <p className="text-[12px] text-subtle">© Campus Coin · Techwiz 7</p>
      </aside>
      <main className="relative flex items-center justify-center px-4 py-10 sm:px-6">
        <div className="absolute top-4 right-4 flex items-center gap-1">
          <LanguageToggle />
          <ThemeToggle />
        </div>
        <div className="w-full max-w-sm">
          <Link href="/" className="mb-8 inline-block lg:hidden" aria-label={t.brand.home}>
            <Logo />
          </Link>
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">{title}</h1>
          <p className="mt-1.5 text-sm text-muted">{description}</p>
          <div className="mt-8">{children}</div>
          {footer && <div className="mt-6 text-center text-sm text-muted">{footer}</div>}
        </div>
      </main>
    </div>
  );
}
