import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/context/ThemeContext";
import { ToastProvider } from "@/context/ToastContext";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Campus Coin - Smart Spending Student Style | Techwiz 7",
  description:
    "Ứng dụng quản lý tài chính thông minh cho sinh viên. Tích hợp AI phân loại chi tiêu, gợi ý mẹo tiết kiệm và báo cáo trực quan. Dự án tham dự Techwiz 7 - Aptech.",
  keywords: [
    "Campus Coin",
    "Techwiz 7",
    "NextGen BudgetBee",
    "Student Expense Tracker",
    "AI Financial Assistant",
    "Quản lý tài chính sinh viên",
  ],
  authors: [{ name: "Techwiz 7 Team" }],
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="vi"
      suppressHydrationWarning
      data-font-size="normal"
      className={`dark ${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col font-sans">
        <ThemeProvider>
          <ToastProvider>{children}</ToastProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
