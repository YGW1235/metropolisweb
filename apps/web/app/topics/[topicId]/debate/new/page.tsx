import Link from "next/link";
import { notFound } from "next/navigation";

import { createDebatePost } from "@/app/actions/posts";
import { joinTopic } from "@/app/actions/topics";
import { createClient } from "@/lib/supabase/server";
import { FormMessage } from "@/components/form-message";
import { ImageUploadPreview } from "@/components/image-upload-preview";
import { PendingSubmitButton } from "@/components/pending-submit-button";

import { AccountStatusNotice } from "@/components/account-status-notice";

type NewDebatePostPageProps = {
  params: Promise<{
    topicId: string;
  }>;
  searchParams: Promise<{
    message?: string;
    type?: string;
  }>;
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
    <span className="flex h-12 w-12 items-center justify-center rounded-full border border-[var(--theme-gold)] bg-[var(--athena-surface-soft)] text-2xl text-[var(--athena-text)] shadow-[var(--shadow-athena-icon)] transition duration-300">
      ♜
    </span>
  );
}

function PoseidonIcon() {
  return (
    <span className="flex h-12 w-12 items-center justify-center rounded-full border border-[var(--theme-blue)] bg-[var(--poseidon-surface-soft)] text-2xl text-[var(--poseidon-text)] shadow-[var(--shadow-poseidon-icon)] transition duration-300">
      Ψ
    </span>
  );
}

function BalanceIcon() {
  return (
    <span className="flex h-12 w-12 items-center justify-center rounded-full border border-[var(--theme-line)] bg-[var(--theme-surface)] text-2xl text-[var(--theme-gold)] shadow-[var(--shadow-card)] transition duration-300">
      ◇
    </span>
  );
}

function fullSideLabel(side: string | null) {
  if (side === "pro") return "아테나 진영";
  if (side === "con") return "포세이돈 진영";
  return "관전 중";
}

function sideBadgeClass(side: string | null) {
  if (side === "pro") {
    return "border-[var(--theme-gold)] bg-[var(--athena-surface-soft)] text-[var(--athena-text)]";
  }

  if (side === "con") {
    return "border-[var(--theme-blue)] bg-[var(--poseidon-surface-soft)] text-[var(--poseidon-text)]";
  }

  return "border-[var(--theme-line)] bg-[var(--theme-surface)] text-[var(--theme-muted)]";
}

function writeDisabledMessage(status: string | null) {
  if (status === "closed") {
    return "종료된 토론입니다. 더 이상 글을 작성할 수 없습니다.";
  }

  if (status === "archived") {
    return "보관 처리된 토론입니다.";
  }

  if (status === "draft") {
    return "아직 공개되지 않은 토론입니다.";
  }

  return "현재 이 주제에는 글을 작성할 수 없습니다.";
}

function getPositionText(value: string | null, fallback: string) {
  const trimmed = value?.trim();

  if (!trimmed) {
    return fallback;
  }

  return trimmed;
}

function getSidePositionInfo({
  side,
  athenaPosition,
  poseidonPosition,
}: {
  side: string | null | undefined;
  athenaPosition: string | null;
  poseidonPosition: string | null;
}) {
  if (side === "pro") {
    return {
      title: "아테나 측 입장",
      text: getPositionText(
        athenaPosition,
        "아직 아테나 측 기본 입장이 입력되지 않았습니다.",
      ),
      titleClass: "text-[var(--theme-gold)]",
      bodyClass: "text-[var(--athena-muted)]",
    };
  }

  if (side === "con") {
    return {
      title: "포세이돈 측 입장",
      text: getPositionText(
        poseidonPosition,
        "아직 포세이돈 측 기본 입장이 입력되지 않았습니다.",
      ),
      titleClass: "text-[var(--theme-blue)]",
      bodyClass: "text-[var(--poseidon-muted)]",
    };
  }

  return null;
}

function JoinButton({
  topicId,
  side,
  children,
  className,
  disabled = false,
  disabledLabel,
}: {
  topicId: string;
  side: "auto" | "pro" | "con";
  children: string;
  className: string;
  disabled?: boolean;
  disabledLabel?: string;
}) {
  return (
    <form action={joinTopic}>
      <input type="hidden" name="topic_id" value={topicId} />
      <input type="hidden" name="side" value={side} />

      <PendingSubmitButton
        pendingText="참여 중..."
        disabled={disabled}
        className={`inline-flex w-full items-center justify-center border px-4 py-3 text-sm font-black shadow-[var(--shadow-button)] transition duration-300 hover:opacity-85 disabled:cursor-not-allowed disabled:opacity-50 ${className}`}
      >
        {disabledLabel ?? children}
      </PendingSubmitButton>
    </form>
  );
}

function NeedLoginPanel({ topicId }: { topicId: string }) {
  return (
    <div className="rounded-[2rem] border border-[var(--theme-line)] bg-[var(--theme-panel)] p-6 shadow-[var(--shadow-card)] transition duration-300 sm:p-8">
      <p className="text-xs font-black uppercase tracking-[0.28em] text-[var(--theme-gold)]">
        Login Required
      </p>

      <h2 className="mt-3 font-serif text-3xl font-black text-[var(--theme-text)]">
        로그인 후 발언할 수 있습니다
      </h2>

      <p className="mt-3 text-sm leading-7 text-[var(--theme-muted)]">
        토론방 관전은 비로그인 상태에서도 가능하지만, 새 발언을 남기려면
        로그인 후 진영에 참여해야 합니다.
      </p>

      <div className="mt-6 flex flex-col gap-3 sm:flex-row">
        <Link
          href={`/login?message=${encodeURIComponent(
            "로그인 후 진영에 참여할 수 있습니다.",
          )}&redirectTo=${encodeURIComponent(`/topics/${topicId}/debate/new`)}`}
          className="inline-flex flex-1 items-center justify-center border border-[var(--theme-gold)] bg-[var(--theme-gold)] px-5 py-3 text-sm font-black text-[var(--theme-accent-contrast)] shadow-[var(--shadow-button)] transition duration-300 hover:opacity-85"
        >
          로그인하기
          <span className="ml-2">›</span>
        </Link>

        <Link
          href={`/topics/${topicId}/debate`}
          className="inline-flex items-center justify-center border border-[var(--theme-line)] bg-[var(--theme-surface)] px-5 py-3 text-sm font-black text-[var(--theme-text)] transition hover:bg-[var(--theme-surface-hover)]"
        >
          관전으로 돌아가기
        </Link>
      </div>
    </div>
  );
}

function NeedJoinPanel({
  topicId,
  canJoin,
  status,
  isParticipant,
  isSuspended,
  myProfile,
}: {
  topicId: string;
  canJoin: boolean;
  status: string | null;
  isParticipant: boolean;
  isSuspended: boolean;
  myProfile: MyProfileStatus | null;
}) {
  if (!canJoin) {
    return (
      <div className="rounded-[2rem] border border-[var(--theme-line)] bg-[var(--theme-panel)] p-6 shadow-[var(--shadow-card)] transition duration-300 sm:p-8">
        <p className="text-xs font-black uppercase tracking-[0.28em] text-[var(--theme-gold)]">
          Writing Closed
        </p>

        <h2 className="mt-3 font-serif text-3xl font-black text-[var(--theme-text)]">
          발언 작성이 제한되어 있습니다
        </h2>

        <p className="mt-3 text-sm leading-7 text-[var(--theme-muted)]">
          {writeDisabledMessage(status)}
        </p>

        <div className="mt-5">
          <AccountStatusNotice
            status={myProfile?.status}
            reason={myProfile?.status_reason ?? null}
            changedAt={myProfile?.status_changed_at ?? null}
          />  
        </div>

        <Link
          href={`/topics/${topicId}/debate`}
          className="mt-6 inline-flex items-center justify-center border border-[var(--theme-line)] bg-[var(--theme-surface)] px-5 py-3 text-sm font-black text-[var(--theme-text)] transition hover:bg-[var(--theme-surface-hover)]"
        >
          발언 목록으로 돌아가기
        </Link>
      </div>
    );
  }

  return (
    <div className="rounded-[2rem] border border-[var(--theme-line)] bg-[var(--theme-panel)] p-6 shadow-[var(--shadow-card)] transition duration-300 sm:p-8">
      <p className="text-xs font-black uppercase tracking-[0.28em] text-[var(--theme-gold)]">
        Choose Your Bench
      </p>

      <h2 className="mt-3 font-serif text-3xl font-black text-[var(--theme-text)]">
        {isSuspended
          ? "계정 이용 제한으로 발언할 수 없습니다"
          : isParticipant
            ? "현재 발언할 수 없습니다"
            : "진영 참여 후 발언할 수 있습니다"}
      </h2>

      <p className="mt-3 text-sm leading-7 text-[var(--theme-muted)]">
        {isSuspended
          ? "현재 계정은 정지 상태입니다. 정지 상태에서는 새 발언 작성과 진영 참여가 제한됩니다."
          : "지금은 관전 상태입니다. 새 발언을 작성하려면 자동 배정, 아테나, 포세이돈 중 하나를 선택해 토론에 참여하세요."}
      </p>

      <div className="mt-5">
        <AccountStatusNotice
          status={myProfile?.status}
          reason={myProfile?.status_reason ?? null}
          changedAt={myProfile?.status_changed_at ?? null}
        />
      </div>

      <div className="mt-6 grid gap-3 lg:grid-cols-3">
        <div className="rounded-2xl border border-[var(--theme-line)] bg-[var(--athena-surface-soft)] p-5">
          <AthenaIcon />
          <h3 className="mt-4 font-serif text-2xl font-black text-[var(--athena-text)]">
            ATHENA
          </h3>
          <p className="mt-2 text-sm leading-6 text-[var(--athena-muted)]">
            질서, 논리, 책임의 관점에서 발언합니다.
          </p>

          <div className="mt-5">
            <JoinButton
              topicId={topicId}
              side="pro"
              className="border-[var(--theme-gold)] bg-[var(--theme-gold)] text-[var(--theme-accent-contrast)]"
              disabled={isSuspended}
              disabledLabel={isSuspended ? "정지 계정은 참여할 수 없습니다" : undefined}
            >
              아테나 선택
            </JoinButton>
          </div>
        </div>

        <div className="rounded-2xl border border-[var(--theme-line)] bg-[var(--theme-surface)] p-5">
          <BalanceIcon />
          <h3 className="mt-4 font-serif text-2xl font-black text-[var(--theme-text)]">
            AUTO
          </h3>
          <p className="mt-2 text-sm leading-6 text-[var(--theme-muted)]">
            인원이 적은 진영으로 자동 배정됩니다.
          </p>

          <div className="mt-5">
            <JoinButton
              topicId={topicId}
              side="auto"
              className="border-[var(--theme-line)] bg-[var(--theme-text)] text-[var(--theme-bg)]"
              disabled={isSuspended}
              disabledLabel={isSuspended ? "정지 계정은 참여할 수 없습니다" : undefined}
            >
              자동 배정
            </JoinButton>
          </div>
        </div>

        <div className="rounded-2xl border border-[var(--theme-line)] bg-[var(--poseidon-surface-soft)] p-5">
          <PoseidonIcon />
          <h3 className="mt-4 text-2xl font-black text-[var(--poseidon-text)]">
            POSEIDON
          </h3>
          <p className="mt-2 text-sm leading-6 text-[var(--poseidon-muted)]">
            충돌, 자유, 반론의 관점에서 발언합니다.
          </p>

          <div className="mt-5">
            <JoinButton
              topicId={topicId}
              side="con"
              className="border-[var(--theme-blue)] bg-[var(--theme-blue)] text-[var(--theme-accent-contrast)]"
              disabled={isSuspended}
              disabledLabel={isSuspended ? "정지 계정은 참여할 수 없습니다" : undefined}
            >
              포세이돈 선택
            </JoinButton>
          </div>
        </div>
      </div>

      <Link
        href={`/topics/${topicId}/debate`}
        className="mt-6 inline-flex items-center justify-center border border-[var(--theme-line)] bg-[var(--theme-surface)] px-5 py-3 text-sm font-black text-[var(--theme-text)] transition hover:bg-[var(--theme-surface-hover)]"
      >
        발언 목록으로 돌아가기
      </Link>
    </div>
  );
}

export default async function NewDebatePostPage({
  params,
  searchParams,
}: NewDebatePostPageProps) {
  const { topicId } = await params;
  const query = await searchParams;

  const supabase = await createClient();

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

  const { data: topic, error: topicError } = await supabase
    .from("topics")
    .select(
      "id, title, description, status, athena_position, poseidon_position",
    )
    .eq("id", topicId)
    .is("deleted_at", null)
    .maybeSingle();

  if (topicError || !topic) {
    notFound();
  }

  let participation: Participation | null = null;

  if (user) {
    const { data } = await supabase
      .from("topic_participants")
      .select("assigned_side, side_index")
      .eq("topic_id", topic.id)
      .eq("user_id", user.id)
      .maybeSingle();

    participation = data;
  }

  const canJoin = topic.status === "open" || topic.status === "active";
  const isParticipant = Boolean(participation?.assigned_side);
  const canWrite = Boolean(user) && isParticipant && canJoin && !isSuspended;
  const isAthena = participation?.assigned_side === "pro";
  const sidePositionInfo = getSidePositionInfo({
    side: participation?.assigned_side,
    athenaPosition: topic.athena_position,
    poseidonPosition: topic.poseidon_position,
  });

  return (
    <main
      className="min-h-screen bg-[var(--theme-bg)] px-4 py-10 text-[var(--theme-text)] transition-colors duration-300 sm:px-6 sm:py-14"
      style={{
        backgroundImage:
          "radial-gradient(circle at 12% 0%, var(--page-glow-gold), transparent 28%), radial-gradient(circle at 88% 8%, var(--page-glow-blue), transparent 30%), linear-gradient(90deg, var(--page-grid-line) 1px, transparent 1px)",
        backgroundSize: "auto, auto, 54px 54px",
      }}
    >
      <section className="mx-auto max-w-4xl">
        <Link
          href={`/topics/${topic.id}/debate`}
          className="inline-flex items-center text-sm font-bold text-[var(--theme-gold)] transition hover:opacity-80"
        >
          ‹ 발언 목록으로 돌아가기
        </Link>

        {query.message ? (
          <FormMessage
            type={query.type === "success" ? "success" : "error"}
            className="mt-6"
          >
            {query.message}
          </FormMessage>
        ) : null}

        <div className="mt-8 overflow-hidden rounded-[2rem] border border-[var(--theme-line)] bg-[var(--theme-panel)] shadow-[var(--shadow-card-strong)] transition duration-300">
          <div
            className={
              canWrite && !isAthena
                ? "border-b border-[var(--theme-line)] bg-[var(--poseidon-surface)] p-8"
                : canWrite && isAthena
                  ? "border-b border-[var(--theme-line)] bg-[var(--athena-surface)] p-8"
                  : "border-b border-[var(--theme-line)] bg-[var(--theme-surface)] p-8"
            }
          >
            <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
              <div className="flex gap-4">
                {canWrite ? (
                  isAthena ? (
                    <AthenaIcon />
                  ) : (
                    <PoseidonIcon />
                  )
                ) : (
                  <BalanceIcon />
                )}

                <div>
                  <span
                    className={`inline-flex rounded-full border px-3 py-1 text-xs font-black ${sideBadgeClass(
                      participation?.assigned_side ?? null,
                    )}`}
                  >
                    {fullSideLabel(participation?.assigned_side ?? null)}
                  </span>

                  <p className="mt-5 text-xs font-black uppercase tracking-[0.28em] text-[var(--theme-gold)]">
                    New Argument
                  </p>

                  <h1 className="mt-3 font-serif text-4xl font-black leading-tight text-[var(--theme-text)] md:text-5xl">
                    새 발언 작성
                  </h1>

                  <p className="mt-4 max-w-2xl text-sm leading-7 text-[var(--theme-muted)]">
                    {topic.title}
                  </p>

                  {topic.description ? (
                    <p className="mt-2 max-w-2xl text-sm leading-7 text-[var(--theme-soft)]">
                      {topic.description}
                    </p>
                  ) : null}

                  {sidePositionInfo ? (
                    <div className="mt-5 max-w-2xl">
                      <p
                        className={`text-xs font-black uppercase tracking-[0.22em] ${sidePositionInfo.titleClass}`}
                      >
                        {sidePositionInfo.title}
                      </p>

                      <p
                        className={`mt-2 whitespace-pre-wrap text-sm leading-8 ${sidePositionInfo.bodyClass}`}
                      >
                        {sidePositionInfo.text}
                      </p>
                    </div>
                  ) : null}
                </div>
              </div>

              {participation?.side_index ? (
                <span className="rounded-full border border-[var(--theme-line)] bg-[var(--theme-surface)] px-3 py-1 text-xs font-black text-[var(--theme-muted)]">
                  익명 {participation.side_index}
                </span>
              ) : (
                <span className="rounded-full border border-[var(--theme-line)] bg-[var(--theme-surface)] px-3 py-1 text-xs font-black text-[var(--theme-muted)]">
                  작성 전
                </span>
              )}
            </div>
          </div>

          <div className="p-6 sm:p-8">
            {canWrite ? (
              <form
                action={createDebatePost}
                encType="multipart/form-data"
                className="space-y-6"
              >
                <input type="hidden" name="topic_id" value={topic.id} />

                <div>
                  <label className="block text-sm font-bold text-[var(--theme-muted)]">
                    제목
                  </label>
                  <input
                    name="title"
                    required
                    minLength={2}
                    className="mt-2 w-full rounded-xl border border-[var(--theme-line)] bg-[var(--theme-surface)] px-4 py-3 text-[var(--theme-text)] outline-none transition placeholder:text-[var(--theme-soft)] focus:border-[var(--theme-gold)]"
                    placeholder="발언 목록에 표시될 제목을 작성하세요."
                  />
                </div>

                <div>
                  <label className="block text-sm font-bold text-[var(--theme-muted)]">
                    내용
                  </label>
                  <textarea
                    name="content"
                    required
                    minLength={5}
                    rows={12}
                    className="mt-2 w-full rounded-xl border border-[var(--theme-line)] bg-[var(--theme-surface)] px-4 py-3 text-[var(--theme-text)] outline-none transition placeholder:text-[var(--theme-soft)] focus:border-[var(--theme-gold)]"
                    placeholder={
                      isAthena
                        ? "아테나 진영의 관점에서 발언 내용을 작성하세요."
                        : "포세이돈 진영의 관점에서 발언 내용을 작성하세요."
                    }
                  />
                </div>

                <ImageUploadPreview />

                <div className="flex flex-col gap-3 sm:flex-row">
                  <PendingSubmitButton
                    pendingText="작성 중..."
                    className={
                      isAthena
                        ? "inline-flex flex-1 items-center justify-center border border-[var(--theme-gold)] bg-[var(--theme-gold)] px-5 py-3 text-sm font-black text-[var(--theme-accent-contrast)] shadow-[var(--shadow-button)] transition duration-300 hover:opacity-85"
                        : "inline-flex flex-1 items-center justify-center border border-[var(--theme-blue)] bg-[var(--theme-blue)] px-5 py-3 text-sm font-black text-[var(--theme-accent-contrast)] shadow-[var(--shadow-button)] transition duration-300 hover:opacity-85"
                    }
                  >
                    발언 기록하기
                  </PendingSubmitButton>

                  <Link
                    href={`/topics/${topic.id}/debate`}
                    className="inline-flex items-center justify-center border border-[var(--theme-line)] bg-[var(--theme-surface)] px-5 py-3 text-sm font-black text-[var(--theme-text)] transition hover:bg-[var(--theme-surface-hover)]"
                  >
                    취소
                  </Link>
                </div>
              </form>
            ) : !user ? (
              <NeedLoginPanel topicId={topic.id} />
            ) : (
              <NeedJoinPanel
                topicId={topic.id}
                canJoin={canJoin}
                status={topic.status}
                isParticipant={isParticipant}
                isSuspended={isSuspended}
                myProfile={myProfile}
              />
            )}
          </div>
        </div>
      </section>
    </main>
  );
}
