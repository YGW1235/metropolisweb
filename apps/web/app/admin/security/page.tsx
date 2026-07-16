import Link from "next/link";

import { AdminStateCard } from "@/components/admin-state-card";
import { requireAdmin } from "@/lib/auth";

type AdminSecurityStatus = {
  total_admin_count: number | string | null;
  active_admin_count: number | string | null;
  suspended_admin_count: number | string | null;
  deleted_admin_count: number | string | null;
  unverified_admin_count: number | string | null;
  current_admin_id: string | null;
  current_admin_email: string | null;
  current_admin_profile_status: string | null;
  current_admin_email_confirmed_at: string | null;
  has_active_admin: boolean | null;
  has_backup_admin: boolean | null;
  has_unverified_admin: boolean | null;
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

function CheckCard({
  title,
  description,
  ok,
  warning,
}: {
  title: string;
  description: string;
  ok: boolean;
  warning?: boolean;
}) {
  const colorClass = ok
    ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-100"
    : warning
      ? "border-yellow-500/30 bg-yellow-500/10 text-yellow-100"
      : "border-red-500/30 bg-red-500/10 text-red-100";

  const label = ok ? "정상" : warning ? "주의" : "확인 필요";

  return (
    <article className={`rounded-2xl border p-5 ${colorClass}`}>
      <div className="flex items-center justify-between gap-4">
        <h2 className="font-semibold">{title}</h2>
        <span className="rounded-full bg-black/20 px-2.5 py-1 text-xs">
          {label}
        </span>
      </div>
      <p className="mt-3 text-sm leading-6 opacity-80">{description}</p>
    </article>
  );
}

export default async function AdminSecurityPage() {
  const { supabase } = await requireAdmin();

  const { data, error } = await supabase.rpc("get_admin_security_status");

  const status = Array.isArray(data)
    ? ((data[0] ?? null) as AdminSecurityStatus | null)
    : ((data ?? null) as AdminSecurityStatus | null);

  const activeAdminCount = toNumber(status?.active_admin_count);
  const totalAdminCount = toNumber(status?.total_admin_count);
  const unverifiedAdminCount = toNumber(status?.unverified_admin_count);
  const suspendedAdminCount = toNumber(status?.suspended_admin_count);
  const deletedAdminCount = toNumber(status?.deleted_admin_count);

  return (
    <main className="mx-auto min-h-screen max-w-6xl px-4 py-10 text-gray-100 sm:px-6 sm:py-14">
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-semibold text-blue-300">Admin Security</p>
          <h1 className="mt-2 text-3xl font-bold">관리자 계정 보호 점검</h1>
          <p className="mt-2 text-sm text-gray-400">
            운영 계정의 활성 상태, 이메일 인증 여부, 예비 관리자 계정 여부를
            확인합니다.
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
          title="보안 점검 안내"
          description="관리자 계정 상태와 이메일 인증 여부는 배포 전후로 확인하는 것을 권장합니다. 관리자 role 변경은 공개 UI가 아니라 운영 절차에 따라 신중히 처리하세요."
        />
      </div>

      {error ? (
        <div className="mb-6">
            <AdminStateCard
              tone="danger"
              title="데이터를 불러오지 못했습니다."
              description="관리자 보안 상태를 불러오지 못했습니다. 잠시 후 다시 시도해주세요."
            />
        </div>
      ) : null}

      {!error && !status ? (
        <AdminStateCard
          title="관리자 보안 상태 데이터가 없습니다."
          description="보안 점검 RPC 결과가 비어 있습니다. Supabase 함수와 관리자 권한 설정을 확인한 뒤 다시 시도해주세요."
        />
      ) : status ? (
        <>
          <section className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div className="rounded-2xl border border-gray-800 bg-gray-950/70 p-5">
              <p className="text-sm text-gray-400">전체 관리자</p>
              <p className="mt-2 text-2xl font-bold">{totalAdminCount}</p>
            </div>

            <div className="rounded-2xl border border-gray-800 bg-gray-950/70 p-5">
              <p className="text-sm text-gray-400">활성 관리자</p>
              <p className="mt-2 text-2xl font-bold">{activeAdminCount}</p>
            </div>

            <div className="rounded-2xl border border-gray-800 bg-gray-950/70 p-5">
              <p className="text-sm text-gray-400">이메일 미인증 관리자</p>
              <p className="mt-2 text-2xl font-bold">{unverifiedAdminCount}</p>
            </div>

            <div className="rounded-2xl border border-gray-800 bg-gray-950/70 p-5">
              <p className="text-sm text-gray-400">정지/탈퇴 관리자</p>
              <p className="mt-2 text-2xl font-bold">
                {suspendedAdminCount + deletedAdminCount}
              </p>
            </div>
          </section>

          <section className="mb-8 grid gap-4 lg:grid-cols-2">
            <CheckCard
              title="활성 관리자 계정"
              description="서비스를 관리할 수 있는 active 상태의 관리자 계정이 최소 1개 이상 있어야 합니다."
              ok={activeAdminCount >= 1}
            />

            <CheckCard
              title="예비 관리자 계정"
              description="운영 계정 분실이나 이메일 접근 불가 상황에 대비해 active 상태의 관리자 계정이 2개 이상이면 더 안전합니다."
              ok={activeAdminCount >= 2}
              warning
            />

            <CheckCard
              title="관리자 이메일 인증"
              description="active 상태의 관리자 계정은 모두 이메일 인증이 완료되어 있어야 합니다."
              ok={unverifiedAdminCount === 0}
            />

            <CheckCard
              title="현재 관리자 계정 상태"
              description={`현재 계정 상태: ${
                status.current_admin_profile_status ?? "-"
              } / 이메일 인증: ${formatDate(
                status.current_admin_email_confirmed_at,
              )}`}
              ok={
                status.current_admin_profile_status === "active" &&
                Boolean(status.current_admin_email_confirmed_at)
              }
            />
          </section>

          <section className="rounded-2xl border border-gray-800 bg-gray-950/70 p-5">
            <h2 className="text-lg font-semibold">현재 관리자 계정</h2>

            <div className="mt-4 grid gap-2 text-sm text-gray-400">
              <p className="break-all">
                ID: {status.current_admin_id ?? "-"}
              </p>
              <p className="break-all">
                이메일: {status.current_admin_email ?? "-"}
              </p>
              <p>상태: {status.current_admin_profile_status ?? "-"}</p>
              <p>
                이메일 인증일:{" "}
                {formatDate(status.current_admin_email_confirmed_at)}
              </p>
            </div>
          </section>

          <section className="mt-6">
            <AdminStateCard
              tone="default"
              title="운영 원칙"
              description="관리자 승격 기능은 공개 UI로 만들지 않는 것을 권장합니다. 관리자 role 변경은 Supabase SQL Editor에서 직접 처리하고, 관리자 계정은 탈퇴/정지 대상에서 제외하는 현재 정책을 유지하세요. 관리자 활동 로그도 주기적으로 확인하세요."
            />
          </section>
        </>
      ) : null}
    </main>
  );
}
