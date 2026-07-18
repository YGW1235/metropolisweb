import type { Metadata } from "next";
import Link from "next/link";

import { sendPasswordResetEmail } from "@/app/forgot-password/actions";
import { PublicShell } from "@/components/PublicShell";
import { SiteHeader } from "@/components/SiteHeader";
import { SubmitButton } from "@/components/SubmitButton";

export const metadata: Metadata = {
  title: "비밀번호 찾기",
  description: "심포지온 계정의 비밀번호 재설정 링크를 이메일로 받습니다.",
  alternates: {
    canonical: "/forgot-password",
  },
};

type SearchParams = Promise<{
  message?: string;
  type?: "success" | "error";
}>;

export default async function ForgotPasswordPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const params = await searchParams;

  return (
    <main className="casual-page-bg min-h-screen text-[#2f2118]">
      <SiteHeader />

      <PublicShell>
        <section className="mx-auto w-full max-w-xl">
          <Link href="/login" className="text-sm font-black text-orange-700">
            ← 로그인으로 돌아가기
          </Link>

          <div className="mt-6 rounded-3xl border border-orange-100 bg-white p-6 shadow-sm sm:p-8">
            <p className="text-sm font-bold tracking-[0.3em] text-orange-700">
              PASSWORD RESET
            </p>
            <h1 className="mt-2 text-3xl font-black">비밀번호 찾기</h1>
            <p className="mt-3 text-sm leading-6 text-stone-600">
              가입한 이메일을 입력하면 비밀번호를 다시 설정할 수 있는 링크를
              보내드립니다.
            </p>

            {params.message && (
              <div
                className={`mt-5 rounded-2xl p-4 text-sm font-bold ${
                  params.type === "error"
                    ? "bg-red-50 text-red-700"
                    : "bg-green-50 text-green-700"
                }`}
              >
                {params.message}
              </div>
            )}

            <form action={sendPasswordResetEmail} className="mt-6 space-y-4">
              <div>
                <label className="text-sm font-bold text-stone-700">
                  이메일
                </label>
                <input
                  autoComplete="email"
                  className="mt-2 w-full rounded-2xl border border-stone-200 px-4 py-3 outline-none focus:border-orange-400"
                  name="email"
                  placeholder="you@example.com"
                  required
                  type="email"
                />
              </div>

              <SubmitButton
                className="w-full rounded-2xl bg-stone-950 px-5 py-3 font-black text-white transition hover:-translate-y-0.5"
                pendingText="전송 중..."
              >
                재설정 링크 받기
              </SubmitButton>
            </form>

            <p className="mt-5 text-sm leading-6 text-stone-500">
              메일이 보이지 않으면 스팸함을 확인해주세요. 링크는 Supabase Auth
              설정에 따라 일정 시간이 지나면 만료될 수 있습니다.
            </p>
          </div>
        </section>
      </PublicShell>
    </main>
  );
}
