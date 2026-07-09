import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";

import { SiteHeader } from "@/components/SiteHeader";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "관리자 로그",
  robots: {
    index: false,
    follow: false,
  },
};

export const dynamic = "force-dynamic";

type AuditLogRow = Record<string, unknown>;

type ProfileRow = {
  user_id: string;
  nickname: string;
};

function getStringValue(value: unknown) {
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

function getLogString(log: AuditLogRow, key: string) {
  return getStringValue(log[key]);
}

function getAdminUserId(log: AuditLogRow) {
  return (
    getLogString(log, "admin_user_id") ??
    getLogString(log, "actor_user_id") ??
    getLogString(log, "user_id")
  );
}

function getMetadata(log: AuditLogRow): Record<string, unknown> | null {
  const metadata = log.metadata;

  if (!metadata) {
    return null;
  }

  if (typeof metadata === "string") {
    try {
      const parsed = JSON.parse(metadata) as unknown;
      return parsed && typeof parsed === "object" && !Array.isArray(parsed)
        ? (parsed as Record<string, unknown>)
        : { value: metadata };
    } catch {
      return { value: metadata };
    }
  }

  if (metadata && typeof metadata === "object" && !Array.isArray(metadata)) {
    return metadata as Record<string, unknown>;
  }

  return { value: metadata };
}

function getMetadataString(
  metadata: Record<string, unknown> | null,
  key: string,
) {
  return metadata ? getStringValue(metadata[key]) : null;
}

function formatDate(value: string | null | undefined) {
  if (!value) return "-";

  return new Intl.DateTimeFormat("ko-KR", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

function getTargetLink({
  metadata,
  targetId,
  targetType,
  targetUserProfile,
}: {
  metadata: Record<string, unknown> | null;
  targetId: string | null;
  targetType: string | null;
  targetUserProfile: ProfileRow | null;
}) {
  if (targetType === "topic" && targetId) {
    return { href: `/topics/${targetId}`, label: "주제 보기" };
  }

  if (targetType === "user" && targetUserProfile) {
    return {
      href: `/users/${encodeURIComponent(targetUserProfile.nickname)}`,
      label: "유저 보기",
    };
  }

  if (targetType === "report") {
    return { href: "/admin/reports", label: "신고 관리" };
  }

  if (targetType === "announcement") {
    return { href: "/admin/announcements", label: "공지 관리" };
  }

  if (targetType === "opinion" || targetType === "comment") {
    const topicId = getMetadataString(metadata, "topicId");

    if (topicId) {
      return { href: `/topics/${topicId}`, label: "주제 보기" };
    }
  }

  return null;
}

export default async function AdminLogsPage() {
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

  const { data: logsData, error } = await supabase
    .from("casual_admin_audit_logs")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(100);

  if (error) {
    return (
      <main className="min-h-screen bg-red-50 p-8 text-red-900">
        <h1 className="text-2xl font-black">
          관리자 로그를 불러오지 못했습니다.
        </h1>
        <pre className="mt-4 whitespace-pre-wrap rounded-xl bg-white p-4 text-sm">
          {error.message}
        </pre>
      </main>
    );
  }

  const logs = (logsData ?? []) as AuditLogRow[];

  const profileUserIds = Array.from(
    new Set(
      logs
        .flatMap((log) => [
          getAdminUserId(log),
          getLogString(log, "target_user_id"),
        ])
        .filter((value): value is string => Boolean(value)),
    ),
  );

  const { data: profilesData } =
    profileUserIds.length > 0
      ? await supabase
          .from("casual_profiles")
          .select("user_id, nickname")
          .in("user_id", profileUserIds)
      : { data: [] };

  const profileByUserId = new Map(
    ((profilesData ?? []) as ProfileRow[]).map((profile) => [
      profile.user_id,
      profile,
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
                ADMIN LOGS
              </p>
              <h1 className="mt-2 text-3xl font-black sm:text-4xl">
                관리자 로그
              </h1>
              <p className="mt-3 max-w-2xl text-sm leading-6 text-stone-600">
                관리자 조치 이력 최신 100개를 확인합니다.
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
                href="/admin/announcements"
                className="rounded-full border border-stone-200 px-4 py-2 text-sm font-bold text-stone-700 transition hover:bg-stone-50"
              >
                공지 관리
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

        <section className="mt-8 space-y-4">
          {logs.map((log, index) => {
            const metadata = getMetadata(log);
            const metadataText = metadata
              ? JSON.stringify(metadata, null, 2)
              : "";
            const adminUserId = getAdminUserId(log);
            const targetUserId = getLogString(log, "target_user_id");
            const targetType = getLogString(log, "target_type");
            const targetId = getLogString(log, "target_id");
            const adminProfile = adminUserId
              ? profileByUserId.get(adminUserId)
              : null;
            const targetUserProfile = targetUserId
              ? profileByUserId.get(targetUserId)
              : null;
            const targetLink = getTargetLink({
              metadata,
              targetId,
              targetType,
              targetUserProfile: targetUserProfile ?? null,
            });

            return (
              <article
                key={getLogString(log, "id") ?? `${index}-${targetId}`}
                className="rounded-3xl border border-orange-100 bg-white p-5 shadow-sm"
              >
                <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="rounded-full bg-orange-100 px-3 py-1 text-xs font-black text-orange-800">
                        {getLogString(log, "action") ?? "unknown_action"}
                      </span>
                      <span className="rounded-full bg-stone-100 px-3 py-1 text-xs font-black text-stone-600">
                        {targetType ?? "target"} {targetId ?? "-"}
                      </span>
                    </div>

                    <p className="mt-3 text-lg font-black">
                      {getLogString(log, "message") ?? "메시지 없음"}
                    </p>

                    <div className="mt-4 flex flex-wrap gap-2 text-xs font-bold text-stone-500">
                      <span>
                        생성 {formatDate(getLogString(log, "created_at"))}
                      </span>
                      <span>·</span>
                      <span>
                        관리자 {adminProfile?.nickname ?? adminUserId ?? "-"}
                      </span>
                      <span>·</span>
                      <span>
                        대상 유저{" "}
                        {targetUserProfile?.nickname ?? targetUserId ?? "-"}
                      </span>
                    </div>

                    {metadataText && (
                      <details className="mt-4 rounded-2xl bg-stone-50 p-4">
                        <summary className="cursor-pointer text-xs font-black text-stone-600">
                          metadata 보기
                        </summary>
                        <pre className="mt-3 max-h-48 overflow-auto whitespace-pre-wrap text-xs leading-5 text-stone-600">
                          {metadataText}
                        </pre>
                      </details>
                    )}
                  </div>

                  <div className="flex flex-wrap gap-2 lg:justify-end">
                    {targetLink && (
                      <Link
                        href={targetLink.href}
                        className="rounded-full border border-orange-200 bg-orange-50 px-4 py-2 text-sm font-black text-orange-800 transition hover:bg-orange-100"
                      >
                        {targetLink.label}
                      </Link>
                    )}
                  </div>
                </div>
              </article>
            );
          })}

          {logs.length === 0 && (
            <div className="rounded-3xl border border-orange-100 bg-white p-8 text-center">
              <h2 className="text-xl font-black">아직 관리자 로그가 없습니다.</h2>
              <p className="mt-2 text-sm text-stone-600">
                관리자 조치가 발생하면 이곳에 이력이 표시됩니다.
              </p>
            </div>
          )}
        </section>
      </section>
    </main>
  );
}
