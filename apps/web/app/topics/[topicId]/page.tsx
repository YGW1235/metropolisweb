import Link from "next/link";
import { notFound } from "next/navigation";

import { joinTopic } from "@/app/actions/topics";
import { createClient } from "@/lib/supabase/server";

import { AccountStatusNotice } from "@/components/account-status-notice";

type TopicDetailPageProps = {
  params: Promise<{
    topicId: string;
  }>;
  searchParams: Promise<{
    message?: string;
    type?: string;
  }>;
};

type Topic = {
  id: string;
  title: string;
  description: string | null;
  status: string | null;
  starts_at: string | null;
  ends_at: string | null;
  created_at: string | null;
  athena_position: string | null;
  poseidon_position: string | null;
};

type Participation = {
  assigned_side: string | null;
  side_index: number | null;
};

type MyProfileStatus = {
  status: string | null;
  status_reason: string | null;
  status_changed_at: string | null;
};

function AthenaIcon() {
  return (
    <span className="flex h-14 w-14 items-center justify-center rounded-full border border-[var(--theme-gold)] bg-[var(--athena-surface-soft)] text-3xl text-[var(--athena-text)] shadow-[var(--shadow-athena-icon)] transition-[background-color,box-shadow,color,border-color] duration-300">
      ♜
    </span>
  );
}

function PoseidonIcon() {
  return (
    <span className="flex h-14 w-14 items-center justify-center rounded-full border border-[var(--theme-blue)] bg-[var(--poseidon-surface-soft)] text-3xl text-[var(--poseidon-text)] shadow-[var(--shadow-poseidon-icon)] transition-[background-color,box-shadow,color,border-color] duration-300">
      Ψ
    </span>
  );
}

function BalanceIcon() {
  return (
    <span className="flex h-14 w-14 items-center justify-center rounded-full border border-[var(--theme-line)] bg-[var(--theme-surface)] text-3xl text-[var(--theme-gold)] shadow-[var(--shadow-card)] transition-[background-color,box-shadow,color,border-color] duration-300">
      ◇
    </span>
  );
}

function getStatusLabel(status: string | null) {
  if (status === "open") return "참가 가능";
  if (status === "active") return "진행 중";
  if (status === "closed") return "종료";
  return "비공개";
}

function getStatusClass(status: string | null) {
  if (status === "open") {
    return "border-[var(--theme-gold)] bg-[var(--athena-surface-soft)] text-[var(--athena-text)]";
  }

  if (status === "active") {
    return "border-[var(--theme-blue)] bg-[var(--poseidon-surface-soft)] text-[var(--poseidon-text)]";
  }

  return "border-[var(--theme-line)] bg-[var(--theme-surface)] text-[var(--theme-muted)]";
}

function formatDate(value: string | null) {
  if (!value) return null;

  return new Intl.DateTimeFormat("ko-KR", {
    year: "numeric",
    month: "short",
    day: "numeric",
  }).format(new Date(value));
}

function getSideLabel(side: string | null | undefined) {
  if (side === "pro") return "아테나 진영";
  if (side === "con") return "포세이돈 진영";
  return "아직 진영을 선택하지 않았습니다";
}

function getPositionText(value: string | null, fallback: string) {
  const trimmed = value?.trim();

  if (!trimmed) {
    return fallback;
  }

  return trimmed;
}

function TopicPositionText({
  athenaPosition,
  poseidonPosition,
}: {
  athenaPosition: string | null;
  poseidonPosition: string | null;
}) {
  return (
    <div className="mt-8 border-t border-[var(--theme-line)] pt-6">
      <p className="text-xs font-black uppercase tracking-[0.26em] text-[var(--theme-gold)]">
        Two Perspectives
      </p>

      <h2 className="mt-3 font-serif text-2xl font-black text-[var(--theme-text)]">
        양측의 기본 입장
      </h2>

      <p className="mt-3 text-sm leading-7 text-[var(--theme-muted)]">
        아래 내용은 각 진영이 토론을 시작할 때 참고할 수 있는 관점입니다.
        반드시 그대로 따라야 하는 답안은 아니며, 자신의 논리와 근거로 자유롭게
        확장할 수 있습니다.
      </p>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <div className="border-l-2 border-[var(--theme-gold)] pl-5">
          <p className="text-xs font-black uppercase tracking-[0.22em] text-[var(--theme-gold)]">
            Athena View
          </p>

          <h3 className="mt-2 font-serif text-xl font-black text-[var(--athena-text)]">
            아테나 측 입장
          </h3>

          <p className="mt-3 whitespace-pre-wrap text-sm leading-8 text-[var(--athena-muted)]">
            {getPositionText(
              athenaPosition,
              "아직 아테나 측 기본 입장이 입력되지 않았습니다.",
            )}
          </p>
        </div>

        <div className="border-l-2 border-[var(--theme-blue)] pl-5">
          <p className="text-xs font-black uppercase tracking-[0.22em] text-[var(--theme-blue)]">
            Poseidon View
          </p>

          <h3 className="mt-2 text-xl font-black text-[var(--poseidon-text)]">
            포세이돈 측 입장
          </h3>

          <p className="mt-3 whitespace-pre-wrap text-sm leading-8 text-[var(--poseidon-muted)]">
            {getPositionText(
              poseidonPosition,
              "아직 포세이돈 측 기본 입장이 입력되지 않았습니다.",
            )}
          </p>
        </div>
      </div>
    </div>
  );
}

function StatCard({
  label,
  value,
  tone,
}: {
  label: string;
  value: string;
  tone: "gold" | "blue" | "stone";
}) {
  const valueClass =
    tone === "gold"
      ? "text-[var(--athena-text)]"
      : tone === "blue"
        ? "text-[var(--poseidon-text)]"
        : "text-[var(--theme-text)]";

  return (
    <div className="rounded-2xl border border-[var(--theme-line)] bg-[var(--theme-surface)] p-5 transition-colors duration-300">
      <p className="text-xs font-black uppercase tracking-[0.22em] text-[var(--theme-soft)]">
        {label}
      </p>
      <p className={`mt-3 text-3xl font-black ${valueClass}`}>{value}</p>
    </div>
  );
}

function JoinOptionCard({
  side,
  title,
  subtitle,
  description,
  disabled,
  disabledLabel,
  topicId,
  userExists,
  alreadyJoined,
}: {
  side: "auto" | "pro" | "con";
  title: string;
  subtitle: string;
  description: string;
  disabled: boolean;
  disabledLabel?: string;
  topicId: string;
  userExists: boolean;
  alreadyJoined: boolean;
}) {
  const isAthena = side === "pro";
  const isPoseidon = side === "con";
  const isAuto = side === "auto";

  const icon = isAthena ? (
    <AthenaIcon />
  ) : isPoseidon ? (
    <PoseidonIcon />
  ) : (
    <BalanceIcon />
  );

  const titleClass = isAthena
    ? "font-serif text-[var(--athena-text)]"
    : isPoseidon
      ? "text-[var(--poseidon-text)]"
      : "font-serif text-[var(--theme-text)]";

  const eyebrowClass = isAthena
    ? "text-[var(--theme-gold)]"
    : isPoseidon
      ? "text-[var(--theme-blue)]"
      : "text-[var(--theme-gold)]";

  const bodyClass = isAthena
    ? "text-[var(--athena-muted)]"
    : isPoseidon
      ? "text-[var(--poseidon-muted)]"
      : "text-[var(--theme-muted)]";

  const bgClass = isAthena
    ? "bg-[var(--athena-surface-soft)]"
    : isPoseidon
      ? "bg-[var(--poseidon-surface-soft)]"
      : "bg-[var(--theme-panel)]";

  const buttonClass = isAthena
    ? "border-[var(--theme-gold)] bg-[var(--theme-gold)] text-[var(--theme-accent-contrast)]"
    : isPoseidon
      ? "border-[var(--theme-blue)] bg-[var(--theme-blue)] text-[var(--theme-accent-contrast)]"
      : "border-[var(--theme-line)] bg-[var(--theme-text)] text-[var(--theme-bg)]";

  return (
    <article
      className={`relative overflow-hidden rounded-[2rem] border border-[var(--theme-line)] ${bgClass} p-6 shadow-[var(--shadow-card-strong)] transition duration-300 hover:-translate-y-1`}
      style={{
        backgroundImage: isAthena
          ? "radial-gradient(circle at 18% 0%, var(--page-glow-gold), transparent 34%)"
          : isPoseidon
            ? "radial-gradient(circle at 82% 0%, var(--page-glow-blue), transparent 34%)"
            : "radial-gradient(circle at 50% 0%, var(--page-glow-gold), transparent 34%)",
      }}
    >
      <div className="relative z-10">
        <div className="flex items-center gap-4">
          {icon}

          <div>
            <p
              className={`text-xs font-black uppercase tracking-[0.28em] ${eyebrowClass}`}
            >
              {subtitle}
            </p>

            <h2 className={`mt-2 text-3xl font-black ${titleClass}`}>
              {title}
            </h2>
          </div>
        </div>

        <p className={`mt-6 min-h-[5.5rem] text-sm leading-7 ${bodyClass}`}>
          {description}
        </p>

        <div className="mt-8">
          {!userExists ? (
            <Link
              href={`/login?message=${encodeURIComponent(
                "로그인 후 진영에 참여할 수 있습니다.",
              )}&redirectTo=${encodeURIComponent(`/topics/${topicId}`)}`}
              className={`inline-flex w-full items-center justify-center border px-6 py-3 text-sm font-black shadow-[var(--shadow-button)] transition duration-300 hover:opacity-85 ${buttonClass}`}
            >
              로그인 후 참여
            </Link>
          ) : alreadyJoined ? (
            <Link
              href={`/topics/${topicId}/debate`}
              className={`inline-flex w-full items-center justify-center border px-6 py-3 text-sm font-black shadow-[var(--shadow-button)] transition duration-300 hover:opacity-85 ${buttonClass}`}
            >
              토론장으로 이동
              <span className="ml-3">›</span>
            </Link>
          ) : (
            <form action={joinTopic}>
              <input type="hidden" name="topic_id" value={topicId} />
              <input type="hidden" name="side" value={side} />

              <button
                type="submit"
                disabled={disabled}
                className={`inline-flex w-full items-center justify-center border px-6 py-3 text-sm font-black shadow-[var(--shadow-button)] transition duration-300 hover:opacity-85 disabled:cursor-not-allowed disabled:opacity-45 ${buttonClass}`}
              >
                {disabledLabel ??
                  (isAuto
                    ? "자동 배정으로 참여"
                    : isAthena
                      ? "아테나 진영 선택"
                      : "포세이돈 진영 선택")}
              </button>
            </form>
          )}
        </div>
      </div>
    </article>
  );
}

export default async function TopicDetailPage({
  params,
  searchParams,
}: TopicDetailPageProps) {
  const { topicId } = await params;
  const query = await searchParams;

  const supabase = await createClient();

  const { data: topicData, error } = await supabase
    .from("topics")
    .select(
      "id, title, description, status, starts_at, ends_at, created_at, athena_position, poseidon_position",
    )
    .eq("id", topicId)
    .is("deleted_at", null)
    .in("status", ["open", "active", "closed"])
    .maybeSingle();

  if (error || !topicData) {
    notFound();
  }

  const topic = topicData as Topic;

  const {
    data: { user },
  } = await supabase.auth.getUser();

  let myProfile: MyProfileStatus | null = null;

  if (user) {
    const { data } = await supabase
      .from("profiles")
      .select("status, status_reason, status_changed_at")
      .eq("id", user.id)
      .maybeSingle();

    myProfile = data as MyProfileStatus | null;
  }

  const isSuspended = myProfile?.status === "suspended";

  let participation: Participation | null = null;

  if (user) {
    const { data } = await supabase
      .from("topic_participants")
      .select("assigned_side, side_index")
      .eq("topic_id", topicId)
      .eq("user_id", user.id)
      .maybeSingle();

    participation = data;
  }

  const { count: athenaCount } = await supabase
    .from("topic_participants")
    .select("*", { count: "exact", head: true })
    .eq("topic_id", topicId)
    .eq("assigned_side", "pro");

  const { count: poseidonCount } = await supabase
    .from("topic_participants")
    .select("*", { count: "exact", head: true })
    .eq("topic_id", topicId)
    .eq("assigned_side", "con");

  const startDate = formatDate(topic.starts_at);
  const endDate = formatDate(topic.ends_at);
  const canJoin = topic.status === "open" || topic.status === "active";
  const alreadyJoined = Boolean(participation?.assigned_side);

  const joinDisabledLabel = isSuspended
    ? "정지 계정은 참가할 수 없습니다"
    : !canJoin
      ? "현재 참가할 수 없습니다"
      : undefined;

  return (
    <main
      className="min-h-screen bg-[var(--theme-bg)] text-[var(--theme-text)] transition-colors duration-300"
      style={{
        backgroundImage:
          "radial-gradient(circle at 12% 0%, var(--page-glow-gold), transparent 28%), radial-gradient(circle at 88% 8%, var(--page-glow-blue), transparent 30%), linear-gradient(90deg, var(--page-grid-line) 1px, transparent 1px)",
        backgroundSize: "auto, auto, 54px 54px",
      }}
    >
      <section className="relative overflow-hidden border-b border-[var(--theme-line)] px-6 py-16 transition-colors duration-300">
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-[var(--theme-bg)]" />

        <div className="relative z-10 mx-auto max-w-7xl">
          <Link
            href="/topics"
            className="inline-flex items-center text-sm font-bold text-[var(--theme-gold)] transition hover:opacity-80"
          >
            ‹ 의제 목록으로
          </Link>

          <div className="mt-8 grid gap-10 lg:grid-cols-[1.1fr_0.9fr] lg:items-start">
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <span
                  className={`rounded-full border px-3 py-1 text-xs font-black transition-colors duration-300 ${getStatusClass(
                    topic.status,
                  )}`}
                >
                  {getStatusLabel(topic.status)}
                </span>

                {startDate ? (
                  <span className="rounded-full border border-[var(--theme-line)] bg-[var(--theme-surface)] px-3 py-1 text-xs font-bold text-[var(--theme-muted)] transition-colors duration-300">
                    시작 {startDate}
                  </span>
                ) : null}

                {endDate ? (
                  <span className="rounded-full border border-[var(--theme-line)] bg-[var(--theme-surface)] px-3 py-1 text-xs font-bold text-[var(--theme-muted)] transition-colors duration-300">
                    종료 {endDate}
                  </span>
                ) : null}
              </div>

              <p className="mt-8 text-xs font-black uppercase tracking-[0.32em] text-[var(--theme-gold)]">
                Central Motion
              </p>

              <h1 className="mt-4 max-w-4xl font-serif text-5xl font-black leading-tight tracking-[0.06em] text-[var(--theme-text)] md:text-7xl">
                {topic.title}
              </h1>

              <p className="mt-6 whitespace-pre-line break-words max-w-3xl text-sm leading-8 text-[var(--theme-muted)]">
                {topic.description || "아직 설명이 등록되지 않은 의제입니다."}
              </p>

              <TopicPositionText
                athenaPosition={topic.athena_position}
                poseidonPosition={topic.poseidon_position}
              />
            </div>

            <div className="rounded-[2rem] border border-[var(--theme-line)] bg-[var(--theme-surface)] p-6 shadow-[var(--shadow-card)] backdrop-blur transition duration-300">
              <p className="text-xs font-black uppercase tracking-[0.28em] text-[var(--theme-gold)]">
                Your Position
              </p>

              <h2 className="mt-3 font-serif text-3xl font-black text-[var(--theme-text)]">
                {getSideLabel(participation?.assigned_side)}
              </h2>

              <p className="mt-4 text-sm leading-7 text-[var(--theme-muted)]">
                진영을 선택하면 토론장에 발언을 남길 수 있습니다. 참여하지
                않아도 토론방 관전은 가능합니다.
              </p>

              <div className="mt-6 grid gap-3 sm:grid-cols-3">
                <StatCard
                  label="아테나"
                  value={`${athenaCount ?? 0}`}
                  tone="gold"
                />
                <StatCard
                  label="포세이돈"
                  value={`${poseidonCount ?? 0}`}
                  tone="blue"
                />
                <StatCard
                  label="총 시민"
                  value={`${(athenaCount ?? 0) + (poseidonCount ?? 0)}`}
                  tone="stone"
                />
              </div>

              <Link
                href={`/topics/${topic.id}/debate`}
                className="mt-5 inline-flex w-full items-center justify-center border border-[var(--theme-line)] bg-[var(--theme-surface)] px-5 py-3 text-sm font-black text-[var(--theme-text)] transition hover:bg-[var(--theme-surface-hover)]"
              >
                토론방 관전하기
                <span className="ml-2">›</span>
              </Link>
            </div>
          </div>

          {query.message ? (
            <div
              className={
                query.type === "success"
                  ? "mt-8 rounded-2xl border bg-[var(--message-success-bg)] p-4 text-sm font-bold text-[var(--message-success-text)]"
                  : "mt-8 rounded-2xl border bg-[var(--message-error-bg)] p-4 text-sm font-bold text-[var(--message-error-text)]"
              }
              style={{
                borderColor:
                  query.type === "success"
                    ? "var(--message-success-line)"
                    : "var(--message-error-line)",
              }}
            >
              {query.message}
            </div>
          ) : null}
        </div>
      </section>

      <section className="px-6 py-14">
        <div className="mx-auto max-w-7xl">
          <div className="mb-8 text-center">
            <p className="text-xs font-black uppercase tracking-[0.32em] text-[var(--theme-gold)]">
              Choose Your Divine Bench
            </p>

            <h2 className="mt-3 font-serif text-4xl font-black tracking-[0.08em] text-[var(--theme-text)]">
              어떻게 참여하시겠습니까?
            </h2>

            <p className="mx-auto mt-3 max-w-2xl text-sm leading-7 text-[var(--theme-muted)]">
              자동 배정은 인원이 적은 진영으로 입장합니다. 직접 선택하면
              원하는 진영으로 참여할 수 있습니다.
            </p>
          </div>

          <div className="mb-8">
            <AccountStatusNotice
              status={myProfile?.status}
              reason={myProfile?.status_reason ?? null}
              changedAt={myProfile?.status_changed_at ?? null}
            />
          </div>

          <div className="grid gap-6 lg:grid-cols-3">
            <JoinOptionCard
              side="pro"
              title="ATHENA"
              subtitle="Wisdom · Order · Reason"
              description="아테나 진영으로 참여합니다. 위 입장을 참고해 질서 있는 토론, 논리적 근거, 책임 있는 발언을 전개할 수 있습니다."
              topicId={topic.id}
              userExists={Boolean(user)}
              alreadyJoined={alreadyJoined}
              disabled={!canJoin || alreadyJoined || isSuspended}
              disabledLabel={joinDisabledLabel}
            />

            <JoinOptionCard
              side="auto"
              title="AUTO"
              subtitle="Balance · Fair Match"
              description="현재 인원이 더 적은 진영으로 자동 배정됩니다. 기존의 균형 배정 방식입니다."
              topicId={topic.id}
              userExists={Boolean(user)}
              alreadyJoined={alreadyJoined}
              disabled={!canJoin || alreadyJoined || isSuspended}
              disabledLabel={joinDisabledLabel}
            />

            <JoinOptionCard
              side="con"
              title="POSEIDON"
              subtitle="Storm · Force · Freedom"
              description="포세이돈 진영으로 참여합니다. 위 입장을 참고해 변화의 힘, 현실적 반론, 자유로운 충돌을 전개할 수 있습니다."
              topicId={topic.id}
              userExists={Boolean(user)}
              alreadyJoined={alreadyJoined}
              disabled={!canJoin || alreadyJoined || isSuspended}
              disabledLabel={joinDisabledLabel}
            />
          </div>

          <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
            <Link
              href={`/topics/${topic.id}/debate`}
              className="inline-flex items-center justify-center border border-[var(--theme-gold)] bg-[var(--theme-gold)] px-8 py-3 text-sm font-black text-[var(--theme-accent-contrast)] shadow-[var(--shadow-button)] transition duration-300 hover:opacity-85"
            >
              토론방 관전하기
              <span className="ml-3">›</span>
            </Link>

            <Link
              href="/topics"
              className="inline-flex items-center justify-center border border-[var(--theme-line)] bg-[var(--theme-surface)] px-8 py-3 text-sm font-black text-[var(--theme-text)] shadow-[var(--shadow-button)] transition duration-300 hover:bg-[var(--theme-surface-hover)]"
            >
              다른 의제 보기
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}