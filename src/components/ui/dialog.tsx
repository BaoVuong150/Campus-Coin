"use client";

import { useEffect, useId, useRef, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { useIsClient } from "@/hooks/use-client-store";

const FOCUSABLE = 'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

interface DialogProps {
  open: boolean;
  onClose: () => void;
  title: ReactNode;
  description?: ReactNode;
  children: ReactNode;
  footer?: ReactNode;
  /** modal: giữa màn hình; sheet: trượt từ phải (desktop) / từ dưới (mobile). */
  variant?: "modal" | "sheet";
  size?: "sm" | "md" | "lg";
  role?: "dialog" | "alertdialog";
}

/** Chồng dialog đang mở: chỉ dialog trên cùng xử lý Esc/Tab. */
const openStack: string[] = [];

const SIZES = { sm: "sm:max-w-sm", md: "sm:max-w-lg", lg: "sm:max-w-2xl" };

/**
 * Dialog truy cập được: focus trap, Esc để đóng, trả focus về phần tử cũ, khóa cuộn nền,
 * chiều cao không vượt viewport (nội dung tự cuộn).
 */
export function Dialog({ open, onClose, title, description, children, footer, variant = "modal", size = "md", role = "dialog" }: DialogProps) {
  const panelRef = useRef<HTMLDivElement>(null);
  const onCloseRef = useRef(onClose);
  const titleId = useId();
  const descId = useId();
  const mounted = useIsClient();

  useEffect(() => {
    onCloseRef.current = onClose;
  }, [onClose]);

  useEffect(() => {
    if (!open) return;
    openStack.push(titleId);
    const previous = document.activeElement as HTMLElement | null;
    const overflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const panel = panelRef.current;
    const initial =
      panel?.querySelector<HTMLElement>("[data-autofocus]") ??
      panel?.querySelector<HTMLElement>("input, select, textarea") ??
      panel?.querySelector<HTMLElement>(FOCUSABLE);
    (initial ?? panel)?.focus();

    const onKey = (e: KeyboardEvent) => {
      if (openStack[openStack.length - 1] !== titleId) return;
      if (e.key === "Escape") {
        e.stopPropagation();
        onCloseRef.current();
        return;
      }
      if (e.key !== "Tab" || !panel) return;
      const items = Array.from(panel.querySelectorAll<HTMLElement>(FOCUSABLE)).filter((el) => el.offsetParent !== null);
      if (items.length === 0) return;
      const first = items[0];
      const last = items[items.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    };
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("keydown", onKey);
      openStack.splice(openStack.lastIndexOf(titleId), 1);
      document.body.style.overflow = overflow;
      previous?.focus?.();
    };
  }, [open, titleId]);

  if (!mounted || !open) return null;

  const sheet = variant === "sheet";

  return createPortal(
    <div className="fixed inset-0 z-50">
      <div className="absolute inset-0 animate-fade-in bg-overlay" onClick={onClose} aria-hidden />
      <div
        className={cn(
          "absolute inset-0 flex pointer-events-none",
          sheet ? "items-end justify-center sm:items-stretch sm:justify-end" : "items-end justify-center sm:items-center sm:p-4"
        )}
      >
        <div
          ref={panelRef}
          role={role}
          aria-modal="true"
          aria-labelledby={titleId}
          aria-describedby={description ? descId : undefined}
          tabIndex={-1}
          className={cn(
            "pointer-events-auto flex w-full flex-col bg-surface shadow-pop outline-none border-border",
            "max-h-[92dvh] rounded-t-xl border-t animate-slide-up",
            sheet
              ? "sm:h-full sm:max-h-none sm:max-w-md sm:rounded-none sm:border-t-0 sm:border-l sm:animate-slide-in-right"
              : cn("sm:rounded-xl sm:border sm:animate-scale-in", SIZES[size])
          )}
        >
          <div className="flex items-start justify-between gap-4 border-b border-border px-5 py-4">
            <div className="min-w-0">
              <h2 id={titleId} className="text-base font-semibold tracking-tight text-foreground">
                {title}
              </h2>
              {description && (
                <p id={descId} className="mt-0.5 text-[13px] text-muted">
                  {description}
                </p>
              )}
            </div>
            <button
              type="button"
              onClick={onClose}
              aria-label="Đóng"
              className="-mr-1.5 rounded-md p-1.5 text-subtle transition-colors hover:bg-surface-hover hover:text-foreground"
            >
              <X className="size-4" />
            </button>
          </div>
          <div className="min-h-0 flex-1 overflow-y-auto scrollbar-thin px-5 py-4">{children}</div>
          {footer && (
            <div className="flex flex-col-reverse gap-2 border-t border-border px-5 py-3.5 pb-[max(0.875rem,env(safe-area-inset-bottom))] sm:flex-row sm:justify-end">
              {footer}
            </div>
          )}
        </div>
      </div>
    </div>,
    document.body
  );
}
