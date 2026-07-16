import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";

import { signOut } from "@/app/auth/actions";
import { SiteHeader } from "@/components/SiteHeader";
import { TopicTagBadges } from "@/components/TopicTagBadges";
import {
  buildTagsByTopicId,
  type TopicTag,
  type TopicTagLink,
} from "@/lib/casual-tags";
import {
  getCasualUserStatusLabel,
  getCasualUserRestrictionMessage,
  getCasualUserStatus,
  type CasualUserStatus,
} from "@/lib/casual-user-status";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "내 활동",
  description: "심포지온에서 내가 참여한 주제, 의견, 댓글, 저장한 주제를 확인합니다.",
  robots: {
    index: false,
    follow: false,
  },
};

export const dynamic = "force-dynamic";

function formatCount(value: number | null | undefined) {
  return new Intl.NumberFormat("ko-KR").format(value ?? 0);
}

function formatDate(value: string | null | undefined) {
  if (!value) return "-";

  return new Intl.DateTimeFormat("ko-KR", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

type ModerationDetail = {
  status: string | null;
  reason: string | null;
  expires_at: string | null;
  moderated_at?: string | null;
};

function getAccountNoticeClass(status: CasualUserStatus) {
  if (status === "suspended") {
    return {
      box: "border-red-100 bg-red-50 text-red-950",
      badge: "bg-red-100 text-red-800",
      muted: "text-red-800",
      panel: "bg-white/70",
    };
  }

  return {
    box: "border-yellow-200 bg-yellow-50 text-yellow-950",
    badge: "bg-yellow-100 text-yellow-800",
    muted: "text-yellow-800",
    panel: "bg-white/70",
  };
}

function getAccountNoticeTitle(status: CasualUserStatus) {
  if (status === "suspended") return "계정 상태: 이용 정지";
  return "계정 상태: 참여 제한";
}

async function getMyModerationDetail(
  supabase: Awaited<ReturnType<typeof createClient>>,
  userId: string,
): Promise<ModerationDetail | null> {
  const query = supabase
    .from("casual_user_moderation")
    .select("status, reason, expires_at, moderated_at")
    .eq("user_id", userId)
    .maybeSingle();

  const { data, error } = await query;

  if (!error) {
    return data as ModerationDetail | null;
  }

  const { data: fallbackData } = await supabase
    .from("casual_user_moderation")
    .select("status, reason, expires_at")
    .eq("user_id", userId)
    .maybeSingle();

  return fallbackData as ModerationDetail | null;
}

export default async function MyPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login?message=로그인이 필요합니다.&type=error");
  }

  await supabase.rpc("ensure_casual_profile");

  const { data: profile, error: profileError } = await supabase
    .from("casual_profiles")
    .select("id, user_id, nickname, bio, avatar_url, created_at")
    .eq("user_id", user.id)
    .single();

  if (profileError || !profile) {
    return (
      <main className="min-h-screen bg-red-50 p-8 text-red-900">
        <h1 className="text-2xl font-black">프로필을 불러오지 못했습니다.</h1>
        <pre className="mt-4 whitespace-pre-wrap rounded-xl bg-white p-4 text-sm">
          {profileError?.message ?? "프로필이 없습니다."}
        </pre>
      </main>
    );
  }

  const { status: userStatus, errorMessage: userStatusErrorMessage } =
    await getCasualUserStatus(supabase, user.id);

  const accountWarning = userStatusErrorMessage
    ? null
    : getCasualUserRestrictionMessage(userStatus, "participation");

  const moderationDetail =
    accountWarning && (userStatus === "limited" || userStatus === "suspended")
      ? await getMyModerationDetail(supabase, user.id)
      : null;

  const { data: votesData } = await supabase
    .from("casual_votes")
    .select("id, topic_id, choice, created_at")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(20);

  const { data: opinionsData } = await supabase
    .from("casual_opinions")
    .select(
      "id, topic_id, choice, body, like_count, dislike_count, score, created_at",
    )
    .eq("user_id", user.id)
    .eq("is_hidden", false)
    .order("created_at", { ascending: false })
    .limit(20);

  const { data: commentsData } = await supabase
    .from("casual_comments")
    .select("id, opinion_id, body, created_at")
    .eq("user_id", user.id)
    .eq("is_hidden", false)
    .order("created_at", { ascending: false })
    .limit(20);

  const { data: bookmarksData } = await supabase
    .from("casual_topic_bookmarks")
    .select("topic_id, created_at")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(20);

  const { data: opinionStatsData, count: visibleOpinionCount } = await supabase
    .from("casual_opinions")
    .select("like_count", { count: "exact" })
    .eq("user_id", user.id)
    .eq("is_hidden", false);

  const { count: visibleCommentCount } = await supabase
    .from("casual_comments")
    .select("id", { count: "exact", head: true })
    .eq("user_id", user.id)
    .eq("is_hidden", false);

  const { count: unreadNotificationCount } = await supabase
    .from("casual_notifications")
    .select("id", { count: "exact", head: true })
    .eq("user_id", user.id)
    .eq("is_read", false);

  const votes = votesData ?? [];
  const opinions = opinionsData ?? [];
  const comments = commentsData ?? [];
  const bookmarks = bookmarksData ?? [];

  const commentOpinionIds = Array.from(
    new Set(comments.map((comment) => comment.opinion_id)),
  );

  const { data: commentOpinionsData } =
    commentOpinionIds.length > 0
      ? await supabase
          .from("casual_opinions")
          .select("id, topic_id, body")
          .in("id", commentOpinionIds)
      : { data: [] };

  const commentOpinionById = new Map(
    (commentOpinionsData ?? []).map((opinion) => [opinion.id, opinion]),
  );

  const topicIds = Array.from(
    new Set([
      ...bookmarks.map((bookmark) => bookmark.topic_id),
      ...votes.map((vote) => vote.topic_id),
      ...opinions.map((opinion) => opinion.topic_id),
      ...(commentOpinionsData ?? []).map((opinion) => opinion.topic_id),
    ]),
  );

  const { data: topicsData } =
    topicIds.length > 0
      ? await supabase
          .from("casual_topics")
          .select(
            "id, title, description, option_a, option_b, status, vote_a_count, vote_b_count, opinion_count, comment_count, view_count",
          )
          .in("id", topicIds)
      : { data: [] };

  const topicById = new Map(
    (topicsData ?? []).map((topic) => [topic.id, topic]),
  );

  const visibleBookmarks = bookmarks.filter((bookmark) =>
    topicById.has(bookmark.topic_id),
  );

  const bookmarkedTopicIds = visibleBookmarks.map(
    (bookmark) => bookmark.topic_id,
  );
  const { data: allTagsData } = await supabase
    .from("casual_topic_tags")
    .select("id, name, slug")
    .order("name", { ascending: true });

  const { data: bookmarkTagLinksData } =
    bookmarkedTopicIds.length > 0
      ? await supabase
          .from("casual_topic_tag_links")
          .select("topic_id, tag_id")
          .in("topic_id", bookmarkedTopicIds)
      : { data: [] };

  const tagsByTopicId = buildTagsByTopicId(
    bookmarkedTopicIds,
    (allTagsData ?? []) as TopicTag[],
    (bookmarkTagLinksData ?? []) as TopicTagLink[],
  );

  const visibleOpinionLikeCount = (opinionStatsData ?? []).reduce(
    (sum, opinion) => sum + Number(opinion.like_count ?? 0),
    0,
  );

  return (
    <main className="min-h-screen bg-[#fff7ed] text-[#2f2118]">
      <SiteHeader />

      <section className="mx-auto max-w-6xl px-6 py-6">
        <header className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-sm font-bold tracking-[0.3em] text-orange-700">
              MY PAGE
            </p>
            <h1 className="mt-2 text-4xl font-black">내 활동</h1>
            <p className="mt-3 text-stone-600">
              내가 참여한 주제와 작성한 의견, 댓글을 모아봅니다.
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <Link
              href="/notifications"
              className="rounded-full border border-orange-200 bg-orange-50 px-4 py-2 text-sm font-black text-orange-700 transition hover:bg-orange-100"
            >
              알림
              {(unreadNotificationCount ?? 0) > 0
                ? ` ${unreadNotificationCount}`
                : ""}
            </Link>

            <Link
              href={`/users/${encodeURIComponent(profile.nickname)}`}
              className="rounded-full border border-orange-200 bg-white px-4 py-2 text-sm font-black text-orange-700 transition hover:bg-orange-50"
            >
              공개 프로필
            </Link>

            <Link
              href="/settings/profile"
              className="rounded-full bg-stone-950 px-4 py-2 text-sm font-black text-white transition hover:-translate-y-0.5"
            >
              프로필 수정
            </Link>

            <form action={signOut}>
              <button className="rounded-full border border-stone-200 bg-white px-4 py-2 text-sm font-bold text-stone-700 transition hover:bg-stone-50">
                로그아웃
              </button>
            </form>
          </div>
        </header>

        {accountWarning && (
          <section
            className={`mt-6 rounded-3xl border p-5 ${
              getAccountNoticeClass(userStatus).box
            }`}
          >
            <div className="flex flex-wrap items-center gap-2">
              <span
                className={`rounded-full px-3 py-1 text-xs font-black ${
                  getAccountNoticeClass(userStatus).badge
                }`}
              >
                {userStatus}
              </span>
              <h2 className="text-lg font-black">
                {getAccountNoticeTitle(userStatus)}
              </h2>
            </div>

            <p
              className={`mt-3 text-sm font-black ${
                getAccountNoticeClass(userStatus).muted
              }`}
            >
              {accountWarning}
            </p>

            <div
              className={`mt-4 grid gap-3 rounded-2xl p-4 text-sm sm:grid-cols-2 ${
                getAccountNoticeClass(userStatus).panel
              }`}
            >
              <div>
                <p className="text-xs font-black opacity-60">현재 상태</p>
                <p className="mt-1 font-bold">
                  {getCasualUserStatusLabel(userStatus)} ({userStatus})
                </p>
              </div>

              <div>
                <p className="text-xs font-black opacity-60">제한 만료일</p>
                <p className="mt-1 font-bold">
                  {moderationDetail?.expires_at
                    ? formatDate(moderationDetail.expires_at)
                    : "만료일 없음"}
                </p>
              </div>

              {moderationDetail?.moderated_at && (
                <div>
                  <p className="text-xs font-black opacity-60">조치일</p>
                  <p className="mt-1 font-bold">
                    {formatDate(moderationDetail.moderated_at)}
                  </p>
                </div>
              )}

              <div className="sm:col-span-2">
                <p className="text-xs font-black opacity-60">사유</p>
                <p className="mt-1 whitespace-pre-wrap font-bold leading-6">
                  {moderationDetail?.reason?.trim() ||
                    "사유가 등록되지 않았습니다."}
                </p>
              </div>
            </div>

            <p
              className={`mt-3 text-sm leading-6 ${
                getAccountNoticeClass(userStatus).muted
              }`}
            >
              계정 상태와 관련해 궁금한 점이 있으면 관리자에게 문의해주세요.
            </p>
          </section>
        )}

        <section className="mt-8 rounded-[2rem] border border-orange-100 bg-white p-6 shadow-sm">
          <div className="flex flex-wrap items-center gap-5">
            <div className="flex h-20 w-20 items-center justify-center rounded-full bg-orange-100 text-3xl font-black text-orange-900">
              {profile.nickname.slice(0, 1)}
            </div>

            <div className="min-w-0 flex-1">
              <h2 className="text-3xl font-black">{profile.nickname}</h2>
              <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-stone-600">
                {profile.bio || "아직 한 줄 소개가 없습니다."}
              </p>
              <p className="mt-2 text-xs font-bold text-stone-500">
                가입일 {formatDate(profile.created_at)}
              </p>
            </div>
          </div>

          <div className="mt-6 grid gap-3 md:grid-cols-3 lg:grid-cols-6">
            <div className="rounded-2xl bg-orange-50 p-4">
              <p className="text-xs font-black text-orange-700">투표</p>
              <p className="mt-2 text-2xl font-black">
                {formatCount(votes.length)}
              </p>
            </div>

            <div className="rounded-2xl bg-orange-50 p-4">
              <p className="text-xs font-black text-orange-700">작성 의견</p>
              <p className="mt-2 text-2xl font-black">
                {formatCount(visibleOpinionCount ?? opinions.length)}
              </p>
            </div>

            <div className="rounded-2xl bg-orange-50 p-4">
              <p className="text-xs font-black text-orange-700">받은 공감</p>
              <p className="mt-2 text-2xl font-black">
                {formatCount(visibleOpinionLikeCount)}
              </p>
            </div>

            <div className="rounded-2xl bg-stone-50 p-4">
              <p className="text-xs font-black text-stone-600">최근 의견</p>
              <p className="mt-2 text-2xl font-black">
                {formatCount(opinions.length)}
              </p>
            </div>

            <div className="rounded-2xl bg-stone-50 p-4">
              <p className="text-xs font-black text-stone-600">저장 주제</p>
              <p className="mt-2 text-2xl font-black">
                {formatCount(visibleBookmarks.length)}
              </p>
            </div>

            <div className="rounded-2xl bg-stone-50 p-4">
              <p className="text-xs font-black text-stone-600">작성 댓글</p>
              <p className="mt-2 text-2xl font-black">
                {formatCount(visibleCommentCount ?? comments.length)}
              </p>
            </div>
          </div>
        </section>

        <section className="mt-8 rounded-3xl border border-orange-100 bg-white p-6 shadow-sm">
          <div className="mb-5 flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="text-sm font-bold text-orange-700">SAVED TOPICS</p>
              <h2 className="mt-1 text-2xl font-black">내가 저장한 주제</h2>
            </div>

            <Link href="/topics" className="text-sm font-bold text-stone-600">
              주제 더 보기
            </Link>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            {visibleBookmarks.map((bookmark) => {
              const topic = topicById.get(bookmark.topic_id);

              if (!topic) {
                return null;
              }

              const totalVotes = topic.vote_a_count + topic.vote_b_count;

              return (
                <Link
                  key={bookmark.topic_id}
                  href={`/topics/${bookmark.topic_id}`}
                  className="rounded-2xl border border-orange-100 p-4 transition hover:-translate-y-0.5 hover:shadow-sm"
                >
                  <div className="flex flex-wrap items-center gap-2">
                    {topic.status && (
                      <span className="rounded-full bg-stone-100 px-3 py-1 text-xs font-black text-stone-600">
                        {topic.status}
                      </span>
                    )}

                    <span className="rounded-full bg-orange-50 px-3 py-1 text-xs font-black text-orange-700">
                      저장됨
                    </span>
                  </div>

                  <h3 className="mt-3 line-clamp-1 text-lg font-black">
                    {topic.title}
                  </h3>

                  {topic.description && (
                    <p className="mt-2 line-clamp-2 text-sm leading-6 text-stone-600">
                      {topic.description}
                    </p>
                  )}

                  <TopicTagBadges
                    className="mt-3"
                    tags={tagsByTopicId.get(bookmark.topic_id) ?? []}
                  />

                  <div className="mt-4 flex flex-wrap gap-2 text-xs font-bold text-stone-500">
                    <span>투표 {formatCount(totalVotes)}</span>
                    <span>·</span>
                    <span>의견 {formatCount(topic.opinion_count)}</span>
                    <span>·</span>
                    <span>댓글 {formatCount(topic.comment_count)}</span>
                    <span>·</span>
                    <span>조회 {formatCount(topic.view_count)}</span>
                  </div>

                  <p className="mt-2 text-xs font-bold text-stone-400">
                    저장 {formatDate(bookmark.created_at)}
                  </p>
                </Link>
              );
            })}
          </div>

          {visibleBookmarks.length === 0 && (
            <div className="rounded-2xl bg-stone-50 p-6 text-center text-sm font-bold text-stone-500">
              아직 저장한 주제가 없습니다.
            </div>
          )}
        </section>

        <section className="mt-8 grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
          <article className="rounded-3xl border border-orange-100 bg-white p-6 shadow-sm">
            <div className="mb-5">
              <p className="text-sm font-bold text-orange-700">MY VOTES</p>
              <h2 className="mt-1 text-2xl font-black">내가 투표한 주제</h2>
            </div>

            <div className="space-y-3">
              {votes.map((vote) => {
                const topic = topicById.get(vote.topic_id);
                const sideName =
                  vote.choice === "a" ? topic?.option_a : topic?.option_b;

                return (
                  <Link
                    key={vote.id}
                    href={`/topics/${vote.topic_id}`}
                    className="block rounded-2xl border border-stone-100 p-4 transition hover:-translate-y-0.5 hover:shadow-sm"
                  >
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="rounded-full bg-orange-100 px-3 py-1 text-xs font-black text-orange-800">
                        {sideName ?? "선택"} 선택
                      </span>

                      {topic?.status && (
                        <span className="rounded-full bg-stone-100 px-3 py-1 text-xs font-black text-stone-600">
                          {topic.status}
                        </span>
                      )}
                    </div>

                    <h3 className="mt-3 line-clamp-1 font-black">
                      {topic?.title ?? "주제를 찾을 수 없음"}
                    </h3>

                    <p className="mt-2 text-xs font-bold text-stone-500">
                      {formatDate(vote.created_at)}
                    </p>
                  </Link>
                );
              })}

              {votes.length === 0 && (
                <div className="rounded-2xl bg-stone-50 p-6 text-center text-sm font-bold text-stone-500">
                  아직 투표한 주제가 없습니다.
                </div>
              )}
            </div>
          </article>

          <article className="rounded-3xl border border-orange-100 bg-white p-6 shadow-sm">
            <div className="mb-5 flex items-end justify-between gap-4">
              <div>
                <p className="text-sm font-bold text-orange-700">
                  MY OPINIONS
                </p>
                <h2 className="mt-1 text-2xl font-black">내가 작성한 의견</h2>
              </div>

              <span className="rounded-full bg-orange-50 px-4 py-2 text-xs font-black text-orange-700">
                작성 의견 공감 {formatCount(visibleOpinionLikeCount)}
              </span>
            </div>

            <div className="space-y-3">
              {opinions.map((opinion) => {
                const topic = topicById.get(opinion.topic_id);
                const sideName =
                  opinion.choice === "a" ? topic?.option_a : topic?.option_b;

                return (
                  <Link
                    key={opinion.id}
                    href={`/topics/${opinion.topic_id}`}
                    className="block rounded-2xl border border-stone-100 p-4 transition hover:-translate-y-0.5 hover:shadow-sm"
                  >
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="rounded-full bg-orange-100 px-3 py-1 text-xs font-black text-orange-800">
                        {sideName ?? "선택"} 측
                      </span>

                      <span className="rounded-full bg-stone-100 px-3 py-1 text-xs font-black text-stone-600">
                        점수 {formatCount(opinion.score)}
                      </span>
                    </div>

                    <h3 className="mt-3 line-clamp-1 font-black">
                      {topic?.title ?? "주제를 찾을 수 없음"}
                    </h3>

                    <p className="mt-3 line-clamp-3 whitespace-pre-wrap text-sm leading-6 text-stone-700">
                      {opinion.body}
                    </p>

                    <div className="mt-3 flex flex-wrap gap-2 text-xs font-bold text-stone-500">
                      <span>공감 {formatCount(opinion.like_count)}</span>
                      <span>·</span>
                      <span>비공감 {formatCount(opinion.dislike_count)}</span>
                      <span>·</span>
                      <span>{formatDate(opinion.created_at)}</span>
                    </div>
                  </Link>
                );
              })}

              {opinions.length === 0 && (
                <div className="rounded-2xl bg-stone-50 p-6 text-center text-sm font-bold text-stone-500">
                  아직 작성한 의견이 없습니다.
                </div>
              )}
            </div>
          </article>
        </section>

        <section className="mt-8 rounded-3xl border border-orange-100 bg-white p-6 shadow-sm">
          <div className="mb-5">
            <p className="text-sm font-bold text-orange-700">MY COMMENTS</p>
            <h2 className="mt-1 text-2xl font-black">내가 작성한 댓글</h2>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            {comments.map((comment) => {
              const opinion = commentOpinionById.get(comment.opinion_id);
              const topic = opinion ? topicById.get(opinion.topic_id) : null;

              return (
                <Link
                  key={comment.id}
                  href={opinion ? `/topics/${opinion.topic_id}` : "/topics"}
                  className="rounded-2xl border border-stone-100 p-4 transition hover:-translate-y-0.5 hover:shadow-sm"
                >
                  <h3 className="line-clamp-1 font-black">
                    {topic?.title ?? "주제를 찾을 수 없음"}
                  </h3>

                  {opinion?.body && (
                    <p className="mt-3 line-clamp-2 rounded-2xl bg-orange-50 p-3 text-xs leading-5 text-stone-600">
                      원 의견: {opinion.body}
                    </p>
                  )}

                  <p className="mt-3 line-clamp-3 whitespace-pre-wrap text-sm leading-6 text-stone-700">
                    {comment.body}
                  </p>

                  <p className="mt-3 text-xs font-bold text-stone-500">
                    {formatDate(comment.created_at)}
                  </p>
                </Link>
              );
            })}
          </div>

          {comments.length === 0 && (
            <div className="rounded-2xl bg-stone-50 p-6 text-center text-sm font-bold text-stone-500">
              아직 작성한 댓글이 없습니다.
            </div>
          )}
        </section>
      </section>
    </main>
  );
}
