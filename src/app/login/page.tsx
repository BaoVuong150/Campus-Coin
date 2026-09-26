"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Navbar from "@/components/Navbar";
import { LogIn, ArrowRight, AlertCircle, Loader2 } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [checkingAuth, setCheckingAuth] = useState(true);

  useEffect(() => {
    // Nếu đã đăng nhập thì cấm tuyệt đối ở lại trang login, đẩy ngay sang dashboard hoặc admin
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
      setError("Vui lòng nhập địa chỉ email sinh viên.");
      return;
    }
    if (!password) {
      setError("Vui lòng nhập mật khẩu tài khoản.");
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

      if (data.user.role === "admin") {
        router.push("/admin");
      } else {
        router.push("/dashboard");
      }
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
                Đang kiểm tra phiên làm việc...
              </p>
            </div>
          ) : (
            /* Main Auth Card (Linear surface-1 #0f1011, rounded 12px, border hairline) */
            <div className="bg-[#ffffff] dark:bg-[#0f1011] border border-[#e2e8f0] dark:border-[#23252a] rounded-[12px] p-7 sm:p-8 edge-highlight space-y-6 shadow-sm dark:shadow-none">
              <div>
                <div className="inline-flex items-center gap-2 px-2 py-0.5 rounded-[4px] bg-[#f1f3f5] dark:bg-[#141516] text-[#64748b] dark:text-[#8a8f98] text-[11px] font-medium tracking-eyebrow border border-[#e2e8f0] dark:border-[#23252a] mb-2 uppercase">
                  <LogIn className="w-3 h-3 text-[#5e6ad2]" />
                  Cổng Sinh Viên
                </div>
                <h1 className="text-2xl font-semibold tracking-headline text-[#0f1011] dark:text-[#f7f8f8]">
                  Đăng Nhập Sổ Chi Tiêu
                </h1>
                <p className="text-[13px] text-[#64748b] dark:text-[#8a8f98] mt-1 leading-relaxed">
                  Nhập email sinh viên để truy cập không gian quản lý tài chính cá nhân.
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
                    Email sinh viên
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="student@campuscoin.edu"
                    required
                    className="w-full px-3 py-2 rounded-[8px] border border-[#e2e8f0] dark:border-[#23252a] bg-white dark:bg-[#141516] text-[#0f1011] dark:text-[#f7f8f8] placeholder-[#94a3b8] dark:placeholder-[#62666d] focus:outline-none focus:ring-2 focus:ring-[#5e69d1]/50 text-[14px]"
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-[12px] font-medium text-[#475569] dark:text-[#d0d6e0]">
                      Mật khẩu
                    </label>
                    <span className="text-[11px] text-[#94a3b8] dark:text-[#62666d] hover:text-[#0f1011] dark:hover:text-[#8a8f98] cursor-pointer">
                      Quên mật khẩu?
                    </span>
                  </div>
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
                  {loading ? "Đang xác thực..." : "Đăng Nhập"}
                  {!loading && <ArrowRight className="w-4 h-4" />}
                </button>
              </form>

              <div className="pt-4 border-t border-[#e2e8f0] dark:border-[#23252a] flex flex-col gap-2 text-center text-xs text-[#64748b] dark:text-[#8a8f98]">
                <p>
                  Chưa có tài khoản?{" "}
                  <Link href="/register" className="text-[#5e6ad2] dark:text-[#828fff] hover:underline font-medium">
                    Đăng ký hồ sơ sinh viên
                  </Link>
                </p>
                <p>
                  Bạn là Quản trị viên?{" "}
                  <Link href="/admin/login" className="text-[#64748b] dark:text-[#8a8f98] hover:text-[#0f1011] dark:hover:text-[#f7f8f8] underline">
                    Đến Cổng Admin
                  </Link>
                </p>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
