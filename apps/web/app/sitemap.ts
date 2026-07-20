import type { MetadataRoute } from "next";

import { getAbsoluteUrl } from "@/lib/seo";
import { createPublicClient } from "@/lib/supabase/public";

export const dynamic = "force-dynamic";

type TopicSitemapRow = {
  id: string;
  updated_at: string | null;
  created_at: string | null;
};

type NoticeSitemapRow = {
  id: string;
  updated_at: string | null;
  published_at: string | null;
  created_at: string | null;
};

const staticRoutes: MetadataRoute.Sitemap = [
  {
    url: getAbsoluteUrl("/"),
    lastModified: new Date(),
    changeFrequency: "daily",
    priority: 1,
  },
  {
    url: getAbsoluteUrl("/topics"),
    lastModified: new Date(),
    changeFrequency: "daily",
    priority: 0.9,
  },
  {
    url: getAbsoluteUrl("/notices"),
    lastModified: new Date(),
    changeFrequency: "weekly",
    priority: 0.7,
  },
  {
    url: getAbsoluteUrl("/contact"),
    lastModified: new Date(),
    changeFrequency: "monthly",
    priority: 0.5,
  },
  {
    url: getAbsoluteUrl("/terms"),
    lastModified: new Date(),
    changeFrequency: "monthly",
    priority: 0.4,
  },
  {
    url: getAbsoluteUrl("/privacy"),
    lastModified: new Date(),
    changeFrequency: "monthly",
    priority: 0.4,
  },
  {
    url: getAbsoluteUrl("/login"),
    lastModified: new Date(),
    changeFrequency: "monthly",
    priority: 0.3,
  },
];

function toLastModified(...values: Array<string | null | undefined>) {
  const firstValue = values.find(Boolean);

  return firstValue ? new Date(firstValue) : new Date();
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const routes: MetadataRoute.Sitemap = [...staticRoutes];

  try {
    const supabase = createPublicClient();

    const { data: topics, error: topicsError } = await supabase
      .from("topics")
      .select("id, updated_at, created_at")
      .is("deleted_at", null)
      .in("status", ["open", "active", "closed"]);

    if (topicsError) {
      console.error("Sitemap topics query failed", topicsError);
    } else {
      for (const topic of (topics ?? []) as TopicSitemapRow[]) {
        routes.push({
          url: getAbsoluteUrl(`/topics/${topic.id}`),
          lastModified: toLastModified(topic.updated_at, topic.created_at),
          changeFrequency: "weekly",
          priority: 0.8,
        });
      }
    }

    const { data: notices, error: noticesError } = await supabase
      .from("notices")
      .select("id, updated_at, published_at, created_at")
      .eq("status", "published");

    if (noticesError) {
      console.error("Sitemap notices query failed", noticesError);
    } else {
      for (const notice of (notices ?? []) as NoticeSitemapRow[]) {
        routes.push({
          url: getAbsoluteUrl(`/notices/${notice.id}`),
          lastModified: toLastModified(
            notice.updated_at,
            notice.published_at,
            notice.created_at,
          ),
          changeFrequency: "monthly",
          priority: 0.6,
        });
      }
    }
  } catch (error) {
    console.error("Sitemap dynamic routes failed", error);
  }

  return routes;
}
