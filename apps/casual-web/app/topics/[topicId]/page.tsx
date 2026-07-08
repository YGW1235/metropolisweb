import { notFound } from "next/navigation";

import { createClient } from "@/lib/supabase/server";
import type { TopicTag } from "@/lib/casual-tags";

import { ViewTracker } from "./ViewTracker";
import { OpinionColumn } from "./components/OpinionColumn";
import { OpinionForm } from "./components/OpinionForm";
import { TopicVotePanel } from "./components/TopicVotePanel";
import type {
  Comment,
  CurrentVote,
  Opinion,
  OpinionReaction,
  PublicProfile,
  TopicDetail,
} from "./components/types";

import { SiteHeader } from "@/components/SiteHeader";

export const dynamic = "force-dynamic";

type PageParams = Promise<{
  topicId: string;
}>;

type SearchParams = Promise<{
  message?: string;
  type?: "success" | "error";
}>;

export default async function TopicDetailPage({
  params,
  searchParams,
}: {
  params: PageParams;
  searchParams: SearchParams;
}) {
  const { topicId } = await params;
  const query = await searchParams;

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
  }

  const { data: opinionsData } = await supabase
    .from("casual_opinions")
    .select(
      "id, topic_id, user_id, choice, body, like_count, dislike_count, score, created_at",
    )
    .eq("topic_id", topic.id)
    .eq("is_hidden", false)
    .order("score", { ascending: false })
    .order("created_at", { ascending: false });

  const opinions = (opinionsData ?? []) as Opinion[];

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

  for (const comment of comments) {
    const existing = commentsByOpinionId.get(comment.opinion_id) ?? [];
    existing.push(comment);
    commentsByOpinionId.set(comment.opinion_id, existing);
  }

  const aOpinions = opinions.filter((opinion) => opinion.choice === "a");
  const bOpinions = opinions.filter((opinion) => opinion.choice === "b");

  const isLoggedIn = Boolean(user);

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
                투표한 입장에 따라 의견을 남길 수 있습니다. 의견은 인기순으로
                정렬됩니다.
              </p>
            </div>

            <div className="rounded-full bg-stone-100 px-4 py-2 text-sm font-bold text-stone-600">
              의견 {opinions.length}개
            </div>
          </div>

          <OpinionForm
            currentVote={currentVote}
            isLoggedIn={isLoggedIn}
            topic={topicDetail}
          />

          <div className="mt-8 grid gap-6 lg:grid-cols-2">
            <OpinionColumn
              commentsByOpinionId={commentsByOpinionId}
              currentUserId={user?.id}
              isLoggedIn={isLoggedIn}
              myReactionByOpinionId={myReactionByOpinionId}
              opinions={aOpinions}
              optionLabel={topicDetail.option_a}
              profileByUserId={profileByUserId}
              side="a"
              topicId={topicDetail.id}
            />

            <OpinionColumn
              commentsByOpinionId={commentsByOpinionId}
              currentUserId={user?.id}
              isLoggedIn={isLoggedIn}
              myReactionByOpinionId={myReactionByOpinionId}
              opinions={bOpinions}
              optionLabel={topicDetail.option_b}
              profileByUserId={profileByUserId}
              side="b"
              topicId={topicDetail.id}
            />
          </div>
        </section>
      </section>
    </main>
  );
}
