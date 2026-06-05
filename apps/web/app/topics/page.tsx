import { createClient } from "@/lib/supabase/server";

type TopicsPageProps = {
  searchParams: Promise<{
    message?: string;
  }>;
};

export default async function TopicsPage({ searchParams }: TopicsPageProps) {
  const params = await searchParams;
  const supabase = await createClient();

  const { data: topics, error } = await supabase
    .from("topics")
    .select("id, title, description, status, starts_at, ends_at, created_at")
    .order("created_at", { ascending: false });

  return (
    <main className="min-h-screen bg-gray-950 px-6 py-16 text-white">
      <section className="mx-auto max-w-5xl">
        <h1 className="text-3xl font-bold">토론 주제 목록</h1>
        <p className="mt-3 text-gray-300">
          참여 가능한 토론 주제를 확인하세요.
        </p>

        {params.message ? (
          <div className="mt-6 rounded-lg border border-yellow-500/40 bg-yellow-500/10 p-4 text-sm text-yellow-200">
            {params.message}
          </div>
        ) : null}
        
        {error ? (
          <div className="mt-6 rounded-lg border border-red-500/40 bg-red-500/10 p-4 text-sm text-red-200">
            주제 목록을 불러오지 못했습니다: {error.message}
          </div>
        ) : null}

        <div className="mt-8 grid gap-4">
          {topics?.length ? (
            topics.map((topic) => (
              <article
                key={topic.id}
                className="rounded-lg border border-gray-700 bg-gray-900 p-6"
              >
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <p className="text-sm text-blue-400">
                      {topic.status === "open"
                        ? "참가 가능"
                        : topic.status === "active"
                          ? "진행 중"
                          : "종료"}
                    </p>

                    <h2 className="mt-2 text-xl font-bold">{topic.title}</h2>

                    <p className="mt-3 text-gray-300">{topic.description}</p>
                  </div>

                  <a
                    href={`/topics/${topic.id}`}
                    className="w-full rounded-lg border border-gray-600 px-4 py-2 text-center text-sm font-medium text-gray-200 hover:bg-gray-800 sm:w-auto"
                  >
                    자세히 보기
                  </a>
                </div>
              </article>
            ))
          ) : (
            <div className="rounded-lg border border-gray-700 bg-gray-900 p-8 text-center text-gray-300">
              현재 공개된 토론 주제가 없습니다.
            </div>
          )}
        </div>
      </section>
    </main>
  );
}