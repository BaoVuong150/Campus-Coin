import { cn } from "@/lib/utils/cn";

export type ProgressTone = "primary" | "warning" | "danger" | "info";

const TONES: Record<ProgressTone, string> = {
  primary: "bg-primary",
  warning: "bg-warning",
  danger: "bg-danger",
  info: "bg-info",
};

interface ProgressProps {
  value: number;
  tone?: ProgressTone;
  label: string;
  className?: string;
  size?: "sm" | "md";
}

export function Progress({ value, tone = "primary", label, className, size = "md" }: ProgressProps) {
  const clamped = Math.max(0, Math.min(100, value));
  return (
    <div
      role="progressbar"
      aria-label={label}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={Math.round(value)}
      className={cn("w-full overflow-hidden rounded-full bg-surface-secondary", size === "sm" ? "h-1.5" : "h-2", className)}
    >
      <div
        className={cn("h-full rounded-full transition-[width] duration-300 ease-out", TONES[tone])}
        style={{ width: `${clamped}%` }}
      />
    </div>
  );
}
