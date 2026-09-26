"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Navbar from "@/components/Navbar";
import { ShieldCheck, ArrowRight, AlertCircle, Loader2 } from "lucide-react";

export default function AdminLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [checkingAuth, setCheckingAuth] = useState(true);

  useEffect(() => {
    fetch("/api/user/profile")
      .then((res) => {
        if (res.ok) return res.json();
        return null;
      })
      .then((data) => {
        if (data?.is_authenticated && data?.user) {
          if (data.user.role === "admin") {
            router.replace("/admin");
          } else {
            router.replace("/dashboard");
          }
        } else {
          setCheckingAuth(false);
        }
      })
      .catch(() => {
        setCheckingAuth(false);
      });
  }, [router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!email.trim()) {
      setError("Vui lòng nhập địa chỉ email quản trị viên.");
      return;
    }
    if (!password) {
      setError("Vui lòng nhập mật khẩu quản trị viên.");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim(), password }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Đăng nhập không thành công.");
      }

      if (data.user.role !== "admin") {
        throw new Error("Tài khoản này không có quyền Quản trị viên (Admin).");
      }

      router.push("/admin");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Đã xảy ra lỗi.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-white dark:bg-[#010102] text-[#0f1011] dark:text-[#f7f8f8] transition-colors">
      <Navbar />

      <main className="flex-1 flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-[440px] space-y-5">
          {checkingAuth ? (
            <div className="bg-[#ffffff] dark:bg-[#0f1011] border border-[#e2e8f0] dark:border-[#23252a] rounded-[12px] p-8 text-center edge-highlight space-y-3">
              <Loader2 className="w-6 h-6 animate-spin text-[#5e6ad2] mx-auto" />
              <p className="text-[13px] text-[#64748b] dark:text-[#8a8f98]">
                Đang kiểm tra quyền quản trị...
              </p>
            </div>
          ) : (
            /* Main Card */
            <div className="bg-white dark:bg-[#0f1011] border border-[#e2e8f0] dark:border-[#23252a] rounded-[12px] p-7 sm:p-8 edge-highlight space-y-6 shadow-sm dark:shadow-none">
            <div>
              <div className="inline-flex items-center gap-2 px-2 py-0.5 rounded-[4px] bg-[#f1f3f5] dark:bg-[#141516] text-[#7a7fad] text-[11px] font-medium tracking-eyebrow border border-[#e2e8f0] dark:border-[#23252a] mb-2 uppercase">
                <ShieldCheck className="w-3 h-3 text-[#7a7fad]" />
                Quản Trị Viên • Admin Portal
              </div>
              <h1 className="text-2xl font-semibold tracking-headline text-[#0f1011] dark:text-[#f7f8f8]">
                Cổng Quản Trị Hệ Thống
              </h1>
              <p className="text-[13px] text-[#64748b] dark:text-[#8a8f98] mt-1 leading-relaxed">
                Khu vực dành riêng cho Quản trị viên quản lý danh mục toàn trường, thống kê và tài khoản.
              </p>
            </div>

            {error && (
              <div className="p-3 rounded-[8px] bg-[#fff1f2] dark:bg-[#141516] border border-[#fecdd3] dark:border-[#3e3e44] text-[#be123c] dark:text-[#d0d6e0] text-xs flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-[#e11d48] dark:text-[#828fff] flex-shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            <form noValidate onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-[12px] font-medium text-[#475569] dark:text-[#d0d6e0] mb-1.5">
                  Email quản trị viên
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@campuscoin.edu"
                  required
                  className="w-full px-3 py-2 rounded-[8px] border border-[#e2e8f0] dark:border-[#23252a] bg-white dark:bg-[#141516] text-[#0f1011] dark:text-[#f7f8f8] placeholder-[#94a3b8] dark:placeholder-[#62666d] focus:outline-none focus:ring-2 focus:ring-[#5e69d1]/50 text-[14px]"
                />
              </div>

              <div>
                <label className="block text-[12px] font-medium text-[#475569] dark:text-[#d0d6e0] mb-1.5">
                  Mật khẩu Admin
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  className="w-full px-3 py-2 rounded-[8px] border border-[#e2e8f0] dark:border-[#23252a] bg-white dark:bg-[#141516] text-[#0f1011] dark:text-[#f7f8f8] placeholder-[#94a3b8] dark:placeholder-[#62666d] focus:outline-none focus:ring-2 focus:ring-[#5e69d1]/50 text-[14px]"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-2.5 px-4 rounded-[8px] bg-[#5e6ad2] hover:bg-[#828fff] text-white text-[14px] font-medium flex items-center justify-center gap-2 transition-colors disabled:opacity-60 shadow-xs cursor-pointer"
              >
                {loading ? "Đang xác thực quyền Admin..." : "Vào Bảng Quản Trị"}
                {!loading && <ArrowRight className="w-4 h-4" />}
              </button>
            </form>

            <div className="pt-4 border-t border-[#e2e8f0] dark:border-[#23252a] text-center text-xs text-[#64748b] dark:text-[#8a8f98]">
              <Link href="/login" className="hover:text-[#0f1011] dark:hover:text-[#f7f8f8] transition-colors">
                &larr; Quay lại Đăng nhập Sinh viên
              </Link>
            </div>
          </div>
        )}
      </div>
    </main>
    </div>
  );
}
