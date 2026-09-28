import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Script from "next/script";
import { ThemeProvider } from "@/context/ThemeContext";
import { ToastProvider } from "@/context/ToastContext";
import { I18nProvider } from "@/i18n/provider";
import { getLocale, getServerMessages } from "@/i18n/server";
import { THEME_INIT_SCRIPT } from "@/lib/theme-script";

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin", "latin-ext"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });

export async function generateMetadata(): Promise<Metadata> {
  const t = await getServerMessages();
  return {
    title: { default: "Campus Coin", template: "%s · Campus Coin" },
    description: t.meta.description,
    keywords: ["Campus Coin", "student finance", "quản lý tài chính sinh viên", "budget", "Techwiz 7"],
  };
}

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  // Cho nội dung trải tới mép màn hình tai thỏ; header/thanh dưới tự chừa env(safe-area-inset-*).
  viewportFit: "cover",
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f7f8f7" },
    { media: "(prefers-color-scheme: dark)", color: "#0c0e0d" },
  ],
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const locale = await getLocale();
  return (
    <html lang={locale} suppressHydrationWarning className={`${geistSans.variable} ${geistMono.variable} h-full`}>
      <body className="min-h-full antialiased">
        {/* Áp theme trước khi hydrate để không bị nháy màu; next/script thay cho thẻ <script> mà React 19 cảnh báo. */}
        <Script id="theme-init" strategy="beforeInteractive" dangerouslySetInnerHTML={{ __html: THEME_INIT_SCRIPT }} />
        <ThemeProvider>
          <I18nProvider initialLocale={locale}>
            <ToastProvider>{children}</ToastProvider>
          </I18nProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
