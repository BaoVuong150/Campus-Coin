import Link from "next/link";
import type { CSSProperties } from "react";
import { ArrowRight, Check } from "lucide-react";
import { buttonClasses } from "@/components/ui/button";
import type { Messages } from "@/i18n";
import type { Locale } from "@/i18n/config";
import { HeroDashboard } from "./hero-dashboard";

/** Hiệu ứng xuất hiện tuần tự nhẹ cho từng khối chữ. */
const rise = (delay: number, offset = 12): CSSProperties => ({ "--rise": `${offset}px`, animationDelay: `${delay}ms` }) as CSSProperties;

export function Hero({ t, locale, signedIn }: { t: Messages; locale: Locale; signedIn: boolean }) {
  const h = t.landing.hero;
  return (
    <section className="hero-glow overflow-x-clip">
      <div className="mx-auto grid max-w-7xl items-center gap-14 px-4 pt-10 pb-20 sm:px-6 lg:min-h-[min(calc(100dvh-72px),800px)] lg:grid-cols-[45fr_55fr] lg:gap-16 lg:px-8 lg:pt-16 lg:pb-24">
        <div>
          <p className="flex animate-rise items-center gap-2 text-sm font-medium text-muted" style={rise(0, 8)}>
            <span className="size-1.5 rounded-full bg-brand" aria-hidden />
            {h.eyebrow}
          </p>
          <h1
            className="mt-5 animate-rise text-[42px] leading-[1.02] font-[650] tracking-[-0.045em] text-balance text-foreground sm:text-[56px] xl:text-[60px] 2xl:text-[68px]"
            style={rise(80)}
          >
            {h.titleLines[0]}
            <span className="block text-muted">{h.titleLines[1]}</span>
          </h1>
          <p className="mt-6 max-w-xl animate-rise text-[17px] leading-[1.65] text-muted sm:text-lg" style={rise(160, 6)}>
            {h.subtitle}
          </p>
          <div className="mt-8 flex animate-rise flex-wrap items-center gap-x-6 gap-y-3" style={rise(220, 6)}>
            <Link href={signedIn ? "/dashboard" : "/register"} className={buttonClasses("primary", "xl")}>
              {signedIn ? t.landing.nav.openApp : h.primary}
            </Link>
            <a href="#how" className="group inline-flex items-center gap-1.5 text-[15px] font-medium text-foreground transition-colors hover:text-primary">
              {h.secondary}
              <ArrowRight className="size-4 transition-transform duration-150 group-hover:translate-x-0.5" aria-hidden />
            </a>
          </div>
          <ul className="mt-8 flex animate-rise flex-wrap items-center gap-x-5 gap-y-2 text-sm text-muted" style={rise(280, 4)}>
            {h.trust.map((item) => (
              <li key={item} className="flex items-center gap-2">
                <Check className="size-3.5 text-primary" strokeWidth={2.25} aria-hidden />
                {item}
              </li>
            ))}
          </ul>
        </div>
        <HeroDashboard t={t} locale={locale} />
      </div>
    </section>
  );
}
