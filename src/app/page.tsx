import Link from "next/link";
import { BellRing, CalendarClock, FileDown, Gauge, Repeat, Target, type LucideIcon } from "lucide-react";
import PublicHeader from "@/components/Navbar";
import SitemapSection from "@/components/SitemapSection";
import { buttonClasses } from "@/components/ui/button";
import { getServerMessages } from "@/i18n/server";
import { getSession } from "@/lib/auth/session";

/** Icon theo thứ tự của t.landing.featureList. */
const FEATURE_ICONS: LucideIcon[] = [Gauge, CalendarClock, BellRing, Repeat, Target, FileDown];

export default async function HomePage() {
  const [user, t] = await Promise.all([getSession(), getServerMessages()]);
  const l = t.landing;

  return (
    <div className="min-h-dvh">
      <PublicHeader t={t} signedIn={!!user} />
      <main>
        <section className="mx-auto max-w-6xl px-4 pt-16 pb-20 sm:px-6 sm:pt-24">
          <p className="text-sm font-medium text-primary">{l.eyebrow}</p>
          <h1 className="mt-3 max-w-3xl text-4xl leading-tight font-semibold tracking-tight text-foreground sm:text-5xl">{t.brand.tagline}</h1>
          <p className="mt-4 max-w-2xl text-lg text-muted">{l.intro}</p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link href={user ? "/dashboard" : "/register"} className={buttonClasses("primary", "lg")}>
              {user ? l.ctaApp : l.ctaStart}
            </Link>
            <a href="#features" className={buttonClasses("outline", "lg")}>
              {l.ctaFeatures}
            </a>
          </div>
        </section>

        <section id="features" aria-labelledby="features-title" className="scroll-mt-20 border-y border-border bg-surface">
          <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
            <h2 id="features-title" className="text-2xl font-semibold tracking-tight text-foreground">
              {l.featuresTitle}
            </h2>
            <p className="mt-1.5 text-muted">{l.featuresSubtitle}</p>
            <div className="mt-10 grid gap-x-8 gap-y-10 sm:grid-cols-2 lg:grid-cols-3">
              {l.featureList.map(({ title, description }, i) => {
                const Icon = FEATURE_ICONS[i];
                return (
                  <div key={title}>
                    <span className="flex size-9 items-center justify-center rounded-md bg-primary-soft text-primary">
                      <Icon className="size-4" aria-hidden />
                    </span>
                    <h3 className="mt-4 text-[15px] font-semibold text-foreground">{title}</h3>
                    <p className="mt-1.5 text-sm text-muted">{description}</p>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
          <SitemapSection t={t} />
        </div>
      </main>
      <footer className="border-t border-border">
        <div className="mx-auto flex max-w-6xl flex-col gap-2 px-4 py-6 text-[13px] text-subtle sm:flex-row sm:justify-between sm:px-6">
          <p>{l.footer}</p>
          <p className="flex gap-4">
            <Link href="/login" className="hover:text-foreground">
              {l.login}
            </Link>
            <Link href="/admin/login" className="hover:text-foreground">
              {l.adminPortal}
            </Link>
          </p>
        </div>
      </footer>
    </div>
  );
}
