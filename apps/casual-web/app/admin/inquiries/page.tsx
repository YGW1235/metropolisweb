import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";

import { updateInquiryStatus } from "@/app/admin/inquiries/actions";
import { SiteHeader } from "@/components/SiteHeader";
import { SubmitButton } from "@/components/SubmitButton";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "문의 관리",
  robots: {
    index: false,
    follow: false,
  },
};

export const dynamic = "force-dynamic";

type SearchParams = Promise<{
  message?: string;
  status?: string;
  type?: "success" | "error";
}>;

type InquiryStatus = "all" | "open" | "in_progress" | "resolved" | "archived";

type Inquiry = {
  id: string;
  user_id: string | null;
  name: string | null;
  email: string | null;
  category: string | null;
  subject: string;
  body: string;
  status: string | null;
  admin_note: string | null;
  handled_by: string | null;
  handled_at: string | null;
  created_at: string | null;
};

const STATUS_FILTERS: { label: string; value: InquiryStatus }[] = [
  { label: "처리 대기", value: "open" },
  { label: "처리 중", value: "in_progress" },
  { label: "처리 완료", value: "resolved" },
  { label: "보관", value: "archived" },
  { label: "전체", value: "all" },
];

const INQUIRY_STATUS_OPTIONS = STATUS_FILTERS.filter(
  (option) => option.value !== "all",
) as { label: string; value: Exclude<InquiryStatus, "all"> }[];

function getStatus(value?: string): InquiryStatus {
  if (
    value === "all" ||
    value === "in_progress" ||
    value === "resolved" ||
    value === "archived"
  ) {
    return value;
  }

  return "open";
}

function getStatusLabel(status: string | null | undefined) {
  if (status === "in_progress") return "처리 중";
  if (status === "resolved") return "처리 완료";
  if (status === "archived") return "보관";
  return "처리 대기";
}

function getStatusClass(status: string | null | undefined) {
  if (status === "resolved") return "bg-green-50 text-green-700";
  if (status === "in_progress") return "bg-yellow-50 text-yellow-800";
  if (status === "archived") return "bg-stone-100 text-stone-700";
  return "bg-orange-50 text-orange-800";
}

function getCategoryLabel(category: string | null | undefined) {
  if (category === "account") return "계정 문의";
  if (category === "bug") return "오류 신고";
  if (category === "report") return "신고/운영 문의";
  if (category === "partnership") return "제휴/광고 문의";
  if (category === "other") return "기타";
  return "일반 문의";
}

function formatDate(value: string | null | undefined) {
  if (!value) return "-";

  return new Intl.DateTimeFormat("ko-KR", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

function getFilterHref(status: InquiryStatus) {
  return `/admin/inquiries?status=${status}`;
}

export default async function AdminInquiriesPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const params = await searchParams;
  const status = getStatus(params.status);
  const returnPath = `/admin/inquiries?status=${status}`;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login?message=로그인이 필요합니다.&type=error");
  }

  const { data: isAdmin } = await supabase.rpc("is_casual_admin");

  if (!isAdmin) {
    redirect("/?message=관리자 권한이 필요합니다.&type=error");
  }

  let query = supabase
    .from("casual_inquiries")
    .select(
      "id, user_id, name, email, category, subject, body, status, admin_note, handled_by, handled_at, created_at",
    )
    .order("created_at", { ascending: false })
    .limit(100);

  if (status !== "all") {
    query = query.eq("status", status);
  }

  const { data: inquiriesData, error } = await query;

  if (error) {
    console.error("Failed to load casual inquiries:", error.message);

    return (
      <main className="min-h-screen bg-red-50 p-8 text-red-900">
        <h1 className="text-2xl font-black">문의 목록을 불러오지 못했습니다.</h1>
        <p className="mt-4 rounded-xl bg-white p-4 text-sm font-bold">
          잠시 후 다시 시도해주세요.
        </p>
      </main>
    );
  }

  const inquiries = (inquiriesData ?? []) as Inquiry[];

  return (
    <main className="casual-page-bg min-h-screen text-[#2f2118]">
      <SiteHeader />

      <section className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
        <section className="rounded-3xl border border-orange-100 bg-white p-6 shadow-sm">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="text-sm font-bold tracking-[0.3em] text-orange-700">
                ADMIN INQUIRIES
              </p>
              <h1 className="mt-2 text-3xl font-black sm:text-4xl">
                문의 관리
              </h1>
              <p className="mt-3 max-w-2xl text-sm leading-6 text-stone-600">
                공개 문의 페이지로 접수된 운영 문의를 확인하고 처리 상태를
                관리합니다.
              </p>
            </div>

            <div className="flex flex-wrap gap-2">
              <Link
                href="/admin"
                className="rounded-full border border-stone-200 px-4 py-2 text-sm font-bold text-stone-700 transition hover:bg-stone-50"
              >
                대시보드
              </Link>
              <Link
                href="/admin/reports"
                className="rounded-full border border-orange-200 bg-orange-50 px-4 py-2 text-sm font-bold text-orange-800 transition hover:bg-orange-100"
              >
                신고 관리
              </Link>
              <Link
                href="/admin/logs"
                className="rounded-full border border-stone-200 px-4 py-2 text-sm font-bold text-stone-700 transition hover:bg-stone-50"
              >
                관리자 로그
              </Link>
            </div>
          </div>
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

        <section className="mt-6 rounded-3xl border border-orange-100 bg-white p-4 shadow-sm">
          <p className="text-sm font-black text-stone-700">상태 필터</p>
          <div className="mt-3 flex flex-wrap gap-2">
            {STATUS_FILTERS.map((option) => (
              <Link
                key={option.value}
                href={getFilterHref(option.value)}
                className={`rounded-full px-4 py-2 text-sm font-black transition ${
                  status === option.value
                    ? "bg-orange-500 text-white"
                    : "bg-stone-100 text-stone-700 hover:bg-stone-200"
                }`}
              >
                {option.label}
              </Link>
            ))}
          </div>
        </section>

        <section className="mt-6 space-y-5">
          {inquiries.map((inquiry) => (
            <article
              key={inquiry.id}
              className="rounded-3xl border border-orange-100 bg-white p-5 shadow-sm"
            >
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span
                      className={`rounded-full px-3 py-1 text-xs font-black ${getStatusClass(
                        inquiry.status,
                      )}`}
                    >
                      {getStatusLabel(inquiry.status)}
                    </span>
                    <span className="rounded-full bg-stone-100 px-3 py-1 text-xs font-black text-stone-600">
                      {getCategoryLabel(inquiry.category)}
                    </span>
                    <span className="rounded-full bg-orange-50 px-3 py-1 text-xs font-black text-orange-800">
                      {inquiry.user_id ? "로그인 유저" : "비로그인"}
                    </span>
                  </div>

                  <h2 className="mt-4 text-2xl font-black">
                    {inquiry.subject}
                  </h2>

                  <div className="mt-3 flex flex-wrap gap-2 text-xs font-bold text-stone-500">
                    <span>이름 {inquiry.name || "-"}</span>
                    <span>·</span>
                    <span>이메일 {inquiry.email || "-"}</span>
                    <span>·</span>
                    <span>접수 {formatDate(inquiry.created_at)}</span>
                    <span>·</span>
                    <span>처리 {formatDate(inquiry.handled_at)}</span>
                  </div>
                </div>
              </div>

              <p className="mt-5 whitespace-pre-wrap rounded-2xl bg-stone-50 p-4 text-sm leading-6 text-stone-700">
                {inquiry.body}
              </p>

              {inquiry.admin_note && (
                <div className="mt-4 rounded-2xl bg-orange-50 p-4">
                  <p className="text-xs font-black text-orange-700">
                    관리자 메모
                  </p>
                  <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-stone-700">
                    {inquiry.admin_note}
                  </p>
                </div>
              )}

              <form
                action={updateInquiryStatus}
                className="mt-5 grid gap-3 lg:grid-cols-[180px_minmax(0,1fr)_auto]"
              >
                <input type="hidden" name="inquiryId" value={inquiry.id} />
                <input type="hidden" name="returnPath" value={returnPath} />

                <label>
                  <span className="text-xs font-black text-stone-600">
                    상태
                  </span>
                  <select
                    name="status"
                    defaultValue={inquiry.status ?? "open"}
                    className="mt-2 w-full rounded-2xl border border-orange-100 bg-orange-50/40 px-4 py-3 text-sm font-bold outline-none focus:border-orange-400 focus:bg-white"
                  >
                    {INQUIRY_STATUS_OPTIONS.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </label>

                <label>
                  <span className="text-xs font-black text-stone-600">
                    처리 메모
                  </span>
                  <textarea
                    name="adminNote"
                    defaultValue={inquiry.admin_note ?? ""}
                    rows={2}
                    className="mt-2 w-full rounded-2xl border border-orange-100 bg-orange-50/40 px-4 py-3 text-sm font-bold leading-6 outline-none focus:border-orange-400 focus:bg-white"
                    placeholder="처리 메모를 입력하세요. 선택 사항입니다."
                  />
                </label>

                <SubmitButton
                  className="self-end rounded-2xl bg-stone-950 px-5 py-3 text-sm font-black text-white transition hover:-translate-y-0.5"
                  pendingText="처리 중..."
                >
                  저장
                </SubmitButton>
              </form>
            </article>
          ))}

          {inquiries.length === 0 && (
            <div className="rounded-3xl border border-orange-100 bg-white p-8 text-center">
              <h2 className="text-xl font-black">조건에 맞는 문의가 없습니다.</h2>
              <p className="mt-2 text-sm text-stone-600">
                다른 상태 필터를 선택하거나 새 문의 접수를 기다려주세요.
              </p>
            </div>
          )}
        </section>
      </section>
    </main>
  );
}
