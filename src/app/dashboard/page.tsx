"use client";

import React, { useState, useEffect, useMemo, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Navbar from "@/components/Navbar";
import {
  Coins,
  Plus,
  ArrowUpRight,
  ArrowDownLeft,
  Calendar,
  Sparkles,
  PieChart,
  Target,
  Download,
  Trash2,
  Edit2,
  Filter,
  CheckCircle2,
  AlertTriangle,
  Pin,
  X,
  Search,
  LogOut,
  RefreshCw,
  Wallet,
  Clock,
  ChevronLeft,
  ChevronRight,
  ShieldCheck,
  Check,
  Zap,
  Settings,
  Home,
  Receipt,
  CreditCard,
  PiggyBank,
  TrendingUp,
} from "lucide-react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from "recharts";
import jsPDF from "jspdf";
import { useToast } from "@/context/ToastContext";
import { formatCurrencyInput, parseCurrencyInput } from "@/lib/currency";

interface Transaction {
  id: string;
  amount: number;
  type: string;
  description: string;
  date: string;
  category_id: number;
  category: {
    id: number;
    name: string;
    type: string;
    icon?: string;
  };
  ai_suggested_category?: number | null;
  is_recurring?: boolean;
}

interface BudgetStatus {
  id: number;
  categoryId: number;
  categoryName: string;
  limit: number;
  spent: number;
  remaining: number;
  percentage: number;
  status: string;
}

export interface FixedBill {
  id: string;
  name: string;
  amount: number;
  dueDay: number; // 1 - 31
  category_id: number;
}

const DEFAULT_FIXED_BILLS: FixedBill[] = [
  { id: "bill-1", name: "Tiền trọ / Ký túc xá", amount: 2500000, dueDay: 7, category_id: 8 },
  { id: "bill-2", name: "Điện, nước, wifi phòng", amount: 400000, dueDay: 10, category_id: 8 },
  { id: "bill-3", name: "Gói cước di động 4G / Net", amount: 120000, dueDay: 15, category_id: 10 },
];

interface SavingTip {
  id: number;
  title: string;
  content: string;
  potential_saving?: number;
  is_pinned: boolean;
}

function getTodayDateString(): string {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, "0");
  const d = String(now.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function getCurrentMonthString(): string {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, "0");
  return `${y}-${m}`;
}

function getCurrentYearString(): string {
  return String(new Date().getFullYear());
}

export default function DashboardPage() {
  const router = useRouter();
  const { toast, confirm } = useToast();

  // State
  const [mounted, setMounted] = useState(false);
  const [timeline, setTimeline] = useState<"day" | "month" | "year">("month");
  const [selectedMonth, setSelectedMonth] = useState(getCurrentMonthString());
  const [selectedDay, setSelectedDay] = useState(getTodayDateString());
  const [selectedYear, setSelectedYear] = useState(getCurrentYearString());

  // User Profile & Monthly Allowance & Pay Day & Fixed Bills
  const [monthlyAllowance, setMonthlyAllowance] = useState<number>(8000000);
  const [studentName, setStudentName] = useState<string>("Sinh viên");
  const [salaryPayDay, setSalaryPayDay] = useState<number>(5);
  const [fixedBills, setFixedBills] = useState<FixedBill[]>(DEFAULT_FIXED_BILLS);
  const [isAllowanceModalOpen, setIsAllowanceModalOpen] = useState(false);
  const [newAllowanceInput, setNewAllowanceInput] = useState(formatCurrencyInput(8000000));

  // Settings Modal Form State
  const [settingsSalaryPayDay, setSettingsSalaryPayDay] = useState<number>(5);
  const [settingsFixedBills, setSettingsFixedBills] = useState<FixedBill[]>(DEFAULT_FIXED_BILLS);
  const [newBillName, setNewBillName] = useState("");
  const [newBillAmount, setNewBillAmount] = useState("");
  const [newBillDueDay, setNewBillDueDay] = useState<number>(5);
  const [newBillCatId, setNewBillCatId] = useState<number>(8);

  // Inline edit state for fixed bills in settings modal
  const [editingBillId, setEditingBillId] = useState<string | null>(null);
  const [editBillName, setEditBillName] = useState("");
  const [editBillAmount, setEditBillAmount] = useState("");
  const [editBillDueDay, setEditBillDueDay] = useState<number>(5);
  const [editBillCatId, setEditBillCatId] = useState<number>(8);
  // Monthly Savings Goal State (SRS 3.1 & 3.8)
  const [monthlySavingsGoal, setMonthlySavingsGoal] = useState<number>(1500000);
  const [settingsSavingsGoalInput, setSettingsSavingsGoalInput] = useState<string>(formatCurrencyInput(1500000));
  const [isEditingGoal, setIsEditingGoal] = useState<boolean>(false);
  const [editSavingsGoalInput, setEditSavingsGoalInput] = useState<string>(formatCurrencyInput(1500000));
  const [isSavingGoalLoading, setIsSavingGoalLoading] = useState<boolean>(false);

  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [budgets, setBudgets] = useState<BudgetStatus[]>([]);
  const [categories, setCategories] = useState<{ id: number; name: string; type: string }[]>([]);
  const [savingTips, setSavingTips] = useState<SavingTip[]>([]);
  const [aiInsight, setAiInsight] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [activeLedgerTab, setActiveLedgerTab] = useState<"today" | "all">("today");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  // Inline Quick-Add State (5-second entry)
  const [inlineAmount, setInlineAmount] = useState("");
  const [inlineDesc, setInlineDesc] = useState("");
  const [inlineCategoryId, setInlineCategoryId] = useState<number | "">("");
  const [inlineAiSuggestion, setInlineAiSuggestion] = useState<{
    name: string;
    id: number;
    confidence: number;
  } | null>(null);
  const [isSubmittingInline, setIsSubmittingInline] = useState(false);

  // Modal State
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isBudgetModalOpen, setIsBudgetModalOpen] = useState(false);

  // Form State for Detailed Modal Add
  const [txType, setTxType] = useState<"expense" | "income">("expense");
  const [txAmount, setTxAmount] = useState("");
  const [txDesc, setTxDesc] = useState("");
  const [txCategoryId, setTxCategoryId] = useState<number | "">("");
  const [txDate, setTxDate] = useState(getTodayDateString());
  const [txRecurring, setTxRecurring] = useState(false);
  const [aiSuggestion, setAiSuggestion] = useState<{ name: string; id: number; confidence: number } | null>(null);
  const [sixMonthsData, setSixMonthsData] = useState<{ month: string; monthKey: string; Thu: number; Chi: number }[]>([]);

  // Budget Modal Form State
  const [budgetCatId, setBudgetCatId] = useState<number>(1);
  const [budgetLimit, setBudgetLimit] = useState(formatCurrencyInput(2500000));

  useEffect(() => {
    setMounted(true);
    try {
      const stored = localStorage.getItem("campuscoin_financial_settings");
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed.salaryPayDay) {
          setSalaryPayDay(parsed.salaryPayDay);
          setSettingsSalaryPayDay(parsed.salaryPayDay);
        }
        if (Array.isArray(parsed.fixedBills) && parsed.fixedBills.length > 0) {
          setFixedBills(parsed.fixedBills);
          setSettingsFixedBills(parsed.fixedBills);
        }
      }
    } catch (e) {
      console.warn("Could not read local financial settings:", e);
    }
  }, []);

  // Fetch initial data in parallel (High Performance & Non-blocking)
  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      let query = `?timeline=${timeline}`;
      if (timeline === "day") query += `&date=${selectedDay}`;
      else if (timeline === "year") query += `&year=${selectedYear}`;
      else query += `&month=${selectedMonth}`;

      // Bắn đồng thời 5 API song song thay vì tuần tự (loại bỏ hoàn toàn Network Waterfall)
      const [profResult, catResult, txResult, bResult, aiResult] = await Promise.allSettled([
        fetch("/api/user/profile").then((r) => r.json()),
        fetch("/api/categories").then((r) => r.json()),
        fetch(`/api/transactions${query}`).then((r) => r.json()),
        fetch(`/api/budgets?month=${selectedMonth}`).then((r) => r.json()),
        fetch(`/api/ai/insights?month=${selectedMonth}`).then((r) => r.json()),
      ]);

      if (profResult.status === "fulfilled" && profResult.value?.user) {
        const u = profResult.value.user;
        if (u.name) setStudentName(u.name);
        const baseline = Number(u.monthly_allowance_baseline) || 8000000;
        setMonthlyAllowance(baseline);
        setNewAllowanceInput(formatCurrencyInput(baseline));
        const goal = Number(u.monthly_savings_goal) || 1500000;
        setMonthlySavingsGoal(goal);
        setEditSavingsGoalInput(formatCurrencyInput(goal));
        setSettingsSavingsGoalInput(formatCurrencyInput(goal));
        if (u.salary_pay_day) {
          setSalaryPayDay(Number(u.salary_pay_day));
          setSettingsSalaryPayDay(Number(u.salary_pay_day));
        }
        if (Array.isArray(u.fixed_bills) && u.fixed_bills.length > 0) {
          const sanitizedBills = u.fixed_bills.map((b: FixedBill) => {
            let catId = Number(b.category_id);
            if (!catId || catId <= 5) {
              const lower = (b.name || "").toLowerCase();
              if (lower.includes("trọ") || lower.includes("ktx") || lower.includes("ký túc") || lower.includes("phòng") || lower.includes("điện") || lower.includes("nước") || lower.includes("wifi")) {
                catId = 8;
              } else if (lower.includes("4g") || lower.includes("net") || lower.includes("cước") || lower.includes("sim") || lower.includes("antigravity") || lower.includes("dịch vụ")) {
                catId = 10;
              } else {
                catId = 12;
              }
            }
            return { ...b, category_id: catId };
          });
          setFixedBills(sanitizedBills);
          setSettingsFixedBills(sanitizedBills);
        }
      }

      if (catResult.status === "fulfilled" && catResult.value?.categories) {
        setCategories(catResult.value.categories);
      }

      if (txResult.status === "fulfilled" && txResult.value?.transactions) {
        setTransactions(txResult.value.transactions);
        if (Array.isArray(txResult.value?.summary?.sixMonths)) {
          setSixMonthsData(txResult.value.summary.sixMonths);
        }
      }

      if (bResult.status === "fulfilled" && bResult.value?.budgets) {
        setBudgets(bResult.value.budgets);
      }

      if (aiResult.status === "fulfilled" && aiResult.value) {
        if (aiResult.value.insight) setAiInsight(aiResult.value.insight.summary_text);
        if (aiResult.value.savingTips) setSavingTips(aiResult.value.savingTips);
      }
    } catch (err) {
      console.error("Dashboard fetchData error:", err);
    } finally {
      setLoading(false);
    }
  }, [timeline, selectedMonth, selectedDay, selectedYear]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Real-time AI Categorization for INLINE Fast Input
  useEffect(() => {
    if (!inlineDesc.trim() || inlineDesc.length < 2) {
      setInlineAiSuggestion(null);
      return;
    }

    const timer = setTimeout(async () => {
      try {
        const res = await fetch("/api/ai/categorize", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ text: inlineDesc }),
        });
        const data = await res.json();
        if (data.categoryId) {
          setInlineAiSuggestion({
            name: data.categoryName,
            id: data.categoryId,
            confidence: Math.round(data.confidence * 100),
          });
          setInlineCategoryId(data.categoryId);
        }
      } catch (err) {
        console.error("Inline AI error:", err);
      }
    }, 250);

    return () => clearTimeout(timer);
  }, [inlineDesc]);

  // Real-time AI Categorization for Modal Add
  useEffect(() => {
    if (!txDesc.trim() || txDesc.length < 3) {
      setAiSuggestion(null);
      return;
    }

    const timer = setTimeout(async () => {
      try {
        const res = await fetch("/api/ai/categorize", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ text: txDesc }),
        });
        const data = await res.json();
        if (data.categoryId) {
          setAiSuggestion({
            name: data.categoryName,
            id: data.categoryId,
            confidence: Math.round(data.confidence * 100),
          });
          if (!txCategoryId) {
            setTxCategoryId(data.categoryId);
          }
        }
      } catch (err) {
        console.error("AI Categorize error:", err);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [txDesc, txCategoryId]);

  // Handle Quick Inline Expense Submission (5 seconds habit)
  const handleSaveInlineExpense = async (e: React.FormEvent) => {
    e.preventDefault();
    const amountNum = parseCurrencyInput(inlineAmount);
    if (!amountNum || amountNum <= 0) {
      toast.warning("Chưa nhập số tiền", "Vui lòng nhập số tiền chi tiêu hợp lệ lớn hơn 0 đ.");
      return;
    }
    if (!inlineDesc.trim()) {
      toast.warning("Chưa có nội dung", "Vui lòng nhập tên món chi tiêu (ví dụ: Cơm trưa, Cà phê, Xăng xe).");
      return;
    }

    // SRS 3.12: Phát hiện giao dịch bất thường (>40% quỹ lương)
    if (amountNum >= monthlyAllowance * 0.4) {
      const confirmLarge = await confirm({
        title: "Cảnh báo chi phí bất thường",
        message: `Khoản chi này có số tiền ${amountNum.toLocaleString("vi-VN")} đ, chiếm hơn 40% tổng quỹ lương tháng (${monthlyAllowance.toLocaleString("vi-VN")} đ). Bạn có chắc chắn muốn ghi nhận không?`,
        confirmText: "Vẫn ghi nhận",
        cancelText: "Kiểm tra lại",
        isDestructive: false,
      });
      if (!confirmLarge) return;
    }

    // SRS 3.12: Phát hiện giao dịch trùng lặp trong ngày
    const targetDate = selectedDay || getTodayDateString();
    const isDuplicate = transactions.some((t) => {
      const txDay = t.date.split("T")[0];
      const isSameDate = txDay === targetDate;
      const isSameType = t.type === "expense";
      const isSameDesc = t.description.trim().toLowerCase() === inlineDesc.trim().toLowerCase();
      const isSameAmount = Math.abs(Number(t.amount) - amountNum) < 1;
      return isSameDate && isSameType && isSameDesc && isSameAmount;
    });

    if (isDuplicate) {
      const confirmDup = await confirm({
        title: "Cảnh báo trùng lặp giao dịch",
        message: `Bạn đã có một khoản chi "${inlineDesc.trim()}" (${amountNum.toLocaleString("vi-VN")} đ) trong ngày hôm nay. Bạn có chắc muốn thêm một khoản tương tự không?`,
        confirmText: "Vẫn thêm tiếp",
        cancelText: "Hủy bỏ",
        isDestructive: false,
      });
      if (!confirmDup) return;
    }

    setIsSubmittingInline(true);
    try {
      const res = await fetch("/api/transactions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount: amountNum,
          type: "expense",
          description: inlineDesc.trim(),
          category_id: inlineCategoryId || (inlineAiSuggestion ? inlineAiSuggestion.id : 6), // 6: Food default
          date: targetDate,
          is_recurring: false,
          ai_suggested_category: inlineAiSuggestion ? inlineAiSuggestion.id : null,
        }),
      });

      if (res.ok) {
        const spentVal = amountNum.toLocaleString("vi-VN");
        const categoryName = inlineAiSuggestion ? inlineAiSuggestion.name : "Chi tiêu";
        setInlineAmount("");
        setInlineDesc("");
        setInlineCategoryId("");
        setInlineAiSuggestion(null);
        fetchData();
        toast.success(
          "Ghi nhận chi tiêu thành công!",
          `Đã ghi nhận ${spentVal} đ cho "${inlineDesc}" [${categoryName}].`
        );
      } else {
        toast.error("Lỗi ghi nhận", "Không thể lưu khoản chi tiêu vào cơ sở dữ liệu.");
      }
    } catch (err) {
      console.error("Inline save error:", err);
      toast.error("Lỗi kết nối", "Đã có sự cố khi lưu giao dịch.");
    } finally {
      setIsSubmittingInline(false);
    }
  };

  // Quick Preset Helper for Inline Input
  const handleQuickPreset = (amount: number, desc: string, catId: number) => {
    setInlineAmount(formatCurrencyInput(amount));
    setInlineDesc(desc);
    setInlineCategoryId(catId);
  };

  // Lưu Cài Đặt Dòng Tiền: Mức lương, ngày nhận lương, mục tiêu tiết kiệm và các khoản chi cố định
  const handleSaveFinancialSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    const val = parseCurrencyInput(newAllowanceInput);
    if (!val || val <= 0) {
      toast.warning("Số tiền không hợp lệ", "Vui lòng nhập số tiền trợ cấp/lương lớn hơn 0 đ.");
      return;
    }
    const goalVal = parseCurrencyInput(settingsSavingsGoalInput) || 0;

    try {
      setMonthlyAllowance(val);
      setMonthlySavingsGoal(goalVal);
      setSalaryPayDay(settingsSalaryPayDay);
      setFixedBills(settingsFixedBills);

      // Lưu trữ cục bộ vĩnh viễn (localStorage)
      localStorage.setItem(
        "campuscoin_financial_settings",
        JSON.stringify({
          salaryPayDay: settingsSalaryPayDay,
          fixedBills: settingsFixedBills,
        })
      );

      // Đồng bộ mức quỹ, mục tiêu tiết kiệm, ngày nhận lương & chi phí cố định lên PostgreSQL qua API
      const res = await fetch("/api/user/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          monthly_allowance_baseline: val,
          monthly_savings_goal: goalVal,
          salary_pay_day: settingsSalaryPayDay,
          fixed_bills: settingsFixedBills,
        }),
      });

      if (res.ok) {
        setIsAllowanceModalOpen(false);
        fetchData();
        toast.success(
          "Lưu cài đặt dòng tiền thành công",
          `Quỹ tháng (${val.toLocaleString("vi-VN")} đ), mục tiêu tiết kiệm (${goalVal.toLocaleString("vi-VN")} đ) và ${settingsFixedBills.length} khoản chi cố định đã được lưu vào cơ sở dữ liệu.`
        );
      } else {
        toast.error("Lỗi cập nhật", "Không thể lưu cài đặt lên máy chủ.");
      }
    } catch (err) {
      console.error("Update allowance error:", err);
      toast.error("Lỗi kết nối", "Không thể liên lạc với máy chủ.");
    }
  };

  // Nút hành động 1-chạm: Xác nhận đã trả khoản chi cố định
  const handlePayFixedBill = async (bill: FixedBill) => {
    try {
      const dueDayPadded = String(Math.min(30, Math.max(1, bill.dueDay))).padStart(2, "0");
      const billDate = `${selectedMonth}-${dueDayPadded}T09:00:00.000Z`;

      // Đảm bảo category_id luôn thuộc nhóm Chi phí (expense >= 6), không bao giờ rơi vào nhóm Thu nhập (1 - 5)
      let targetCatId = Number(bill.category_id);
      if (!targetCatId || targetCatId <= 5) {
        const lower = (bill.name || "").toLowerCase();
        if (lower.includes("trọ") || lower.includes("ktx") || lower.includes("ký túc") || lower.includes("phòng") || lower.includes("điện") || lower.includes("nước") || lower.includes("wifi")) {
          targetCatId = 8; // Tiền trọ / KTX
        } else if (lower.includes("4g") || lower.includes("net") || lower.includes("cước") || lower.includes("sim") || lower.includes("antigravity") || lower.includes("dịch vụ")) {
          targetCatId = 10; // Dịch vụ số
        } else if (lower.includes("học") || lower.includes("sách")) {
          targetCatId = 9; // Học tập
        } else if (lower.includes("xe") || lower.includes("xăng")) {
          targetCatId = 7; // Đi lại
        } else if (lower.includes("ăn") || lower.includes("cơm")) {
          targetCatId = 6; // Ăn uống
        } else {
          targetCatId = 12; // Chi tiêu khác
        }
      }

      const res = await fetch("/api/transactions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount: bill.amount,
          type: "expense",
          description: bill.name,
          category_id: targetCatId,
          date: billDate,
          is_recurring: true,
          recurrence_period: "monthly",
        }),
      });

      const data = await res.json();
      if (res.ok && data.transaction) {
        toast.success(
          "Đã ghi nhận thanh toán!",
          `Đã thanh toán "${bill.name}" (${bill.amount.toLocaleString("vi-VN")} đ) vào sổ chi tiêu ${displayMonthLabel}.`
        );
        fetchData();
      } else {
        toast.error("Lỗi", data.error || "Không thể lưu giao dịch.");
      }
    } catch (err) {
      console.error("Pay fixed bill error:", err);
      toast.error("Lỗi", "Không thể hoàn thành thao tác.");
    }
  };

  // Thêm khoản chi cố định mới trong modal settings
  const handleAddNewFixedBill = () => {
    if (!newBillName.trim()) {
      toast.warning("Thiếu tên khoản chi", "Vui lòng nhập tên chi phí cố định (ví dụ: Tiền phòng trọ, Tiền mạng).");
      return;
    }
    const amt = parseCurrencyInput(newBillAmount);
    if (!amt || amt <= 0) {
      toast.warning("Số tiền không hợp lệ", "Vui lòng nhập số tiền chi phí lớn hơn 0 đ.");
      return;
    }

    let detectedCatId = Number(newBillCatId);
    if (!detectedCatId || detectedCatId <= 5) {
      const lower = newBillName.toLowerCase();
      if (lower.includes("trọ") || lower.includes("ktx") || lower.includes("ký túc") || lower.includes("phòng") || lower.includes("nhà") || lower.includes("điện") || lower.includes("nước") || lower.includes("wifi")) {
        detectedCatId = 8;
      } else if (lower.includes("4g") || lower.includes("net") || lower.includes("cước") || lower.includes("sim") || lower.includes("antigravity") || lower.includes("dịch vụ")) {
        detectedCatId = 10;
      } else if (lower.includes("học") || lower.includes("sách")) {
        detectedCatId = 9;
      } else if (lower.includes("xe") || lower.includes("xăng")) {
        detectedCatId = 7;
      } else if (lower.includes("ăn")) {
        detectedCatId = 6;
      } else {
        detectedCatId = 12;
      }
    }

    const newBill: FixedBill = {
      id: `bill-${Date.now()}`,
      name: newBillName.trim(),
      amount: amt,
      dueDay: Number(newBillDueDay) || 5,
      category_id: detectedCatId,
    };

    setSettingsFixedBills((prev) => [...prev, newBill]);
    setNewBillName("");
    setNewBillAmount("");
    toast.success("Đã thêm khoản chi", `Đã thêm "${newBill.name}" vào danh sách.`);
  };

  const handleRemoveFixedBill = (id: string) => {
    setSettingsFixedBills((prev) => prev.filter((b) => b.id !== id));
    if (editingBillId === id) setEditingBillId(null);
  };

  // Khởi động chế độ sửa cho khoản chi
  const handleStartEditBill = (bill: FixedBill) => {
    setEditingBillId(bill.id);
    setEditBillName(bill.name);
    setEditBillAmount(formatCurrencyInput(bill.amount));
    setEditBillDueDay(bill.dueDay);
    setEditBillCatId(bill.category_id && bill.category_id >= 6 ? bill.category_id : 8);
  };

  // Lưu nội dung vừa sửa
  const handleSaveEditBill = (id: string) => {
    if (!editBillName.trim()) {
      toast.warning("Thiếu tên khoản chi", "Vui lòng nhập tên khoản chi.");
      return;
    }
    const amt = parseCurrencyInput(editBillAmount);
    if (!amt || amt <= 0) {
      toast.warning("Số tiền không hợp lệ", "Vui lòng nhập số tiền lớn hơn 0 đ.");
      return;
    }

    setSettingsFixedBills((prev) =>
      prev.map((b) =>
        b.id === id
          ? {
              ...b,
              name: editBillName.trim(),
              amount: amt,
              dueDay: editBillDueDay,
              category_id: Number(editBillCatId) && Number(editBillCatId) >= 6 ? Number(editBillCatId) : 8,
            }
          : b
      )
    );
    setEditingBillId(null);
    toast.success("Đã cập nhật", `Đã cập nhật thông tin khoản "${editBillName.trim()}".`);
  };

  const handleCancelEditBill = () => {
    setEditingBillId(null);
  };

  // Lưu Mục Tiêu Tiết Kiệm vào CSDL (PostgreSQL qua API /api/user/profile)
  const handleSaveSavingsGoal = async (e: React.FormEvent) => {
    e.preventDefault();
    const val = parseCurrencyInput(editSavingsGoalInput);
    if (isNaN(val) || val < 0) {
      toast.warning("Mục tiêu không hợp lệ", "Vui lòng nhập số tiền mục tiêu tiết kiệm hợp lệ.");
      return;
    }

    setIsSavingGoalLoading(true);
    try {
      const res = await fetch("/api/user/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ monthly_savings_goal: val }),
      });

      if (res.ok) {
        setMonthlySavingsGoal(val);
        setIsEditingGoal(false);
        toast.success(
          "Cập nhật mục tiêu thành công!",
          `Mục tiêu tiết kiệm tháng đã được đặt thành ${val.toLocaleString("vi-VN")} đ.`
        );
      } else {
        toast.error("Lỗi", "Không thể lưu mục tiêu tiết kiệm lên máy chủ.");
      }
    } catch (err) {
      console.error("Save savings goal error:", err);
      toast.error("Lỗi kết nối", "Vui lòng thử lại sau.");
    } finally {
      setIsSavingGoalLoading(false);
    }
  };

  // Handle Save Transaction via Modal
  const handleSaveTransaction = async (e: React.FormEvent) => {
    e.preventDefault();
    const amountNum = parseCurrencyInput(txAmount);
    if (!amountNum || amountNum <= 0) {
      toast.warning("Chưa nhập số tiền", "Vui lòng nhập số tiền hợp lệ lớn hơn 0 đ.");
      return;
    }
    if (!txDesc.trim()) {
      toast.warning("Chưa nhập nội dung", "Vui lòng nhập mô tả cho khoản giao dịch.");
      return;
    }

    // SRS 3.12: Phát hiện giao dịch bất thường (>40% quỹ lương nếu là chi tiêu)
    if (txType === "expense" && amountNum >= monthlyAllowance * 0.4) {
      const confirmLarge = await confirm({
        title: "Cảnh báo chi phí bất thường",
        message: `Khoản chi này có số tiền ${amountNum.toLocaleString("vi-VN")} đ, chiếm hơn 40% tổng quỹ lương tháng (${monthlyAllowance.toLocaleString("vi-VN")} đ). Bạn có chắc chắn muốn ghi nhận không?`,
        confirmText: "Vẫn ghi nhận",
        cancelText: "Kiểm tra lại",
        isDestructive: false,
      });
      if (!confirmLarge) return;
    }

    // SRS 3.12: Phát hiện giao dịch trùng lặp
    const txTargetDate = txDate || getTodayDateString();
    const isDuplicate = transactions.some((t) => {
      const txDay = t.date.split("T")[0];
      const isSameDate = txDay === txTargetDate;
      const isSameType = t.type === txType;
      const isSameDesc = t.description.trim().toLowerCase() === txDesc.trim().toLowerCase();
      const isSameAmount = Math.abs(Number(t.amount) - amountNum) < 1;
      return isSameDate && isSameType && isSameDesc && isSameAmount;
    });

    if (isDuplicate) {
      const confirmDup = await confirm({
        title: "Cảnh báo trùng lặp giao dịch",
        message: `Đã có một khoản "${txDesc.trim()}" (${amountNum.toLocaleString("vi-VN")} đ) ghi nhận ngày ${txTargetDate}. Bạn có muốn thêm tiếp không?`,
        confirmText: "Vẫn thêm",
        cancelText: "Hủy bỏ",
        isDestructive: false,
      });
      if (!confirmDup) return;
    }

    try {
      const res = await fetch("/api/transactions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount: amountNum,
          type: txType,
          description: txDesc,
          category_id: txCategoryId || (aiSuggestion ? aiSuggestion.id : 1),
          date: txTargetDate,
          is_recurring: txRecurring,
          ai_suggested_category: aiSuggestion ? aiSuggestion.id : null,
        }),
      });

      if (res.ok) {
        setIsAddModalOpen(false);
        setTxAmount("");
        setTxDesc("");
        setTxCategoryId("");
        setAiSuggestion(null);
        fetchData();
        toast.success(
          txType === "income" ? "Ghi nhận thu nhập thành công" : "Ghi nhận chi tiêu thành công",
          `${amountNum.toLocaleString("vi-VN")} đ đã được cập nhật vào sổ chi tiêu.`
        );
      } else {
        toast.error("Lỗi lưu giao dịch", "Không thể ghi nhận dữ liệu vào cơ sở dữ liệu.");
      }
    } catch (err) {
      console.error("Save tx error:", err);
      toast.error("Lỗi kết nối", "Đã xảy ra sự cố khi lưu giao dịch.");
    }
  };

  // Handle Delete Transaction
  const handleDeleteTransaction = async (id: string) => {
    const ok = await confirm({
      title: "Xóa bản ghi giao dịch",
      message: "Bạn có chắc chắn muốn xóa bản ghi này? Lịch sử kiểm toán vẫn được hệ thống lưu vết theo quy định.",
      confirmText: "Xóa giao dịch",
      cancelText: "Hủy bỏ",
      isDestructive: true,
    });
    if (!ok) return;

    try {
      const res = await fetch(`/api/transactions/${id}`, { method: "DELETE" });
      if (res.ok) {
        fetchData();
        toast.success("Đã xóa giao dịch", "Bản ghi đã được xóa khỏi sổ chi tiêu thành công.");
      } else {
        toast.error("Lỗi xóa giao dịch", "Không thể xóa bản ghi vào lúc này.");
      }
    } catch (err) {
      console.error("Delete tx error:", err);
      toast.error("Lỗi kết nối", "Đã xảy ra sự cố khi xóa giao dịch.");
    }
  };

  // Handle Save Budget
  const handleSaveBudget = async (e: React.FormEvent) => {
    e.preventDefault();
    const limitNum = parseCurrencyInput(budgetLimit);
    if (!limitNum || limitNum <= 0) {
      toast.warning("Hạn mức chưa hợp lệ", "Vui lòng nhập số tiền hạn mức lớn hơn 0 đ.");
      return;
    }

    try {
      const res = await fetch("/api/budgets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          category_id: budgetCatId,
          month: selectedMonth,
          limit_amount: limitNum,
        }),
      });
      if (res.ok) {
        setIsBudgetModalOpen(false);
        fetchData();
        toast.success("Cài đặt ngân sách thành công", "Hệ thống sẽ canh gác và cảnh báo khi bạn chạm ngưỡng chi tiêu này.");
      } else {
        toast.error("Lỗi lưu ngân sách", "Không thể thiết lập hạn mức.");
      }
    } catch (err) {
      console.error("Save budget error:", err);
      toast.error("Lỗi kết nối", "Đã xảy ra sự cố khi lưu hạn mức ngân sách.");
    }
  };

  // Export PDF Report (SRS 3.6 & 3.10)
  const handleExportPDF = () => {
    const doc = new jsPDF();
    doc.setFont("helvetica", "bold");
    doc.setFontSize(18);
    doc.text("CAMPUS COIN - STUDENT FINANCIAL REPORT", 14, 20);

    doc.setFontSize(11);
    doc.setFont("helvetica", "normal");
    doc.text(`Student: ${studentName}`, 14, 28);
    doc.text(`Allowance: ${monthlyAllowance.toLocaleString("vi-VN")} VND / Month (Day 5 Cycle)`, 14, 34);
    doc.text(`Generated on: ${new Date().toLocaleDateString("vi-VN")}`, 14, 40);

    doc.line(14, 44, 196, 44);

    doc.setFontSize(12);
    doc.setFont("helvetica", "bold");
    doc.text("1. SUMMARY METRICS", 14, 52);
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.text(`- Monthly Allowance (Day 5 Inflow): ${monthlyAllowance.toLocaleString("vi-VN")} VND`, 16, 60);
    doc.text(`- Total Expenses: ${totalExpense.toLocaleString("vi-VN")} VND`, 16, 66);
    doc.text(`- Remaining Balance: ${remainingAllowance.toLocaleString("vi-VN")} VND`, 16, 72);

    doc.setFontSize(12);
    doc.setFont("helvetica", "bold");
    doc.text("2. AI SPENDING INSIGHTS", 14, 84);
    doc.setFontSize(9);
    doc.setFont("helvetica", "normal");
    const splitInsight = doc.splitTextToSize(aiInsight || "No insights recorded for this period.", 180);
    doc.text(splitInsight, 16, 92);

    doc.setFontSize(12);
    doc.setFont("helvetica", "bold");
    doc.text("3. RECENT TRANSACTIONS", 14, 120);

    let y = 128;
    transactions.slice(0, 10).forEach((tx, idx) => {
      doc.setFontSize(9);
      doc.setFont("helvetica", "normal");
      const sign = tx.type === "income" ? "+" : "-";
      doc.text(
        `${idx + 1}. [${new Date(tx.date).toLocaleDateString("vi-VN")}] ${tx.description} (${tx.category.name}): ${sign}${Number(tx.amount).toLocaleString("vi-VN")} VND`,
        16,
        y
      );
      y += 7;
    });

    doc.save(`CampusCoin_Report_${selectedMonth}.pdf`);
  };

  // Logout
  const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
  };

  // ================= CALCULATIONS (DAY 5 STUDENT CYCLE) =================
  const totalExpense = useMemo(() => {
    return transactions
      .filter((t) => t.type === "expense")
      .reduce((acc, t) => acc + Number(t.amount), 0);
  }, [transactions]);

  // Số dư còn lại từ quỹ 8 triệu
  const remainingAllowance = useMemo(() => {
    return Math.max(0, monthlyAllowance - totalExpense);
  }, [monthlyAllowance, totalExpense]);

  // % Quỹ đã tiêu
  const spentPercent = useMemo(() => {
    if (monthlyAllowance <= 0) return 0;
    return Math.min(100, Math.round((totalExpense / monthlyAllowance) * 100));
  }, [totalExpense, monthlyAllowance]);

  // Tiến độ mục tiêu tiết kiệm thực tế (Savings Goal Progress)
  const savingsGoalProgress = useMemo(() => {
    if (monthlySavingsGoal <= 0) return 100;
    return Math.round((remainingAllowance / monthlySavingsGoal) * 100);
  }, [remainingAllowance, monthlySavingsGoal]);

  // Kiểm tra trạng thái đã thanh toán của từng khoản chi phí cố định trong tháng đang xem
  const fixedBillsStatus = useMemo(() => {
    return fixedBills.map((bill) => {
      const isPaid = transactions.some((tx) => {
        if (tx.type !== "expense") return false;
        const descMatch =
          tx.description.toLowerCase().includes(bill.name.toLowerCase()) ||
          bill.name.toLowerCase().includes(tx.description.toLowerCase());
        const catMatch =
          tx.category_id === bill.category_id &&
          Math.abs(Number(tx.amount) - bill.amount) < 1000;
        return descMatch || catMatch;
      });

      return {
        ...bill,
        isPaid,
      };
    });
  }, [fixedBills, transactions]);

  // Tổng các khoản chi cố định tháng
  const totalFixedBills = useMemo(() => {
    return fixedBills.reduce((acc, b) => acc + b.amount, 0);
  }, [fixedBills]);

  // Số tiền cố định đã thanh toán trong tháng
  const paidFixedAmount = useMemo(() => {
    return fixedBillsStatus.filter((b) => b.isPaid).reduce((acc, b) => acc + b.amount, 0);
  }, [fixedBillsStatus]);

  // Ngân sách sinh hoạt linh hoạt thực tế (Quỹ tháng - Khoản chi cố định - MỤC TIÊU TIẾT KIỆM)
  const flexibleAllowance = useMemo(() => {
    return Math.max(0, monthlyAllowance - totalFixedBills - monthlySavingsGoal);
  }, [monthlyAllowance, totalFixedBills, monthlySavingsGoal]);

  // Số tiền chi tiêu sinh hoạt đã tiêu (không tính các khoản cố định đã thanh toán)
  const variableSpent = useMemo(() => {
    return Math.max(0, totalExpense - paidFixedAmount);
  }, [totalExpense, paidFixedAmount]);

  // Số dư sinh hoạt linh hoạt còn lại (để chi tiêu các ngày tới mà không phạm vào tiền tiết kiệm)
  const variableRemaining = useMemo(() => {
    return Math.max(0, flexibleAllowance - variableSpent);
  }, [flexibleAllowance, variableSpent]);

  // Số ngày chuẩn xác của kỳ tháng đang xem (30, 31 hoặc 28/29 ngày theo lịch thực tế)
  const daysInMonth = useMemo(() => {
    const [y, m] = selectedMonth.split("-").map(Number);
    return new Date(y, m, 0).getDate();
  }, [selectedMonth]);

  // Ngày hiện tại trong tháng
  const currentDayNum = useMemo(() => {
    const now = new Date();
    const [y, m] = selectedMonth.split("-").map(Number);
    if (now.getFullYear() === y && now.getMonth() + 1 === m) {
      return now.getDate();
    }
    return 1;
  }, [selectedMonth]);

  const daysRemaining = Math.max(1, daysInMonth - currentDayNum + 1);

  // Hạn mức chuẩn mỗi ngày trong cả kỳ tháng (Chia đều 30 hoặc 31 ngày để bảo toàn mục tiêu tiết kiệm)
  // Ví dụ: Còn 1.040.000 đ chi tiêu linh hoạt / 30 ngày = ~34.667 đ/ngày (chuẩn 33k-34k)
  const dailyStandardLimit = useMemo(() => {
    if (flexibleAllowance <= 0) return 0;
    return Math.round(flexibleAllowance / daysInMonth);
  }, [flexibleAllowance, daysInMonth]);

  // Hạn mức an toàn hàng ngày chuẩn mà sinh viên cần bám sát mỗi ngày
  const dailySafeLimit = dailyStandardLimit;

  // Lọc các giao dịch của ngày hôm nay (Today Transactions)
  const todayTransactions = useMemo(() => {
    const todayStr = getTodayDateString();
    return transactions.filter((t) => {
      const txDay = t.date.split("T")[0];
      return txDay === todayStr;
    });
  }, [transactions]);

  // Tổng tiền hôm nay đã tiêu
  const todaySpent = useMemo(() => {
    return todayTransactions
      .filter((t) => t.type === "expense")
      .reduce((acc, t) => acc + Number(t.amount), 0);
  }, [todayTransactions]);

  // Tiền an toàn còn lại có thể tiêu trong ngày hôm nay
  const todaySafeRemaining = dailySafeLimit - todaySpent;

  // Toàn bộ giao dịch có tìm kiếm & lọc danh mục
  const filteredTransactions = useMemo(() => {
    return transactions.filter((tx) => {
      const matchSearch = tx.description.toLowerCase().includes(searchQuery.toLowerCase());
      const matchCategory = categoryFilter === "all" || String(tx.category_id) === categoryFilter;
      return matchSearch && matchCategory;
    });
  }, [transactions, searchQuery, categoryFilter]);

  // Danh sách giao dịch của tab đang chọn ("today" hoặc "all")
  const activeLedgerList = useMemo(() => {
    return activeLedgerTab === "today" ? todayTransactions : filteredTransactions;
  }, [activeLedgerTab, todayTransactions, filteredTransactions]);

  const totalPages = Math.max(1, Math.ceil(activeLedgerList.length / itemsPerPage));

  // Giao dịch hiển thị ở trang hiện tại
  const paginatedTransactions = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return activeLedgerList.slice(startIndex, startIndex + itemsPerPage);
  }, [activeLedgerList, currentPage, itemsPerPage]);

  // Điều chỉnh lại trang nếu trang hiện tại vượt quá totalPages khi lọc/xóa
  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages]);

  const displayMonthNumber = Number(selectedMonth.split("-")[1]);
  const displayYearNumber = selectedMonth.split("-")[0];
  const displayMonthLabel = `Tháng ${displayMonthNumber}/${displayYearNumber}`;

  // Xác định tháng hiện tại theo thời gian thực
  const currentMonthKey = useMemo(() => {
    const now = new Date();
    const y = now.getFullYear();
    const m = String(now.getMonth() + 1).padStart(2, "0");
    return `${y}-${m}`;
  }, []);

  const isCurrentMonth = selectedMonth === currentMonthKey;

  // Danh sách các kỳ tháng tự động tính toán động (Dynamic Month Options)
  const availableMonths = useMemo(() => {
    const monthsSet = new Set<string>();
    // Luôn có kỳ tháng hiện tại
    monthsSet.add(currentMonthKey);

    // Chỉ hiển thị các kỳ tháng thực tế mà tài khoản này có phát sinh giao dịch trong CSDL
    transactions.forEach((tx) => {
      if (tx.date) {
        const d = new Date(tx.date);
        if (!isNaN(d.getTime())) {
          const mKey = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
          monthsSet.add(mKey);
        }
      }
    });

    return Array.from(monthsSet)
      .sort()
      .reverse()
      .map((mKey) => {
        const [year, month] = mKey.split("-");
        const isCurrent = mKey === currentMonthKey;
        return {
          value: mKey,
          label: isCurrent ? `Kỳ Tháng ${month}/${year} (Hiện tại)` : `Kỳ Tháng ${month}/${year}`,
          isCurrent,
        };
      });
  }, [currentMonthKey, transactions]);

  // Chart Data: 6-Month Comparison (SRS 3.6 - Database-driven)
  const chartData = useMemo(() => {
    if (sixMonthsData && sixMonthsData.length > 0) {
      return sixMonthsData.map((item) => {
        const isCurrent = item.monthKey === selectedMonth;
        const thuVal = item.Thu > 0 ? item.Thu : (isCurrent ? Math.round(monthlyAllowance / 1000) : 0);
        return {
          month: item.month,
          Thu: thuVal,
          Chi: item.Chi,
        };
      });
    }

    const [selY, selM] = selectedMonth.split("-").map(Number);
    const result = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date(Date.UTC(selY, selM - 1 - i, 1));
      const m = d.getUTCMonth() + 1;
      const isCur = i === 0;
      result.push({
        month: `T${String(m).padStart(2, "0")}`,
        Thu: isCur ? Math.round(monthlyAllowance / 1000) : 0,
        Chi: isCur ? Math.round(totalExpense / 1000) : 0,
      });
    }
    return result;
  }, [sixMonthsData, selectedMonth, monthlyAllowance, totalExpense]);

  if (!mounted) return null;

  return (
    <div className="min-h-screen flex flex-col bg-white dark:bg-[#010102] text-[#0f1011] dark:text-[#f7f8f8] transition-colors">
      <Navbar />

      <main className="flex-1 max-w-[1280px] w-full mx-auto px-4 sm:px-6 py-6 space-y-6">
        {/* ================= WORKSPACE TOP BAR ================= */}
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 pb-4 border-b border-[#e2e8f0] dark:border-[#23252a]">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[12px] font-medium uppercase tracking-eyebrow text-[#64748b] dark:text-[#62666d]">
                Smart Spending Student Style
              </span>
              <span className="text-[10px] px-2 py-0.5 rounded-[4px] bg-[#eef2ff] dark:bg-[#141516] text-[#5e6ad2] font-semibold border border-[#c7d2fe] dark:border-[#23252a] flex items-center gap-1">
                <Clock className="w-3 h-3 text-[#5e6ad2]" /> Đang xem: {displayMonthLabel} • Lương ngày {salaryPayDay}
              </span>
            </div>
            <h1 className="text-2xl font-semibold tracking-headline text-[#0f1011] dark:text-[#f7f8f8] mt-1 flex items-center gap-2">
              Sổ Chi Tiêu Sinh Viên • {studentName}
            </h1>
          </div>

          {/* Action CTAs */}
          <div className="flex flex-wrap items-center gap-2">
            {/* Bộ Chọn Kỳ Tháng (Dynamic Month Selector) */}
            <div className="relative">
              <select
                value={selectedMonth}
                onChange={(e) => {
                  const newM = e.target.value;
                  setSelectedMonth(newM);
                  setCurrentPage(1);
                  if (newM !== currentMonthKey) {
                    setActiveLedgerTab("all");
                  }
                }}
                className="pl-8 pr-7 py-2 rounded-[8px] bg-white dark:bg-[#0f1011] hover:bg-[#f8f9fa] dark:hover:bg-[#141516] text-[#0f1011] dark:text-[#f7f8f8] border border-[#5e6ad2]/60 dark:border-[#5e6ad2]/70 text-[13px] font-semibold focus:outline-none focus:ring-2 focus:ring-[#5e6ad2] cursor-pointer shadow-xs appearance-none"
                title="Chọn kỳ tháng xem chi tiêu"
              >
                {availableMonths.map((m) => (
                  <option key={m.value} value={m.value}>
                    {m.label}
                  </option>
                ))}
              </select>
              <Calendar className="w-4 h-4 text-[#5e6ad2] absolute left-2.5 top-2.5 pointer-events-none" />
              <ChevronRight className="w-3.5 h-3.5 text-[#64748b] dark:text-[#8a8f98] rotate-90 absolute right-2.5 top-3 pointer-events-none" />
            </div>

            <button
              onClick={() => {
                setSettingsSalaryPayDay(salaryPayDay);
                setSettingsFixedBills([...fixedBills]);
                setNewAllowanceInput(formatCurrencyInput(monthlyAllowance));
                setSettingsSavingsGoalInput(formatCurrencyInput(monthlySavingsGoal));
                setIsAllowanceModalOpen(true);
              }}
              className="px-3.5 py-2 rounded-[8px] bg-white dark:bg-[#0f1011] hover:bg-[#f8f9fa] dark:hover:bg-[#141516] text-[#0f1011] dark:text-[#f7f8f8] border border-[#e2e8f0] dark:border-[#23252a] text-[13px] font-medium flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs"
              title="Cài đặt dòng tiền, ngày nhận lương, mục tiêu tiết kiệm và các khoản chi cố định"
            >
              <Wallet className="w-4 h-4 text-[#5e6ad2]" />
              <span>Quỹ Lương: <strong>{monthlyAllowance.toLocaleString("vi-VN")} đ</strong> (Ngày {salaryPayDay})</span>
              <Settings className="w-3.5 h-3.5 text-[#5e6ad2] ml-0.5" />
            </button>

            <button
              onClick={handleExportPDF}
              title="Xuất báo cáo PDF (SRS 3.6)"
              className="px-2.5 py-2 rounded-[8px] bg-white dark:bg-[#0f1011] hover:bg-[#f8f9fa] dark:hover:bg-[#141516] text-[#475569] dark:text-[#8a8f98] hover:text-[#0f1011] dark:hover:text-[#f7f8f8] border border-[#e2e8f0] dark:border-[#23252a] text-[13px] flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <Download className="w-4 h-4 text-[#8a8f98]" />
              <span className="hidden sm:inline">Xuất PDF</span>
            </button>

            <button
              onClick={handleLogout}
              title="Đăng xuất"
              className="p-2 rounded-[8px] bg-white dark:bg-[#0f1011] hover:bg-[#f8f9fa] dark:hover:bg-[#141516] text-[#64748b] dark:text-[#8a8f98] hover:text-[#e11d48] border border-[#e2e8f0] dark:border-[#23252a] transition-colors cursor-pointer"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* ================= HERO TILES: 5 CHỈ SỐ TÀI CHÍNH CỐT LÕI (QUỸ, ĐÃ CHI, SỐ DƯ, MỤC TIÊU, HẠN MỨC) ================= */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-5 gap-3">
          {/* Tile 1: Quỹ Lương Ngày Nhận */}
          <div className="p-3.5 rounded-[12px] bg-white dark:bg-[#0f1011] border border-[#e2e8f0] dark:border-[#23252a] flex flex-col justify-between shadow-xs">
            <div>
              <div className="flex items-center justify-between text-[#64748b] dark:text-[#8a8f98] text-[12px]">
                <span className="flex items-center gap-1.5 font-medium shrink-0">
                  <Wallet className="w-3.5 h-3.5 text-[#5e6ad2] shrink-0" /> Quỹ Tháng {displayMonthNumber}
                </span>
                <button
                  type="button"
                  onClick={() => {
                    setSettingsSalaryPayDay(salaryPayDay);
                    setSettingsFixedBills([...fixedBills]);
                    setNewAllowanceInput(formatCurrencyInput(monthlyAllowance));
                    setSettingsSavingsGoalInput(formatCurrencyInput(monthlySavingsGoal));
                    setIsAllowanceModalOpen(true);
                  }}
                  className="text-[11px] text-[#5e6ad2] hover:underline cursor-pointer flex items-center gap-0.5 shrink-0"
                >
                  Cài đặt
                </button>
              </div>
              <h3 className="text-2xl font-bold tracking-tight text-[#0f1011] dark:text-[#f7f8f8] mt-1.5 truncate">
                {monthlyAllowance.toLocaleString("vi-VN")} đ
              </h3>
            </div>
            <div className="mt-3 pt-2.5 border-t border-[#f1f5f9] dark:border-[#1e2024] flex items-center justify-between text-[11px] text-[#64748b] dark:text-[#8a8f98]">
              <span>Tự nhận ngày {salaryPayDay}</span>
              <span className="text-[#27a644] font-medium flex items-center gap-1">
                <Check className="w-3 h-3" /> Đã nạp ví
              </span>
            </div>
          </div>

          {/* Tile 2: Đã Chi Tiêu Trong Tháng */}
          <div className="p-3.5 rounded-[12px] bg-white dark:bg-[#0f1011] border border-[#e2e8f0] dark:border-[#23252a] flex flex-col justify-between shadow-xs">
            <div>
              <div className="flex items-center justify-between text-[#64748b] dark:text-[#8a8f98] text-[12px]">
                <span className="flex items-center gap-1.5 font-medium shrink-0">
                  <ArrowUpRight className="w-3.5 h-3.5 text-[#e11d48] shrink-0" /> Đã tiêu tháng
                </span>
                <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-[#fef2f2] dark:bg-[#1f1315] text-[#e11d48] font-semibold border border-[#fecaca] dark:border-[#3b171c] whitespace-nowrap shrink-0">
                  {spentPercent}% quỹ
                </span>
              </div>
              <h3 className="text-2xl font-bold tracking-tight text-[#0f1011] dark:text-[#f7f8f8] mt-1.5 truncate">
                {totalExpense.toLocaleString("vi-VN")} đ
              </h3>
            </div>
            <div className="mt-3">
              <div className="w-full bg-[#e2e8f0] dark:bg-[#18191a] h-1.5 rounded-full overflow-hidden">
                <div
                  className="bg-[#e11d48] h-1.5 rounded-full transition-all"
                  style={{ width: `${spentPercent}%` }}
                />
              </div>
            </div>
          </div>

          {/* Tile 3: Số Dư Quỹ Còn Lại */}
          <div className="p-3.5 rounded-[12px] bg-white dark:bg-[#0f1011] border border-[#e2e8f0] dark:border-[#23252a] flex flex-col justify-between shadow-xs">
            <div>
              <div className="flex items-center justify-between text-[#64748b] dark:text-[#8a8f98] text-[12px]">
                <span className="flex items-center gap-1.5 font-medium shrink-0">
                  <Coins className="w-3.5 h-3.5 text-[#27a644] shrink-0" /> Số dư ví
                </span>
                <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-[#ecfdf5] dark:bg-[#141516] text-[#27a644] font-semibold border border-[#a7f3d0] dark:border-[#23252a] whitespace-nowrap shrink-0">
                  {isCurrentMonth ? `Còn ${daysRemaining} ngày` : "Đã khóa"}
                </span>
              </div>
              <h3 className="text-2xl font-bold tracking-tight text-[#27a644] mt-1.5 truncate">
                {remainingAllowance.toLocaleString("vi-VN")} đ
              </h3>
            </div>
            <p className="text-[11px] text-[#64748b] dark:text-[#8a8f98] mt-3 pt-2.5 border-t border-[#f1f5f9] dark:border-[#1e2024] truncate">
              {isCurrentMonth
                ? `Đến ngày ${String(salaryPayDay).padStart(2, "0")}/${String((displayMonthNumber % 12) + 1).padStart(2, "0")} nhận lương mới`
                : `Kỳ ${displayMonthLabel} đã khép sổ`}
            </p>
          </div>

          {/* Tile 4: Mục Tiêu Tiết Kiệm (SRS 3.1 & 3.8) */}
          <div className="p-3.5 rounded-[12px] bg-white dark:bg-[#0f1011] border border-[#e2e8f0] dark:border-[#23252a] flex flex-col justify-between shadow-xs">
            <div>
              <div className="flex items-center justify-between text-[#64748b] dark:text-[#8a8f98] text-[12px]">
                <span className="flex items-center gap-1.5 font-medium shrink-0">
                  <PiggyBank className="w-3.5 h-3.5 text-[#10b981] shrink-0" /> Mục tiêu tiết kiệm
                </span>
                <span
                  className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full border whitespace-nowrap shrink-0 ${
                    remainingAllowance >= monthlySavingsGoal
                      ? "bg-[#ecfdf5] dark:bg-[#064e3b]/30 text-[#10b981] border-[#a7f3d0] dark:border-[#047857]"
                      : remainingAllowance >= monthlySavingsGoal * 0.7
                      ? "bg-[#fffbeb] dark:bg-[#78350f]/30 text-[#d97706] border-[#fde68a] dark:border-[#b45309]"
                      : "bg-[#fef2f2] dark:bg-[#7f1d1d]/30 text-[#e11d48] border-[#fecaca] dark:border-[#991b1b]"
                  }`}
                >
                  {savingsGoalProgress}%
                </span>
              </div>
              <h3 className="text-2xl font-bold tracking-tight text-[#0f1011] dark:text-[#f7f8f8] mt-1.5 truncate">
                {monthlySavingsGoal.toLocaleString("vi-VN")} đ
              </h3>
            </div>
            <div className="mt-3">
              <div className="w-full bg-[#e2e8f0] dark:bg-[#18191a] h-1.5 rounded-full overflow-hidden">
                <div
                  className={`h-1.5 rounded-full transition-all ${
                    remainingAllowance >= monthlySavingsGoal
                      ? "bg-[#10b981]"
                      : remainingAllowance >= monthlySavingsGoal * 0.7
                      ? "bg-[#eab308]"
                      : "bg-[#e11d48]"
                  }`}
                  style={{ width: `${Math.min(100, Math.max(0, savingsGoalProgress))}%` }}
                />
              </div>
              <div className="mt-2 text-[10px] text-[#64748b] dark:text-[#8a8f98] flex items-center justify-between">
                <span>Đang giữ: <strong className="text-[#10b981]">{remainingAllowance.toLocaleString("vi-VN")} đ</strong></span>
                <button
                  type="button"
                  onClick={() => {
                    setSettingsSalaryPayDay(salaryPayDay);
                    setSettingsFixedBills([...fixedBills]);
                    setNewAllowanceInput(formatCurrencyInput(monthlyAllowance));
                    setSettingsSavingsGoalInput(formatCurrencyInput(monthlySavingsGoal));
                    setIsAllowanceModalOpen(true);
                  }}
                  className="text-[#5e6ad2] hover:underline cursor-pointer font-medium"
                >
                  Đổi mục tiêu
                </button>
              </div>
            </div>
          </div>

          {/* Tile 5: Hạn Mức An Toàn Hôm Nay (Daily Safe Allowance) */}
          <div className="p-3.5 rounded-[12px] bg-[#eff6ff] dark:bg-[#0f1424] border border-[#bfdbfe] dark:border-[#1d2b53] flex flex-col justify-between shadow-xs">
            <div>
              <div className="flex items-center justify-between text-[#1d4ed8] dark:text-[#93c5fd] text-[12px]">
                <span className="flex items-center gap-1.5 font-semibold shrink-0">
                  <ShieldCheck className="w-3.5 h-3.5 text-[#2563eb] shrink-0" /> Hạn mức hôm nay
                </span>
                <span className="text-[9.5px] font-bold px-1.5 py-0.5 rounded-full bg-white dark:bg-[#172554] text-[#1d4ed8] dark:text-[#bfdbfe] border border-[#bfdbfe] dark:border-[#1e3a8a] whitespace-nowrap shrink-0">
                  {isCurrentMonth ? (dailySafeLimit > 0 ? "Bảo vệ TK" : "Chạm quỹ") : "Lịch sử"}
                </span>
              </div>
              <h3 className="text-2xl font-bold tracking-tight text-[#1e3a8a] dark:text-[#dbeafe] mt-1.5 truncate">
                {dailySafeLimit.toLocaleString("vi-VN")} đ
              </h3>
              <p className="text-[10px] text-[#2563eb]/80 dark:text-[#93c5fd]/80 mt-0.5 truncate">
                {dailySafeLimit > 0
                  ? `Định mức ${daysInMonth} ngày • Giữ ${monthlySavingsGoal.toLocaleString("vi-VN")} đ TK`
                  : "Đã chạm mức tiết kiệm mục tiêu"}
              </p>
            </div>
            <div className="mt-3 pt-2.5 border-t border-[#dbeafe] dark:border-[#1e3a8a]/60 text-[11px] text-[#1e40af] dark:text-[#93c5fd] flex items-center justify-between gap-1">
              <span className="truncate">Đã tiêu: <strong>{todaySpent.toLocaleString("vi-VN")} đ</strong></span>
              <span className={`font-semibold shrink-0 ${todaySafeRemaining >= 0 ? "text-[#16a34a] dark:text-[#4ade80]" : "text-[#dc2626] dark:text-[#f87171]"}`}>
                {todaySafeRemaining >= 0 ? `Còn: +${todaySafeRemaining.toLocaleString("vi-VN")} đ` : `Vượt ${Math.abs(todaySafeRemaining).toLocaleString("vi-VN")} đ`}
              </span>
            </div>
          </div>
        </div>

        {/* ================= 📌 WIDGET: CHI PHÍ CỐ ĐỊNH THÁNG (TIỀN TRỌ, 4G, ĐIỆN NƯỚC) ================= */}
        <div className="p-4 sm:p-5 rounded-[12px] bg-white dark:bg-[#0f1011] border border-[#e2e8f0] dark:border-[#23252a] shadow-xs space-y-3.5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-[#f1f5f9] dark:border-[#1e2024]">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-[8px] bg-[#eff6ff] dark:bg-[#172554] text-[#2563eb] flex items-center justify-center shrink-0">
                <Receipt className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-[14px] font-semibold text-[#0f1011] dark:text-[#f7f8f8] flex items-center gap-2">
                  Chi Phí Cố Định Hàng Tháng ({displayMonthLabel})
                  <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-[#f1f5f9] dark:bg-[#18191a] text-[#475569] dark:text-[#94a3b8] border border-[#cbd5e1] dark:border-[#23252a]">
                    {fixedBillsStatus.filter((b) => b.isPaid).length}/{fixedBills.length} khoản đã trả
                  </span>
                </h3>
                <p className="text-[11px] text-[#64748b] dark:text-[#8a8f98]">
                  Tiền trọ, điện nước, gói cước tháng nào cũng phải đóng — bấm xác nhận để trừ vào quỹ và tính hạn mức ăn uống chính xác.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 self-start sm:self-auto shrink-0">
              <span className="text-[12px] text-[#64748b] dark:text-[#8a8f98]">
                Tổng cố định: <strong className="text-[#0f1011] dark:text-[#f7f8f8]">{totalFixedBills.toLocaleString("vi-VN")} đ</strong>
              </span>
              <button
                type="button"
                onClick={() => {
                  setSettingsSalaryPayDay(salaryPayDay);
                  setSettingsFixedBills([...fixedBills]);
                  setNewAllowanceInput(formatCurrencyInput(monthlyAllowance));
                  setSettingsSavingsGoalInput(formatCurrencyInput(monthlySavingsGoal));
                  setIsAllowanceModalOpen(true);
                }}
                className="px-2.5 py-1.5 rounded-[6px] bg-[#f8fafc] dark:bg-[#141516] hover:bg-[#eef2ff] dark:hover:bg-[#1a1c2e] text-[#5e6ad2] text-[11px] font-medium border border-[#cbd5e1] dark:border-[#23252a] flex items-center gap-1 cursor-pointer transition-colors"
                title="Cài đặt danh sách chi phí cố định và ngày nhận lương"
              >
                <Settings className="w-3 h-3" />
                Cài đặt chi phí
              </button>
            </div>
          </div>

          {/* Danh sách thẻ khoản cố định */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2.5">
            {fixedBillsStatus.map((bill) => (
              <div
                key={bill.id}
                className={`p-3 rounded-[10px] border transition-all flex flex-col justify-between ${
                  bill.isPaid
                    ? "bg-[#f0fdf4] dark:bg-[#0d1f14] border-[#bbf7d0] dark:border-[#14532d]/40"
                    : "bg-[#f8fafc] dark:bg-[#141516] border-[#e2e8f0] dark:border-[#23252a]"
                }`}
              >
                <div>
                  <div className="flex items-center justify-between gap-1 text-[11px] text-[#64748b] dark:text-[#8a8f98]">
                    <span className="flex items-center gap-1 font-medium truncate">
                      {bill.name.includes("trọ") || bill.name.includes("Ký túc") ? (
                        <Home className="w-3.5 h-3.5 text-[#5e6ad2] shrink-0" />
                      ) : bill.name.includes("Điện") || bill.name.includes("nước") ? (
                        <Zap className="w-3.5 h-3.5 text-[#eab308] shrink-0" />
                      ) : (
                        <CreditCard className="w-3.5 h-3.5 text-[#ec4899] shrink-0" />
                      )}
                      <span className="truncate">{bill.name}</span>
                    </span>
                    <span className="text-[10px] text-[#94a3b8] shrink-0">Hạn ngày {bill.dueDay}</span>
                  </div>
                  <div className="text-[15px] font-bold text-[#0f1011] dark:text-[#f7f8f8] mt-1">
                    {bill.amount.toLocaleString("vi-VN")} đ
                  </div>
                </div>

                <div className="mt-2.5 pt-2 border-t border-[#e2e8f0]/60 dark:border-[#23252a] flex items-center justify-between">
                  {bill.isPaid ? (
                    <span className="text-[11px] font-semibold text-[#16a34a] dark:text-[#4ade80] flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5" /> Đã đóng
                    </span>
                  ) : (
                    <button
                      type="button"
                      onClick={() => handlePayFixedBill(bill)}
                      className="w-full py-1 px-2 rounded-[6px] bg-[#5e6ad2] hover:bg-[#4f5dc8] text-white text-[11px] font-medium transition-colors cursor-pointer flex items-center justify-center gap-1 shadow-xs"
                    >
                      <Check className="w-3 h-3" /> Xác nhận đã đóng
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ================= ⚡ INLINE QUICK-ADD: GHI CHI TIÊU HÔM NAY (5 GIÂY) ================= */}
        <div className="p-5 rounded-[12px] bg-white dark:bg-[#0f1011] border-2 border-[#5e6ad2]/30 dark:border-[#5e6ad2]/40 shadow-sm space-y-3.5">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
            <div>
              <h2 className="text-[15px] font-semibold text-[#0f1011] dark:text-[#f7f8f8] flex items-center gap-2">
                <Zap className="w-4 h-4 text-[#eab308] fill-[#eab308]" />
                Ghi Nhanh Chi Tiêu Hôm Nay (Thao tác 5 giây)
              </h2>
              <p className="text-[12px] text-[#64748b] dark:text-[#8a8f98]">
                Vừa ăn cơm hay uống cà phê? Gõ số tiền và món chi rồi bấm Enter — Trợ lý AI sẽ tự động phân loại danh mục cho bạn!
              </p>
            </div>

            {/* Quick Presets */}
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="text-[11px] text-[#64748b] dark:text-[#62666d]">Chọn nhanh:</span>
              <button
                type="button"
                onClick={() => handleQuickPreset(20000, "Bánh mì sáng", 6)}
                className="px-2 py-1 rounded-[6px] bg-[#f1f5f9] dark:bg-[#141516] hover:bg-[#e2e8f0] dark:hover:bg-[#1a1b1d] text-[#334155] dark:text-[#cbd5e1] text-[11px] font-medium border border-[#cbd5e1] dark:border-[#23252a] cursor-pointer transition-colors"
              >
                🥖 Bánh mì 20k
              </button>
              <button
                type="button"
                onClick={() => handleQuickPreset(35000, "Cơm trưa sinh viên", 6)}
                className="px-2 py-1 rounded-[6px] bg-[#f1f5f9] dark:bg-[#141516] hover:bg-[#e2e8f0] dark:hover:bg-[#1a1b1d] text-[#334155] dark:text-[#cbd5e1] text-[11px] font-medium border border-[#cbd5e1] dark:border-[#23252a] cursor-pointer transition-colors"
              >
                🍛 Cơm trưa 35k
              </button>
              <button
                type="button"
                onClick={() => handleQuickPreset(25000, "Cà phê đen", 6)}
                className="px-2 py-1 rounded-[6px] bg-[#f1f5f9] dark:bg-[#141516] hover:bg-[#e2e8f0] dark:hover:bg-[#1a1b1d] text-[#334155] dark:text-[#cbd5e1] text-[11px] font-medium border border-[#cbd5e1] dark:border-[#23252a] cursor-pointer transition-colors"
              >
                ☕ Cà phê 25k
              </button>
              <button
                type="button"
                onClick={() => handleQuickPreset(50000, "Đổ xăng xe máy", 7)}
                className="px-2 py-1 rounded-[6px] bg-[#f1f5f9] dark:bg-[#141516] hover:bg-[#e2e8f0] dark:hover:bg-[#1a1b1d] text-[#334155] dark:text-[#cbd5e1] text-[11px] font-medium border border-[#cbd5e1] dark:border-[#23252a] cursor-pointer transition-colors"
              >
                🛵 Xăng 50k
              </button>
            </div>
          </div>

          <form noValidate onSubmit={handleSaveInlineExpense} className="grid grid-cols-1 md:grid-cols-12 gap-3 items-center">
            {/* Input 1: Số tiền */}
            <div className="md:col-span-3">
              <div className="relative">
                <input
                  type="text"
                  inputMode="numeric"
                  value={inlineAmount}
                  onChange={(e) => setInlineAmount(formatCurrencyInput(e.target.value))}
                  placeholder="Số tiền: 35.000"
                  className="w-full px-3 py-2 rounded-[8px] border border-[#cbd5e1] dark:border-[#23252a] bg-[#f8fafc] dark:bg-[#141516] text-[#0f1011] dark:text-[#f7f8f8] placeholder-[#94a3b8] dark:placeholder-[#62666d] text-[14px] font-medium focus:outline-none focus:ring-2 focus:ring-[#5e6ad2]"
                />
                <span className="absolute right-3 top-2.5 text-xs text-[#64748b] dark:text-[#62666d] pointer-events-none">
                  VNĐ
                </span>
              </div>
            </div>

            {/* Input 2: Mô tả món chi */}
            <div className="md:col-span-5">
              <input
                type="text"
                value={inlineDesc}
                onChange={(e) => setInlineDesc(e.target.value)}
                placeholder="Tên món: ví dụ 'Cơm sườn', 'Trà tắc', 'Gửi xe'..."
                className="w-full px-3 py-2 rounded-[8px] border border-[#cbd5e1] dark:border-[#23252a] bg-[#f8fafc] dark:bg-[#141516] text-[#0f1011] dark:text-[#f7f8f8] placeholder-[#94a3b8] dark:placeholder-[#62666d] text-[14px] focus:outline-none focus:ring-2 focus:ring-[#5e6ad2]"
              />
            </div>

            {/* AI Suggestion Chip */}
            <div className="md:col-span-2">
              {inlineAiSuggestion ? (
                <div className="px-2.5 py-1.5 rounded-[8px] bg-[#eef2ff] dark:bg-[#181926] border border-[#c7d2fe] dark:border-[#2d325a] text-[11px] text-[#4338ca] dark:text-[#828fff] flex items-center justify-between">
                  <span className="truncate flex items-center gap-1 font-medium">
                    <Sparkles className="w-3 h-3 text-[#5e6ad2] shrink-0" />
                    {inlineAiSuggestion.name}
                  </span>
                  <span className="text-[10px] text-[#6366f1] shrink-0">{inlineAiSuggestion.confidence}%</span>
                </div>
              ) : (
                <div className="px-2.5 py-1.5 rounded-[8px] bg-[#f1f5f9] dark:bg-[#141516] border border-[#e2e8f0] dark:border-[#23252a] text-[11px] text-[#64748b] dark:text-[#62666d] text-center truncate">
                  AI tự gán danh mục
                </div>
              )}
            </div>

            {/* Submit Button */}
            <div className="md:col-span-2">
              <button
                type="submit"
                disabled={isSubmittingInline}
                className="w-full py-2 px-3 rounded-[8px] bg-[#5e6ad2] hover:bg-[#4f5dc8] disabled:opacity-50 text-white text-[13px] font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer shadow-xs"
              >
                <Plus className="w-4 h-4" />
                {isSubmittingInline ? "Đang lưu..." : "Ghi Khoản Chi"}
              </button>
            </div>
          </form>
        </div>

        {/* ================= 2-COLUMN MAIN WORKSPACE ================= */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* LEFT: SỔ GIAO DỊCH SINH VIÊN (7 COLS) */}
          <div className="lg:col-span-7 bg-white dark:bg-[#0f1011] border border-[#e2e8f0] dark:border-[#23252a] rounded-[12px] p-5 shadow-xs space-y-4">
            {/* Header Tabs: Hôm Nay vs Toàn Bộ Lịch Sử */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pb-3 border-b border-[#e2e8f0] dark:border-[#23252a]">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    setActiveLedgerTab("today");
                    setCurrentPage(1);
                  }}
                  className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-colors cursor-pointer flex items-center gap-1.5 ${
                    activeLedgerTab === "today"
                      ? "bg-[#5e6ad2] text-white shadow-xs"
                      : "bg-[#f1f5f9] dark:bg-[#141516] text-[#64748b] dark:text-[#8a8f98] hover:text-[#0f1011] dark:hover:text-[#f7f8f8]"
                  }`}
                >
                  <Clock className="w-3.5 h-3.5" />
                  Hôm Nay ({todayTransactions.length})
                </button>

                <button
                  onClick={() => {
                    setActiveLedgerTab("all");
                    setCurrentPage(1);
                  }}
                  className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-colors cursor-pointer flex items-center gap-1.5 ${
                    activeLedgerTab === "all"
                      ? "bg-[#5e6ad2] text-white shadow-xs"
                      : "bg-[#f1f5f9] dark:bg-[#141516] text-[#64748b] dark:text-[#8a8f98] hover:text-[#0f1011] dark:hover:text-[#f7f8f8]"
                  }`}
                >
                  <Calendar className="w-3.5 h-3.5" />
                  Toàn Bộ Kỳ ({filteredTransactions.length})
                </button>
              </div>

              {/* Filters when in 'all' tab */}
              {activeLedgerTab === "all" && (
                <div className="flex items-center gap-2">
                  <div className="relative flex-1 sm:w-36">
                    <Search className="w-3.5 h-3.5 text-[#94a3b8] dark:text-[#62666d] absolute left-2.5 top-2.5" />
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => {
                        setSearchQuery(e.target.value);
                        setCurrentPage(1);
                      }}
                      placeholder="Tìm món..."
                      className="w-full pl-8 pr-2 py-1 rounded-[6px] bg-white dark:bg-[#141516] border border-[#cbd5e1] dark:border-[#23252a] text-[#0f1011] dark:text-[#f7f8f8] placeholder-[#94a3b8] dark:placeholder-[#62666d] text-[11px] focus:outline-none focus:ring-1 focus:ring-[#5e69d1]"
                    />
                  </div>

                  <select
                    value={categoryFilter}
                    onChange={(e) => {
                      setCategoryFilter(e.target.value);
                      setCurrentPage(1);
                    }}
                    className="px-2 py-1 rounded-[6px] bg-white dark:bg-[#141516] border border-[#cbd5e1] dark:border-[#23252a] text-[#475569] dark:text-[#8a8f98] text-[11px] focus:outline-none focus:ring-1 focus:ring-[#5e69d1] cursor-pointer"
                  >
                    <option value="all">Tất cả danh mục</option>
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Summary for Today Tab */}
              {activeLedgerTab === "today" && (
                <div className="text-xs text-[#64748b] dark:text-[#8a8f98] font-medium">
                  Tổng chi hôm nay: <strong className="text-[#e11d48] text-[13px]">{todaySpent.toLocaleString("vi-VN")} đ</strong>
                </div>
              )}
            </div>

            {/* Transaction List */}
            {loading ? (
              <div className="py-12 text-center text-xs text-[#64748b] dark:text-[#8a8f98]">
                Đang tải dữ liệu thu chi...
              </div>
            ) : activeLedgerList.length === 0 ? (
              activeLedgerTab === "today" ? (
                <div className="py-12 text-center space-y-2">
                  <div className="w-12 h-12 rounded-full bg-[#f1f5f9] dark:bg-[#141516] flex items-center justify-center mx-auto text-[#64748b]">
                    <Coins className="w-6 h-6 text-[#27a644]" />
                  </div>
                  <h3 className="text-sm font-semibold text-[#0f1011] dark:text-[#f7f8f8]">
                    Hôm nay bạn chưa phát sinh khoản chi nào!
                  </h3>
                  <p className="text-xs text-[#64748b] dark:text-[#8a8f98] max-w-sm mx-auto">
                    Hãy dùng thanh <strong>"Ghi Nhanh Chi Tiêu Hôm Nay"</strong> ở phía trên để ghi nhận mỗi khi vừa trả tiền ăn uống, đổ xăng.
                  </p>
                </div>
              ) : (
                <div className="py-12 text-center space-y-2">
                  <p className="text-xs text-[#64748b] dark:text-[#8a8f98]">
                    Không tìm thấy giao dịch nào phù hợp với bộ lọc.
                  </p>
                </div>
              )
            ) : (
              <div className="space-y-4">
                <div className="divide-y divide-[#f1f5f9] dark:divide-[#1e2024]">
                  {paginatedTransactions.map((tx) => (
                    <div
                      key={tx.id}
                      className="py-3 px-2 flex items-center justify-between hover:bg-[#f8f9fa] dark:hover:bg-[#141516]/50 rounded-[8px] transition-colors group"
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className={`w-9 h-9 rounded-[8px] flex items-center justify-center shrink-0 ${
                            tx.type === "income"
                              ? "bg-[#ecfdf5] dark:bg-[#10b981]/10 text-[#10b981]"
                              : "bg-[#fef2f2] dark:bg-[#ef4444]/10 text-[#ef4444]"
                          }`}
                        >
                          {tx.type === "income" ? (
                            <ArrowDownLeft className="w-4 h-4" />
                          ) : (
                            <ArrowUpRight className="w-4 h-4" />
                          )}
                        </div>
                        <div>
                          <p className="text-sm font-medium text-[#0f1011] dark:text-[#f7f8f8]">
                            {tx.description}
                          </p>
                          <div className="flex items-center gap-2 text-[11px] text-[#64748b] dark:text-[#8a8f98] mt-0.5">
                            <span className="px-1.5 py-0.2 rounded bg-[#f1f5f9] dark:bg-[#141516] border border-[#e2e8f0] dark:border-[#23252a] text-[#475569] dark:text-[#94a3b8]">
                              {tx.category?.name || "Khác"}
                            </span>
                            <span>
                              {activeLedgerTab === "today"
                                ? `Hôm nay (${new Date(tx.date).toLocaleDateString("vi-VN")})`
                                : new Date(tx.date).toLocaleDateString("vi-VN")}
                            </span>
                            {tx.ai_suggested_category && (
                              <span className="text-[10px] text-[#5e6ad2] flex items-center gap-0.5">
                                <Sparkles className="w-2.5 h-2.5" /> AI
                              </span>
                            )}
                            {tx.type === "expense" && Number(tx.amount) >= monthlyAllowance * 0.4 && (
                              <span
                                className="text-[9.5px] px-1.5 py-0.2 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 font-semibold flex items-center gap-0.5 border border-amber-500/20"
                                title="Chi phí lớn bất thường (>40% quỹ tháng)"
                              >
                                <AlertTriangle className="w-2.5 h-2.5" /> Chi lớn
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        <span
                          className={`text-sm font-semibold tracking-tight ${
                            tx.type === "income" ? "text-[#10b981]" : "text-[#0f1011] dark:text-[#f7f8f8]"
                          }`}
                        >
                          {tx.type === "income" ? "+" : "-"}
                          {Number(tx.amount).toLocaleString("vi-VN")} đ
                        </span>
                        <button
                          onClick={() => handleDeleteTransaction(tx.id)}
                          title="Xóa giao dịch"
                          className="opacity-0 group-hover:opacity-100 text-[#94a3b8] dark:text-[#62666d] hover:text-[#e11d48] p-1 rounded transition-opacity cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Thanh điều hướng phân trang (Pagination Controls) */}
                {activeLedgerList.length > itemsPerPage && (
                  <div className="pt-3 border-t border-[#f1f5f9] dark:border-[#1e2024] flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-[#64748b] dark:text-[#8a8f98]">
                    <span>
                      Hiển thị {(currentPage - 1) * itemsPerPage + 1} - {Math.min(currentPage * itemsPerPage, activeLedgerList.length)} trong tổng số {activeLedgerList.length} giao dịch
                    </span>

                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                        disabled={currentPage === 1}
                        className="p-1.5 rounded-[6px] border border-[#e2e8f0] dark:border-[#23252a] bg-white dark:bg-[#141516] text-[#0f1011] dark:text-[#f7f8f8] hover:bg-[#f8f9fa] dark:hover:bg-[#18191a] disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer transition-colors"
                        title="Trang trước"
                      >
                        <ChevronLeft className="w-3.5 h-3.5" />
                      </button>

                      <div className="flex items-center gap-1">
                        {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                          <button
                            key={page}
                            onClick={() => setCurrentPage(page)}
                            className={`w-7 h-7 rounded-[6px] text-xs font-semibold transition-colors cursor-pointer ${
                              currentPage === page
                                ? "bg-[#5e6ad2] text-white shadow-xs"
                                : "border border-[#e2e8f0] dark:border-[#23252a] bg-white dark:bg-[#141516] text-[#64748b] dark:text-[#8a8f98] hover:bg-[#f8f9fa] dark:hover:bg-[#18191a]"
                            }`}
                          >
                            {page}
                          </button>
                        ))}
                      </div>

                      <button
                        onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                        disabled={currentPage === totalPages}
                        className="p-1.5 rounded-[6px] border border-[#e2e8f0] dark:border-[#23252a] bg-white dark:bg-[#141516] text-[#0f1011] dark:text-[#f7f8f8] hover:bg-[#f8f9fa] dark:hover:bg-[#18191a] disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer transition-colors"
                        title="Trang sau"
                      >
                        <ChevronRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* RIGHT: TRỢ LÝ AI & CANH GÁC NGÂN SÁCH (5 COLS) */}
          <div className="lg:col-span-5 space-y-6">
            {/* WIDGET 1: AI INSIGHTS THẤU HIỂU (SRS 3.7) */}
            <div className="bg-white dark:bg-[#0f1011] border border-[#e2e8f0] dark:border-[#23252a] rounded-[12px] p-5 shadow-xs space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-[#e2e8f0] dark:border-[#23252a]">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-[#5e6ad2]" />
                  <h3 className="text-[14px] font-semibold text-[#0f1011] dark:text-[#f7f8f8]">
                    AI Insights Thấu Hiểu (SRS 3.7)
                  </h3>
                </div>
                <span className="text-[10px] px-1.5 py-0.5 rounded-[4px] bg-[#ecfdf5] dark:bg-[#141516] text-[#10b981] border border-[#a7f3d0] dark:border-[#23252a] font-medium">
                  Phân tích tự động
                </span>
              </div>
              <p className="text-[12px] text-[#475569] dark:text-[#8a8f98] leading-relaxed">
                {aiInsight || "Đang phân tích thói quen chi tiêu của bạn qua thuật toán AI..."}
              </p>
            </div>

            {/* WIDGET: MỤC TIÊU TIẾT KIỆM THÁNG (SRS 3.1 & 3.8) */}
            <div className="bg-white dark:bg-[#0f1011] border border-[#e2e8f0] dark:border-[#23252a] rounded-[12px] p-5 shadow-xs space-y-3.5">
              <div className="flex items-center justify-between pb-2.5 border-b border-[#e2e8f0] dark:border-[#23252a]">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-[6px] bg-[#ecfdf5] dark:bg-[#064e3b]/30 text-[#10b981] flex items-center justify-center">
                    <PiggyBank className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-[14px] font-semibold text-[#0f1011] dark:text-[#f7f8f8]">
                      Mục Tiêu Tiết Kiệm ({displayMonthLabel})
                    </h3>
                    <p className="text-[11px] text-[#64748b] dark:text-[#8a8f98]">Mục tiêu tích lũy theo SRS 3.1</p>
                  </div>
                </div>

                {!isEditingGoal && (
                  <button
                    type="button"
                    onClick={() => {
                      setEditSavingsGoalInput(formatCurrencyInput(monthlySavingsGoal));
                      setIsEditingGoal(true);
                    }}
                    className="text-[11px] text-[#5e6ad2] hover:underline cursor-pointer font-medium flex items-center gap-1"
                    title="Thay đổi mục tiêu tiết kiệm tháng"
                  >
                    <Edit2 className="w-3 h-3" /> Đổi mục tiêu
                  </button>
                )}
              </div>

              {/* Form sửa mục tiêu tiết kiệm */}
              {isEditingGoal ? (
                <form noValidate onSubmit={handleSaveSavingsGoal} className="p-3 rounded-[8px] bg-[#f8fafc] dark:bg-[#141516] border border-[#cbd5e1] dark:border-[#23252a] space-y-2.5">
                  <label className="block text-[11px] font-medium text-[#475569] dark:text-[#94a3b8]">
                    Nhập mục tiêu tiết kiệm mới (VNĐ/tháng):
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      inputMode="numeric"
                      value={editSavingsGoalInput}
                      onChange={(e) => setEditSavingsGoalInput(formatCurrencyInput(e.target.value))}
                      placeholder="1.500.000"
                      className="flex-1 px-2.5 py-1.5 rounded-[6px] border border-[#cbd5e1] dark:border-[#23252a] bg-white dark:bg-[#0f1011] text-[#0f1011] dark:text-[#f7f8f8] text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-[#5e6ad2]"
                    />
                    <button
                      type="submit"
                      disabled={isSavingGoalLoading}
                      className="px-3 py-1.5 rounded-[6px] bg-[#10b981] hover:bg-[#059669] text-white text-xs font-medium cursor-pointer transition-colors"
                    >
                      Lưu
                    </button>
                    <button
                      type="button"
                      onClick={() => setIsEditingGoal(false)}
                      className="px-2.5 py-1.5 rounded-[6px] bg-[#f1f5f9] dark:bg-[#1e2024] text-[#64748b] dark:text-[#8a8f98] text-xs cursor-pointer"
                    >
                      Hủy
                    </button>
                  </div>
                </form>
              ) : (
                <div className="space-y-3">
                  {/* Số liệu tiến độ */}
                  <div className="flex items-baseline justify-between">
                    <div>
                      <span className="text-[11px] text-[#64748b] dark:text-[#8a8f98]">Mục tiêu để dành:</span>
                      <div className="text-xl font-bold text-[#0f1011] dark:text-[#f7f8f8]">
                        {monthlySavingsGoal.toLocaleString("vi-VN")} đ
                      </div>
                    </div>
                    <div className="text-right">
                      <span
                        className={`text-[11px] font-bold px-2 py-0.5 rounded-full border ${
                          remainingAllowance >= monthlySavingsGoal
                            ? "bg-[#ecfdf5] dark:bg-[#064e3b]/30 text-[#10b981] border-[#a7f3d0] dark:border-[#047857]"
                            : remainingAllowance >= monthlySavingsGoal * 0.7
                            ? "bg-[#fffbeb] dark:bg-[#78350f]/30 text-[#d97706] border-[#fde68a] dark:border-[#b45309]"
                            : "bg-[#fef2f2] dark:bg-[#7f1d1d]/30 text-[#e11d48] border-[#fecaca] dark:border-[#991b1b]"
                        }`}
                      >
                        {savingsGoalProgress}% mục tiêu
                      </span>
                    </div>
                  </div>

                  {/* Progress Bar */}
                  <div className="space-y-1">
                    <div className="w-full bg-[#e2e8f0] dark:bg-[#18191a] h-2 rounded-full overflow-hidden">
                      <div
                        className={`h-2 rounded-full transition-all ${
                          remainingAllowance >= monthlySavingsGoal
                            ? "bg-[#10b981]"
                            : remainingAllowance >= monthlySavingsGoal * 0.7
                            ? "bg-[#eab308]"
                            : "bg-[#e11d48]"
                        }`}
                        style={{ width: `${Math.min(100, Math.max(0, savingsGoalProgress))}%` }}
                      />
                    </div>
                    <div className="flex items-center justify-between text-[10px] text-[#94a3b8]">
                      <span>Đang bảo toàn: {remainingAllowance.toLocaleString("vi-VN")} đ</span>
                      <span>Mục tiêu: {monthlySavingsGoal.toLocaleString("vi-VN")} đ</span>
                    </div>
                  </div>

                  {/* Thông điệp phân tích tài chính thông minh */}
                  <div
                    className={`p-2.5 rounded-[8px] border text-[11px] leading-relaxed flex items-start gap-2 ${
                      remainingAllowance >= monthlySavingsGoal
                        ? "bg-[#f0fdf4] dark:bg-[#064e3b]/20 border-[#bbf7d0] dark:border-[#047857]/40 text-[#166534] dark:text-[#86efac]"
                        : remainingAllowance >= monthlySavingsGoal * 0.7
                        ? "bg-[#fffbeb] dark:bg-[#78350f]/20 border-[#fde68a] dark:border-[#b45309]/40 text-[#92400e] dark:text-[#fde68a]"
                        : "bg-[#fef2f2] dark:bg-[#7f1d1d]/20 border-[#fecaca] dark:border-[#991b1b]/40 text-[#991b1b] dark:text-[#fca5a5]"
                    }`}
                  >
                    <TrendingUp className="w-4 h-4 shrink-0 mt-0.5" />
                    <span>
                      {remainingAllowance >= monthlySavingsGoal
                        ? `🎉 Bạn đang giữ vững mục tiêu! Số dư ví còn thừa ${(
                            remainingAllowance - monthlySavingsGoal
                          ).toLocaleString("vi-VN")} đ để chi tiêu linh hoạt các ngày tới.`
                        : remainingAllowance > 0
                        ? `⚡ Bạn đang giữ được ${remainingAllowance.toLocaleString("vi-VN")} đ. Để đạt mục tiêu cuối tháng, hãy duy trì mức ăn uống tối đa ${dailySafeLimit.toLocaleString("vi-VN")} đ/ngày!`
                        : `⚠️ Quỹ ví tháng này đã cạn. Hãy hạn chế các khoản phát sinh để bắt đầu lại mục tiêu vào kỳ lương tới.`}
                    </span>
                  </div>
                </div>
              )}
            </div>

            {/* WIDGET 2: BUDGET WATCHDOG (SRS 3.9) */}
            <div className="bg-white dark:bg-[#0f1011] border border-[#e2e8f0] dark:border-[#23252a] rounded-[12px] p-5 shadow-xs space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-[#e2e8f0] dark:border-[#23252a]">
                <div className="flex items-center gap-2">
                  <Target className="w-4 h-4 text-[#5e6ad2]" />
                  <div>
                    <h3 className="text-[14px] font-semibold text-[#0f1011] dark:text-[#f7f8f8]">
                      Canh Gác Ngân Sách Danh Mục (SRS 3.9)
                    </h3>
                    <p className="text-[11px] text-[#64748b] dark:text-[#8a8f98]">Tháng {selectedMonth}</p>
                  </div>
                </div>
                <button
                  onClick={() => setIsBudgetModalOpen(true)}
                  className="text-[11px] text-[#5e6ad2] hover:underline cursor-pointer font-medium"
                >
                  + Cài hạn mức
                </button>
              </div>

              {budgets.length === 0 ? (
                <div className="text-center py-4 text-xs text-[#64748b] dark:text-[#8a8f98]">
                  Chưa có hạn mức nào cho tháng này.
                </div>
              ) : (
                <div className="space-y-3">
                  {budgets.map((b) => (
                    <div key={b.id} className="space-y-1">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-medium text-[#0f1011] dark:text-[#f7f8f8]">{b.categoryName}</span>
                        <span className="text-[11px] text-[#64748b] dark:text-[#8a8f98]">
                          {b.spent.toLocaleString("vi-VN")} / {b.limit.toLocaleString("vi-VN")} đ (
                          <strong
                            className={
                              b.status === "exceeded"
                                ? "text-[#e11d48]"
                                : b.status === "warning"
                                ? "text-[#eab308]"
                                : "text-[#64748b] dark:text-[#8a8f98]"
                            }
                          >
                            {b.percentage}%
                          </strong>
                          )
                        </span>
                      </div>
                      <div className="w-full bg-[#e2e8f0] dark:bg-[#18191a] h-1.5 rounded-full overflow-hidden">
                        <div
                          className={`h-1.5 rounded-full ${
                            b.status === "exceeded"
                              ? "bg-[#e11d48]"
                              : b.status === "warning"
                              ? "bg-[#eab308]"
                              : "bg-[#5e6ad2]"
                          }`}
                          style={{ width: `${Math.min(100, b.percentage)}%` }}
                        />
                      </div>
                      {b.status === "warning" && (
                        <p className="text-[10px] text-[#b45309] dark:text-[#fde047] flex items-center gap-1">
                          <AlertTriangle className="w-3 h-3 text-[#eab308]" /> Đã chạm 80% hạn mức!
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* WIDGET 3: 6-MONTH COMPARISON CHART (SRS 3.6) */}
            <div className="bg-white dark:bg-[#0f1011] border border-[#e2e8f0] dark:border-[#23252a] rounded-[12px] p-5 shadow-xs space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-[#e2e8f0] dark:border-[#23252a]">
                <div className="flex items-center gap-2">
                  <PieChart className="w-4 h-4 text-[#5e6ad2]" />
                  <h3 className="text-[14px] font-semibold text-[#0f1011] dark:text-[#f7f8f8]">
                    Quỹ Lương vs Chi Tiêu 6 Tháng (SRS 3.6)
                  </h3>
                </div>
                <span className="text-[10px] text-[#64748b] dark:text-[#8a8f98]">Đơn vị: nghìn VNĐ</span>
              </div>

              <div className="h-44 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData} margin={{ top: 10, right: 0, left: -25, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                    <XAxis dataKey="month" stroke="#94a3b8" fontSize={11} />
                    <YAxis stroke="#94a3b8" fontSize={11} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "#0f1011",
                        borderColor: "#23252a",
                        borderRadius: "8px",
                        fontSize: "12px",
                        color: "#f7f8f8",
                      }}
                    />
                    <Bar dataKey="Thu" fill="#10b981" radius={[4, 4, 0, 0]} name="Quỹ lương nhận" />
                    <Bar dataKey="Chi" fill="#5e6ad2" radius={[4, 4, 0, 0]} name="Chi tiêu thực" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* WIDGET 4: SAVING TIPS (SRS 3.8) */}
            <div className="bg-white dark:bg-[#0f1011] border border-[#e2e8f0] dark:border-[#23252a] rounded-[12px] p-5 shadow-xs space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-[#e2e8f0] dark:border-[#23252a]">
                <div className="flex items-center gap-2">
                  <Coins className="w-4 h-4 text-[#5e6ad2]" />
                  <h3 className="text-[14px] font-semibold text-[#0f1011] dark:text-[#f7f8f8]">
                    Mẹo Tiết Kiệm Dành Riêng Cho Bạn (SRS 3.8)
                  </h3>
                </div>
              </div>

              <div className="space-y-2">
                {savingTips.map((tip) => (
                  <div
                    key={tip.id}
                    className="p-3 rounded-[8px] bg-[#f8fafc] dark:bg-[#141516] border border-[#e2e8f0] dark:border-[#23252a] text-xs space-y-1"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-medium text-[#0f1011] dark:text-[#f7f8f8]">{tip.title}</span>
                      {tip.potential_saving && (
                        <span className="text-[10px] text-[#10b981] font-semibold">
                          Tiết kiệm ~{Number(tip.potential_saving).toLocaleString("vi-VN")} đ
                        </span>
                      )}
                    </div>
                    <p className="text-[#64748b] dark:text-[#8a8f98] text-[11px] leading-relaxed">{tip.content}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* ================= MODAL: CÀI ĐẶT DÒNG TIỀN & CHI PHÍ CỐ ĐỊNH ================= */}
      {isAllowanceModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs">
          <div className="bg-white dark:bg-[#0f1011] border border-[#e2e8f0] dark:border-[#23252a] rounded-[14px] p-6 max-w-xl w-full shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-2 border-b border-[#e2e8f0] dark:border-[#23252a]">
              <h3 className="text-[15px] font-semibold text-[#0f1011] dark:text-[#f7f8f8] flex items-center gap-2">
                <Settings className="w-4 h-4 text-[#5e6ad2]" />
                Cài Đặt Dòng Tiền & Chi Phí Cố Định
              </h3>
              <button
                onClick={() => setIsAllowanceModalOpen(false)}
                className="text-[#64748b] dark:text-[#8a8f98] hover:text-[#0f1011] dark:hover:text-[#f7f8f8] cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-[12px] text-[#64748b] dark:text-[#8a8f98] leading-relaxed">
              Thiết lập ngày nhận lương, định mức quỹ và các khoản chi cố định (tiền trọ, điện nước, gói mạng...) để hệ thống tự động tính toán hạn mức ăn uống an toàn mỗi ngày.
            </p>

            <form noValidate onSubmit={handleSaveFinancialSettings} className="space-y-4">
              {/* Phần 1: Quỹ lương, Ngày nhận & Mục tiêu tiết kiệm */}
              <div className="p-3.5 rounded-[10px] bg-[#f8fafc] dark:bg-[#141516] border border-[#e2e8f0] dark:border-[#23252a] space-y-3">
                <div className="text-[12px] font-semibold text-[#0f1011] dark:text-[#f7f8f8] flex items-center gap-1.5">
                  <Wallet className="w-3.5 h-3.5 text-[#5e6ad2]" />
                  Quỹ Lương & Mục Tiêu Tiết Kiệm Hàng Tháng
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 items-end">
                  <div className="flex flex-col">
                    <label className="text-[11px] font-medium text-[#475569] dark:text-[#94a3b8] mb-1.5 whitespace-nowrap">
                      Mức quỹ tháng (VNĐ)
                    </label>
                    <input
                      type="text"
                      inputMode="numeric"
                      value={newAllowanceInput}
                      onChange={(e) => setNewAllowanceInput(formatCurrencyInput(e.target.value))}
                      placeholder="8.000.000"
                      required
                      className="w-full h-9 px-3 rounded-[8px] border border-[#cbd5e1] dark:border-[#23252a] bg-white dark:bg-[#0f1011] text-[#0f1011] dark:text-[#f7f8f8] text-[13px] font-semibold focus:outline-none focus:ring-2 focus:ring-[#5e6ad2]"
                    />
                  </div>

                  <div className="flex flex-col">
                    <label className="text-[11px] font-medium text-[#475569] dark:text-[#94a3b8] mb-1.5 whitespace-nowrap">
                      Mục tiêu tiết kiệm (VNĐ)
                    </label>
                    <input
                      type="text"
                      inputMode="numeric"
                      value={settingsSavingsGoalInput}
                      onChange={(e) => setSettingsSavingsGoalInput(formatCurrencyInput(e.target.value))}
                      placeholder="1.500.000"
                      className="w-full h-9 px-3 rounded-[8px] border border-[#cbd5e1] dark:border-[#23252a] bg-white dark:bg-[#0f1011] text-[#0f1011] dark:text-[#f7f8f8] text-[13px] font-semibold focus:outline-none focus:ring-2 focus:ring-[#5e6ad2]"
                    />
                  </div>

                  <div className="flex flex-col">
                    <label className="text-[11px] font-medium text-[#475569] dark:text-[#94a3b8] mb-1.5 whitespace-nowrap">
                      Ngày nhận lương
                    </label>
                    <select
                      value={settingsSalaryPayDay}
                      onChange={(e) => setSettingsSalaryPayDay(Number(e.target.value))}
                      className="w-full h-9 px-2.5 rounded-[8px] border border-[#cbd5e1] dark:border-[#23252a] bg-white dark:bg-[#0f1011] text-[#0f1011] dark:text-[#f7f8f8] text-[13px] font-semibold focus:outline-none focus:ring-2 focus:ring-[#5e6ad2] cursor-pointer"
                    >
                      {Array.from({ length: 31 }, (_, i) => i + 1).map((day) => (
                        <option key={day} value={day}>
                          Ngày {day < 10 ? `0${day}` : day} {day === 5 ? "(Mặc định)" : ""}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              {/* Phần 2: Danh sách chi phí cố định (Fixed Monthly Bills) */}
              <div className="p-3.5 rounded-[10px] bg-[#f8fafc] dark:bg-[#141516] border border-[#e2e8f0] dark:border-[#23252a] space-y-3">
                <div className="flex items-center justify-between">
                  <div className="text-[12px] font-semibold text-[#0f1011] dark:text-[#f7f8f8] flex items-center gap-1.5">
                    <Receipt className="w-3.5 h-3.5 text-[#5e6ad2]" />
                    Khoản Chi Cố Định ({settingsFixedBills.length} khoản)
                  </div>
                  <span className="text-[11px] text-[#64748b] dark:text-[#8a8f98]">
                    Tổng: <strong>{settingsFixedBills.reduce((acc, b) => acc + b.amount, 0).toLocaleString("vi-VN")} đ</strong>
                  </span>
                </div>

                {/* Danh sách khoản hiện có */}
                <div className="space-y-1.5 max-h-40 overflow-y-auto pr-1">
                  {settingsFixedBills.length === 0 ? (
                    <div className="text-center py-2 text-[11px] text-[#64748b] dark:text-[#8a8f98]">
                      Chưa có khoản chi cố định nào. Thêm bên dưới!
                    </div>
                  ) : (
                    settingsFixedBills.map((b) =>
                      editingBillId === b.id ? (
                        <div
                          key={b.id}
                          className="p-2 rounded-[8px] bg-white dark:bg-[#0f1011] border-2 border-[#5e6ad2] shadow-xs space-y-2 text-xs"
                        >
                          <div className="grid grid-cols-1 sm:grid-cols-4 gap-1.5">
                            <input
                              type="text"
                              value={editBillName}
                              onChange={(e) => setEditBillName(e.target.value)}
                              placeholder="Tên khoản chi"
                              className="px-2 py-1 rounded-[6px] border border-[#cbd5e1] dark:border-[#23252a] bg-white dark:bg-[#141516] text-[#0f1011] dark:text-[#f7f8f8] text-xs focus:outline-none focus:ring-1 focus:ring-[#5e6ad2]"
                            />
                            <input
                              type="text"
                              inputMode="numeric"
                              value={editBillAmount}
                              onChange={(e) => setEditBillAmount(formatCurrencyInput(e.target.value))}
                              placeholder="Số tiền"
                              className="px-2 py-1 rounded-[6px] border border-[#cbd5e1] dark:border-[#23252a] bg-white dark:bg-[#141516] text-[#0f1011] dark:text-[#f7f8f8] text-xs focus:outline-none focus:ring-1 focus:ring-[#5e6ad2]"
                            />
                            <select
                              value={editBillCatId}
                              onChange={(e) => setEditBillCatId(Number(e.target.value))}
                              className="px-2 py-1 rounded-[6px] border border-[#cbd5e1] dark:border-[#23252a] bg-white dark:bg-[#141516] text-[#0f1011] dark:text-[#f7f8f8] text-xs cursor-pointer"
                              title="Danh mục chi phí"
                            >
                              <option value={8}>Tiền trọ / KTX</option>
                              <option value={10}>Dịch vụ số (4G, Net)</option>
                              <option value={9}>Học tập</option>
                              <option value={7}>Đi lại</option>
                              <option value={6}>Ăn uống</option>
                              <option value={11}>Giải trí</option>
                              <option value={12}>Chi tiêu khác</option>
                            </select>
                            <div className="flex items-center gap-1">
                              <select
                                value={editBillDueDay}
                                onChange={(e) => setEditBillDueDay(Number(e.target.value))}
                                className="w-full px-2 py-1 rounded-[6px] border border-[#cbd5e1] dark:border-[#23252a] bg-white dark:bg-[#141516] text-[#0f1011] dark:text-[#f7f8f8] text-xs cursor-pointer"
                              >
                                {Array.from({ length: 31 }, (_, i) => i + 1).map((d) => (
                                  <option key={d} value={d}>
                                    Ngày {d}
                                  </option>
                                ))}
                              </select>
                              <button
                                type="button"
                                onClick={() => handleSaveEditBill(b.id)}
                                className="p-1 rounded-[6px] bg-[#16a34a] hover:bg-[#15803d] text-white cursor-pointer transition-colors shrink-0"
                                title="Lưu chỉnh sửa"
                              >
                                <Check className="w-3.5 h-3.5" />
                              </button>
                              <button
                                type="button"
                                onClick={handleCancelEditBill}
                                className="p-1 rounded-[6px] bg-[#f1f5f9] dark:bg-[#23252a] hover:bg-[#e2e8f0] dark:hover:bg-[#2d3036] text-[#64748b] dark:text-[#8a8f98] cursor-pointer transition-colors shrink-0"
                                title="Hủy bỏ"
                              >
                                <X className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div
                          key={b.id}
                          className="flex items-center justify-between p-2 rounded-[8px] bg-white dark:bg-[#0f1011] border border-[#e2e8f0] dark:border-[#23252a] text-xs hover:border-[#cbd5e1] dark:hover:border-[#383a42] transition-colors"
                        >
                          <div className="flex items-center gap-2 truncate mr-2">
                            <span className="font-medium text-[#0f1011] dark:text-[#f7f8f8] truncate">{b.name}</span>
                            <span className="text-[10px] text-[#94a3b8] shrink-0">Hạn ngày {b.dueDay}</span>
                            <span className="text-[9.5px] px-1.5 py-0.5 rounded-[4px] bg-[#5e6ad2]/10 text-[#5e6ad2] font-medium shrink-0">
                              {categories.find((c) => c.id === b.category_id)?.name || (b.category_id === 8 ? "Tiền trọ / KTX" : b.category_id === 10 ? "Dịch vụ số" : "Khoản chi")}
                            </span>
                          </div>
                          <div className="flex items-center gap-1.5 shrink-0">
                            <span className="font-semibold text-[#5e6ad2]">{b.amount.toLocaleString("vi-VN")} đ</span>
                            <button
                              type="button"
                              onClick={() => handleStartEditBill(b)}
                              className="text-[#64748b] hover:text-[#5e6ad2] p-1 cursor-pointer transition-colors"
                              title="Chỉnh sửa khoản chi này"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleRemoveFixedBill(b.id)}
                              className="text-[#64748b] hover:text-[#e11d48] p-1 cursor-pointer transition-colors"
                              title="Xóa khoản chi này"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      )
                    )
                  )}
                </div>

                {/* Form thêm khoản cố định mới */}
                <div className="pt-2 border-t border-[#e2e8f0] dark:border-[#23252a] space-y-2">
                  <span className="text-[11px] font-medium text-[#475569] dark:text-[#94a3b8] block">
                    + Thêm khoản chi cố định mới:
                  </span>
                  <div className="grid grid-cols-1 sm:grid-cols-4 gap-2">
                    <input
                      type="text"
                      placeholder="Tên khoản (vd: Tiền trọ)"
                      value={newBillName}
                      onChange={(e) => {
                        const val = e.target.value;
                        setNewBillName(val);
                        const lower = val.toLowerCase();
                        if (lower.includes("trọ") || lower.includes("ktx") || lower.includes("ký túc") || lower.includes("phòng") || lower.includes("nhà") || lower.includes("điện") || lower.includes("nước") || lower.includes("wifi")) {
                          setNewBillCatId(8);
                        } else if (lower.includes("4g") || lower.includes("net") || lower.includes("cước") || lower.includes("sim") || lower.includes("antigravity") || lower.includes("dịch vụ")) {
                          setNewBillCatId(10);
                        } else if (lower.includes("học") || lower.includes("sách")) {
                          setNewBillCatId(9);
                        } else if (lower.includes("xe") || lower.includes("xăng")) {
                          setNewBillCatId(7);
                        } else if (lower.includes("ăn")) {
                          setNewBillCatId(6);
                        }
                      }}
                      className="px-2.5 py-1.5 rounded-[6px] border border-[#cbd5e1] dark:border-[#23252a] bg-white dark:bg-[#0f1011] text-[#0f1011] dark:text-[#f7f8f8] text-xs focus:outline-none focus:ring-1 focus:ring-[#5e6ad2]"
                    />
                    <input
                      type="text"
                      inputMode="numeric"
                      placeholder="Số tiền (vd: 2.500.000)"
                      value={newBillAmount}
                      onChange={(e) => setNewBillAmount(formatCurrencyInput(e.target.value))}
                      className="px-2.5 py-1.5 rounded-[6px] border border-[#cbd5e1] dark:border-[#23252a] bg-white dark:bg-[#0f1011] text-[#0f1011] dark:text-[#f7f8f8] text-xs focus:outline-none focus:ring-1 focus:ring-[#5e6ad2]"
                    />
                    <select
                      value={newBillCatId}
                      onChange={(e) => setNewBillCatId(Number(e.target.value))}
                      className="px-2.5 py-1.5 rounded-[6px] border border-[#cbd5e1] dark:border-[#23252a] bg-white dark:bg-[#0f1011] text-[#0f1011] dark:text-[#f7f8f8] text-xs cursor-pointer"
                      title="Danh mục chi phí"
                    >
                      <option value={8}>Tiền trọ / KTX</option>
                      <option value={10}>Dịch vụ số (4G, Net)</option>
                      <option value={9}>Học tập</option>
                      <option value={7}>Đi lại</option>
                      <option value={6}>Ăn uống</option>
                      <option value={11}>Giải trí</option>
                      <option value={12}>Chi tiêu khác</option>
                    </select>
                    <div className="flex items-center gap-1.5">
                      <select
                        value={newBillDueDay}
                        onChange={(e) => setNewBillDueDay(Number(e.target.value))}
                        className="w-full px-2 py-1.5 rounded-[6px] border border-[#cbd5e1] dark:border-[#23252a] bg-white dark:bg-[#0f1011] text-[#0f1011] dark:text-[#f7f8f8] text-xs cursor-pointer"
                        title="Hạn thanh toán hàng tháng"
                      >
                        {Array.from({ length: 31 }, (_, i) => i + 1).map((d) => (
                          <option key={d} value={d}>
                            Ngày {d}
                          </option>
                        ))}
                      </select>
                      <button
                        type="button"
                        onClick={handleAddNewFixedBill}
                        className="px-2.5 py-1.5 rounded-[6px] bg-[#5e6ad2] hover:bg-[#4f5dc8] text-white text-xs font-semibold shrink-0 cursor-pointer transition-colors shadow-xs"
                      >
                        Thêm
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Phần 3: Phân tích Dòng Tiền Sinh Hoạt Dự Kiến */}
              <div className="p-3 rounded-[10px] bg-[#eff6ff] dark:bg-[#172554]/40 border border-[#bfdbfe] dark:border-[#1e3a8a] text-xs space-y-1.5">
                <div className="font-semibold text-[#1e40af] dark:text-[#93c5fd] flex items-center justify-between">
                  <span>Dự Toán Tiền Ăn Uống & Sinh Hoạt Thực Tế:</span>
                  <span className="text-[13px] font-bold">
                    {Math.max(
                      0,
                      parseCurrencyInput(newAllowanceInput) -
                        settingsFixedBills.reduce((acc, b) => acc + b.amount, 0)
                    ).toLocaleString("vi-VN")}{" "}
                    đ / tháng
                  </span>
                </div>
                <p className="text-[11px] text-[#3b82f6] dark:text-[#93c5fd]/80">
                  Sau khi trừ tổng chi phí cố định (
                  {settingsFixedBills.reduce((acc, b) => acc + b.amount, 0).toLocaleString("vi-VN")} đ), bạn sẽ có trung
                  bình khoảng{" "}
                  <strong>
                    {Math.round(
                      Math.max(
                        0,
                        parseCurrencyInput(newAllowanceInput) -
                          settingsFixedBills.reduce((acc, b) => acc + b.amount, 0)
                      ) / 30
                    ).toLocaleString("vi-VN")}{" "}
                    đ/ngày
                  </strong>{" "}
                  để ăn tiêu mà không lo bị thâm hụt tiền trọ.
                </p>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#e2e8f0] dark:border-[#23252a]">
                <button
                  type="button"
                  onClick={() => setIsAllowanceModalOpen(false)}
                  className="px-3.5 py-2 rounded-[8px] bg-[#f1f5f9] dark:bg-[#141516] text-[#64748b] dark:text-[#8a8f98] hover:text-[#0f1011] dark:hover:text-[#f7f8f8] text-[13px] cursor-pointer"
                >
                  Hủy bỏ
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-[8px] bg-[#5e6ad2] hover:bg-[#4f5dc8] text-white text-[13px] font-semibold cursor-pointer shadow-xs transition-colors"
                >
                  Lưu Cài Đặt Dòng Tiền
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================= MODAL: DETAILED ADD TRANSACTION ================= */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs">
          <div className="bg-white dark:bg-[#0f1011] border border-[#e2e8f0] dark:border-[#23252a] rounded-[12px] p-6 max-w-md w-full shadow-xl space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-[#e2e8f0] dark:border-[#23252a]">
              <h3 className="text-[15px] font-semibold text-[#0f1011] dark:text-[#f7f8f8]">
                {txType === "expense" ? "Ghi Khoản Chi Tiêu Chi Tiết" : "Ghi Khoản Thu Nhập Khác"}
              </h3>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="text-[#64748b] dark:text-[#8a8f98] hover:text-[#0f1011] dark:hover:text-[#f7f8f8] cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form noValidate onSubmit={handleSaveTransaction} className="space-y-3.5">
              {/* Type toggle */}
              <div className="grid grid-cols-2 gap-2 p-1 bg-[#f1f5f9] dark:bg-[#141516] rounded-[8px] border border-[#e2e8f0] dark:border-[#23252a]">
                <button
                  type="button"
                  onClick={() => setTxType("expense")}
                  className={`py-1.5 rounded-[6px] text-xs font-semibold transition-colors cursor-pointer ${
                    txType === "expense"
                      ? "bg-white dark:bg-[#18191a] text-[#0f1011] dark:text-[#f7f8f8] shadow-xs"
                      : "text-[#64748b] dark:text-[#8a8f98]"
                  }`}
                >
                  Khoản Chi
                </button>
                <button
                  type="button"
                  onClick={() => setTxType("income")}
                  className={`py-1.5 rounded-[6px] text-xs font-semibold transition-colors cursor-pointer ${
                    txType === "income"
                      ? "bg-white dark:bg-[#18191a] text-[#10b981] shadow-xs"
                      : "text-[#64748b] dark:text-[#8a8f98]"
                  }`}
                >
                  Khoản Thu
                </button>
              </div>

              <div>
                <label className="block text-[12px] font-medium text-[#334155] dark:text-[#d0d6e0] mb-1">
                  Số tiền (VNĐ)
                </label>
                <input
                  type="text"
                  inputMode="numeric"
                  value={txAmount}
                  onChange={(e) => setTxAmount(formatCurrencyInput(e.target.value))}
                  placeholder="35.000"
                  required
                  className="w-full px-3 py-2 rounded-[8px] border border-[#cbd5e1] dark:border-[#23252a] bg-[#f8fafc] dark:bg-[#141516] text-[#0f1011] dark:text-[#f7f8f8] text-[14px] focus:outline-none focus:ring-2 focus:ring-[#5e6ad2]"
                />
              </div>

              <div>
                <label className="block text-[12px] font-medium text-[#334155] dark:text-[#d0d6e0] mb-1">
                  Nội dung chi tiêu
                </label>
                <input
                  type="text"
                  value={txDesc}
                  onChange={(e) => setTxDesc(e.target.value)}
                  placeholder="Ví dụ: Cơm trưa sườn bì, Đổ xăng 50k, Mua giáo trình..."
                  required
                  className="w-full px-3 py-2 rounded-[8px] border border-[#cbd5e1] dark:border-[#23252a] bg-[#f8fafc] dark:bg-[#141516] text-[#0f1011] dark:text-[#f7f8f8] text-[14px] focus:outline-none focus:ring-2 focus:ring-[#5e6ad2]"
                />

                {aiSuggestion && (
                  <div className="mt-2 p-2 rounded-[6px] bg-[#eef2ff] dark:bg-[#181926] border border-[#c7d2fe] dark:border-[#2d325a] flex items-center justify-between text-xs">
                    <span className="text-[#4338ca] dark:text-[#828fff] flex items-center gap-1.5">
                      <Sparkles className="w-3 h-3 text-[#5e6ad2]" />
                      AI gợi ý: <strong>{aiSuggestion.name}</strong> ({aiSuggestion.confidence}%)
                    </span>
                    <button
                      type="button"
                      onClick={() => setTxCategoryId(aiSuggestion.id)}
                      className="text-[11px] text-[#5e6ad2] dark:text-[#828fff] hover:underline cursor-pointer font-medium"
                    >
                      Áp dụng
                    </button>
                  </div>
                )}
              </div>

              <div>
                <label className="block text-[12px] font-medium text-[#334155] dark:text-[#d0d6e0] mb-1">
                  Danh mục
                </label>
                <select
                  value={txCategoryId}
                  onChange={(e) => setTxCategoryId(Number(e.target.value))}
                  className="w-full px-3 py-2 rounded-[8px] border border-[#cbd5e1] dark:border-[#23252a] bg-[#f8fafc] dark:bg-[#141516] text-[#0f1011] dark:text-[#f7f8f8] text-[14px] focus:outline-none focus:ring-2 focus:ring-[#5e6ad2] cursor-pointer"
                >
                  <option value="">-- Chọn danh mục --</option>
                  {categories
                    .filter((c) => c.type === txType)
                    .map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[12px] font-medium text-[#334155] dark:text-[#d0d6e0] mb-1">
                    Ngày giao dịch
                  </label>
                  <input
                    type="date"
                    value={txDate}
                    onChange={(e) => setTxDate(e.target.value)}
                    className="w-full px-2.5 py-1.5 rounded-[8px] border border-[#cbd5e1] dark:border-[#23252a] bg-[#f8fafc] dark:bg-[#141516] text-[#0f1011] dark:text-[#f7f8f8] text-[13px] focus:outline-none focus:ring-2 focus:ring-[#5e6ad2]"
                  />
                </div>

                <div className="flex items-center gap-2 pt-6">
                  <input
                    type="checkbox"
                    id="recurring"
                    checked={txRecurring}
                    onChange={(e) => setTxRecurring(e.target.checked)}
                    className="rounded border-[#cbd5e1] dark:border-[#23252a] bg-[#f8fafc] dark:bg-[#141516] text-[#5e6ad2] cursor-pointer"
                  />
                  <label htmlFor="recurring" className="text-xs text-[#64748b] dark:text-[#8a8f98] cursor-pointer">
                    Định kỳ hàng tháng
                  </label>
                </div>
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-3.5 py-2 rounded-[8px] bg-[#f1f5f9] dark:bg-[#141516] text-[#64748b] dark:text-[#8a8f98] hover:text-[#0f1011] dark:hover:text-[#f7f8f8] text-[13px] cursor-pointer"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-[8px] bg-[#5e6ad2] hover:bg-[#4f5dc8] text-white text-[13px] font-medium transition-colors cursor-pointer shadow-xs"
                >
                  Lưu Giao Dịch
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================= MODAL: BUDGET SETTING ================= */}
      {isBudgetModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs">
          <div className="bg-white dark:bg-[#0f1011] border border-[#e2e8f0] dark:border-[#23252a] rounded-[12px] p-6 max-w-sm w-full shadow-xl space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-[#e2e8f0] dark:border-[#23252a]">
              <h3 className="text-[15px] font-semibold text-[#0f1011] dark:text-[#f7f8f8]">
                Thiết Lập Hạn Mức Ngân Sách
              </h3>
              <button
                onClick={() => setIsBudgetModalOpen(false)}
                className="text-[#64748b] dark:text-[#8a8f98] hover:text-[#0f1011] dark:hover:text-[#f7f8f8] cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form noValidate onSubmit={handleSaveBudget} className="space-y-3">
              <div>
                <label className="block text-[12px] font-medium text-[#334155] dark:text-[#d0d6e0] mb-1">
                  Danh mục chi tiêu
                </label>
                <select
                  value={budgetCatId}
                  onChange={(e) => setBudgetCatId(Number(e.target.value))}
                  className="w-full px-3 py-2 rounded-[8px] border border-[#cbd5e1] dark:border-[#23252a] bg-[#f8fafc] dark:bg-[#141516] text-[#0f1011] dark:text-[#f7f8f8] text-[14px] cursor-pointer"
                >
                  {categories
                    .filter((c) => c.type === "expense")
                    .map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                </select>
              </div>

              <div>
                <label className="block text-[12px] font-medium text-[#334155] dark:text-[#d0d6e0] mb-1">
                  Hạn mức trần (VNĐ / Tháng {selectedMonth})
                </label>
                <input
                  type="text"
                  inputMode="numeric"
                  value={budgetLimit}
                  onChange={(e) => setBudgetLimit(formatCurrencyInput(e.target.value))}
                  placeholder="2.000.000"
                  required
                  className="w-full px-3 py-2 rounded-[8px] border border-[#cbd5e1] dark:border-[#23252a] bg-[#f8fafc] dark:bg-[#141516] text-[#0f1011] dark:text-[#f7f8f8] text-[14px]"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsBudgetModalOpen(false)}
                  className="px-3 py-1.5 rounded-[8px] bg-[#f1f5f9] dark:bg-[#141516] text-[#64748b] dark:text-[#8a8f98] text-[13px] cursor-pointer"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-[8px] bg-[#5e6ad2] hover:bg-[#4f5dc8] text-white text-[13px] font-medium cursor-pointer shadow-xs"
                >
                  Lưu Hạn Mức
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
