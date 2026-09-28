"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { ApiClientError, apiFetch } from "@/lib/api-client";

/**
 * Cache nhỏ trong bộ nhớ (stale-while-revalidate): quay lại trang cũ thấy dữ liệu ngay,
 * đồng thời tải lại ngầm. Sau mỗi thao tác ghi, gọi invalidate("/api/...") để các màn hình liên quan tự làm mới.
 */
const cache = new Map<string, unknown>();
const listeners = new Set<(url: string) => void>();

export function invalidate(...prefixes: string[]) {
  for (const key of [...cache.keys()]) {
    if (prefixes.some((p) => key.startsWith(p))) cache.delete(key);
  }
  for (const listener of listeners) {
    for (const p of prefixes) listener(p);
  }
}

/** Các nhóm dữ liệu bị ảnh hưởng khi giao dịch thay đổi. */
export const FINANCE_KEYS = [
  "/api/transactions",
  "/api/analytics",
  "/api/budgets",
  "/api/planning",
  "/api/reports",
  "/api/notifications",
  "/api/goals",
  "/api/recurring",
  "/api/points",
];

export interface ApiState<T> {
  data: T | undefined;
  /** Mã lỗi (ErrorCode) nếu lần tải gần nhất thất bại. */
  error: string | null;
  isLoading: boolean;
  isValidating: boolean;
  reload: () => Promise<void>;
  mutate: (updater: (current: T | undefined) => T | undefined) => void;
}

export function useApi<T>(url: string | null): ApiState<T> {
  const [data, setData] = useState<T | undefined>(() => (url ? (cache.get(url) as T | undefined) : undefined));
  const [error, setError] = useState<string | null>(null);
  const [isValidating, setIsValidating] = useState(false);
  const [trackedUrl, setTrackedUrl] = useState(url);
  const urlRef = useRef(url);
  const requestId = useRef(0);

  // URL đổi (bộ lọc, trang...): lấy ngay dữ liệu cache của URL mới trong lúc render, không chờ effect.
  if (trackedUrl !== url) {
    setTrackedUrl(url);
    setData(url ? (cache.get(url) as T | undefined) : undefined);
    setError(null);
  }

  const load = useCallback(async () => {
    const target = urlRef.current;
    if (!target) return;
    const id = ++requestId.current;
    setIsValidating(true);
    try {
      const result = await apiFetch<T>(target);
      if (id !== requestId.current) return;
      cache.set(target, result);
      setData(result);
      setError(null);
    } catch (e) {
      if (id !== requestId.current) return;
      setError(e instanceof ApiClientError ? e.code : "INTERNAL_ERROR");
    } finally {
      if (id === requestId.current) setIsValidating(false);
    }
  }, []);

  useEffect(() => {
    urlRef.current = url;
    void load();
  }, [url, load]);

  useEffect(() => {
    const listener = (prefix: string) => {
      if (urlRef.current?.startsWith(prefix)) void load();
    };
    listeners.add(listener);
    return () => {
      listeners.delete(listener);
    };
  }, [load]);

  const mutate = useCallback((updater: (current: T | undefined) => T | undefined) => {
    setData((current) => {
      const next = updater(current);
      if (urlRef.current && next !== undefined) cache.set(urlRef.current, next);
      return next;
    });
  }, []);

  return {
    data,
    error,
    isLoading: data === undefined && !error && url !== null,
    isValidating,
    reload: load,
    mutate,
  };
}

export function buildQuery(params: Record<string, string | number | boolean | null | undefined>): string {
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== null && value !== "") search.set(key, String(value));
  }
  const text = search.toString();
  return text ? `?${text}` : "";
}
