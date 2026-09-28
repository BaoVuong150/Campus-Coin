"use client";

import { useCallback } from "react";
import { apiFetch } from "@/lib/api-client";
import type { BudgetOverviewDTO } from "@/types/finance";
import { FINANCE_KEYS, invalidate, useApi } from "./use-api";

export function useBudgets(month: string) {
  return useApi<BudgetOverviewDTO>(`/api/budgets?month=${month}`);
}

export function useBudgetMutations() {
  const save = useCallback(async (input: { category_id: number; month: string; limit_amount: number }) => {
    const result = await apiFetch<BudgetOverviewDTO>("/api/budgets", { method: "POST", body: input });
    invalidate(...FINANCE_KEYS);
    return result;
  }, []);
  const updateLimit = useCallback(async (id: number, limit_amount: number) => {
    await apiFetch(`/api/budgets/${id}`, { method: "PATCH", body: { limit_amount } });
    invalidate(...FINANCE_KEYS);
  }, []);
  const remove = useCallback(async (id: number) => {
    await apiFetch(`/api/budgets/${id}`, { method: "DELETE" });
    invalidate(...FINANCE_KEYS);
  }, []);
  const copy = useCallback(async (from: string, to: string) => {
    const result = await apiFetch<{ copied: number }>("/api/budgets/copy", { method: "POST", body: { from, to } });
    invalidate(...FINANCE_KEYS);
    return result.copied;
  }, []);
  return { save, updateLimit, remove, copy };
}
