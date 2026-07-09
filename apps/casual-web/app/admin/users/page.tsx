import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";

import { updateUserModeration } from "@/app/admin/users/actions";
import { SiteHeader } from "@/components/SiteHeader";
import {
  getCasualUserStatusLabel,
  normalizeCasualUserStatus,
  type CasualUserStatus,
} from "@/lib/casual-user-status";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "유저 관리",
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

type ProfileRow = {
  user_id: string;
  nickname: string;
  bio: string | null;
  opinion_count: number | null;
  received_like_count: number | null;
  created_at: string | null;
};

type ModerationRow = {
  user_id: string;
  status: string | null;
  reason: string | null;
  expires_at: string | null;
};

function formatCount(value: number | null | undefined) {
  return new Intl.NumberFormat("ko-KR").format(value ?? 0);
}

function formatDate(value: string | null | undefined) {
  if (!value) return "-";

  return new Intl.DateTimeFormat("ko-KR", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

function formatDateTimeLocal(value: string | null | undefined) {
  if (!value) return "";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "";
  }

  const localDate = new Date(date.getTime() - date.getTimezoneOffset() * 60000);
  return localDate.toISOString().slice(0, 16);
}

function getStatusClass(status: CasualUserStatus) {
  if (status === "limited") return "bg-yellow-50 text-yellow-800";
  if (status === "suspended") return "bg-red-50 text-red-700";
  return "bg-green-50 text-green-700";
}

export default async function AdminUsersPage({
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

  const { data: profilesData, error: profilesError } = await supabase
    .from("casual_profiles")
    .select(
      "user_id, nickname, bio, opinion_count, received_like_count, created_at",
    )
    .order("created_at", { ascending: false });

  if (profilesError) {
    return (
      <main className="min-h-screen bg-red-50 p-8 text-red-900">
        <h1 className="text-2xl font-black">유저 목록을 불러오지 못했습니다.</h1>
        <pre className="mt-4 whitespace-pre-wrap rounded-xl bg-white p-4 text-sm">
          {profilesError.message}
        </pre>
      </main>
    );
  }

  const profiles = (profilesData ?? []) as ProfileRow[];
  const userIds = profiles.map((profile) => profile.user_id);

  const { data: moderationData, error: moderationError } =
    userIds.length > 0
      ? await supabase
          .from("casual_user_moderation")
          .select("user_id, status, reason, expires_at")
          .in("user_id", userIds)
      : { data: [], error: null };

  if (moderationError) {
    return (
      <main className="min-h-screen bg-red-50 p-8 text-red-900">
        <h1 className="text-2xl font-black">
          유저 제재 상태를 불러오지 못했습니다.
        </h1>
        <pre className="mt-4 whitespace-pre-wrap rounded-xl bg-white p-4 text-sm">
          {moderationError.message}
        </pre>
      </main>
    );
  }

  const moderationByUserId = new Map(
    ((moderationData ?? []) as ModerationRow[]).map((moderation) => [
      moderation.user_id,
      moderation,
    ]),
  );

  return (
    <main className="min-h-screen bg-[#fff7ed] text-[#2f2118]">
      <SiteHeader />

      <section className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
        <section className="rounded-3xl border border-orange-100 bg-white p-6 shadow-sm">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="text-sm font-bold tracking-[0.3em] text-orange-700">
                ADMIN USERS
              </p>
              <h1 className="mt-2 text-3xl font-black sm:text-4xl">
                유저 관리
              </h1>
              <p className="mt-3 max-w-2xl text-sm leading-6 text-stone-600">
                캐주얼 사이트 이용자의 참여 제한과 이용 정지 상태를 관리합니다.
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
                href="/admin/qa"
                className="rounded-full border border-stone-200 px-4 py-2 text-sm font-bold text-stone-700 transition hover:bg-stone-50"
              >
                QA 체크리스트
              </Link>
              <Link
                href="/admin/logs"
                className="rounded-full border border-stone-200 px-4 py-2 text-sm font-bold text-stone-700 transition hover:bg-stone-50"
              >
                관리자 로그
              </Link>
              <Link
                href="/admin/announcements"
                className="rounded-full border border-stone-200 px-4 py-2 text-sm font-bold text-stone-700 transition hover:bg-stone-50"
              >
                공지 관리
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

        <section className="mt-8 space-y-4">
          {profiles.map((profile) => {
            const moderation = moderationByUserId.get(profile.user_id);
            const status = normalizeCasualUserStatus(moderation?.status);

            return (
              <article
                key={profile.user_id}
                className="rounded-3xl border border-orange-100 bg-white p-5 shadow-sm"
              >
                <div className="grid gap-5 lg:grid-cols-[1fr_420px]">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span
                        className={`rounded-full px-3 py-1 text-xs font-black ${getStatusClass(
                          status,
                        )}`}
                      >
                        {getCasualUserStatusLabel(status)}
                      </span>

                      <span className="rounded-full bg-stone-100 px-3 py-1 text-xs font-black text-stone-600">
                        가입 {formatDate(profile.created_at)}
                      </span>
                    </div>

                    <h2 className="mt-3 text-2xl font-black">
                      {profile.nickname}
                    </h2>

                    <p className="mt-3 whitespace-pre-wrap text-sm leading-6 text-stone-600">
                      {profile.bio || "아직 한 줄 소개가 없습니다."}
                    </p>

                    <div className="mt-4 flex flex-wrap gap-2 text-xs font-bold text-stone-500">
                      <span>의견 {formatCount(profile.opinion_count)}</span>
                      <span>·</span>
                      <span>
                        받은 공감 {formatCount(profile.received_like_count)}
                      </span>
                      {moderation?.reason && (
                        <>
                          <span>·</span>
                          <span>사유 {moderation.reason}</span>
                        </>
                      )}
                      {moderation?.expires_at && (
                        <>
                          <span>·</span>
                          <span>만료 {formatDate(moderation.expires_at)}</span>
                        </>
                      )}
                    </div>

                    <div className="mt-4">
                      <Link
                        href={`/users/${encodeURIComponent(profile.nickname)}`}
                        className="text-sm font-black text-orange-700 underline underline-offset-4"
                      >
                        공개 프로필 보기
                      </Link>
                    </div>
                  </div>

                  <form
                    action={updateUserModeration}
                    className="rounded-2xl bg-stone-50 p-4"
                  >
                    <input
                      type="hidden"
                      name="userId"
                      value={profile.user_id}
                    />

                    <div className="grid gap-3">
                      <div>
                        <label className="text-xs font-black text-stone-600">
                          상태
                        </label>
                        <select
                          name="status"
                          defaultValue={status}
                          className="mt-2 w-full rounded-2xl border border-stone-200 bg-white px-4 py-3 text-sm font-bold outline-none focus:border-orange-400"
                        >
                          <option value="active">active</option>
                          <option value="limited">limited</option>
                          <option value="suspended">suspended</option>
                        </select>
                      </div>

                      <div>
                        <label className="text-xs font-black text-stone-600">
                          사유
                        </label>
                        <input
                          name="reason"
                          defaultValue={moderation?.reason ?? ""}
                          className="mt-2 w-full rounded-2xl border border-stone-200 px-4 py-3 text-sm outline-none focus:border-orange-400"
                          placeholder="운영 메모 또는 제재 사유"
                        />
                      </div>

                      <div>
                        <label className="text-xs font-black text-stone-600">
                          만료 시각
                        </label>
                        <input
                          name="expiresAt"
                          type="datetime-local"
                          defaultValue={formatDateTimeLocal(
                            moderation?.expires_at,
                          )}
                          className="mt-2 w-full rounded-2xl border border-stone-200 px-4 py-3 text-sm outline-none focus:border-orange-400"
                        />
                      </div>
                    </div>

                    <button className="mt-4 w-full rounded-full bg-stone-950 px-5 py-3 text-sm font-black text-white transition hover:-translate-y-0.5">
                      상태 저장
                    </button>
                  </form>
                </div>
              </article>
            );
          })}

          {profiles.length === 0 && (
            <div className="rounded-3xl border border-orange-100 bg-white p-8 text-center">
              <h2 className="text-xl font-black">아직 유저가 없습니다.</h2>
              <p className="mt-2 text-sm text-stone-600">
                회원가입한 유저의 프로필이 이곳에 표시됩니다.
              </p>
            </div>
          )}
        </section>
      </section>
    </main>
  );
}
