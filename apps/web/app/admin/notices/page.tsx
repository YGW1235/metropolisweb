import Link from "next/link";
import { redirect } from "next/navigation";

import { deleteNotice } from "@/app/actions/notices";
import { ConfirmSubmitButton } from "@/components/confirm-submit-button";
import { createClient } from "@/lib/supabase/server";

type AdminNoticesPageProps = {
  searchParams: Promise<{
    message?: string;
    type?: string;
  }>;
};

type Notice = {
  id: string;
  title: string;
  status: "draft" | "published";
  is_pinned: boolean;
  published_at: string | null;
  created_at: string;
  updated_at: string;
  view_count: number | string | null;
};

async function getAdminClient() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect(
      `/login?message=${encodeURIComponent(
        "관리자 기능은 로그인 후 이용할 수 있습니다.",
      )}&redirectTo=${encodeURIComponent("/admin/notices")}`,
    );
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role, status")
    .eq("id", user.id)
    .maybeSingle();

  if (profile?.role !== "admin" || profile?.status !== "active") {
    redirect(
      `/?message=${encodeURIComponent(
        "관리자만 이용할 수 있는 기능입니다.",
      )}&type=error`,
    );
  }

  return supabase;
}

function formatDateTime(value: string | null) {
  if (!value) return "기록 없음";

  return new Intl.DateTimeFormat("ko-KR", {
    timeZone: "Asia/Seoul",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

function NoticeStatusBadge({ notice }: { notice: Notice }) {
  if (notice.status === "published") {
    return (
      <span className="rounded-full border border-[var(--theme-gold)] bg-[var(--athena-surface-soft)] px-3 py-1 text-[11px] font-black text-[var(--theme-gold)]">
        공개
      </span>
    );
  }

  return (
    <span className="rounded-full border border-[var(--theme-blue)] bg-[var(--poseidon-surface-soft)] px-3 py-1 text-[11px] font-black text-[var(--poseidon-text)]">
      임시저장
    </span>
  );
}

export default async function AdminNoticesPage({
  searchParams,
}: AdminNoticesPageProps) {
  const query = await searchParams;
  const supabase = await getAdminClient();

  const { data } = await supabase
    .from("notices")
    .select("id, title, content, status, is_pinned, published_at, created_at, updated_at, view_count")
    .order("is_pinned", { ascending: false })
    .order("created_at", { ascending: false });

  const notices = (data ?? []) as Notice[];
  const publishedCount = notices.filter(
    (notice) => notice.status === "published",
  ).length;
  const draftCount = notices.filter((notice) => notice.status === "draft").length;
  const pinnedCount = notices.filter((notice) => notice.is_pinned).length;

  return (
    <main
      className="min-h-screen bg-[var(--theme-bg)] px-4 py-10 text-[var(--theme-text)] transition-colors duration-300 sm:px-6 sm:py-14"
      style={{
        backgroundImage:
          "radial-gradient(circle at 12% 0%, var(--page-glow-gold), transparent 28%), radial-gradient(circle at 88% 8%, var(--page-glow-blue), transparent 30%), linear-gradient(90deg, var(--page-grid-line) 1px, transparent 1px)",
        backgroundSize: "auto, auto, 54px 54px",
      }}
    >
      <section className="mx-auto max-w-7xl">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <Link
            href="/admin"
            className="inline-flex items-center text-sm font-bold text-[var(--theme-gold)] transition hover:opacity-80"
          >
            ‹ 관리자 페이지로 돌아가기
          </Link>

          <div className="flex flex-wrap gap-2">
            <Link
              href="/notices"
              className="inline-flex items-center justify-center border border-[var(--theme-line)] bg-[var(--theme-surface)] px-4 py-2 text-xs font-black text-[var(--theme-text)] transition hover:bg-[var(--theme-surface-hover)]"
            >
              공지 게시판 보기
            </Link>

            <Link
              href="/admin/notices/new"
              className="inline-flex items-center justify-center border border-[var(--theme-gold)] bg-[var(--theme-gold)] px-4 py-2 text-xs font-black text-[var(--theme-accent-contrast)] shadow-[var(--shadow-button)] transition hover:opacity-85"
            >
              새 공지 작성
            </Link>
          </div>
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
            <div className="bg-[var(--athena-surface)] p-6 sm:p-8">
              <p className="text-xs font-black uppercase tracking-[0.28em] text-[var(--theme-gold)]">
                Notice Admin
              </p>

              <h1 className="mt-4 font-serif text-4xl font-black tracking-[0.06em] text-[var(--theme-text)] sm:text-5xl">
                공지 관리
              </h1>

              <p className="mt-5 text-sm leading-7 text-[var(--theme-muted)]">
                공개 공지와 임시저장 공지를 한 곳에서 관리합니다.
              </p>
            </div>

            <div className="grid gap-3 border-t border-[var(--theme-line)] bg-[var(--theme-panel)] p-6 sm:grid-cols-4 sm:p-8 lg:border-l lg:border-t-0">
              <div className="rounded-2xl border border-[var(--theme-line)] bg-[var(--theme-surface)] p-4 text-center">
                <p className="text-xs font-black uppercase tracking-[0.18em] text-[var(--theme-soft)]">
                  Total
                </p>
                <p className="mt-2 text-3xl font-black text-[var(--theme-text)]">
                  {notices.length}
                </p>
              </div>

              <div className="rounded-2xl border border-[var(--theme-line)] bg-[var(--theme-surface)] p-4 text-center">
                <p className="text-xs font-black uppercase tracking-[0.18em] text-[var(--theme-soft)]">
                  Published
                </p>
                <p className="mt-2 text-3xl font-black text-[var(--theme-gold)]">
                  {publishedCount}
                </p>
              </div>

              <div className="rounded-2xl border border-[var(--theme-line)] bg-[var(--theme-surface)] p-4 text-center">
                <p className="text-xs font-black uppercase tracking-[0.18em] text-[var(--theme-soft)]">
                  Draft
                </p>
                <p className="mt-2 text-3xl font-black text-[var(--theme-blue)]">
                  {draftCount}
                </p>
              </div>

              <div className="rounded-2xl border border-[var(--theme-line)] bg-[var(--theme-surface)] p-4 text-center">
                <p className="text-xs font-black uppercase tracking-[0.18em] text-[var(--theme-soft)]">
                  Pinned
                </p>
                <p className="mt-2 text-3xl font-black text-[var(--theme-text)]">
                  {pinnedCount}
                </p>
              </div>
            </div>
          </div>
        </div>

        <section className="mt-8 overflow-hidden rounded-[2rem] border border-[var(--theme-line)] bg-[var(--theme-panel)] shadow-[var(--shadow-card)]">
          <div className="border-b border-[var(--theme-line)] bg-[var(--theme-panel-strong)] p-5">
            <p className="text-xs font-black uppercase tracking-[0.28em] text-[var(--theme-blue)]">
              Notice List
            </p>
          </div>

          {notices.length ? (
            <div className="divide-y divide-[var(--theme-line)]">
              {notices.map((notice) => (
                <div
                  key={notice.id}
                  className="grid gap-4 bg-[var(--theme-surface)] p-5 transition hover:bg-[var(--theme-surface-hover)] lg:grid-cols-[1fr_13rem_17rem]"
                >
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <NoticeStatusBadge notice={notice} />

                      {notice.is_pinned ? (
                        <span className="rounded-full bg-[var(--theme-gold)] px-3 py-1 text-[11px] font-black text-[var(--theme-accent-contrast)]">
                          고정
                        </span>
                      ) : null}
                    </div>

                    <h2 className="mt-3 font-serif text-2xl font-black text-[var(--theme-text)]">
                      {notice.title}
                    </h2>

                    <div className="mt-2 flex flex-wrap gap-3 text-xs font-bold text-[var(--theme-soft)]">
                      <span>
                        게시일:{" "}
                        {formatDateTime(notice.published_at ?? notice.created_at)}
                      </span>
                      <span>수정일: {formatDateTime(notice.updated_at)}</span>
                      <p className="text-xs text-gray-500">
                        조회수 {Number(notice.view_count ?? 0).toLocaleString("ko-KR")}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center text-sm font-bold text-[var(--theme-muted)]">
                    {notice.status === "published"
                      ? "사용자에게 공개 중"
                      : "관리자에게만 보임"}
                  </div>

                  <div className="flex flex-col gap-2 sm:flex-row lg:items-center lg:justify-end">
                    <Link
                      href={`/notices/${notice.id}`}
                      className="inline-flex items-center justify-center border border-[var(--theme-line)] bg-[var(--theme-panel)] px-4 py-2 text-xs font-black text-[var(--theme-text)] transition hover:bg-[var(--theme-surface-hover)]"
                    >
                      보기
                    </Link>

                    <Link
                      href={`/admin/notices/${notice.id}/edit`}
                      className="inline-flex items-center justify-center border border-[var(--theme-blue)] bg-[var(--theme-blue)] px-4 py-2 text-xs font-black text-[var(--theme-accent-contrast)] shadow-[var(--shadow-button)] transition hover:opacity-85"
                    >
                      수정
                    </Link>

                    <form action={deleteNotice}>
                      <input type="hidden" name="notice_id" value={notice.id} />
                      <input
                        type="hidden"
                        name="redirect_to"
                        value="/admin/notices"
                      />

                      <ConfirmSubmitButton
                        confirmMessage="정말 이 공지를 삭제하시겠습니까? 삭제 후에는 복구할 수 없습니다. 이 작업은 운영 로그에 기록될 수 있습니다."
                        ariaLabel={`${notice.title} 삭제 확인`}
                        className="inline-flex w-full items-center justify-center border border-[var(--message-error-line)] bg-[var(--message-error-bg)] px-4 py-2 text-xs font-black text-[var(--message-error-text)] transition hover:opacity-80"
                      >
                        삭제
                      </ConfirmSubmitButton>
                    </form>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-10 text-center">
              <p className="font-serif text-2xl font-black text-[var(--theme-text)]">
                아직 등록된 공지가 없습니다.
              </p>
              <p className="mt-3 text-sm text-[var(--theme-muted)]">
                첫 공지를 작성해 시민들에게 안내를 남겨보세요.
              </p>

              <Link
                href="/admin/notices/new"
                className="mt-6 inline-flex items-center justify-center border border-[var(--theme-gold)] bg-[var(--theme-gold)] px-5 py-3 text-sm font-black text-[var(--theme-accent-contrast)] shadow-[var(--shadow-button)] transition hover:opacity-85"
              >
                첫 공지 작성하기
              </Link>
            </div>
          )}
        </section>
      </section>
    </main>
  );
}
