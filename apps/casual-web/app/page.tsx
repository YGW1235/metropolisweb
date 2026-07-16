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
import { TopicTagBadges } from "@/components/TopicTagBadges";

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

function getPercent(value: number, total: number) {
  if (total <= 0) return 0;
  return Math.round((value / total) * 100);
}

function formatCount(value: number) {
  return new Intl.NumberFormat("ko-KR").format(value);
}

export default async function Home() {
  const supabase = await createClient();

  const { data: todayTopic } = await supabase
    .from("casual_topics")
    .select(
      "id, title, description, option_a, option_b, vote_a_count, vote_b_count, opinion_count, comment_count, view_count, hot_score, is_today, created_at",
    )
    .eq("status", "active")
    .eq("is_today", true)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  const { data: hotTopics } = await supabase
    .from("active_casual_topics_with_scores")
    .select(
      "id, title, description, option_a, option_b, vote_a_count, vote_b_count, opinion_count, comment_count, view_count, hot_score, trending_score, is_today, created_at, last_activity_at",
    )
    .order("is_today", { ascending: false })
    .order("trending_score", { ascending: false })
    .order("created_at", { ascending: false })
    .limit(6);

  const visibleTopicIds = Array.from(
    new Set([
      ...(todayTopic ? [todayTopic.id] : []),
      ...(hotTopics ?? []).map((topic) => topic.id),
    ]),
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

  const todayTotalVotes = todayTopic
    ? todayTopic.vote_a_count + todayTopic.vote_b_count
    : 0;

  const todayAPercent = todayTopic
    ? getPercent(todayTopic.vote_a_count, todayTotalVotes)
    : 0;

  const todayBPercent = todayTopic
    ? getPercent(todayTopic.vote_b_count, todayTotalVotes)
    : 0;

  return (
    <main className="min-h-screen bg-[#fff7ed] text-[#2f2118]">
      <SiteHeader />
      <PublicShell>
      <section className="flex min-h-screen flex-col py-4 lg:py-6">

        <section className="grid flex-1 items-center gap-10 py-16 lg:grid-cols-[1.05fr_0.95fr]">
          <div>
            <p className="mb-4 inline-flex rounded-full bg-orange-100 px-4 py-2 text-sm font-bold text-orange-800">
              캐주얼 찬반 광장
            </p>

            <h2 className="text-5xl font-black leading-tight tracking-tight sm:text-6xl">
              가볍게 고르고,
              <br />
              짧게 편들고,
              <br />
              재미있게 논쟁하세요.
            </h2>

            <p className="mt-6 max-w-xl text-lg leading-8 text-stone-700">
              심포지온은 일상적인 찬반, 취향 논쟁, 밸런스게임을 빠르게
              고르고 의견을 나누는 캐주얼 토론 공간입니다.
            </p>

            <div className="mt-8 flex flex-wrap gap-3">
              {todayTopic ? (
                <Link
                  href={`/topics/${todayTopic.id}`}
                  className="rounded-full bg-stone-950 px-6 py-3 text-sm font-bold text-white shadow-lg transition hover:-translate-y-0.5"
                >
                  오늘의 논쟁 참여하기
                </Link>
              ) : (
                <Link
                  href="/topics"
                  className="rounded-full bg-stone-950 px-6 py-3 text-sm font-bold text-white shadow-lg transition hover:-translate-y-0.5"
                >
                  주제 보러가기
                </Link>
              )}

              <Link
                href="/topics"
                className="rounded-full border border-stone-300 bg-white px-6 py-3 text-sm font-bold text-stone-800 transition hover:-translate-y-0.5"
              >
                인기 주제 보기
              </Link>
            </div>
          </div>

          <div
            id="today"
            className="rounded-[2rem] border border-orange-200 bg-white p-6 shadow-2xl shadow-orange-200/60"
          >
            <p className="text-sm font-bold text-orange-700">TRENDING TOPICS</p>
            <h3 className="mt-1 text-2xl font-black">급상승 주제</h3>

            {todayTopic ? (
              <>
                <h3 className="mt-3 text-3xl font-black">
                  {todayTopic.title}
                </h3>

                <p className="mt-3 leading-7 text-stone-600">
                  {todayTopic.description}
                </p>

                <TopicTagBadges
                  className="mt-4"
                  linked
                  tags={tagsByTopicId.get(todayTopic.id) ?? []}
                />

                <div className="mt-6 grid gap-3 sm:grid-cols-2">
                  <Link
                    href={`/topics/${todayTopic.id}`}
                    className="rounded-2xl bg-orange-500 px-5 py-5 text-left font-black text-white transition hover:-translate-y-0.5 hover:bg-orange-600"
                  >
                    {todayTopic.option_a}
                    <span className="mt-1 block text-sm font-semibold text-orange-100">
                      A 입장으로 참여하기
                    </span>
                  </Link>

                  <Link
                    href={`/topics/${todayTopic.id}`}
                    className="rounded-2xl bg-stone-900 px-5 py-5 text-left font-black text-white transition hover:-translate-y-0.5 hover:bg-stone-800"
                  >
                    {todayTopic.option_b}
                    <span className="mt-1 block text-sm font-semibold text-stone-300">
                      B 입장으로 참여하기
                    </span>
                  </Link>
                </div>

                <div className="mt-6 rounded-2xl bg-orange-50 p-4">
                  <p className="text-sm font-bold text-stone-700">
                    현재 {formatCount(todayTotalVotes)}명 참여
                  </p>

                  <div className="mt-3 h-3 overflow-hidden rounded-full bg-stone-200">
                    <div
                      className="h-full rounded-full bg-orange-500"
                      style={{ width: `${todayAPercent}%` }}
                    />
                  </div>

                  <div className="mt-2 flex justify-between gap-4 text-sm font-bold text-stone-600">
                    <span>
                      {todayTopic.option_a} {todayAPercent}%
                    </span>
                    <span>
                      {todayTopic.option_b} {todayBPercent}%
                    </span>
                  </div>

                  <div className="mt-4 flex flex-wrap gap-2 text-xs font-bold text-stone-500">
                    <span>의견 {formatCount(todayTopic.opinion_count)}</span>
                    <span>·</span>
                    <span>댓글 {formatCount(todayTopic.comment_count)}</span>
                    <span>·</span>
                    <span>조회 {formatCount(todayTopic.view_count)}</span>
                  </div>
                </div>
              </>
            ) : (
              <div className="mt-6 rounded-2xl bg-stone-50 p-6 text-center">
                <h3 className="text-xl font-black">
                  오늘의 논쟁이 아직 없습니다.
                </h3>

                <Link
                  href="/topics"
                  className="mt-5 inline-flex rounded-full bg-stone-950 px-5 py-3 text-sm font-black text-white"
                >
                  주제 목록 보기
                </Link>
              </div>
            )}
          </div>
        </section>

        <section id="topics" className="pb-12">
          <div className="mb-5 flex items-end justify-between gap-4">
            <div>
              <p className="text-sm font-bold text-orange-700">HOT TOPICS</p>
              <h3 className="mt-1 text-2xl font-black">인기 주제</h3>
            </div>
            <Link href="/topics" className="text-sm font-bold text-stone-600">
              전체 보기
            </Link>
          </div>

          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {(hotTopics ?? []).map((topic) => {
              const totalVotes = topic.vote_a_count + topic.vote_b_count;
              const aPercent = getPercent(topic.vote_a_count, totalVotes);
              const bPercent = getPercent(topic.vote_b_count, totalVotes);

              return (
                <Link
                  key={topic.id}
                  href={`/topics/${topic.id}`}
                  className="group rounded-3xl border border-orange-100 bg-white p-5 shadow-sm transition hover:-translate-y-1 hover:shadow-lg"
                >
                  <div className="flex items-center justify-between gap-2">
                    {topic.is_today ? (
                      <span className="rounded-full bg-orange-100 px-3 py-1 text-xs font-black text-orange-800">
                        오늘의 논쟁
                      </span>
                    ) : (
                      <span className="rounded-full bg-stone-100 px-3 py-1 text-xs font-black text-stone-600">
                        인기 주제
                      </span>
                    )}

                    <span className="text-xs font-bold text-stone-500">
                      조회 {formatCount(topic.view_count)}
                    </span>
                  </div>

                  <h4 className="mt-4 text-xl font-black group-hover:text-orange-700">
                    {topic.title}
                  </h4>

                  <p className="mt-3 line-clamp-2 text-sm leading-6 text-stone-600">
                    {topic.description}
                  </p>

                  <TopicTagBadges
                    className="mt-4"
                    tags={tagsByTopicId.get(topic.id) ?? []}
                  />

                  <div className="mt-5 space-y-2">
                    <div>
                      <div className="flex justify-between text-xs font-bold text-stone-600">
                        <span>{topic.option_a}</span>
                        <span>{aPercent}%</span>
                      </div>
                      <div className="mt-1 h-2 overflow-hidden rounded-full bg-stone-100">
                        <div
                          className="h-full rounded-full bg-orange-500"
                          style={{ width: `${aPercent}%` }}
                        />
                      </div>
                    </div>

                    <div>
                      <div className="flex justify-between text-xs font-bold text-stone-600">
                        <span>{topic.option_b}</span>
                        <span>{bPercent}%</span>
                      </div>
                      <div className="mt-1 h-2 overflow-hidden rounded-full bg-stone-100">
                        <div
                          className="h-full rounded-full bg-stone-950"
                          style={{ width: `${bPercent}%` }}
                        />
                      </div>
                    </div>
                  </div>

                  <div className="mt-5 flex flex-wrap gap-2 text-xs font-bold text-stone-500">
                    <span>투표 {formatCount(totalVotes)}</span>
                    <span>·</span>
                    <span>의견 {formatCount(topic.opinion_count)}</span>
                    <span>·</span>
                    <span>점수 {Math.round(Number(topic.hot_score ?? 0))}</span>
                  </div>
                </Link>
              );
            })}
          </div>

          {(hotTopics ?? []).length === 0 && (
            <div className="rounded-3xl border border-orange-100 bg-white p-8 text-center">
              <h4 className="text-xl font-black">아직 인기 주제가 없습니다.</h4>
              <p className="mt-2 text-sm text-stone-600">
                활성 주제를 추가하면 이곳에 표시됩니다.
              </p>
            </div>
          )}
        </section>

        <section id="opinions" className="pb-16">
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
