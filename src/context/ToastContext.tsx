"use client";

import { createContext, useCallback, useContext, useMemo, useRef, useState, type ReactNode } from "react";
import { AlertCircle, AlertTriangle, CheckCircle2, Info, X } from "lucide-react";
import { ConfirmDialog } from "@/components/common/confirm-dialog";
import { cn } from "@/lib/utils/cn";

export type ToastType = "success" | "error" | "warning" | "info";

interface ToastAction {
  label: string;
  onClick: () => void;
}

interface ToastItem {
  id: number;
  type: ToastType;
  title: string;
  description?: string;
  action?: ToastAction;
}

export interface ConfirmOptions {
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  isDestructive?: boolean;
}

type ToastFn = (title: string, description?: string, action?: ToastAction) => void;

interface ToastContextValue {
  toast: Record<ToastType, ToastFn>;
  confirm: (options: ConfirmOptions) => Promise<boolean>;
}

const ToastContext = createContext<ToastContextValue | undefined>(undefined);

const TOAST_DURATION_MS = 4000;
const TOAST_WITH_ACTION_DURATION_MS = 7000;

const ICONS: Record<ToastType, typeof Info> = {
  success: CheckCircle2,
  error: AlertCircle,
  warning: AlertTriangle,
  info: Info,
};

const ICON_COLOR: Record<ToastType, string> = {
  success: "text-success",
  error: "text-danger",
  warning: "text-warning",
  info: "text-info",
};

/**
 * Toast dạng singleton: luôn chỉ một toast trên màn hình, toast mới thay thế toast cũ (quy tắc chống spam trong AGENTS.md).
 */
export function ToastProvider({ children }: { children: ReactNode }) {
  const [active, setActive] = useState<ToastItem | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const seq = useRef(0);
  const [dialog, setDialog] = useState<{ options: ConfirmOptions; resolve: (v: boolean) => void } | null>(null);

  const dismiss = useCallback(() => {
    if (timer.current) clearTimeout(timer.current);
    setActive(null);
  }, []);

  const show = useCallback((type: ToastType, title: string, description?: string, action?: ToastAction) => {
    if (timer.current) clearTimeout(timer.current);
    seq.current += 1;
    setActive({ id: seq.current, type, title, description, action });
    timer.current = setTimeout(() => setActive(null), action ? TOAST_WITH_ACTION_DURATION_MS : TOAST_DURATION_MS);
  }, []);

  const toast = useMemo<Record<ToastType, ToastFn>>(
    () => ({
      success: (t, d, a) => show("success", t, d, a),
      error: (t, d, a) => show("error", t, d, a),
      warning: (t, d, a) => show("warning", t, d, a),
      info: (t, d, a) => show("info", t, d, a),
    }),
    [show]
  );

  const confirm = useCallback(
    (options: ConfirmOptions) => new Promise<boolean>((resolve) => setDialog({ options, resolve })),
    []
  );

  const close = (result: boolean) => {
    dialog?.resolve(result);
    setDialog(null);
  };

  const value = useMemo(() => ({ toast, confirm }), [toast, confirm]);
  const Icon = active ? ICONS[active.type] : null;

  return (
    <ToastContext.Provider value={value}>
      {children}

      <div
        aria-live="polite"
        className="pointer-events-none fixed inset-x-0 bottom-20 z-60 flex justify-center px-4 md:inset-x-auto md:right-6 md:bottom-6 md:justify-end"
      >
        {active && Icon && (
          <div
            key={active.id}
            role={active.type === "error" ? "alert" : "status"}
            className="pointer-events-auto flex w-full max-w-sm animate-slide-up items-start gap-3 rounded-lg border border-border bg-surface p-3.5 shadow-pop"
          >
            <Icon className={cn("mt-0.5 size-4 shrink-0", ICON_COLOR[active.type])} aria-hidden />
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium text-foreground">{active.title}</p>
              {active.description && <p className="mt-0.5 text-[13px] leading-relaxed text-muted">{active.description}</p>}
              {active.action && (
                <button
                  type="button"
                  onClick={() => {
                    active.action?.onClick();
                    dismiss();
                  }}
                  className="mt-2 text-[13px] font-medium text-primary hover:underline"
                >
                  {active.action.label}
                </button>
              )}
            </div>
            <button
              type="button"
              onClick={dismiss}
              aria-label="Đóng thông báo"
              className="rounded-md p-1 text-subtle transition-colors hover:bg-surface-hover hover:text-foreground"
            >
              <X className="size-3.5" />
            </button>
          </div>
        )}
      </div>

      <ConfirmDialog
        open={!!dialog}
        title={dialog?.options.title ?? ""}
        message={dialog?.options.message ?? ""}
        confirmText={dialog?.options.confirmText}
        cancelText={dialog?.options.cancelText}
        destructive={dialog?.options.isDestructive}
        onResult={close}
      />
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) throw new Error("useToast must be used within a ToastProvider");
  return context;
}
