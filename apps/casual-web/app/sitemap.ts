import type { MetadataRoute } from "next";

import { getAbsoluteUrl } from "@/lib/site-metadata";
import { createClient } from "@/lib/supabase/server";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date();
  const baseRoutes: MetadataRoute.Sitemap = [
    {
      url: getAbsoluteUrl("/"),
      lastModified: now,
      changeFrequency: "daily",
      priority: 1,
    },
    {
      url: getAbsoluteUrl("/topics"),
      lastModified: now,
      changeFrequency: "hourly",
      priority: 0.9,
    },
    {
      url: getAbsoluteUrl("/login"),
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.3,
    },
    {
      url: getAbsoluteUrl("/signup"),
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.3,
    },
  ];

  const supabase = await createClient();
  const { data: topics } = await supabase
    .from("casual_topics")
    .select("id, created_at")
    .eq("status", "active")
    .order("created_at", { ascending: false })
    .limit(500);

  const topicRoutes: MetadataRoute.Sitemap = (topics ?? []).map((topic) => ({
    url: getAbsoluteUrl(`/topics/${topic.id}`),
    lastModified: topic.created_at ? new Date(topic.created_at) : now,
    changeFrequency: "daily",
    priority: 0.7,
  }));

  return [...baseRoutes, ...topicRoutes];
}
