import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Section } from "@/components/layout/container";
import { buttonClasses } from "@/components/ui/button";
import type { Messages } from "@/i18n";

/** Khối kêu gọi cuối trang: nền teal nhạt, để nút chính là điểm nhấn duy nhất. */
export function FinalCta({ t, signedIn }: { t: Messages; signedIn: boolean }) {
  const c = t.landing.cta;
  return (
    <Section labelledBy="cta-title" className="bg-surface">
      <div className="relative overflow-hidden rounded-2xl bg-primary-soft px-5 py-14 text-center ring-1 ring-primary/25 ring-inset sm:px-12 sm:py-20 xl:py-24">
        <div className="cta-glow pointer-events-none absolute inset-0" aria-hidden />
        <h2
          id="cta-title"
          className="relative mx-auto max-w-2xl text-[clamp(28px,8vw,32px)] leading-[1.1] font-[650] tracking-[-0.035em] text-balance text-foreground sm:text-[44px]"
        >
          {c.title}
        </h2>
        <p className="relative mt-4 text-[17px] text-muted">{c.body}</p>
        <div className="relative mt-9 grid gap-2 phablet:flex phablet:flex-wrap phablet:items-center phablet:justify-center phablet:gap-3">
          <Link href={signedIn ? "/dashboard" : "/register"} className={buttonClasses("primary", "xl", "w-full phablet:w-auto")}>
            {signedIn ? t.landing.nav.openApp : c.primary}
            <ArrowRight className="size-4" aria-hidden />
          </Link>
          {!signedIn && (
            <Link href="/login" className={buttonClasses("outline", "xl", "w-full phablet:w-auto")}>
              {c.secondary}
            </Link>
          )}
        </div>
      </div>
    </Section>
  );
}
