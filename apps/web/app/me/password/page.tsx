import Link from "next/link";
import { redirect } from "next/navigation";

import { changeMyPassword } from "@/app/actions/password";
import { PendingSubmitButton } from "@/components/pending-submit-button";
import { createClient } from "@/lib/supabase/server";

type SearchParams = Promise<{
  message?: string;
  type?: string;
}>;

export default async function MyPasswordPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const params = await searchParams;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login?message=로그인이 필요합니다.&type=error");
  }

  return (
    <main className="mx-auto min-h-screen max-w-md px-4 py-10 text-gray-100 sm:px-6 sm:py-14">
      <Link href="/me" className="text-sm text-blue-300 hover:text-blue-200">
        ← 내 정보로 돌아가기
      </Link>

      <div className="mt-8">
        <p className="text-sm font-semibold text-blue-300">Account</p>
        <h1 className="mt-2 text-3xl font-bold">비밀번호 변경</h1>
        <p className="mt-3 text-sm text-gray-400">
          현재 비밀번호를 확인한 뒤 새 비밀번호로 변경합니다.
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
        action={changeMyPassword}
        className="mt-6 grid gap-4 rounded-2xl border border-gray-800 bg-gray-950/70 p-5"
      >
        <label className="grid gap-2 text-sm">
          <span className="text-gray-300">현재 비밀번호</span>
          <input
            name="current_password"
            type="password"
            required
            className="rounded-lg border border-gray-700 bg-gray-950 px-3 py-2 text-gray-100"
          />
        </label>

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

        <PendingSubmitButton
          pendingText="변경 중..."
          className="rounded-lg bg-blue-600 px-4 py-3 text-sm font-semibold text-white hover:bg-blue-500"
        >
          비밀번호 변경하기
        </PendingSubmitButton>
      </form>
    </main>
  );
}
