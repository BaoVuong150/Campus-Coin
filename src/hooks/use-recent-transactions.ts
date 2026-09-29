"use client";

import { useCallback, useMemo } from "react";
import type { TransactionDTO } from "@/types/finance";
import { useLocalStorage } from "./use-client-store";

export interface RecentTransaction {
  id: string;
  description: string;
  amount: number;
  type: TransactionDTO["type"];
  action: "viewed" | "edited";
  at: string;
}

/** Số giao dịch vừa xem/sửa được ghi nhớ. */
const MAX_RECENT = 6;

function parse(raw: string): RecentTransaction[] {
  try {
    const value: unknown = JSON.parse(raw);
    return Array.isArray(value) ? (value as RecentTransaction[]).slice(0, MAX_RECENT) : [];
  } catch {
    return [];
  }
}

/**
 * Giao dịch vừa xem / vừa sửa (SRS – "tracks recently viewed and recently edited transactions across sessions").
 * Lưu trên trình duyệt theo từng user nên còn sau khi đăng xuất/đăng nhập lại trên cùng thiết bị;
 * user khác đăng nhập trên máy đó không thấy danh sách này.
 */
export function useRecentTransactions(userId: string) {
  const [raw, setRaw] = useLocalStorage(`campuscoin_recent_tx_${userId}`, "[]");
  const items = useMemo(() => parse(raw), [raw]);

  const record = useCallback(
    (tx: TransactionDTO, action: RecentTransaction["action"]) => {
      const entry: RecentTransaction = { id: tx.id, description: tx.description, amount: tx.amount, type: tx.type, action, at: new Date().toISOString() };
      setRaw(JSON.stringify([entry, ...parse(raw).filter((r) => r.id !== tx.id)].slice(0, MAX_RECENT)));
    },
    [raw, setRaw]
  );

  const forget = useCallback((id: string) => setRaw(JSON.stringify(parse(raw).filter((r) => r.id !== id))), [raw, setRaw]);

  return { items, record, forget };
}
