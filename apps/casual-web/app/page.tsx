import type { Metadata } from "next";
import Link from "next/link";

import { createClient } from "@/lib/supabase/server";
import {
  buildTagsByTopicId,
  type TopicTag,
  type TopicTagLink,
} from "@/lib/casual-tags";

import { SiteHeader } from "@/components/SiteHeader";
import { PublicShell } from "@/components/PublicShell";
import {
  HeroTopicCarousel,
  type HeroTopicCarouselTopic,
} from "@/components/HeroTopicCarousel";

export const metadata: Metadata = {
  title: {
    absolute: "심포지온 - 가볍게 고르고 짧게 편드는 토론 공간",
  },
  description:
    "일상, 취향, 사회 이슈를 가볍게 고르고 짧게 의견을 나누는 캐주얼 찬반 토론 커뮤니티입니다.",
  alternates: {
    canonical: "/",
  },
};

export const dynamic = "force-dynamic";

function formatCount(value: number) {
  return new Intl.NumberFormat("ko-KR").format(value);
}

export default async function Home() {
  const supabase = await createClient();

  const { data: hotTopics } = await supabase
    .from("active_casual_topics_with_scores")
    .select(
      "id, title, description, option_a, option_b, vote_a_count, vote_b_count, opinion_count, comment_count, view_count, hot_score, trending_score, is_today, created_at, last_activity_at",
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

  const heroTopics = (hotTopics ?? []).map((topic) => ({
    id: topic.id,
    title: topic.title,
    description: topic.description,
    option_a: topic.option_a,
    option_b: topic.option_b,
    vote_a_count: topic.vote_a_count,
    vote_b_count: topic.vote_b_count,
    opinion_count: topic.opinion_count,
    comment_count: topic.comment_count,
    view_count: topic.view_count,
    trending_score: topic.trending_score,
    is_today: topic.is_today,
    tags: tagsByTopicId.get(topic.id) ?? [],
  })) satisfies HeroTopicCarouselTopic[];

  const { data: popularOpinionsData } = await supabase
    .from("casual_opinions")
    .select(
      "id, topic_id, user_id, choice, body, like_count, dislike_count, score, created_at",
    )
    .eq("is_hidden", false)
    .order("score", { ascending: false })
    .order("like_count", { ascending: false })
    .order("created_at", { ascending: false })
    .limit(50);

  const popularOpinionCandidates = popularOpinionsData ?? [];
  const popularOpinionTopicIds = Array.from(
    new Set(popularOpinionCandidates.map((opinion) => opinion.topic_id)),
  );

  const { data: opinionTopicsData } =
    popularOpinionTopicIds.length > 0
      ? await supabase
          .from("casual_topics")
          .select("id, title, option_a, option_b")
          .eq("status", "active")
          .in("id", popularOpinionTopicIds)
      : { data: [] };

  const topicById = new Map(
    (opinionTopicsData ?? []).map((topic) => [topic.id, topic]),
  );

  const popularOpinions = popularOpinionCandidates
    .filter((opinion) => topicById.has(opinion.topic_id))
    .slice(0, 5);

  const opinionUserIds = Array.from(
    new Set(popularOpinions.map((opinion) => opinion.user_id)),
  );

  const { data: opinionProfilesData } =
    opinionUserIds.length > 0
      ? await supabase
          .from("casual_profiles")
          .select("user_id, nickname, avatar_url")
          .in("user_id", opinionUserIds)
      : { data: [] };

  const profileByUserId = new Map(
    (opinionProfilesData ?? []).map((profile) => [profile.user_id, profile]),
  );

  return (
    <main className="casual-page-bg min-h-screen text-[#2f2118]">
      <SiteHeader />
      <PublicShell>
        <section className="flex min-h-screen flex-col py-4 lg:py-6">
          <HeroTopicCarousel topics={heroTopics} />

          <section id="opinions" className="mt-8 pb-16">
            <div className="mb-5">
              <p className="text-sm font-bold text-orange-700">
                POPULAR OPINIONS
              </p>
              <h3 className="mt-1 text-2xl font-black">인기 의견</h3>
              <p className="mt-2 text-sm text-stone-600">
                공감이 많이 모인 의견들이 여기에 표시됩니다.
              </p>
            </div>

            <div className="grid gap-4 lg:grid-cols-5">
              {popularOpinions.map((opinion) => {
                const opinionProfile = profileByUserId.get(opinion.user_id);
                const opinionTopic = topicById.get(opinion.topic_id);

                const sideName =
                  opinion.choice === "a"
                    ? opinionTopic?.option_a
                    : opinionTopic?.option_b;

                return (
                  <Link
                    key={opinion.id}
                    href={`/topics/${opinion.topic_id}`}
                    className="rounded-3xl border border-orange-100 bg-white p-5 shadow-sm transition hover:-translate-y-1 hover:shadow-lg lg:col-span-1"
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-orange-100 text-sm font-black text-orange-900">
                        {(opinionProfile?.nickname ?? "익명").slice(0, 1)}
                      </div>

                      <div className="min-w-0">
                        <p className="truncate text-sm font-black">
                          {opinionProfile?.nickname ?? "알 수 없음"}
                        </p>
                        <p className="truncate text-xs font-bold text-orange-700">
                          {sideName ?? "선택"} 측
                        </p>
                      </div>
                    </div>

                    <p className="mt-4 line-clamp-4 text-sm leading-6 text-stone-700">
                      {opinion.body}
                    </p>

                    <div className="mt-4 rounded-2xl bg-stone-50 p-3">
                      <p className="line-clamp-1 text-xs font-bold text-stone-500">
                        {opinionTopic?.title ?? "주제"}
                      </p>

                      <div className="mt-2 flex flex-wrap gap-2 text-xs font-black text-stone-600">
                        <span>공감 {formatCount(opinion.like_count)}</span>
                        <span>·</span>
                        <span>비공감 {formatCount(opinion.dislike_count)}</span>
                        <span>·</span>
                        <span>점수 {formatCount(opinion.score)}</span>
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>

            {popularOpinions.length === 0 && (
              <div className="rounded-3xl border border-orange-100 bg-white p-8 text-center">
                <h4 className="text-xl font-black">아직 인기 의견이 없습니다.</h4>
                <p className="mt-2 text-sm text-stone-600">
                  사용자가 의견을 작성하고 공감을 받으면 이곳에 표시됩니다.
                </p>
              </div>
            )}
          </section>
        </section>
      </PublicShell>
    </main>
  );
}
