import Link from "next/link";

import { createContactInquiry } from "@/app/actions/contact";
import { PendingSubmitButton } from "@/components/pending-submit-button";
import { createClient } from "@/lib/supabase/server";

type SearchParams = Promise<{
  message?: string;
  type?: string;
}>;

export default async function ContactPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const params = await searchParams;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  let email = "";

  if (user) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("email")
      .eq("id", user.id)
      .maybeSingle();

    email = profile?.email ?? user.email ?? "";
  }

  return (
    <main className="theme-page px-4 py-10 sm:px-6 sm:py-14">
      <section className="mx-auto max-w-3xl">
        <div className="mb-8">
          <Link
            href="/"
            className="text-sm font-bold text-[var(--theme-gold)] transition hover:opacity-80"
          >
            ← 메인으로 돌아가기
          </Link>

          <p className="mt-6 text-sm font-semibold text-[var(--theme-blue)]">
            Contact
          </p>
          <h1 className="mt-2 text-3xl font-bold text-[var(--theme-text)]">
            문의하기
          </h1>
          <p className="mt-2 text-sm text-[var(--theme-muted)]">
            계정, 신고, 버그, 운영 관련 문의를 남겨주세요.
          </p>
        </div>

        {params.message ? (
          <div
            className={
              params.type === "error"
                ? "mb-6 rounded-lg border border-[var(--message-error-line)] bg-[var(--message-error-bg)] p-4 text-sm font-bold text-[var(--message-error-text)]"
                : "mb-6 rounded-lg border border-[var(--message-success-line)] bg-[var(--message-success-bg)] p-4 text-sm font-bold text-[var(--message-success-text)]"
            }
          >
            {params.message}
          </div>
        ) : null}

        <form
          action={createContactInquiry}
          className="theme-card rounded-2xl p-5"
        >
          <div className="grid gap-5">
            <label className="grid gap-2 text-sm">
              <span className="text-[var(--theme-muted)]">답변 받을 이메일</span>
              <input
                name="email"
                type="email"
                defaultValue={email}
                required
                className="theme-input rounded-lg px-3 py-2"
              />
            </label>

            <label className="grid gap-2 text-sm">
              <span className="text-[var(--theme-muted)]">문의 유형</span>
              <select
                name="category"
                defaultValue="general"
                className="theme-input rounded-lg px-3 py-2"
              >
                <option value="general">일반 문의</option>
                <option value="account">계정 문의</option>
                <option value="report">신고/운영 문의</option>
                <option value="bug">버그 제보</option>
                <option value="partnership">제휴/협업</option>
                <option value="other">기타</option>
              </select>
            </label>

            <label className="grid gap-2 text-sm">
              <span className="text-[var(--theme-muted)]">제목</span>
              <input
                name="title"
                required
                minLength={2}
                maxLength={100}
                className="theme-input rounded-lg px-3 py-2"
              />
            </label>

            <label className="grid gap-2 text-sm">
              <span className="text-[var(--theme-muted)]">내용</span>
              <textarea
                name="content"
                required
                minLength={5}
                rows={8}
                className="theme-input rounded-lg px-3 py-2"
              />
            </label>

            <label className="theme-panel flex items-start gap-3 rounded-lg p-3 text-sm text-[var(--theme-muted)]">
              <input
                name="privacy_agreed"
                type="checkbox"
                required
                className="mt-1"
              />
              <span>
                문의 접수를 위해 이메일과 문의 내용을 수집·처리하는 것에 동의합니다.{" "}
                <Link
                  href="/privacy"
                  className="text-[var(--theme-blue)] transition hover:opacity-80"
                >
                  개인정보처리방침
                </Link>
                을 확인했습니다.
              </span>
            </label>

            <PendingSubmitButton
              pendingText="전송 중..."
              className="theme-button-primary rounded-lg px-4 py-3 text-sm font-semibold"
            >
              문의 접수하기
            </PendingSubmitButton>
          </div>
        </form>
      </section>
    </main>
  );
}
