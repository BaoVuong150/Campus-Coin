import { LayoutDashboard, Receipt, Target, Wallet } from "lucide-react";
import { LogoMark } from "@/components/layout/logo";
import type { Messages } from "@/i18n";
import { cn } from "@/lib/utils/cn";

const ITEMS = [LayoutDashboard, Receipt, Wallet, Target];

/** Thanh bên thu gọn của mockup: chỉ icon, mục đầu đang chọn. */
export function DemoSidebar({ t }: { t: Messages }) {
  return (
    <div className="hidden w-[70px] shrink-0 flex-col items-center border-r border-border py-5 sm:flex">
      <LogoMark className="size-8" />
      <ul className="mt-8 flex flex-1 flex-col gap-2">
        {ITEMS.map((Icon, i) => (
          <li
            key={t.landing.demo.sidebar[i]}
            title={t.landing.demo.sidebar[i]}
            className={cn(
              "flex size-10 items-center justify-center rounded-lg",
              i === 0 ? "bg-primary-soft text-primary" : "text-subtle"
            )}
          >
            <Icon className="size-[18px]" strokeWidth={1.75} aria-hidden />
          </li>
        ))}
      </ul>
      <span className="flex size-8 items-center justify-center rounded-full bg-primary-soft text-[12px] font-semibold text-primary" aria-hidden>
        A
      </span>
    </div>
  );
}
