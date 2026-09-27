"use client";

import { useCallback } from "react";
import { apiFetch } from "@/lib/api-client";
import type { CategoryDTO, CategorySuggestion, TransactionType } from "@/types/finance";
import { invalidate, useApi } from "./use-api";

export function useCategories() {
  return useApi<CategoryDTO[]>("/api/categories");
}

export function suggestCategory(text: string, type: TransactionType) {
  return apiFetch<{ suggestion: CategorySuggestion | null }>("/api/categories/suggest", {
    method: "POST",
    body: { text, type },
  }).then((r) => r.suggestion);
}

export function useCategoryMutations() {
  const create = useCallback(async (input: { name: string; type: TransactionType; icon?: string; color?: string }) => {
    const created = await apiFetch<CategoryDTO>("/api/categories", { method: "POST", body: input });
    invalidate("/api/categories");
    return created;
  }, []);
  const remove = useCallback(async (id: number) => {
    await apiFetch(`/api/categories/${id}`, { method: "DELETE" });
    invalidate("/api/categories");
  }, []);
  return { create, remove };
}
