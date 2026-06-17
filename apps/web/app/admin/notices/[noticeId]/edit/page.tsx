import Link from "next/link";
import { notFound, redirect } from "next/navigation";

import { deleteNotice, updateNotice } from "@/app/actions/notices";
import { ConfirmSubmitButton } from "@/components/confirm-submit-button";
import { createClient } from "@/lib/supabase/server";

type AdminNoticeEditPageProps = {
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
};

async function getAdminClient(redirectTo: string) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect(
      `/login?message=${encodeURIComponent(
        "관리자 기능은 로그인 후 이용할 수 있습니다.",
      )}&redirectTo=${encodeURIComponent(redirectTo)}`,
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
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

export default async function AdminNoticeEditPage({
  params,
  searchParams,
}: AdminNoticeEditPageProps) {
  const { noticeId } = await params;
  const query = await searchParams;
  const redirectTo = `/admin/notices/${noticeId}/edit`;

  const supabase = await getAdminClient(redirectTo);

  const { data } = await supabase
    .from("notices")
    .select(
      "id, title, content, status, is_pinned, published_at, created_at, updated_at",
    )
    .eq("id", noticeId)
    .maybeSingle();

  if (!data) {
    notFound();
  }

  const notice = data as Notice;

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
            href="/admin"
            className="inline-flex items-center text-sm font-bold text-[var(--theme-gold)] transition hover:opacity-80"
          >
            ‹ 관리자 페이지로 돌아가기
          </Link>

          <Link
            href={`/notices/${notice.id}`}
            className="inline-flex items-center justify-center border border-[var(--theme-line)] bg-[var(--theme-surface)] px-4 py-2 text-xs font-black text-[var(--theme-text)] transition hover:bg-[var(--theme-surface-hover)]"
          >
            공지 상세 보기
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
          <div className="border-b border-[var(--theme-line)] bg-[var(--athena-surface)] p-6 sm:p-8">
            <p className="text-xs font-black uppercase tracking-[0.28em] text-[var(--theme-gold)]">
              Edit Notice
            </p>

            <h1 className="mt-4 font-serif text-4xl font-black tracking-[0.06em] text-[var(--theme-text)] sm:text-5xl">
              공지 수정
            </h1>

            <div className="mt-5 grid gap-3 text-xs font-bold text-[var(--theme-soft)] sm:grid-cols-3">
              <div className="rounded-2xl border border-[var(--theme-line)] bg-[var(--theme-surface)] p-3">
                생성일
                <p className="mt-1 text-[var(--theme-muted)]">
                  {formatDateTime(notice.created_at)}
                </p>
              </div>

              <div className="rounded-2xl border border-[var(--theme-line)] bg-[var(--theme-surface)] p-3">
                게시일
                <p className="mt-1 text-[var(--theme-muted)]">
                  {formatDateTime(notice.published_at)}
                </p>
              </div>

              <div className="rounded-2xl border border-[var(--theme-line)] bg-[var(--theme-surface)] p-3">
                수정일
                <p className="mt-1 text-[var(--theme-muted)]">
                  {formatDateTime(notice.updated_at)}
                </p>
              </div>
            </div>
          </div>

          <form action={updateNotice} className="space-y-6 p-6 sm:p-8">
            <input type="hidden" name="notice_id" value={notice.id} />
            <input type="hidden" name="redirect_to" value={redirectTo} />

            <div>
              <label className="block text-sm font-bold text-[var(--theme-muted)]">
                공지 제목
              </label>

              <input
                name="title"
                required
                minLength={2}
                maxLength={100}
                defaultValue={notice.title}
                className="mt-2 w-full rounded-xl border border-[var(--theme-line)] bg-[var(--theme-surface)] px-4 py-3 text-[var(--theme-text)] outline-none transition placeholder:text-[var(--theme-soft)] focus:border-[var(--theme-gold)]"
              />
            </div>

            <div>
              <label className="block text-sm font-bold text-[var(--theme-muted)]">
                공지 내용
              </label>

              <textarea
                name="content"
                required
                minLength={5}
                rows={14}
                defaultValue={notice.content}
                className="mt-2 w-full rounded-xl border border-[var(--theme-line)] bg-[var(--theme-surface)] px-4 py-3 text-[var(--theme-text)] outline-none transition placeholder:text-[var(--theme-soft)] focus:border-[var(--theme-gold)]"
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="block text-sm font-bold text-[var(--theme-muted)]">
                  공개 상태
                </label>

                <select
                  name="status"
                  defaultValue={notice.status}
                  className="mt-2 w-full rounded-xl border border-[var(--theme-line)] bg-[var(--theme-surface)] px-4 py-3 text-[var(--theme-text)] outline-none transition focus:border-[var(--theme-gold)]"
                >
                  <option value="published">공개</option>
                  <option value="draft">임시저장</option>
                </select>

                <p className="mt-2 text-xs font-bold text-[var(--theme-soft)]">
                  임시저장 상태는 일반 사용자에게 보이지 않습니다.
                </p>
              </div>

              <div className="rounded-2xl border border-[var(--theme-line)] bg-[var(--theme-surface)] p-5">
                <label className="flex cursor-pointer items-start gap-3">
                  <input
                    type="checkbox"
                    name="is_pinned"
                    defaultChecked={notice.is_pinned}
                    className="mt-1 h-4 w-4 accent-[var(--theme-gold)]"
                  />

                  <span>
                    <span className="block text-sm font-black text-[var(--theme-text)]">
                      상단 고정 공지
                    </span>
                    <span className="mt-1 block text-xs font-bold leading-6 text-[var(--theme-soft)]">
                      공지 목록 상단에 강조 표시합니다.
                    </span>
                  </span>
                </label>
              </div>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row">
              <button className="inline-flex flex-1 items-center justify-center border border-[var(--theme-gold)] bg-[var(--theme-gold)] px-5 py-3 text-sm font-black text-[var(--theme-accent-contrast)] shadow-[var(--shadow-button)] transition duration-300 hover:opacity-85">
                수정 저장하기
              </button>

              <Link
                href={`/notices/${notice.id}`}
                className="inline-flex flex-1 items-center justify-center border border-[var(--theme-line)] bg-[var(--theme-surface)] px-5 py-3 text-sm font-black text-[var(--theme-text)] transition hover:bg-[var(--theme-surface-hover)]"
              >
                취소
              </Link>
            </div>
          </form>

          <div className="border-t border-[var(--theme-line)] bg-[var(--theme-bg)] p-6 sm:p-8">
            <div className="rounded-2xl border border-[var(--message-error-line)] bg-[var(--message-error-bg)] p-5">
              <p className="text-xs font-black uppercase tracking-[0.22em] text-[var(--message-error-text)]">
                Danger Zone
              </p>

              <h2 className="mt-3 font-serif text-2xl font-black text-[var(--theme-text)]">
                공지 삭제
              </h2>

              <p className="mt-3 text-sm leading-7 text-[var(--theme-muted)]">
                삭제된 공지는 복구할 수 없습니다. 정말 불필요한 공지만 삭제하세요.
              </p>

              <form action={deleteNotice} className="mt-5">
                <input type="hidden" name="notice_id" value={notice.id} />
                <input type="hidden" name="redirect_to" value="/notices" />

                <ConfirmSubmitButton
                  message="정말 이 공지를 삭제하시겠습니까? 삭제 후에는 복구할 수 없습니다."
                  className="inline-flex w-full items-center justify-center border border-[var(--message-error-line)] bg-[var(--message-error-bg)] px-5 py-3 text-sm font-black text-[var(--message-error-text)] transition hover:opacity-80 sm:w-auto"
                >
                  공지 삭제하기
                </ConfirmSubmitButton>
              </form>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}