import type { MetadataRoute } from "next";

import { SITE_URL } from "@/lib/seo";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: [
        "/admin",
        "/admin/",
        "/admin/*",
        "/me",
        "/me/",
        "/me/*",
        "/settings",
        "/settings/",
        "/settings/*",
        "/reset-password",
        "/reset-password/",
        "/auth",
        "/auth/",
        "/auth/*",
        "/api",
        "/api/",
        "/api/*",
      ],
    },
    sitemap: `${SITE_URL}/sitemap.xml`,
    host: SITE_URL,
  };
}
