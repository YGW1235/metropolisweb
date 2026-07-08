import Link from "next/link";
import { notFound, redirect } from "next/navigation";

import { updateTopic } from "@/app/admin/topics/actions";
import { createClient } from "@/lib/supabase/server";
import type { TopicTag } from "@/lib/casual-tags";

import { SiteHeader } from "@/components/SiteHeader";
import { TopicTagCheckboxes } from "@/components/TopicTagCheckboxes";

export const dynamic = "force-dynamic";

type PageParams = Promise<{
  topicId: string;
}>;

type SearchParams = Promise<{
  message?: string;
  type?: "success" | "error";
}>;

export default async function EditAdminTopicPage({
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

  if (!user) {
    redirect("/login?message=로그인이 필요합니다.&type=error");
  }

  const { data: isAdmin } = await supabase.rpc("is_casual_admin");

  if (!isAdmin) {
    return (
      <main className="min-h-screen bg-red-50 px-6 py-10 text-red-900">
        <section className="mx-auto max-w-2xl rounded-3xl bg-white p-8 shadow-sm">
          <h1 className="text-2xl font-black">관리자 권한이 필요합니다.</h1>
          <p className="mt-3 text-sm leading-6">
            현재 계정은 캐주얼 사이트 관리자로 등록되어 있지 않습니다.
          </p>
          <Link
            href="/"
            className="mt-6 inline-flex rounded-full bg-stone-950 px-5 py-3 text-sm font-black text-white"
          >
            홈으로 돌아가기
          </Link>
        </section>
      </main>
    );
  }

  const { data: topic, error } = await supabase
    .from("casual_topics")
    .select("id, title, description, option_a, option_b, status, is_today")
    .eq("id", topicId)
    .single();

  if (error || !topic) {
    notFound();
  }

  const { data: allTagsData, error: tagsError } = await supabase
    .from("casual_topic_tags")
    .select("id, name, slug")
    .order("name", { ascending: true });

  if (tagsError) {
    return (
      <main className="min-h-screen bg-red-50 p-8 text-red-900">
        <h1 className="text-2xl font-black">태그 목록을 불러오지 못했습니다.</h1>
        <pre className="mt-4 whitespace-pre-wrap rounded-xl bg-white p-4 text-sm">
          {tagsError.message}
        </pre>
      </main>
    );
  }

  const { data: selectedTagLinksData } = await supabase
    .from("casual_topic_tag_links")
    .select("tag_id")
    .eq("topic_id", topic.id);

  const allTags = (allTagsData ?? []) as TopicTag[];
  const selectedTagIds = (selectedTagLinksData ?? []).map(
    (link) => link.tag_id,
  );

  return (
    <main className="min-h-screen bg-[#fff7ed] text-[#2f2118]">
      <SiteHeader />
      <section className="mx-auto max-w-4xl">
        <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
          <Link href="/admin/topics" className="text-sm font-black text-orange-700">
            관리자 주제 목록
          </Link>
          <Link
            href={`/topics/${topic.id}`}
            className="rounded-full border border-stone-200 bg-white px-4 py-2 text-sm font-bold text-stone-700 transition hover:bg-stone-50"
          >
            주제 보기
          </Link>
        </div>

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

        <section className="mt-8 rounded-3xl border border-orange-100 bg-white p-6 shadow-sm">
          <p className="text-sm font-bold tracking-[0.3em] text-orange-700">
            EDIT TOPIC
          </p>
          <h1 className="mt-2 text-2xl font-black">주제 수정</h1>

          <form action={updateTopic} className="mt-6 grid gap-4">
            <input type="hidden" name="topicId" value={topic.id} />

            <div>
              <label className="text-sm font-bold text-stone-700">제목</label>
              <input
                name="title"
                required
                maxLength={80}
                defaultValue={topic.title}
                className="mt-2 w-full rounded-2xl border border-stone-200 px-4 py-3 outline-none focus:border-orange-400"
              />
            </div>

            <div>
              <label className="text-sm font-bold text-stone-700">설명</label>
              <textarea
                name="description"
                maxLength={500}
                defaultValue={topic.description ?? ""}
                className="mt-2 min-h-28 w-full resize-none rounded-2xl border border-stone-200 px-4 py-3 outline-none focus:border-orange-400"
              />
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <label className="text-sm font-bold text-stone-700">
                  A 선택지
                </label>
                <input
                  name="optionA"
                  required
                  maxLength={40}
                  defaultValue={topic.option_a}
                  className="mt-2 w-full rounded-2xl border border-stone-200 px-4 py-3 outline-none focus:border-orange-400"
                />
              </div>

              <div>
                <label className="text-sm font-bold text-stone-700">
                  B 선택지
                </label>
                <input
                  name="optionB"
                  required
                  maxLength={40}
                  defaultValue={topic.option_b}
                  className="mt-2 w-full rounded-2xl border border-stone-200 px-4 py-3 outline-none focus:border-orange-400"
                />
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-[1fr_auto]">
              <div>
                <label className="text-sm font-bold text-stone-700">상태</label>
                <select
                  name="status"
                  defaultValue={topic.status}
                  className="mt-2 w-full rounded-2xl border border-stone-200 bg-white px-4 py-3 outline-none focus:border-orange-400"
                >
                  <option value="draft">초안</option>
                  <option value="active">활성</option>
                  <option value="closed">종료</option>
                  <option value="archived">보관</option>
                </select>
              </div>

              <label className="mt-8 flex items-center gap-3 rounded-2xl bg-orange-50 px-4 py-3 text-sm font-black text-orange-900">
                <input
                  name="isToday"
                  type="checkbox"
                  defaultChecked={Boolean(topic.is_today)}
                  className="h-4 w-4"
                />
                오늘의 논쟁으로 지정
              </label>
            </div>

            <div>
              <label className="text-sm font-bold text-stone-700">태그</label>
              <div className="mt-2">
                <TopicTagCheckboxes
                  selectedTagIds={selectedTagIds}
                  tags={allTags}
                />
              </div>
            </div>

            <div className="flex justify-end">
              <button className="rounded-full bg-stone-950 px-6 py-3 text-sm font-black text-white transition hover:-translate-y-0.5">
                수정 저장
              </button>
            </div>
          </form>
        </section>
      </section>
    </main>
  );
}
