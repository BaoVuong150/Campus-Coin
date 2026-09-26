"use client";

import React, { createContext, useContext, useState, useCallback, ReactNode } from "react";
import { CheckCircle2, AlertCircle, AlertTriangle, Info, X } from "lucide-react";

export type ToastType = "success" | "error" | "warning" | "info";

export interface ToastItem {
  id: string;
  type: ToastType;
  title: string;
  description?: string;
}

export interface ConfirmOptions {
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  isDestructive?: boolean;
}

interface ToastContextType {
  toast: {
    success: (title: string, description?: string) => void;
    error: (title: string, description?: string) => void;
    warning: (title: string, description?: string) => void;
    info: (title: string, description?: string) => void;
  };
  confirm: (options: ConfirmOptions) => Promise<boolean>;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export function ToastProvider({ children }: { children: ReactNode }) {
  const [activeToast, setActiveToast] = useState<ToastItem | null>(null);
  const timerRef = React.useRef<NodeJS.Timeout | null>(null);
  const [confirmDialog, setConfirmDialog] = useState<{
    isOpen: boolean;
    options: ConfirmOptions;
    resolve: (val: boolean) => void;
  } | null>(null);

  const removeToast = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    setActiveToast(null);
  }, []);

  // Strict Singleton Toast: Only 1 toast visible at any time, even on spam clicks
  const addToast = useCallback((type: ToastType, title: string, description?: string) => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
    }

    const id = Date.now().toString();
    setActiveToast({ id, type, title, description });

    // Auto-dismiss after 4 seconds
    timerRef.current = setTimeout(() => {
      setActiveToast(null);
    }, 4000);
  }, []);

  const toast = {
    success: (title: string, description?: string) => addToast("success", title, description),
    error: (title: string, description?: string) => addToast("error", title, description),
    warning: (title: string, description?: string) => addToast("warning", title, description),
    info: (title: string, description?: string) => addToast("info", title, description),
  };

  const confirm = useCallback((options: ConfirmOptions): Promise<boolean> => {
    return new Promise((resolve) => {
      setConfirmDialog({
        isOpen: true,
        options,
        resolve,
      });
    });
  }, []);

  const handleConfirmAction = (result: boolean) => {
    if (confirmDialog) {
      confirmDialog.resolve(result);
      setConfirmDialog(null);
    }
  };

  return (
    <ToastContext.Provider value={{ toast, confirm }}>
      {children}

      {/* ================= GLOBAL TOAST CONTAINER (MAX 1 TOAST AT A TIME) ================= */}
      <div
        aria-live="polite"
        className="fixed bottom-5 right-5 z-[9999] max-w-sm w-full pointer-events-none p-2 sm:p-0"
      >
        {activeToast && (
          <div
            key={activeToast.id}
            role="alert"
            className="pointer-events-auto flex items-start gap-3 p-3.5 rounded-[12px] bg-white/95 dark:bg-[#0f1011]/95 backdrop-blur-md border border-[#e2e8f0] dark:border-[#23252a] shadow-xl text-[#0f1011] dark:text-[#f7f8f8] transition-all transform animate-in fade-in slide-in-from-bottom-2 duration-200"
          >
            <div className="flex-shrink-0 mt-0.5">
              {activeToast.type === "success" && (
                <CheckCircle2 className="w-4 h-4 text-[#16a34a] dark:text-[#27a644]" />
              )}
              {activeToast.type === "error" && (
                <AlertCircle className="w-4 h-4 text-[#e11d48] dark:text-[#f43f5e]" />
              )}
              {activeToast.type === "warning" && (
                <AlertTriangle className="w-4 h-4 text-[#f59e0b]" />
              )}
              {activeToast.type === "info" && (
                <Info className="w-4 h-4 text-[#5e6ad2] dark:text-[#828fff]" />
              )}
            </div>

            <div className="flex-1 text-xs">
              <p className="font-semibold text-[13px] leading-snug">{activeToast.title}</p>
              {activeToast.description && (
                <p className="text-[#64748b] dark:text-[#8a8f98] mt-1 leading-relaxed">
                  {activeToast.description}
                </p>
              )}
            </div>

            <button
              type="button"
              onClick={removeToast}
              className="text-[#94a3b8] dark:text-[#62666d] hover:text-[#0f1011] dark:hover:text-[#f7f8f8] p-1 rounded transition-colors cursor-pointer"
              title="Đóng thông báo"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}
      </div>

      {/* ================= GLOBAL CONFIRMATION DIALOG ================= */}
      {confirmDialog && confirmDialog.isOpen && (
        <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div
            role="dialog"
            aria-modal="true"
            className="w-full max-w-[420px] rounded-[14px] bg-white dark:bg-[#0f1011] border border-[#e2e8f0] dark:border-[#23252a] shadow-2xl p-6 text-[#0f1011] dark:text-[#f7f8f8] animate-in zoom-in-95 duration-150 space-y-4"
          >
            <div className="flex items-center gap-3">
              <div
                className={`w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 ${
                  confirmDialog.options.isDestructive
                    ? "bg-[#fff1f2] dark:bg-[#1f1315] text-[#e11d48]"
                    : "bg-[#f1f3f5] dark:bg-[#141516] text-[#5e6ad2]"
                }`}
              >
                {confirmDialog.options.isDestructive ? (
                  <AlertTriangle className="w-5 h-5 text-[#e11d48]" />
                ) : (
                  <Info className="w-5 h-5 text-[#5e6ad2]" />
                )}
              </div>
              <h3 className="text-[16px] font-semibold tracking-headline">
                {confirmDialog.options.title}
              </h3>
            </div>

            <p className="text-[13px] text-[#64748b] dark:text-[#8a8f98] leading-relaxed pl-12">
              {confirmDialog.options.message}
            </p>

            <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-[#e2e8f0] dark:border-[#23252a]">
              <button
                type="button"
                onClick={() => handleConfirmAction(false)}
                className="px-3.5 py-2 rounded-[8px] border border-[#e2e8f0] dark:border-[#23252a] bg-[#f8f9fa] dark:bg-[#141516] hover:bg-[#f1f3f5] dark:hover:bg-[#18191a] text-[#475569] dark:text-[#d0d6e0] text-[13px] font-medium transition-colors cursor-pointer"
              >
                {confirmDialog.options.cancelText || "Hủy bỏ"}
              </button>
              <button
                type="button"
                onClick={() => handleConfirmAction(true)}
                className={`px-4 py-2 rounded-[8px] text-[13px] font-medium text-white transition-colors cursor-pointer shadow-xs ${
                  confirmDialog.options.isDestructive
                    ? "bg-[#e11d48] hover:bg-[#be123c]"
                    : "bg-[#5e6ad2] hover:bg-[#828fff]"
                }`}
              >
                {confirmDialog.options.confirmText || "Xác nhận"}
              </button>
            </div>
          </div>
        </div>
      )}
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error("useToast must be used within a ToastProvider");
  }
  return context;
}
