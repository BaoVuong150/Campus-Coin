"use client";

import { useCallback } from "react";
import { apiFetch } from "@/lib/api-client";
import type { InsightHistoryDTO, SavingTipDTO, SystemTipDTO } from "@/types/finance";
import { invalidate, useApi } from "./use-api";

export type TipAction = "pin" | "unpin" | "dismiss" | "restore";

export const useSavingTips = () => useApi<{ items: SavingTipDTO[]; total: number }>("/api/tips");
export const useInsightHistory = () => useApi<InsightHistoryDTO[]>("/api/insights/history");
export const useSystemTips = () => useApi<SystemTipDTO[]>("/api/admin/tips");

export function useTipMutations() {
  const setTip = useCallback(async (key: string, action: TipAction) => {
    await apiFetch("/api/tips", { method: "PATCH", body: { key, action } });
    invalidate("/api/tips");
  }, []);
  const pinInsight = useCallback(async (id: number, pinned: boolean) => {
    await apiFetch(`/api/insights/history/${id}`, { method: "PATCH", body: { pinned } });
    invalidate("/api/insights/history");
  }, []);
  const createSystemTip = useCallback(async (input: { title: string; content: string; potential_saving?: number | null }) => {
    await apiFetch("/api/admin/tips", { method: "POST", body: input });
    invalidate("/api/admin/tips", "/api/tips");
  }, []);
  const deleteSystemTip = useCallback(async (id: number) => {
    await apiFetch(`/api/admin/tips/${id}`, { method: "DELETE" });
    invalidate("/api/admin/tips", "/api/tips");
  }, []);
  return { setTip, pinInsight, createSystemTip, deleteSystemTip };
}
