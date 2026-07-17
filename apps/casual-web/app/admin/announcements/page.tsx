import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";

import {
  archiveAnnouncement,
  createAnnouncement,
  updateAnnouncementStatus,
} from "@/app/admin/announcements/actions";
import { SiteHeader } from "@/components/SiteHeader";
import { SubmitButton } from "@/components/SubmitButton";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "공지 관리",
  robots: {
    index: false,
    follow: false,
  },
};

export const dynamic = "force-dynamic";

type SearchParams = Promise<{
  message?: string;
  type?: "success" | "error";
}>;

type Announcement = {
  id: string;
  title: string;
  body: string | null;
  tone: string | null;
  status: string | null;
  link_label: string | null;
  link_url: string | null;
  starts_at: string | null;
  ends_at: string | null;
  created_at: string | null;
};

function formatDate(value: string | null | undefined) {
  if (!value) return "-";

  return new Intl.DateTimeFormat("ko-KR", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

function getStatusLabel(status: string | null) {
  if (status === "active") return "활성";
  if (status === "archived") return "보관";
  return "초안";
}

function getStatusClass(status: string | null) {
  if (status === "active") return "bg-green-50 text-green-700";
  if (status === "archived") return "bg-stone-100 text-stone-700";
  return "bg-yellow-50 text-yellow-800";
}

function getToneClass(tone: string | null) {
  if (tone === "warning") return "bg-yellow-50 text-yellow-800";
  if (tone === "success") return "bg-green-50 text-green-700";
  return "bg-orange-50 text-orange-800";
}

export default async function AdminAnnouncementsPage({
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

  const { data: isAdmin } = await supabase.rpc("is_casual_admin");

  if (!isAdmin) {
    redirect("/?message=관리자 권한이 필요합니다.&type=error");
  }

  const { data: announcementsData, error } = await supabase
    .from("casual_announcements")
    .select(
      "id, title, body, tone, status, link_label, link_url, starts_at, ends_at, created_at",
    )
    .order("created_at", { ascending: false });

  if (error) {
    return (
      <main className="min-h-screen bg-red-50 p-8 text-red-900">
        <h1 className="text-2xl font-black">공지 목록을 불러오지 못했습니다.</h1>
        <pre className="mt-4 whitespace-pre-wrap rounded-xl bg-white p-4 text-sm">
          {error.message}
        </pre>
      </main>
    );
  }

  const announcements = (announcementsData ?? []) as Announcement[];

  return (
    <main className="casual-page-bg min-h-screen text-[#2f2118]">
      <SiteHeader />

      <section className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
        <section className="rounded-3xl border border-orange-100 bg-white p-6 shadow-sm">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="text-sm font-bold tracking-[0.3em] text-orange-700">
                ADMIN ANNOUNCEMENTS
              </p>
              <h1 className="mt-2 text-3xl font-black sm:text-4xl">
                공지 관리
              </h1>
              <p className="mt-3 max-w-2xl text-sm leading-6 text-stone-600">
                사이트 상단에 노출할 운영 공지와 배너 상태를 관리합니다.
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
                href="/admin/topics"
                className="rounded-full border border-orange-200 bg-orange-50 px-4 py-2 text-sm font-bold text-orange-800 transition hover:bg-orange-100"
              >
                주제 관리
              </Link>
              <Link
                href="/admin/reports"
                className="rounded-full bg-stone-950 px-4 py-2 text-sm font-black text-white transition hover:-translate-y-0.5"
              >
                신고 관리
              </Link>
              <Link
                href="/admin/users"
                className="rounded-full border border-stone-200 px-4 py-2 text-sm font-bold text-stone-700 transition hover:bg-stone-50"
              >
                유저 관리
              </Link>
              <Link
                href="/admin/logs"
                className="rounded-full border border-stone-200 px-4 py-2 text-sm font-bold text-stone-700 transition hover:bg-stone-50"
              >
                관리자 로그
              </Link>
              <Link
                href="/admin/qa"
                className="rounded-full border border-stone-200 px-4 py-2 text-sm font-bold text-stone-700 transition hover:bg-stone-50"
              >
                QA 체크리스트
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

        <section className="mt-8 rounded-3xl border border-orange-100 bg-white p-6 shadow-sm">
          <p className="text-sm font-bold tracking-[0.3em] text-orange-700">
            CREATE ANNOUNCEMENT
          </p>
          <h2 className="mt-2 text-2xl font-black">새 공지 만들기</h2>

          <form action={createAnnouncement} className="mt-6 grid gap-4">
            <div>
              <label className="text-sm font-bold text-stone-700">제목</label>
              <input
                name="title"
                required
                maxLength={100}
                className="mt-2 w-full rounded-2xl border border-stone-200 px-4 py-3 outline-none focus:border-orange-400"
                placeholder="예: 서비스 점검 안내"
              />
            </div>

            <div>
              <label className="text-sm font-bold text-stone-700">본문</label>
              <textarea
                name="body"
                required
                maxLength={1000}
                className="mt-2 min-h-28 w-full resize-none rounded-2xl border border-stone-200 px-4 py-3 outline-none focus:border-orange-400"
                placeholder="공지 내용을 입력하세요."
              />
            </div>

            <div className="grid gap-4 md:grid-cols-3">
              <div>
                <label className="text-sm font-bold text-stone-700">tone</label>
                <select
                  name="tone"
                  defaultValue="info"
                  className="mt-2 w-full rounded-2xl border border-stone-200 bg-white px-4 py-3 outline-none focus:border-orange-400"
                >
                  <option value="info">info</option>
                  <option value="warning">warning</option>
                  <option value="success">success</option>
                </select>
              </div>

              <div>
                <label className="text-sm font-bold text-stone-700">
                  status
                </label>
                <select
                  name="status"
                  defaultValue="draft"
                  className="mt-2 w-full rounded-2xl border border-stone-200 bg-white px-4 py-3 outline-none focus:border-orange-400"
                >
                  <option value="draft">draft</option>
                  <option value="active">active</option>
                  <option value="archived">archived</option>
                </select>
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <label className="text-sm font-bold text-stone-700">
                  링크 문구, 선택
                </label>
                <input
                  name="linkLabel"
                  maxLength={40}
                  className="mt-2 w-full rounded-2xl border border-stone-200 px-4 py-3 outline-none focus:border-orange-400"
                  placeholder="예: 자세히 보기. 링크가 있을 때만 입력"
                />
              </div>

              <div>
                <label className="text-sm font-bold text-stone-700">
                  링크 URL, 선택
                </label>
                <input
                  name="linkUrl"
                  maxLength={500}
                  className="mt-2 w-full rounded-2xl border border-stone-200 px-4 py-3 outline-none focus:border-orange-400"
                  placeholder="/topics 또는 https://example.com. 링크가 있을 때만 입력"
                />
              </div>
            </div>

            <p className="-mt-2 text-xs font-bold text-stone-500">
              링크 없이 공지를 만들 수 있습니다. 링크를 사용하려면 문구와 URL을
              모두 입력해주세요.
            </p>

            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <label className="text-sm font-bold text-stone-700">
                  시작 시각
                </label>
                <input
                  name="startsAt"
                  type="datetime-local"
                  className="mt-2 w-full rounded-2xl border border-stone-200 px-4 py-3 outline-none focus:border-orange-400"
                />
              </div>

              <div>
                <label className="text-sm font-bold text-stone-700">
                  종료 시각
                </label>
                <input
                  name="endsAt"
                  type="datetime-local"
                  className="mt-2 w-full rounded-2xl border border-stone-200 px-4 py-3 outline-none focus:border-orange-400"
                />
              </div>
            </div>

            <div className="flex justify-end">
              <SubmitButton
                className="rounded-full bg-stone-950 px-6 py-3 text-sm font-black text-white transition hover:-translate-y-0.5"
                pendingText="공지 생성 중..."
              >
                공지 생성
              </SubmitButton>
            </div>
          </form>
        </section>

        <section className="mt-8 space-y-4">
          <div>
            <p className="text-sm font-bold text-orange-700">ANNOUNCEMENTS</p>
            <h2 className="mt-1 text-2xl font-black">공지 목록</h2>
          </div>

          {announcements.map((announcement) => (
            <article
              key={announcement.id}
              className="rounded-3xl border border-orange-100 bg-white p-5 shadow-sm"
            >
              <div className="grid gap-5 lg:grid-cols-[1fr_320px]">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span
                      className={`rounded-full px-3 py-1 text-xs font-black ${getStatusClass(
                        announcement.status,
                      )}`}
                    >
                      {getStatusLabel(announcement.status)}
                    </span>
                    <span
                      className={`rounded-full px-3 py-1 text-xs font-black ${getToneClass(
                        announcement.tone,
                      )}`}
                    >
                      {announcement.tone ?? "info"}
                    </span>
                  </div>

                  <h3 className="mt-3 text-xl font-black">
                    {announcement.title}
                  </h3>

                  <p className="mt-3 whitespace-pre-wrap text-sm leading-6 text-stone-600">
                    {announcement.body || "본문 없음"}
                  </p>

                  <div className="mt-4 flex flex-wrap gap-2 text-xs font-bold text-stone-500">
                    <span>생성 {formatDate(announcement.created_at)}</span>
                    <span>·</span>
                    <span>시작 {formatDate(announcement.starts_at)}</span>
                    <span>·</span>
                    <span>종료 {formatDate(announcement.ends_at)}</span>
                  </div>

                  {(announcement.link_label || announcement.link_url) && (
                    <p className="mt-3 break-all text-xs font-bold text-stone-500">
                      링크 {announcement.link_label ?? "-"} ·{" "}
                      {announcement.link_url ?? "-"}
                    </p>
                  )}
                </div>

                <div className="space-y-3 rounded-2xl bg-stone-50 p-4">
                  <form action={updateAnnouncementStatus} className="space-y-3">
                    <input
                      type="hidden"
                      name="announcementId"
                      value={announcement.id}
                    />

                    <div>
                      <label className="text-xs font-black text-stone-600">
                        상태 변경
                      </label>
                      <select
                        name="status"
                        defaultValue={announcement.status ?? "draft"}
                        className="mt-2 w-full rounded-2xl border border-stone-200 bg-white px-4 py-3 text-sm font-bold outline-none focus:border-orange-400"
                      >
                        <option value="draft">draft</option>
                        <option value="active">active</option>
                        <option value="archived">archived</option>
                      </select>
                    </div>

                    <SubmitButton
                      className="w-full rounded-full bg-stone-950 px-4 py-2 text-sm font-black text-white transition hover:-translate-y-0.5"
                      pendingText="저장 중..."
                    >
                      상태 저장
                    </SubmitButton>
                  </form>

                  {announcement.status !== "archived" && (
                    <form action={archiveAnnouncement}>
                      <input
                        type="hidden"
                        name="announcementId"
                        value={announcement.id}
                      />
                      <SubmitButton
                        className="w-full rounded-full bg-stone-100 px-4 py-2 text-sm font-black text-stone-700 transition hover:bg-stone-200"
                        pendingText="처리 중..."
                      >
                        보관 처리
                      </SubmitButton>
                    </form>
                  )}
                </div>
              </div>
            </article>
          ))}

          {announcements.length === 0 && (
            <div className="rounded-3xl border border-orange-100 bg-white p-8 text-center">
              <h2 className="text-xl font-black">아직 공지가 없습니다.</h2>
              <p className="mt-2 text-sm text-stone-600">
                위 폼에서 첫 운영 공지를 생성해보세요.
              </p>
            </div>
          )}
        </section>
      </section>
    </main>
  );
}
