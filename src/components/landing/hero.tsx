import Link from "next/link";
import type { CSSProperties } from "react";
import { ArrowRight, Check } from "lucide-react";
import { buttonClasses } from "@/components/ui/button";
import type { Messages } from "@/i18n";
import type { Locale } from "@/i18n/config";
import { cn } from "@/lib/utils/cn";
import { HeroDashboard } from "./hero-dashboard";
import { HeroMobileDashboard } from "./hero-mobile-dashboard";

/** Hiệu ứng xuất hiện tuần tự nhẹ cho từng khối chữ. */
const rise = (delay: number, offset = 12): CSSProperties => ({ "--rise": `${offset}px`, animationDelay: `${delay}ms` }) as CSSProperties;

/**
 * Hero landing.
 * - < 768: một cột, chữ căn trái, mockup riêng cho điện thoại (không thu nhỏ bản desktop).
 * - 768–1023: một cột, mockup desktop full chiều rộng bên dưới (bố cục bên trong tự co theo container query).
 * - ≥ 1024: hai cột 40/60; ≥ 1280: ~42/58 và mockup lớn dần tới 820px ở màn hình rộng.
 * Chiều cao khung đầu được kẹp (clamp) để 1366×768 vừa một màn, 1920×1080 không bị trống.
 */
export function Hero({ t, locale, signedIn }: { t: Messages; locale: Locale; signedIn: boolean }) {
  const h = t.landing.hero;
  return (
    <section className="hero-glow overflow-x-clip">
      <div
        className={cn(
          "container-page grid items-center gap-y-12 md:gap-y-14",
          "pt-[clamp(28px,5vh,84px)] pb-[clamp(56px,8vh,112px)]",
          "lg:min-h-[clamp(600px,calc(100svh_-_var(--nav-height)),820px)] lg:grid-cols-[minmax(0,2fr)_minmax(0,3fr)] lg:gap-x-[clamp(40px,4vw,88px)]",
          "xl:grid-cols-[minmax(0,0.82fr)_minmax(0,1.18fr)]"
        )}
      >
        <div className="min-w-0 max-w-[620px]">
          <p className="flex animate-rise items-center gap-2 text-sm font-medium text-muted" style={rise(0, 8)}>
            <span className="size-1.5 rounded-full bg-brand" aria-hidden />
            {h.eyebrow}
          </p>
          <h1
            className={cn(
              "mt-5 animate-rise font-[650] tracking-[-0.045em] text-balance text-foreground",
              "text-[clamp(38px,11vw,48px)] leading-[1.02] md:text-[clamp(44px,6.4vw,54px)] lg:text-[clamp(44px,4.15vw,76px)] lg:leading-[1.0]"
            )}
            style={rise(80)}
          >
            {h.titleLines[0]}
            <span className="block text-muted">{h.titleLines[1]}</span>
          </h1>
          <p
            className="mt-5 max-w-[600px] animate-rise text-base leading-[1.65] text-muted sm:text-[17px] lg:mt-6 lg:text-lg 3xl:text-xl 3xl:leading-[1.6]"
            style={rise(160, 6)}
          >
            {h.subtitle}
          </p>
          {/* < 480px: hai nút xếp dọc, full chiều rộng, dễ bấm bằng ngón cái. */}
          <div className="mt-8 grid animate-rise gap-2 min-[480px]:flex min-[480px]:flex-wrap min-[480px]:items-center min-[480px]:gap-x-6 min-[480px]:gap-y-3" style={rise(220, 6)}>
            <Link href={signedIn ? "/dashboard" : "/register"} className={buttonClasses("primary", "xl", "w-full min-[480px]:w-auto")}>
              {signedIn ? t.landing.nav.openApp : h.primary}
            </Link>
            <a
              href="#how"
              className="group inline-flex h-12 items-center justify-center gap-1.5 rounded-[11px] text-[15px] font-medium text-foreground transition-colors hover:text-primary-ink max-[480px]:border max-[480px]:border-border min-[480px]:h-11"
            >
              {h.secondary}
              <ArrowRight className="size-4 transition-transform duration-150 group-hover:translate-x-0.5" aria-hidden />
            </a>
          </div>
          <ul className="mt-8 flex animate-rise flex-wrap items-center gap-x-5 gap-y-2.5 text-sm text-muted" style={rise(280, 4)}>
            {h.trust.map((item) => (
              <li key={item} className="flex items-center gap-2">
                <Check className="size-3.5 shrink-0 text-primary-ink" strokeWidth={2.25} aria-hidden />
                {item}
              </li>
            ))}
          </ul>
        </div>

        <div className="hidden min-w-0 md:block lg:justify-self-stretch 3xl:justify-self-end 3xl:w-full 3xl:max-w-[820px]">
          <HeroDashboard t={t} locale={locale} />
        </div>
        <div className="min-w-0 md:hidden">
          <HeroMobileDashboard t={t} />
        </div>
      </div>
    </section>
  );
}
