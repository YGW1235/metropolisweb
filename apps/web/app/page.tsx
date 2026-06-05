export default function HomePage() {
  return (
    <main className="min-h-screen bg-gray-950 text-white">
      <section className="mx-auto flex min-h-[calc(100vh-73px)] max-w-5xl flex-col items-center justify-center px-4 py-16 text-center sm:px-6">
        <p className="mb-4 text-sm font-semibold text-blue-400">
          Metropolis Debate
        </p>

        <h1 className="text-4xl font-bold tracking-tight sm:text-6xl">
          역할 기반 토론 플랫폼
        </h1>

        <p className="mt-6 max-w-2xl text-lg text-gray-300">
          운영자가 주제를 만들고, 유저는 찬성 또는 반대 역할을 부여받아
          게시판 형태로 토론에 참여합니다.
        </p>

        <div className="mt-10 flex w-full flex-col gap-3 sm:w-auto sm:flex-row sm:justify-center">
          <a
            href="/topics"
            className="rounded-lg bg-blue-500 px-5 py-3 text-center font-medium text-white hover:bg-blue-400"
          >
            토론 주제 보기
          </a>

          <a
            href="/me"
            className="rounded-lg border border-gray-600 px-5 py-3 text-center font-medium text-gray-200 hover:bg-gray-800"
          >
            내 계정
          </a>
        </div>
      </section>
    </main>
  );
}