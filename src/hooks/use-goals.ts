"use client";

import { useCallback } from "react";
import { apiFetch } from "@/lib/api-client";
import type { GoalDTO } from "@/types/finance";
import type { GoalStatus } from "@/constants/finance";
import { invalidate, useApi } from "./use-api";

const KEYS = ["/api/goals", "/api/planning", "/api/notifications"];

export interface GoalInput {
  name: string;
  target_amount: number;
  deadline?: string | null;
  icon?: string;
  status?: GoalStatus;
}

/** includeArchived: trang Mục tiêu cần cả mục đã lưu trữ để khôi phục; dashboard chỉ cần mục đang dùng. */
export function useGoals(includeArchived = false) {
  return useApi<GoalDTO[]>(includeArchived ? "/api/goals?archived=true" : "/api/goals");
}

export function useGoalMutations() {
  const create = useCallback(async (input: GoalInput) => {
    const goal = await apiFetch<GoalDTO>("/api/goals", { method: "POST", body: input });
    invalidate(...KEYS);
    return goal;
  }, []);
  const update = useCallback(async (id: string, input: Partial<GoalInput>) => {
    const goal = await apiFetch<GoalDTO>(`/api/goals/${id}`, { method: "PATCH", body: input });
    invalidate(...KEYS);
    return goal;
  }, []);
  const remove = useCallback(async (id: string) => {
    await apiFetch(`/api/goals/${id}`, { method: "DELETE" });
    invalidate(...KEYS);
  }, []);
  const contribute = useCallback(async (id: string, amount: number, direction: "deposit" | "withdraw") => {
    const goal = await apiFetch<GoalDTO>(`/api/goals/${id}/contributions`, { method: "POST", body: { amount, direction } });
    invalidate(...KEYS);
    return goal;
  }, []);
  return { create, update, remove, contribute };
}
