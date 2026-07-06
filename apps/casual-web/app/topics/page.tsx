import Link from "next/link";

import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

type SearchParams = Promise<{
  message?: string;
  type?: "success" | "error";
}>;

function getPercent(value: number, total: number) {
  if (total <= 0) return 0;
  return Math.round((value / total) * 100);
}

export default async function TopicsPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const params = await searchParams;
  const supabase = await createClient();

  const { data: topics, error } = await supabase
    .from("casual_topics")
    .select(
      "id, title, description, option_a, option_b, vote_a_count, vote_b_count, opinion_count, comment_count, view_count, hot_score, is_today, created_at",
    )
    .eq("status", "active")
    .order("is_today", { ascending: false })
    .order("hot_score", { ascending: false })
    .order("created_at", { ascending: false });

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

  return (
    <main className="min-h-screen bg-[#fff7ed] px-6 py-10 text-[#2f2118]">
      <section className="mx-auto max-w-6xl">
        <header className="flex items-center justify-between gap-4">
          <div>
            <Link href="/" className="text-sm font-black text-orange-700">
              ← 심포지온
            </Link>
            <h1 className="mt-3 text-4xl font-black">주제 목록</h1>
            <p className="mt-3 text-stone-600">
              가볍게 고르고, 투표하고, 의견을 나눌 주제를 찾아보세요.
            </p>
          </div>

          <Link
            href="/settings/profile"
            className="rounded-full border border-stone-200 bg-white px-4 py-2 text-sm font-bold text-stone-700 transition hover:bg-stone-50"
          >
            내 프로필
          </Link>
        </header>

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
                </div>
              </Link>
            );
          })}
        </div>

        {topics?.length === 0 && (
          <div className="mt-10 rounded-3xl border border-orange-100 bg-white p-8 text-center">
            <h2 className="text-xl font-black">아직 활성 주제가 없습니다.</h2>
            <p className="mt-2 text-sm text-stone-600">
              Supabase에서 테스트 주제를 추가해주세요.
            </p>
          </div>
        )}
      </section>
    </main>
  );
}