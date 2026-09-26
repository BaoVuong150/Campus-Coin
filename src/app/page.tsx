"use client";

import React, { useState } from "react";
import Link from "next/link";
import Navbar from "@/components/Navbar";
import SitemapSection from "@/components/SitemapSection";
import {
  Coins,
  ArrowRight,
  Sparkles,
  Target,
  PieChart,
  Calendar,
  BellRing,
} from "lucide-react";

export default function HomePage() {
  const [demoInput, setDemoInput] = useState("Cơm tấm sườn bì chả căn tin");
  const [demoCategory, setDemoCategory] = useState("Ăn uống");

  const handleDemoCategorize = (text: string) => {
    setDemoInput(text);
    const lower = text.toLowerCase();
    if (lower.includes("cơm") || lower.includes("cafe") || lower.includes("ăn") || lower.includes("phở") || lower.includes("trà")) {
      setDemoCategory("Ăn uống");
    } else if (lower.includes("xăng") || lower.includes("bus") || lower.includes("xe") || lower.includes("grab")) {
      setDemoCategory("Đi lại");
    } else if (lower.includes("spotify") || lower.includes("netflix") || lower.includes("icloud") || lower.includes("youtube")) {
      setDemoCategory("Dịch vụ số");
    } else if (lower.includes("trọ") || lower.includes("ký túc xá") || lower.includes("điện") || lower.includes("nước")) {
      setDemoCategory("Tiền trọ / KTX");
    } else if (lower.includes("sách") || lower.includes("giáo trình") || lower.includes("học phí") || lower.includes("photo")) {
      setDemoCategory("Học tập");
    } else if (lower.includes("lương") || lower.includes("làm thêm") || lower.includes("part-time") || lower.includes("phục vụ")) {
      setDemoCategory("Việc làm thêm");
    } else if (lower.includes("bố mẹ") || lower.includes("trợ cấp") || lower.includes("gia đình")) {
      setDemoCategory("Trợ cấp gia đình");
    } else {
      setDemoCategory("Chi tiêu khác");
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-white dark:bg-[#010102] text-[#0f1011] dark:text-[#f7f8f8] transition-colors">
      <Navbar />

      <main className="flex-1">
        {/* ================= HERO SECTION ================= */}
        <section className="pt-20 pb-20 lg:pt-28 lg:pb-24 border-b border-[#e2e8f0] dark:border-[#23252a]">
          <div className="max-w-[1280px] mx-auto px-4 sm:px-6">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-12 items-center">
              {/* Left Column: Hero Content */}
              <div className="lg:col-span-7 space-y-6 text-center lg:text-left">
                {/* Eyebrow according to DESIGN.md (13px, weight 500, tracking +0.4px) */}
                <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-[6px] bg-[#f1f3f5] dark:bg-[#0f1011] border border-[#e2e8f0] dark:border-[#23252a] text-[#475569] dark:text-[#8a8f98] text-[13px] font-medium tracking-eyebrow">
                  <Coins className="w-3.5 h-3.5 text-[#5e6ad2]" />
                  <span>Techwiz 7: NextGen BudgetBee • End-to-End Web Solutions</span>
                </div>

                {/* Display Headline according to DESIGN.md (-1.8px tracking, weight 600) */}
                <h1 className="text-3xl sm:text-5xl lg:text-[54px] font-semibold tracking-display-lg leading-[1.12] text-[#0f1011] dark:text-[#f7f8f8]">
                  Theo Dõi Chi Tiêu Theo <br className="hidden sm:inline" />
                  Ngày, Tháng & Năm Cho Sinh Viên.
                </h1>

                {/* Subhead according to DESIGN.md (-0.2px tracking, weight 400) */}
                <p className="text-[17px] sm:text-[18px] text-[#475569] dark:text-[#8a8f98] font-normal leading-[1.5] tracking-subhead max-w-xl mx-auto lg:mx-0">
                  Bạn chỉ mất <strong>5 giây</strong> để ghi nhận một khoản chi. Máy tính sẽ tự động làm phần còn lại: Tự phân loại qua AI, cộng trừ số dư, canh gác hạn mức và trực quan hóa ngân sách.
                </p>

                {/* CTAs according to DESIGN.md button spec (rounded 8px, 8px 14px padding) */}
                <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-3 pt-2">
                  <Link
                    href="/dashboard"
                    className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-[8px] font-medium text-[14px] text-white bg-[#5e6ad2] hover:bg-[#828fff] transition-colors shadow-xs"
                  >
                    Vào Sổ Chi Tiêu
                    <ArrowRight className="w-4 h-4" />
                  </Link>

                  <Link
                    href="#sitemap"
                    className="w-full sm:w-auto inline-flex items-center justify-center px-4 py-2.5 rounded-[8px] font-medium text-[14px] text-[#0f1011] dark:text-[#f7f8f8] bg-[#f8f9fa] dark:bg-[#0f1011] hover:bg-[#f1f3f5] dark:hover:bg-[#141516] border border-[#e2e8f0] dark:border-[#23252a] transition-colors"
                  >
                    Xem Sitemap Hệ Thống
                  </Link>
                </div>

                {/* 3 Pillars Summary */}
                <div className="pt-6 border-t border-[#e2e8f0] dark:border-[#23252a] grid grid-cols-3 gap-4 text-center lg:text-left text-xs">
                  <div>
                    <p className="text-[17px] font-semibold text-[#0f1011] dark:text-[#f7f8f8] tracking-card-title">All-in-One</p>
                    <p className="text-[#64748b] dark:text-[#8a8f98] text-[12px] mt-0.5">1 Màn hình duy nhất</p>
                  </div>
                  <div>
                    <p className="text-[17px] font-semibold text-[#0f1011] dark:text-[#f7f8f8] tracking-card-title">AI Tự Động</p>
                    <p className="text-[#64748b] dark:text-[#8a8f98] text-[12px] mt-0.5">Tự động gắn danh mục</p>
                  </div>
                  <div>
                    <p className="text-[17px] font-semibold text-[#0f1011] dark:text-[#f7f8f8] tracking-card-title">Lọc Đa Tầng</p>
                    <p className="text-[#64748b] dark:text-[#8a8f98] text-[12px] mt-0.5">Theo Ngày, Tháng, Năm</p>
                  </div>
                </div>
              </div>

              {/* Right Column: product-screenshot-card (DESIGN.md: surface-1 #0f1011, rounded 16px, border hairline, edge-highlight) */}
              <div className="lg:col-span-5">
                <div className="bg-[#f8f9fa] dark:bg-[#0f1011] rounded-[16px] p-5 sm:p-6 border border-[#e2e8f0] dark:border-[#23252a] space-y-4 shadow-xl edge-highlight">
                  {/* Window mock chrome header */}
                  <div className="flex items-center justify-between pb-3 border-b border-[#e2e8f0] dark:border-[#23252a] text-xs">
                    <div className="flex items-center gap-1.5">
                      <span className="w-2.5 h-2.5 rounded-full bg-[#cbd5e1] dark:bg-[#23252a]" />
                      <span className="w-2.5 h-2.5 rounded-full bg-[#cbd5e1] dark:bg-[#23252a]" />
                      <span className="w-2.5 h-2.5 rounded-full bg-[#cbd5e1] dark:bg-[#23252a]" />
                      <span className="text-[11px] text-[#64748b] dark:text-[#62666d] ml-1 font-mono">dashboard/view</span>
                    </div>
                    {/* Timeline Switcher Pill */}
                    <div className="flex items-center gap-1 bg-[#f1f3f5] dark:bg-[#141516] p-1 rounded-[6px] text-[11px] font-medium border border-[#e2e8f0] dark:border-[#23252a]">
                      <span className="px-2 py-0.5 text-[#64748b] dark:text-[#8a8f98]">Ngày</span>
                      <span className="px-2 py-0.5 rounded-[4px] bg-white dark:bg-[#18191a] text-[#0f1011] dark:text-[#f7f8f8] font-semibold border border-[#e2e8f0] dark:border-[#34343a] shadow-xs">Tháng</span>
                      <span className="px-2 py-0.5 text-[#64748b] dark:text-[#8a8f98]">Năm</span>
                    </div>
                  </div>

                  {/* Balance Display */}
                  <div className="flex items-baseline justify-between">
                    <div>
                      <p className="text-[11px] font-medium text-[#64748b] dark:text-[#62666d] uppercase tracking-eyebrow">Số dư tháng 9/2026</p>
                      <h3 className="text-2xl font-semibold tracking-[-0.8px] text-[#0f1011] dark:text-[#f7f8f8] mt-0.5">
                        +4.181.000 đ
                      </h3>
                    </div>
                    {/* status-badge (DESIGN.md: surface-2, rounded pill, semantic-success #27a644) */}
                    <span className="text-[11px] font-medium px-2 py-0.5 rounded-full bg-[#f1f3f5] dark:bg-[#141516] text-[#27a644] border border-[#e2e8f0] dark:border-[#23252a]">
                      Tiết kiệm 55.7%
                    </span>
                  </div>

                  {/* Metric Tiles */}
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div className="p-2.5 rounded-[8px] bg-white dark:bg-[#141516] border border-[#e2e8f0] dark:border-[#23252a]">
                      <p className="text-[#64748b] dark:text-[#8a8f98]">Tổng Thu Nhập</p>
                      <p className="text-[15px] font-semibold tracking-card-title text-[#0f1011] dark:text-[#f7f8f8] mt-0.5">7.500.000 đ</p>
                    </div>
                    <div className="p-2.5 rounded-[8px] bg-white dark:bg-[#141516] border border-[#e2e8f0] dark:border-[#23252a]">
                      <p className="text-[#64748b] dark:text-[#8a8f98]">Tổng Chi Tiêu</p>
                      <p className="text-[15px] font-semibold tracking-card-title text-[#0f1011] dark:text-[#f7f8f8] mt-0.5">3.319.000 đ</p>
                    </div>
                  </div>

                  {/* Hairline Progress Bars */}
                  <div className="space-y-2.5 pt-1 text-xs">
                    <div>
                      <div className="flex justify-between text-[#64748b] dark:text-[#8a8f98] mb-1 text-[11px]">
                        <span>Ăn uống (Food): 1.875k / 2.500k</span>
                        <span className="font-medium text-[#0f1011] dark:text-[#f7f8f8]">75%</span>
                      </div>
                      <div className="w-full bg-[#e2e8f0] dark:bg-[#18191a] h-1.5 rounded-full overflow-hidden">
                        <div className="bg-[#5e6ad2] h-1.5 rounded-full w-[75%]" />
                      </div>
                    </div>

                    <div>
                      <div className="flex justify-between text-[#64748b] dark:text-[#8a8f98] mb-1 text-[11px]">
                        <span>Tiền trọ (Hostel/Rent): 2.000k / 2.000k</span>
                        <span className="font-medium text-[#0f1011] dark:text-[#f7f8f8]">100%</span>
                      </div>
                      <div className="w-full bg-[#e2e8f0] dark:bg-[#18191a] h-1.5 rounded-full overflow-hidden">
                        <div className="bg-[#64748b] dark:bg-[#8a8f98] h-1.5 rounded-full w-[100%]" />
                      </div>
                    </div>
                  </div>

                  {/* AI Note */}
                  <div className="p-2.5 rounded-[8px] bg-white dark:bg-[#141516] border border-[#e2e8f0] dark:border-[#23252a] flex items-start gap-2 text-xs">
                    <Sparkles className="w-3.5 h-3.5 text-[#5e6ad2] flex-shrink-0 mt-0.5" />
                    <p className="text-[#64748b] dark:text-[#8a8f98] leading-relaxed text-[11px]">
                      <strong className="text-[#0f1011] dark:text-[#f7f8f8]">AI Insights:</strong> Chi tiêu ăn ngoài đang tăng 38%. Đặt trần 350k/tuần sẽ giúp bạn đạt mục tiêu tiết kiệm tháng!
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ================= WHAT THE COMPUTER DOES FOR YOU ================= */}
        <section id="features" className="py-20 max-w-[1280px] mx-auto px-4 sm:px-6">
          <div className="max-w-2xl mb-12">
            <span className="text-[13px] font-medium uppercase tracking-eyebrow text-[#64748b] dark:text-[#62666d]">
              Tự động hóa thông minh
            </span>
            <h2 className="text-2xl sm:text-3xl font-semibold tracking-[-0.8px] text-[#0f1011] dark:text-[#f7f8f8] mt-1">
              Máy Tính Sẽ Làm Gì Giúp Bạn?
            </h2>
            <p className="text-[#475569] dark:text-[#8a8f98] mt-2 text-[14px] leading-relaxed">
              Bạn không cần nhớ số, không cần tính toán thủ công. Toàn bộ công việc tính toán được giao lại cho phần mềm.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="p-5 rounded-[12px] border border-[#e2e8f0] dark:border-[#23252a] bg-[#f8f9fa] dark:bg-[#0f1011] edge-highlight">
              <Calendar className="w-4 h-4 text-[#5e6ad2] mb-3" />
              <h3 className="font-medium text-[#0f1011] dark:text-[#f7f8f8] text-[15px] tracking-card-title">Gom Nhóm Ngày, Tháng, Năm</h3>
              <p className="text-[13px] text-[#475569] dark:text-[#8a8f98] mt-1.5 leading-relaxed">
                Xem ngay hôm nay tiêu bao nhiêu, tháng này còn bao nhiêu, và cả năm đã chi vào việc gì nhiều nhất.
              </p>
            </div>

            <div className="p-5 rounded-[12px] border border-[#e2e8f0] dark:border-[#23252a] bg-[#f8f9fa] dark:bg-[#0f1011] edge-highlight">
              <Sparkles className="w-4 h-4 text-[#5e6ad2] mb-3" />
              <h3 className="font-medium text-[#0f1011] dark:text-[#f7f8f8] text-[15px] tracking-card-title">Tự Đoán Danh Mục (AI)</h3>
              <p className="text-[13px] text-[#475569] dark:text-[#8a8f98] mt-1.5 leading-relaxed">
                Gõ &quot;bún bò&quot; &rarr; AI tự biết là Ăn uống. Gõ &quot;đổ xăng&quot; &rarr; AI tự gán vào Đi lại.
              </p>
            </div>

            <div className="p-5 rounded-[12px] border border-[#e2e8f0] dark:border-[#23252a] bg-[#f8f9fa] dark:bg-[#0f1011] edge-highlight">
              <BellRing className="w-4 h-4 text-[#5e6ad2] mb-3" />
              <h3 className="font-medium text-[#0f1011] dark:text-[#f7f8f8] text-[15px] tracking-card-title">Canh Gác Ngân Sách</h3>
              <p className="text-[13px] text-[#475569] dark:text-[#8a8f98] mt-1.5 leading-relaxed">
                Tự động đo mức độ tiêu tiền, cảnh báo khi chạm 80% ngân sách và báo động khi vượt ngưỡng.
              </p>
            </div>

            <div className="p-5 rounded-[12px] border border-[#e2e8f0] dark:border-[#23252a] bg-[#f8f9fa] dark:bg-[#0f1011] edge-highlight">
              <PieChart className="w-4 h-4 text-[#5e6ad2] mb-3" />
              <h3 className="font-medium text-[#0f1011] dark:text-[#f7f8f8] text-[15px] tracking-card-title">Tự Vẽ Biểu Đồ & Xuất PDF</h3>
              <p className="text-[13px] text-[#475569] dark:text-[#8a8f98] mt-1.5 leading-relaxed">
                Biến các con số khô khan thành biểu đồ màu sắc trực quan, cho phép xuất file PDF lưu trữ.
              </p>
            </div>
          </div>
        </section>

        {/* ================= INTERACTIVE AI SHOWCASE ================= */}
        <section id="ai-assistant" className="py-16 bg-[#f8f9fa] dark:bg-[#0f1011] border-y border-[#e2e8f0] dark:border-[#23252a]">
          <div className="max-w-4xl mx-auto px-4 sm:px-6">
            <div className="bg-white dark:bg-[#141516] rounded-[16px] p-6 sm:p-8 border border-[#e2e8f0] dark:border-[#23252a] edge-highlight shadow-sm">
              <div className="text-[11px] font-medium text-[#64748b] dark:text-[#62666d] uppercase tracking-eyebrow mb-1">
                Trải Nghiệm Thử Nghiệm Tính Năng AI
              </div>
              <h3 className="text-xl font-semibold tracking-headline text-[#0f1011] dark:text-[#f7f8f8]">
                Gõ Nội Dung - AI Tự Nhận Diện Danh Mục
              </h3>
              <p className="text-[13px] text-[#475569] dark:text-[#8a8f98] mt-1 mb-4">
                Nhập thử mô tả chi tiêu để xem AI tự động phân tích và gán danh mục chuẩn xác:
              </p>

              {/* text-input according to DESIGN.md */}
              <div className="space-y-3">
                <input
                  type="text"
                  value={demoInput}
                  onChange={(e) => handleDemoCategorize(e.target.value)}
                  placeholder="Ví dụ: Cơm trưa căn tin, Đổ xăng xe máy, Spotify Premium..."
                  className="w-full px-3 py-2 rounded-[8px] border border-[#e2e8f0] dark:border-[#23252a] bg-[#f8f9fa] dark:bg-[#0f1011] text-[#0f1011] dark:text-[#f7f8f8] placeholder-[#94a3b8] dark:placeholder-[#62666d] focus:outline-none focus:ring-2 focus:ring-[#5e69d1]/50 text-[14px]"
                />

                <div className="flex flex-wrap gap-1.5 items-center text-xs">
                  <span className="text-[#64748b] dark:text-[#8a8f98] font-normal text-[11px]">Bấm thử mẫu:</span>
                  <button
                    onClick={() => handleDemoCategorize("Ăn bún chả căn tin cùng bạn")}
                    className="px-2 py-1 rounded-[6px] bg-[#f1f3f5] dark:bg-[#18191a] hover:bg-[#e9ecef] dark:hover:bg-[#191a1b] text-[#475569] dark:text-[#d0d6e0] border border-[#e2e8f0] dark:border-[#23252a] text-[11px] transition-colors"
                  >
                    Ăn bún chả
                  </button>
                  <button
                    onClick={() => handleDemoCategorize("Đổ xăng xe máy 70k")}
                    className="px-2 py-1 rounded-[6px] bg-[#f1f3f5] dark:bg-[#18191a] hover:bg-[#e9ecef] dark:hover:bg-[#191a1b] text-[#475569] dark:text-[#d0d6e0] border border-[#e2e8f0] dark:border-[#23252a] text-[11px] transition-colors"
                  >
                    Đổ xăng xe máy
                  </button>
                  <button
                    onClick={() => handleDemoCategorize("Gia hạn Spotify sinh viên")}
                    className="px-2 py-1 rounded-[6px] bg-[#f1f3f5] dark:bg-[#18191a] hover:bg-[#e9ecef] dark:hover:bg-[#191a1b] text-[#475569] dark:text-[#d0d6e0] border border-[#e2e8f0] dark:border-[#23252a] text-[11px] transition-colors"
                  >
                    Gia hạn Spotify
                  </button>
                  <button
                    onClick={() => handleDemoCategorize("Mua sách giáo trình Cấu trúc dữ liệu")}
                    className="px-2 py-1 rounded-[6px] bg-[#f1f3f5] dark:bg-[#18191a] hover:bg-[#e9ecef] dark:hover:bg-[#191a1b] text-[#475569] dark:text-[#d0d6e0] border border-[#e2e8f0] dark:border-[#23252a] text-[11px] transition-colors"
                  >
                    Mua sách giáo trình
                  </button>
                  <button
                    onClick={() => handleDemoCategorize("Lương part-time phụ quán cafe")}
                    className="px-2 py-1 rounded-[6px] bg-[#f1f3f5] dark:bg-[#18191a] hover:bg-[#e9ecef] dark:hover:bg-[#191a1b] text-[#475569] dark:text-[#d0d6e0] border border-[#e2e8f0] dark:border-[#23252a] text-[11px] transition-colors"
                  >
                    Lương part-time
                  </button>
                </div>

                <div className="p-3 rounded-[8px] bg-[#f8f9fa] dark:bg-[#0f1011] border border-[#e2e8f0] dark:border-[#23252a] flex items-center justify-between mt-3 text-xs">
                  <div>
                    <span className="text-[#64748b] dark:text-[#8a8f98]">Danh mục AI tự chọn: </span>
                    <strong className="text-[#0f1011] dark:text-[#f7f8f8] font-medium">{demoCategory}</strong>
                  </div>
                  <span className="text-[11px] text-[#27a644] font-medium">
                    Độ tin cậy: 98.4%
                  </span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ================= SITEMAP SECTION (MANDATORY REQUIREMENT) ================= */}
        <SitemapSection />
      </main>

      {/* ================= FOOTER ================= */}
      <footer className="bg-white dark:bg-[#010102] border-t border-[#e2e8f0] dark:border-[#23252a] py-8 transition-colors">
        <div className="max-w-[1280px] mx-auto px-4 sm:px-6">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4 text-center md:text-left text-[12px] text-[#64748b] dark:text-[#8a8f98]">
            <div className="flex items-center gap-2">
              <span className="font-semibold text-[#0f1011] dark:text-[#f7f8f8]">Campus Coin</span>
              <span>• Smart Spending Student Style</span>
            </div>

            <p>
              Dự án tham dự <strong>Techwiz 7 (Aptech)</strong> • Hạng mục: <strong>End-to-End Web Solutions</strong>
            </p>

            <div className="flex items-center gap-4 text-[#64748b] dark:text-[#8a8f98]">
              <Link href="/login" className="hover:text-[#0f1011] dark:hover:text-[#f7f8f8]">Đăng nhập</Link>
              <Link href="/admin/login" className="hover:text-[#0f1011] dark:hover:text-[#f7f8f8]">Admin Portal</Link>
              <Link href="#sitemap" className="hover:text-[#0f1011] dark:hover:text-[#f7f8f8]">Sitemap</Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
