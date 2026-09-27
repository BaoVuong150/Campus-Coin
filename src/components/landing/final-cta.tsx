import Link from "next/link";
import type { Messages } from "@/i18n";

export function FinalCta({ t, signedIn }: { t: Messages; signedIn: boolean }) {
  const c = t.landing.cta;
  return (
    <section aria-labelledby="cta-title" className="bg-surface">
      <div className="mx-auto max-w-7xl px-4 py-24 sm:px-6 lg:px-8">
        <div className="rounded-2xl bg-primary px-6 py-16 text-center sm:px-12 sm:py-20">
          <h2
            id="cta-title"
            className="mx-auto max-w-2xl text-[32px] leading-[1.1] font-[650] tracking-[-0.035em] text-balance text-primary-foreground sm:text-[44px]"
          >
            {c.title}
          </h2>
          <p className="mt-4 text-[17px] text-primary-foreground/80">{c.body}</p>
          <div className="mt-9 flex flex-wrap items-center justify-center gap-3">
            <Link
              href={signedIn ? "/dashboard" : "/register"}
              className="inline-flex h-[50px] items-center rounded-[11px] bg-primary-foreground px-[22px] text-[15px] font-medium text-primary transition-[opacity,transform] duration-150 hover:opacity-90 active:scale-[0.985]"
            >
              {signedIn ? t.landing.nav.openApp : c.primary}
            </Link>
            {!signedIn && (
              <Link
                href="/login"
                className="inline-flex h-[50px] items-center rounded-[11px] px-[22px] text-[15px] font-medium text-primary-foreground ring-1 ring-primary-foreground/30 transition-colors duration-150 ring-inset hover:bg-primary-foreground/10"
              >
                {c.secondary}
              </Link>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
