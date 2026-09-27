import Link from "next/link";
import { buttonClasses } from "@/components/ui/button";
import { LogoMark } from "@/components/layout/logo";
import { getServerMessages } from "@/i18n/server";

export default async function NotFound() {
  const t = await getServerMessages();
  return (
    <main className="flex min-h-dvh flex-col items-center justify-center px-4 text-center">
      <LogoMark className="size-10" />
      <p className="mt-6 text-sm font-medium text-primary">404</p>
      <h1 className="mt-1 text-2xl font-semibold tracking-tight text-foreground">{t.common.notFoundTitle}</h1>
      <p className="mt-2 text-muted">{t.common.notFoundBody}</p>
      <Link href="/" className={buttonClasses("primary", "md", "mt-6")}>
        {t.common.backHome}
      </Link>
    </main>
  );
}
