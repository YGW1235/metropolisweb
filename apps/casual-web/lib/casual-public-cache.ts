import { unstable_cache } from "next/cache";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";

import {
  buildTagsByTopicId,
  type TopicTag,
  type TopicTagLink,
} from "@/lib/casual-tags";
import { withPerfLog } from "@/lib/perf-log";

type TopicTagAsideTopic = {
  id: string;
  title: string;
  opinion_count: number | null;
  view_count: number | null;
  last_activity_at: string | null;
  created_at: string | null;
};

export type TopicTagAsideData = {
  tags: TopicTag[];
  topicsByTagId: Record<string, TopicTagAsideTopic[]>;
};

type HomeHeroTopicRow = {
  id: string;
  title: string;
  description: string | null;
  option_a: string;
  option_b: string;
  vote_a_count: number | null;
  vote_b_count: number | null;
  opinion_count: number | null;
  comment_count: number | null;
  view_count: number | null;
  trending_score: number | null;
  is_today: boolean | null;
};

export type CachedHomeHeroTopic = HomeHeroTopicRow & {
  tags: TopicTag[];
};

type PopularOpinionRow = {
  id: string;
  topic_id: string;
  user_id: string;
  choice: "a" | "b";
  body: string;
  like_count: number | null;
  dislike_count: number | null;
  score: number | null;
  created_at: string;
};

type PopularOpinionTopic = {
  id: string;
  title: string;
  option_a: string;
  option_b: string;
};

type PopularOpinionProfile = {
  user_id: string;
  nickname: string;
  avatar_url: string | null;
};

export type CachedPopularOpinion = PopularOpinionRow & {
  topic: PopularOpinionTopic;
  profile: PopularOpinionProfile | null;
};

function createPublicSupabaseClient() {
  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      auth: {
        autoRefreshToken: false,
        detectSessionInUrl: false,
        persistSession: false,
      },
    },
  );
}

export const getCachedTopicTagAsideData = unstable_cache(
  async (): Promise<TopicTagAsideData> =>
    withPerfLog("topic tag aside 조회", async () => {
      const supabase = createPublicSupabaseClient();

      const { data: tagsData } = await supabase
        .from("casual_topic_tags")
        .select("id, name, slug")
        .order("name", { ascending: true });

      const tags = (tagsData ?? []) as TopicTag[];

      const { data: activeTopicsData } = await supabase
        .from("active_casual_topics_with_scores")
        .select(
          "id, title, opinion_count, view_count, last_activity_at, created_at",
        )
        .order("trending_score", { ascending: false })
        .order("last_activity_at", { ascending: false })
        .limit(1000);

      const activeTopics = (activeTopicsData ?? []) as TopicTagAsideTopic[];
      const activeTopicIds = activeTopics.map((topic) => topic.id);
      const topicById = new Map(
        activeTopics.map((topic) => [topic.id, topic]),
      );

      const { data: tagLinksData } =
        activeTopicIds.length > 0
          ? await supabase
              .from("casual_topic_tag_links")
              .select("topic_id, tag_id")
              .in("topic_id", activeTopicIds)
          : { data: [] };

      const topicsByTagId: Record<string, TopicTagAsideTopic[]> = {};

      for (const link of (tagLinksData ?? []) as TopicTagLink[]) {
        const topic = topicById.get(link.topic_id);

        if (!topic) {
          continue;
        }

        topicsByTagId[link.tag_id] = topicsByTagId[link.tag_id] ?? [];
        topicsByTagId[link.tag_id].push(topic);
      }

      return { tags, topicsByTagId };
    }),
  ["casual-public-topic-tag-aside-v1"],
  { revalidate: 180 },
);

export const getCachedHomeHeroTopics = unstable_cache(
  async (): Promise<CachedHomeHeroTopic[]> =>
    withPerfLog("home hero topics 조회", async () => {
      const supabase = createPublicSupabaseClient();

      const { data: hotTopics } = await supabase
        .from("active_casual_topics_with_scores")
        .select(
          "id, title, description, option_a, option_b, vote_a_count, vote_b_count, opinion_count, comment_count, view_count, trending_score, is_today",
        )
        .order("is_today", { ascending: false })
        .order("trending_score", { ascending: false })
        .order("created_at", { ascending: false })
        .limit(8);

      const visibleTopicIds = Array.from(
        new Set((hotTopics ?? []).map((topic) => topic.id)),
      );

      const { data: allTagsData } = await supabase
        .from("casual_topic_tags")
        .select("id, name, slug")
        .order("name", { ascending: true });

      const { data: topicTagLinksData } =
        visibleTopicIds.length > 0
          ? await supabase
              .from("casual_topic_tag_links")
              .select("topic_id, tag_id")
              .in("topic_id", visibleTopicIds)
          : { data: [] };

      const tagsByTopicId = buildTagsByTopicId(
        visibleTopicIds,
        (allTagsData ?? []) as TopicTag[],
        (topicTagLinksData ?? []) as TopicTagLink[],
      );

      return ((hotTopics ?? []) as HomeHeroTopicRow[]).map((topic) => ({
        ...topic,
        tags: tagsByTopicId.get(topic.id) ?? [],
      }));
    }),
  ["casual-public-home-hero-topics-v1"],
  { revalidate: 60 },
);

export const getCachedPopularOpinions = unstable_cache(
  async (): Promise<CachedPopularOpinion[]> =>
    withPerfLog("popular opinions 조회", async () => {
      const supabase = createPublicSupabaseClient();

      const { data: opinionsData } = await supabase
        .from("casual_opinions")
        .select(
          "id, topic_id, user_id, choice, body, like_count, dislike_count, score, created_at",
        )
        .eq("is_hidden", false)
        .order("score", { ascending: false })
        .order("like_count", { ascending: false })
        .order("created_at", { ascending: false })
        .limit(50);

      const opinionCandidates = (opinionsData ?? []) as PopularOpinionRow[];
      const topicIds = Array.from(
        new Set(opinionCandidates.map((opinion) => opinion.topic_id)),
      );

      const { data: topicsData } =
        topicIds.length > 0
          ? await supabase
              .from("casual_topics")
              .select("id, title, option_a, option_b")
              .eq("status", "active")
              .in("id", topicIds)
          : { data: [] };

      const topicById = new Map(
        ((topicsData ?? []) as PopularOpinionTopic[]).map((topic) => [
          topic.id,
          topic,
        ]),
      );

      const popularOpinions = opinionCandidates
        .filter((opinion) => topicById.has(opinion.topic_id))
        .slice(0, 5);

      const userIds = Array.from(
        new Set(popularOpinions.map((opinion) => opinion.user_id)),
      );

      const { data: profilesData } =
        userIds.length > 0
          ? await supabase
              .from("casual_profiles")
              .select("user_id, nickname, avatar_url")
              .in("user_id", userIds)
          : { data: [] };

      const profileByUserId = new Map(
        ((profilesData ?? []) as PopularOpinionProfile[]).map((profile) => [
          profile.user_id,
          profile,
        ]),
      );

      return popularOpinions.flatMap((opinion) => {
        const topic = topicById.get(opinion.topic_id);

        if (!topic) {
          return [];
        }

        return [
          {
            ...opinion,
            topic,
            profile: profileByUserId.get(opinion.user_id) ?? null,
          },
        ];
      });
    }),
  ["casual-public-popular-opinions-v1"],
  { revalidate: 60 },
);
