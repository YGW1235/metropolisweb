import Link from "next/link";

import { signUp } from "@/app/auth/actions";

type SearchParams = Promise<{
  message?: string;
  type?: "success" | "error";
}>;

export default async function SignupPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const params = await searchParams;

  return (
    <main className="casual-page-bg min-h-screen px-6 py-10 text-[#2f2118]">
      <section className="mx-auto max-w-md">
        <Link href="/" className="text-sm font-black text-orange-700">
          ← 심포지온
        </Link>

        <div className="mt-8 rounded-3xl border border-orange-100 bg-white p-6 shadow-sm">
          <p className="text-sm font-bold tracking-[0.3em] text-orange-700">
            SIGN UP
          </p>
          <h1 className="mt-2 text-3xl font-black">회원가입</h1>
          <p className="mt-3 text-sm leading-6 text-stone-600">
            이메일 계정으로 가입한 뒤, 사이트 안에서는 닉네임으로 활동합니다.
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

          <form action={signUp} className="mt-6 space-y-4">
            <div>
              <label className="text-sm font-bold text-stone-700">
                이메일
              </label>
              <input
                name="email"
                type="email"
                required
                className="mt-2 w-full rounded-2xl border border-stone-200 px-4 py-3 outline-none focus:border-orange-400"
                placeholder="you@example.com"
              />
            </div>

            <div>
              <label className="text-sm font-bold text-stone-700">
                비밀번호
              </label>
              <input
                name="password"
                type="password"
                required
                minLength={6}
                className="mt-2 w-full rounded-2xl border border-stone-200 px-4 py-3 outline-none focus:border-orange-400"
                placeholder="6자 이상"
              />
            </div>

            <button className="w-full rounded-2xl bg-stone-950 px-5 py-3 font-black text-white transition hover:-translate-y-0.5">
              가입하기
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-stone-600">
            이미 계정이 있나요?{" "}
            <Link href="/login" className="font-black text-orange-700">
              로그인
            </Link>
          </p>
        </div>
      </section>
    </main>
  );
}
