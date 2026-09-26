"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  FolderTree,
  Home,
  LogIn,
  UserPlus,
  ShieldCheck,
  LayoutDashboard,
  Calendar,
  ArrowRightLeft,
  Target,
  PieChart,
  Sparkles,
  Users,
  Settings,
} from "lucide-react";

export default function SitemapSection() {
  const [activeTab, setActiveTab] = useState<"all" | "student" | "admin">("all");

  return (
    <section id="sitemap" className="py-20 bg-white dark:bg-[#010102] border-b border-[#e2e8f0] dark:border-[#23252a] transition-colors">
      <div className="max-w-[1280px] mx-auto px-4 sm:px-6">
        {/* Header */}
        <div className="max-w-2xl mb-12">
          <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-[6px] bg-[#f1f3f5] dark:bg-[#0f1011] text-[#475569] dark:text-[#8a8f98] text-[13px] font-medium mb-3 border border-[#e2e8f0] dark:border-[#23252a] tracking-eyebrow">
            <FolderTree className="w-3.5 h-3.5 text-[#5e6ad2]" />
            YÊU CẦU BẮT BUỘC SRS MỤC 1.9
          </div>
          <h2 className="text-2xl sm:text-3xl font-semibold tracking-[-0.8px] text-[#0f1011] dark:text-[#f7f8f8]">
            Sơ Đồ Cấu Trúc Website (Sitemap Tinh Gọn)
          </h2>
          <p className="mt-2 text-[14px] text-[#475569] dark:text-[#8a8f98] leading-[1.5] tracking-body">
            Mô hình <strong>All-in-One Workspace</strong>: Toàn bộ việc ghi chép, theo dõi <strong>Ngày - Tháng - Năm</strong>, Ngân sách, Biểu đồ và AI được tích hợp trọn vẹn tại một màn hình trung tâm, giúp sinh viên quản lý tài chính dễ dàng.
          </p>

          {/* Quick Filter Tabs (pricing-tab-default & pricing-tab-selected from DESIGN.md) */}
          <div className="flex items-center gap-2 mt-6">
            <button
              onClick={() => setActiveTab("all")}
              className={`px-3 py-1.5 rounded-full text-[13px] font-medium transition-colors ${
                activeTab === "all"
                  ? "bg-[#f1f3f5] dark:bg-[#141516] text-[#0f1011] dark:text-[#f7f8f8] border border-[#e2e8f0] dark:border-[#34343a] shadow-xs"
                  : "bg-transparent text-[#64748b] dark:text-[#8a8f98] hover:text-[#0f1011] dark:hover:text-[#f7f8f8]"
              }`}
            >
              Toàn bộ kiến trúc (3 Trục)
            </button>
            <button
              onClick={() => setActiveTab("student")}
              className={`px-3 py-1.5 rounded-full text-[13px] font-medium transition-colors ${
                activeTab === "student"
                  ? "bg-[#f1f3f5] dark:bg-[#141516] text-[#0f1011] dark:text-[#f7f8f8] border border-[#e2e8f0] dark:border-[#34343a] shadow-xs"
                  : "bg-transparent text-[#64748b] dark:text-[#8a8f98] hover:text-[#0f1011] dark:hover:text-[#f7f8f8]"
              }`}
            >
              Sổ Chi Tiêu Sinh Viên (/dashboard)
            </button>
            <button
              onClick={() => setActiveTab("admin")}
              className={`px-3 py-1.5 rounded-full text-[13px] font-medium transition-colors ${
                activeTab === "admin"
                  ? "bg-[#f1f3f5] dark:bg-[#141516] text-[#0f1011] dark:text-[#f7f8f8] border border-[#e2e8f0] dark:border-[#34343a] shadow-xs"
                  : "bg-transparent text-[#64748b] dark:text-[#8a8f98] hover:text-[#0f1011] dark:hover:text-[#f7f8f8]"
              }`}
            >
              Cổng Quản Trị (/admin)
            </button>
          </div>
        </div>

        {/* 3 Pillars Grid (feature-card style) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* TRỤC 1: CỔNG XÁC THỰC (Public & Auth) */}
          {activeTab === "all" && (
            <div className="lg:col-span-4 bg-[#f8f9fa] dark:bg-[#0f1011] rounded-[12px] p-5 border border-[#e2e8f0] dark:border-[#23252a] space-y-4 edge-highlight">
              <div className="flex items-center justify-between pb-3 border-b border-[#e2e8f0] dark:border-[#23252a]">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-[6px] bg-white dark:bg-[#141516] text-[#0f1011] dark:text-[#f7f8f8] flex items-center justify-center border border-[#e2e8f0] dark:border-[#23252a]">
                    <Home className="w-3.5 h-3.5 text-[#5e6ad2]" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-[#0f1011] dark:text-[#f7f8f8] text-[14px]">Trục 1: Vùng Công Cộng</h3>
                    <p className="text-[11px] text-[#64748b] dark:text-[#8a8f98]">Public & Authentication</p>
                  </div>
                </div>
                <span className="text-[10px] uppercase font-medium px-1.5 py-0.5 rounded-[4px] bg-white dark:bg-[#141516] text-[#64748b] dark:text-[#8a8f98] border border-[#e2e8f0] dark:border-[#23252a]">
                  Truy cập tự do
                </span>
              </div>

              <div className="space-y-2">
                <Link
                  href="/"
                  className="flex items-center justify-between p-2.5 rounded-[8px] bg-white dark:bg-[#141516] hover:bg-[#f1f3f5] dark:hover:bg-[#18191a] border border-[#e2e8f0] dark:border-[#23252a] transition-colors"
                >
                  <div className="flex items-center gap-2.5">
                    <Home className="w-3.5 h-3.5 text-[#5e6ad2]" />
                    <div>
                      <p className="text-[13px] font-medium text-[#0f1011] dark:text-[#f7f8f8]">Trang chủ (Landing Page)</p>
                      <p className="text-[11px] text-[#64748b] dark:text-[#8a8f98]">Giới thiệu tính năng, AI Assistant & Sitemap</p>
                    </div>
                  </div>
                  <span className="text-[11px] text-[#94a3b8] dark:text-[#62666d] font-mono">/</span>
                </Link>

                <Link
                  href="/login"
                  className="flex items-center justify-between p-2.5 rounded-[8px] bg-white dark:bg-[#141516] hover:bg-[#f1f3f5] dark:hover:bg-[#18191a] border border-[#e2e8f0] dark:border-[#23252a] transition-colors"
                >
                  <div className="flex items-center gap-2.5">
                    <LogIn className="w-3.5 h-3.5 text-[#5e6ad2]" />
                    <div>
                      <p className="text-[13px] font-medium text-[#0f1011] dark:text-[#f7f8f8]">Đăng nhập Sinh viên</p>
                      <p className="text-[11px] text-[#64748b] dark:text-[#8a8f98]">Xác thực tài khoản sinh viên bảo mật</p>
                    </div>
                  </div>
                  <span className="text-[11px] text-[#94a3b8] dark:text-[#62666d] font-mono">/login</span>
                </Link>

                <Link
                  href="/register"
                  className="flex items-center justify-between p-2.5 rounded-[8px] bg-white dark:bg-[#141516] hover:bg-[#f1f3f5] dark:hover:bg-[#18191a] border border-[#e2e8f0] dark:border-[#23252a] transition-colors"
                >
                  <div className="flex items-center gap-2.5">
                    <UserPlus className="w-3.5 h-3.5 text-[#5e6ad2]" />
                    <div>
                      <p className="text-[13px] font-medium text-[#0f1011] dark:text-[#f7f8f8]">Đăng ký Hồ sơ Sinh viên</p>
                      <p className="text-[11px] text-[#64748b] dark:text-[#8a8f98]">Thiết lập năm học, mức trợ cấp, mục tiêu</p>
                    </div>
                  </div>
                  <span className="text-[11px] text-[#94a3b8] dark:text-[#62666d] font-mono">/register</span>
                </Link>

                <Link
                  href="/admin/login"
                  className="flex items-center justify-between p-2.5 rounded-[8px] bg-white dark:bg-[#141516] hover:bg-[#f1f3f5] dark:hover:bg-[#18191a] border border-[#e2e8f0] dark:border-[#23252a] transition-colors"
                >
                  <div className="flex items-center gap-2.5">
                    <ShieldCheck className="w-3.5 h-3.5 text-[#7a7fad]" />
                    <div>
                      <p className="text-[13px] font-medium text-[#0f1011] dark:text-[#f7f8f8]">Cổng Admin độc lập (SRS 3.1)</p>
                      <p className="text-[11px] text-[#64748b] dark:text-[#8a8f98]">Đăng nhập riêng biệt cho Quản trị viên</p>
                    </div>
                  </div>
                  <span className="text-[11px] text-[#94a3b8] dark:text-[#62666d] font-mono">/admin/login</span>
                </Link>
              </div>
            </div>
          )}

          {/* TRỤC 2: SỔ CHI TIÊU SINH VIÊN ALL-IN-ONE (/dashboard) */}
          {(activeTab === "all" || activeTab === "student") && (
            <div className={`${activeTab === "student" ? "lg:col-span-12" : "lg:col-span-5"} bg-[#f8f9fa] dark:bg-[#0f1011] rounded-[12px] p-5 sm:p-6 border border-[#e2e8f0] dark:border-[#23252a] space-y-4 edge-highlight`}>
              <div className="flex items-center justify-between pb-3 border-b border-[#e2e8f0] dark:border-[#23252a]">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-[6px] bg-[#5e6ad2] text-white flex items-center justify-center">
                    <LayoutDashboard className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-[#0f1011] dark:text-[#f7f8f8] text-[15px] flex items-center gap-2">
                      Trục 2: Sổ Chi Tiêu Sinh Viên
                      <span className="text-[10px] px-1.5 py-0.5 rounded-[4px] bg-[#f1f3f5] dark:bg-[#141516] text-[#5e6ad2] font-semibold border border-[#e2e8f0] dark:border-[#23252a]">
                        All-in-One
                      </span>
                    </h3>
                    <p className="text-[11px] text-[#64748b] dark:text-[#8a8f98] font-mono">/dashboard</p>
                  </div>
                </div>
              </div>

              <p className="text-[13px] text-[#475569] dark:text-[#8a8f98] leading-[1.5]">
                Toàn bộ nghiệp vụ quản lý tài chính sinh viên được tích hợp hoàn hảo trên một màn hình trung tâm:
              </p>

              <div className="space-y-2 pt-1 text-xs">
                <div className="p-2.5 rounded-[8px] bg-white dark:bg-[#141516] border border-[#e2e8f0] dark:border-[#23252a] flex items-start gap-2.5">
                  <Calendar className="w-3.5 h-3.5 text-[#5e6ad2] flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-medium text-[#0f1011] dark:text-[#f7f8f8]">1. Quỹ Lương Ngày 5 & Hạn Mức An Toàn Hôm Nay</p>
                    <p className="text-[#64748b] dark:text-[#8a8f98] text-[11px] mt-0.5">Quỹ 8.000.000đ tự động nhận ngày 5 hàng tháng, tự động tính hạn mức chi tiêu an toàn mỗi ngày (Daily Safe Spending) để sinh viên không lo thâm hụt.</p>
                  </div>
                </div>

                <div className="p-2.5 rounded-[8px] bg-white dark:bg-[#141516] border border-[#e2e8f0] dark:border-[#23252a] flex items-start gap-2.5">
                  <ArrowRightLeft className="w-3.5 h-3.5 text-[#5e6ad2] flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-medium text-[#0f1011] dark:text-[#f7f8f8]">2. Ghi Nhanh 5 Giây & Phân Loại AI Tự Động</p>
                    <p className="text-[#64748b] dark:text-[#8a8f98] text-[11px] mt-0.5">Thanh nhập nhanh ngay đầu trang: Gõ tiền + món chi (bánh mì, cơm trưa, cà phê) &rarr; AI tự động gán danh mục trong 5 giây.</p>
                  </div>
                </div>

                <div className="p-2.5 rounded-[8px] bg-white dark:bg-[#141516] border border-[#e2e8f0] dark:border-[#23252a] flex items-start gap-2.5">
                  <Target className="w-3.5 h-3.5 text-[#5e6ad2] flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-medium text-[#0f1011] dark:text-[#f7f8f8]">3. Canh Gác Ngân Sách & Nhắc Nhở Thông Minh</p>
                    <p className="text-[#64748b] dark:text-[#8a8f98] text-[11px] mt-0.5">Thanh đo tiêu thụ thời gian thực, tự động cảnh báo khi chạm 80% hạn mức danh mục (Ăn uống, Tiền trọ, Đi lại...).</p>
                  </div>
                </div>

                <div className="p-2.5 rounded-[8px] bg-white dark:bg-[#141516] border border-[#e2e8f0] dark:border-[#23252a] flex items-start gap-2.5">
                  <PieChart className="w-3.5 h-3.5 text-[#5e6ad2] flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-medium text-[#0f1011] dark:text-[#f7f8f8]">4. Biểu Đồ Thống Kê 6 Tháng & Xuất PDF</p>
                    <p className="text-[#64748b] dark:text-[#8a8f98] text-[11px] mt-0.5">Biểu đồ Thu vs Chi 6 tháng liên tiếp, cơ cấu danh mục và nút xuất toàn bộ báo cáo ra file PDF/Hình ảnh.</p>
                  </div>
                </div>

                <div className="p-2.5 rounded-[8px] bg-white dark:bg-[#141516] border border-[#e2e8f0] dark:border-[#23252a] flex items-start gap-2.5">
                  <Sparkles className="w-3.5 h-3.5 text-[#5e6ad2] flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-medium text-[#0f1011] dark:text-[#f7f8f8]">5. Trợ Lý AI Insights & Mẹo Tiết Kiệm</p>
                    <p className="text-[#64748b] dark:text-[#8a8f98] text-[11px] mt-0.5">Đoạn văn nhận xét thói quen tài chính hàng tháng, cảnh báo chi tiêu tăng vọt và các mẹo tiết kiệm có thể Ghim/Bỏ qua.</p>
                  </div>
                </div>
              </div>

              <div className="pt-2">
                <Link
                  href="/login"
                  className="w-full inline-flex items-center justify-center py-2 rounded-[8px] font-medium text-[13px] bg-[#5e6ad2] hover:bg-[#828fff] text-white transition-colors shadow-xs"
                >
                  Trải nghiệm Sổ Chi Tiêu Sinh Viên &rarr;
                </Link>
              </div>
            </div>
          )}

          {/* TRỤC 3: TRUNG TÂM QUẢN TRỊ ADMIN (/admin) */}
          {(activeTab === "all" || activeTab === "admin") && (
            <div className={`${activeTab === "admin" ? "lg:col-span-12" : "lg:col-span-3"} bg-[#f8f9fa] dark:bg-[#0f1011] rounded-[12px] p-5 border border-[#e2e8f0] dark:border-[#23252a] space-y-4 edge-highlight`}>
              <div className="flex items-center justify-between pb-3 border-b border-[#e2e8f0] dark:border-[#23252a]">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-[6px] bg-white dark:bg-[#141516] text-[#0f1011] dark:text-[#f7f8f8] flex items-center justify-center border border-[#e2e8f0] dark:border-[#23252a]">
                    <ShieldCheck className="w-3.5 h-3.5 text-[#7a7fad]" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-[#0f1011] dark:text-[#f7f8f8] text-[14px]">Trục 3: Cổng Admin</h3>
                    <p className="text-[11px] text-[#64748b] dark:text-[#8a8f98] font-mono">/admin</p>
                  </div>
                </div>
                <span className="text-[10px] uppercase font-medium px-1.5 py-0.5 rounded-[4px] bg-white dark:bg-[#141516] text-[#64748b] dark:text-[#8a8f98] border border-[#e2e8f0] dark:border-[#23252a]">
                  Admin Only
                </span>
              </div>

              <p className="text-[12px] text-[#64748b] dark:text-[#8a8f98]">
                Bảng điều khiển quản trị tập trung toàn hệ thống:
              </p>

              <div className="space-y-2 text-xs">
                <div className="p-2.5 rounded-[8px] bg-white dark:bg-[#141516] border border-[#e2e8f0] dark:border-[#23252a]">
                  <div className="flex items-center gap-2 font-medium text-[#0f1011] dark:text-[#f7f8f8]">
                    <Users className="w-3 h-3 text-[#5e6ad2]" />
                    Quản Lý Sinh Viên
                  </div>
                  <p className="text-[11px] text-[#64748b] dark:text-[#8a8f98] mt-0.5">Danh sách sinh viên, trạng thái tài khoản, vô hiệu hóa hoặc reset mật khẩu.</p>
                </div>

                <div className="p-2.5 rounded-[8px] bg-white dark:bg-[#141516] border border-[#e2e8f0] dark:border-[#23252a]">
                  <div className="flex items-center gap-2 font-medium text-[#0f1011] dark:text-[#f7f8f8]">
                    <Settings className="w-3 h-3 text-[#5e6ad2]" />
                    Quản Lý Danh Mục Mặc Định
                  </div>
                  <p className="text-[11px] text-[#64748b] dark:text-[#8a8f98] mt-0.5">Thêm / sửa / xóa các danh mục thu chi chung áp dụng cho toàn trường.</p>
                </div>

                <div className="p-2.5 rounded-[8px] bg-white dark:bg-[#141516] border border-[#e2e8f0] dark:border-[#23252a]">
                  <div className="flex items-center gap-2 font-medium text-[#0f1011] dark:text-[#f7f8f8]">
                    <PieChart className="w-3 h-3 text-[#5e6ad2]" />
                    Thống Kê Toàn Trường
                  </div>
                  <p className="text-[11px] text-[#64748b] dark:text-[#8a8f98] mt-0.5">Tổng số sinh viên hoạt động, tổng lượng giao dịch, danh mục phổ biến nhất.</p>
                </div>
              </div>

              <div className="pt-2">
                <Link
                  href="/admin/login"
                  className="w-full inline-flex items-center justify-center py-2 rounded-[8px] font-medium text-[13px] bg-white dark:bg-[#141516] hover:bg-[#f1f3f5] dark:hover:bg-[#18191a] border border-[#e2e8f0] dark:border-[#23252a] text-[#0f1011] dark:text-[#f7f8f8] transition-colors"
                >
                  Vào Cổng Quản Trị &rarr;
                </Link>
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
