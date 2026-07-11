import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { moderateReport } from "@/app/actions/moderation";

import { setReportTargetAuthorStatus } from "@/app/actions/user-moderation";
import { ConfirmSubmitButton } from "@/components/confirm-submit-button";

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
      "id, reporter_id, topic_id, post_id, target_type, target_id, reason, detail, status, created_at, moderation_note, moderated_by, moderated_at",
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
                {report.moderated_at || report.moderation_note || report.moderated_by ? (
                  <div className="mt-4 rounded-lg border border-blue-500/20 bg-blue-500/10 p-4 text-sm text-blue-100">
                    <p className="font-semibold">처리 이력</p>

                    {report.moderation_note ? (
                      <p className="mt-2 whitespace-pre-wrap">
                        메모: {report.moderation_note}
                      </p>
                    ) : null}

                    {report.moderated_by ? (
                      <p className="mt-2 break-all text-blue-200/80">
                        처리자 ID: {report.moderated_by}
                      </p>
                    ) : null}

                    {report.moderated_at ? (
                      <p className="mt-1 text-blue-200/80">
                        처리 시간:{" "}
                        {new Date(report.moderated_at).toLocaleString("ko-KR", {
                          timeZone: "Asia/Seoul",
                        })}
                      </p>
                    ) : null}
                  </div>
                ) : null}

                {report.post_id ? (
                  <a
                    href={`/topics/${report.topic_id}/debate#post-${report.post_id}`}
                    className="mt-5 inline-block rounded-lg border border-gray-600 px-4 py-2 text-sm font-medium text-gray-200 hover:bg-gray-800"
                  >
                    신고 대상 확인
                  </a>
                ) : null}

                <div className="mt-5 grid gap-3 md:grid-cols-3">
                  {report.status === "pending" ? (
                    <form action={moderateReport} className="rounded-lg border border-gray-800 bg-gray-950 p-3">
                      <input type="hidden" name="report_id" value={report.id} />
                      <input type="hidden" name="topic_id" value={report.topic_id} />
                      <input type="hidden" name="action" value="reviewing" />

                      <textarea
                        name="note"
                        rows={2}
                        placeholder="처리 메모를 입력하세요. 선택 사항입니다."
                        className="mb-2 w-full rounded-lg border border-gray-700 bg-gray-950 px-3 py-2 text-sm text-gray-100 placeholder:text-gray-500"
                      />

                      <ConfirmSubmitButton
                        confirmMessage="이 신고 상태를 검토 중으로 변경할까요? 이 작업은 운영 로그에 기록될 수 있습니다."
                        ariaLabel="신고 상태를 검토 중으로 변경 확인"
                        className="rounded-lg border border-yellow-500/50 px-4 py-2 text-sm font-medium text-yellow-200 hover:bg-yellow-500/10"
                      >
                        검토 중으로 변경
                      </ConfirmSubmitButton>
                    </form>
                  ) : null}

                  {report.status === "pending" || report.status === "reviewing" ? (
                    <>
                      <form action={moderateReport} className="rounded-lg border border-gray-800 bg-gray-950 p-3">
                        <input type="hidden" name="report_id" value={report.id} />
                        <input type="hidden" name="topic_id" value={report.topic_id} />
                        <input type="hidden" name="action" value="hide_target" />

                        <ConfirmSubmitButton
                          confirmMessage="정말 이 신고 대상을 숨김 처리할까요? 숨김 처리된 게시글 또는 댓글은 공개 화면에 보이지 않을 수 있습니다."
                          ariaLabel="신고 대상 숨김 처리 확인"
                          className="rounded-lg border border-red-500/50 px-4 py-2 text-sm font-medium text-red-200 hover:bg-red-500/10"
                        >
                          대상 숨김 처리
                        </ConfirmSubmitButton>
                      </form>

                      <form action={moderateReport} className="rounded-lg border border-gray-800 bg-gray-950 p-3">
                        <input type="hidden" name="report_id" value={report.id} />
                        <input type="hidden" name="topic_id" value={report.topic_id} />
                        <input type="hidden" name="action" value="dismiss" />

                        <ConfirmSubmitButton
                          confirmMessage="이 신고를 기각하시겠습니까? 기각 처리 후에는 신고 목록의 상태가 변경됩니다."
                          ariaLabel="신고 기각 확인"
                          className="rounded-lg border border-gray-500/50 px-4 py-2 text-sm font-medium text-gray-200 hover:bg-gray-800"
                        >
                          신고 기각
                        </ConfirmSubmitButton>
                      </form>
                      <div className="mt-5 rounded-xl border border-red-500/20 bg-red-500/10 p-4">
                        <p className="text-sm font-semibold text-red-100">작성자 제재</p>
                        <p className="mt-1 text-xs text-red-100/70">
                          신고 대상 게시글/댓글의 작성자를 정지하거나 복구합니다. 관리자 계정은 정지할 수 없습니다.
                        </p>

                        <div className="mt-4 grid gap-3 md:grid-cols-2">
                          <form
                            action={setReportTargetAuthorStatus}
                            className="rounded-lg border border-red-500/20 bg-gray-950 p-3"
                          >
                            <input type="hidden" name="report_id" value={report.id} />
                            <input type="hidden" name="status" value="suspended" />

                            <textarea
                              name="reason"
                              rows={2}
                              placeholder="정지 사유를 입력하세요. 예: 반복적인 욕설/도배"
                              className="mb-2 w-full rounded-lg border border-gray-700 bg-gray-950 px-3 py-2 text-sm text-gray-100 placeholder:text-gray-500"
                            />

                            <ConfirmSubmitButton
                              confirmMessage="이 신고 대상 작성자를 정지하시겠습니까? 정지된 유저는 참여와 작성이 제한될 수 있으며, 이 작업은 운영 로그에 기록될 수 있습니다."
                              ariaLabel="신고 대상 작성자 정지 확인"
                              className="w-full rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-500"
                            >
                              대상 작성자 정지
                            </ConfirmSubmitButton>
                          </form>

                          <form
                            action={setReportTargetAuthorStatus}
                            className="rounded-lg border border-emerald-500/20 bg-gray-950 p-3"
                          >
                            <input type="hidden" name="report_id" value={report.id} />
                            <input type="hidden" name="status" value="active" />

                            <textarea
                              name="reason"
                              rows={2}
                              placeholder="복구 사유를 입력하세요. 예: 오처리로 인한 복구"
                              className="mb-2 w-full rounded-lg border border-gray-700 bg-gray-950 px-3 py-2 text-sm text-gray-100 placeholder:text-gray-500"
                            />

                            <ConfirmSubmitButton
                              confirmMessage="이 신고 대상 작성자의 이용 제한을 해제하시겠습니까? 복구 후 참여와 작성 권한이 다시 허용될 수 있습니다."
                              ariaLabel="신고 대상 작성자 복구 확인"
                              className="w-full rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-500"
                            >
                              대상 작성자 복구
                            </ConfirmSubmitButton>
                          </form>
                        </div>
                      </div>
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
