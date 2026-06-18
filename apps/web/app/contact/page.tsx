import Link from "next/link";

import { createContactInquiry } from "@/app/actions/contact";
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
    <main className="mx-auto min-h-screen max-w-3xl px-4 py-10 text-gray-100 sm:px-6 sm:py-14">
      <div className="mb-8">
        <Link href="/" className="text-sm text-blue-300 hover:text-blue-200">
          ← 메인으로 돌아가기
        </Link>

        <p className="mt-6 text-sm font-semibold text-blue-300">Contact</p>
        <h1 className="mt-2 text-3xl font-bold">문의하기</h1>
        <p className="mt-2 text-sm text-gray-400">
          계정, 신고, 버그, 운영 관련 문의를 남겨주세요.
        </p>
      </div>

      {params.message ? (
        <div
          className={
            params.type === "error"
              ? "mb-6 rounded-lg border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-100"
              : "mb-6 rounded-lg border border-emerald-500/30 bg-emerald-500/10 p-4 text-sm text-emerald-100"
          }
        >
          {params.message}
        </div>
      ) : null}

      <form
        action={createContactInquiry}
        className="rounded-2xl border border-gray-800 bg-gray-950/70 p-5"
      >
        <div className="grid gap-5">
          <label className="grid gap-2 text-sm">
            <span className="text-gray-300">답변 받을 이메일</span>
            <input
              name="email"
              type="email"
              defaultValue={email}
              required
              className="rounded-lg border border-gray-700 bg-gray-950 px-3 py-2 text-gray-100"
            />
          </label>

          <label className="grid gap-2 text-sm">
            <span className="text-gray-300">문의 유형</span>
            <select
              name="category"
              defaultValue="general"
              className="rounded-lg border border-gray-700 bg-gray-950 px-3 py-2 text-gray-100"
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
            <span className="text-gray-300">제목</span>
            <input
              name="title"
              required
              minLength={2}
              maxLength={100}
              className="rounded-lg border border-gray-700 bg-gray-950 px-3 py-2 text-gray-100"
            />
          </label>

          <label className="grid gap-2 text-sm">
            <span className="text-gray-300">내용</span>
            <textarea
              name="content"
              required
              minLength={5}
              rows={8}
              className="rounded-lg border border-gray-700 bg-gray-950 px-3 py-2 text-gray-100"
            />
          </label>

          <button
            type="submit"
            className="rounded-lg bg-blue-600 px-4 py-3 text-sm font-semibold text-white hover:bg-blue-500"
          >
            문의 접수하기
          </button>
        </div>
      </form>
    </main>
  );
}