"use client";

import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from "react";
import type { TransactionDTO } from "@/types/finance";
import { TransactionDetailSheet } from "./transaction-detail-sheet";
import { TransactionFormDialog, type TransactionFormDefaults } from "./transaction-form-dialog";

interface TransactionUI {
  openCreate: (defaults?: TransactionFormDefaults) => void;
  openEdit: (tx: TransactionDTO) => void;
  openDetail: (tx: TransactionDTO, options?: { unusual?: boolean }) => void;
}

const TransactionUIContext = createContext<TransactionUI | null>(null);

/** Một form thêm/sửa và một sheet chi tiết dùng chung cho toàn app (header, dashboard, trang giao dịch). */
export function TransactionProvider({ children }: { children: ReactNode }) {
  const [form, setForm] = useState<{ open: boolean; key: number; tx: TransactionDTO | null; defaults?: TransactionFormDefaults }>({
    open: false,
    key: 0,
    tx: null,
  });
  const [detail, setDetail] = useState<{ tx: TransactionDTO; unusual: boolean } | null>(null);

  // key mới mỗi lần mở → form được mount lại với state sạch.
  const openCreate = useCallback(
    (defaults?: TransactionFormDefaults) => setForm((f) => ({ open: true, key: f.key + 1, tx: null, defaults })),
    []
  );
  const openEdit = useCallback((tx: TransactionDTO) => {
    setDetail(null);
    setForm((f) => ({ open: true, key: f.key + 1, tx }));
  }, []);
  const openDetail = useCallback(
    (tx: TransactionDTO, options?: { unusual?: boolean }) => setDetail({ tx, unusual: !!options?.unusual }),
    []
  );

  const value = useMemo(() => ({ openCreate, openEdit, openDetail }), [openCreate, openEdit, openDetail]);

  return (
    <TransactionUIContext.Provider value={value}>
      {children}
      <TransactionFormDialog
        key={form.key}
        open={form.open}
        transaction={form.tx}
        defaults={form.defaults}
        onClose={() => setForm((f) => ({ ...f, open: false }))}
      />
      <TransactionDetailSheet
        transaction={detail?.tx ?? null}
        unusual={detail?.unusual}
        onClose={() => setDetail(null)}
        onEdit={openEdit}
      />
    </TransactionUIContext.Provider>
  );
}

export function useTransactionUI() {
  const context = useContext(TransactionUIContext);
  if (!context) throw new Error("useTransactionUI must be used within TransactionProvider");
  return context;
}
