"use client";

import { useCallback } from "react";
import { apiFetch } from "@/lib/api-client";
import type { Paginated, TransactionDTO, TransactionType, TransactionWarnings } from "@/types/finance";
import { buildQuery, FINANCE_KEYS, invalidate, useApi } from "./use-api";

export interface TransactionFilters {
  q?: string;
  type?: "all" | TransactionType;
  category_id?: number | null;
  from?: string;
  to?: string;
  min?: number | null;
  max?: number | null;
  sort?: "date_desc" | "date_asc" | "amount_desc" | "amount_asc";
  page?: number;
  pageSize?: number;
}

export type TransactionList = Paginated<TransactionDTO> & {
  totals: { income: number; expense: number };
  unusualIds: string[];
};

export interface TransactionInput {
  amount: number;
  type: TransactionType;
  description: string;
  category_id: number;
  date: string;
  suggested_category_id?: number | null;
}

export function useTransactions(filters: TransactionFilters | null) {
  return useApi<TransactionList>(filters ? `/api/transactions${buildQuery({ ...filters })}` : null);
}

export function useTransactionMutations() {
  const create = useCallback(async (input: TransactionInput) => {
    const created = await apiFetch<TransactionDTO>("/api/transactions", { method: "POST", body: input });
    invalidate(...FINANCE_KEYS);
    return created;
  }, []);

  const update = useCallback(async (id: string, input: Partial<TransactionInput>) => {
    const updated = await apiFetch<TransactionDTO>(`/api/transactions/${id}`, { method: "PATCH", body: input });
    invalidate(...FINANCE_KEYS);
    return updated;
  }, []);

  const remove = useCallback(async (id: string) => {
    await apiFetch(`/api/transactions/${id}`, { method: "DELETE" });
    invalidate(...FINANCE_KEYS);
  }, []);

  const check = useCallback(
    (input: Omit<TransactionInput, "suggested_category_id">, excludeId?: string) =>
      apiFetch<TransactionWarnings>("/api/transactions/check", { method: "POST", body: { ...input, exclude_id: excludeId } }),
    []
  );

  return { create, update, remove, check };
}
