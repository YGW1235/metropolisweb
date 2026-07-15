import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { createClient } from "@/lib/supabase/server";
import type { TopicTag } from "@/lib/casual-tags";
import { truncateDescription } from "@/lib/site-metadata";

import { ViewTracker } from "./ViewTracker";
import { OpinionFeed } from "./components/OpinionFeed";
import { OpinionForm } from "./components/OpinionForm";
import { TopicVotePanel } from "./components/TopicVotePanel";
import type {
  Comment,
  CurrentVote,
  Opinion,
  OpinionImage,
  OpinionReaction,
  PublicProfile,
  TopicDetail,
} from "./components/types";

import { SiteHeader } from "@/components/SiteHeader";

export const dynamic = "force-dynamic";

const OPINIONS_PER_PAGE = 10;
const OPINION_IMAGE_BUCKET = "casual-opinion-images";

type OpinionSort = "latest" | "popular" | "likes";
type OpinionSide = "all" | "a" | "b";

const OPINION_SORT_OPTIONS: {
  hrefSort: OpinionSort;
  label: string;
}[] = [
  { hrefSort: "latest", label: "최신순" },
  { hrefSort: "popular", label: "인기순" },
  { hrefSort: "likes", label: "공감순" },
];

type RawOpinionImage = {
  opinion_id: string;
  storage_bucket: string | null;
  storage_path: string;
  display_order: number | null;
};

function getOpinionSort(value?: string): OpinionSort {
  if (value === "popular" || value === "likes") {
    return value;
  }

  return "latest";
}

function getOpinionSide(value?: string): OpinionSide {
  if (value === "a" || value === "b") {
    return value;
  }

  return "all";
}

function getPageNumber(value?: string) {
  const parsed = Number(value);

  if (!Number.isInteger(parsed) || parsed < 1) {
    return 1;
  }

  return parsed;
}

function getTopicOpinionHref({
  opinionPage,
  opinionSide,
  opinionSort,
  topicId,
}: {
  opinionPage: number;
  opinionSide: OpinionSide;
  opinionSort: OpinionSort;
  topicId: string;
}) {
  const params = new URLSearchParams({
    opinionSide,
    opinionSort,
  });

  if (opinionPage > 1) {
    params.set("opinionPage", String(opinionPage));
  }

  return `/topics/${topicId}?${params.toString()}`;
}

function getOpinionPage(query: {
  aPage?: string;
  bPage?: string;
  opinionPage?: string;
  opinionSide?: string;
}) {
  if (query.opinionPage) {
    return getPageNumber(query.opinionPage);
  }

  if (query.opinionSide === "b" && query.bPage) {
    return getPageNumber(query.bPage);
  }

  if (query.aPage) {
    return getPageNumber(query.aPage);
  }

  return 1;
}

type PageParams = Promise<{
  topicId: string;
}>;

type SearchParams = Promise<{
  aPage?: string;
  message?: string;
  bPage?: string;
  opinionPage?: string;
  opinionSide?: string;
  opinionSort?: string;
  type?: "success" | "error";
}>;

export async function generateMetadata({
  params,
}: {
  params: PageParams;
}): Promise<Metadata> {
  const { topicId } = await params;
  const supabase = await createClient();

  const { data: topic } = await supabase
    .from("casual_topics")
    .select("title, description")
    .eq("id", topicId)
    .eq("status", "active")
    .maybeSingle();

  if (!topic) {
    return {
      title: {
        absolute: "주제를 찾을 수 없습니다 - 심포지온",
      },
      robots: {
        index: false,
        follow: false,
      },
    };
  }

  const title = `${topic.title} - 심포지온`;
  const description = truncateDescription(topic.description);

  return {
    title: {
      absolute: title,
    },
    description,
    openGraph: {
      title,
      description,
      type: "article",
    },
    twitter: {
      title,
      description,
    },
  };
}

export default async function TopicDetailPage({
  params,
  searchParams,
}: {
  params: PageParams;
  searchParams: SearchParams;
}) {
  const { topicId } = await params;
  const query = await searchParams;
  const opinionSort = getOpinionSort(query.opinionSort);
  const opinionSide = getOpinionSide(query.opinionSide);
  const opinionPage = getOpinionPage(query);

  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: topic, error } = await supabase
    .from("casual_topics")
    .select(
      "id, title, description, option_a, option_b, vote_a_count, vote_b_count, opinion_count, comment_count, view_count, hot_score, is_today, created_at",
    )
    .eq("id", topicId)
    .eq("status", "active")
    .single();

  if (error || !topic) {
    notFound();
  }

  const topicDetail = topic as TopicDetail;
  const { data: topicTagLinksData } = await supabase
    .from("casual_topic_tag_links")
    .select("tag_id")
    .eq("topic_id", topic.id);

  const topicTagIds = (topicTagLinksData ?? []).map((link) => link.tag_id);
  const { data: topicTagsData } =
    topicTagIds.length > 0
      ? await supabase
          .from("casual_topic_tags")
          .select("id, name, slug")
          .in("id", topicTagIds)
          .order("name", { ascending: true })
      : { data: [] };

  const topicTags = (topicTagsData ?? []) as TopicTag[];
  let currentVote: CurrentVote = null;
  let isBookmarked = false;

  if (user) {
    await supabase.rpc("ensure_casual_profile");

    const { data: voteData } = await supabase
      .from("casual_votes")
      .select("choice")
      .eq("topic_id", topic.id)
      .eq("user_id", user.id)
      .maybeSingle();

    if (voteData?.choice === "a" || voteData?.choice === "b") {
      currentVote = { choice: voteData.choice };
    }

    const { data: bookmarkData } = await supabase
      .from("casual_topic_bookmarks")
      .select("topic_id")
      .eq("topic_id", topic.id)
      .eq("user_id", user.id)
      .maybeSingle();

    isBookmarked = Boolean(bookmarkData);
  }

  const opinionSelect =
    "id, topic_id, user_id, choice, body, like_count, dislike_count, score, created_at";

  function getOpinionQuery(page: number) {
    const from = (page - 1) * OPINIONS_PER_PAGE;
    const to = from + OPINIONS_PER_PAGE - 1;
    let opinionQuery = supabase
      .from("casual_opinions")
      .select(opinionSelect, { count: "exact" })
      .eq("topic_id", topicDetail.id)
      .eq("is_hidden", false)
      .range(from, to);

    if (opinionSide !== "all") {
      opinionQuery = opinionQuery.eq("choice", opinionSide);
    }

    if (opinionSort === "popular") {
      opinionQuery = opinionQuery
        .order("score", { ascending: false })
        .order("created_at", { ascending: false });
    } else if (opinionSort === "likes") {
      opinionQuery = opinionQuery
        .order("like_count", { ascending: false })
        .order("created_at", { ascending: false });
    } else {
      opinionQuery = opinionQuery.order("created_at", { ascending: false });
    }

    return opinionQuery;
  }

  const opinionsResult = await getOpinionQuery(opinionPage);
  const opinions = (opinionsResult.data ?? []) as Opinion[];
  const opinionCount = opinionsResult.count ?? 0;

  const opinionUserIds = Array.from(
    new Set(opinions.map((opinion) => opinion.user_id)),
  );

  const opinionIds = opinions.map((opinion) => opinion.id);

  const { data: commentsData } =
    opinionIds.length > 0
      ? await supabase
          .from("casual_comments")
          .select("id, opinion_id, user_id, body, created_at")
          .eq("is_hidden", false)
          .in("opinion_id", opinionIds)
          .order("created_at", { ascending: true })
      : { data: [] };

  const comments = (commentsData ?? []) as Comment[];

  const { data: opinionImagesData } =
    opinionIds.length > 0
      ? await supabase
          .from("casual_opinion_images")
          .select(
            "opinion_id, storage_bucket, storage_path, display_order",
          )
          .in("opinion_id", opinionIds)
          .order("display_order", { ascending: true })
      : { data: [] };

  const opinionImages = ((opinionImagesData ?? []) as RawOpinionImage[]).map(
    (image) => {
      const storageBucket = image.storage_bucket ?? OPINION_IMAGE_BUCKET;
      const { data } = supabase.storage
        .from(storageBucket)
        .getPublicUrl(image.storage_path);

      return {
        opinion_id: image.opinion_id,
        storage_bucket: storageBucket,
        storage_path: image.storage_path,
        display_order: image.display_order ?? 0,
        public_url: data.publicUrl,
      };
    },
  ) as OpinionImage[];

  const commentUserIds = Array.from(
    new Set(comments.map((comment) => comment.user_id)),
  );

  const visibleUserIds = Array.from(
    new Set([...opinionUserIds, ...commentUserIds]),
  );

  const { data: opinionProfilesData } =
    visibleUserIds.length > 0
      ? await supabase
          .from("casual_profiles")
          .select("user_id, nickname, avatar_url")
          .in("user_id", visibleUserIds)
      : { data: [] };

  const profileByUserId = new Map<string, PublicProfile>(
    ((opinionProfilesData ?? []) as PublicProfile[]).map((opinionProfile) => [
      opinionProfile.user_id,
      opinionProfile,
    ]),
  );

  const { data: myReactionData } =
    user && opinionIds.length > 0
      ? await supabase
          .from("casual_opinion_reactions")
          .select("opinion_id, reaction_type")
          .eq("user_id", user.id)
          .in("opinion_id", opinionIds)
      : { data: [] };

  const myReactionByOpinionId = new Map<string, OpinionReaction>(
    ((myReactionData ?? []) as {
      opinion_id: string;
      reaction_type: OpinionReaction;
    }[]).map((reaction) => [
      reaction.opinion_id,
      reaction.reaction_type,
    ]),
  );

  const commentsByOpinionId = new Map<string, Comment[]>();
  const imagesByOpinionId = new Map<string, OpinionImage[]>();

  for (const comment of comments) {
    const existing = commentsByOpinionId.get(comment.opinion_id) ?? [];
    existing.push(comment);
    commentsByOpinionId.set(comment.opinion_id, existing);
  }

  for (const image of opinionImages) {
    const existing = imagesByOpinionId.get(image.opinion_id) ?? [];
    existing.push(image);
    imagesByOpinionId.set(image.opinion_id, existing);
  }

  const isLoggedIn = Boolean(user);
  const hasPreviousPage = opinionPage > 1;
  const hasNextPage = opinionPage * OPINIONS_PER_PAGE < opinionCount;

  return (
    <main className="min-h-screen bg-[#fff7ed] pb-28 text-[#2f2118] md:pb-0">
      <ViewTracker topicId={topicDetail.id} />
      <SiteHeader />
      <section className="mx-auto w-full max-w-[1400px] px-3 sm:px-6 lg:px-8">
        {query.message && (
          <div
            className={`mt-6 rounded-2xl p-4 text-sm font-bold ${
              query.type === "error"
                ? "bg-red-50 text-red-700"
                : "bg-green-50 text-green-700"
            }`}
          >
            {query.message}
          </div>
        )}

        <TopicVotePanel
          currentVote={currentVote}
          isBookmarked={isBookmarked}
          isLoggedIn={isLoggedIn}
          tags={topicTags}
          topic={topicDetail}
        />

        <section className="mt-5 rounded-3xl border border-orange-100 bg-white p-4 shadow-sm sm:mt-6 sm:p-6">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div className="min-w-0">
              <p className="text-sm font-bold tracking-[0.3em] text-orange-700">
                OPINIONS
              </p>
              <h2 className="mt-2 text-2xl font-black">짧은 의견</h2>
              <p className="mt-2 text-sm leading-6 text-stone-600">
                투표한 입장에 따라 의견을 남길 수 있습니다. 전체 보기에서는
                A/B 의견을 시간과 반응 기준으로 한 피드에 모아 보여줍니다.
              </p>
            </div>

            <div className="rounded-full bg-stone-100 px-4 py-2 text-sm font-bold text-stone-600">
              의견 {opinionCount}개
            </div>
          </div>

          <div className="mx-auto mt-6 max-w-5xl space-y-3 rounded-2xl bg-stone-50/70 p-3">
            <div className="flex flex-wrap items-center gap-2">
              <span className="mr-1 shrink-0 text-xs font-black text-stone-500">
                의견 보기
              </span>

              {[
                { label: "전체", side: "all" as const },
                { label: topicDetail.option_a, side: "a" as const },
                { label: topicDetail.option_b, side: "b" as const },
              ].map((option) => (
                <Link
                  key={option.side}
                  href={getTopicOpinionHref({
                    opinionPage: 1,
                    opinionSide: option.side,
                    opinionSort,
                    topicId: topicDetail.id,
                  })}
                  className={`inline-flex max-w-full rounded-full px-4 py-2 text-left text-xs font-black leading-5 transition ${
                    opinionSide === option.side
                      ? "bg-orange-500 text-white"
                      : "bg-white text-stone-600 hover:bg-orange-100 hover:text-orange-800"
                  }`}
                >
                  {option.label}
                </Link>
              ))}
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <span className="mr-1 shrink-0 text-xs font-black text-stone-500">
                의견 정렬
              </span>
              {OPINION_SORT_OPTIONS.map((option) => (
                <Link
                  key={option.hrefSort}
                  href={getTopicOpinionHref({
                    opinionPage: 1,
                    opinionSide,
                    opinionSort: option.hrefSort,
                    topicId: topicDetail.id,
                  })}
                  className={`rounded-full px-4 py-2 text-xs font-black transition ${
                    opinionSort === option.hrefSort
                      ? "bg-orange-500 text-white"
                      : "bg-white text-stone-600 hover:bg-orange-100 hover:text-orange-800"
                  }`}
                >
                  {option.label}
                </Link>
              ))}
            </div>
          </div>

          <OpinionForm
            currentVote={currentVote}
            isLoggedIn={isLoggedIn}
            topic={topicDetail}
          />

          <OpinionFeed
            commentsByOpinionId={commentsByOpinionId}
            currentPage={opinionPage}
            currentUserId={user?.id}
            hasNextPage={hasNextPage}
            hasPreviousPage={hasPreviousPage}
            imagesByOpinionId={imagesByOpinionId}
            isLoggedIn={isLoggedIn}
            myReactionByOpinionId={myReactionByOpinionId}
            nextHref={getTopicOpinionHref({
              opinionPage: opinionPage + 1,
              opinionSide,
              opinionSort,
              topicId: topicDetail.id,
            })}
            opinionSide={opinionSide}
            opinions={opinions}
            optionALabel={topicDetail.option_a}
            optionBLabel={topicDetail.option_b}
            previousHref={getTopicOpinionHref({
              opinionPage: Math.max(1, opinionPage - 1),
              opinionSide,
              opinionSort,
              topicId: topicDetail.id,
            })}
            profileByUserId={profileByUserId}
            topicId={topicDetail.id}
            totalCount={opinionCount}
          />
        </section>
      </section>
    </main>
  );
}
