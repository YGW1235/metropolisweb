import Link from "next/link";
import { notFound, redirect } from "next/navigation";

import { updateTopic } from "@/app/actions/topics";
import { createClient } from "@/lib/supabase/server";

type AdminTopicEditPageProps = {
  params: Promise<{
    topicId: string;
  }>;
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
  athena_position: string | null;
  poseidon_position: string | null;
  created_at: string;
};

async function getAdminClient(redirectTo: string) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect(
      `/login?message=${encodeURIComponent(
        "관리자 기능은 로그인 후 이용할 수 있습니다.",
      )}&redirectTo=${encodeURIComponent(redirectTo)}`,
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

function formatDateTimeInput(value: string | null) {
  if (!value) return "";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "";
  }

  const koreaDate = new Date(date.getTime() + 9 * 60 * 60 * 1000);

  return koreaDate.toISOString().slice(0, 16);
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
  if (status === "draft") {
    return "관리자에게만 보입니다.";
  }

  if (status === "open") {
    return "사용자가 토론방에 참여할 수 있습니다.";
  }

  if (status === "active") {
    return "토론이 진행 중인 상태입니다.";
  }

  if (status === "closed") {
    return "읽기는 가능하지만 새 참여와 작성은 제한됩니다.";
  }

  if (status === "archived") {
    return "일반 사용자 목록에서 숨겨지는 보관 상태입니다.";
  }

  return "";
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

export default async function AdminTopicEditPage({
  params,
  searchParams,
}: AdminTopicEditPageProps) {
  const { topicId } = await params;
  const query = await searchParams;
  const redirectTo = `/admin/topics/${topicId}/edit`;

  const supabase = await getAdminClient(redirectTo);

  const { data } = await supabase
    .from("topics")
    .select(
      "id, title, description, status, starts_at, ends_at, athena_position, poseidon_position, created_at",
    )
    .eq("id", topicId)
    .is("deleted_at", null)
    .maybeSingle();

  if (!data) {
    notFound();
  }

  const topic = data as Topic;

  return (
    <main
      className="min-h-screen bg-[var(--theme-bg)] px-4 py-10 text-[var(--theme-text)] transition-colors duration-300 sm:px-6 sm:py-14"
      style={{
        backgroundImage:
          "radial-gradient(circle at 12% 0%, var(--page-glow-gold), transparent 28%), radial-gradient(circle at 88% 8%, var(--page-glow-blue), transparent 30%), linear-gradient(90deg, var(--page-grid-line) 1px, transparent 1px)",
        backgroundSize: "auto, auto, 54px 54px",
      }}
    >
      <section className="mx-auto max-w-5xl">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <Link
            href="/admin/topics"
            className="inline-flex items-center text-sm font-bold text-[var(--theme-gold)] transition hover:opacity-80"
          >
            ‹ 주제 관리로 돌아가기
          </Link>

          <div className="flex flex-wrap gap-2">
            {topic.status === "open" ||
            topic.status === "active" ||
            topic.status === "closed" ? (
              <>
                <Link
                  href={`/topics/${topic.id}`}
                  className="inline-flex items-center justify-center border border-[var(--theme-line)] bg-[var(--theme-surface)] px-4 py-2 text-xs font-black text-[var(--theme-text)] transition hover:bg-[var(--theme-surface-hover)]"
                >
                  사용자 화면 보기
                </Link>

                <Link
                  href={`/topics/${topic.id}/debate`}
                  className="inline-flex items-center justify-center border border-[var(--theme-blue)] bg-[var(--theme-blue)] px-4 py-2 text-xs font-black text-[var(--theme-accent-contrast)] shadow-[var(--shadow-button)] transition hover:opacity-85"
                >
                  토론방 보기
                </Link>
              </>
            ) : null}
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
          <div className="border-b border-[var(--theme-line)] bg-[var(--athena-surface)] p-6 sm:p-8">
            <div className="flex flex-wrap items-center gap-2">
              <TopicStatusBadge status={topic.status} />

              <span className="rounded-full border border-[var(--theme-line)] bg-[var(--theme-surface)] px-3 py-1 text-[11px] font-black text-[var(--theme-soft)]">
                생성일 {formatDateTime(topic.created_at)}
              </span>
            </div>

            <p className="mt-5 text-xs font-black uppercase tracking-[0.28em] text-[var(--theme-gold)]">
              Edit Topic
            </p>

            <h1 className="mt-4 font-serif text-4xl font-black tracking-[0.06em] text-[var(--theme-text)] sm:text-5xl">
              주제 수정
            </h1>

            <p className="mt-4 text-sm leading-7 text-[var(--theme-muted)]">
              토론 주제의 기본 정보, 공개 상태, 양측의 기본 주장을 수정합니다.
            </p>
          </div>

          <form action={updateTopic} className="space-y-6 p-6 sm:p-8">
            <input type="hidden" name="topic_id" value={topic.id} />
            <input type="hidden" name="redirect_to" value={redirectTo} />

            <div>
              <label className="block text-sm font-bold text-[var(--theme-muted)]">
                주제 제목
              </label>

              <input
                name="title"
                required
                minLength={2}
                maxLength={120}
                defaultValue={topic.title}
                className="mt-2 w-full rounded-xl border border-[var(--theme-line)] bg-[var(--theme-surface)] px-4 py-3 text-[var(--theme-text)] outline-none transition placeholder:text-[var(--theme-soft)] focus:border-[var(--theme-gold)]"
                placeholder="토론 주제 제목을 입력하세요."
              />
            </div>

            <div>
              <label className="block text-sm font-bold text-[var(--theme-muted)]">
                주제 설명
              </label>

              <textarea
                name="description"
                rows={8}
                defaultValue={topic.description ?? ""}
                className="mt-2 w-full rounded-xl border border-[var(--theme-line)] bg-[var(--theme-surface)] px-4 py-3 text-[var(--theme-text)] outline-none transition placeholder:text-[var(--theme-soft)] focus:border-[var(--theme-gold)]"
                placeholder="토론 주제에 대한 설명을 입력하세요."
              />

              <p className="mt-2 text-xs font-bold text-[var(--theme-soft)]">
                사용자가 토론의 배경을 이해할 수 있도록 간단히 작성하세요.
              </p>
            </div>

            <div className="grid gap-4 lg:grid-cols-2">
              <div>
                <label className="block text-sm font-bold text-[var(--theme-muted)]">
                  아테나 측 기본 주장
                </label>

                <textarea
                  name="athena_position"
                  rows={7}
                  defaultValue={topic.athena_position ?? ""}
                  className="mt-2 w-full rounded-xl border border-[var(--theme-line)] bg-[var(--theme-surface)] px-4 py-3 text-[var(--theme-text)] outline-none transition placeholder:text-[var(--theme-soft)] focus:border-[var(--theme-gold)]"
                  placeholder="아테나 측이 이 주제에서 출발점으로 삼을 주장을 입력하세요."
                />

                <p className="mt-2 text-xs font-bold text-[var(--theme-soft)]">
                  아테나 측 참여자가 참고할 수 있는 기본 논점을 작성하세요.
                </p>
              </div>

              <div>
                <label className="block text-sm font-bold text-[var(--theme-muted)]">
                  포세이돈 측 기본 주장
                </label>

                <textarea
                  name="poseidon_position"
                  rows={7}
                  defaultValue={topic.poseidon_position ?? ""}
                  className="mt-2 w-full rounded-xl border border-[var(--theme-line)] bg-[var(--theme-surface)] px-4 py-3 text-[var(--theme-text)] outline-none transition placeholder:text-[var(--theme-soft)] focus:border-[var(--theme-blue)]"
                  placeholder="포세이돈 측이 이 주제에서 출발점으로 삼을 주장을 입력하세요."
                />

                <p className="mt-2 text-xs font-bold text-[var(--theme-soft)]">
                  포세이돈 측 참여자가 참고할 수 있는 기본 논점을 작성하세요.
                </p>
              </div>
            </div>

            <div className="grid gap-4 lg:grid-cols-3">
              <div>
                <label className="block text-sm font-bold text-[var(--theme-muted)]">
                  상태
                </label>

                <select
                  name="status"
                  defaultValue={topic.status}
                  className="mt-2 w-full rounded-xl border border-[var(--theme-line)] bg-[var(--theme-surface)] px-4 py-3 text-[var(--theme-text)] outline-none transition focus:border-[var(--theme-gold)]"
                >
                  <option value="draft">draft - 임시저장</option>
                  <option value="open">open - 참가 가능</option>
                  <option value="active">active - 토론 진행 중</option>
                  <option value="closed">closed - 종료</option>
                  <option value="archived">archived - 보관</option>
                </select>

                <p className="mt-2 text-xs font-bold text-[var(--theme-soft)]">
                  {getStatusDescription(topic.status)}
                </p>
              </div>

              <div>
                <label className="block text-sm font-bold text-[var(--theme-muted)]">
                  시작 시간
                </label>

                <input
                  type="datetime-local"
                  name="starts_at"
                  defaultValue={formatDateTimeInput(topic.starts_at)}
                  className="mt-2 w-full rounded-xl border border-[var(--theme-line)] bg-[var(--theme-surface)] px-4 py-3 text-[var(--theme-text)] outline-none transition focus:border-[var(--theme-gold)]"
                />

                <p className="mt-2 text-xs font-bold text-[var(--theme-soft)]">
                  비워두면 시작 시간이 설정되지 않습니다.
                </p>
              </div>

              <div>
                <label className="block text-sm font-bold text-[var(--theme-muted)]">
                  종료 시간
                </label>

                <input
                  type="datetime-local"
                  name="ends_at"
                  defaultValue={formatDateTimeInput(topic.ends_at)}
                  className="mt-2 w-full rounded-xl border border-[var(--theme-line)] bg-[var(--theme-surface)] px-4 py-3 text-[var(--theme-text)] outline-none transition focus:border-[var(--theme-gold)]"
                />

                <p className="mt-2 text-xs font-bold text-[var(--theme-soft)]">
                  종료 후에는 읽기 전용으로 전환하는 것을 권장합니다.
                </p>
              </div>
            </div>

            <div className="rounded-2xl border border-[var(--theme-line)] bg-[var(--poseidon-surface-soft)] p-5">
              <p className="text-xs font-black uppercase tracking-[0.22em] text-[var(--theme-blue)]">
                Topic Guide
              </p>

              <div className="mt-3 space-y-2 text-sm leading-7 text-[var(--poseidon-muted)]">
                <p>
                  1. 아테나와 포세이돈의 기본 주장은 사용자의 발언 방향을
                  돕는 출발점입니다.
                </p>
                <p>
                  2. 각 진영 사용자가 반드시 그대로 따라야 하는 공식 답안은
                  아닙니다.
                </p>
                <p>
                  3. 임시저장과 보관 상태의 주제는 일반 사용자 목록에서
                  숨기는 것을 권장합니다.
                </p>
              </div>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row">
              <button className="inline-flex flex-1 items-center justify-center border border-[var(--theme-gold)] bg-[var(--theme-gold)] px-5 py-3 text-sm font-black text-[var(--theme-accent-contrast)] shadow-[var(--shadow-button)] transition duration-300 hover:opacity-85">
                수정 저장하기
              </button>

              <Link
                href="/admin/topics"
                className="inline-flex flex-1 items-center justify-center border border-[var(--theme-line)] bg-[var(--theme-surface)] px-5 py-3 text-sm font-black text-[var(--theme-text)] transition hover:bg-[var(--theme-surface-hover)]"
              >
                취소
              </Link>
            </div>
          </form>
        </div>
      </section>
    </main>
  );
}