import Link from "next/link";

import { AdminStateCard } from "@/components/admin-state-card";
import { requireAdmin } from "@/lib/auth";

type SearchParams = Promise<{
  action?: string;
}>;

type ActivityLog = {
  id: string;
  actor_id: string | null;
  action: string;
  target_type: string;
  target_id: string | null;
  summary: string | null;
  metadata: unknown;
  created_at: string;
};

type Profile = {
  id: string;
  email: string | null;
  display_name: string | null;
  role: string;
};

function actionLabel(action: string) {
  const labels: Record<string, string> = {
    "report.reviewing": "신고 검토 중",
    "report.hide_target": "신고 대상 숨김",
    "report.dismissed": "신고 기각",
    "user.suspended": "유저 정지",
    "user.reinstated": "유저 복구",
  };

  return labels[action] ?? action;
}

function actionBadgeClass(action: string) {
  if (action.includes("hide") || action.includes("suspended")) {
    return "bg-red-500/20 text-red-200";
  }

  if (action.includes("dismissed") || action.includes("reinstated")) {
    return "bg-emerald-500/20 text-emerald-200";
  }

  if (action.includes("reviewing")) {
    return "bg-blue-500/20 text-blue-200";
  }

  return "bg-gray-800 text-gray-300";
}

function formatDate(value: string) {
  return new Date(value).toLocaleString("ko-KR", {
    timeZone: "Asia/Seoul",
  });
}

function metadataText(value: unknown) {
  try {
    return JSON.stringify(value ?? {}, null, 2);
  } catch {
    return "{}";
  }
}

export default async function AdminActivityPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const params = await searchParams;
  const { supabase } = await requireAdmin();

  let query = supabase
    .from("admin_activity_logs")
    .select("id, actor_id, action, target_type, target_id, summary, metadata, created_at")
    .order("created_at", { ascending: false })
    .limit(100);

  if (params.action) {
    query = query.eq("action", params.action);
  }

  const { data: logs, error } = await query;

  const actorIds = Array.from(
    new Set(
      ((logs ?? []) as ActivityLog[])
        .map((log) => log.actor_id)
        .filter((id): id is string => Boolean(id)),
    ),
  );

  const { data: profiles } =
    actorIds.length > 0
      ? await supabase
          .from("profiles")
          .select("id, email, display_name, role")
          .in("id", actorIds)
      : { data: [] };

  const profileMap = new Map<string, Profile>();

  for (const profile of (profiles ?? []) as Profile[]) {
    profileMap.set(profile.id, profile);
  }

  const activityLogs = (logs ?? []) as ActivityLog[];

  return (
    <main className="mx-auto min-h-screen max-w-6xl px-4 py-10 text-gray-100 sm:px-6 sm:py-14">
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-semibold text-blue-300">Admin</p>
          <h1 className="mt-2 text-3xl font-bold">관리자 활동 로그</h1>
          <p className="mt-2 text-sm text-gray-400">
            신고 처리, 유저 정지/복구 등 주요 관리자 작업 기록을 확인합니다.
          </p>
        </div>

        <Link
          href="/admin"
          className="rounded-lg border border-gray-700 px-4 py-2 text-sm text-gray-200 hover:bg-gray-900"
        >
          관리자 홈으로
        </Link>
      </div>

      <div className="mb-6">
        <AdminStateCard
          tone="default"
          title="활동 로그 확인 안내"
          description="신고 처리, 유저 정지/복구 등 주요 관리자 작업이 기록됩니다. 운영 중에는 필터를 활용해 최근 처리 내역을 주기적으로 확인하세요."
        />
      </div>

      <section className="mb-6 flex flex-wrap gap-2">
        <Link
          href="/admin/activity"
          className={
            !params.action
              ? "rounded-full bg-blue-600 px-4 py-2 text-sm font-semibold text-white"
              : "rounded-full border border-gray-700 px-4 py-2 text-sm text-gray-300 hover:bg-gray-900"
          }
        >
          전체
        </Link>

        {[
          ["report.reviewing", "신고 검토"],
          ["report.hide_target", "대상 숨김"],
          ["report.dismissed", "신고 기각"],
          ["user.suspended", "유저 정지"],
          ["user.reinstated", "유저 복구"],
        ].map(([action, label]) => (
          <Link
            key={action}
            href={`/admin/activity?action=${encodeURIComponent(action)}`}
            className={
              params.action === action
                ? "rounded-full bg-blue-600 px-4 py-2 text-sm font-semibold text-white"
                : "rounded-full border border-gray-700 px-4 py-2 text-sm text-gray-300 hover:bg-gray-900"
            }
          >
            {label}
          </Link>
        ))}
      </section>

      {error ? (
        <AdminStateCard
          tone="danger"
          title="데이터를 불러오지 못했습니다."
          description={`잠시 후 다시 시도해주세요. 활동 로그 오류: ${error.message}`}
        />
      ) : null}

      <section className="grid gap-4">
        {!error && activityLogs.length > 0 ? (
          activityLogs.map((log) => {
            const actor = log.actor_id ? profileMap.get(log.actor_id) : null;

            return (
              <article
                key={log.id}
                className="rounded-2xl border border-gray-800 bg-gray-950/70 p-5"
              >
                <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span
                        className={`rounded-full px-2.5 py-1 text-xs font-semibold ${actionBadgeClass(
                          log.action,
                        )}`}
                      >
                        {actionLabel(log.action)}
                      </span>

                      <span className="rounded-full bg-gray-800 px-2.5 py-1 text-xs text-gray-300">
                        {log.target_type}
                      </span>
                    </div>

                    <h2 className="mt-3 text-lg font-semibold">
                      {log.summary ?? actionLabel(log.action)}
                    </h2>

                    <p className="mt-2 text-sm text-gray-400">
                      처리 시간: {formatDate(log.created_at)}
                    </p>

                    <div className="mt-4 grid gap-2 text-xs text-gray-500 sm:grid-cols-2">
                      <p className="break-all">Log ID: {log.id}</p>
                      <p className="break-all">
                        Target ID: {log.target_id ?? "-"}
                      </p>
                      <p className="break-all">
                        Actor ID: {log.actor_id ?? "-"}
                      </p>
                      <p>
                        Actor:{" "}
                        {actor
                          ? `${actor.display_name ?? "이름 없음"} / ${
                              actor.email ?? "이메일 없음"
                            }`
                          : "-"}
                      </p>
                    </div>
                  </div>

                  <details className="lg:w-96">
                    <summary className="cursor-pointer rounded-lg border border-gray-700 px-4 py-2 text-sm text-gray-300 hover:bg-gray-900">
                      metadata 보기
                    </summary>

                    <pre className="mt-3 max-h-80 overflow-auto rounded-lg bg-gray-900 p-4 text-xs text-gray-300">
                      {metadataText(log.metadata)}
                    </pre>
                  </details>
                </div>
              </article>
            );
          })
        ) : !error ? (
          <AdminStateCard
            title="아직 기록된 관리자 활동이 없습니다."
            description="관리자가 신고, 유저, 문의 등 운영 작업을 처리하면 이곳에 활동 로그가 표시됩니다."
          />
        ) : null}
      </section>
    </main>
  );
}
