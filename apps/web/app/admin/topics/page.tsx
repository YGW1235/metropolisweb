import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { archiveTopic, updateTopicStatus } from "@/app/actions/topics";

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

type AdminTopicsPageProps = {
  searchParams: Promise<{
    message?: string;
  }>;
};

export default async function AdminTopicsPage({
  searchParams,
}: AdminTopicsPageProps) {
  const params = await searchParams;
  const supabase = await requireAdmin();

  const { data: topics, error } = await supabase
    .from("topics")
    .select("id, title, description, status, starts_at, ends_at, created_at")
    .order("created_at", { ascending: false });

  return (
    <main className="min-h-screen bg-gray-950 px-6 py-16 text-white">
      <section className="mx-auto max-w-5xl">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold">주제 관리</h1>
            <p className="mt-3 text-gray-300">
              운영자가 생성한 토론 주제를 관리합니다.
            </p>
            {params.message ? (
              <div className="mt-6 rounded-lg border border-green-500/40 bg-green-500/10 p-4 text-sm text-green-200">
                {params.message}
              </div>
            ) : null}
          </div>

          <a
            href="/admin/topics/new"
            className="rounded-lg bg-blue-500 px-4 py-3 font-medium text-white hover:bg-blue-400"
          >
            새 주제 생성
          </a>
        </div>

        {error ? (
          <div className="mt-6 rounded-lg border border-red-500/40 bg-red-500/10 p-4 text-sm text-red-200">
            주제 목록을 불러오지 못했습니다: {error.message}
          </div>
        ) : null}

        <div className="mt-8 space-y-4">
          {topics?.length ? (
            topics.map((topic) => (
              <article
                key={topic.id}
                className="rounded-lg border border-gray-700 bg-gray-900 p-6"
              >
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-sm text-blue-400">{topic.status}</p>
                    <h2 className="mt-2 text-xl font-bold">{topic.title}</h2>
                    <p className="mt-3 line-clamp-2 text-gray-300">
                      {topic.description}
                    </p>
                  </div>

                  <span className="rounded-full bg-gray-800 px-3 py-1 text-sm text-gray-300">
                    {new Date(topic.created_at).toLocaleDateString("ko-KR")}
                  </span>
                </div>
                <div className="mt-6 border-t border-gray-800 pt-5">
                  <form action={updateTopicStatus} className="flex flex-wrap items-end gap-3">
                    <input type="hidden" name="topic_id" value={topic.id} />

                    <div>
                      <label className="block text-sm font-medium text-gray-300">
                        상태 변경
                      </label>

                      <select
                        name="status"
                        defaultValue={topic.status}
                        className="mt-2 rounded-lg border border-gray-700 bg-gray-950 px-3 py-2 text-sm text-white outline-none focus:border-blue-500"
                      >
                        <option value="draft">draft - 임시저장</option>
                        <option value="open">open - 참가 가능</option>
                        <option value="active">active - 토론 진행 중</option>
                        <option value="closed">closed - 종료</option>
                        <option value="archived">archived - 보관</option>
                      </select>
                    </div>

                    <button className="rounded-lg bg-blue-500 px-4 py-2 text-sm font-medium text-white hover:bg-blue-400">
                      변경
                    </button>

                    <a
                      href={`/topics/${topic.id}`}
                      className="rounded-lg border border-gray-600 px-4 py-2 text-sm font-medium text-gray-200 hover:bg-gray-800"
                    >
                      유저 화면 보기
                    </a>

                    <a
                      href={`/admin/topics/${topic.id}/edit`}
                      className="rounded-lg border border-gray-600 px-4 py-2 text-sm font-medium text-gray-200 hover:bg-gray-800"
                    >
                      수정
                    </a>

                    <a
                      href={`/topics/${topic.id}/debate`}
                      className="rounded-lg border border-gray-600 px-4 py-2 text-sm font-medium text-gray-200 hover:bg-gray-800"
                    >
                      토론방 보기
                    </a>
                  </form>
                  {topic.status !== "archived" ? (
                    <form action={archiveTopic}>
                      <input type="hidden" name="topic_id" value={topic.id} />

                      <button className="rounded-lg border border-red-500/50 px-4 py-2 text-sm font-medium text-red-200 hover:bg-red-500/10">
                        보관 처리
                      </button>
                    </form>
                  ) : (
                    <span className="rounded-lg border border-gray-700 px-4 py-2 text-sm text-gray-500">
                      보관됨
                    </span>
                  )}
                </div>
              </article>
            ))
          ) : (
            <div className="rounded-lg border border-gray-700 bg-gray-900 p-8 text-center text-gray-300">
              아직 생성된 주제가 없습니다.
            </div>
          )}
        </div>
      </section>
    </main>
  );
}