"use client";

import { useCallback, useSyncExternalStore } from "react";

const noopSubscribe = () => () => {};

/** true sau khi hydrate ở client (dùng cho portal), không gây setState trong effect. */
export function useIsClient(): boolean {
  return useSyncExternalStore(noopSubscribe, () => true, () => false);
}

const STORAGE_EVENT = "campuscoin:storage";

function readStorage(key: string): string | null {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}

/** Giá trị localStorage dạng chuỗi, đồng bộ giữa các component và tab; server luôn trả `fallback`. */
export function useLocalStorage(key: string, fallback: string): [string, (value: string) => void] {
  const subscribe = useCallback(
    (onChange: () => void) => {
      const handler = (e: Event) => {
        if (e instanceof StorageEvent ? e.key === key : (e as CustomEvent<string>).detail === key) onChange();
      };
      window.addEventListener("storage", handler);
      window.addEventListener(STORAGE_EVENT, handler);
      return () => {
        window.removeEventListener("storage", handler);
        window.removeEventListener(STORAGE_EVENT, handler);
      };
    },
    [key]
  );
  const value = useSyncExternalStore(subscribe, () => readStorage(key) ?? fallback, () => fallback);
  const setValue = useCallback(
    (next: string) => {
      try {
        localStorage.setItem(key, next);
      } catch {
        // storage bị chặn: bỏ qua, giá trị không được ghi nhớ
      }
      window.dispatchEvent(new CustomEvent(STORAGE_EVENT, { detail: key }));
    },
    [key]
  );
  return [value, setValue];
}
