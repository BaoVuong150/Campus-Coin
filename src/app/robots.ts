import type { MetadataRoute } from "next";
import { siteUrl } from "@/lib/seo/site-url";

/** Chỉ các trang công khai được lập chỉ mục; trang trong app, quản trị và API thì không. */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: ["/", "/login", "/register"],
      disallow: [
        "/api/",
        "/admin",
        "/dashboard",
        "/transactions",
        "/budgets",
        "/reports",
        "/goals",
        "/recurring",
        "/points",
        "/notifications",
        "/settings",
        "/onboarding",
        "/change-password",
        "/reset-password",
      ],
    },
    sitemap: `${siteUrl()}/sitemap.xml`,
  };
}
