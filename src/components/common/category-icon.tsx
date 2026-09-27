import {
  BookOpen,
  Briefcase,
  Bus,
  Coins,
  Film,
  Gift,
  GraduationCap,
  Home,
  Laptop,
  MoreHorizontal,
  PiggyBank,
  Plane,
  ShieldCheck,
  ShoppingBag,
  Tag,
  Target,
  Tv,
  Utensils,
  Wallet,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils/cn";

/** Chỉ các icon được phép dùng – tên lưu trong DB được map qua bảng này, không import động. */
export const ICONS: Record<string, LucideIcon> = {
  Wallet,
  Briefcase,
  GraduationCap,
  Gift,
  Coins,
  Utensils,
  Bus,
  Home,
  BookOpen,
  Tv,
  Film,
  MoreHorizontal,
  ShoppingBag,
  Tag,
  Target,
  Laptop,
  PiggyBank,
  Plane,
  ShieldCheck,
};

export const GOAL_ICON_OPTIONS = ["Target", "Laptop", "Plane", "PiggyBank", "ShieldCheck", "GraduationCap", "Home", "Gift"];

interface CategoryIconProps {
  icon: string | null | undefined;
  color?: string | null;
  size?: "sm" | "md";
  className?: string;
}

/** Icon danh mục trên nền màu nhạt của chính danh mục (color-mix để hợp cả light/dark). */
export function CategoryIcon({ icon, color, size = "md", className }: CategoryIconProps) {
  const Icon = (icon && ICONS[icon]) || Tag;
  const tint = color ?? "var(--subtle)";
  return (
    <span
      className={cn(
        "inline-flex shrink-0 items-center justify-center rounded-full",
        size === "sm" ? "size-7 [&_svg]:size-3.5" : "size-9 [&_svg]:size-4",
        className
      )}
      style={{ backgroundColor: `color-mix(in srgb, ${tint} 14%, transparent)`, color: tint }}
      aria-hidden
    >
      <Icon />
    </span>
  );
}
