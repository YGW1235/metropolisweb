import Link from "next/link";
import { redirect } from "next/navigation";

import { updateProfile } from "@/app/actions/profile";
import { PendingSubmitButton } from "@/components/pending-submit-button";
import { createClient } from "@/lib/supabase/server";

type ProfileSettingsPageProps = {
  searchParams: Promise<{
    message?: string;
    type?: string;
  }>;
};

type Profile = {
  display_name: string | null;
  role: string | null;
  status: string | null;
};

function AthenaIcon() {
  return (
    <span className="flex h-12 w-12 items-center justify-center rounded-full border border-[var(--theme-gold)] bg-[var(--athena-surface-soft)] text-2xl text-[var(--athena-text)] shadow-[var(--shadow-athena-icon)] transition duration-300">
      ♜
    </span>
  );
}

function PoseidonIcon() {
  return (
    <span className="flex h-12 w-12 items-center justify-center rounded-full border border-[var(--theme-blue)] bg-[var(--poseidon-surface-soft)] text-2xl text-[var(--poseidon-text)] shadow-[var(--shadow-poseidon-icon)] transition duration-300">
      Ψ
    </span>
  );
}

function roleLabel(role: string | null) {
  if (role === "admin") return "관리자";
  return "시민";
}

function statusLabel(status: string | null) {
  if (status === "active") return "활성";
  if (status === "pending") return "대기";
  if (status === "blocked") return "제한";
  return status || "상태 없음";
}

export default async function ProfileSettingsPage({
  searchParams,
}: ProfileSettingsPageProps) {
  const query = await searchParams;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect(`/login?message=${encodeURIComponent("로그인 후 이용할 수 있습니다.")}`);
  }

  const { data } = await supabase
    .from("profiles")
    .select("display_name, role, status")
    .eq("id", user.id)
    .maybeSingle();

  const profile = data as Profile | null;
  const displayName = profile?.display_name?.trim() || "";
  const email = user.email || "이메일 없음";

  return (
    <main
      className="min-h-screen bg-[var(--theme-bg)] px-4 py-10 text-[var(--theme-text)] transition-colors duration-300 sm:px-6 sm:py-14"
      style={{
        backgroundImage:
          "radial-gradient(circle at 12% 0%, var(--page-glow-gold), transparent 28%), radial-gradient(circle at 88% 8%, var(--page-glow-blue), transparent 30%), linear-gradient(90deg, var(--page-grid-line) 1px, transparent 1px)",
        backgroundSize: "auto, auto, 54px 54px",
      }}
    >
      <section className="mx-auto max-w-5xl">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <Link
            href="/me"
            className="inline-flex items-center text-sm font-bold text-[var(--theme-gold)] transition hover:opacity-80"
          >
            ‹ 내 기록으로 돌아가기
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

        <div className="mt-8 overflow-hidden rounded-[2rem] border border-[var(--theme-line)] bg-[var(--theme-panel-strong)] shadow-[var(--shadow-card-strong)] transition duration-300">
          <div className="grid lg:grid-cols-[0.9fr_1.2fr_0.9fr]">
            <div className="bg-[var(--athena-surface)] p-6 transition-colors duration-300">
              <AthenaIcon />
              <p className="mt-4 text-xs font-black uppercase tracking-[0.28em] text-[var(--theme-gold)]">
                Identity
              </p>
              <h2 className="mt-3 font-serif text-3xl font-black text-[var(--athena-text)]">
                시민의 이름
              </h2>
              <p className="mt-4 text-sm leading-7 text-[var(--athena-muted)]">
                토론장에서 보이는 이름과 계정 정보를 정리합니다.
              </p>
            </div>

            <div className="flex flex-col items-center justify-center border-y border-[var(--theme-line)] bg-[var(--theme-panel)] p-6 text-center transition-colors duration-300 lg:border-x lg:border-y-0">
              <p className="text-xs font-black uppercase tracking-[0.28em] text-[var(--theme-gold)]">
                Profile Settings
              </p>

              <h1 className="mt-4 font-serif text-5xl font-black leading-tight tracking-[0.06em] text-[var(--theme-text)] md:text-6xl">
                프로필 설정
              </h1>

              <p className="mt-5 max-w-2xl text-sm leading-7 text-[var(--theme-muted)]">
                메트로폴리스에서 사용할 표시 이름을 설정합니다. 진영별 익명
                번호는 의제마다 자동으로 부여됩니다.
              </p>
            </div>

            <div className="bg-[var(--poseidon-surface)] p-6 text-right transition-colors duration-300">
              <div className="flex justify-end">
                <PoseidonIcon />
              </div>
              <p className="mt-4 text-xs font-black uppercase tracking-[0.28em] text-[var(--theme-blue)]">
                Account
              </p>
              <h2 className="mt-3 text-3xl font-black text-[var(--poseidon-text)]">
                계정 기록
              </h2>
              <p className="mt-4 text-sm leading-7 text-[var(--poseidon-muted)]">
                로그인 정보와 권한 상태를 확인합니다.
              </p>
            </div>
          </div>
        </div>

        <section className="mt-8 grid gap-8 lg:grid-cols-[0.85fr_1.15fr]">
          <aside className="space-y-8">
            <div className="rounded-[2rem] border border-[var(--theme-line)] bg-[var(--theme-panel)] p-6 shadow-[var(--shadow-card)] transition duration-300">
              <p className="text-xs font-black uppercase tracking-[0.28em] text-[var(--theme-gold)]">
                Current Account
              </p>
              <h2 className="mt-3 font-serif text-3xl font-black text-[var(--theme-text)]">
                현재 계정
              </h2>

              <div className="mt-6 space-y-3">
                <div className="rounded-2xl border border-[var(--theme-line)] bg-[var(--theme-surface)] p-4">
                  <p className="text-xs font-black text-[var(--theme-soft)]">
                    이메일
                  </p>
                  <p className="mt-1 break-all text-sm font-bold text-[var(--theme-text)]">
                    {email}
                  </p>
                </div>

                <div className="rounded-2xl border border-[var(--theme-line)] bg-[var(--theme-surface)] p-4">
                  <p className="text-xs font-black text-[var(--theme-soft)]">
                    권한
                  </p>
                  <p className="mt-1 text-lg font-black text-[var(--theme-text)]">
                    {roleLabel(profile?.role ?? null)}
                  </p>
                </div>

                <div className="rounded-2xl border border-[var(--theme-line)] bg-[var(--theme-surface)] p-4">
                  <p className="text-xs font-black text-[var(--theme-soft)]">
                    상태
                  </p>
                  <p className="mt-1 text-lg font-black text-[var(--theme-text)]">
                    {statusLabel(profile?.status ?? null)}
                  </p>
                </div>
              </div>
            </div>

            <div className="rounded-[2rem] border border-[var(--theme-line)] bg-[var(--theme-panel)] p-6 shadow-[var(--shadow-card)] transition duration-300">
              <p className="text-xs font-black uppercase tracking-[0.28em] text-[var(--theme-blue)]">
                Guide
              </p>
              <h2 className="mt-3 font-serif text-3xl font-black text-[var(--theme-text)]">
                표시 이름 안내
              </h2>

              <div className="mt-5 space-y-3 text-sm leading-7 text-[var(--theme-muted)]">
                <p>
                  표시 이름은 내 기록과 계정 영역에서 사용됩니다. 토론장에서는
                  의제별로 배정된 익명 번호가 함께 표시됩니다.
                </p>
                <p>
                  이름을 비워두면 기본값으로 “익명의 시민”처럼 표시됩니다.
                </p>
              </div>
            </div>
          </aside>

          <section className="rounded-[2rem] border border-[var(--theme-line)] bg-[var(--theme-panel)] p-6 shadow-[var(--shadow-card)] transition duration-300 sm:p-8">
            <p className="text-xs font-black uppercase tracking-[0.28em] text-[var(--theme-gold)]">
              Edit Profile
            </p>
            <h2 className="mt-3 font-serif text-3xl font-black text-[var(--theme-text)]">
              표시 이름 변경
            </h2>
            <p className="mt-2 text-sm leading-7 text-[var(--theme-muted)]">
              메트로폴리스에서 사용할 이름을 입력하세요.
            </p>

            <form action={updateProfile} className="mt-8 space-y-6">
              <div>
                <label className="block text-sm font-bold text-[var(--theme-muted)]">
                  표시 이름
                </label>
                <input
                  name="display_name"
                  defaultValue={displayName}
                  maxLength={32}
                  className="mt-2 w-full rounded-xl border border-[var(--theme-line)] bg-[var(--theme-surface)] px-4 py-3 text-[var(--theme-text)] outline-none transition placeholder:text-[var(--theme-soft)] focus:border-[var(--theme-gold)]"
                  placeholder="예: 아고라의 시민"
                />
                <p className="mt-2 text-xs font-bold text-[var(--theme-soft)]">
                  최대 32자까지 입력할 수 있습니다.
                </p>
              </div>

              <div className="rounded-2xl border border-[var(--theme-line)] bg-[var(--theme-surface)] p-4">
                <p className="text-xs font-black uppercase tracking-[0.22em] text-[var(--theme-soft)]">
                  Preview
                </p>
                <p className="mt-3 font-serif text-2xl font-black text-[var(--theme-text)]">
                  {displayName || "익명의 시민"}
                </p>
                <p className="mt-2 text-sm leading-6 text-[var(--theme-muted)]">
                  저장 후 내 기록과 헤더 계정 영역에 이 이름이 표시됩니다.
                </p>
              </div>

              <div className="flex flex-col gap-3 sm:flex-row">
                <PendingSubmitButton
                  pendingText="저장 중..."
                  className="inline-flex flex-1 items-center justify-center border border-[var(--theme-gold)] bg-[var(--theme-gold)] px-5 py-3 text-sm font-black text-[var(--theme-accent-contrast)] shadow-[var(--shadow-button)] transition duration-300 hover:opacity-85"
                >
                  프로필 저장
                </PendingSubmitButton>

                <Link
                  href="/me"
                  className="inline-flex items-center justify-center border border-[var(--theme-line)] bg-[var(--theme-surface)] px-5 py-3 text-sm font-black text-[var(--theme-text)] transition hover:bg-[var(--theme-surface-hover)]"
                >
                  취소
                </Link>
              </div>
            </form>
          </section>
        </section>
      </section>
    </main>
  );
}
