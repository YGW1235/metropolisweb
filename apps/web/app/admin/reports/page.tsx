import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { moderateReport } from "@/app/actions/moderation";

async function requireAdmin() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role, status")
    .eq("id", user.id)
    .single();

  if (profile?.role !== "admin" || profile?.status !== "active") {
    redirect("/admin?message=관리자 권한이 필요합니다.");
  }

  return supabase;
}

function targetTypeLabel(targetType: string) {
  if (targetType === "post") return "게시글";
  if (targetType === "comment") return "댓글";
  return targetType;
}

function reasonLabel(reason: string) {
  if (reason === "abuse") return "욕설 / 비방";
  if (reason === "spam") return "도배 / 스팸";
  if (reason === "off_topic") return "주제와 무관함";
  if (reason === "role_break") return "배정 역할 위반";
  if (reason === "other") return "기타";
  return reason;
}

function statusLabel(status: string) {
  if (status === "pending") return "대기 중";
  if (status === "reviewing") return "검토 중";
  if (status === "resolved") return "처리 완료";
  if (status === "dismissed") return "기각";
  return status;
}

type AdminReportsPageProps = {
  searchParams: Promise<{
    message?: string;
  }>;
};

export default async function AdminReportsPage({
  searchParams,
}: AdminReportsPageProps) {
  const params = await searchParams;
  const supabase = await requireAdmin();

  const { data: reports, error } = await supabase
    .from("reports")
    .select(
      "id, reporter_id, topic_id, post_id, target_type, target_id, reason, detail, status, created_at",
    )
    .order("created_at", { ascending: false });

  return (
    <main className="min-h-screen bg-gray-950 px-6 py-16 text-white">
      <section className="mx-auto max-w-6xl">
        <a href="/admin" className="text-sm text-blue-400 hover:underline">
          ← 관리자 홈으로 돌아가기
        </a>

        <h1 className="mt-6 text-3xl font-bold">신고 관리</h1>
        <p className="mt-3 text-gray-300">
          유저가 접수한 게시글/댓글 신고를 확인합니다.
        </p>
        {params.message ? (
          <div className="mt-6 rounded-lg border border-red-500/40 bg-red-500/10 p-4 text-sm text-red-200">
            {params.message}
          </div>
        ) : null}

        {error ? (
          <div className="mt-6 rounded-lg border border-red-500/40 bg-red-500/10 p-4 text-sm text-red-200">
            신고 목록을 불러오지 못했습니다: {error.message}
          </div>
        ) : null}

        <div className="mt-8 space-y-4">
          {reports?.length ? (
            reports.map((report) => (
              <article
                key={report.id}
                className="rounded-lg border border-gray-700 bg-gray-900 p-6"
              >
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div>
                    <div className="flex flex-wrap gap-2">
                      <span className="rounded-full bg-gray-800 px-3 py-1 text-sm text-gray-300">
                        {statusLabel(report.status)}
                      </span>

                      <span className="rounded-full bg-red-500/10 px-3 py-1 text-sm text-red-200">
                        {targetTypeLabel(report.target_type)}
                      </span>

                      <span className="rounded-full bg-blue-500/10 px-3 py-1 text-sm text-blue-200">
                        {reasonLabel(report.reason)}
                      </span>
                    </div>

                    <p className="mt-4 text-sm text-gray-400">상세 내용</p>
                    <p className="mt-1 whitespace-pre-wrap text-gray-200">
                      {report.detail || "상세 내용 없음"}
                    </p>
                  </div>

                  <time className="text-sm text-gray-400">
                    {new Date(report.created_at).toLocaleString("ko-KR", {
                      timeZone: "Asia/Seoul",
                    })}
                  </time>
                </div>

                <div className="mt-5 grid gap-3 rounded-lg bg-gray-950 p-4 text-xs text-gray-400 sm:grid-cols-2">
                  <p className="break-all">신고자 ID: {report.reporter_id}</p>
                  <p className="break-all">대상 ID: {report.target_id}</p>
                  <p className="break-all">Topic ID: {report.topic_id}</p>
                  <p className="break-all">Post ID: {report.post_id}</p>
                </div>

                {report.post_id ? (
                  <a
                    href={`/topics/${report.topic_id}/debate#post-${report.post_id}`}
                    className="mt-5 inline-block rounded-lg border border-gray-600 px-4 py-2 text-sm font-medium text-gray-200 hover:bg-gray-800"
                  >
                    신고 대상 확인
                  </a>
                ) : null}

                <div className="mt-5 flex flex-wrap gap-3">
                  {report.status === "pending" ? (
                    <form action={moderateReport}>
                      <input type="hidden" name="report_id" value={report.id} />
                      <input type="hidden" name="topic_id" value={report.topic_id} />
                      <input type="hidden" name="action" value="reviewing" />

                      <button className="rounded-lg border border-yellow-500/50 px-4 py-2 text-sm font-medium text-yellow-200 hover:bg-yellow-500/10">
                        검토 중으로 변경
                      </button>
                    </form>
                  ) : null}

                  {report.status === "pending" || report.status === "reviewing" ? (
                    <>
                      <form action={moderateReport}>
                        <input type="hidden" name="report_id" value={report.id} />
                        <input type="hidden" name="topic_id" value={report.topic_id} />
                        <input type="hidden" name="action" value="hide_target" />

                        <button className="rounded-lg border border-red-500/50 px-4 py-2 text-sm font-medium text-red-200 hover:bg-red-500/10">
                          대상 숨김 처리
                        </button>
                      </form>

                      <form action={moderateReport}>
                        <input type="hidden" name="report_id" value={report.id} />
                        <input type="hidden" name="topic_id" value={report.topic_id} />
                        <input type="hidden" name="action" value="dismiss" />

                        <button className="rounded-lg border border-gray-500/50 px-4 py-2 text-sm font-medium text-gray-200 hover:bg-gray-800">
                          신고 기각
                        </button>
                      </form>
                    </>
                  ) : null}
                </div>


              </article>
            ))
          ) : (
            <div className="rounded-lg border border-gray-700 bg-gray-900 p-8 text-center text-gray-300">
              접수된 신고가 없습니다.
            </div>
          )}
        </div>
      </section>
    </main>
  );
}