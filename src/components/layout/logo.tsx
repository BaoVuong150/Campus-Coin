import { cn } from "@/lib/utils/cn";

/** Logo Campus Coin: đồng xu tối giản với chữ C – coin chỉ là branding, không phải crypto. */
export function LogoMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" className={cn("size-8", className)} aria-hidden>
      <rect width="32" height="32" rx="9" fill="var(--primary)" />
      <circle cx="16" cy="16" r="9.5" fill="none" stroke="var(--primary-foreground)" strokeOpacity="0.35" strokeWidth="1.5" />
      <path
        d="M20.2 12.6a5.2 5.2 0 1 0 0 6.8"
        fill="none"
        stroke="var(--primary-foreground)"
        strokeWidth="2.4"
        strokeLinecap="round"
      />
    </svg>
  );
}

export function Logo({ collapsed = false, className }: { collapsed?: boolean; className?: string }) {
  return (
    <span className={cn("inline-flex items-center gap-2.5", className)}>
      <LogoMark />
      {!collapsed && <span className="text-[15px] font-semibold tracking-tight text-foreground">Campus Coin</span>}
    </span>
  );
}
