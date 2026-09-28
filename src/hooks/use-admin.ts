"use client";

import { useCallback } from "react";
import { apiFetch } from "@/lib/api-client";
import type { AdminOverviewDTO, AdminUserDTO } from "@/types/admin";
import type { CategoryDTO, Paginated, TransactionType } from "@/types/finance";
import { buildQuery, invalidate, useApi } from "./use-api";

export type { AdminOverviewDTO, AdminUserDTO };
export type AdminCategory = CategoryDTO & { usage: number };

export const useAdminOverview = () => useApi<AdminOverviewDTO>("/api/admin/overview");
export const useAdminUsers = (q: string, status: string, page: number) =>
  useApi<Paginated<AdminUserDTO>>(`/api/admin/users${buildQuery({ q, status, page, pageSize: 20 })}`);
export const useAdminCategories = () => useApi<AdminCategory[]>("/api/admin/categories");

export function useAdminMutations() {
  const updateUser = useCallback(async (id: string, input: { is_active?: boolean; role?: "student" | "admin" }) => {
    const user = await apiFetch<AdminUserDTO>(`/api/admin/users/${id}`, { method: "PATCH", body: input });
    invalidate("/api/admin");
    return user;
  }, []);
  const createCategory = useCallback(async (input: { name: string; type: TransactionType; icon?: string; color?: string }) => {
    await apiFetch("/api/admin/categories", { method: "POST", body: input });
    invalidate("/api/admin/categories", "/api/categories");
  }, []);
  const deleteCategory = useCallback(async (id: number) => {
    await apiFetch(`/api/admin/categories/${id}`, { method: "DELETE" });
    invalidate("/api/admin/categories", "/api/categories");
  }, []);
  const announce = useCallback(
    (title: string, message: string) =>
      apiFetch<{ sent: number }>("/api/admin/announcements", { method: "POST", body: { title, message } }),
    []
  );
  return { updateUser, createCategory, deleteCategory, announce };
}
