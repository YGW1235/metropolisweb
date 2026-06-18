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
            className="inline-flex items-center justify-center border border-[var(--message-error-line)] bg-[var(--message-error-bg)] px-5 py-3 text-sm font-black text-[var(--message-error-text)] transition hover:opacity-80"
          >
            주제 관리하기
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

          <a
            href="/admin/notices/new"
            className="inline-flex items-center justify-center border border-[var(--theme-gold)] bg-[var(--theme-gold)] px-5 py-3 text-sm font-black text-[var(--theme-accent-contrast)] shadow-[var(--shadow-button)] transition hover:opacity-85"
          >
            공지 작성하기
          </a>

          <a
            href="/admin/notices"
            className="inline-flex items-center justify-center border border-[var(--theme-blue)] bg-[var(--theme-blue)] px-5 py-3 text-sm font-black text-[var(--theme-accent-contrast)] shadow-[var(--shadow-button)] transition hover:opacity-85"
          >
            공지 관리하기
          </a>

          <a
            href="/admin/users"
            className="rounded-xl border border-gray-800 bg-gray-950 p-5 hover:border-blue-500/60"
          >
            <p className="text-lg font-semibold text-gray-100">유저 관리</p>
            <p className="mt-2 text-sm text-gray-400">
              유저 상태를 확인하고 정지/복구를 처리합니다.
            </p>
          </a>

          <a
            href="/admin/activity"
            className="rounded-xl border border-gray-800 bg-gray-950 p-5 hover:border-blue-500/60"
          >
            <p className="text-lg font-semibold text-gray-100">활동 로그</p>
            <p className="mt-2 text-sm text-gray-400">
              신고 처리, 유저 정지/복구 등 관리자 작업 기록을 확인합니다.
            </p>
          </a>

          <a
            href="/admin/stats"
            className="rounded-xl border border-gray-800 bg-gray-950 p-5 hover:border-blue-500/60"
          >
            <p className="text-lg font-semibold text-gray-100">주제별 통계</p>
            <p className="mt-2 text-sm text-gray-400">
              참가자, 게시글, 댓글, 신고 현황을 확인합니다.
            </p>
          </a>

          <a
            href="/admin/inquiries"
            className="rounded-xl border border-gray-800 bg-gray-950 p-5 hover:border-blue-500/60"
          >
            <p className="text-lg font-semibold text-gray-100">문의 관리</p>
            <p className="mt-2 text-sm text-gray-400">
              유저와 방문자가 남긴 문의를 확인하고 처리합니다.
            </p>
          </a>

          <a
            href="/admin/security"
            className="rounded-xl border border-gray-800 bg-gray-950 p-5 hover:border-blue-500/60"
          >
            <p className="text-lg font-semibold text-gray-100">관리자 보안 점검</p>
            <p className="mt-2 text-sm text-gray-400">
              관리자 계정 상태, 이메일 인증, 예비 관리자 여부를 확인합니다.
            </p>
          </a>


        </div>
      </section>
    </main>
  );
}