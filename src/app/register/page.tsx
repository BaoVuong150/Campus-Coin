"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Navbar from "@/components/Navbar";
import { UserPlus, ArrowRight, AlertCircle, Loader2 } from "lucide-react";
import { formatCurrencyInput, parseCurrencyInput } from "@/lib/currency";

export default function RegisterPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [academicYear, setAcademicYear] = useState("Năm 2 (K21)");
  const [allowance, setAllowance] = useState(formatCurrencyInput(8000000));
  const [savingsGoal, setSavingsGoal] = useState(formatCurrencyInput(1500000));
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [checkingAuth, setCheckingAuth] = useState(true);

  useEffect(() => {
    // Nếu đã đăng nhập thì cấm tuyệt đối ở lại trang register, đẩy ngay sang dashboard hoặc admin
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

    if (!name.trim()) {
      setError("Vui lòng nhập họ và tên sinh viên.");
      return;
    }
    if (!email.trim() || !email.includes("@")) {
      setError("Vui lòng nhập địa chỉ email hợp lệ.");
      return;
    }
    if (!password || password.length < 6) {
      setError("Mật khẩu phải có độ dài tối thiểu 6 ký tự.");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          email: email.trim(),
          password,
          academic_year: academicYear,
          monthly_allowance_baseline: parseCurrencyInput(allowance),
          monthly_savings_goal: parseCurrencyInput(savingsGoal),
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Đăng ký không thành công.");
      }

      router.push("/dashboard");
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
        <div className="w-full max-w-[500px]">
          {checkingAuth ? (
            <div className="bg-[#ffffff] dark:bg-[#0f1011] border border-[#e2e8f0] dark:border-[#23252a] rounded-[12px] p-8 text-center edge-highlight space-y-3">
              <Loader2 className="w-6 h-6 animate-spin text-[#5e6ad2] mx-auto" />
              <p className="text-[13px] text-[#64748b] dark:text-[#8a8f98]">
                Đang kiểm tra phiên làm việc...
              </p>
            </div>
          ) : (
            <div className="bg-white dark:bg-[#0f1011] border border-[#e2e8f0] dark:border-[#23252a] rounded-[12px] p-7 sm:p-8 edge-highlight space-y-6 shadow-sm dark:shadow-none">
              <div>
                <div className="inline-flex items-center gap-2 px-2 py-0.5 rounded-[4px] bg-[#f1f3f5] dark:bg-[#141516] text-[#64748b] dark:text-[#8a8f98] text-[11px] font-medium tracking-eyebrow border border-[#e2e8f0] dark:border-[#23252a] mb-2 uppercase">
                  <UserPlus className="w-3 h-3 text-[#5e6ad2]" />
                  Hồ Sơ Sinh Viên • Campus Coin
                </div>
              <h1 className="text-2xl font-semibold tracking-headline text-[#0f1011] dark:text-[#f7f8f8]">
                Tạo Hồ Sơ Sinh Viên
              </h1>
              <p className="text-[13px] text-[#64748b] dark:text-[#8a8f98] mt-1 leading-relaxed">
                Thiết lập hạn mức và mục tiêu tiết kiệm để bắt đầu ghi chép thông minh.
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
                  Họ và tên sinh viên
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Ví dụ: Trần Minh Đức"
                  required
                  className="w-full px-3 py-2 rounded-[8px] border border-[#e2e8f0] dark:border-[#23252a] bg-white dark:bg-[#141516] text-[#0f1011] dark:text-[#f7f8f8] placeholder-[#94a3b8] dark:placeholder-[#62666d] focus:outline-none focus:ring-2 focus:ring-[#5e69d1]/50 text-[14px]"
                />
              </div>

              <div>
                <label className="block text-[12px] font-medium text-[#475569] dark:text-[#d0d6e0] mb-1.5">
                  Email sinh viên (Tài khoản)
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="minhduc@student.edu.vn"
                  required
                  className="w-full px-3 py-2 rounded-[8px] border border-[#e2e8f0] dark:border-[#23252a] bg-white dark:bg-[#141516] text-[#0f1011] dark:text-[#f7f8f8] placeholder-[#94a3b8] dark:placeholder-[#62666d] focus:outline-none focus:ring-2 focus:ring-[#5e69d1]/50 text-[14px]"
                />
              </div>

              <div>
                <label className="block text-[12px] font-medium text-[#475569] dark:text-[#d0d6e0] mb-1.5">
                  Mật khẩu
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Tối thiểu 6 ký tự"
                  required
                  minLength={6}
                  className="w-full px-3 py-2 rounded-[8px] border border-[#e2e8f0] dark:border-[#23252a] bg-white dark:bg-[#141516] text-[#0f1011] dark:text-[#f7f8f8] placeholder-[#94a3b8] dark:placeholder-[#62666d] focus:outline-none focus:ring-2 focus:ring-[#5e69d1]/50 text-[14px]"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[12px] font-medium text-[#475569] dark:text-[#d0d6e0] mb-1.5">
                    Năm học (Academic Year)
                  </label>
                  <select
                    value={academicYear}
                    onChange={(e) => setAcademicYear(e.target.value)}
                    className="w-full px-3 py-2 rounded-[8px] border border-[#e2e8f0] dark:border-[#23252a] bg-white dark:bg-[#141516] text-[#0f1011] dark:text-[#f7f8f8] focus:outline-none focus:ring-2 focus:ring-[#5e69d1]/50 text-[14px]"
                  >
                    <option value="Năm 1 (K22)">Năm 1 (K22)</option>
                    <option value="Năm 2 (K21)">Năm 2 (K21)</option>
                    <option value="Năm 3 (K20)">Năm 3 (K20)</option>
                    <option value="Năm 4 (K19)">Năm 4 (K19)</option>
                    <option value="Cao đẳng / Sau ĐH">Cao đẳng / Sau ĐH</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[12px] font-medium text-[#475569] dark:text-[#d0d6e0] mb-1.5">
                    Trợ cấp dự kiến / tháng (VNĐ)
                  </label>
                  <input
                    type="text"
                    inputMode="numeric"
                    value={allowance}
                    onChange={(e) => setAllowance(formatCurrencyInput(e.target.value))}
                    placeholder="8.000.000"
                    className="w-full px-3 py-2 rounded-[8px] border border-[#e2e8f0] dark:border-[#23252a] bg-white dark:bg-[#141516] text-[#0f1011] dark:text-[#f7f8f8] placeholder-[#94a3b8] dark:placeholder-[#62666d] focus:outline-none focus:ring-2 focus:ring-[#5e69d1]/50 text-[14px]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[12px] font-medium text-[#475569] dark:text-[#d0d6e0] mb-1.5">
                  Mục tiêu tiết kiệm / tháng (VNĐ)
                </label>
                <input
                  type="text"
                  inputMode="numeric"
                  value={savingsGoal}
                  onChange={(e) => setSavingsGoal(formatCurrencyInput(e.target.value))}
                  placeholder="1.500.000"
                  className="w-full px-3 py-2 rounded-[8px] border border-[#e2e8f0] dark:border-[#23252a] bg-white dark:bg-[#141516] text-[#0f1011] dark:text-[#f7f8f8] placeholder-[#94a3b8] dark:placeholder-[#62666d] focus:outline-none focus:ring-2 focus:ring-[#5e69d1]/50 text-[14px]"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-2.5 px-4 rounded-[8px] bg-[#5e6ad2] hover:bg-[#828fff] text-white text-[14px] font-medium flex items-center justify-center gap-2 transition-colors disabled:opacity-60 shadow-xs cursor-pointer"
              >
                {loading ? "Đang tạo tài khoản..." : "Hoàn Tất Đăng Ký"}
                {!loading && <ArrowRight className="w-4 h-4" />}
              </button>
            </form>

            <div className="pt-4 border-t border-[#e2e8f0] dark:border-[#23252a] text-center text-xs text-[#64748b] dark:text-[#8a8f98]">
              Đã có tài khoản?{" "}
              <Link href="/login" className="text-[#5e6ad2] dark:text-[#828fff] hover:underline font-medium">
                Đăng nhập tại đây
              </Link>
            </div>
          </div>
        )}
        </div>
      </main>
    </div>
  );
}
