export default function AdminPage() {
  return (
    <main className="min-h-screen bg-gray-950 p-8 text-white">
      <section className="mx-auto max-w-3xl">
        <h1 className="text-3xl font-bold">관리자 페이지</h1>
        <p className="mt-4 text-gray-300">
          운영자가 토론 주제를 관리하는 페이지입니다.
        </p>

        <div className="mt-8 grid gap-4 sm:grid-cols-2">
          <a
            href="/admin/topics"
            className="rounded-lg border border-gray-700 bg-gray-900 p-6 hover:bg-gray-800"
          >
            <h2 className="text-xl font-bold">주제 관리</h2>
            <p className="mt-2 text-gray-300">
              토론 주제를 생성하고 상태를 확인합니다.
            </p>
          </a>

          <a
            href="/topics"
            className="rounded-lg border border-gray-700 bg-gray-900 p-6 hover:bg-gray-800"
          >
            <h2 className="text-xl font-bold">유저 화면 확인</h2>
            <p className="mt-2 text-gray-300">
              유저에게 보이는 토론 주제 목록을 확인합니다.
            </p>
          </a>
          <a
            href="/admin/reports"
            className="rounded-lg border border-gray-700 bg-gray-900 p-6 hover:bg-gray-800"
            >
            <h2 className="text-xl font-bold">신고 관리</h2>
            <p className="mt-2 text-gray-300">
                유저가 신고한 게시글과 댓글을 확인합니다.
            </p>
          </a>


        </div>
      </section>
    </main>
  );
}