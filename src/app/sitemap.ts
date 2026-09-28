import type { MetadataRoute } from "next";
import { siteUrl } from "@/lib/seo/site-url";

/** Sitemap cho công cụ tìm kiếm: chỉ trang công khai (sitemap trực quan cho người dùng nằm trên trang chủ). */
export default function sitemap(): MetadataRoute.Sitemap {
  const base = siteUrl();
  return [
    { url: `${base}/`, changeFrequency: "weekly", priority: 1 },
    { url: `${base}/register`, changeFrequency: "monthly", priority: 0.8 },
    { url: `${base}/login`, changeFrequency: "monthly", priority: 0.5 },
  ];
}
