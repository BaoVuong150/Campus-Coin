"use client";

import { useCallback } from "react";
import { apiFetch } from "@/lib/api-client";
import type { RecurringFrequency, RecurringStatus } from "@/constants/finance";
import type { RecurringDTO, TransactionType } from "@/types/finance";
import { FINANCE_KEYS, invalidate, useApi } from "./use-api";

export interface RecurringInput {
  name: string;
  amount: number;
  type: TransactionType;
  category_id: number;
  frequency: RecurringFrequency;
  start_date: string;
  end_date?: string | null;
  is_fixed?: boolean;
  status?: RecurringStatus;
}

export function useRecurring() {
  return useApi<RecurringDTO[]>("/api/recurring");
}

export function useRecurringMutations() {
  const create = useCallback(async (input: RecurringInput) => {
    const item = await apiFetch<RecurringDTO>("/api/recurring", { method: "POST", body: input });
    invalidate(...FINANCE_KEYS);
    return item;
  }, []);
  const update = useCallback(async (id: string, input: Partial<Omit<RecurringInput, "start_date">>) => {
    const item = await apiFetch<RecurringDTO>(`/api/recurring/${id}`, { method: "PATCH", body: input });
    invalidate(...FINANCE_KEYS);
    return item;
  }, []);
  const remove = useCallback(async (id: string) => {
    await apiFetch(`/api/recurring/${id}`, { method: "DELETE" });
    invalidate(...FINANCE_KEYS);
  }, []);
  return { create, update, remove };
}
