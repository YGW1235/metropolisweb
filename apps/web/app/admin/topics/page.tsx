import Link from "next/link";
import { redirect } from "next/navigation";

import { deleteTopic } from "@/app/actions/admin-topics";
import { updateTopicStatus } from "@/app/actions/topics";
import { ConfirmSubmitButton } from "@/components/confirm-submit-button";
import { createClient } from "@/lib/supabase/server";

type AdminTopicsPageProps = {
  searchParams: Promise<{
    message?: string;
    type?: string;
  }>;
};

type TopicStatus = "draft" | "open" | "active" | "closed" | "archived";

type Topic = {
  id: string;
  title: string;
  description: string | null;
  status: TopicStatus;
  starts_at: string | null;
  ends_at: string | null;
  created_at: string;
};

async function getAdminClient() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect(
      `/login?message=${encodeURIComponent(
        "관리자 기능은 로그인 후 이용할 수 있습니다.",
      )}&redirectTo=${encodeURIComponent("/admin/topics")}`,
    );
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role, status")
    .eq("id", user.id)
    .maybeSingle();

  if (profile?.role !== "admin" || profile?.status !== "active") {
    redirect(
      `/?message=${encodeURIComponent(
        "관리자만 이용할 수 있는 기능입니다.",
      )}&type=error`,
    );
  }

  return supabase;
}

function formatDateTime(value: string | null) {
  if (!value) return "기록 없음";

  return new Intl.DateTimeFormat("ko-KR", {
    timeZone: "Asia/Seoul",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

function getStatusLabel(status: TopicStatus) {
  if (status === "draft") return "임시저장";
  if (status === "open") return "참가 가능";
  if (status === "active") return "토론 진행 중";
  if (status === "closed") return "종료";
  if (status === "archived") return "보관";
  return status;
}

function getStatusDescription(status: TopicStatus) {
  if (status === "draft") return "관리자에게만 보임";
  if (status === "open") return "사용자 참여 가능";
  if (status === "active") return "토론 진행 중";
  if (status === "closed") return "읽기 가능, 작성 제한";
  if (status === "archived") return "일반 사용자에게 숨김";
  return "상태 정보 없음";
}

function isPublicTopicStatus(status: TopicStatus) {
  return status === "open" || status === "active" || status === "closed";
}

function TopicStatusBadge({ status }: { status: TopicStatus }) {
  if (status === "open") {
    return (
      <span className="rounded-full border border-[var(--theme-gold)] bg-[var(--athena-surface-soft)] px-3 py-1 text-[11px] font-black text-[var(--theme-gold)]">
        {getStatusLabel(status)}
      </span>
    );
  }

  if (status === "active") {
    return (
      <span className="rounded-full border border-[var(--theme-blue)] bg-[var(--poseidon-surface-soft)] px-3 py-1 text-[11px] font-black text-[var(--poseidon-text)]">
        {getStatusLabel(status)}
      </span>
    );
  }

  if (status === "draft" || status === "archived") {
    return (
      <span className="rounded-full border border-[var(--theme-blue)] bg-[var(--poseidon-surface-soft)] px-3 py-1 text-[11px] font-black text-[var(--poseidon-text)]">
        {getStatusLabel(status)}
      </span>
    );
  }

  return (
    <span className="rounded-full border border-[var(--theme-line)] bg-[var(--theme-surface)] px-3 py-1 text-[11px] font-black text-[var(--theme-muted)]">
      {getStatusLabel(status)}
    </span>
  );
}

function AdminStatCard({
  label,
  value,
  tone,
}: {
  label: string;
  value: number;
  tone: "gold" | "blue" | "stone";
}) {
  const valueClass =
    tone === "gold"
      ? "text-[var(--theme-gold)]"
      : tone === "blue"
        ? "text-[var(--theme-blue)]"
        : "text-[var(--theme-text)]";

  return (
    <div className="rounded-2xl border border-[var(--theme-line)] bg-[var(--theme-surface)] p-4 text-center">
      <p className="text-xs font-black uppercase tracking-[0.18em] text-[var(--theme-soft)]">
        {label}
      </p>
      <p className={`mt-2 text-3xl font-black ${valueClass}`}>{value}</p>
    </div>
  );
}

export default async function AdminTopicsPage({
  searchParams,
}: AdminTopicsPageProps) {
  const query = await searchParams;
  const supabase = await getAdminClient();

  const { data } = await supabase
    .from("topics")
    .select("id, title, description, status, starts_at, ends_at, created_at")
    .is("deleted_at", null)
    .order("created_at", { ascending: false });

  const topics = (data ?? []) as Topic[];

  const draftCount = topics.filter((topic) => topic.status === "draft").length;
  const openCount = topics.filter((topic) => topic.status === "open").length;
  const activeCount = topics.filter((topic) => topic.status === "active").length;
  const closedCount = topics.filter((topic) => topic.status === "closed").length;
  const archivedCount = topics.filter(
    (topic) => topic.status === "archived",
  ).length;

  return (
    <main
      className="min-h-screen bg-[var(--theme-bg)] px-4 py-10 text-[var(--theme-text)] transition-colors duration-300 sm:px-6 sm:py-14"
      style={{
        backgroundImage:
          "radial-gradient(circle at 12% 0%, var(--page-glow-gold), transparent 28%), radial-gradient(circle at 88% 8%, var(--page-glow-blue), transparent 30%), linear-gradient(90deg, var(--page-grid-line) 1px, transparent 1px)",
        backgroundSize: "auto, auto, 54px 54px",
      }}
    >
      <section className="mx-auto max-w-7xl">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <Link
            href="/admin"
            className="inline-flex items-center text-sm font-bold text-[var(--theme-gold)] transition hover:opacity-80"
          >
            ‹ 관리자 페이지로 돌아가기
          </Link>

          <div className="flex flex-wrap gap-2">
            <Link
              href="/admin/topics/new"
              className="inline-flex items-center justify-center border border-[var(--theme-gold)] bg-[var(--theme-gold)] px-4 py-2 text-xs font-black text-[var(--theme-accent-contrast)] shadow-[var(--shadow-button)] transition hover:opacity-85"
            >
              새 주제 만들기
            </Link>

            <Link
              href="/topics"
              className="inline-flex items-center justify-center border border-[var(--theme-line)] bg-[var(--theme-surface)] px-4 py-2 text-xs font-black text-[var(--theme-text)] transition hover:bg-[var(--theme-surface-hover)]"
            >
              사용자 주제 목록 보기
            </Link>
          </div>
        </div>

        {query.message ? (
          <div
            className={
              query.type === "error"
                ? "mt-6 rounded-2xl border bg-[var(--message-error-bg)] p-4 text-sm font-bold text-[var(--message-error-text)]"
                : "mt-6 rounded-2xl border bg-[var(--message-success-bg)] p-4 text-sm font-bold text-[var(--message-success-text)]"
            }
            style={{
              borderColor:
                query.type === "error"
                  ? "var(--message-error-line)"
                  : "var(--message-success-line)",
            }}
          >
            {query.message}
          </div>
        ) : null}

        <div className="mt-8 overflow-hidden rounded-[2rem] border border-[var(--theme-line)] bg-[var(--theme-panel-strong)] shadow-[var(--shadow-card-strong)]">
          <div className="grid lg:grid-cols-[0.85fr_1.15fr]">
            <div className="bg-[var(--athena-surface)] p-6 sm:p-8">
              <p className="text-xs font-black uppercase tracking-[0.28em] text-[var(--theme-gold)]">
                Topic Admin
              </p>

              <h1 className="mt-4 font-serif text-4xl font-black tracking-[0.06em] text-[var(--theme-text)] sm:text-5xl">
                주제 관리
              </h1>

              <p className="mt-5 text-sm leading-7 text-[var(--theme-muted)]">
                토론 주제의 상태를 변경하고, 필요 없는 주제를 삭제 처리합니다.
                삭제된 주제는 일반 사용자에게 보이지 않습니다.
              </p>
            </div>

            <div className="grid gap-3 border-t border-[var(--theme-line)] bg-[var(--theme-panel)] p-6 sm:grid-cols-3 sm:p-8 xl:grid-cols-6 lg:border-l lg:border-t-0">
              <AdminStatCard label="Total" value={topics.length} tone="stone" />
              <AdminStatCard label="Draft" value={draftCount} tone="blue" />
              <AdminStatCard label="Open" value={openCount} tone="gold" />
              <AdminStatCard label="Active" value={activeCount} tone="blue" />
              <AdminStatCard label="Closed" value={closedCount} tone="stone" />
              <AdminStatCard
                label="Archived"
                value={archivedCount}
                tone="stone"
              />
            </div>
          </div>
        </div>

        <section className="mt-8 overflow-hidden rounded-[2rem] border border-[var(--theme-line)] bg-[var(--theme-panel)] shadow-[var(--shadow-card)]">
          <div className="border-b border-[var(--theme-line)] bg-[var(--theme-panel-strong)] p-5">
            <p className="text-xs font-black uppercase tracking-[0.28em] text-[var(--theme-blue)]">
              Topic List
            </p>
          </div>

          {topics.length ? (
            <div className="divide-y divide-[var(--theme-line)]">
              {topics.map((topic) => {
                const canOpenUserPages = isPublicTopicStatus(topic.status);

                return (
                  <div
                    key={topic.id}
                    className="grid gap-4 bg-[var(--theme-surface)] p-5 transition hover:bg-[var(--theme-surface-hover)] lg:grid-cols-[1fr_14rem_22rem]"
                  >
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <TopicStatusBadge status={topic.status} />

                        <span className="rounded-full border border-[var(--theme-line)] bg-[var(--theme-panel)] px-3 py-1 text-[11px] font-black text-[var(--theme-soft)]">
                          생성일 {formatDateTime(topic.created_at)}
                        </span>
                      </div>

                      <h2 className="mt-3 font-serif text-2xl font-black text-[var(--theme-text)]">
                        {topic.title}
                      </h2>

                      <p className="mt-2 text-sm leading-7 text-[var(--theme-muted)]">
                        {topic.description || "설명이 없습니다."}
                      </p>
                    </div>

                    <div className="space-y-1 text-sm font-bold text-[var(--theme-muted)]">
                      <p>시작: {formatDateTime(topic.starts_at)}</p>
                      <p>종료: {formatDateTime(topic.ends_at)}</p>
                      <p className="pt-2 text-xs text-[var(--theme-soft)]">
                        {getStatusDescription(topic.status)}
                      </p>
                    </div>

                    <div className="space-y-3 lg:flex lg:flex-col lg:items-stretch lg:justify-center">
                      <form action={updateTopicStatus} className="flex gap-2">
                        <input type="hidden" name="topic_id" value={topic.id} />
                        <input
                          type="hidden"
                          name="redirect_to"
                          value="/admin/topics"
                        />

                        <select
                          name="status"
                          defaultValue={topic.status}
                          className="min-w-0 flex-1 rounded-xl border border-[var(--theme-line)] bg-[var(--theme-panel)] px-3 py-2 text-xs font-bold text-[var(--theme-text)] outline-none transition focus:border-[var(--theme-gold)]"
                        >
                          <option value="draft">draft - 임시저장</option>
                          <option value="open">open - 참가 가능</option>
                          <option value="active">
                            active - 토론 진행 중
                          </option>
                          <option value="closed">closed - 종료</option>
                          <option value="archived">archived - 보관</option>
                        </select>

                        <ConfirmSubmitButton
                          confirmMessage="이 주제의 상태를 선택한 값으로 변경하시겠습니까? draft 또는 archived 상태는 일반 사용자에게 보이지 않을 수 있습니다."
                          ariaLabel={`${topic.title} 상태 변경 확인`}
                          className="inline-flex items-center justify-center border border-[var(--theme-gold)] bg-[var(--theme-gold)] px-3 py-2 text-xs font-black text-[var(--theme-accent-contrast)] shadow-[var(--shadow-button)] transition hover:opacity-85"
                        >
                          변경
                        </ConfirmSubmitButton>
                      </form>

                      <div className="flex flex-col gap-2 sm:flex-row lg:justify-end">
                        {canOpenUserPages ? (
                          <>
                            <Link
                              href={`/topics/${topic.id}`}
                              className="inline-flex items-center justify-center border border-[var(--theme-line)] bg-[var(--theme-panel)] px-4 py-2 text-xs font-black text-[var(--theme-text)] transition hover:bg-[var(--theme-surface-hover)]"
                            >
                              보기
                            </Link>

                            <Link
                              href={`/topics/${topic.id}/debate`}
                              className="inline-flex items-center justify-center border border-[var(--theme-blue)] bg-[var(--theme-blue)] px-4 py-2 text-xs font-black text-[var(--theme-accent-contrast)] shadow-[var(--shadow-button)] transition hover:opacity-85"
                            >
                              토론방
                            </Link>
                          </>
                        ) : (
                          <span className="inline-flex items-center justify-center border border-[var(--theme-line)] bg-[var(--theme-panel)] px-4 py-2 text-xs font-black text-[var(--theme-soft)]">
                            사용자 비공개
                          </span>
                        )}

                        <Link
                          href={`/admin/topics/${topic.id}/edit`}
                          className="inline-flex items-center justify-center border border-[var(--theme-line)] bg-[var(--theme-panel)] px-4 py-2 text-xs font-black text-[var(--theme-text)] transition hover:bg-[var(--theme-surface-hover)]"
                        >
                          수정
                        </Link>

                        <form action={deleteTopic}>
                          <input
                            type="hidden"
                            name="topic_id"
                            value={topic.id}
                          />
                          <input
                            type="hidden"
                            name="redirect_to"
                            value="/admin/topics"
                          />

                          <ConfirmSubmitButton
                            confirmMessage="정말 이 주제를 삭제하시겠습니까? 삭제된 주제는 일반 사용자에게 보이지 않습니다. 이 작업은 운영 로그에 기록될 수 있습니다."
                            ariaLabel={`${topic.title} 삭제 확인`}
                            className="inline-flex w-full items-center justify-center border border-[var(--message-error-line)] bg-[var(--message-error-bg)] px-4 py-2 text-xs font-black text-[var(--message-error-text)] transition hover:opacity-80"
                          >
                            삭제
                          </ConfirmSubmitButton>
                        </form>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="p-10 text-center">
              <p className="font-serif text-2xl font-black text-[var(--theme-text)]">
                관리할 주제가 없습니다.
              </p>

              <p className="mt-3 text-sm text-[var(--theme-muted)]">
                삭제되지 않은 주제가 이곳에 표시됩니다.
              </p>

              <Link
                href="/admin/topics/new"
                className="mt-6 inline-flex items-center justify-center border border-[var(--theme-gold)] bg-[var(--theme-gold)] px-5 py-3 text-sm font-black text-[var(--theme-accent-contrast)] shadow-[var(--shadow-button)] transition hover:opacity-85"
              >
                새 주제 만들기
              </Link>
            </div>
          )}
        </section>
      </section>
    </main>
  );
}
