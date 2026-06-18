import Link from "next/link";
import { redirect } from "next/navigation";

import { requestAccountDeletion } from "@/app/actions/account";
import { createClient } from "@/lib/supabase/server";

type SearchParams = Promise<{
  message?: string;
  type?: string;
}>;

export default async function DeleteAccountPage({
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

  const { data: profile } = await supabase
    .from("profiles")
    .select("email, display_name, role, status")
    .eq("id", user.id)
    .maybeSingle();

  if (profile?.role === "admin") {
    return (
      <main className="mx-auto min-h-screen max-w-2xl px-4 py-10 text-gray-100 sm:px-6 sm:py-14">
        <Link href="/me" className="text-sm text-blue-300 hover:text-blue-200">
          ← 내 정보로 돌아가기
        </Link>

        <div className="mt-8 rounded-2xl border border-yellow-500/30 bg-yellow-500/10 p-6">
          <h1 className="text-2xl font-bold text-yellow-100">
            관리자 계정은 직접 탈퇴할 수 없습니다
          </h1>
          <p className="mt-3 text-sm leading-6 text-yellow-100/80">
            서비스 운영자 계정 보호를 위해 관리자 계정은 이 화면에서 탈퇴할 수
            없습니다. 다른 관리자에게 권한을 이전하거나 Supabase에서 별도 처리해
            주세요.
          </p>
        </div>
      </main>
    );
  }

  return (
    <main className="mx-auto min-h-screen max-w-2xl px-4 py-10 text-gray-100 sm:px-6 sm:py-14">
      <Link href="/me" className="text-sm text-blue-300 hover:text-blue-200">
        ← 내 정보로 돌아가기
      </Link>

      <div className="mt-8">
        <p className="text-sm font-semibold text-red-300">Danger Zone</p>
        <h1 className="mt-2 text-3xl font-bold">계정 탈퇴</h1>
        <p className="mt-3 text-sm text-gray-400">
          계정 탈퇴 후에는 이 계정으로 토론 참여, 글 작성, 댓글 작성이
          불가능합니다.
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

      <section className="mt-6 rounded-2xl border border-red-500/30 bg-red-500/10 p-5">
        <h2 className="text-lg font-semibold text-red-100">
          탈퇴 전 확인해주세요
        </h2>

        <ul className="mt-4 grid gap-2 text-sm leading-6 text-red-100/80">
          <li>- 계정 상태가 탈퇴 처리되어 다시 사용할 수 없습니다.</li>
          <li>- 작성한 토론 글과 댓글은 토론 기록 유지를 위해 남을 수 있습니다.</li>
          <li>- 공개 화면에서는 기존 익명 라벨 구조로 표시됩니다.</li>
          <li>- 신고, 운영 처리 기록은 서비스 안전을 위해 보관될 수 있습니다.</li>
          <li>
            - 완전한 데이터 삭제가 필요한 경우 문의하기를 통해 별도 요청해주세요.
          </li>
        </ul>
      </section>

      <form
        action={requestAccountDeletion}
        className="mt-6 grid gap-5 rounded-2xl border border-gray-800 bg-gray-950/70 p-5"
      >
        <div className="rounded-xl border border-gray-800 bg-gray-900 p-4 text-sm text-gray-300">
          <p>현재 계정</p>
          <p className="mt-1 break-all text-gray-100">
            {profile?.display_name ?? "이름 없음"} /{" "}
            {profile?.email ?? user.email ?? "이메일 없음"}
          </p>
        </div>

        <label className="grid gap-2 text-sm">
          <span className="text-gray-300">탈퇴 사유 선택 입력</span>
          <textarea
            name="reason"
            rows={4}
            placeholder="서비스 개선을 위해 탈퇴 사유를 남겨주시면 참고하겠습니다."
            className="rounded-lg border border-gray-700 bg-gray-950 px-3 py-2 text-gray-100"
          />
        </label>

        <label className="grid gap-2 text-sm">
          <span className="text-gray-300">
            확인 문구 입력: <strong>탈퇴합니다</strong>
          </span>
          <input
            name="confirm_text"
            required
            className="rounded-lg border border-gray-700 bg-gray-950 px-3 py-2 text-gray-100"
          />
        </label>

        <label className="flex items-start gap-3 rounded-lg border border-gray-800 bg-gray-900 p-3 text-sm text-gray-300">
          <input
            name="confirm_delete"
            type="checkbox"
            required
            className="mt-1"
          />
          <span>
            계정 탈퇴 시 서비스 이용이 제한되며, 운영상 필요한 기록은 보관될 수
            있음을 확인했습니다.
          </span>
        </label>

        <button
          type="submit"
          className="rounded-lg bg-red-600 px-4 py-3 text-sm font-semibold text-white hover:bg-red-500"
        >
          계정 탈퇴하기
        </button>
      </form>
    </main>
  );
}