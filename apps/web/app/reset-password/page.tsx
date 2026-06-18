import Link from "next/link";

import { updatePasswordAfterReset } from "@/app/actions/password";
import { createClient } from "@/lib/supabase/server";

type SearchParams = Promise<{
  message?: string;
  type?: string;
}>;

export default async function ResetPasswordPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const params = await searchParams;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <main className="mx-auto min-h-screen max-w-md px-4 py-10 text-gray-100 sm:px-6 sm:py-14">
      <Link href="/login" className="text-sm text-blue-300 hover:text-blue-200">
        ← 로그인으로 돌아가기
      </Link>

      <div className="mt-8">
        <p className="text-sm font-semibold text-blue-300">New Password</p>
        <h1 className="mt-2 text-3xl font-bold">새 비밀번호 설정</h1>
        <p className="mt-3 text-sm text-gray-400">
          이메일 인증 링크로 접속한 뒤 새 비밀번호를 설정할 수 있습니다.
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

      {!user ? (
        <div className="mt-6 rounded-lg border border-yellow-500/30 bg-yellow-500/10 p-4 text-sm text-yellow-100">
          비밀번호 재설정 세션이 없습니다. 비밀번호 찾기에서 재설정 메일을
          다시 요청해주세요.
        </div>
      ) : (
        <form
          action={updatePasswordAfterReset}
          className="mt-6 grid gap-4 rounded-2xl border border-gray-800 bg-gray-950/70 p-5"
        >
          <label className="grid gap-2 text-sm">
            <span className="text-gray-300">새 비밀번호</span>
            <input
              name="password"
              type="password"
              required
              minLength={8}
              className="rounded-lg border border-gray-700 bg-gray-950 px-3 py-2 text-gray-100"
            />
          </label>

          <label className="grid gap-2 text-sm">
            <span className="text-gray-300">새 비밀번호 확인</span>
            <input
              name="confirm_password"
              type="password"
              required
              minLength={8}
              className="rounded-lg border border-gray-700 bg-gray-950 px-3 py-2 text-gray-100"
            />
          </label>

          <button
            type="submit"
            className="rounded-lg bg-blue-600 px-4 py-3 text-sm font-semibold text-white hover:bg-blue-500"
          >
            비밀번호 변경하기
          </button>
        </form>
      )}

      <div className="mt-4">
        <Link
          href="/forgot-password"
          className="text-sm text-blue-300 hover:text-blue-200"
        >
          재설정 메일 다시 요청하기
        </Link>
      </div>
    </main>
  );
}