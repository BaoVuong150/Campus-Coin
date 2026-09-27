import Link from "next/link";
import { BellRing, CalendarClock, FileDown, Gauge, Repeat, Target, type LucideIcon } from "lucide-react";
import PublicHeader from "@/components/Navbar";
import SitemapSection from "@/components/SitemapSection";
import { buttonClasses } from "@/components/ui/button";
import { getSession } from "@/lib/auth/session";

const FEATURES: { icon: LucideIcon; title: string; description: string }[] = [
  { icon: Gauge, title: "Số tiền có thể chi", description: "Biết mỗi ngày còn tiêu được bao nhiêu mà vẫn trả đủ tiền nhà và giữ tiền tiết kiệm." },
  { icon: CalendarClock, title: "Dự kiến cuối tháng", description: "Dự báo số dư cuối tháng từ tốc độ chi tiêu thật và các khoản cố định sắp đến hạn." },
  { icon: BellRing, title: "Ngân sách & cảnh báo", description: "Đặt hạn mức theo danh mục, nhận nhắc nhở nhẹ nhàng khi chạm 80%." },
  { icon: Repeat, title: "Khoản định kỳ", description: "Tiền nhà, Netflix, trợ cấp hàng tháng được ghi tự động – không trùng lặp." },
  { icon: Target, title: "Mục tiêu tiết kiệm", description: "Theo dõi tiến độ và số tiền cần để dành mỗi tháng để kịp hạn." },
  { icon: FileDown, title: "Báo cáo & PDF", description: "Báo cáo tháng, quý, năm với biểu đồ rõ ràng và xuất PDF một chạm." },
];

export default async function HomePage() {
  const user = await getSession();

  return (
    <div className="min-h-dvh">
      <PublicHeader signedIn={!!user} />
      <main>
        <section className="mx-auto max-w-6xl px-4 pt-16 pb-20 sm:px-6 sm:pt-24">
          <p className="text-sm font-medium text-primary">Dành cho sinh viên</p>
          <h1 className="mt-3 max-w-3xl text-4xl leading-tight font-semibold tracking-tight text-foreground sm:text-5xl">
            Spend smarter. Study easier.
          </h1>
          <p className="mt-4 max-w-2xl text-lg text-muted">
            Campus Coin giúp bạn ghi thu chi trong vài giây, giữ ngân sách và luôn biết mình còn tiêu được bao nhiêu đến cuối tháng.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link href={user ? "/dashboard" : "/register"} className={buttonClasses("primary", "lg")}>
              {user ? "Vào ứng dụng" : "Bắt đầu miễn phí"}
            </Link>
            <a href="#features" className={buttonClasses("outline", "lg")}>
              Xem tính năng
            </a>
          </div>
        </section>

        <section id="features" aria-labelledby="features-title" className="scroll-mt-20 border-y border-border bg-surface">
          <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
            <h2 id="features-title" className="text-2xl font-semibold tracking-tight text-foreground">
              Tài chính sinh viên, gọn gàng và minh bạch
            </h2>
            <p className="mt-1.5 text-muted">Mọi con số đều tính từ dữ liệu của bạn – có giải thích cách tính.</p>
            <div className="mt-10 grid gap-x-8 gap-y-10 sm:grid-cols-2 lg:grid-cols-3">
              {FEATURES.map(({ icon: Icon, title, description }) => (
                <div key={title}>
                  <span className="flex size-9 items-center justify-center rounded-md bg-primary-soft text-primary">
                    <Icon className="size-4" aria-hidden />
                  </span>
                  <h3 className="mt-4 text-[15px] font-semibold text-foreground">{title}</h3>
                  <p className="mt-1.5 text-sm text-muted">{description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
          <SitemapSection />
        </div>
      </main>
      <footer className="border-t border-border">
        <div className="mx-auto flex max-w-6xl flex-col gap-2 px-4 py-6 text-[13px] text-subtle sm:flex-row sm:justify-between sm:px-6">
          <p>© Campus Coin · Techwiz 7 – NextGen BudgetBee</p>
          <p className="flex gap-4">
            <Link href="/login" className="hover:text-foreground">
              Đăng nhập
            </Link>
            <Link href="/admin/login" className="hover:text-foreground">
              Cổng quản trị
            </Link>
          </p>
        </div>
      </footer>
    </div>
  );
}
