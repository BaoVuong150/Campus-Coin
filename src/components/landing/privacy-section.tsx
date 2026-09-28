import { KeyRound, Landmark, UserLock } from "lucide-react";
import type { Messages } from "@/i18n";
import { SectionHeading } from "./section-heading";

const ICONS = [Landmark, UserLock, KeyRound];

/** Mọi cam kết ở đây đều có trong code: không liên kết ngân hàng, dữ liệu giới hạn theo tài khoản, bcrypt + cookie httpOnly + rate limit. */
export function PrivacySection({ t }: { t: Messages }) {
  const p = t.landing.privacy;
  return (
    <section id="security" aria-labelledby="security-title" className="scroll-mt-20 bg-inverse">
      <div className="mx-auto max-w-7xl px-4 py-24 sm:px-6 lg:px-8 lg:py-28">
        <SectionHeading id="security-title" eyebrow={p.eyebrow} title={p.title} inverse />
        <ul className="mt-14 grid gap-px overflow-hidden rounded-xl border border-inverse-border bg-inverse-border md:grid-cols-3">
          {p.items.map((item, i) => {
            const Icon = ICONS[i];
            return (
              <li key={item.title} className="bg-inverse p-7">
                <Icon className="size-5 text-brand-bright" strokeWidth={1.75} aria-hidden />
                <h3 className="mt-5 text-[17px] font-semibold text-inverse-foreground">{item.title}</h3>
                <p className="mt-2 text-[15px] leading-[1.65] text-inverse-muted">{item.body}</p>
              </li>
            );
          })}
        </ul>
      </div>
    </section>
  );
}
