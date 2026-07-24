import type { Metadata } from "next";
import Link from "next/link";

import { createClient } from "@/lib/supabase/server";
import {
  buildTagsByTopicId,
  normalizeTagSlug,
  type TopicTag,
  type TopicTagLink,
} from "@/lib/casual-tags";
import { withPerfLog } from "@/lib/perf-log";

import { SiteHeader } from "@/components/SiteHeader";
import { PublicShell } from "@/components/PublicShell";
import { TopicTagBadges } from "@/components/TopicTagBadges";

export const metadata: Metadata = {
  title: "주제 둘러보기",
  description:
    "심포지온의 캐주얼 찬반 주제를 검색하고 태그와 정렬로 골라 참여해보세요.",
  alternates: {
    canonical: "/topics",
  },
};

export const dynamic = "force-dynamic";

type SearchParams = Promise<{
  message?: string;
  type?: "success" | "error";
  q?: string;
  sort?: string;
  tag?: string;
}>;

type SortMode = "trending" | "hot" | "new" | "views";

const SORT_OPTIONS: { label: string; value: SortMode }[] = [
  { label: "최신", value: "new" },
  { label: "급상승", value: "trending" },
  { label: "공감 순", value: "hot" },
  { label: "조회 많은 순", value: "views" },
];

function getPercent(value: number, total: number) {
  if (total <= 0) return 0;
  return Math.round((value / total) * 100);
}

function getSortMode(value?: string): SortMode {
  if (
    value === "trending" ||
    value === "hot" ||
    value === "new" ||
    value === "views"
  ) {
    return value;
  }

  return "new";
}

function getSearchQuery(value?: string) {
  return value?.trim() ?? "";
}

function getSearchPattern(query: string) {
  return `%${query.replace(/[(),]/g, " ")}%`;
}

function getTopicsHref(sort: SortMode, query: string, tagSlug: string) {
  const params = new URLSearchParams({ sort });

  if (query) {
    params.set("q", query);
  }

  if (tagSlug) {
    params.set("tag", tagSlug);
  }

  return `/topics?${params.toString()}`;
}

export default async function TopicsPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const params = await searchParams;
  const sort = getSortMode(params.sort);
  const searchQuery = getSearchQuery(params.q);
  const requestedTagSlug = normalizeTagSlug(params.tag);
  const supabase = await createClient();

  const { data: allTagsData, error: tagsError } = await supabase
    .from("casual_topic_tags")
    .select("id, name, slug")
    .order("name", { ascending: true });

  if (tagsError) {
    return (
      <main className="min-h-screen bg-red-50 p-8 text-red-900">
        <h1 className="text-2xl font-black">태그 목록을 불러오지 못했습니다.</h1>
        <pre className="mt-4 whitespace-pre-wrap rounded-xl bg-white p-4 text-sm">
          {tagsError.message}
        </pre>
      </main>
    );
  }

  const allTags = (allTagsData ?? []) as TopicTag[];
  const selectedTag = allTags.find((tag) => tag.slug === requestedTagSlug);
  let taggedTopicIds: string[] | null = null;

  if (requestedTagSlug) {
    if (selectedTag) {
      const { data: selectedTagLinksData, error: selectedTagLinksError } =
        await supabase
          .from("casual_topic_tag_links")
          .select("topic_id")
          .eq("tag_id", selectedTag.id);

      if (selectedTagLinksError) {
        return (
          <main className="min-h-screen bg-red-50 p-8 text-red-900">
            <h1 className="text-2xl font-black">
              태그 필터를 불러오지 못했습니다.
            </h1>
            <pre className="mt-4 whitespace-pre-wrap rounded-xl bg-white p-4 text-sm">
              {selectedTagLinksError.message}
            </pre>
          </main>
        );
      }

      taggedTopicIds = (selectedTagLinksData ?? []).map(
        (link) => link.topic_id,
      );
    } else {
      taggedTopicIds = [];
    }
  }

  let topicsQuery = supabase
    .from("active_casual_topics_with_scores")
    .select(
      "id, title, description, option_a, option_b, vote_a_count, vote_b_count, opinion_count, comment_count, view_count, hot_score, trending_score, is_today, created_at, last_activity_at",
    )
    .order("is_today", { ascending: false });

  if (searchQuery) {
    const searchPattern = getSearchPattern(searchQuery);

    topicsQuery = topicsQuery.or(
      `title.ilike.${searchPattern},description.ilike.${searchPattern}`,
    );
  }

  if (sort === "hot") {
    topicsQuery = topicsQuery
      .order("hot_score", { ascending: false })
      .order("created_at", { ascending: false });
  } else if (sort === "new") {
    topicsQuery = topicsQuery.order("created_at", { ascending: false });
  } else if (sort === "views") {
    topicsQuery = topicsQuery
      .order("view_count", { ascending: false })
      .order("created_at", { ascending: false });
  } else {
    topicsQuery = topicsQuery
      .order("trending_score", { ascending: false })
      .order("created_at", { ascending: false });
  }

  if (taggedTopicIds && taggedTopicIds.length > 0) {
    topicsQuery = topicsQuery.in("id", taggedTopicIds);
  }

  const { data: topics, error } =
    taggedTopicIds?.length === 0
      ? { data: [], error: null }
      : await withPerfLog("topics page 목록 조회", async () => await topicsQuery);

  if (error) {
    return (
      <main className="min-h-screen bg-red-50 p-8 text-red-900">
        <h1 className="text-2xl font-black">주제 목록을 불러오지 못했습니다.</h1>
        <pre className="mt-4 whitespace-pre-wrap rounded-xl bg-white p-4 text-sm">
          {error.message}
        </pre>
      </main>
    );
  }

  const topicIds = (topics ?? []).map((topic) => topic.id);
  const { data: topicTagLinksData } =
    topicIds.length > 0
      ? await supabase
          .from("casual_topic_tag_links")
          .select("topic_id, tag_id")
          .in("topic_id", topicIds)
      : { data: [] };

  const tagsByTopicId = buildTagsByTopicId(
    topicIds,
    allTags,
    (topicTagLinksData ?? []) as TopicTagLink[],
  );

  return (
    <main className="casual-page-bg min-h-screen text-[#2f2118]">
      <SiteHeader />
      <PublicShell activeTagSlug={requestedTagSlug}>
      <section className="w-full">

        {params.message && (
          <div
            className={`mt-6 rounded-2xl p-4 text-sm font-bold ${
              params.type === "error"
                ? "bg-red-50 text-red-700"
                : "bg-green-50 text-green-700"
            }`}
          >
            {params.message}
          </div>
        )}

        <form
          action="/topics"
          method="GET"
          className="mt-6 rounded-3xl border border-orange-100 bg-white p-4 shadow-sm"
        >
          <input type="hidden" name="sort" value={sort} />
          {requestedTagSlug && (
            <input type="hidden" name="tag" value={requestedTagSlug} />
          )}
          <label className="sr-only" htmlFor="topic-search">
            주제 검색
          </label>

          <div className="flex flex-col gap-3 sm:flex-row">
            <input
              id="topic-search"
              name="q"
              type="search"
              defaultValue={searchQuery}
              placeholder="제목이나 설명으로 검색"
              className="min-h-12 flex-1 rounded-2xl border border-orange-100 bg-orange-50/40 px-4 py-3 text-sm font-bold text-stone-800 outline-none placeholder:text-stone-400 focus:border-orange-400 focus:bg-white"
            />
            <button className="rounded-2xl bg-stone-950 px-5 py-3 text-sm font-black text-white transition hover:-translate-y-0.5">
              검색
            </button>
          </div>

          {searchQuery && (
            <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
              <p className="text-sm font-bold text-stone-600">
                “{searchQuery}” 검색 중
              </p>
              <Link
                href={getTopicsHref(sort, "", requestedTagSlug)}
                className="text-sm font-black text-orange-700 underline underline-offset-4"
              >
                검색 초기화
              </Link>
            </div>
          )}
        </form>

        <div className="mt-5 rounded-3xl border border-orange-100 bg-white p-4 shadow-sm">
          <p className="text-sm font-black text-stone-700">태그 필터</p>
          <div className="mt-3 flex flex-wrap gap-2">
            <Link
              href={getTopicsHref(sort, searchQuery, "")}
              className={`rounded-full px-4 py-2 text-sm font-black transition ${
                requestedTagSlug
                  ? "bg-stone-100 text-stone-700 hover:bg-stone-200"
                  : "bg-orange-500 text-white"
              }`}
            >
              전체
            </Link>

            {allTags.map((tag) => (
              <Link
                key={tag.id}
                href={getTopicsHref(sort, searchQuery, tag.slug)}
                className={`rounded-full px-4 py-2 text-sm font-black transition ${
                  requestedTagSlug === tag.slug
                    ? "bg-orange-500 text-white"
                    : "bg-orange-50 text-orange-800 hover:bg-orange-100"
                }`}
              >
                #{tag.name}
              </Link>
            ))}
          </div>
        </div>

        <div className="mt-6 flex flex-wrap gap-2">
          {SORT_OPTIONS.map((option) => (
            <Link
              key={option.value}
              href={getTopicsHref(option.value, searchQuery, requestedTagSlug)}
              className={`rounded-full px-4 py-2 text-sm font-black transition ${
                sort === option.value
                  ? "bg-orange-500 text-white"
                  : "bg-white text-stone-700 hover:bg-stone-50"
              }`}
            >
              {option.label}
            </Link>
          ))}
        </div>

        <div className="mt-8 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {topics?.map((topic) => {
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
                    조회 {topic.view_count}
                  </span>
                </div>

                <h2 className="mt-4 text-xl font-black group-hover:text-orange-700">
                  {topic.title}
                </h2>

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
                        className="h-full rounded-full bg-stone-900"
                        style={{ width: `${bPercent}%` }}
                      />
                    </div>
                  </div>
                </div>

                <div className="mt-5 flex flex-wrap gap-2 text-xs font-bold text-stone-500">
                  <span>투표 {totalVotes}</span>
                  <span>·</span>
                  <span>의견 {topic.opinion_count}</span>
                  <span>·</span>
                  <span>댓글 {topic.comment_count}</span>
                  <span>·</span>
                  <span>급상승 {Number(topic.trending_score ?? 0).toFixed(1)}</span>
                </div>
              </Link>
            );
          })}
        </div>

        {topics?.length === 0 && (
          <div className="mt-10 rounded-3xl border border-orange-100 bg-white p-8 text-center">
            <h2 className="text-xl font-black">
              {searchQuery
                ? "검색 결과가 없습니다."
                : requestedTagSlug
                  ? "해당 태그의 주제가 없습니다."
                  : "아직 활성 주제가 없습니다."}
            </h2>
            <p className="mt-2 text-sm text-stone-600">
              {searchQuery
                ? "다른 검색어로 다시 찾아보세요."
                : requestedTagSlug
                  ? "다른 태그를 선택하거나 전체 주제를 확인해보세요."
                : "Supabase에서 테스트 주제를 추가해주세요."}
            </p>
          </div>
        )}
      </section>
      </PublicShell>
    </main>
  );
}
