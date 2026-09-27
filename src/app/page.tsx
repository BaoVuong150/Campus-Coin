import Link from "next/link";
import { Check } from "lucide-react";
import PublicHeader from "@/components/Navbar";
import SitemapSection from "@/components/SitemapSection";
import { HeroPreview } from "@/components/landing/hero-preview";
import { CtaSection, FaqSection, FeaturesSection, StepsSection, TransparencySection } from "@/components/landing/landing-sections";
import { Logo } from "@/components/layout/logo";
import { buttonClasses } from "@/components/ui/button";
import { getServerMessages } from "@/i18n/server";
import { getSession } from "@/lib/auth/session";

export default async function HomePage() {
  const [user, t] = await Promise.all([getSession(), getServerMessages()]);
  const l = t.landing;
  const signedIn = !!user;

  return (
    <div className="min-h-dvh">
      <PublicHeader t={t} signedIn={signedIn} />
      <main>
        <section className="mx-auto grid max-w-6xl items-center gap-12 px-4 pt-14 pb-20 sm:px-6 lg:grid-cols-[1fr_1.05fr] lg:pt-24">
          <div>
            <p className="inline-flex items-center gap-2 rounded-full border border-border bg-surface px-3 py-1 text-[13px] text-muted">
              <span className="size-1.5 rounded-full bg-primary" aria-hidden />
              {l.eyebrow} · {t.brand.tagline}
            </p>
            <h1 className="mt-5 text-4xl leading-[1.1] font-semibold tracking-tight text-balance text-foreground sm:text-5xl">{l.headline}</h1>
            <p className="mt-5 max-w-xl text-lg leading-relaxed text-muted">{l.intro}</p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link href={signedIn ? "/dashboard" : "/register"} className={buttonClasses("primary", "lg")}>
                {signedIn ? l.ctaApp : l.ctaStart}
              </Link>
              <a href="#features" className={buttonClasses("outline", "lg")}>
                {l.ctaFeatures}
              </a>
            </div>
            <ul className="mt-8 flex flex-wrap gap-x-5 gap-y-2 text-sm text-muted">
              {l.trust.map((item) => (
                <li key={item} className="flex items-center gap-1.5">
                  <Check className="size-4 text-primary" aria-hidden /> {item}
                </li>
              ))}
            </ul>
          </div>
          <HeroPreview t={t} />
        </section>

        <FeaturesSection t={t} />
        <StepsSection t={t} />
        <div className="border-y border-border bg-surface">
          <TransparencySection t={t} />
        </div>
        <div className="pt-20">
          <FaqSection t={t} />
        </div>
        <CtaSection t={t} signedIn={signedIn} />

        <div className="border-t border-border">
          <div className="mx-auto max-w-6xl px-4 py-20 sm:px-6">
            <SitemapSection t={t} />
          </div>
        </div>
      </main>

      <footer className="border-t border-border">
        <div className="mx-auto flex max-w-6xl flex-col gap-4 px-4 py-8 text-[13px] text-subtle sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <div className="flex items-center gap-3">
            <Logo />
            <span className="hidden sm:inline">·</span>
            <span>{t.brand.subtitle}</span>
          </div>
          <div className="flex flex-wrap items-center gap-4">
            <span>{l.footer}</span>
            <Link href="/login" className="hover:text-foreground">
              {l.login}
            </Link>
            <Link href="/admin/login" className="hover:text-foreground">
              {l.adminPortal}
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
