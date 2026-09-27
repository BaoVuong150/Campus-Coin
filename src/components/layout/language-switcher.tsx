"use client";

import { Languages } from "lucide-react";
import { Segmented } from "@/components/ui/segmented";
import { LOCALE_LABELS, LOCALES, type Locale } from "@/i18n/config";
import { useI18n } from "@/i18n/provider";
import { cn } from "@/lib/utils/cn";

const SHORT: Record<Locale, string> = { vi: "VI", en: "EN" };

/** Nút chuyển ngôn ngữ gọn (header): bấm để đổi VI ↔ EN. */
export function LanguageToggle({ className }: { className?: string }) {
  const { locale, setLocale, t } = useI18n();
  const next: Locale = locale === "vi" ? "en" : "vi";
  return (
    <button
      type="button"
      onClick={() => setLocale(next)}
      aria-label={`${t.header.language}: ${SHORT[locale]} → ${SHORT[next]}`}
      title={t.header.language}
      className={cn(
        "inline-flex h-9 items-center gap-1.5 rounded-md px-2 text-[12px] font-semibold text-muted transition-colors hover:bg-surface-hover hover:text-foreground",
        className
      )}
    >
      <Languages className="size-4" aria-hidden />
      {SHORT[locale]}
    </button>
  );
}

/** Bộ chọn ngôn ngữ đầy đủ (trang Cài đặt). */
export function LanguageSelect() {
  const { locale, setLocale, t } = useI18n();
  return (
    <Segmented<Locale>
      label={t.header.language}
      value={locale}
      onChange={setLocale}
      options={LOCALES.map((l) => ({ value: l, label: LOCALE_LABELS[l] }))}
      size="md"
    />
  );
}
