import Link from "next/link";
import { Globe, LayoutDashboard, ShieldCheck } from "lucide-react";
import type { Messages } from "@/i18n";

const GROUPS: { key: keyof Messages["sitemap"]["groups"]; icon: typeof Globe; hrefs: string[] }[] = [
  { key: "public", icon: Globe, hrefs: ["/", "/login", "/register", "/admin/login"] },
  {
    key: "app",
    icon: LayoutDashboard,
    hrefs: ["/dashboard", "/transactions", "/budgets", "/reports", "/goals", "/recurring", "/points", "/notifications", "/settings"],
  },
  { key: "admin", icon: ShieldCheck, hrefs: ["/admin", "/admin/users", "/admin/system"] },
];

/** Sơ đồ trang trực quan trên trang chủ (yêu cầu bắt buộc của đề bài). */
export default function SitemapSection({ t }: { t: Messages }) {
  return (
    <section id="sitemap" aria-labelledby="sitemap-title" className="scroll-mt-20">
      <h2 id="sitemap-title" className="text-2xl font-semibold tracking-tight text-foreground">
        {t.sitemap.title}
      </h2>
      <p className="mt-1.5 text-muted">{t.sitemap.subtitle}</p>
      <div className="mt-8 grid gap-4 lg:grid-cols-3">
        {GROUPS.map(({ key, icon: Icon, hrefs }) => (
          <div key={key} className="rounded-lg border border-border bg-surface p-5 shadow-card">
            <h3 className="flex items-center gap-2 text-sm font-semibold text-foreground">
              <Icon className="size-4 text-primary" aria-hidden /> {t.sitemap.groups[key]}
            </h3>
            <ul className="mt-4 space-y-1 border-l border-border pl-4">
              {hrefs.map((href) => {
                const [label, description] = t.sitemap.nodes[href];
                return (
                  <li key={href} className="relative">
                    <span className="absolute top-3.5 -left-4 h-px w-3 bg-border" aria-hidden />
                    <Link href={href} className="block rounded-md px-2 py-1.5 transition-colors hover:bg-surface-hover">
                      <span className="flex items-baseline justify-between gap-2">
                        <span className="text-sm font-medium text-foreground">{label}</span>
                        <code className="text-[11px] text-subtle">{href}</code>
                      </span>
                      <span className="block text-[12px] text-muted">{description}</span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </div>
    </section>
  );
}
