"use client";

import { useCallback } from "react";
import { apiFetch } from "@/lib/api-client";
import type { CategoryDTO, CategorySuggestion, TransactionType } from "@/types/finance";
import { FINANCE_KEYS, invalidate, useApi } from "./use-api";

export function useCategories() {
  return useApi<CategoryDTO[]>("/api/categories");
}

export function suggestCategory(text: string, type: TransactionType) {
  return apiFetch<{ suggestion: CategorySuggestion | null }>("/api/categories/suggest", {
    method: "POST",
    body: { text, type },
  }).then((r) => r.suggestion);
}

/** Gợi ý danh mục hàng loạt (nhập CSV). */
export function suggestCategories(items: { text: string; type: TransactionType }[]) {
  return apiFetch<{ suggestions: (CategorySuggestion | null)[] }>("/api/categories/suggest-batch", {
    method: "POST",
    body: { items },
  }).then((r) => r.suggestions);
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
  const update = useCallback(async (id: number, input: { name?: string; type?: TransactionType }) => {
    await apiFetch(`/api/categories/${id}`, { method: "PATCH", body: input });
    // Tên danh mục hiển thị ở giao dịch, ngân sách, báo cáo… → làm mới các màn hình đó.
    invalidate("/api/categories", ...FINANCE_KEYS);
  }, []);
  return { create, update, remove };
}
