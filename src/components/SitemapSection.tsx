import Link from "next/link";
import { Globe, LayoutDashboard, ShieldCheck } from "lucide-react";

interface SiteNode {
  href: string;
  label: string;
  description: string;
}

const GROUPS: { title: string; icon: typeof Globe; nodes: SiteNode[] }[] = [
  {
    title: "Công khai",
    icon: Globe,
    nodes: [
      { href: "/", label: "Trang chủ", description: "Giới thiệu tính năng và sơ đồ trang" },
      { href: "/login", label: "Đăng nhập", description: "Đăng nhập tài khoản sinh viên" },
      { href: "/register", label: "Đăng ký", description: "Tạo tài khoản mới" },
      { href: "/admin/login", label: "Cổng quản trị", description: "Đăng nhập riêng cho quản trị viên" },
    ],
  },
  {
    title: "Ứng dụng sinh viên",
    icon: LayoutDashboard,
    nodes: [
      { href: "/dashboard", label: "Tổng quan", description: "Số dư, số tiền có thể chi, dự báo cuối tháng" },
      { href: "/transactions", label: "Giao dịch", description: "Tìm kiếm, lọc, thêm, sửa, xóa khoản thu chi" },
      { href: "/budgets", label: "Ngân sách", description: "Hạn mức theo danh mục và cảnh báo 80%" },
      { href: "/reports", label: "Báo cáo", description: "Báo cáo tháng/quý/năm, xuất PDF" },
      { href: "/goals", label: "Mục tiêu", description: "Mục tiêu tiết kiệm và tiến độ" },
      { href: "/recurring", label: "Định kỳ", description: "Chi phí cố định, khoản thu chi lặp lại" },
      { href: "/notifications", label: "Thông báo", description: "Cảnh báo ngân sách, định kỳ, mục tiêu" },
      { href: "/settings", label: "Cài đặt", description: "Hồ sơ, giao diện, danh mục, bảo mật" },
    ],
  },
  {
    title: "Quản trị",
    icon: ShieldCheck,
    nodes: [
      { href: "/admin", label: "Admin Dashboard", description: "Người dùng hoạt động, khối lượng giao dịch" },
      { href: "/admin/users", label: "Người dùng", description: "Vô hiệu hóa tài khoản, phân quyền" },
      { href: "/admin/system", label: "Hệ thống", description: "Danh mục mặc định, thông báo toàn hệ thống" },
    ],
  },
];

/** Sơ đồ trang trực quan trên trang chủ (yêu cầu bắt buộc của đề bài). */
export default function SitemapSection() {
  return (
    <section id="sitemap" aria-labelledby="sitemap-title" className="scroll-mt-20">
      <h2 id="sitemap-title" className="text-2xl font-semibold tracking-tight text-foreground">
        Sơ đồ trang
      </h2>
      <p className="mt-1.5 text-muted">Toàn bộ các khu vực của Campus Coin.</p>
      <div className="mt-8 grid gap-4 lg:grid-cols-3">
        {GROUPS.map((group) => {
          const Icon = group.icon;
          return (
            <div key={group.title} className="rounded-lg border border-border bg-surface p-5 shadow-card">
              <h3 className="flex items-center gap-2 text-sm font-semibold text-foreground">
                <Icon className="size-4 text-primary" aria-hidden /> {group.title}
              </h3>
              <ul className="mt-4 space-y-1 border-l border-border pl-4">
                {group.nodes.map((node) => (
                  <li key={node.href} className="relative">
                    <span className="absolute top-3.5 -left-4 h-px w-3 bg-border" aria-hidden />
                    <Link href={node.href} className="block rounded-md px-2 py-1.5 transition-colors hover:bg-surface-hover">
                      <span className="flex items-baseline justify-between gap-2">
                        <span className="text-sm font-medium text-foreground">{node.label}</span>
                        <code className="text-[11px] text-subtle">{node.href}</code>
                      </span>
                      <span className="block text-[12px] text-muted">{node.description}</span>
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          );
        })}
      </div>
    </section>
  );
}
