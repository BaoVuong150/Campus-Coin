"use client";

import { Moon, Sun } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useTheme } from "@/context/ThemeContext";

export function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();
  const dark = theme === "dark";
  return (
    <Button variant="ghost" size="icon" onClick={toggleTheme} aria-label={dark ? "Chuyển sang giao diện sáng" : "Chuyển sang giao diện tối"} title={dark ? "Giao diện sáng" : "Giao diện tối"}>
      {dark ? <Sun /> : <Moon />}
    </Button>
  );
}
