import Link from "next/link";
import { redirect } from "next/navigation";

import { createNotice } from "@/app/actions/notices";
import { PendingSubmitButton } from "@/components/pending-submit-button";
import { createClient } from "@/lib/supabase/server";

type AdminNoticeNewPageProps = {
  searchParams: Promise<{
    message?: string;
    type?: string;
  }>;
};

async function getAdminProfile() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect(
      `/login?message=${encodeURIComponent(
        "관리자 기능은 로그인 후 이용할 수 있습니다.",
      )}&redirectTo=${encodeURIComponent("/admin/notices/new")}`,
    );
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role, status, display_name")
    .eq("id", user.id)
    .maybeSingle();

  if (profile?.role !== "admin" || profile?.status !== "active") {
    redirect(
      `/?message=${encodeURIComponent(
        "관리자만 이용할 수 있는 기능입니다.",
      )}&type=error`,
    );
  }

  return profile;
}

export default async function AdminNoticeNewPage({
  searchParams,
}: AdminNoticeNewPageProps) {
  const query = await searchParams;
  const profile = await getAdminProfile();

  const displayName = profile.display_name?.trim() || "관리자";

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
            href="/notices"
            className="inline-flex items-center justify-center border border-[var(--theme-line)] bg-[var(--theme-surface)] px-4 py-2 text-xs font-black text-[var(--theme-text)] transition hover:bg-[var(--theme-surface-hover)]"
          >
            공지 게시판 보기
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
              Admin Notice
            </p>

            <h1 className="mt-4 font-serif text-4xl font-black tracking-[0.06em] text-[var(--theme-text)] sm:text-5xl">
              공지 작성
            </h1>

            <p className="mt-4 text-sm leading-7 text-[var(--theme-muted)]">
              {displayName}님, 시민들에게 전달할 공지를 작성하세요. 작성된
              공지는 공지 게시판에 바로 게시됩니다.
            </p>
          </div>

          <form action={createNotice} className="space-y-6 p-6 sm:p-8">
            <input type="hidden" name="status" value="published" />

            <div>
              <label className="block text-sm font-bold text-[var(--theme-muted)]">
                공지 제목
              </label>

              <input
                name="title"
                required
                minLength={2}
                maxLength={100}
                className="mt-2 w-full rounded-xl border border-[var(--theme-line)] bg-[var(--theme-surface)] px-4 py-3 text-[var(--theme-text)] outline-none transition placeholder:text-[var(--theme-soft)] focus:border-[var(--theme-gold)]"
                placeholder="예: 메트로폴리스 베타 운영 안내"
              />

              <p className="mt-2 text-xs font-bold text-[var(--theme-soft)]">
                시민들이 목록에서 바로 이해할 수 있는 제목을 권장합니다.
              </p>
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
                className="mt-2 w-full rounded-xl border border-[var(--theme-line)] bg-[var(--theme-surface)] px-4 py-3 text-[var(--theme-text)] outline-none transition placeholder:text-[var(--theme-soft)] focus:border-[var(--theme-gold)]"
                placeholder={`공지 내용을 입력하세요.

예:
안녕하세요, 메트로폴리스 운영진입니다.

이번 업데이트에서는 ...
이용 중 문제가 있다면 ...`}
              />

              <p className="mt-2 text-xs font-bold text-[var(--theme-soft)]">
                줄바꿈은 공지 상세 페이지에 그대로 반영됩니다.
              </p>
            </div>

            <div className="rounded-2xl border border-[var(--theme-line)] bg-[var(--theme-surface)] p-5">
              <label className="flex cursor-pointer items-start gap-3">
                <input
                  type="checkbox"
                  name="is_pinned"
                  className="mt-1 h-4 w-4 accent-[var(--theme-gold)]"
                />

                <span>
                  <span className="block text-sm font-black text-[var(--theme-text)]">
                    상단 고정 공지로 게시
                  </span>
                  <span className="mt-1 block text-xs font-bold leading-6 text-[var(--theme-soft)]">
                    중요한 공지일 경우 공지 목록의 상단 영역에 강조 표시됩니다.
                  </span>
                </span>
              </label>
            </div>

            <div className="rounded-2xl border border-[var(--theme-line)] bg-[var(--poseidon-surface-soft)] p-5">
              <p className="text-xs font-black uppercase tracking-[0.22em] text-[var(--theme-blue)]">
                Notice Guide
              </p>

              <div className="mt-3 space-y-2 text-sm leading-7 text-[var(--poseidon-muted)]">
                <p>1. 서비스 점검, 업데이트, 정책 변경은 공지로 남기는 것이 좋습니다.</p>
                <p>2. 너무 긴 내용은 문단을 나누어 작성하면 읽기 좋습니다.</p>
                <p>3. 고정 공지는 정말 중요한 안내에만 사용하는 것을 권장합니다.</p>
              </div>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row">
              <PendingSubmitButton
                pendingText="게시 중..."
                className="inline-flex flex-1 items-center justify-center border border-[var(--theme-gold)] bg-[var(--theme-gold)] px-5 py-3 text-sm font-black text-[var(--theme-accent-contrast)] shadow-[var(--shadow-button)] transition duration-300 hover:opacity-85"
              >
                공지 게시하기
              </PendingSubmitButton>

              <Link
                href="/admin"
                className="inline-flex flex-1 items-center justify-center border border-[var(--theme-line)] bg-[var(--theme-surface)] px-5 py-3 text-sm font-black text-[var(--theme-text)] transition hover:bg-[var(--theme-surface-hover)]"
              >
                취소
              </Link>
            </div>
          </form>
        </div>
      </section>
    </main>
  );
}
