"use client";

import { Moon, Sun } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useTheme } from "@/context/ThemeContext";
import { useI18n } from "@/i18n/provider";

export function ThemeToggle({ className }: { className?: string }) {
  const { theme, toggleTheme } = useTheme();
  const { t } = useI18n();
  const label = theme === "dark" ? t.header.toLight : t.header.toDark;
  return (
    <Button variant="ghost" size="icon" onClick={toggleTheme} aria-label={label} title={label} className={className}>
      {theme === "dark" ? <Sun /> : <Moon />}
    </Button>
  );
}
