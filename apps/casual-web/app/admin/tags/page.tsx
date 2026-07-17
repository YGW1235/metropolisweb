import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";

import { createTopicTag, deleteTopicTag } from "@/app/admin/tags/actions";
import { SiteHeader } from "@/components/SiteHeader";
import { SubmitButton } from "@/components/SubmitButton";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "태그 관리",
  robots: {
    index: false,
    follow: false,
  },
};

export const dynamic = "force-dynamic";

type SearchParams = Promise<{
  message?: string;
  type?: "success" | "error";
}>;

type TagRow = {
  id: string;
  name: string;
  slug: string;
  created_at: string | null;
};

function formatDate(value: string | null | undefined) {
  if (!value) return "-";

  return new Intl.DateTimeFormat("ko-KR", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

function formatCount(value: number | null | undefined) {
  return new Intl.NumberFormat("ko-KR").format(value ?? 0);
}

export default async function AdminTagsPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const params = await searchParams;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login?message=로그인이 필요합니다.&type=error");
  }

  const { data: isAdmin } = await supabase.rpc("is_casual_admin");

  if (!isAdmin) {
    redirect("/?message=관리자 권한이 필요합니다.&type=error");
  }

  const tagsWithCreatedAtResult = await supabase
    .from("casual_topic_tags")
    .select("id, name, slug, created_at")
    .order("name", { ascending: true });

  const tagsResult = tagsWithCreatedAtResult.error
    ? await supabase
        .from("casual_topic_tags")
        .select("id, name, slug")
        .order("name", { ascending: true })
    : tagsWithCreatedAtResult;

  if (tagsResult.error) {
    return (
      <main className="min-h-screen bg-red-50 p-8 text-red-900">
        <h1 className="text-2xl font-black">태그 목록을 불러오지 못했습니다.</h1>
        <pre className="mt-4 whitespace-pre-wrap rounded-xl bg-white p-4 text-sm">
          {tagsResult.error.message}
        </pre>
      </main>
    );
  }

  const tags = ((tagsResult.data ?? []) as Partial<TagRow>[]).map((tag) => ({
    id: tag.id ?? "",
    name: tag.name ?? "",
    slug: tag.slug ?? "",
    created_at: tag.created_at ?? null,
  }));
  const tagIds = tags.map((tag) => tag.id);

  const { data: tagLinksData, error: tagLinksError } =
    tagIds.length > 0
      ? await supabase
          .from("casual_topic_tag_links")
          .select("tag_id")
          .in("tag_id", tagIds)
      : { data: [], error: null };

  if (tagLinksError) {
    return (
      <main className="min-h-screen bg-red-50 p-8 text-red-900">
        <h1 className="text-2xl font-black">
          태그 연결 정보를 불러오지 못했습니다.
        </h1>
        <pre className="mt-4 whitespace-pre-wrap rounded-xl bg-white p-4 text-sm">
          {tagLinksError.message}
        </pre>
      </main>
    );
  }

  const linkedTopicCountByTagId = new Map<string, number>();

  for (const link of tagLinksData ?? []) {
    linkedTopicCountByTagId.set(
      link.tag_id,
      (linkedTopicCountByTagId.get(link.tag_id) ?? 0) + 1,
    );
  }

  return (
    <main className="casual-page-bg min-h-screen text-[#2f2118]">
      <SiteHeader />

      <section className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
        <section className="rounded-3xl border border-orange-100 bg-white p-6 shadow-sm">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="text-sm font-bold tracking-[0.3em] text-orange-700">
                ADMIN TAGS
              </p>
              <h1 className="mt-2 text-3xl font-black sm:text-4xl">
                태그 관리
              </h1>
              <p className="mt-3 max-w-2xl text-sm leading-6 text-stone-600">
                주제 생성과 수정에 사용할 태그를 추가하고, 사용되지 않는 태그를
                정리합니다.
              </p>
            </div>

            <div className="flex flex-wrap gap-2">
              <Link
                href="/admin"
                className="rounded-full border border-stone-200 px-4 py-2 text-sm font-bold text-stone-700 transition hover:bg-stone-50"
              >
                대시보드
              </Link>
              <Link
                href="/admin/topics"
                className="rounded-full border border-orange-200 bg-orange-50 px-4 py-2 text-sm font-black text-orange-800 transition hover:bg-orange-100"
              >
                주제 관리
              </Link>
              <Link
                href="/admin/logs"
                className="rounded-full border border-stone-200 px-4 py-2 text-sm font-bold text-stone-700 transition hover:bg-stone-50"
              >
                관리자 로그
              </Link>
            </div>
          </div>
        </section>

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

        <section className="mt-8 rounded-3xl border border-orange-100 bg-white p-6 shadow-sm">
          <p className="text-sm font-bold tracking-[0.3em] text-orange-700">
            CREATE TAG
          </p>
          <h2 className="mt-2 text-2xl font-black">새 태그 추가</h2>
          <p className="mt-2 text-sm leading-6 text-stone-600">
            태그 이름을 입력하면 slug는 자동으로 생성됩니다. 한글 태그도 사용할
            수 있습니다.
          </p>

          <form action={createTopicTag} className="mt-5 flex flex-col gap-3 sm:flex-row">
            <div className="min-w-0 flex-1">
              <label className="text-sm font-bold text-stone-700">
                태그 이름
              </label>
              <input
                name="name"
                required
                maxLength={30}
                className="mt-2 w-full rounded-2xl border border-stone-200 px-4 py-3 outline-none focus:border-orange-400"
                placeholder="예: 음식, 연애, 민초"
              />
            </div>

            <div className="flex items-end">
              <SubmitButton
                className="w-full rounded-full bg-stone-950 px-6 py-3 text-sm font-black text-white transition hover:-translate-y-0.5 sm:w-auto"
                pendingText="태그 생성 중..."
              >
                태그 추가
              </SubmitButton>
            </div>
          </form>
        </section>

        <section className="mt-8">
          <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
            <div>
              <p className="text-sm font-bold text-orange-700">TAGS</p>
              <h2 className="mt-1 text-2xl font-black">태그 목록</h2>
            </div>

            <span className="rounded-full bg-orange-50 px-4 py-2 text-xs font-black text-orange-700">
              전체 {formatCount(tags.length)}개
            </span>
          </div>

          {tags.length > 0 ? (
            <div className="grid gap-4 md:grid-cols-2">
              {tags.map((tag) => {
                const linkedTopicCount =
                  linkedTopicCountByTagId.get(tag.id) ?? 0;
                const canDelete = linkedTopicCount === 0;

                return (
                  <article
                    key={tag.id}
                    className="rounded-3xl border border-orange-100 bg-white p-5 shadow-sm"
                  >
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="rounded-full bg-orange-100 px-3 py-1 text-xs font-black text-orange-800">
                            #{tag.name}
                          </span>
                          <span
                            className={`rounded-full px-3 py-1 text-xs font-black ${
                              canDelete
                                ? "bg-green-50 text-green-700"
                                : "bg-stone-100 text-stone-700"
                            }`}
                          >
                            {canDelete ? "삭제 가능" : "사용 중"}
                          </span>
                        </div>

                        <p className="mt-3 break-all text-sm font-bold text-stone-600">
                          slug: {tag.slug}
                        </p>
                        <p className="mt-2 text-xs font-bold text-stone-500">
                          연결된 주제 {formatCount(linkedTopicCount)}개
                        </p>
                        <p className="mt-1 text-xs font-bold text-stone-400">
                          생성 {formatDate(tag.created_at)}
                        </p>
                      </div>

                      {canDelete ? (
                        <form action={deleteTopicTag} className="shrink-0">
                          <input type="hidden" name="tagId" value={tag.id} />
                          <p className="mb-2 max-w-[12rem] text-xs font-bold leading-5 text-stone-400">
                            사용 중이지 않은 태그만 삭제됩니다.
                          </p>
                          <SubmitButton
                            className="w-full rounded-full border border-red-100 bg-red-50 px-4 py-2 text-sm font-black text-red-700 transition hover:bg-red-100"
                            pendingText="삭제 중..."
                          >
                            삭제
                          </SubmitButton>
                        </form>
                      ) : (
                        <div className="shrink-0 rounded-2xl bg-stone-50 px-4 py-3 text-xs font-bold leading-5 text-stone-500">
                          연결된 주제가 있어 삭제할 수 없습니다.
                        </div>
                      )}
                    </div>
                  </article>
                );
              })}
            </div>
          ) : (
            <div className="rounded-3xl border border-orange-100 bg-white p-8 text-center">
              <h2 className="text-xl font-black">등록된 태그가 없습니다.</h2>
              <p className="mt-2 text-sm text-stone-600">
                위 폼에서 첫 태그를 추가해보세요.
              </p>
            </div>
          )}
        </section>
      </section>
    </main>
  );
}
