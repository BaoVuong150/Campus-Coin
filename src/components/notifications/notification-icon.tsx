import { AlertTriangle, Bell, Repeat, ShieldCheck, Target, TrendingUp, Wallet } from "lucide-react";
import type { NotificationKind } from "@/constants/finance";
import type { NotificationDTO } from "@/types/finance";
import { cn } from "@/lib/utils/cn";

const ICONS: Record<NotificationKind, typeof Bell> = {
  budget_warning: Wallet,
  budget_exceeded: AlertTriangle,
  recurring: Repeat,
  goal: Target,
  unusual: TrendingUp,
  security: ShieldCheck,
  system: Bell,
};

const TONES: Record<NotificationDTO["type"], string> = {
  info: "bg-info-soft text-info",
  warning: "bg-warning-soft text-warning",
  alert: "bg-danger-soft text-danger",
  success: "bg-success-soft text-success",
};

export function NotificationIcon({ kind, type }: { kind: NotificationKind; type: NotificationDTO["type"] }) {
  const Icon = ICONS[kind] ?? Bell;
  return (
    <span className={cn("flex size-8 shrink-0 items-center justify-center rounded-full", TONES[type])} aria-hidden>
      <Icon className="size-4" />
    </span>
  );
}
