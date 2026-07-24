import Link from "next/link";

import { getCachedTopicTagAsideData } from "@/lib/casual-public-cache";

function formatCount(value: number | null | undefined) {
  return new Intl.NumberFormat("ko-KR").format(value ?? 0);
}

function formatDate(value: string | null | undefined) {
  if (!value) return "-";

  return new Intl.DateTimeFormat("ko-KR", {
    month: "short",
    day: "numeric",
  }).format(new Date(value));
}

export async function TopicTagAside({
  activeTagSlug,
}: {
  activeTagSlug?: string;
}) {
  const { tags, topicsByTagId } = await getCachedTopicTagAsideData();

  const selectedTagSlug = activeTagSlug?.trim();
  const firstTagWithTopics = tags.find(
    (tag) => (topicsByTagId[tag.id] ?? []).length > 0,
  );

  return (
    <div className="space-y-4 lg:sticky lg:top-24">
      <section className="rounded-3xl border border-orange-100 bg-white p-4 shadow-sm">
        <p className="text-xs font-black tracking-[0.22em] text-orange-700">
          TAGS
        </p>
        <h2 className="mt-1 text-lg font-black">태그별 주제</h2>

        <div className="mt-4 space-y-3">
          {tags.map((tag) => {
            const tagTopics = topicsByTagId[tag.id] ?? [];
            const visibleTopics = tagTopics.slice(0, 5);
            const isActive =
              typeof selectedTagSlug === "string" && selectedTagSlug === tag.slug;
            const isInitiallyOpen = selectedTagSlug
              ? isActive
              : firstTagWithTopics?.id === tag.id;

            return (
              <details
                key={tag.id}
                className={`rounded-2xl border bg-orange-50/40 p-3 open:bg-white ${
                  isActive
                    ? "border-orange-300"
                    : "border-orange-100"
                }`}
                open={isInitiallyOpen}
              >
                <summary className="flex cursor-pointer list-none items-center justify-between gap-3 text-sm font-black text-orange-900 marker:hidden">
                  <span className="truncate">#{tag.name}</span>
                  <span className="shrink-0 rounded-full bg-white px-2 py-1 text-xs text-orange-700">
                    {tagTopics.length}
                  </span>
                </summary>

                <div className="mt-3 space-y-2">
                  {visibleTopics.map((topic) => (
                    <Link
                      key={topic.id}
                      href={`/topics/${topic.id}`}
                      className="block rounded-xl border border-stone-100 bg-white p-3 transition hover:-translate-y-0.5 hover:border-orange-200 hover:shadow-sm"
                    >
                      <h3 className="line-clamp-2 text-sm font-black leading-5 text-stone-900">
                        {topic.title}
                      </h3>

                      <div className="mt-2 flex flex-wrap gap-2 text-xs font-bold text-stone-500">
                        <span>의견 {formatCount(topic.opinion_count)}</span>
                        <span>·</span>
                        <span>조회 {formatCount(topic.view_count)}</span>
                        <span>·</span>
                        <span>
                          {formatDate(topic.last_activity_at ?? topic.created_at)}
                        </span>
                      </div>
                    </Link>
                  ))}

                  {tagTopics.length === 0 && (
                    <p className="rounded-xl bg-white p-3 text-sm font-bold text-stone-500">
                      이 태그의 활성 주제가 없습니다.
                    </p>
                  )}

                  {tagTopics.length > visibleTopics.length && (
                    <Link
                      href={`/topics?tag=${encodeURIComponent(tag.slug)}`}
                      className="inline-flex rounded-full bg-stone-100 px-3 py-2 text-xs font-black text-stone-600 transition hover:bg-stone-200"
                    >
                      전체에서 보기
                    </Link>
                  )}
                </div>
              </details>
            );
          })}
        </div>

        {tags.length === 0 && (
          <p className="mt-4 rounded-2xl bg-stone-50 p-4 text-sm font-bold text-stone-500">
            등록된 태그가 없습니다.
          </p>
        )}
      </section>

      <section className="hidden rounded-3xl border border-dashed border-stone-200 bg-white/60 p-4 text-sm text-stone-500 lg:block">
        <p className="font-black text-stone-600">운영 안내 영역</p>
        <p className="mt-2 leading-6">추후 배너 영역으로 활용할 수 있습니다.</p>
      </section>
    </div>
  );
}
