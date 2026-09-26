"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTheme } from "@/context/ThemeContext";
import {
  Coins,
  Sun,
  Moon,
  Type,
  ShieldCheck,
  LogIn,
  Menu,
  X,
  User,
  LogOut,
  Wallet,
} from "lucide-react";

interface NavbarUser {
  id: string;
  name: string;
  email: string;
  role?: string;
}

export default function Navbar() {
  const router = useRouter();
  const { theme, toggleTheme, fontSize, setFontSize } = useTheme();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [fontSizeMenuOpen, setFontSizeMenuOpen] = useState(false);
  const [currentUser, setCurrentUser] = useState<NavbarUser | null>(null);

  useEffect(() => {
    fetch("/api/user/profile")
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data?.is_authenticated && data?.user) {
          setCurrentUser(data.user);
        } else {
          setCurrentUser(null);
        }
      })
      .catch(() => setCurrentUser(null));
  }, []);

  const handleLogout = async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
      setCurrentUser(null);
      router.push("/login");
    } catch (e) {
      console.error("Logout error:", e);
    }
  };

  return (
    <header className="sticky top-0 z-50 w-full h-[56px] backdrop-blur-md bg-white/90 dark:bg-[#010102]/85 border-b border-[#e2e8f0] dark:border-[#23252a] transition-colors">
      <div className="max-w-[1280px] mx-auto px-4 sm:px-6 h-full flex items-center justify-between">
        {/* Brand Mark & Title */}
        <Link href="/" className="flex items-center gap-2.5 group">
          <div className="w-7 h-7 rounded-[6px] bg-[#5e6ad2] flex items-center justify-center text-white transition-opacity group-hover:opacity-90 shadow-sm">
            <Coins className="w-3.5 h-3.5" />
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[14px] font-semibold tracking-[-0.3px] text-[#0f1011] dark:text-[#f7f8f8]">
              Campus Coin
            </span>
            <span className="text-[10px] font-medium px-1.5 py-0.5 rounded-[4px] bg-[#f1f3f5] dark:bg-[#141516] text-[#64748b] dark:text-[#8a8f98] border border-[#e2e8f0] dark:border-[#23252a]">
              Techwiz 7
            </span>
          </div>
        </Link>

        {/* Center Nav Links */}
        <nav className="hidden md:flex items-center gap-6 text-[13px] font-normal text-[#64748b] dark:text-[#8a8f98]">
          <Link
            href="/#features"
            className="hover:text-[#0f1011] dark:hover:text-[#f7f8f8] transition-colors"
          >
            Tính năng
          </Link>
          <Link
            href="/#sitemap"
            className="hover:text-[#0f1011] dark:hover:text-[#f7f8f8] transition-colors"
          >
            Sitemap
          </Link>
          <Link
            href="/dashboard"
            className="hover:text-[#0f1011] dark:hover:text-[#f7f8f8] transition-colors flex items-center gap-1 font-medium text-[#5e6ad2] dark:text-[#828fff]"
          >
            Sổ Chi Tiêu
          </Link>
        </nav>

        {/* Right Controls & CTAs */}
        <div className="hidden lg:flex items-center gap-2">
          {/* Accessibility Font Size Toggle */}
          <div className="relative">
            <button
              onClick={() => setFontSizeMenuOpen(!fontSizeMenuOpen)}
              title="Cỡ chữ trợ năng (Accessibility)"
              className="h-8 px-2.5 rounded-[8px] bg-[#f8f9fa] dark:bg-[#0f1011] hover:bg-[#f1f3f5] dark:hover:bg-[#141516] text-[#64748b] dark:text-[#8a8f98] hover:text-[#0f1011] dark:hover:text-[#f7f8f8] border border-[#e2e8f0] dark:border-[#23252a] transition-colors flex items-center gap-1.5 text-[12px] font-medium"
            >
              <Type className="w-3.5 h-3.5" />
              <span>{fontSize === "normal" ? "A" : fontSize === "large" ? "A+" : "A++"}</span>
            </button>

            {fontSizeMenuOpen && (
              <div className="absolute right-0 mt-2 w-36 bg-white dark:bg-[#0f1011] rounded-[8px] shadow-2xl border border-[#e2e8f0] dark:border-[#23252a] p-1 z-50 text-[12px]">
                <p className="font-medium text-[#94a3b8] dark:text-[#62666d] px-2 py-1 uppercase text-[10px] tracking-wider">
                  Cỡ chữ
                </p>
                <button
                  onClick={() => {
                    setFontSize("normal");
                    setFontSizeMenuOpen(false);
                  }}
                  className={`w-full text-left px-2 py-1.5 rounded-[6px] transition-colors ${
                    fontSize === "normal"
                      ? "bg-[#f1f3f5] dark:bg-[#141516] font-medium text-[#0f1011] dark:text-[#f7f8f8] border border-[#e2e8f0] dark:border-[#34343a]"
                      : "text-[#64748b] dark:text-[#8a8f98] hover:bg-[#f8f9fa] dark:hover:bg-[#141516]"
                  }`}
                >
                  Chuẩn (100%)
                </button>
                <button
                  onClick={() => {
                    setFontSize("large");
                    setFontSizeMenuOpen(false);
                  }}
                  className={`w-full text-left px-2 py-1.5 rounded-[6px] transition-colors ${
                    fontSize === "large"
                      ? "bg-[#f1f3f5] dark:bg-[#141516] font-medium text-[#0f1011] dark:text-[#f7f8f8] border border-[#e2e8f0] dark:border-[#34343a]"
                      : "text-[#64748b] dark:text-[#8a8f98] hover:bg-[#f8f9fa] dark:hover:bg-[#141516]"
                  }`}
                >
                  Vừa (112%)
                </button>
                <button
                  onClick={() => {
                    setFontSize("larger");
                    setFontSizeMenuOpen(false);
                  }}
                  className={`w-full text-left px-2 py-1.5 rounded-[6px] transition-colors ${
                    fontSize === "larger"
                      ? "bg-[#f1f3f5] dark:bg-[#141516] font-medium text-[#0f1011] dark:text-[#f7f8f8] border border-[#e2e8f0] dark:border-[#34343a]"
                      : "text-[#64748b] dark:text-[#8a8f98] hover:bg-[#f8f9fa] dark:hover:bg-[#141516]"
                  }`}
                >
                  Lớn (125%)
                </button>
              </div>
            )}
          </div>

          {/* Theme Toggle (supports both with smooth feedback) */}
          <button
            onClick={toggleTheme}
            title={theme === "light" ? "Bật chế độ tối (Linear Dark)" : "Bật chế độ sáng (Clean Light)"}
            className="w-8 h-8 rounded-[8px] flex items-center justify-center bg-[#f8f9fa] dark:bg-[#0f1011] hover:bg-[#f1f3f5] dark:hover:bg-[#141516] text-[#64748b] dark:text-[#8a8f98] hover:text-[#0f1011] dark:hover:text-[#f7f8f8] border border-[#e2e8f0] dark:border-[#23252a] transition-colors cursor-pointer"
          >
            {theme === "light" ? <Moon className="w-3.5 h-3.5 text-[#5e6ad2]" /> : <Sun className="w-3.5 h-3.5 text-[#828fff]" />}
          </button>

          <div className="h-4 w-px bg-[#e2e8f0] dark:bg-[#23252a] mx-1" />

          {/* Admin Portal Link */}
          <Link
            href="/admin/login"
            className="h-8 px-2.5 rounded-[8px] text-[13px] font-normal text-[#64748b] dark:text-[#8a8f98] hover:text-[#0f1011] dark:hover:text-[#f7f8f8] flex items-center gap-1.5 transition-colors"
          >
            <ShieldCheck className="w-3.5 h-3.5 text-[#7a7fad]" />
            Cổng Admin
          </Link>

          {currentUser ? (
            /* ĐÃ ĐĂNG NHẬP: Hiển thị Profile Badge + Nút Sổ Chi Tiêu + Nút Đăng Xuất */
            <div className="flex items-center gap-2">
              <Link
                href="/dashboard"
                className="h-8 px-2.5 rounded-[8px] bg-[#f1f5f9] dark:bg-[#141516] hover:bg-[#e2e8f0] dark:hover:bg-[#1a1b1d] border border-[#cbd5e1] dark:border-[#23252a] text-[12px] font-medium text-[#0f1011] dark:text-[#f7f8f8] flex items-center gap-1.5 transition-colors"
                title={`Đang đăng nhập: ${currentUser.name}`}
              >
                <div className="w-5 h-5 rounded-full bg-[#5e6ad2] text-white flex items-center justify-center text-[10px] font-bold">
                  {currentUser.name ? currentUser.name.charAt(0) : "U"}
                </div>
                <span className="max-w-[120px] truncate font-semibold">{currentUser.name}</span>
              </Link>

              <Link
                href="/dashboard"
                className="h-8 px-3 rounded-[8px] bg-[#5e6ad2] hover:bg-[#4f5dc8] text-white text-[12px] font-medium flex items-center gap-1.5 transition-colors shadow-xs"
              >
                <Wallet className="w-3.5 h-3.5" />
                Vào Sổ
              </Link>

              <button
                type="button"
                onClick={handleLogout}
                title="Đăng xuất tài khoản"
                className="h-8 px-2.5 rounded-[8px] bg-white dark:bg-[#0f1011] hover:bg-[#fef2f2] dark:hover:bg-[#1f1315] text-[#64748b] dark:text-[#8a8f98] hover:text-[#e11d48] border border-[#e2e8f0] dark:border-[#23252a] text-[12px] font-medium flex items-center gap-1 cursor-pointer transition-colors"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span className="hidden xl:inline">Đăng xuất</span>
              </button>
            </div>
          ) : (
            /* CHƯA ĐĂNG NHẬP: Hiển thị Đăng nhập & Đăng ký / Vào Sổ Chi Tiêu */
            <>
              <Link
                href="/login"
                className="h-8 px-3 rounded-[8px] bg-[#f8f9fa] dark:bg-[#0f1011] hover:bg-[#f1f3f5] dark:hover:bg-[#141516] text-[#0f1011] dark:text-[#f7f8f8] border border-[#e2e8f0] dark:border-[#23252a] text-[13px] font-medium flex items-center gap-1.5 transition-colors"
              >
                <LogIn className="w-3.5 h-3.5 text-[#64748b] dark:text-[#8a8f98]" />
                Đăng nhập
              </Link>

              <Link
                href="/login"
                className="h-8 px-3.5 rounded-[8px] bg-[#5e6ad2] hover:bg-[#828fff] text-white text-[13px] font-medium flex items-center justify-center transition-colors shadow-xs"
              >
                Vào Sổ Chi Tiêu
              </Link>
            </>
          )}
        </div>

        {/* Mobile menu button */}
        <div className="flex items-center gap-1.5 lg:hidden">
          <button
            onClick={toggleTheme}
            className="w-8 h-8 rounded-[8px] flex items-center justify-center bg-[#f8f9fa] dark:bg-[#0f1011] text-[#64748b] dark:text-[#8a8f98] border border-[#e2e8f0] dark:border-[#23252a]"
          >
            {theme === "light" ? <Moon className="w-3.5 h-3.5" /> : <Sun className="w-3.5 h-3.5" />}
          </button>
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="w-8 h-8 rounded-[8px] flex items-center justify-center bg-[#f8f9fa] dark:bg-[#0f1011] text-[#64748b] dark:text-[#8a8f98] border border-[#e2e8f0] dark:border-[#23252a]"
          >
            {mobileMenuOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="lg:hidden border-b border-[#e2e8f0] dark:border-[#23252a] bg-white dark:bg-[#010102] px-4 py-3 space-y-2 text-[13px]">
          <Link
            href="/#features"
            onClick={() => setMobileMenuOpen(false)}
            className="block py-1 text-[#64748b] dark:text-[#8a8f98] hover:text-[#0f1011] dark:hover:text-[#f7f8f8]"
          >
            Tính năng
          </Link>
          <Link
            href="/#sitemap"
            onClick={() => setMobileMenuOpen(false)}
            className="block py-1 text-[#64748b] dark:text-[#8a8f98] hover:text-[#0f1011] dark:hover:text-[#f7f8f8]"
          >
            Sitemap
          </Link>
          <Link
            href="/dashboard"
            onClick={() => setMobileMenuOpen(false)}
            className="block py-1 text-[#64748b] dark:text-[#8a8f98] hover:text-[#0f1011] dark:hover:text-[#f7f8f8]"
          >
            Sổ Chi Tiêu (/dashboard)
          </Link>
          <div className="pt-2 border-t border-[#e2e8f0] dark:border-[#23252a] flex flex-col gap-2">
            <Link
              href="/admin/login"
              onClick={() => setMobileMenuOpen(false)}
              className="w-full text-center py-2 rounded-[8px] border border-[#e2e8f0] dark:border-[#23252a] bg-[#f8f9fa] dark:bg-[#0f1011] text-[#0f1011] dark:text-[#f7f8f8]"
            >
              Cổng Quản trị Admin
            </Link>
            {currentUser ? (
              <div className="space-y-2">
                <Link
                  href="/dashboard"
                  onClick={() => setMobileMenuOpen(false)}
                  className="w-full text-center py-2 rounded-[8px] bg-[#5e6ad2] text-white font-medium flex items-center justify-center gap-1.5"
                >
                  <Wallet className="w-4 h-4" />
                  Sổ Chi Tiêu ({currentUser.name})
                </Link>
                <button
                  type="button"
                  onClick={() => {
                    setMobileMenuOpen(false);
                    handleLogout();
                  }}
                  className="w-full text-center py-2 rounded-[8px] border border-[#fecaca] dark:border-[#3b171c] bg-[#fef2f2] dark:bg-[#1f1315] text-[#e11d48] font-medium flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <LogOut className="w-4 h-4" />
                  Đăng xuất
                </button>
              </div>
            ) : (
              <Link
                href="/login"
                onClick={() => setMobileMenuOpen(false)}
                className="w-full text-center py-2 rounded-[8px] bg-[#5e6ad2] text-white font-medium"
              >
                Đăng nhập vào Sổ Chi Tiêu
              </Link>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
