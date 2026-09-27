"use client";

import { AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";

interface ConfirmDialogProps {
  open: boolean;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  destructive?: boolean;
  onResult: (confirmed: boolean) => void;
}

export function ConfirmDialog({ open, title, message, confirmText, cancelText, destructive, onResult }: ConfirmDialogProps) {
  return (
    <Dialog
      open={open}
      onClose={() => onResult(false)}
      role="alertdialog"
      size="sm"
      title={
        <span className="flex items-center gap-2">
          {destructive && <AlertTriangle className="size-4 text-danger" aria-hidden />}
          {title}
        </span>
      }
      footer={
        <>
          <Button variant="outline" onClick={() => onResult(false)} data-autofocus={destructive ? true : undefined}>
            {cancelText ?? "Hủy"}
          </Button>
          <Button variant={destructive ? "danger" : "primary"} onClick={() => onResult(true)} data-autofocus={destructive ? undefined : true}>
            {confirmText ?? "Xác nhận"}
          </Button>
        </>
      }
    >
      <p className="text-sm leading-relaxed text-muted">{message}</p>
    </Dialog>
  );
}
