import Link from "next/link";

import { updateContactInquiry } from "@/app/actions/contact";
import { AdminStateCard } from "@/components/admin-state-card";
import { ConfirmSubmitButton } from "@/components/confirm-submit-button";
import { requireAdmin } from "@/lib/auth";

type SearchParams = Promise<{
  message?: string;
  type?: string;
}>;

function categoryLabel(category: string) {
  const labels: Record<string, string> = {
    general: "일반",
    account: "계정",
    report: "신고/운영",
    bug: "버그",
    partnership: "제휴/협업",
    other: "기타",
  };

  return labels[category] ?? category;
}

function statusLabel(status: string) {
  const labels: Record<string, string> = {
    new: "신규",
    reviewing: "검토 중",
    resolved: "해결",
    dismissed: "종료",
  };

  return labels[status] ?? status;
}

function formatDate(value: string | null) {
  if (!value) return "-";

  return new Date(value).toLocaleString("ko-KR", {
    timeZone: "Asia/Seoul",
  });
}

export default async function AdminInquiriesPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const params = await searchParams;
  const { supabase } = await requireAdmin();

  const { data: inquiries, error } = await supabase
    .from("contact_inquiries")
    .select(
      "id, user_id, email, category, title, content, status, admin_note, handled_by, handled_at, created_at",
    )
    .order("created_at", { ascending: false })
    .limit(100);

  return (
    <main className="mx-auto min-h-screen max-w-6xl px-4 py-10 text-gray-100 sm:px-6 sm:py-14">
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-semibold text-blue-300">Admin</p>
          <h1 className="mt-2 text-3xl font-bold">문의 관리</h1>
          <p className="mt-2 text-sm text-gray-400">
            유저와 방문자가 남긴 문의를 확인하고 처리합니다.
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
          title="문의 처리 안내"
          description="관리자 메모에는 내부 운영용 내용을 적어주세요. 사용자에게 직접 발송되는 답변이 아니라 처리 상태와 후속 조치 기록으로 사용됩니다."
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

      {error ? (
        <AdminStateCard
          tone="danger"
          title="데이터를 불러오지 못했습니다."
          description="문의 목록을 불러오지 못했습니다. 잠시 후 다시 시도해주세요."
        />
      ) : null}

      <section className="grid gap-4">
        {!error ? (inquiries ?? []).map((inquiry) => (
          <article
            key={inquiry.id}
            className="rounded-2xl border border-gray-800 bg-gray-950/70 p-5"
          >
            <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
              <div className="min-w-0">
                <div className="flex flex-wrap gap-2">
                  <span className="rounded-full bg-blue-500/20 px-2.5 py-1 text-xs text-blue-200">
                    {categoryLabel(inquiry.category)}
                  </span>
                  <span className="rounded-full bg-gray-800 px-2.5 py-1 text-xs text-gray-300">
                    {statusLabel(inquiry.status)}
                  </span>
                </div>

                <h2 className="mt-3 text-xl font-semibold">{inquiry.title}</h2>

                <p className="mt-2 break-all text-sm text-gray-400">
                  답변 이메일: {inquiry.email}
                </p>

                <p className="mt-1 text-xs text-gray-500">
                  접수일: {formatDate(inquiry.created_at)}
                </p>

                {inquiry.user_id ? (
                  <p className="mt-1 break-all text-xs text-gray-500">
                    User ID: {inquiry.user_id}
                  </p>
                ) : null}

                <div className="mt-4 whitespace-pre-wrap rounded-xl border border-gray-800 bg-gray-900 p-4 text-sm text-gray-200">
                  {inquiry.content}
                </div>

                {inquiry.admin_note ? (
                  <div className="mt-4 rounded-xl border border-blue-500/20 bg-blue-500/10 p-4 text-sm text-blue-100">
                    <p className="font-semibold">관리자 메모</p>
                    <p className="mt-2 whitespace-pre-wrap">
                      {inquiry.admin_note}
                    </p>
                    <p className="mt-2 text-xs text-blue-100/70">
                      처리 시간: {formatDate(inquiry.handled_at)}
                    </p>
                  </div>
                ) : null}
              </div>

              <form
                action={updateContactInquiry}
                className="grid gap-3 rounded-xl border border-gray-800 bg-gray-900 p-4 lg:w-80"
              >
                <input type="hidden" name="inquiry_id" value={inquiry.id} />

                <label className="grid gap-1 text-sm">
                  <span className="text-gray-400">상태</span>
                  <select
                    name="status"
                    defaultValue={inquiry.status}
                    className="rounded-lg border border-gray-700 bg-gray-950 px-3 py-2 text-gray-100"
                  >
                    <option value="new">신규</option>
                    <option value="reviewing">검토 중</option>
                    <option value="resolved">해결</option>
                    <option value="dismissed">종료</option>
                  </select>
                </label>

                <label className="grid gap-1 text-sm">
                  <span className="text-gray-400">관리자 메모</span>
                  <textarea
                    name="admin_note"
                    rows={5}
                    defaultValue={inquiry.admin_note ?? ""}
                    className="rounded-lg border border-gray-700 bg-gray-950 px-3 py-2 text-gray-100"
                  />
                </label>

                <ConfirmSubmitButton
                  confirmMessage="문의 상태와 관리자 메모를 저장하시겠습니까? 해결 또는 종료 상태로 바꾸면 처리 완료로 기록됩니다."
                  ariaLabel={`${inquiry.title} 문의 상태 저장 확인`}
                  className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-500"
                >
                  문의 상태 저장
                </ConfirmSubmitButton>
              </form>
            </div>
          </article>
        )) : null}

        {!error && (inquiries ?? []).length === 0 ? (
          <AdminStateCard
            title="접수된 문의가 없습니다."
            description="문의하기 화면에서 접수된 내용이 있으면 이곳에 표시됩니다."
          />
        ) : null}
      </section>
    </main>
  );
}
