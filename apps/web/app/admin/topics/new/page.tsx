import { createTopic } from "@/app/actions/topics";

type NewTopicPageProps = {
  searchParams: Promise<{
    message?: string;
  }>;
};

export default async function NewTopicPage({ searchParams }: NewTopicPageProps) {
  const params = await searchParams;

  return (
    <main className="min-h-screen bg-gray-950 px-6 py-16 text-white">
      <section className="mx-auto max-w-2xl">
        <a href="/admin/topics" className="text-sm text-blue-400 hover:underline">
          ← 주제 관리로 돌아가기
        </a>

        <h1 className="mt-6 text-3xl font-bold">토론 주제 생성</h1>
        <p className="mt-3 text-gray-300">
          운영자가 유저들이 참여할 토론 주제를 생성합니다.
        </p>

        {params.message ? (
          <div className="mt-6 rounded-lg border border-red-500/40 bg-red-500/10 p-4 text-sm text-red-200">
            {params.message}
          </div>
        ) : null}

        <form action={createTopic} className="mt-8 space-y-5">
          <div>
            <label className="block text-sm font-medium text-gray-200">
              주제 제목
            </label>
            <input
              name="title"
              required
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
              rows={6}
              className="mt-2 w-full rounded-lg border border-gray-700 bg-gray-900 px-4 py-3 text-white outline-none focus:border-blue-500"
              placeholder="토론 배경, 참고할 쟁점, 참가자가 알아야 할 내용을 작성하세요."
            />
          </div>

          <div className="grid gap-4 lg:grid-cols-2">
            <div>
              <label className="block text-sm font-bold text-[var(--theme-muted)]">
                아테나 측 기본 주장
              </label>

              <textarea
                name="athena_position"
                rows={7}
                className="mt-2 w-full rounded-xl border border-[var(--theme-line)] bg-[var(--theme-surface)] px-4 py-3 text-[var(--theme-text)] outline-none transition placeholder:text-[var(--theme-soft)] focus:border-[var(--theme-gold)]"
                placeholder="아테나 측이 이 주제에서 출발점으로 삼을 주장을 입력하세요."
              />

              <p className="mt-2 text-xs font-bold text-[var(--theme-soft)]">
                질서, 지혜, 제도, 안정성의 관점에서 작성하면 좋습니다.
              </p>
            </div>

            <div>
              <label className="block text-sm font-bold text-[var(--theme-muted)]">
                포세이돈 측 기본 주장
              </label>

              <textarea
                name="poseidon_position"
                rows={7}
                className="mt-2 w-full rounded-xl border border-[var(--theme-line)] bg-[var(--theme-surface)] px-4 py-3 text-[var(--theme-text)] outline-none transition placeholder:text-[var(--theme-soft)] focus:border-[var(--theme-blue)]"
                placeholder="포세이돈 측이 이 주제에서 출발점으로 삼을 주장을 입력하세요."
              />

              <p className="mt-2 text-xs font-bold text-[var(--theme-soft)]">
                변화, 자유, 현실성, 역동성의 관점에서 작성하면 좋습니다.
              </p>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-200">
              상태
            </label>
            <select
              name="status"
              defaultValue="open"
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
                className="mt-2 w-full rounded-lg border border-gray-700 bg-gray-900 px-4 py-3 text-white outline-none focus:border-blue-500"
              />
            </div>
          </div>

          <button className="w-full rounded-lg bg-blue-500 px-5 py-3 font-medium text-white hover:bg-blue-400">
            주제 생성
          </button>
        </form>
      </section>
    </main>
  );
}