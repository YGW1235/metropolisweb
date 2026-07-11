import Link from "next/link";

import { setUserStatus } from "@/app/actions/user-moderation";
import { AdminStateCard } from "@/components/admin-state-card";
import { ConfirmSubmitButton } from "@/components/confirm-submit-button";
import { requireAdmin } from "@/lib/auth";

type SearchParams = Promise<{
  message?: string;
  type?: string;
}>;

function statusLabel(status: string) {
  if (status === "active") return "활성";
  if (status === "suspended") return "정지";
  if (status === "deleted") return "삭제";
  return status;
}

function roleLabel(role: string) {
  if (role === "admin") return "관리자";
  if (role === "moderator") return "모더레이터";
  return "일반 유저";
}

function formatDate(value: string | null) {
  if (!value) return "-";

  return new Date(value).toLocaleString("ko-KR", {
    timeZone: "Asia/Seoul",
  });
}

export default async function AdminUsersPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const params = await searchParams;
  const { supabase, user } = await requireAdmin();

  const { data: users, error: usersError } = await supabase
    .from("profiles")
    .select(
      "id, email, display_name, role, status, status_reason, status_changed_by, status_changed_at, created_at",
    )
    .order("created_at", { ascending: false });

  const { data: recentLogs } = await supabase
    .from("user_moderation_logs")
    .select(
      "id, target_user_id, moderator_id, action, previous_status, new_status, reason, created_at",
    )
    .order("created_at", { ascending: false })
    .limit(10);

  return (
    <main className="mx-auto min-h-screen max-w-6xl px-4 py-10 text-gray-100 sm:px-6 sm:py-14">
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-semibold text-blue-300">Admin</p>
          <h1 className="mt-2 text-3xl font-bold">유저 관리</h1>
          <p className="mt-2 text-sm text-gray-400">
            유저 상태를 확인하고, 반복 위반 유저를 정지하거나 복구합니다.
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
          tone="warning"
          title="유저 상태 변경 안내"
          description="정지된 유저는 글 작성, 댓글 작성, 토론 참여가 제한될 수 있습니다. 정지 또는 복구 사유는 내부 운영 기록으로 남겨주세요."
        />
      </div>

      {params.message ? (
        <div
          className={
            params.type === "error"
              ? "mb-6 rounded-lg border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-100"
              : "mb-6 rounded-lg border border-emerald-500/30 bg-emerald-500/10 p-4 text-sm text-emerald-100"
          }
        >
          {params.message}
        </div>
      ) : null}

      {usersError ? (
        <AdminStateCard
          tone="danger"
          title="데이터를 불러오지 못했습니다."
          description={`잠시 후 다시 시도해주세요. 유저 목록 오류: ${usersError.message}`}
        />
      ) : null}

      <section className="grid gap-4">
        {!usersError && (users ?? []).length > 0 ? (
          (users ?? []).map((profile) => {
          const isMe = profile.id === user.id;
          const isAdmin = profile.role === "admin";
          const canSuspend = !isMe && !isAdmin && profile.status !== "suspended";
          const canReinstate = !isMe && profile.status === "suspended";

          return (
            <article
              key={profile.id}
              className="rounded-2xl border border-gray-800 bg-gray-950/70 p-5 shadow-sm"
            >
              <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="text-lg font-semibold">
                      {profile.display_name ?? "이름 없음"}
                    </h2>

                    <span className="rounded-full bg-gray-800 px-2.5 py-1 text-xs text-gray-300">
                      {roleLabel(profile.role)}
                    </span>

                    <span
                      className={
                        profile.status === "suspended"
                          ? "rounded-full bg-red-500/20 px-2.5 py-1 text-xs text-red-200"
                          : "rounded-full bg-emerald-500/20 px-2.5 py-1 text-xs text-emerald-200"
                      }
                    >
                      {statusLabel(profile.status)}
                    </span>

                    {isMe ? (
                      <span className="rounded-full bg-blue-500/20 px-2.5 py-1 text-xs text-blue-200">
                        현재 계정
                      </span>
                    ) : null}
                  </div>

                  <p className="mt-2 break-all text-sm text-gray-400">
                    {profile.email ?? "이메일 없음"}
                  </p>

                  <p className="mt-1 break-all text-xs text-gray-500">
                    User ID: {profile.id}
                  </p>

                  <div className="mt-4 grid gap-2 text-sm text-gray-400 sm:grid-cols-2">
                    <p>가입일: {formatDate(profile.created_at)}</p>
                    <p>상태 변경일: {formatDate(profile.status_changed_at)}</p>
                    <p className="break-all">
                      상태 변경자: {profile.status_changed_by ?? "-"}
                    </p>
                    <p>상태 사유: {profile.status_reason ?? "-"}</p>
                  </div>
                </div>

                <div className="grid gap-3 lg:w-80">
                  {canSuspend ? (
                    <form
                      action={setUserStatus}
                      className="rounded-xl border border-red-500/20 bg-red-500/10 p-3"
                    >
                      <input type="hidden" name="user_id" value={profile.id} />
                      <input type="hidden" name="status" value="suspended" />

                      <textarea
                        name="reason"
                        rows={2}
                        placeholder="정지 사유를 입력하세요."
                        className="mb-2 w-full rounded-lg border border-gray-700 bg-gray-950 px-3 py-2 text-sm text-gray-100 placeholder:text-gray-500"
                      />

                      <ConfirmSubmitButton
                        confirmMessage="이 유저를 정지하시겠습니까? 정지된 유저는 참여와 작성이 제한될 수 있으며, 이 작업은 운영 로그에 기록될 수 있습니다."
                        ariaLabel={`${profile.email ?? profile.display_name ?? "선택한 유저"} 정지 확인`}
                        className="w-full rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-500"
                      >
                        유저 정지
                      </ConfirmSubmitButton>
                    </form>
                  ) : null}

                  {canReinstate ? (
                    <form
                      action={setUserStatus}
                      className="rounded-xl border border-emerald-500/20 bg-emerald-500/10 p-3"
                    >
                      <input type="hidden" name="user_id" value={profile.id} />
                      <input type="hidden" name="status" value="active" />

                      <textarea
                        name="reason"
                        rows={2}
                        placeholder="복구 사유를 입력하세요."
                        className="mb-2 w-full rounded-lg border border-gray-700 bg-gray-950 px-3 py-2 text-sm text-gray-100 placeholder:text-gray-500"
                      />

                      <ConfirmSubmitButton
                        confirmMessage="이 유저의 이용 제한을 해제하시겠습니까? 복구 후 참여와 작성 권한이 다시 허용될 수 있습니다."
                        ariaLabel={`${profile.email ?? profile.display_name ?? "선택한 유저"} 복구 확인`}
                        className="w-full rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-500"
                      >
                        유저 복구
                      </ConfirmSubmitButton>
                    </form>
                  ) : null}

                  {!canSuspend && !canReinstate ? (
                    <div className="rounded-xl border border-gray-800 bg-gray-900 p-3 text-sm text-gray-400">
                      이 계정은 이 화면에서 상태를 변경할 수 없습니다.
                    </div>
                  ) : null}
                </div>
              </div>
            </article>
          );
          })
        ) : !usersError ? (
          <AdminStateCard
            title="표시할 유저가 없습니다."
            description="가입된 유저가 있으면 이곳에서 상태와 최근 제재 정보를 확인할 수 있습니다."
          />
        ) : null}
      </section>

      <section className="mt-10 rounded-2xl border border-gray-800 bg-gray-950/70 p-5">
        <h2 className="text-xl font-semibold">최근 유저 제재 이력</h2>

        <div className="mt-4 grid gap-3">
          {(recentLogs ?? []).length > 0 ? (
            (recentLogs ?? []).map((log) => (
              <div
                key={log.id}
                className="rounded-xl border border-gray-800 bg-gray-900 p-4 text-sm text-gray-300"
              >
                <div className="flex flex-wrap gap-2">
                  <span className="rounded-full bg-gray-800 px-2.5 py-1 text-xs">
                    {log.action === "suspend" ? "정지" : "복구"}
                  </span>
                  <span className="rounded-full bg-gray-800 px-2.5 py-1 text-xs">
                    {log.previous_status ?? "-"} → {log.new_status}
                  </span>
                </div>

                <p className="mt-3 break-all text-xs text-gray-500">
                  대상 유저: {log.target_user_id}
                </p>
                <p className="mt-1 break-all text-xs text-gray-500">
                  처리자: {log.moderator_id ?? "-"}
                </p>
                <p className="mt-1 text-xs text-gray-500">
                  처리 시간: {formatDate(log.created_at)}
                </p>

                {log.reason ? (
                  <p className="mt-2 whitespace-pre-wrap text-gray-300">
                    사유: {log.reason}
                  </p>
                ) : null}
              </div>
            ))
          ) : (
            <AdminStateCard
              title="아직 기록된 유저 제재 이력이 없습니다."
              description="유저 정지 또는 복구 작업이 실행되면 최근 이력이 이곳에 표시됩니다."
            />
          )}
        </div>
      </section>
    </main>
  );
}
