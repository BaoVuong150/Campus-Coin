"use client";

import { useCallback } from "react";
import { apiFetch } from "@/lib/api-client";
import type { ProfileDTO } from "@/types/finance";
import { invalidate, useApi } from "./use-api";

export interface ProfileInput {
  name?: string;
  academic_year?: string | null;
  monthly_allowance_baseline?: number;
  monthly_savings_goal?: number;
  salary_pay_day?: number;
  notifications?: ProfileDTO["notifications"];
}

export function useProfile() {
  return useApi<ProfileDTO>("/api/profile");
}

export function useProfileMutations() {
  const update = useCallback(async (input: ProfileInput) => {
    const profile = await apiFetch<ProfileDTO>("/api/profile", { method: "PATCH", body: input });
    invalidate("/api/profile", "/api/planning");
    return profile;
  }, []);
  const changePassword = useCallback(
    (currentPassword: string, newPassword: string) =>
      apiFetch("/api/auth/password", { method: "POST", body: { currentPassword, newPassword } }),
    []
  );
  return { update, changePassword };
}
