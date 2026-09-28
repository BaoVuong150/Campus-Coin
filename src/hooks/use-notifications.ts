"use client";

import { useCallback } from "react";
import { apiFetch } from "@/lib/api-client";
import type { NotificationDTO, Paginated } from "@/types/finance";
import { invalidate, useApi } from "./use-api";

export type NotificationList = Paginated<NotificationDTO> & { unread: number };

export function useNotifications(page = 1, pageSize = 20, unreadOnly = false) {
  return useApi<NotificationList>(`/api/notifications?page=${page}&pageSize=${pageSize}&unread=${unreadOnly}`);
}

export function useNotificationMutations() {
  const markRead = useCallback(async (ids: number[]) => {
    await apiFetch("/api/notifications", { method: "PATCH", body: { ids } });
    invalidate("/api/notifications");
  }, []);
  const markAllRead = useCallback(async () => {
    await apiFetch("/api/notifications", { method: "PATCH", body: { all: true } });
    invalidate("/api/notifications");
  }, []);
  return { markRead, markAllRead };
}
