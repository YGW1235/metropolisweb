import Link from "next/link";
import { notFound } from "next/navigation";

import { createClient } from "@/lib/supabase/server";

type NoticeDetailPageProps = {
  params: Promise<{
    noticeId: string;
  }>;
  searchParams: Promise<{
    message?: string;
    type?: string;
  }>;
};

type Notice = {
  id: string;
  title: string;
  content: string;
  status: "draft" | "published";
  is_pinned: boolean;
  published_at: string | null;
  created_at: string;
  updated_at: string;
  view_count: number | string | null;
};

function formatDateTime(value: string | null) {
  if (!value) return "날짜 없음";

  return new Intl.DateTimeFormat("ko-KR", {
    timeZone: "Asia/Seoul",
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

export default async function NoticeDetailPage({
  params,
  searchParams,
}: NoticeDetailPageProps) {
  const { noticeId } = await params;
  const query = await searchParams;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  let isAdmin = false;

  if (user) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("role, status")
      .eq("id", user.id)
      .maybeSingle();

    isAdmin = profile?.role === "admin" && profile?.status === "active";
  }

  const { data: publicNoticeRows, error: publicNoticeError } =
    await supabase.rpc("get_public_notice", {
      p_notice_id: noticeId,
    });

  let notice = Array.isArray(publicNoticeRows)
    ? ((publicNoticeRows[0] ?? null) as Notice | null)
    : null;

  if (!notice && isAdmin) {
    const { data: adminNotice } = await supabase
      .from("notices")
      .select(
        "id, title, content, status, is_pinned, published_at, created_at, updated_at, view_count",
      )
      .eq("id", noticeId)
      .maybeSingle();

    notice = adminNotice as Notice | null;
  }

  if (publicNoticeError && !isAdmin) {
    notFound();
  }

  if (!notice) {
    notFound();
  }

  if (notice.status !== "published" && !isAdmin) {
    notFound();
  }

  return (
    <main
      className="min-h-screen bg-[var(--theme-bg)] px-4 py-10 text-[var(--theme-text)] transition-colors duration-300 sm:px-6 sm:py-14"
      style={{
        backgroundImage:
          "radial-gradient(circle at 12% 0%, var(--page-glow-gold), transparent 28%), radial-gradient(circle at 88% 8%, var(--page-glow-blue), transparent 30%), linear-gradient(90deg, var(--page-grid-line) 1px, transparent 1px)",
        backgroundSize: "auto, auto, 54px 54px",
      }}
    >
      <section className="mx-auto max-w-4xl">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <Link
            href="/notices"
            className="inline-flex items-center text-sm font-bold text-[var(--theme-gold)] transition hover:opacity-80"
          >
            ‹ 공지 목록으로 돌아가기
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

        <article className="mt-8 overflow-hidden rounded-[2rem] border border-[var(--theme-line)] bg-[var(--theme-panel)] shadow-[var(--shadow-card-strong)]">
          <div className="border-b border-[var(--theme-line)] bg-[var(--athena-surface)] p-6 sm:p-8">
            <div className="flex flex-wrap items-center gap-2">
              {notice.is_pinned ? (
                <span className="rounded-full bg-[var(--theme-gold)] px-3 py-1 text-[11px] font-black text-[var(--theme-accent-contrast)]">
                  고정 공지
                </span>
              ) : null}

              <span className="rounded-full border border-[var(--theme-line)] bg-[var(--theme-surface)] px-3 py-1 text-[11px] font-black text-[var(--theme-muted)]">
                공지
              </span>

              {notice.status === "draft" ? (
                <span className="rounded-full border border-[var(--theme-blue)] bg-[var(--poseidon-surface-soft)] px-3 py-1 text-[11px] font-black text-[var(--poseidon-text)]">
                  임시저장
                </span>
              ) : null}
            </div>

            <h1 className="mt-5 font-serif text-4xl font-black leading-tight tracking-[0.04em] text-[var(--theme-text)] sm:text-5xl">
              {notice.title}
            </h1>

            <div className="mt-5 flex flex-wrap gap-3 text-xs font-bold text-[var(--theme-soft)]">
              <span>
                게시일:{" "}
                {formatDateTime(notice.published_at ?? notice.created_at)}
              </span>
              <span>수정일: {formatDateTime(notice.updated_at)}</span>
              <span>
                조회수 {Number(notice.view_count ?? 0).toLocaleString("ko-KR")}
              </span>
            </div>
          </div>

          <div className="bg-[var(--theme-panel)] p-6 sm:p-8">
            <p className="whitespace-pre-wrap text-base leading-9 text-[var(--theme-muted)]">
              {notice.content}
            </p>
          </div>
        </article>

        <div className="mt-6 flex flex-col gap-3 sm:flex-row">
          <Link
            href="/notices"
            className="inline-flex flex-1 items-center justify-center border border-[var(--theme-line)] bg-[var(--theme-surface)] px-5 py-3 text-sm font-black text-[var(--theme-text)] transition hover:bg-[var(--theme-surface-hover)]"
          >
            공지 목록
          </Link>

          {isAdmin ? (
            <Link
              href={`/admin/notices/${notice.id}/edit`}
              className="inline-flex flex-1 items-center justify-center border border-[var(--theme-blue)] bg-[var(--theme-blue)] px-5 py-3 text-sm font-black text-[var(--theme-accent-contrast)] shadow-[var(--shadow-button)] transition hover:opacity-85"
            >
              관리자 수정
            </Link>
          ) : null}

          <Link
            href="/"
            className="inline-flex flex-1 items-center justify-center border border-[var(--theme-gold)] bg-[var(--theme-gold)] px-5 py-3 text-sm font-black text-[var(--theme-accent-contrast)] shadow-[var(--shadow-button)] transition hover:opacity-85"
          >
            메인으로 이동
          </Link>
        </div>
      </section>
    </main>
  );
}