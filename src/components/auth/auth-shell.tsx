import Link from "next/link";
import type { ReactNode } from "react";
import { CheckCircle2 } from "lucide-react";
import { Logo } from "@/components/layout/logo";

const POINTS = [
  "Biết mỗi ngày còn tiêu được bao nhiêu",
  "Cảnh báo sớm trước khi vượt ngân sách",
  "Dự báo số dư cuối tháng từ dữ liệu thật",
];

export function AuthShell({ title, description, children, footer }: { title: string; description: string; children: ReactNode; footer?: ReactNode }) {
  return (
    <div className="grid min-h-dvh lg:grid-cols-2">
      <aside className="hidden flex-col justify-between border-r border-border bg-surface p-10 lg:flex">
        <Link href="/" aria-label="Campus Coin – Trang chủ">
          <Logo />
        </Link>
        <div className="max-w-md">
          <p className="text-3xl leading-tight font-semibold tracking-tight text-foreground">Spend smarter. Study easier.</p>
          <p className="mt-3 text-muted">Quản lý tiền thông minh cho đời sống sinh viên.</p>
          <ul className="mt-8 space-y-3">
            {POINTS.map((p) => (
              <li key={p} className="flex items-center gap-2.5 text-sm text-foreground">
                <CheckCircle2 className="size-4 text-primary" aria-hidden /> {p}
              </li>
            ))}
          </ul>
        </div>
        <p className="text-[12px] text-subtle">© Campus Coin · Techwiz 7</p>
      </aside>
      <main className="flex items-center justify-center px-4 py-10 sm:px-6">
        <div className="w-full max-w-sm">
          <Link href="/" className="mb-8 inline-block lg:hidden" aria-label="Campus Coin – Trang chủ">
            <Logo />
          </Link>
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">{title}</h1>
          <p className="mt-1.5 text-sm text-muted">{description}</p>
          <div className="mt-8">{children}</div>
          {footer && <div className="mt-6 text-center text-sm text-muted">{footer}</div>}
        </div>
      </main>
    </div>
  );
}
