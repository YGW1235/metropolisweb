import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { SiteHeader } from "@/components/SiteHeader";
import { VoteTendencyCard } from "@/components/VoteTendencyCard";
import { DEFAULT_DESCRIPTION, truncateDescription } from "@/lib/site-metadata";
import { createClient } from "@/lib/supabase/server";

import { ProfileOpinionBody } from "./ProfileOpinionBody";

export const dynamic = "force-dynamic";

const OPINIONS_PER_PAGE = 5;

type PageParams = Promise<{
  nickname: string;
}>;

type SearchParams = Promise<{
  opinionPage?: string;
  [key: string]: string | undefined;
}>;

export async function generateMetadata({
  params,
}: {
  params: PageParams;
}): Promise<Metadata> {
  const { nickname } = await params;
  const decodedNickname = decodeURIComponent(nickname);
  const supabase = await createClient();

  const { data: profile } = await supabase
    .from("casual_profiles")
    .select("nickname, bio")
    .eq("nickname", decodedNickname)
    .maybeSingle();

  const profileNickname = profile?.nickname ?? decodedNickname;
  const title = `${profileNickname}님의 프로필 - 심포지온`;
  const description = truncateDescription(profile?.bio || DEFAULT_DESCRIPTION);

  return {
    title: {
      absolute: title,
    },
    description,
    openGraph: {
      title,
      description,
    },
    twitter: {
      title,
      description,
    },
  };
}

function formatCount(value: number | null | undefined) {
  return new Intl.NumberFormat("ko-KR").format(value ?? 0);
}

function formatDate(value: string | null | undefined) {
  if (!value) return "-";

  return new Intl.DateTimeFormat("ko-KR", {
    dateStyle: "medium",
  }).format(new Date(value));
}

function getPageNumber(value?: string) {
  const parsed = Number(value);

  if (!Number.isInteger(parsed) || parsed < 1) {
    return 1;
  }

  return parsed;
}

function getProfileOpinionHref(
  nickname: string,
  page: number,
  currentParams: { [key: string]: string | undefined },
) {
  const encodedNickname = encodeURIComponent(nickname);
  const params = new URLSearchParams();

  for (const [key, value] of Object.entries(currentParams)) {
    if (key !== "opinionPage" && value) {
      params.set(key, value);
    }
  }

  if (page > 1) {
    params.set("opinionPage", String(page));
  }

  const query = params.toString();

  return query ? `/users/${encodedNickname}?${query}` : `/users/${encodedNickname}`;
}

export default async function UserProfilePage({
  params,
  searchParams,
}: {
  params: PageParams;
  searchParams: SearchParams;
}) {
  const { nickname } = await params;
  const query = await searchParams;
  const decodedNickname = decodeURIComponent(nickname);
  const requestedOpinionPage = getPageNumber(query.opinionPage);

  const supabase = await createClient();

  const { data: profile, error: profileError } = await supabase
    .from("casual_profiles")
    .select("id, user_id, nickname, bio, avatar_url, created_at")
    .eq("nickname", decodedNickname)
    .maybeSingle();

  if (profileError || !profile) {
    notFound();
  }

  const { data: topicsData } = await supabase
    .from("casual_topics")
    .select("id, title, option_a, option_b, status")
    .eq("status", "active");

  const topicById = new Map(
    (topicsData ?? []).map((topic) => [topic.id, topic]),
  );
  const activeTopicIds = (topicsData ?? []).map((topic) => topic.id);

  const { data: opinionStatsData, count: publicOpinionCountData } =
    activeTopicIds.length > 0
      ? await supabase
          .from("casual_opinions")
          .select("like_count, dislike_count", { count: "exact" })
          .eq("user_id", profile.user_id)
          .eq("is_hidden", false)
          .in("topic_id", activeTopicIds)
      : { data: [], count: 0 };

  const publicOpinionCount =
    publicOpinionCountData ?? (opinionStatsData ?? []).length;
  const totalOpinionPages = Math.max(
    1,
    Math.ceil(publicOpinionCount / OPINIONS_PER_PAGE),
  );
  const opinionPage = Math.min(requestedOpinionPage, totalOpinionPages);
  const opinionFrom = (opinionPage - 1) * OPINIONS_PER_PAGE;
  const opinionTo = opinionFrom + OPINIONS_PER_PAGE - 1;

  const { data: opinionsData } =
    activeTopicIds.length > 0
      ? await supabase
          .from("casual_opinions")
          .select(
            "id, topic_id, choice, body, like_count, dislike_count, score, created_at",
          )
          .eq("user_id", profile.user_id)
          .eq("is_hidden", false)
          .in("topic_id", activeTopicIds)
          .order("created_at", { ascending: false })
          .range(opinionFrom, opinionTo)
      : { data: [] };

  const opinions = opinionsData ?? [];

  const totalLikes = (opinionStatsData ?? []).reduce(
    (sum, opinion) => sum + Number(opinion.like_count ?? 0),
    0,
  );

  const totalDislikes = (opinionStatsData ?? []).reduce(
    (sum, opinion) => sum + Number(opinion.dislike_count ?? 0),
    0,
  );
  const hasPreviousOpinionPage = opinionPage > 1;
  const hasNextOpinionPage = opinionPage < totalOpinionPages;

  return (
    <main className="casual-page-bg min-h-screen text-[#2f2118]">
      <SiteHeader />

      <section className="mx-auto min-w-0 max-w-5xl px-6 py-6">

        <section className="mt-6 min-w-0 overflow-hidden rounded-[2rem] border border-orange-100 bg-white p-6 shadow-sm">
          <div className="flex flex-wrap items-start gap-5">
            <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-full bg-orange-100 text-3xl font-black text-orange-900">
              {profile.nickname.slice(0, 1)}
            </div>

            <div className="min-w-0 flex-1">
              <p className="text-sm font-bold tracking-[0.3em] text-orange-700">
                USER PROFILE
              </p>
              <h1 className="mt-2 break-words text-4xl font-black">
                {profile.nickname}
              </h1>

              <p className="mt-3 whitespace-pre-wrap break-words text-sm leading-6 text-stone-600 [overflow-wrap:anywhere]">
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
                {formatCount(publicOpinionCount)}
              </p>
            </div>

            <div className="rounded-2xl bg-orange-50 p-4">
              <p className="text-xs font-black text-orange-700">받은 공감</p>
              <p className="mt-2 text-2xl font-black">
                {formatCount(totalLikes)}
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

        <div className="mt-8">
          <VoteTendencyCard title="선택 성향" userId={profile.user_id} />
        </div>

        <section className="mt-8">
          <div className="mb-5 flex items-end justify-between gap-4">
            <div>
              <p className="text-sm font-bold text-orange-700">OPINIONS</p>
              <h2 className="mt-1 text-2xl font-black">작성한 의견</h2>
            </div>
          </div>

          <div className="grid min-w-0 gap-4 md:grid-cols-2">
            {opinions.map((opinion) => {
              const topic = topicById.get(opinion.topic_id);

              const sideName =
                opinion.choice === "a" ? topic?.option_a : topic?.option_b;

              return (
                <article
                  key={opinion.id}
                  className="w-full min-w-0 max-w-full overflow-hidden rounded-3xl border border-orange-100 bg-white p-5 shadow-sm"
                >
                  <div className="flex min-w-0 flex-wrap items-center gap-2">
                    <span className="max-w-full whitespace-normal break-words rounded-full bg-orange-100 px-3 py-1 text-xs font-black text-orange-800 [overflow-wrap:anywhere]">
                      {sideName ?? "선택"}
                    </span>

                    {topic?.status && (
                      <span className="max-w-full whitespace-normal break-words rounded-full bg-stone-100 px-3 py-1 text-xs font-black text-stone-600">
                        {topic.status}
                      </span>
                    )}
                  </div>

                  <h3 className="mt-3 min-w-0 text-lg font-black">
                    <Link
                      href={`/topics/${opinion.topic_id}`}
                      className="line-clamp-2 break-words hover:text-orange-700 [overflow-wrap:anywhere]"
                    >
                      {topic?.title ?? "주제를 찾을 수 없음"}
                    </Link>
                  </h3>

                  <ProfileOpinionBody body={opinion.body} />

                  <div className="mt-4 flex min-w-0 flex-wrap gap-2 text-xs font-black text-stone-500">
                    <span>공감 {formatCount(opinion.like_count)}</span>
                    <span>·</span>
                    <span>비공감 {formatCount(opinion.dislike_count)}</span>
                    <span>·</span>
                    <span>점수 {formatCount(opinion.score)}</span>
                    <span>·</span>
                    <span>{formatDate(opinion.created_at)}</span>
                  </div>

                  <Link
                    href={`/topics/${opinion.topic_id}`}
                    className="mt-4 inline-flex rounded-full bg-stone-950 px-4 py-2 text-xs font-black text-white transition hover:-translate-y-0.5"
                  >
                    주제 보기
                  </Link>
                </article>
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

          {publicOpinionCount > OPINIONS_PER_PAGE && (
            <div className="mt-5 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-orange-100 bg-white p-3 text-xs font-black text-stone-500 shadow-sm">
              {hasPreviousOpinionPage ? (
                <Link
                  href={getProfileOpinionHref(
                    profile.nickname,
                    opinionPage - 1,
                    query,
                  )}
                  className="rounded-full bg-stone-100 px-3 py-2 text-stone-700 hover:bg-orange-100 hover:text-orange-800"
                >
                  이전
                </Link>
              ) : (
                <span className="rounded-full bg-stone-50 px-3 py-2 text-stone-300">
                  이전
                </span>
              )}

              <span>
                {opinionPage} / {totalOpinionPages}
              </span>

              {hasNextOpinionPage ? (
                <Link
                  href={getProfileOpinionHref(
                    profile.nickname,
                    opinionPage + 1,
                    query,
                  )}
                  className="rounded-full bg-stone-950 px-3 py-2 text-white hover:bg-orange-700"
                >
                  다음
                </Link>
              ) : (
                <span className="rounded-full bg-stone-50 px-3 py-2 text-stone-300">
                  다음
                </span>
              )}
            </div>
          )}
        </section>
      </section>
    </main>
  );
}
