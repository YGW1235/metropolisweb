import type { MetadataRoute } from "next";

import { getAbsoluteUrl } from "@/lib/site-metadata";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/admin/", "/me", "/notifications", "/settings/"],
    },
    sitemap: getAbsoluteUrl("/sitemap.xml"),
  };
}
