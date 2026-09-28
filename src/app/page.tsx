import type { Metadata } from "next";
import SitemapSection from "@/components/SitemapSection";
import { Container } from "@/components/layout/container";
import { BudgetSection } from "@/components/landing/budget-section";
import { CashFlowSection } from "@/components/landing/cash-flow-section";
import { FinalCta } from "@/components/landing/final-cta";
import { GoalsSection } from "@/components/landing/goals-section";
import { Hero } from "@/components/landing/hero";
import { LandingFooter } from "@/components/landing/landing-footer";
import { LandingNavbar } from "@/components/landing/landing-navbar";
import { PrivacySection } from "@/components/landing/privacy-section";
import { ProblemSection } from "@/components/landing/problem-section";
import { SafeToSpendSection } from "@/components/landing/safe-to-spend-section";
import { getLocale, getServerMessages } from "@/i18n/server";
import { getSession } from "@/lib/auth/session";

export async function generateMetadata(): Promise<Metadata> {
  const [t, locale] = await Promise.all([getServerMessages(), getLocale()]);
  return {
    title: { absolute: t.meta.homeTitle },
    alternates: { canonical: "/" },
    description: t.meta.homeDescription,
    openGraph: {
      title: t.meta.homeTitle,
      description: t.meta.homeDescription,
      siteName: "Campus Coin",
      type: "website",
      locale: locale === "vi" ? "vi_VN" : "en_US",
    },
  };
}

export default async function HomePage() {
  const [user, t, locale] = await Promise.all([getSession(), getServerMessages(), getLocale()]);
  const signedIn = !!user;

  return (
    <>
      <LandingNavbar signedIn={signedIn} />
      <main>
        <Hero t={t} locale={locale} signedIn={signedIn} />
        <ProblemSection t={t} />
        <SafeToSpendSection t={t} />
        <BudgetSection t={t} />
        <CashFlowSection />
        <GoalsSection t={t} />
        <PrivacySection t={t} />
        <FinalCta t={t} signedIn={signedIn} />
        <div className="border-t border-border bg-background">
          <Container className="section-space">
            <SitemapSection t={t} />
          </Container>
        </div>
      </main>
      <LandingFooter t={t} />
    </>
  );
}
