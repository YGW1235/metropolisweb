import Link from "next/link";

import { AdminStateCard } from "@/components/admin-state-card";
import { requireAdmin } from "@/lib/auth";

type TopicStats = {
  topic_id: string;
  title: string;
  status: string;
  created_at: string;
  starts_at: string | null;
  ends_at: string | null;
  deleted_at: string | null;
  pro_count: number | string | null;
  con_count: number | string | null;
  total_participants: number | string | null;
  post_count: number | string | null;
  comment_count: number | string | null;
  report_count: number | string | null;
  pending_report_count: number | string | null;
  last_post_at: string | null;
  last_comment_at: string | null;
};

function toNumber(value: number | string | null | undefined) {
  return Number(value ?? 0);
}

function formatDate(value: string | null) {
  if (!value) return "-";

  return new Date(value).toLocaleString("ko-KR", {
    timeZone: "Asia/Seoul",
  });
}

function statusLabel(status: string) {
  const labels: Record<string, string> = {
    draft: "준비",
    open: "모집 중",
    active: "진행 중",
    closed: "종료",
    archived: "보관",
  };

  return labels[status] ?? status;
}

function statusClass(status: string) {
  if (status === "open") return "bg-emerald-500/20 text-emerald-200";
  if (status === "active") return "bg-blue-500/20 text-blue-200";
  if (status === "closed") return "bg-gray-700 text-gray-200";
  if (status === "archived") return "bg-purple-500/20 text-purple-200";
  return "bg-yellow-500/20 text-yellow-200";
}

export default async function AdminStatsPage() {
  const { supabase } = await requireAdmin();

  const { data, error } = await supabase.rpc("get_admin_topic_stats");

  const stats = (data ?? []) as TopicStats[];

  const totalTopics = stats.length;
  const totalParticipants = stats.reduce(
    (sum, topic) => sum + toNumber(topic.total_participants),
    0,
  );
  const totalPosts = stats.reduce(
    (sum, topic) => sum + toNumber(topic.post_count),
    0,
  );
  const totalComments = stats.reduce(
    (sum, topic) => sum + toNumber(topic.comment_count),
    0,
  );
  const totalPendingReports = stats.reduce(
    (sum, topic) => sum + toNumber(topic.pending_report_count),
    0,
  );

  return (
    <main className="mx-auto min-h-screen max-w-6xl px-4 py-10 text-gray-100 sm:px-6 sm:py-14">
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-semibold text-blue-300">Admin</p>
          <h1 className="mt-2 text-3xl font-bold">주제별 통계</h1>
          <p className="mt-2 text-sm text-gray-400">
            토론 주제별 참가, 게시글, 댓글, 신고 현황을 확인합니다.
          </p>
        </div>

        <Link
          href="/admin"
          className="rounded-lg border border-gray-700 px-4 py-2 text-sm text-gray-200 hover:bg-gray-900"
        >
          관리자 홈으로
        </Link>
      </div>

      {error ? (
        <div className="mb-6">
          <AdminStateCard
            tone="danger"
            title="데이터를 불러오지 못했습니다."
            description="주제 통계를 불러오지 못했습니다. 잠시 후 다시 시도해주세요."
          />
        </div>
      ) : null}

      <div className="mb-6">
        <AdminStateCard
          tone={totalPendingReports > 0 ? "warning" : "default"}
          title="주제 통계 확인 안내"
          description={
            totalPendingReports > 0
              ? "대기 중 신고가 있는 주제가 있습니다. 신고 관리 화면에서 처리 상태를 확인하세요."
              : "주제별 참가자, 게시글, 댓글, 신고 수를 확인해 운영 우선순위를 판단할 수 있습니다."
          }
        />
      </div>

      <section className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <div className="rounded-2xl border border-gray-800 bg-gray-950/70 p-5">
          <p className="text-sm text-gray-400">전체 주제</p>
          <p className="mt-2 text-2xl font-bold">{totalTopics}</p>
        </div>

        <div className="rounded-2xl border border-gray-800 bg-gray-950/70 p-5">
          <p className="text-sm text-gray-400">전체 참가자</p>
          <p className="mt-2 text-2xl font-bold">{totalParticipants}</p>
        </div>

        <div className="rounded-2xl border border-gray-800 bg-gray-950/70 p-5">
          <p className="text-sm text-gray-400">전체 게시글</p>
          <p className="mt-2 text-2xl font-bold">{totalPosts}</p>
        </div>

        <div className="rounded-2xl border border-gray-800 bg-gray-950/70 p-5">
          <p className="text-sm text-gray-400">전체 댓글</p>
          <p className="mt-2 text-2xl font-bold">{totalComments}</p>
        </div>

        <div className="rounded-2xl border border-red-500/20 bg-red-500/10 p-5">
          <p className="text-sm text-red-100/80">대기 중 신고</p>
          <p className="mt-2 text-2xl font-bold text-red-100">
            {totalPendingReports}
          </p>
        </div>
      </section>

      <section className="grid gap-4">
        {!error && stats.length > 0 ? (
          stats.map((topic) => (
            <article
              key={topic.topic_id}
              className="rounded-2xl border border-gray-800 bg-gray-950/70 p-5"
            >
              <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span
                      className={`rounded-full px-2.5 py-1 text-xs font-semibold ${statusClass(
                        topic.status,
                      )}`}
                    >
                      {statusLabel(topic.status)}
                    </span>

                    {topic.deleted_at ? (
                      <span className="rounded-full bg-red-500/20 px-2.5 py-1 text-xs text-red-200">
                        삭제 처리됨
                      </span>
                    ) : null}
                  </div>

                  <h2 className="mt-3 text-xl font-semibold">{topic.title}</h2>

                  <p className="mt-2 break-all text-xs text-gray-500">
                    Topic ID: {topic.topic_id}
                  </p>

                  <div className="mt-4 grid gap-2 text-sm text-gray-400 sm:grid-cols-2">
                    <p>생성일: {formatDate(topic.created_at)}</p>
                    <p>최근 게시글: {formatDate(topic.last_post_at)}</p>
                    <p>최근 댓글: {formatDate(topic.last_comment_at)}</p>
                    <p>삭제일: {formatDate(topic.deleted_at)}</p>
                  </div>
                </div>

                <div className="grid gap-3 sm:grid-cols-2 lg:w-[420px]">
                  <div className="rounded-xl border border-gray-800 bg-gray-900 p-4">
                    <p className="text-xs text-gray-500">참가자</p>
                    <p className="mt-1 text-xl font-bold">
                      {toNumber(topic.total_participants)}
                    </p>
                    <p className="mt-1 text-xs text-gray-400">
                      아테나 {toNumber(topic.pro_count)} / 포세이돈{" "}
                      {toNumber(topic.con_count)}
                    </p>
                  </div>

                  <div className="rounded-xl border border-gray-800 bg-gray-900 p-4">
                    <p className="text-xs text-gray-500">게시글</p>
                    <p className="mt-1 text-xl font-bold">
                      {toNumber(topic.post_count)}
                    </p>
                  </div>

                  <div className="rounded-xl border border-gray-800 bg-gray-900 p-4">
                    <p className="text-xs text-gray-500">댓글</p>
                    <p className="mt-1 text-xl font-bold">
                      {toNumber(topic.comment_count)}
                    </p>
                  </div>

                  <div
                    className={
                      toNumber(topic.pending_report_count) > 0
                        ? "rounded-xl border border-red-500/30 bg-red-500/10 p-4"
                        : "rounded-xl border border-gray-800 bg-gray-900 p-4"
                    }
                  >
                    <p className="text-xs text-gray-500">신고</p>
                    <p className="mt-1 text-xl font-bold">
                      {toNumber(topic.report_count)}
                    </p>
                    <p className="mt-1 text-xs text-red-200">
                      대기 {toNumber(topic.pending_report_count)}
                    </p>
                  </div>
                </div>
              </div>

              <div className="mt-5 flex flex-wrap gap-2">
                <Link
                  href={`/topics/${topic.topic_id}`}
                  className="rounded-lg border border-gray-700 px-3 py-2 text-sm text-gray-300 hover:bg-gray-900"
                >
                  주제 보기
                </Link>

                <Link
                  href={`/topics/${topic.topic_id}/debate`}
                  className="rounded-lg border border-gray-700 px-3 py-2 text-sm text-gray-300 hover:bg-gray-900"
                >
                  토론방 보기
                </Link>

                <Link
                  href={`/admin/topics/${topic.topic_id}/edit`}
                  className="rounded-lg border border-blue-500/40 px-3 py-2 text-sm text-blue-200 hover:bg-blue-500/10"
                >
                  주제 수정
                </Link>

                {toNumber(topic.pending_report_count) > 0 ? (
                  <Link
                    href="/admin/reports"
                    className="rounded-lg border border-red-500/40 px-3 py-2 text-sm text-red-200 hover:bg-red-500/10"
                  >
                    신고 확인
                  </Link>
                ) : null}
              </div>
            </article>
          ))
        ) : !error ? (
          <AdminStateCard
            title="표시할 주제 통계가 없습니다."
            description="주제가 생성되고 참여 또는 게시 활동이 집계되면 이곳에 통계가 표시됩니다."
          />
        ) : null}
      </section>
    </main>
  );
}
