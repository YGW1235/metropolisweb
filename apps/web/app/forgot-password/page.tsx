import Link from "next/link";

import { requestPasswordReset } from "@/app/actions/password";

type SearchParams = Promise<{
  message?: string;
  type?: string;
}>;

export default async function ForgotPasswordPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const params = await searchParams;

  return (
    <main className="mx-auto min-h-screen max-w-md px-4 py-10 text-gray-100 sm:px-6 sm:py-14">
      <Link href="/login" className="text-sm text-blue-300 hover:text-blue-200">
        ← 로그인으로 돌아가기
      </Link>

      <div className="mt-8">
        <p className="text-sm font-semibold text-blue-300">Password Reset</p>
        <h1 className="mt-2 text-3xl font-bold">비밀번호 찾기</h1>
        <p className="mt-3 text-sm text-gray-400">
          가입한 이메일을 입력하면 비밀번호 재설정 링크를 보내드립니다.
        </p>
      </div>

      {params.message ? (
        <div
          className={
            params.type === "error"
              ? "mt-6 rounded-lg border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-100"
              : "mt-6 rounded-lg border border-emerald-500/30 bg-emerald-500/10 p-4 text-sm text-emerald-100"
          }
        >
          {params.message}
        </div>
      ) : null}

      <form
        action={requestPasswordReset}
        className="mt-6 grid gap-4 rounded-2xl border border-gray-800 bg-gray-950/70 p-5"
      >
        <label className="grid gap-2 text-sm">
          <span className="text-gray-300">이메일</span>
          <input
            name="email"
            type="email"
            required
            className="rounded-lg border border-gray-700 bg-gray-950 px-3 py-2 text-gray-100"
          />
        </label>

        <button
          type="submit"
          className="rounded-lg bg-blue-600 px-4 py-3 text-sm font-semibold text-white hover:bg-blue-500"
        >
          재설정 메일 보내기
        </button>
      </form>
    </main>
  );
}