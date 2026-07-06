import Link from "next/link";
import { notFound } from "next/navigation";

import {
  clearOpinionReaction,
  createOpinion,
  reactOpinion,
  voteTopic,
} from "@/app/topics/actions";
import { createClient } from "@/lib/supabase/server";

import { ViewTracker } from "./ViewTracker";

export const dynamic = "force-dynamic";

type PageParams = Promise<{
  topicId: string;
}>;

type SearchParams = Promise<{
  message?: string;
  type?: "success" | "error";
}>;

function getPercent(value: number, total: number) {
  if (total <= 0) return 0;
  return Math.round((value / total) * 100);
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

  let currentVote: { choice: "a" | "b" } | null = null;
  let profile: { nickname: string } | null = null;

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

    const { data: profileData } = await supabase
      .from("casual_profiles")
      .select("nickname")
      .eq("user_id", user.id)
      .maybeSingle();

    profile = profileData;
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

  const opinions = opinionsData ?? [];

  const opinionUserIds = Array.from(
    new Set(opinions.map((opinion) => opinion.user_id)),
  );

  const { data: opinionProfilesData } =
    opinionUserIds.length > 0
        ? await supabase
            .from("casual_profiles")
            .select("user_id, nickname, avatar_url")
            .in("user_id", opinionUserIds)
        : { data: [] };

  const profileByUserId = new Map(
    (opinionProfilesData ?? []).map((opinionProfile) => [
        opinionProfile.user_id,
        opinionProfile,
    ]),
  );

  const opinionIds = opinions.map((opinion) => opinion.id);

  const { data: myReactionData } =
    user && opinionIds.length > 0
        ? await supabase
            .from("casual_opinion_reactions")
            .select("opinion_id, reaction_type")
            .eq("user_id", user.id)
            .in("opinion_id", opinionIds)
        : { data: [] };

    const myReactionByOpinionId = new Map(
    (myReactionData ?? []).map((reaction) => [
        reaction.opinion_id,
        reaction.reaction_type,
    ]),
  );

  const aOpinions = opinions.filter((opinion) => opinion.choice === "a");
  const bOpinions = opinions.filter((opinion) => opinion.choice === "b");

  const totalVotes = topic.vote_a_count + topic.vote_b_count;
  const aPercent = getPercent(topic.vote_a_count, totalVotes);
  const bPercent = getPercent(topic.vote_b_count, totalVotes);
  const hasVoted = Boolean(currentVote);

  return (
    <main className="min-h-screen bg-[#fff7ed] px-6 py-10 text-[#2f2118]">
      <ViewTracker topicId={topic.id} />
      <section className="mx-auto max-w-4xl">
        <header className="flex items-center justify-between gap-4">
          <Link href="/topics" className="text-sm font-black text-orange-700">
            ← 주제 목록
          </Link>

          {user ? (
            <Link
              href="/settings/profile"
              className="rounded-full border border-stone-200 bg-white px-4 py-2 text-sm font-bold text-stone-700 transition hover:bg-stone-50"
            >
              {profile?.nickname ?? "내 프로필"}
            </Link>
          ) : (
            <Link
              href="/login"
              className="rounded-full bg-stone-950 px-4 py-2 text-sm font-bold text-white transition hover:-translate-y-0.5"
            >
              로그인
            </Link>
          )}
        </header>

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

        <article className="mt-8 rounded-[2rem] border border-orange-100 bg-white p-6 shadow-sm">
          <div className="flex flex-wrap items-center gap-2">
            {topic.is_today && (
              <span className="rounded-full bg-orange-100 px-3 py-1 text-xs font-black text-orange-800">
                오늘의 논쟁
              </span>
            )}
            <span className="rounded-full bg-stone-100 px-3 py-1 text-xs font-black text-stone-600">
              조회 {topic.view_count}
            </span>
            <span className="rounded-full bg-stone-100 px-3 py-1 text-xs font-black text-stone-600">
              투표 {totalVotes}
            </span>
          </div>

          <h1 className="mt-5 text-4xl font-black leading-tight">
            {topic.title}
          </h1>

          <p className="mt-4 text-lg leading-8 text-stone-700">
            {topic.description}
          </p>

          <div className="mt-8 grid gap-3 md:grid-cols-2">
            <form action={voteTopic}>
              <input type="hidden" name="topicId" value={topic.id} />
              <input type="hidden" name="choice" value="a" />
              <button
                className={`w-full rounded-3xl px-6 py-6 text-left transition hover:-translate-y-0.5 ${
                  currentVote?.choice === "a"
                    ? "bg-orange-500 text-white shadow-lg shadow-orange-200"
                    : "bg-orange-100 text-orange-950 hover:bg-orange-200"
                }`}
              >
                <span className="block text-sm font-black opacity-80">A</span>
                <span className="mt-1 block text-2xl font-black">
                  {topic.option_a}
                </span>
                {currentVote?.choice === "a" && (
                  <span className="mt-2 block text-sm font-bold">
                    내가 선택한 입장
                  </span>
                )}
              </button>
            </form>

            <form action={voteTopic}>
              <input type="hidden" name="topicId" value={topic.id} />
              <input type="hidden" name="choice" value="b" />
              <button
                className={`w-full rounded-3xl px-6 py-6 text-left transition hover:-translate-y-0.5 ${
                  currentVote?.choice === "b"
                    ? "bg-stone-950 text-white shadow-lg shadow-stone-300"
                    : "bg-stone-100 text-stone-950 hover:bg-stone-200"
                }`}
              >
                <span className="block text-sm font-black opacity-80">B</span>
                <span className="mt-1 block text-2xl font-black">
                  {topic.option_b}
                </span>
                {currentVote?.choice === "b" && (
                  <span className="mt-2 block text-sm font-bold">
                    내가 선택한 입장
                  </span>
                )}
              </button>
            </form>
          </div>

          {!user && (
            <div className="mt-5 rounded-2xl bg-stone-50 p-4 text-sm font-bold text-stone-600">
              투표하려면 로그인이 필요합니다.{" "}
              <Link href="/login" className="text-orange-700 underline">
                로그인하기
              </Link>
            </div>
          )}

          {hasVoted ? (
            <section className="mt-8 rounded-3xl bg-orange-50 p-5">
              <div className="flex items-center justify-between gap-4">
                <h2 className="text-xl font-black">투표 결과</h2>
                <p className="text-sm font-bold text-stone-600">
                  총 {totalVotes}명 참여
                </p>
              </div>

              <div className="mt-5 space-y-4">
                <div>
                  <div className="flex justify-between text-sm font-black text-stone-700">
                    <span>{topic.option_a}</span>
                    <span>
                      {aPercent}% · {topic.vote_a_count}표
                    </span>
                  </div>
                  <div className="mt-2 h-4 overflow-hidden rounded-full bg-white">
                    <div
                      className="h-full rounded-full bg-orange-500"
                      style={{ width: `${aPercent}%` }}
                    />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-sm font-black text-stone-700">
                    <span>{topic.option_b}</span>
                    <span>
                      {bPercent}% · {topic.vote_b_count}표
                    </span>
                  </div>
                  <div className="mt-2 h-4 overflow-hidden rounded-full bg-white">
                    <div
                      className="h-full rounded-full bg-stone-950"
                      style={{ width: `${bPercent}%` }}
                    />
                  </div>
                </div>
              </div>
            </section>
          ) : (
            <section className="mt-8 rounded-3xl bg-stone-50 p-5 text-center">
              <h2 className="text-xl font-black">먼저 선택해보세요</h2>
              <p className="mt-2 text-sm leading-6 text-stone-600">
                투표 후 다른 사람들의 선택 비율을 볼 수 있습니다.
              </p>
            </section>
          )}
        </article>

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

        {user && hasVoted ? (
            <form action={createOpinion} className="mt-6">
            <input type="hidden" name="topicId" value={topic.id} />

            <div className="rounded-3xl bg-orange-50 p-4">
                <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                <p className="text-sm font-black text-stone-700">
                    {currentVote?.choice === "a"
                    ? `"${topic.option_a}" 입장으로 의견 작성`
                    : `"${topic.option_b}" 입장으로 의견 작성`}
                </p>
                <p className="text-xs font-bold text-stone-500">최대 500자</p>
                </div>

                <textarea
                name="body"
                required
                maxLength={500}
                className="min-h-28 w-full resize-none rounded-2xl border border-orange-100 bg-white px-4 py-3 text-sm leading-6 outline-none focus:border-orange-400"
                placeholder="내 선택의 이유를 짧게 남겨보세요."
                />

                <div className="mt-3 flex justify-end">
                <button className="rounded-full bg-stone-950 px-5 py-3 text-sm font-black text-white transition hover:-translate-y-0.5">
                    의견 남기기
                </button>
                </div>
            </div>
            </form>
        ) : user ? (
            <div className="mt-6 rounded-3xl bg-stone-50 p-5 text-center">
            <h3 className="text-lg font-black">먼저 투표해주세요</h3>
            <p className="mt-2 text-sm text-stone-600">
                A/B 중 하나를 선택한 뒤 의견을 작성할 수 있습니다.
            </p>
            </div>
        ) : (
            <div className="mt-6 rounded-3xl bg-stone-50 p-5 text-center">
            <h3 className="text-lg font-black">로그인이 필요합니다</h3>
            <p className="mt-2 text-sm text-stone-600">
                로그인하면 투표와 의견 작성, 공감/비공감에 참여할 수 있습니다.
            </p>
            <Link
                href="/login"
                className="mt-4 inline-flex rounded-full bg-stone-950 px-5 py-3 text-sm font-black text-white"
            >
                로그인하기
            </Link>
            </div>
        )}

        <div className="mt-8 grid gap-6 lg:grid-cols-2">
            <div>
            <div className="mb-4 rounded-2xl bg-orange-100 px-4 py-3">
                <h3 className="font-black text-orange-950">{topic.option_a}</h3>
                <p className="mt-1 text-xs font-bold text-orange-800">
                {aOpinions.length}개 의견
                </p>
            </div>

            <div className="space-y-3">
                {aOpinions.map((opinion) => {
                const opinionProfile = profileByUserId.get(opinion.user_id);
                const myReaction = myReactionByOpinionId.get(opinion.id);

                return (
                    <article
                    key={opinion.id}
                    className="rounded-3xl border border-orange-100 bg-orange-50/60 p-4"
                    >
                    <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-orange-200 text-sm font-black text-orange-900">
                        {(opinionProfile?.nickname ?? "익명").slice(0, 1)}
                        </div>

                        <div>
                        <p className="text-sm font-black">
                            {opinionProfile?.nickname ?? "알 수 없음"}
                        </p>
                        <p className="text-xs font-bold text-orange-700">
                            {topic.option_a} 측
                        </p>
                        </div>
                    </div>

                    <p className="mt-4 whitespace-pre-wrap text-sm leading-6 text-stone-700">
                        {opinion.body}
                    </p>

                    <div className="mt-4 flex flex-wrap items-center gap-2">
                        <form action={reactOpinion}>
                        <input type="hidden" name="topicId" value={topic.id} />
                        <input type="hidden" name="opinionId" value={opinion.id} />
                        <input type="hidden" name="reactionType" value="like" />
                        <button
                            className={`rounded-full px-3 py-2 text-xs font-black ${
                            myReaction === "like"
                                ? "bg-orange-500 text-white"
                                : "bg-white text-stone-700"
                            }`}
                        >
                            공감 {opinion.like_count}
                        </button>
                        </form>

                        <form action={reactOpinion}>
                        <input type="hidden" name="topicId" value={topic.id} />
                        <input type="hidden" name="opinionId" value={opinion.id} />
                        <input type="hidden" name="reactionType" value="dislike" />
                        <button
                            className={`rounded-full px-3 py-2 text-xs font-black ${
                            myReaction === "dislike"
                                ? "bg-stone-900 text-white"
                                : "bg-white text-stone-700"
                            }`}
                        >
                            비공감 {opinion.dislike_count}
                        </button>
                        </form>

                        {myReaction && (
                        <form action={clearOpinionReaction}>
                            <input type="hidden" name="topicId" value={topic.id} />
                            <input type="hidden" name="opinionId" value={opinion.id} />
                            <button className="rounded-full bg-white px-3 py-2 text-xs font-black text-stone-500">
                            취소
                            </button>
                        </form>
                        )}

                        <span className="ml-auto text-xs font-bold text-stone-500">
                        점수 {opinion.score}
                        </span>
                    </div>
                    </article>
                );
                })}

                {aOpinions.length === 0 && (
                <div className="rounded-3xl border border-dashed border-orange-200 p-5 text-center text-sm font-bold text-stone-500">
                    아직 이쪽 의견이 없습니다.
                </div>
                )}
            </div>
            </div>

            <div>
            <div className="mb-4 rounded-2xl bg-stone-100 px-4 py-3">
                <h3 className="font-black text-stone-950">{topic.option_b}</h3>
                <p className="mt-1 text-xs font-bold text-stone-600">
                {bOpinions.length}개 의견
                </p>
            </div>

            <div className="space-y-3">
                {bOpinions.map((opinion) => {
                const opinionProfile = profileByUserId.get(opinion.user_id);
                const myReaction = myReactionByOpinionId.get(opinion.id);

                return (
                    <article
                    key={opinion.id}
                    className="rounded-3xl border border-stone-100 bg-stone-50 p-4"
                    >
                    <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-stone-200 text-sm font-black text-stone-900">
                        {(opinionProfile?.nickname ?? "익명").slice(0, 1)}
                        </div>

                        <div>
                        <p className="text-sm font-black">
                            {opinionProfile?.nickname ?? "알 수 없음"}
                        </p>
                        <p className="text-xs font-bold text-stone-600">
                            {topic.option_b} 측
                        </p>
                        </div>
                    </div>

                    <p className="mt-4 whitespace-pre-wrap text-sm leading-6 text-stone-700">
                        {opinion.body}
                    </p>

                    <div className="mt-4 flex flex-wrap items-center gap-2">
                        <form action={reactOpinion}>
                        <input type="hidden" name="topicId" value={topic.id} />
                        <input type="hidden" name="opinionId" value={opinion.id} />
                        <input type="hidden" name="reactionType" value="like" />
                        <button
                            className={`rounded-full px-3 py-2 text-xs font-black ${
                            myReaction === "like"
                                ? "bg-orange-500 text-white"
                                : "bg-white text-stone-700"
                            }`}
                        >
                            공감 {opinion.like_count}
                        </button>
                        </form>

                        <form action={reactOpinion}>
                        <input type="hidden" name="topicId" value={topic.id} />
                        <input type="hidden" name="opinionId" value={opinion.id} />
                        <input type="hidden" name="reactionType" value="dislike" />
                        <button
                            className={`rounded-full px-3 py-2 text-xs font-black ${
                            myReaction === "dislike"
                                ? "bg-stone-900 text-white"
                                : "bg-white text-stone-700"
                            }`}
                        >
                            비공감 {opinion.dislike_count}
                        </button>
                        </form>

                        {myReaction && (
                        <form action={clearOpinionReaction}>
                            <input type="hidden" name="topicId" value={topic.id} />
                            <input type="hidden" name="opinionId" value={opinion.id} />
                            <button className="rounded-full bg-white px-3 py-2 text-xs font-black text-stone-500">
                            취소
                            </button>
                        </form>
                        )}

                        <span className="ml-auto text-xs font-bold text-stone-500">
                        점수 {opinion.score}
                        </span>
                    </div>
                    </article>
                );
                })}

                {bOpinions.length === 0 && (
                <div className="rounded-3xl border border-dashed border-stone-200 p-5 text-center text-sm font-bold text-stone-500">
                    아직 이쪽 의견이 없습니다.
                </div>
                )}
            </div>
            </div>
        </div>
        </section>
      </section>
    </main>
  );
}