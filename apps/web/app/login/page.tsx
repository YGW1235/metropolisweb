import Link from "next/link";
import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";
import { FormMessage } from "@/components/form-message";
import { PendingSubmitButton } from "@/components/pending-submit-button";

import { headers } from "next/headers"; 

type LoginPageProps = {
  searchParams: Promise<{
    message?: string;
    type?: string;
    redirectTo?: string;
  }>;
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

function getString(formData: FormData, key: string) {
  const value = formData.get(key);

  if (typeof value !== "string") {
    return "";
  }

  return value.trim();
}

function redirectWithMessage(
  path: string,
  message: string,
  type: "success" | "error" = "error",
) {
  const [pathname, queryString] = path.split("?");
  const params = new URLSearchParams(queryString ?? "");

  params.set("message", message);
  params.set("type", type);

  redirect(`${pathname}?${params.toString()}`);
}

function getSafeRedirectTo(value: string | undefined) {
  if (!value) {
    return "/topics";
  }

  if (!value.startsWith("/") || value.startsWith("//")) {
    return "/topics";
  }

  return value;
}

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const query = await searchParams;
  const redirectTo = getSafeRedirectTo(query.redirectTo);

  async function signIn(formData: FormData) {
    "use server";

    const email = getString(formData, "email");
    const password = getString(formData, "password");
    const nextPath = getSafeRedirectTo(getString(formData, "redirect_to"));

    if (!email || !password) {
      redirectWithMessage(
        `/login?redirectTo=${encodeURIComponent(nextPath)}`,
        "이메일과 비밀번호를 모두 입력해주세요.",
        "error",
      );
    }

    const supabase = await createClient();

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      console.error("Login failed", error);
      redirectWithMessage(
        `/login?redirectTo=${encodeURIComponent(nextPath)}`,
        "로그인에 실패했습니다. 이메일과 비밀번호를 다시 확인해주세요.",
        "error",
      );
    }

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (user) {
      const { data: profile } = await supabase
        .from("profiles")
        .select("status")
        .eq("id", user.id)
        .maybeSingle();

      if (profile?.status && profile.status !== "active") {
        await supabase.auth.signOut();

        redirectWithMessage(
          "/login",
          profile.status === "deleted"
            ? "탈퇴 처리된 계정입니다."
            : "이용이 제한된 계정입니다.",
          "error",
        );
      }
    }

    redirect(nextPath);
  }

  async function signUp(formData: FormData) {
    "use server";

    const email = getString(formData, "email");
    const password = getString(formData, "password");

    if (!email || !password) {
      redirectWithMessage(
        "/login",
        "회원가입할 이메일과 비밀번호를 모두 입력해주세요.",
        "error",
      );
    }

    if (password.length < 6) {
      redirectWithMessage(
        "/login",
        "비밀번호는 최소 6자 이상으로 입력해주세요.",
        "error",
      );
    }

    const supabase = await createClient();

    const requestHeaders = await headers();
    const origin =
      requestHeaders.get("origin") ??
      process.env.NEXT_PUBLIC_SITE_URL ??
      "http://localhost:3000";

    const termsAgreed = formData.get("terms_agreed") === "on";

    if (!termsAgreed) {
      redirectWithMessage(
        "/login",
        "이용약관과 개인정보처리방침에 동의해주세요.",
        "error",
      );
    }

    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${origin}/auth/callback?next=/me`,
      },
    });

    if (error) {
      console.error("Sign up failed", error);
      redirectWithMessage(
        "/login",
        "회원가입에 실패했습니다. 입력한 이메일과 비밀번호를 다시 확인해주세요.",
        "error",
      );
    }

    redirectWithMessage(
      "/login",
      "회원가입 요청이 완료되었습니다. 이메일 인증 링크를 클릭한 뒤 로그인해주세요.",
      "success",
    );
  }

  async function resendVerificationEmail(formData: FormData) {
  "use server";

  const email = getString(formData, "email");

  if (!email) {
    redirectWithMessage(
      "/login",
      "인증 메일을 다시 받을 이메일을 입력해주세요.",
      "error",
    );
  }

  const requestHeaders = await headers();
  const origin =
    requestHeaders.get("origin") ??
    process.env.NEXT_PUBLIC_SITE_URL ??
    "http://localhost:3000";

  const supabase = await createClient();

  const { error } = await supabase.auth.resend({
    type: "signup",
    email,
    options: {
      emailRedirectTo: `${origin}/auth/callback?next=/me`,
    },
  });

  if (error) {
    console.error("Verification email resend failed", error);
    redirectWithMessage(
      "/login",
      "인증 메일을 다시 보내지 못했습니다. 이메일을 확인한 뒤 잠시 후 다시 시도해주세요.",
      "error",
    );
  }

  redirectWithMessage(
    "/login",
    "인증 메일을 다시 보냈습니다. 메일함과 스팸함을 확인해주세요.",
    "success",
  );
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
            의제 먼저 보기
          </Link>
        </div>

        {query.message ? (
          <FormMessage
            type={query.type === "success" ? "success" : "error"}
            className="mt-6"
          >
            {query.message}
          </FormMessage>
        ) : null}

        <div className="mt-8 overflow-hidden rounded-[2rem] border border-[var(--theme-line)] bg-[var(--theme-panel-strong)] shadow-[var(--shadow-card-strong)] transition duration-300">
          <div className="grid lg:grid-cols-[0.9fr_1.2fr_0.9fr]">
            <div className="bg-[var(--athena-surface)] p-6 transition-colors duration-300">
              <AthenaIcon />
              <p className="mt-4 text-xs font-black uppercase tracking-[0.28em] text-[var(--theme-gold)]">
                Athena Gate
              </p>
              <h2 className="mt-3 font-serif text-3xl font-black text-[var(--athena-text)]">
                질서의 입장
              </h2>
              <p className="mt-4 text-sm leading-7 text-[var(--athena-muted)]">
                계정으로 들어와 의제에 참여하고, 자신의 입장을 기록하세요.
              </p>
            </div>

            <div className="flex flex-col items-center justify-center border-y border-[var(--theme-line)] bg-[var(--theme-panel)] p-6 text-center transition-colors duration-300 lg:border-x lg:border-y-0">
              <p className="text-xs font-black uppercase tracking-[0.28em] text-[var(--theme-gold)]">
                Enter The Agora
              </p>

              <h1 className="mt-4 font-serif text-5xl font-black leading-tight tracking-[0.06em] text-[var(--theme-text)] md:text-6xl">
                토론장 입장
              </h1>

              <p className="mt-5 max-w-2xl text-sm leading-7 text-[var(--theme-muted)]">
                메트로폴리스에 로그인하면 의제에 참여하고, 아테나 또는
                포세이돈 진영으로 발언을 남길 수 있습니다.
              </p>
            </div>

            <div className="bg-[var(--poseidon-surface)] p-6 text-right transition-colors duration-300">
              <div className="flex justify-end">
                <PoseidonIcon />
              </div>
              <p className="mt-4 text-xs font-black uppercase tracking-[0.28em] text-[var(--theme-blue)]">
                Poseidon Gate
              </p>
              <h2 className="mt-3 text-3xl font-black text-[var(--poseidon-text)]">
                격정의 입장
              </h2>
              <p className="mt-4 text-sm leading-7 text-[var(--poseidon-muted)]">
                충돌하는 의견 사이에서 자신의 목소리를 남길 준비를 합니다.
              </p>
            </div>
          </div>
        </div>

        <section className="mt-8 grid gap-8 lg:grid-cols-[1fr_1fr]">
          <div className="rounded-[2rem] border border-[var(--theme-line)] bg-[var(--theme-panel)] p-6 shadow-[var(--shadow-card)] transition duration-300 sm:p-8">
            <p className="text-xs font-black uppercase tracking-[0.28em] text-[var(--theme-gold)]">
              Sign In
            </p>
            <h2 className="mt-3 font-serif text-3xl font-black text-[var(--theme-text)]">
              로그인
            </h2>
            <p className="mt-2 text-sm leading-7 text-[var(--theme-muted)]">
              이미 계정이 있다면 이곳에서 토론장으로 입장하세요.
            </p>

            <form action={signIn} className="mt-8 space-y-5">
              <input type="hidden" name="redirect_to" value={redirectTo} />

              <div>
                <label className="block text-sm font-bold text-[var(--theme-muted)]">
                  이메일
                </label>
                <input
                  type="email"
                  name="email"
                  required
                  autoComplete="email"
                  className="mt-2 w-full rounded-xl border border-[var(--theme-line)] bg-[var(--theme-surface)] px-4 py-3 text-[var(--theme-text)] outline-none transition placeholder:text-[var(--theme-soft)] focus:border-[var(--theme-gold)]"
                  placeholder="you@example.com"
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-[var(--theme-muted)]">
                  비밀번호
                </label>
                <input
                  type="password"
                  name="password"
                  required
                  autoComplete="current-password"
                  className="mt-2 w-full rounded-xl border border-[var(--theme-line)] bg-[var(--theme-surface)] px-4 py-3 text-[var(--theme-text)] outline-none transition placeholder:text-[var(--theme-soft)] focus:border-[var(--theme-gold)]"
                  placeholder="비밀번호"
                />
              </div>

              <PendingSubmitButton
                pendingText="로그인 중..."
                className="w-full border border-[var(--theme-gold)] bg-[var(--theme-gold)] px-5 py-3 text-sm font-black text-[var(--theme-accent-contrast)] shadow-[var(--shadow-button)] transition duration-300 hover:opacity-85"
              >
                로그인
              </PendingSubmitButton>
            </form>
            <div className="mt-4 text-right">
              <Link
                href="/forgot-password"
                className="text-sm text-[var(--theme-blue)] transition hover:opacity-80"
              >
                비밀번호를 잊으셨나요?
              </Link>
            </div>
          </div>

          <div className="rounded-[2rem] border border-[var(--theme-line)] bg-[var(--theme-panel)] p-6 shadow-[var(--shadow-card)] transition duration-300 sm:p-8">
            <p className="text-xs font-black uppercase tracking-[0.28em] text-[var(--theme-blue)]">
              Sign Up
            </p>
            <h2 className="mt-3 font-serif text-3xl font-black text-[var(--theme-text)]">
              회원가입
            </h2>
            <p className="mt-2 text-sm leading-7 text-[var(--theme-muted)]">
              계정이 없다면 새 시민으로 등록하세요.
            </p>

            <form action={signUp} className="mt-8 space-y-5">
              <div>
                <label className="block text-sm font-bold text-[var(--theme-muted)]">
                  이메일
                </label>
                <input
                  type="email"
                  name="email"
                  required
                  autoComplete="email"
                  className="mt-2 w-full rounded-xl border border-[var(--theme-line)] bg-[var(--theme-surface)] px-4 py-3 text-[var(--theme-text)] outline-none transition placeholder:text-[var(--theme-soft)] focus:border-[var(--theme-blue)]"
                  placeholder="you@example.com"
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-[var(--theme-muted)]">
                  비밀번호
                </label>
                <input
                  type="password"
                  name="password"
                  required
                  minLength={6}
                  autoComplete="new-password"
                  className="mt-2 w-full rounded-xl border border-[var(--theme-line)] bg-[var(--theme-surface)] px-4 py-3 text-[var(--theme-text)] outline-none transition placeholder:text-[var(--theme-soft)] focus:border-[var(--theme-blue)]"
                  placeholder="최소 6자 이상"
                />
              </div>

              <label className="theme-panel flex items-start gap-3 rounded-lg p-3 text-sm text-[var(--theme-muted)]">
                <input
                  name="terms_agreed"
                  type="checkbox"
                  required
                  className="mt-1"
                />
                <span>
                  <Link
                    href="/terms"
                    className="text-[var(--theme-blue)] transition hover:opacity-80"
                  >
                    이용약관
                  </Link>
                  과{" "}
                  <Link
                    href="/privacy"
                    className="text-[var(--theme-blue)] transition hover:opacity-80"
                  >
                    개인정보처리방침
                  </Link>
                  에 동의합니다.
                </span>
              </label>

              <PendingSubmitButton
                pendingText="가입 처리 중..."
                className="w-full border border-[var(--theme-blue)] bg-[var(--theme-blue)] px-5 py-3 text-sm font-black text-[var(--theme-accent-contrast)] shadow-[var(--shadow-button)] transition duration-300 hover:opacity-85"
              >
                회원가입
              </PendingSubmitButton>
            </form>

            <div className="theme-panel mt-6 rounded-2xl p-5">
              <p className="text-sm font-semibold text-[var(--theme-text)]">
                인증 메일을 받지 못했나요?
              </p>
              <p className="mt-1 text-xs text-[var(--theme-soft)]">
                회원가입한 이메일을 입력하면 인증 메일을 다시 보냅니다.
              </p>

              <form action={resendVerificationEmail} className="mt-4 grid gap-3">
                <label className="grid gap-1 text-sm">
                  <span className="text-[var(--theme-muted)]">이메일</span>
                  <input
                    name="email"
                    type="email"
                    required
                    className="theme-input rounded-lg px-3 py-2"
                  />
                </label>

                <PendingSubmitButton
                  pendingText="전송 중..."
                  className="rounded-lg border border-[var(--theme-blue)] px-4 py-2 text-sm font-semibold text-[var(--theme-blue)] transition hover:bg-[var(--theme-surface-hover)]"
                >
                  인증 메일 다시 보내기
                </PendingSubmitButton>
              </form>
            </div>
          </div>
        </section>
      </section>
    </main>
  );
}
