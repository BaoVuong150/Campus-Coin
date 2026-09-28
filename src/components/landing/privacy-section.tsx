import { KeyRound, Landmark, UserLock } from "lucide-react";
import { Section } from "@/components/layout/container";
import type { Messages } from "@/i18n";
import { SectionHeading } from "./section-heading";

const ICONS = [Landmark, UserLock, KeyRound];

/** Mọi cam kết ở đây đều có trong code: không liên kết ngân hàng, dữ liệu giới hạn theo tài khoản, bcrypt + cookie httpOnly + rate limit. */
export function PrivacySection({ t }: { t: Messages }) {
  const p = t.landing.privacy;
  return (
    <Section id="security" labelledBy="security-title" className="bg-inverse">
      <SectionHeading id="security-title" eyebrow={p.eyebrow} title={p.title} inverse />
      <ul className="mt-14 grid gap-px overflow-hidden rounded-xl border border-inverse-border bg-inverse-border md:grid-cols-3">
        {p.items.map((item, i) => {
          const Icon = ICONS[i];
          return (
            <li key={item.title} className="bg-inverse p-6 sm:p-7 xl:p-9">
              <Icon className="size-5 text-brand-bright" strokeWidth={1.75} aria-hidden />
              <h3 className="mt-5 text-[17px] font-semibold text-inverse-foreground">{item.title}</h3>
              <p className="mt-2 text-[15px] leading-[1.65] text-inverse-muted">{item.body}</p>
            </li>
          );
        })}
      </ul>
    </Section>
  );
}
