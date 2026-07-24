import Link from "next/link";

import { getCachedPopularOpinions } from "@/lib/casual-public-cache";

function formatCount(value: number | null | undefined) {
  return new Intl.NumberFormat("ko-KR").format(value ?? 0);
}

export async function PopularOpinionsAside() {
  const popularOpinions = await getCachedPopularOpinions();

  return (
    <div className="space-y-4 lg:sticky lg:top-24">
      <section className="rounded-3xl border border-orange-100 bg-white p-4 shadow-sm">
        <p className="text-xs font-black tracking-[0.22em] text-orange-700">
          OPINIONS
        </p>
        <h2 className="mt-1 text-lg font-black">실시간 인기 의견</h2>

        <div className="mt-4 space-y-3">
          {popularOpinions.map((opinion) => {
            const sideName =
              opinion.choice === "a"
                ? opinion.topic.option_a
                : opinion.topic.option_b;

            return (
              <Link
                key={opinion.id}
                href={`/topics/${opinion.topic_id}`}
                className="group block rounded-2xl border border-stone-100 bg-orange-50/30 p-3 transition hover:-translate-y-0.5 hover:border-orange-200 hover:bg-white hover:shadow-sm"
              >
                <div className="flex flex-wrap items-center gap-2">
                  <span className="rounded-full bg-orange-100 px-2.5 py-1 text-xs font-black text-orange-800">
                    {sideName ?? "선택"}
                  </span>
                  <span className="text-xs font-bold text-stone-500">
                    {opinion.profile?.nickname ?? "알 수 없음"}
                  </span>
                </div>

                <p className="mt-3 line-clamp-3 whitespace-pre-wrap text-sm font-bold leading-6 text-stone-800 group-hover:text-orange-800">
                  {opinion.body}
                </p>

                <p className="mt-3 line-clamp-1 text-xs font-bold text-stone-500">
                  {opinion.topic.title}
                </p>

                <div className="mt-2 flex flex-wrap gap-2 text-xs font-black text-stone-500">
                  <span>공감 {formatCount(opinion.like_count)}</span>
                  <span>·</span>
                  <span>점수 {formatCount(opinion.score)}</span>
                </div>
              </Link>
            );
          })}
        </div>

        {popularOpinions.length === 0 && (
          <p className="mt-4 rounded-2xl bg-stone-50 p-4 text-sm font-bold text-stone-500">
            아직 인기 의견이 없습니다.
          </p>
        )}
      </section>

      <section className="rounded-3xl border border-dashed border-stone-200 bg-white/60 p-4 text-sm text-stone-500">
        <p className="font-black text-stone-600">추후 배너 영역</p>
        <p className="mt-2 leading-6">운영 공지나 캠페인 안내를 배치할 수 있습니다.</p>
      </section>
    </div>
  );
}
