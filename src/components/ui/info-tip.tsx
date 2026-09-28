"use client";

import { useEffect, useId, useRef, useState, type ReactNode } from "react";
import { Info } from "lucide-react";
import { cn } from "@/lib/utils/cn";

interface InfoTipProps {
  label: string;
  children: ReactNode;
  className?: string;
  align?: "left" | "right";
}

/** Nút "i" mở popover giải thích (click/Enter), đóng bằng Esc hoặc click ra ngoài. */
export function InfoTip({ label, children, className, align = "right" }: InfoTipProps) {
  const [open, setOpen] = useState(false);
  const id = useId();
  const ref = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (!ref.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <span ref={ref} className={cn("relative inline-flex", className)}>
      <button
        type="button"
        aria-expanded={open}
        aria-controls={id}
        onClick={() => setOpen((v) => !v)}
        className="inline-flex items-center gap-1 rounded text-[12px] text-subtle transition-colors hover:text-foreground"
      >
        <Info className="size-3.5" aria-hidden />
        {label}
      </button>
      {open && (
        <span
          id={id}
          role="dialog"
          aria-label={label}
          className={cn(
            "absolute top-full z-30 mt-2 w-72 max-w-[calc(100vw-2rem)] animate-scale-in rounded-lg border border-border bg-surface p-3.5 text-left text-[13px] leading-relaxed text-muted shadow-pop",
            align === "right" ? "right-0" : "left-0"
          )}
        >
          {children}
        </span>
      )}
    </span>
  );
}
