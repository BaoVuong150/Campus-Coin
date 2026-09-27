"use client";

import { createContext, useCallback, useContext, useMemo, useSyncExternalStore } from "react";
import { FONT_SIZE_STORAGE_KEY as FONT_KEY, THEME_STORAGE_KEY as THEME_KEY } from "@/lib/theme-script";

export type Theme = "light" | "dark";
export type FontSize = "normal" | "large" | "larger";

const CHANGE_EVENT = "campuscoin:theme";

interface ThemeContextValue {
  theme: Theme;
  fontSize: FontSize;
  toggleTheme: () => void;
  setTheme: (theme: Theme) => void;
  setFontSize: (size: FontSize) => void;
}

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

/** Nguồn sự thật là thuộc tính trên <html> (do THEME_INIT_SCRIPT đặt trước khi hydrate). */
function subscribe(onChange: () => void) {
  window.addEventListener(CHANGE_EVENT, onChange);
  return () => window.removeEventListener(CHANGE_EVENT, onChange);
}

const readTheme = (): Theme => (document.documentElement.classList.contains("dark") ? "dark" : "light");

function readFontSize(): FontSize {
  const value = document.documentElement.getAttribute("data-font-size");
  return value === "large" || value === "larger" ? value : "normal";
}

function persist(key: string, value: string) {
  try {
    localStorage.setItem(key, value);
  } catch {
    // Trình duyệt chặn storage: vẫn áp dụng cho phiên hiện tại.
  }
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const theme = useSyncExternalStore(subscribe, readTheme, () => "light" as Theme);
  const fontSize = useSyncExternalStore(subscribe, readFontSize, () => "normal" as FontSize);

  const setTheme = useCallback((next: Theme) => {
    const root = document.documentElement;
    root.classList.toggle("dark", next === "dark");
    root.setAttribute("data-theme", next);
    persist(THEME_KEY, next);
    window.dispatchEvent(new Event(CHANGE_EVENT));
  }, []);

  const toggleTheme = useCallback(() => setTheme(readTheme() === "dark" ? "light" : "dark"), [setTheme]);

  const setFontSize = useCallback((size: FontSize) => {
    document.documentElement.setAttribute("data-font-size", size);
    persist(FONT_KEY, size);
    window.dispatchEvent(new Event(CHANGE_EVENT));
  }, []);

  const value = useMemo(
    () => ({ theme, fontSize, toggleTheme, setTheme, setFontSize }),
    [theme, fontSize, toggleTheme, setTheme, setFontSize]
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) throw new Error("useTheme must be used within a ThemeProvider");
  return context;
}
