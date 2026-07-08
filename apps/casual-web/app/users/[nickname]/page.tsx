import Link from "next/link";
import { notFound } from "next/navigation";

import { SiteHeader } from "@/components/SiteHeader";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

type PageParams = Promise<{
  nickname: string;
}>;

function formatCount(value: number | null | undefined) {
  return new Intl.NumberFormat("ko-KR").format(value ?? 0);
}

function formatDate(value: string | null | undefined) {
  if (!value) return "-";

  return new Intl.DateTimeFormat("ko-KR", {
    dateStyle: "medium",
  }).format(new Date(value));
}

export default async function UserProfilePage({
  params,
}: {
  params: PageParams;
}) {
  const { nickname } = await params;
  const decodedNickname = decodeURIComponent(nickname);

  const supabase = await createClient();

  const { data: profile, error: profileError } = await supabase
    .from("casual_profiles")
    .select(
      "id, user_id, nickname, bio, avatar_url, opinion_count, received_like_count, created_at",
    )
    .eq("nickname", decodedNickname)
    .maybeSingle();

  if (profileError || !profile) {
    notFound();
  }

  const { data: opinionsData } = await supabase
    .from("casual_opinions")
    .select(
      "id, topic_id, choice, body, like_count, dislike_count, score, created_at",
    )
    .eq("user_id", profile.user_id)
    .eq("is_hidden", false)
    .order("created_at", { ascending: false })
    .limit(30);

  const opinions = opinionsData ?? [];

  const topicIds = Array.from(
    new Set(opinions.map((opinion) => opinion.topic_id)),
  );

  const { data: topicsData } =
    topicIds.length > 0
      ? await supabase
          .from("casual_topics")
          .select("id, title, option_a, option_b, status")
          .in("id", topicIds)
      : { data: [] };

  const topicById = new Map(
    (topicsData ?? []).map((topic) => [topic.id, topic]),
  );

  const totalLikes = opinions.reduce(
    (sum, opinion) => sum + Number(opinion.like_count ?? 0),
    0,
  );

  const totalDislikes = opinions.reduce(
    (sum, opinion) => sum + Number(opinion.dislike_count ?? 0),
    0,
  );

  return (
    <main className="min-h-screen bg-[#fff7ed] text-[#2f2118]">
      <SiteHeader />

      <section className="mx-auto max-w-5xl px-6 py-6">

        <section className="mt-6 rounded-[2rem] border border-orange-100 bg-white p-6 shadow-sm">
          <div className="flex flex-wrap items-start gap-5">
            <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-full bg-orange-100 text-3xl font-black text-orange-900">
              {profile.nickname.slice(0, 1)}
            </div>

            <div className="min-w-0 flex-1">
              <p className="text-sm font-bold tracking-[0.3em] text-orange-700">
                USER PROFILE
              </p>
              <h1 className="mt-2 text-4xl font-black">{profile.nickname}</h1>

              <p className="mt-3 whitespace-pre-wrap text-sm leading-6 text-stone-600">
                {profile.bio || "아직 한 줄 소개가 없습니다."}
              </p>

              <p className="mt-3 text-xs font-bold text-stone-500">
                가입일 {formatDate(profile.created_at)}
              </p>
            </div>
          </div>

          <div className="mt-6 grid gap-3 sm:grid-cols-4">
            <div className="rounded-2xl bg-orange-50 p-4">
              <p className="text-xs font-black text-orange-700">작성 의견</p>
              <p className="mt-2 text-2xl font-black">
                {formatCount(profile.opinion_count)}
              </p>
            </div>

            <div className="rounded-2xl bg-orange-50 p-4">
              <p className="text-xs font-black text-orange-700">받은 공감</p>
              <p className="mt-2 text-2xl font-black">
                {formatCount(profile.received_like_count)}
              </p>
            </div>

            <div className="rounded-2xl bg-stone-50 p-4">
              <p className="text-xs font-black text-stone-600">현재 표시 의견</p>
              <p className="mt-2 text-2xl font-black">
                {formatCount(opinions.length)}
              </p>
            </div>

            <div className="rounded-2xl bg-stone-50 p-4">
              <p className="text-xs font-black text-stone-600">공감/비공감</p>
              <p className="mt-2 text-2xl font-black">
                {formatCount(totalLikes)} / {formatCount(totalDislikes)}
              </p>
            </div>
          </div>
        </section>

        <section className="mt-8">
          <div className="mb-5 flex items-end justify-between gap-4">
            <div>
              <p className="text-sm font-bold text-orange-700">OPINIONS</p>
              <h2 className="mt-1 text-2xl font-black">작성한 의견</h2>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            {opinions.map((opinion) => {
              const topic = topicById.get(opinion.topic_id);

              const sideName =
                opinion.choice === "a" ? topic?.option_a : topic?.option_b;

              return (
                <Link
                  key={opinion.id}
                  href={`/topics/${opinion.topic_id}`}
                  className="rounded-3xl border border-orange-100 bg-white p-5 shadow-sm transition hover:-translate-y-1 hover:shadow-lg"
                >
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="rounded-full bg-orange-100 px-3 py-1 text-xs font-black text-orange-800">
                      {sideName ?? "선택"} 측
                    </span>

                    {topic?.status && (
                      <span className="rounded-full bg-stone-100 px-3 py-1 text-xs font-black text-stone-600">
                        {topic.status}
                      </span>
                    )}
                  </div>

                  <h3 className="mt-3 line-clamp-1 text-lg font-black">
                    {topic?.title ?? "주제를 찾을 수 없음"}
                  </h3>

                  <p className="mt-3 line-clamp-4 whitespace-pre-wrap text-sm leading-6 text-stone-700">
                    {opinion.body}
                  </p>

                  <div className="mt-4 flex flex-wrap gap-2 text-xs font-black text-stone-500">
                    <span>공감 {formatCount(opinion.like_count)}</span>
                    <span>·</span>
                    <span>비공감 {formatCount(opinion.dislike_count)}</span>
                    <span>·</span>
                    <span>점수 {formatCount(opinion.score)}</span>
                    <span>·</span>
                    <span>{formatDate(opinion.created_at)}</span>
                  </div>
                </Link>
              );
            })}
          </div>

          {opinions.length === 0 && (
            <div className="rounded-3xl border border-orange-100 bg-white p-8 text-center">
              <h3 className="text-xl font-black">아직 공개 의견이 없습니다.</h3>
              <p className="mt-2 text-sm text-stone-600">
                이 사용자가 의견을 작성하면 이곳에 표시됩니다.
              </p>
            </div>
          )}
        </section>
      </section>
    </main>
  );
}