import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";

import {
  closeTopicAndResolve,
  dismissReport,
  hideCommentAndResolve,
  hideOpinionAndResolve,
  resolveReport,
  unhideComment,
  unhideOpinion,
} from "@/app/admin/reports/actions";
import { createClient } from "@/lib/supabase/server";

import { SiteHeader } from "@/components/SiteHeader";

export const metadata: Metadata = {
  title: "신고 관리",
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

function getReasonLabel(reason: string) {
  if (reason === "abuse") return "욕설/비방";
  if (reason === "spam") return "스팸/도배";
  if (reason === "harassment") return "괴롭힘/공격적 표현";
  if (reason === "personal_info") return "개인정보 노출";
  if (reason === "off_topic") return "주제와 무관한 내용";
  if (reason === "other") return "기타";
  return reason;
}

function getStatusLabel(status: string) {
  if (status === "open") return "대기";
  if (status === "resolved") return "처리완료";
  if (status === "dismissed") return "기각";
  return status;
}

function getStatusClass(status: string) {
  if (status === "open") return "bg-red-50 text-red-700";
  if (status === "resolved") return "bg-green-50 text-green-700";
  if (status === "dismissed") return "bg-stone-100 text-stone-700";
  return "bg-stone-100 text-stone-700";
}

function formatDate(value: string | null) {
  if (!value) return "-";

  return new Intl.DateTimeFormat("ko-KR", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

export default async function AdminReportsPage({
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

  const { data: reports, error } = await supabase
    .from("casual_reports")
    .select(
      "id, reporter_id, target_type, target_id, reason, details, status, admin_note, created_at, resolved_at",
    )
    .order("status", { ascending: true })
    .order("created_at", { ascending: false });

  if (error) {
    return (
      <main className="min-h-screen bg-red-50 p-8 text-red-900">
        <h1 className="text-2xl font-black">신고 목록을 불러오지 못했습니다.</h1>
        <pre className="mt-4 whitespace-pre-wrap rounded-xl bg-white p-4 text-sm">
          {error.message}
        </pre>
      </main>
    );
  }

  const reportList = reports ?? [];

  const reporterIds = Array.from(
    new Set(reportList.map((report) => report.reporter_id).filter(Boolean)),
  ) as string[];

  const topicIds = reportList
    .filter((report) => report.target_type === "topic")
    .map((report) => report.target_id);

  const opinionIds = reportList
    .filter((report) => report.target_type === "opinion")
    .map((report) => report.target_id);

  const commentIds = reportList
    .filter((report) => report.target_type === "comment")
    .map((report) => report.target_id);

  const { data: reporterProfilesData } =
    reporterIds.length > 0
      ? await supabase
          .from("casual_profiles")
          .select("user_id, nickname")
          .in("user_id", reporterIds)
      : { data: [] };

  const { data: topicsData } =
    topicIds.length > 0
      ? await supabase
          .from("casual_topics")
          .select("id, title, description, status, is_today")
          .in("id", topicIds)
      : { data: [] };

  const { data: opinionsData } =
    opinionIds.length > 0
      ? await supabase
          .from("casual_opinions")
          .select("id, topic_id, user_id, body, choice, is_hidden")
          .in("id", opinionIds)
      : { data: [] };

  const { data: commentsData } =
    commentIds.length > 0
      ? await supabase
          .from("casual_comments")
          .select("id, opinion_id, user_id, body, is_hidden")
          .in("id", commentIds)
      : { data: [] };

  const reporterById = new Map(
    (reporterProfilesData ?? []).map((profile) => [profile.user_id, profile]),
  );

  const topicById = new Map((topicsData ?? []).map((topic) => [topic.id, topic]));

  const opinionById = new Map(
    (opinionsData ?? []).map((opinion) => [opinion.id, opinion]),
  );

  const commentById = new Map(
    (commentsData ?? []).map((comment) => [comment.id, comment]),
  );

  const openCount = reportList.filter((report) => report.status === "open").length;

  return (
    <main className="min-h-screen bg-[#fff7ed] text-[#2f2118]">
      <SiteHeader />
      <section className="mx-auto max-w-6xl">
        <section className="mt-8 rounded-3xl border border-orange-100 bg-white p-6 shadow-sm">
          <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="text-sm font-bold tracking-[0.3em] text-orange-700">
                ADMIN REPORTS
              </p>
              <h1 className="mt-2 text-3xl font-black">신고 관리</h1>
              <p className="mt-3 text-sm leading-6 text-stone-600">
                신고 접수 상태를 확인하고 필요한 운영 조치를 처리합니다.
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
                href="/admin/qa"
                className="rounded-full border border-orange-200 bg-orange-50 px-4 py-2 text-sm font-black text-orange-800 transition hover:bg-orange-100"
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
              <Link
                href="/admin/users"
                className="rounded-full border border-stone-200 px-4 py-2 text-sm font-bold text-stone-700 transition hover:bg-stone-50"
              >
                유저 관리
              </Link>
              <Link
                href="/admin/topics"
                className="rounded-full bg-stone-950 px-4 py-2 text-sm font-black text-white transition hover:-translate-y-0.5"
              >
                주제 관리
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
          {reportList.map((report) => {
            const reporter = report.reporter_id
              ? reporterById.get(report.reporter_id)
              : null;

            const topic =
              report.target_type === "topic"
                ? topicById.get(report.target_id)
                : null;

            const opinion =
              report.target_type === "opinion"
                ? opinionById.get(report.target_id)
                : null;

            const comment =
              report.target_type === "comment"
                ? commentById.get(report.target_id)
                : null;

            const targetTitle =
              topic?.title ??
              (opinion ? "신고된 의견" : null) ??
              (comment ? "신고된 댓글" : null) ??
              "대상을 찾을 수 없음";

            const targetBody =
              topic?.description ?? opinion?.body ?? comment?.body ?? "";

            const targetTopicId = topic?.id ?? opinion?.topic_id ?? null;

            return (
              <article
                key={report.id}
                className="rounded-3xl border border-orange-100 bg-white p-5 shadow-sm"
              >
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span
                        className={`rounded-full px-3 py-1 text-xs font-black ${getStatusClass(
                          report.status,
                        )}`}
                      >
                        {getStatusLabel(report.status)}
                      </span>

                      <span className="rounded-full bg-orange-100 px-3 py-1 text-xs font-black text-orange-800">
                        {getReasonLabel(report.reason)}
                      </span>

                      <span className="rounded-full bg-stone-100 px-3 py-1 text-xs font-black text-stone-600">
                        {report.target_type}
                      </span>

                      {opinion?.is_hidden && (
                        <span className="rounded-full bg-red-50 px-3 py-1 text-xs font-black text-red-700">
                          의견 숨김됨
                        </span>
                      )}

                      {comment?.is_hidden && (
                        <span className="rounded-full bg-red-50 px-3 py-1 text-xs font-black text-red-700">
                          댓글 숨김됨
                        </span>
                      )}
                    </div>

                    <h2 className="mt-3 text-xl font-black">{targetTitle}</h2>

                    {targetBody && (
                      <p className="mt-3 whitespace-pre-wrap rounded-2xl bg-stone-50 p-4 text-sm leading-6 text-stone-700">
                        {targetBody}
                      </p>
                    )}

                    {report.details && (
                      <div className="mt-3 rounded-2xl bg-red-50 p-4">
                        <p className="text-xs font-black text-red-700">
                          신고 상세
                        </p>
                        <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-red-900">
                          {report.details}
                        </p>
                      </div>
                    )}

                    {report.admin_note && (
                      <div className="mt-3 rounded-2xl bg-green-50 p-4">
                        <p className="text-xs font-black text-green-700">
                          관리자 메모
                        </p>
                        <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-green-900">
                          {report.admin_note}
                        </p>
                      </div>
                    )}

                    <div className="mt-4 flex flex-wrap gap-2 text-xs font-bold text-stone-500">
                      <span>신고자 {reporter?.nickname ?? "알 수 없음"}</span>
                      <span>·</span>
                      <span>접수 {formatDate(report.created_at)}</span>
                      {report.resolved_at && (
                        <>
                          <span>·</span>
                          <span>처리 {formatDate(report.resolved_at)}</span>
                        </>
                      )}
                    </div>
                  </div>

                  <div className="flex min-w-[220px] flex-col gap-2">
                    {targetTopicId && (
                      <Link
                        href={`/topics/${targetTopicId}`}
                        className="rounded-full border border-stone-200 px-4 py-2 text-center text-sm font-bold text-stone-700 transition hover:bg-stone-50"
                      >
                        사용자 화면 보기
                      </Link>
                    )}

                    {report.status === "open" && (
                      <>
                        <form action={resolveReport} className="space-y-2">
                          <input type="hidden" name="reportId" value={report.id} />
                          <input
                            name="adminNote"
                            className="w-full rounded-2xl border border-stone-200 px-3 py-2 text-sm outline-none focus:border-orange-400"
                            placeholder="관리자 메모"
                          />
                          <button className="w-full rounded-full bg-green-600 px-4 py-2 text-sm font-black text-white transition hover:-translate-y-0.5">
                            처리완료
                          </button>
                        </form>

                        <form action={dismissReport}>
                          <input type="hidden" name="reportId" value={report.id} />
                          <button className="w-full rounded-full bg-stone-100 px-4 py-2 text-sm font-black text-stone-700 transition hover:bg-stone-200">
                            기각
                          </button>
                        </form>

                        {report.target_type === "opinion" && opinion && (
                          <form action={hideOpinionAndResolve}>
                            <input
                              type="hidden"
                              name="reportId"
                              value={report.id}
                            />
                            <input
                              type="hidden"
                              name="targetId"
                              value={report.target_id}
                            />
                            <button className="w-full rounded-full bg-red-600 px-4 py-2 text-sm font-black text-white transition hover:-translate-y-0.5">
                              의견 숨김 + 처리완료
                            </button>
                          </form>
                        )}

                        {report.target_type === "comment" && comment && (
                          <form action={hideCommentAndResolve}>
                            <input
                              type="hidden"
                              name="reportId"
                              value={report.id}
                            />
                            <input
                              type="hidden"
                              name="targetId"
                              value={report.target_id}
                            />
                            <button className="w-full rounded-full bg-red-600 px-4 py-2 text-sm font-black text-white transition hover:-translate-y-0.5">
                              댓글 숨김 + 처리완료
                            </button>
                          </form>
                        )}

                        {report.target_type === "topic" && topic && (
                          <form action={closeTopicAndResolve}>
                            <input
                              type="hidden"
                              name="reportId"
                              value={report.id}
                            />
                            <input
                              type="hidden"
                              name="targetId"
                              value={report.target_id}
                            />
                            <button className="w-full rounded-full bg-red-600 px-4 py-2 text-sm font-black text-white transition hover:-translate-y-0.5">
                              주제 종료 + 처리완료
                            </button>
                          </form>
                        )}
                      </>
                    )}

                    {report.target_type === "opinion" && opinion?.is_hidden && (
                      <form action={unhideOpinion}>
                        <input
                          type="hidden"
                          name="targetId"
                          value={report.target_id}
                        />
                        <button className="w-full rounded-full border border-stone-200 px-4 py-2 text-sm font-black text-stone-700 transition hover:bg-stone-50">
                          의견 숨김 해제
                        </button>
                      </form>
                    )}

                    {report.target_type === "comment" && comment?.is_hidden && (
                      <form action={unhideComment}>
                        <input
                          type="hidden"
                          name="targetId"
                          value={report.target_id}
                        />
                        <button className="w-full rounded-full border border-stone-200 px-4 py-2 text-sm font-black text-stone-700 transition hover:bg-stone-50">
                          댓글 숨김 해제
                        </button>
                      </form>
                    )}
                  </div>
                </div>
              </article>
            );
          })}

          {reportList.length === 0 && (
            <div className="rounded-3xl border border-orange-100 bg-white p-8 text-center">
              <h2 className="text-xl font-black">아직 신고가 없습니다.</h2>
              <p className="mt-2 text-sm text-stone-600">
                사용자가 주제나 의견을 신고하면 이곳에 표시됩니다.
              </p>
            </div>
          )}
        </section>
      </section>
    </main>
  );
}
