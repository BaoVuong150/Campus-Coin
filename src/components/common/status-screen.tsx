import Link from "next/link";
import type { ReactNode } from "react";
import { LanguageToggle } from "@/components/layout/language-switcher";
import { Logo } from "@/components/layout/logo";
import { ThemeToggle } from "@/components/layout/theme-toggle";

interface StatusScreenProps {
  /** Mã lớn phía trên (ví dụ "404") – chỉ để trang trí, không được trình đọc màn hình đọc. */
  code: string;
  eyebrow: string;
  title: string;
  description: string;
  homeLabel: string;
  /** Các nút hành động; xếp dọc full chiều rộng trên điện thoại nhỏ. */
  actions: ReactNode;
}

/**
 * Màn hình trạng thái toàn trang dùng chung cho 404 và lỗi ngoài app: thanh trên tối giản (logo, ngôn ngữ,
 * giao diện) + khối nội dung căn giữa. Không dùng hook nên dùng được cả ở server component lẫn error boundary.
 */
export function StatusScreen({ code, eyebrow, title, description, homeLabel, actions }: StatusScreenProps) {
  return (
    <div className="hero-glow flex min-h-dvh flex-col overflow-x-clip bg-background">
      <header className="container-page flex h-(--nav-height) shrink-0 items-center justify-between pt-[env(safe-area-inset-top)]">
        <Link href="/" aria-label={homeLabel}>
          <Logo />
        </Link>
        <div className="flex items-center gap-1">
          <LanguageToggle />
          <ThemeToggle />
        </div>
      </header>

      <main className="container-page flex flex-1 items-center justify-center pt-8 pb-[calc(var(--nav-height)_+_env(safe-area-inset-bottom))]">
        <div className="w-full max-w-md animate-rise text-center">
          <p
            aria-hidden
            className="tabular bg-linear-to-b from-foreground/85 to-foreground/10 bg-clip-text text-[clamp(96px,26vw,152px)] leading-none font-[650] tracking-[-0.06em] text-transparent select-none"
          >
            {code}
          </p>
          <p className="mt-4 inline-flex items-center gap-2 rounded-full bg-primary-soft px-3 py-1 text-[13px] font-medium text-primary-ink">
            <span className="size-1.5 rounded-full bg-brand" aria-hidden />
            {eyebrow}
          </p>
          <h1 className="mt-4 text-[clamp(26px,7vw,32px)] leading-tight font-semibold tracking-tight text-balance text-foreground">{title}</h1>
          <p className="mx-auto mt-3 max-w-sm text-[15px] leading-relaxed text-pretty text-muted">{description}</p>
          <div className="mt-8 grid gap-2 phablet:flex phablet:justify-center phablet:gap-3">{actions}</div>
        </div>
      </main>
    </div>
  );
}
