import { updateTopic } from "@/app/actions/topics";
import { toDatetimeLocalValue } from "@/lib/datetime";
import { createClient } from "@/lib/supabase/server";
import { notFound, redirect } from "next/navigation";

type EditTopicPageProps = {
  params: Promise<{
    topicId: string;
  }>;
  searchParams: Promise<{
    message?: string;
  }>;
};

async function requireAdmin() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role, status")
    .eq("id", user.id)
    .single();

  if (profile?.role !== "admin" || profile?.status !== "active") {
    redirect("/admin?message=관리자 권한이 필요합니다.");
  }

  return supabase;
}

export default async function EditTopicPage({
  params,
  searchParams,
}: EditTopicPageProps) {
  const { topicId } = await params;
  const query = await searchParams;

  const supabase = await requireAdmin();

  const { data: topic, error } = await supabase
    .from("topics")
    .select("id, title, description, status, starts_at, ends_at, created_at")
    .eq("id", topicId)
    .single();

  if (error || !topic) {
    notFound();
  }

  return (
    <main className="min-h-screen bg-gray-950 px-6 py-16 text-white">
      <section className="mx-auto max-w-2xl">
        <a href="/admin/topics" className="text-sm text-blue-400 hover:underline">
          ← 주제 관리로 돌아가기
        </a>

        <h1 className="mt-6 text-3xl font-bold">토론 주제 수정</h1>
        <p className="mt-3 text-gray-300">
          제목, 설명, 상태, 토론 시간을 수정합니다.
        </p>

        {query.message ? (
          <div className="mt-6 rounded-lg border border-red-500/40 bg-red-500/10 p-4 text-sm text-red-200">
            {query.message}
          </div>
        ) : null}

        <form action={updateTopic} className="mt-8 space-y-5">
          <input type="hidden" name="topic_id" value={topic.id} />

          <div>
            <label className="block text-sm font-medium text-gray-200">
              주제 제목
            </label>
            <input
              name="title"
              required
              defaultValue={topic.title}
              className="mt-2 w-full rounded-lg border border-gray-700 bg-gray-900 px-4 py-3 text-white outline-none focus:border-blue-500"
              placeholder="예: AI 규제는 강화되어야 하는가?"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-200">
              설명
            </label>
            <textarea
              name="description"
              required
              rows={8}
              defaultValue={topic.description}
              className="mt-2 w-full rounded-lg border border-gray-700 bg-gray-900 px-4 py-3 text-white outline-none focus:border-blue-500"
              placeholder="토론 배경, 참고할 쟁점, 참가자가 알아야 할 내용을 작성하세요."
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-200">
              상태
            </label>
            <select
              name="status"
              defaultValue={topic.status}
              className="mt-2 w-full rounded-lg border border-gray-700 bg-gray-900 px-4 py-3 text-white outline-none focus:border-blue-500"
            >
              <option value="draft">draft - 임시저장</option>
              <option value="open">open - 참가 가능</option>
              <option value="active">active - 토론 진행 중</option>
              <option value="closed">closed - 종료</option>
              <option value="archived">archived - 보관</option>
            </select>
          </div>

          <div className="grid gap-5 sm:grid-cols-2">
            <div>
              <label className="block text-sm font-medium text-gray-200">
                시작 시간
              </label>
              <input
                name="starts_at"
                type="datetime-local"
                defaultValue={toDatetimeLocalValue(topic.starts_at)}
                className="mt-2 w-full rounded-lg border border-gray-700 bg-gray-900 px-4 py-3 text-white outline-none focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-200">
                종료 시간
              </label>
              <input
                name="ends_at"
                type="datetime-local"
                defaultValue={toDatetimeLocalValue(topic.ends_at)}
                className="mt-2 w-full rounded-lg border border-gray-700 bg-gray-900 px-4 py-3 text-white outline-none focus:border-blue-500"
              />
            </div>
          </div>

          <div className="rounded-lg border border-gray-700 bg-gray-900 p-4 text-sm text-gray-400">
            생성일:{" "}
            {new Date(topic.created_at).toLocaleString("ko-KR", {
              timeZone: "Asia/Seoul",
            })}
          </div>

          <button className="w-full rounded-lg bg-blue-500 px-5 py-3 font-medium text-white hover:bg-blue-400">
            수정 저장
          </button>
        </form>
      </section>
    </main>
  );
}