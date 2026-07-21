import type { Metadata } from "next";
import Link from "next/link";

import { createClient } from "@/lib/supabase/server";

const description =
  "메트로폴리스 아고라의 운영 공지와 업데이트를 확인하세요.";

export const metadata: Metadata = {
  title: "공지사항",
  description,
  alternates: {
    canonical: "/notices",
  },
  openGraph: {
    title: "공지사항",
    description,
    url: "/notices",
  },
};

type NoticesPageProps = {
  searchParams: Promise<{
    message?: string;
    type?: string;
  }>;
};

type Notice = {
  id: string;
  title: string;
  content: string;
  is_pinned: boolean;
  published_at: string | null;
  created_at: string;
  view_count: number | string | null;
};

function formatDate(value: string | null) {
  if (!value) return "날짜 없음";

  return new Intl.DateTimeFormat("ko-KR", {
    timeZone: "Asia/Seoul",
    year: "numeric",
    month: "long",
    day: "numeric",
  }).format(new Date(value));
}

function getExcerpt(content: string) {
  const normalized = content.replace(/\s+/g, " ").trim();

  if (normalized.length <= 96) {
    return normalized;
  }

  return `${normalized.slice(0, 96)}...`;
}

export default async function NoticesPage({ searchParams }: NoticesPageProps) {
  const query = await searchParams;
  const supabase = await createClient();

  const { data } = await supabase
    .from("notices")
    .select("id, title, content, status, is_pinned, published_at, created_at, view_count")
    .eq("status", "published")
    .order("is_pinned", { ascending: false })
    .order("published_at", { ascending: false })
    .order("created_at", { ascending: false });

  const notices = (data ?? []) as Notice[];
  const pinnedNotices = notices.filter((notice) => notice.is_pinned);
  const normalNotices = notices.filter((notice) => !notice.is_pinned);

  return (
    <main
      className="min-h-screen bg-[var(--theme-bg)] px-4 py-10 text-[var(--theme-text)] transition-colors duration-300 sm:px-6 sm:py-14"
      style={{
        backgroundImage:
          "radial-gradient(circle at 12% 0%, var(--page-glow-gold), transparent 28%), radial-gradient(circle at 88% 8%, var(--page-glow-blue), transparent 30%), linear-gradient(90deg, var(--page-grid-line) 1px, transparent 1px)",
        backgroundSize: "auto, auto, 54px 54px",
      }}
    >
      <section className="mx-auto max-w-6xl">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <Link
            href="/"
            className="inline-flex items-center text-sm font-bold text-[var(--theme-gold)] transition hover:opacity-80"
          >
            ‹ 메인으로 돌아가기
          </Link>

          <Link
            href="/topics"
            className="inline-flex items-center justify-center border border-[var(--theme-line)] bg-[var(--theme-surface)] px-4 py-2 text-xs font-black text-[var(--theme-text)] transition hover:bg-[var(--theme-surface-hover)]"
          >
            의제 둘러보기
          </Link>
        </div>

        {query.message ? (
          <div
            className={
              query.type === "error"
                ? "mt-6 rounded-2xl border bg-[var(--message-error-bg)] p-4 text-sm font-bold text-[var(--message-error-text)]"
                : "mt-6 rounded-2xl border bg-[var(--message-success-bg)] p-4 text-sm font-bold text-[var(--message-success-text)]"
            }
            style={{
              borderColor:
                query.type === "error"
                  ? "var(--message-error-line)"
                  : "var(--message-success-line)",
            }}
          >
            {query.message}
          </div>
        ) : null}

        <div className="mt-8 overflow-hidden rounded-[2rem] border border-[var(--theme-line)] bg-[var(--theme-panel-strong)] shadow-[var(--shadow-card-strong)]">
          <div className="grid lg:grid-cols-[0.85fr_1.15fr]">
            <div className="bg-[var(--athena-surface)] p-6 transition-colors duration-300 sm:p-8">
              <div className="flex h-14 w-14 items-center justify-center rounded-full border border-[var(--theme-gold)] bg-[var(--athena-surface-soft)] text-3xl shadow-[var(--shadow-athena-icon)]">
                📜
              </div>

              <p className="mt-5 text-xs font-black uppercase tracking-[0.28em] text-[var(--theme-gold)]">
                Public Notice
              </p>

              <h1 className="mt-4 font-serif text-4xl font-black tracking-[0.06em] text-[var(--athena-text)] sm:text-5xl">
                공지 게시판
              </h1>

              <p className="mt-5 text-sm leading-7 text-[var(--athena-muted)]">
                메트로폴리스 운영진이 전하는 안내와 업데이트를 확인할 수
                있습니다.
              </p>
            </div>

            <div className="flex flex-col justify-center border-t border-[var(--theme-line)] bg-[var(--theme-panel)] p-6 transition-colors duration-300 sm:p-8 lg:border-l lg:border-t-0">
              <p className="text-xs font-black uppercase tracking-[0.28em] text-[var(--theme-blue)]">
                Agora Bulletin
              </p>

              <h2 className="mt-4 font-serif text-3xl font-black text-[var(--theme-text)]">
                시민에게 전하는 소식
              </h2>

              <p className="mt-4 text-sm leading-7 text-[var(--theme-muted)]">
                서비스 변경, 이벤트, 운영 정책, 중요한 안내사항은 이곳에
                게시됩니다.
              </p>

              <div className="mt-6 grid gap-3 sm:grid-cols-3">
                <div className="rounded-2xl border border-[var(--theme-line)] bg-[var(--theme-surface)] p-4 text-center">
                  <p className="text-xs font-black uppercase tracking-[0.18em] text-[var(--theme-soft)]">
                    Total
                  </p>
                  <p className="mt-2 text-2xl font-black text-[var(--theme-text)]">
                    {notices.length}
                  </p>
                </div>

                <div className="rounded-2xl border border-[var(--theme-line)] bg-[var(--theme-surface)] p-4 text-center">
                  <p className="text-xs font-black uppercase tracking-[0.18em] text-[var(--theme-soft)]">
                    Pinned
                  </p>
                  <p className="mt-2 text-2xl font-black text-[var(--theme-gold)]">
                    {pinnedNotices.length}
                  </p>
                </div>

                <div className="rounded-2xl border border-[var(--theme-line)] bg-[var(--theme-surface)] p-4 text-center">
                  <p className="text-xs font-black uppercase tracking-[0.18em] text-[var(--theme-soft)]">
                    Normal
                  </p>
                  <p className="mt-2 text-2xl font-black text-[var(--theme-blue)]">
                    {normalNotices.length}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {pinnedNotices.length ? (
          <section className="mt-8">
            <p className="text-xs font-black uppercase tracking-[0.28em] text-[var(--theme-gold)]">
              Pinned Notices
            </p>

            <div className="mt-4 grid gap-4">
              {pinnedNotices.map((notice) => (
                <Link
                  key={notice.id}
                  href={`/notices/${notice.id}`}
                  className="group block rounded-[1.5rem] border border-[var(--theme-gold)] bg-[var(--athena-surface-soft)] p-5 shadow-[var(--shadow-card)] transition duration-300 hover:-translate-y-0.5 hover:bg-[var(--athena-surface)]"
                >
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="rounded-full bg-[var(--theme-gold)] px-3 py-1 text-[11px] font-black text-[var(--theme-accent-contrast)]">
                      고정 공지
                    </span>
                    <span className="text-xs font-bold text-[var(--theme-soft)]">
                      {formatDate(notice.published_at ?? notice.created_at)}
                    </span>
                    <p className="text-xs text-gray-500">
                      조회수 {Number(notice.view_count ?? 0).toLocaleString("ko-KR")}
                    </p>
                  </div>

                  <h2 className="mt-3 font-serif text-2xl font-black text-[var(--theme-text)] transition group-hover:text-[var(--theme-gold)]">
                    {notice.title}
                  </h2>

                  <p className="mt-3 text-sm leading-7 text-[var(--theme-muted)]">
                    {getExcerpt(notice.content)}
                  </p>
                </Link>
              ))}
            </div>
          </section>
        ) : null}

        <section className="mt-8">
          <p className="text-xs font-black uppercase tracking-[0.28em] text-[var(--theme-blue)]">
            All Notices
          </p>

          <div className="mt-4 overflow-hidden rounded-[2rem] border border-[var(--theme-line)] bg-[var(--theme-panel)] shadow-[var(--shadow-card)]">
            {normalNotices.length ? (
              normalNotices.map((notice) => (
                <Link
                  key={notice.id}
                  href={`/notices/${notice.id}`}
                  className="group block border-b border-[var(--theme-line)] bg-[var(--theme-surface)] p-5 transition duration-300 last:border-b-0 hover:bg-[var(--theme-surface-hover)]"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <h2 className="font-serif text-2xl font-black text-[var(--theme-text)] transition group-hover:text-[var(--theme-gold)]">
                      {notice.title}
                    </h2>

                    <span className="text-xs font-bold text-[var(--theme-soft)]">
                      {formatDate(notice.published_at ?? notice.created_at)}
                    </span>
                    <p className="text-xs text-gray-500">
                      조회수 {Number(notice.view_count ?? 0).toLocaleString("ko-KR")}
                    </p>
                    
                    
                  </div>

                  <p className="mt-3 text-sm leading-7 text-[var(--theme-muted)]">
                    {getExcerpt(notice.content)}
                  </p>
                </Link>
              ))
            ) : (
              <div className="p-10 text-center">
                <p className="font-serif text-2xl font-black text-[var(--theme-text)]">
                  아직 등록된 일반 공지가 없습니다.
                </p>
                <p className="mt-3 text-sm text-[var(--theme-muted)]">
                  새로운 공지가 등록되면 이곳에 표시됩니다.
                </p>
              </div>
            )}
          </div>
        </section>
      </section>
    </main>
  );
}
