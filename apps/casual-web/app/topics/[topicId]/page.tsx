import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { createClient } from "@/lib/supabase/server";
import type { TopicTag } from "@/lib/casual-tags";
import { truncateDescription } from "@/lib/site-metadata";

import { ViewTracker } from "./ViewTracker";
import { OpinionColumn } from "./components/OpinionColumn";
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
  aPage,
  bPage,
  opinionSide,
  opinionSort,
  topicId,
}: {
  aPage: number;
  bPage: number;
  opinionSide: OpinionSide;
  opinionSort: OpinionSort;
  topicId: string;
}) {
  const params = new URLSearchParams({
    opinionSide,
    opinionSort,
  });

  if (aPage > 1) {
    params.set("aPage", String(aPage));
  }

  if (bPage > 1) {
    params.set("bPage", String(bPage));
  }

  return `/topics/${topicId}?${params.toString()}`;
}

type PageParams = Promise<{
  topicId: string;
}>;

type SearchParams = Promise<{
  aPage?: string;
  message?: string;
  bPage?: string;
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
  const aPage = getPageNumber(query.aPage);
  const bPage = getPageNumber(query.bPage);

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

  function getOpinionQuery(choice: "a" | "b", page: number) {
    const from = (page - 1) * OPINIONS_PER_PAGE;
    const to = from + OPINIONS_PER_PAGE - 1;
    let opinionQuery = supabase
      .from("casual_opinions")
      .select(opinionSelect, { count: "exact" })
      .eq("topic_id", topicDetail.id)
      .eq("is_hidden", false)
      .eq("choice", choice)
      .range(from, to);

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

  const showAOpinions = opinionSide === "all" || opinionSide === "a";
  const showBOpinions = opinionSide === "all" || opinionSide === "b";

  const [aOpinionsResult, bOpinionsResult] = await Promise.all([
    showAOpinions
      ? getOpinionQuery("a", aPage)
      : Promise.resolve({ count: 0, data: [] }),
    showBOpinions
      ? getOpinionQuery("b", bPage)
      : Promise.resolve({ count: 0, data: [] }),
  ]);

  const aOpinions = (aOpinionsResult.data ?? []) as Opinion[];
  const bOpinions = (bOpinionsResult.data ?? []) as Opinion[];
  const aOpinionCount = aOpinionsResult.count ?? 0;
  const bOpinionCount = bOpinionsResult.count ?? 0;
  const opinions = [...aOpinions, ...bOpinions];

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
  const totalOpinionCount = aOpinionCount + bOpinionCount;
  const aHasPreviousPage = aPage > 1;
  const bHasPreviousPage = bPage > 1;
  const aHasNextPage = aPage * OPINIONS_PER_PAGE < aOpinionCount;
  const bHasNextPage = bPage * OPINIONS_PER_PAGE < bOpinionCount;
  const opinionGridClassName =
    opinionSide === "all"
      ? "mt-8 grid gap-6 lg:grid-cols-2"
      : "mx-auto mt-8 grid max-w-3xl gap-6";

  return (
    <main className="min-h-screen bg-[#fff7ed] text-[#2f2118]">
      <ViewTracker topicId={topicDetail.id} />
      <SiteHeader />
      <section className="mx-auto max-w-4xl">
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

        <section className="mt-6 rounded-3xl border border-orange-100 bg-white p-6 shadow-sm">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="text-sm font-bold tracking-[0.3em] text-orange-700">
                OPINIONS
              </p>
              <h2 className="mt-2 text-2xl font-black">짧은 의견</h2>
              <p className="mt-2 text-sm leading-6 text-stone-600">
                투표한 입장에 따라 의견을 남길 수 있습니다. A/B 의견은 각각
                10개씩 나누어 볼 수 있습니다.
              </p>
            </div>

            <div className="rounded-full bg-stone-100 px-4 py-2 text-sm font-bold text-stone-600">
              의견 {totalOpinionCount}개
            </div>
          </div>

          <OpinionForm
            currentVote={currentVote}
            isLoggedIn={isLoggedIn}
            topic={topicDetail}
          />

          <div className="mt-6 space-y-3 rounded-2xl bg-stone-50/70 p-3">
            <div className="flex flex-wrap items-center gap-2">
              <span className="mr-1 text-xs font-black text-stone-500">
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
                    aPage: 1,
                    bPage: 1,
                    opinionSide: option.side,
                    opinionSort,
                    topicId: topicDetail.id,
                  })}
                  className={`max-w-full rounded-full px-4 py-2 text-xs font-black transition ${
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
              <span className="mr-1 text-xs font-black text-stone-500">
                의견 정렬
              </span>
              {OPINION_SORT_OPTIONS.map((option) => (
                <Link
                  key={option.hrefSort}
                  href={getTopicOpinionHref({
                    aPage: 1,
                    bPage: 1,
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

          <div className={opinionGridClassName}>
            {showAOpinions && (
              <OpinionColumn
                commentsByOpinionId={commentsByOpinionId}
                currentUserId={user?.id}
                currentPage={aPage}
                hasNextPage={aHasNextPage}
                hasPreviousPage={aHasPreviousPage}
                imagesByOpinionId={imagesByOpinionId}
                isLoggedIn={isLoggedIn}
                myReactionByOpinionId={myReactionByOpinionId}
                nextHref={getTopicOpinionHref({
                  aPage: aPage + 1,
                  bPage,
                  opinionSide,
                  opinionSort,
                  topicId: topicDetail.id,
                })}
                opinions={aOpinions}
                optionLabel={topicDetail.option_a}
                previousHref={getTopicOpinionHref({
                  aPage: Math.max(1, aPage - 1),
                  bPage,
                  opinionSide,
                  opinionSort,
                  topicId: topicDetail.id,
                })}
                profileByUserId={profileByUserId}
                side="a"
                topicId={topicDetail.id}
                totalCount={aOpinionCount}
              />
            )}

            {showBOpinions && (
              <OpinionColumn
                commentsByOpinionId={commentsByOpinionId}
                currentUserId={user?.id}
                currentPage={bPage}
                hasNextPage={bHasNextPage}
                hasPreviousPage={bHasPreviousPage}
                imagesByOpinionId={imagesByOpinionId}
                isLoggedIn={isLoggedIn}
                myReactionByOpinionId={myReactionByOpinionId}
                nextHref={getTopicOpinionHref({
                  aPage,
                  bPage: bPage + 1,
                  opinionSide,
                  opinionSort,
                  topicId: topicDetail.id,
                })}
                opinions={bOpinions}
                optionLabel={topicDetail.option_b}
                previousHref={getTopicOpinionHref({
                  aPage,
                  bPage: Math.max(1, bPage - 1),
                  opinionSide,
                  opinionSort,
                  topicId: topicDetail.id,
                })}
                profileByUserId={profileByUserId}
                side="b"
                topicId={topicDetail.id}
                totalCount={bOpinionCount}
              />
            )}
          </div>
        </section>
      </section>
    </main>
  );
}
