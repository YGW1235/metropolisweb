"use client";

import { useEffect } from "react";
import Link from "next/link";

type ErrorPageProps = {
  error: Error & { digest?: string };
  reset: () => void;
};

export default function ErrorPage({ error, reset }: ErrorPageProps) {
  useEffect(() => {
    console.error("Metropolis app error", error);
  }, [error]);

  return (
    <main
      className="theme-page flex min-h-screen items-center px-4 py-12 sm:px-6 sm:py-16"
      style={{
        backgroundImage:
          "radial-gradient(circle at 12% 0%, var(--page-glow-gold), transparent 30%), radial-gradient(circle at 88% 8%, var(--page-glow-blue), transparent 32%), linear-gradient(90deg, var(--page-grid-line) 1px, transparent 1px)",
        backgroundSize: "auto, auto, 54px 54px",
      }}
    >
      <section className="mx-auto w-full max-w-3xl" role="alert">
        <div className="theme-card rounded-[2rem] p-6 text-center shadow-[var(--shadow-card-strong)] sm:p-10">
          <p className="text-xs font-black uppercase tracking-[0.32em] text-[var(--theme-danger)]">
            Error
          </p>

          <h1 className="mt-4 font-serif text-4xl font-black leading-tight text-[var(--theme-text)] sm:text-5xl">
            문제가 발생했습니다
          </h1>

          <p className="mx-auto mt-5 max-w-xl text-sm leading-7 text-[var(--theme-muted)]">
            잠시 후 다시 시도해주세요.
          </p>

          <div className="mt-8 grid gap-3 sm:grid-cols-2">
            <button
              type="button"
              onClick={reset}
              className="theme-button-primary inline-flex items-center justify-center rounded-lg px-5 py-3 text-sm font-black"
            >
              다시 시도
            </button>

            <Link
              href="/"
              className="theme-button-secondary inline-flex items-center justify-center rounded-lg px-5 py-3 text-sm font-black"
            >
              홈으로 이동
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
