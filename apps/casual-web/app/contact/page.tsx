import type { Metadata } from "next";
import Link from "next/link";

import { createInquiry } from "@/app/contact/actions";
import { PublicShell } from "@/components/PublicShell";
import { SiteHeader } from "@/components/SiteHeader";
import { SubmitButton } from "@/components/SubmitButton";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "문의하기",
  description: "심포지온 운영팀에 계정, 오류, 신고, 제휴 관련 문의를 보냅니다.",
  alternates: {
    canonical: "/contact",
  },
};

export const dynamic = "force-dynamic";

type SearchParams = Promise<{
  message?: string;
  type?: "success" | "error";
}>;

type MyInquiry = {
  id: string;
  subject: string;
  status: string | null;
  created_at: string | null;
};

const CATEGORY_OPTIONS = [
  { value: "general", label: "일반 문의" },
  { value: "account", label: "계정 문의" },
  { value: "bug", label: "오류 신고" },
  { value: "report", label: "신고/운영 문의" },
  { value: "partnership", label: "제휴/광고 문의" },
  { value: "other", label: "기타" },
];

function formatDate(value: string | null | undefined) {
  if (!value) return "-";

  return new Intl.DateTimeFormat("ko-KR", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

function getStatusLabel(status: string | null | undefined) {
  if (status === "in_progress") return "처리 중";
  if (status === "resolved") return "처리 완료";
  if (status === "archived") return "보관";
  return "처리 대기";
}

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

  let defaultName = "";
  let myInquiries: MyInquiry[] = [];

  if (user) {
    const { data: profile } = await supabase
      .from("casual_profiles")
      .select("nickname")
      .eq("user_id", user.id)
      .maybeSingle();

    defaultName = profile?.nickname ?? "";

    const { data: inquiriesData } = await supabase
      .from("casual_inquiries")
      .select("id, subject, status, created_at")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(5);

    myInquiries = (inquiriesData ?? []) as MyInquiry[];
  }

  return (
    <main className="casual-page-bg min-h-screen text-[#2f2118]">
      <SiteHeader />

      <PublicShell>
        <section className="w-full">
          <section className="rounded-[2rem] border border-orange-100 bg-white p-6 shadow-sm sm:p-8">
            <p className="text-sm font-bold tracking-[0.3em] text-orange-700">
              CONTACT
            </p>
            <h1 className="mt-2 text-3xl font-black sm:text-4xl">문의하기</h1>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-stone-600">
              계정, 오류, 운영 문의를 남겨주세요. 답변이 필요한 경우 받을 수
              있는 이메일을 꼭 입력해주세요.
            </p>
          </section>

          {params.message && (
            <div
              className={`mt-6 rounded-2xl p-4 text-sm font-bold ${
                params.type === "error"
                  ? "bg-red-50 text-red-700"
                  : "bg-green-50 text-green-700"
              }`}
            >
              {params.message}
            </div>
          )}

          <form
            action={createInquiry}
            className="mt-6 rounded-[2rem] border border-orange-100 bg-white p-5 shadow-sm sm:p-6"
          >
            <div className="hidden" aria-hidden="true">
              <label htmlFor="website">Website</label>
              <input
                id="website"
                name="website"
                tabIndex={-1}
                autoComplete="off"
              />
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <label className="block">
                <span className="text-sm font-black text-stone-700">
                  이름, 선택
                </span>
                <input
                  name="name"
                  defaultValue={defaultName}
                  className="mt-2 w-full rounded-2xl border border-orange-100 bg-orange-50/40 px-4 py-3 text-sm font-bold outline-none focus:border-orange-400 focus:bg-white"
                  placeholder="어떻게 불러드릴까요?"
                />
              </label>

              <label className="block">
                <span className="text-sm font-black text-stone-700">
                  이메일
                </span>
                <input
                  name="email"
                  type="email"
                  defaultValue={user?.email ?? ""}
                  required={!user}
                  className="mt-2 w-full rounded-2xl border border-orange-100 bg-orange-50/40 px-4 py-3 text-sm font-bold outline-none focus:border-orange-400 focus:bg-white"
                  placeholder="reply@example.com"
                />
              </label>
            </div>

            <div className="mt-4 grid gap-4 md:grid-cols-[220px_1fr]">
              <label className="block">
                <span className="text-sm font-black text-stone-700">
                  문의 유형
                </span>
                <select
                  name="category"
                  defaultValue="general"
                  className="mt-2 w-full rounded-2xl border border-orange-100 bg-orange-50/40 px-4 py-3 text-sm font-bold outline-none focus:border-orange-400 focus:bg-white"
                >
                  {CATEGORY_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </label>

              <label className="block">
                <span className="text-sm font-black text-stone-700">제목</span>
                <input
                  name="subject"
                  required
                  minLength={1}
                  maxLength={100}
                  className="mt-2 w-full rounded-2xl border border-orange-100 bg-orange-50/40 px-4 py-3 text-sm font-bold outline-none focus:border-orange-400 focus:bg-white"
                  placeholder="문의 제목을 입력해주세요."
                />
              </label>
            </div>

            <label className="mt-4 block">
              <span className="text-sm font-black text-stone-700">내용</span>
              <textarea
                name="body"
                required
                minLength={10}
                maxLength={2000}
                rows={9}
                className="mt-2 w-full rounded-2xl border border-orange-100 bg-orange-50/40 px-4 py-3 text-sm font-bold leading-6 outline-none focus:border-orange-400 focus:bg-white"
                placeholder="문의 내용을 10자 이상 입력해주세요."
              />
            </label>

            <div className="mt-5 flex flex-wrap items-center justify-between gap-3">
              <p className="text-xs font-bold leading-5 text-stone-500">
                문의 처리에 필요한 범위 안에서 입력한 연락처와 내용이 저장됩니다.
              </p>
              <SubmitButton
                className="rounded-full bg-stone-950 px-5 py-3 text-sm font-black text-white transition hover:-translate-y-0.5"
                pendingText="문의 접수 중..."
              >
                문의 보내기
              </SubmitButton>
            </div>
          </form>

          {user && (
            <section className="mt-6 rounded-[2rem] border border-orange-100 bg-white p-5 shadow-sm sm:p-6">
              <div className="flex flex-wrap items-end justify-between gap-3">
                <div>
                  <p className="text-sm font-bold text-orange-700">
                    MY INQUIRIES
                  </p>
                  <h2 className="mt-1 text-2xl font-black">최근 내 문의</h2>
                </div>
                <Link href="/me" className="text-sm font-bold text-stone-500">
                  내 활동
                </Link>
              </div>

              <div className="mt-4 space-y-3">
                {myInquiries.map((inquiry) => (
                  <div
                    key={inquiry.id}
                    className="rounded-2xl border border-stone-100 p-4"
                  >
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="rounded-full bg-orange-50 px-3 py-1 text-xs font-black text-orange-800">
                        {getStatusLabel(inquiry.status)}
                      </span>
                      <span className="text-xs font-bold text-stone-500">
                        {formatDate(inquiry.created_at)}
                      </span>
                    </div>
                    <p className="mt-2 line-clamp-1 text-sm font-black">
                      {inquiry.subject}
                    </p>
                  </div>
                ))}
              </div>

              {myInquiries.length === 0 && (
                <p className="mt-4 rounded-2xl bg-stone-50 p-5 text-center text-sm font-bold text-stone-500">
                  아직 제출한 문의가 없습니다.
                </p>
              )}
            </section>
          )}
        </section>
      </PublicShell>
    </main>
  );
}
