import Link from "next/link";
import { notFound, redirect } from "next/navigation";

import { joinTopic } from "@/app/actions/topics";
import { createClient } from "@/lib/supabase/server";

const PAGE_SIZE = 10;

type Topic = {
  id: string;
  title: string;
  description: string | null;
  status: string;
  starts_at: string | null;
  ends_at: string | null;
  created_at: string;
  athena_position: string | null;
  poseidon_position: string | null;
};

type DebatePageProps = {
  params: Promise<{
    topicId: string;
  }>;
  searchParams: Promise<{
    message?: string;
    type?: string;
    side?: string;
    page?: string;
  }>;
};

type DebatePost = {
  id: string;
  title: string;
  side: string | null;
  created_at: string;
  author_id: string;
  image_url: string | null;
};

type Participation = {
  assigned_side: string | null;
  side_index: number | null;
  joined_at: string | null;
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

function SideIcon({ side }: { side: string | null }) {
  if (side === "pro") {
    return (
      <span
        title="아테나 진영"
        aria-label="아테나 진영"
        className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-[var(--theme-gold)] bg-[var(--athena-surface-soft)] text-sm text-[var(--athena-text)]"
      >
        ♜
      </span>
    );
  }

  if (side === "con") {
    return (
      <span
        title="포세이돈 진영"
        aria-label="포세이돈 진영"
        className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-[var(--theme-blue)] bg-[var(--poseidon-surface-soft)] text-sm text-[var(--poseidon-text)]"
      >
        Ψ
      </span>
    );
  }

  return (
    <span
      title="미배정"
      aria-label="미배정"
      className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-[var(--theme-line)] bg-[var(--theme-surface)] text-xs text-[var(--theme-muted)]"
    >
      ?
    </span>
  );
}

function fullSideLabel(side: string | null) {
  if (side === "pro") return "아테나 진영";
  if (side === "con") return "포세이돈 진영";
  return "관전 중";
}

function filterButtonClass(isActive: boolean, side: "all" | "pro" | "con") {
  if (isActive && side === "pro") {
    return "border-[var(--theme-gold)] bg-[var(--theme-gold)] text-[var(--theme-accent-contrast)]";
  }

  if (isActive && side === "con") {
    return "border-[var(--theme-blue)] bg-[var(--theme-blue)] text-[var(--theme-accent-contrast)]";
  }

  if (isActive) {
    return "border-[var(--theme-text)] bg-[var(--theme-text)] text-[var(--theme-bg)]";
  }

  return "border-[var(--theme-line)] bg-[var(--theme-surface)] text-[var(--theme-muted)] hover:bg-[var(--theme-surface-hover)] hover:text-[var(--theme-text)]";
}

function formatDateTime(value: string) {
  return new Date(value).toLocaleString("ko-KR", {
    timeZone: "Asia/Seoul",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function getPositionText(value: string | null, fallback: string) {
  const trimmed = value?.trim();

  if (!trimmed) {
    return fallback;
  }

  return trimmed;
}

function parsePage(value: string | undefined) {
  const page = Number(value);

  if (!Number.isInteger(page) || page < 1) {
    return 1;
  }

  return page;
}

function buildDebateHref(
  topicId: string,
  side: "all" | "pro" | "con",
  page: number,
) {
  const params = new URLSearchParams();

  if (side !== "all") {
    params.set("side", side);
  }

  if (page > 1) {
    params.set("page", String(page));
  }

  const query = params.toString();

  return query
    ? `/topics/${topicId}/debate?${query}`
    : `/topics/${topicId}/debate`;
}

function getPaginationItems(currentPage: number, totalPages: number) {
  const basePages = new Set([
    1,
    2,
    3,
    currentPage - 1,
    currentPage,
    currentPage + 1,
    totalPages - 2,
    totalPages - 1,
    totalPages,
  ]);

  const pages = Array.from(basePages)
    .filter((page) => page >= 1 && page <= totalPages)
    .sort((a, b) => a - b);

  const items: Array<number | string> = [];

  for (const page of pages) {
    const previous = items[items.length - 1];

    if (typeof previous === "number" && page - previous > 1) {
      items.push(`ellipsis-${previous}-${page}`);
    }

    items.push(page);
  }

  return items;
}

function JoinButton({
  topicId,
  side,
  children,
  className,
}: {
  topicId: string;
  side: "auto" | "pro" | "con";
  children: string;
  className: string;
}) {
  return (
    <form action={joinTopic}>
      <input type="hidden" name="topic_id" value={topicId} />
      <input type="hidden" name="side" value={side} />

      <button
        type="submit"
        className={`inline-flex w-full items-center justify-center border px-4 py-2.5 text-xs font-black shadow-[var(--shadow-button)] transition duration-300 hover:opacity-85 ${className}`}
      >
        {children}
      </button>
    </form>
  );
}

function SpectatorPanel({
  topicId,
  userExists,
  canJoin,
}: {
  topicId: string;
  userExists: boolean;
  canJoin: boolean;
}) {
  if (!canJoin) {
    return (
      <div
        id="spectator-mode"
        className="mt-8 rounded-[2rem] border border-[var(--theme-line)] bg-[var(--theme-panel)] p-6 shadow-[var(--shadow-card)] transition duration-300"
      >
        <p className="text-xs font-black uppercase tracking-[0.28em] text-[var(--theme-gold)]">
          Spectator Mode
        </p>
        <h2 className="mt-3 font-serif text-3xl font-black text-[var(--theme-text)]">
          관전 중입니다
        </h2>
        <p className="mt-3 text-sm leading-7 text-[var(--theme-muted)]">
          이 의제는 현재 새 참여가 제한되어 있습니다. 발언과 댓글은 관전할 수
          있습니다.
        </p>
      </div>
    );
  }

  if (!userExists) {
    return (
      <div
        id="spectator-mode"
        className="mt-8 rounded-[2rem] border border-[var(--theme-line)] bg-[var(--theme-panel)] p-6 shadow-[var(--shadow-card)] transition duration-300"
      >
        <p className="text-xs font-black uppercase tracking-[0.28em] text-[var(--theme-gold)]">
          Spectator Mode
        </p>
        <h2 className="mt-3 font-serif text-3xl font-black text-[var(--theme-text)]">
          비로그인 관전 중입니다
        </h2>
        <p className="mt-3 text-sm leading-7 text-[var(--theme-muted)]">
          지금은 게시글과 댓글을 읽을 수 있습니다. 발언을 남기려면 로그인 후
          진영에 참여하세요.
        </p>

        <Link
          href={`/login?message=${encodeURIComponent(
            "로그인 후 진영에 참여할 수 있습니다.",
          )}&redirectTo=${encodeURIComponent(`/topics/${topicId}/debate`)}`}
          className="mt-5 inline-flex items-center justify-center border border-[var(--theme-gold)] bg-[var(--theme-gold)] px-5 py-3 text-sm font-black text-[var(--theme-accent-contrast)] shadow-[var(--shadow-button)] transition duration-300 hover:opacity-85"
        >
          로그인 후 참여
          <span className="ml-2">›</span>
        </Link>
      </div>
    );
  }

  return (
    <div
      id="spectator-mode"
      className="mt-8 rounded-[2rem] border border-[var(--theme-line)] bg-[var(--theme-panel)] p-6 shadow-[var(--shadow-card)] transition duration-300"
    >
      <div className="flex flex-col justify-between gap-5 lg:flex-row lg:items-end">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.28em] text-[var(--theme-gold)]">
            Spectator Mode
          </p>
          <h2 className="mt-3 font-serif text-3xl font-black text-[var(--theme-text)]">
            현재 관전 중입니다
          </h2>
          <p className="mt-3 max-w-2xl text-sm leading-7 text-[var(--theme-muted)]">
            발언과 댓글을 남기려면 진영을 선택해 참여하세요. 자동 배정은 인원이
            적은 진영으로 배정됩니다.
          </p>
        </div>

        <div className="grid gap-2 sm:grid-cols-3 lg:min-w-[480px]">
          <JoinButton
            topicId={topicId}
            side="pro"
            className="border-[var(--theme-gold)] bg-[var(--theme-gold)] text-[var(--theme-accent-contrast)]"
          >
            아테나 선택
          </JoinButton>

          <JoinButton
            topicId={topicId}
            side="auto"
            className="border-[var(--theme-line)] bg-[var(--theme-text)] text-[var(--theme-bg)]"
          >
            자동 배정
          </JoinButton>

          <JoinButton
            topicId={topicId}
            side="con"
            className="border-[var(--theme-blue)] bg-[var(--theme-blue)] text-[var(--theme-accent-contrast)]"
          >
            포세이돈 선택
          </JoinButton>
        </div>
      </div>
    </div>
  );
}

export default async function DebatePage({
  params,
  searchParams,
}: DebatePageProps) {
  const { topicId } = await params;
  const query = await searchParams;

  const activeSide =
    query.side === "pro" || query.side === "con" ? query.side : "all";

  const currentPage = parsePage(query.page);
  const from = (currentPage - 1) * PAGE_SIZE;
  const to = from + PAGE_SIZE - 1;

  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: topic, error: topicError } = await supabase
    .from("topics")
    .select(
      "id, title, description, status, starts_at, ends_at, created_at, athena_position, poseidon_position",
    )
    .eq("id", topicId)
    .is("deleted_at", null)
    .in("status", ["open", "active", "closed"])
    .maybeSingle();

  if (topicError || !topic) {
    notFound();
  }

  let participation: Participation | null = null;

  if (user) {
    const { data } = await supabase
      .from("topic_participants")
      .select("assigned_side, side_index, joined_at")
      .eq("topic_id", topic.id)
      .eq("user_id", user.id)
      .maybeSingle();

    participation = data;
  }

  const { count: proCount } = await supabase
    .from("topic_participants")
    .select("*", { count: "exact", head: true })
    .eq("topic_id", topic.id)
    .eq("assigned_side", "pro");

  const { count: conCount } = await supabase
    .from("topic_participants")
    .select("*", { count: "exact", head: true })
    .eq("topic_id", topic.id)
    .eq("assigned_side", "con");

  let postsQuery = supabase
    .from("debate_posts")
    .select("id, title, side, created_at, author_id, image_url", {
      count: "exact",
    })
    .eq("topic_id", topic.id)
    .eq("status", "visible");

  if (activeSide !== "all") {
    postsQuery = postsQuery.eq("side", activeSide);
  }

  postsQuery = postsQuery
    .order("created_at", { ascending: false })
    .range(from, to);

  const {
    data: posts,
    error: postsError,
    count: postsCount,
  } = await postsQuery;

  const totalPosts = postsCount ?? 0;
  const totalPages = Math.max(1, Math.ceil(totalPosts / PAGE_SIZE));

  if (currentPage > totalPages && totalPosts > 0) {
    redirect(buildDebateHref(topic.id, activeSide, totalPages));
  }

  const { data: participants } = await supabase
    .from("topic_participants")
    .select("user_id, assigned_side, side_index")
    .eq("topic_id", topic.id);

  const authorLabels = new Map<string, string>();

  for (const participant of participants ?? []) {
    const sideName =
      participant.assigned_side === "pro"
        ? "아테나 진영"
        : participant.assigned_side === "con"
          ? "포세이돈 진영"
          : "미배정";

    authorLabels.set(
      participant.user_id,
      `${sideName} 익명 ${participant.side_index}`,
    );
  }

  function authorLabel(userId: string) {
    return authorLabels.get(userId) ?? "익명 참가자";
  }

  const visiblePosts = (posts ?? []) as DebatePost[];
  const paginationItems = getPaginationItems(currentPage, totalPages);
  const canJoin = topic.status === "open" || topic.status === "active";
  const isParticipant = Boolean(participation?.assigned_side);
  const canWrite = Boolean(user) && isParticipant && canJoin;

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
        <Link
          href={`/topics/${topic.id}`}
          className="inline-flex items-center text-sm font-bold text-[var(--theme-gold)] transition hover:opacity-80"
        >
          ‹ 의제 상세로 돌아가기
        </Link>

        {query.message ? (
          <div
            className={
              query.type === "success"
                ? "mt-6 rounded-2xl border bg-[var(--message-success-bg)] p-4 text-sm font-bold text-[var(--message-success-text)]"
                : "mt-6 rounded-2xl border bg-[var(--message-error-bg)] p-4 text-sm font-bold text-[var(--message-error-text)]"
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

        <div className="mt-8 overflow-hidden rounded-[2rem] border border-[var(--theme-line)] bg-[var(--theme-panel-strong)] shadow-[var(--shadow-card-strong)] transition duration-300">
          <div className="grid lg:grid-cols-[1fr_1.25fr_1fr]">
            <div className="bg-[var(--athena-surface)] p-6 transition-colors duration-300">
              <AthenaIcon />

              <p className="mt-4 text-xs font-black uppercase tracking-[0.28em] text-[var(--theme-gold)]">
                Athena Bench
              </p>

              <h2 className="mt-3 font-serif text-3xl font-black text-[var(--athena-text)]">
                질서의 발언석
              </h2>

              <div className="mt-5 border-t border-[var(--theme-gold)] pt-4">
                <p className="text-xs font-black uppercase tracking-[0.22em] text-[var(--theme-gold)]">
                  아테나 측 입장
                </p>

                <p className="mt-3 whitespace-pre-wrap text-sm leading-8 text-[var(--athena-muted)]">
                  {getPositionText(
                    topic.athena_position,
                    "아직 아테나 측 기본 입장이 입력되지 않았습니다.",
                  )}
                </p>
              </div>
            </div>

            <div className="flex flex-col items-center justify-center border-y border-[var(--theme-line)] bg-[var(--theme-panel)] p-6 text-center transition-colors duration-300 lg:border-x lg:border-y-0">
              <span className="rounded-full border border-[var(--theme-line)] bg-[var(--theme-surface)] px-3 py-1 text-xs font-black text-[var(--theme-muted)]">
                {topic.status}
              </span>

              <p className="mt-5 text-xs font-black uppercase tracking-[0.28em] text-[var(--theme-gold)]">
                Central Motion
              </p>

              <h1 className="mt-4 max-w-3xl font-serif text-4xl font-black leading-tight tracking-[0.06em] text-[var(--theme-text)] md:text-5xl">
                {topic.title}
              </h1>

              {topic.description ? (
                <p className="mt-5 max-w-2xl text-sm leading-7 text-[var(--theme-muted)]">
                  {topic.description}
                </p>
              ) : null}

              <div className="mt-8 grid w-full gap-3 sm:grid-cols-3">
                <div className="rounded-2xl border border-[var(--theme-line)] bg-[var(--theme-surface)] p-4 transition-colors duration-300">
                  <p className="text-xs font-black text-[var(--theme-soft)]">
                    현재 상태
                  </p>
                  <p className="mt-2 text-lg font-black text-[var(--theme-text)]">
                    {isParticipant
                      ? fullSideLabel(participation?.assigned_side ?? null)
                      : "관전 중"}
                  </p>
                  <p className="mt-1 text-xs text-[var(--theme-soft)]">
                    {isParticipant
                      ? `익명 ${participation?.side_index}`
                      : "참여 전에도 관전 가능"}
                  </p>
                </div>

                <div className="rounded-2xl border border-[var(--theme-line)] bg-[var(--athena-surface-soft)] p-4 transition-colors duration-300">
                  <p className="text-xs font-black text-[var(--theme-soft)]">
                    아테나
                  </p>
                  <p className="mt-2 text-3xl font-black text-[var(--athena-text)]">
                    {proCount ?? 0}
                  </p>
                </div>

                <div className="rounded-2xl border border-[var(--theme-line)] bg-[var(--poseidon-surface-soft)] p-4 transition-colors duration-300">
                  <p className="text-xs font-black text-[var(--theme-soft)]">
                    포세이돈
                  </p>
                  <p className="mt-2 text-3xl font-black text-[var(--poseidon-text)]">
                    {conCount ?? 0}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-[var(--poseidon-surface)] p-6 text-right transition-colors duration-300">
              <div className="flex justify-end">
                <PoseidonIcon />
              </div>

              <p className="mt-4 text-xs font-black uppercase tracking-[0.28em] text-[var(--theme-blue)]">
                Poseidon Bench
              </p>

              <h2 className="mt-3 text-3xl font-black text-[var(--poseidon-text)]">
                격정의 발언석
              </h2>

              <div className="mt-5 border-t border-[var(--theme-blue)] pt-4">
                <p className="text-xs font-black uppercase tracking-[0.22em] text-[var(--theme-blue)]">
                  포세이돈 측 입장
                </p>

                <p className="mt-3 whitespace-pre-wrap text-sm leading-8 text-[var(--poseidon-muted)]">
                  {getPositionText(
                    topic.poseidon_position,
                    "아직 포세이돈 측 기본 입장이 입력되지 않았습니다.",
                  )}
                </p>
              </div>
            </div>
          </div>
        </div>

        {!isParticipant ? (
          <SpectatorPanel
            topicId={topic.id}
            userExists={Boolean(user)}
            canJoin={canJoin}
          />
        ) : null}

        <section className="mt-8 rounded-[2rem] border border-[var(--theme-line)] bg-[var(--theme-panel)] p-5 shadow-[var(--shadow-card)] transition duration-300 sm:p-6">
          <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-end">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.28em] text-[var(--theme-gold)]">
                Argument Index
              </p>
              <h2 className="mt-2 font-serif text-3xl font-black text-[var(--theme-text)]">
                발언 목록
              </h2>
              <p className="mt-1 text-xs leading-6 text-[var(--theme-soft)]">
                제목을 누르면 상세 내용과 댓글을 볼 수 있습니다.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <span className="w-fit rounded-full border border-[var(--theme-line)] bg-[var(--theme-surface)] px-3 py-1 text-xs font-black text-[var(--theme-muted)]">
                총 {totalPosts}개 · {currentPage}/{totalPages}
              </span>

              {canWrite ? (
                <Link
                  href={`/topics/${topic.id}/debate/new`}
                  className="inline-flex items-center justify-center border border-[var(--theme-gold)] bg-[var(--theme-gold)] px-5 py-2.5 text-sm font-black text-[var(--theme-accent-contrast)] shadow-[var(--shadow-button)] transition duration-300 hover:opacity-85"
                >
                  새 발언 작성
                  <span className="ml-2">›</span>
                </Link>
              ) : user ? (
                <a
                  href="#spectator-mode"
                  className="inline-flex items-center justify-center border border-[var(--theme-line)] bg-[var(--theme-surface)] px-5 py-2.5 text-sm font-black text-[var(--theme-muted)] transition hover:bg-[var(--theme-surface-hover)] hover:text-[var(--theme-text)]"
                >
                  참여 후 작성 가능
                </a>
              ) : (
                <Link
                  href={`/login?message=${encodeURIComponent(
                    "로그인 후 진영에 참여할 수 있습니다.",
                  )}&redirectTo=${encodeURIComponent(`/topics/${topic.id}/debate`)}`}
                  className="inline-flex items-center justify-center border border-[var(--theme-line)] bg-[var(--theme-surface)] px-5 py-2.5 text-sm font-black text-[var(--theme-muted)] transition hover:bg-[var(--theme-surface-hover)] hover:text-[var(--theme-text)]"
                >
                  로그인 후 작성
                </Link>
              )}
            </div>
          </div>

          <div className="mt-5 flex flex-wrap gap-2">
            <Link
              href={buildDebateHref(topic.id, "all", 1)}
              className={`border px-3 py-1.5 text-xs font-black transition ${filterButtonClass(
                activeSide === "all",
                "all",
              )}`}
            >
              전체
            </Link>

            <Link
              href={buildDebateHref(topic.id, "pro", 1)}
              className={`border px-3 py-1.5 text-xs font-black transition ${filterButtonClass(
                activeSide === "pro",
                "pro",
              )}`}
            >
              아테나
            </Link>

            <Link
              href={buildDebateHref(topic.id, "con", 1)}
              className={`border px-3 py-1.5 text-xs font-black transition ${filterButtonClass(
                activeSide === "con",
                "con",
              )}`}
            >
              포세이돈
            </Link>
          </div>

          {postsError ? (
            <div
              className="mt-5 rounded-2xl border bg-[var(--message-error-bg)] p-4 text-sm text-[var(--message-error-text)]"
              style={{ borderColor: "var(--message-error-line)" }}
            >
              게시글을 불러오지 못했습니다: {postsError.message}
            </div>
          ) : null}

          <div className="mt-5 overflow-hidden rounded-2xl border border-[var(--theme-line)]">
            {visiblePosts.length ? (
              visiblePosts.map((post) => (
                <Link
                  key={post.id}
                  href={`/topics/${topic.id}/debate/${post.id}`}
                  className="group grid grid-cols-[2rem_1fr] gap-3 border-b border-[var(--theme-line)] bg-[var(--theme-surface)] px-3 py-2.5 transition last:border-b-0 hover:bg-[var(--theme-surface-hover)] sm:grid-cols-[2rem_1fr_2.5rem_9rem_7rem]"
                >
                  <div className="flex items-center">
                    <SideIcon side={post.side} />
                  </div>

                  <div className="min-w-0">
                    <div className="flex min-w-0 items-center gap-2">
                      <h3 className="min-w-0 truncate text-sm font-bold leading-5 text-[var(--theme-text)] transition group-hover:text-[var(--theme-gold)]">
                        {post.title}
                      </h3>

                      {post.image_url ? (
                        <span
                          title="이미지 첨부됨"
                          aria-label="이미지 첨부됨"
                          className="inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full border border-[var(--theme-gold)] bg-[var(--athena-surface-soft)] text-[10px] font-black text-[var(--theme-gold)] sm:hidden"
                        >
                          ▧
                        </span>
                      ) : null}
                    </div>

                    <p className="mt-0.5 truncate text-[11px] font-bold text-[var(--theme-soft)] sm:hidden">
                      {authorLabel(post.author_id)} ·{" "}
                      {formatDateTime(post.created_at)}
                    </p>
                  </div>

                  <div className="hidden items-center justify-center sm:flex">
                    {post.image_url ? (
                      <span
                        title="이미지 첨부됨"
                        aria-label="이미지 첨부됨"
                        className="inline-flex h-6 w-6 items-center justify-center rounded-full border border-[var(--theme-gold)] bg-[var(--athena-surface-soft)] text-xs font-black text-[var(--theme-gold)]"
                      >
                        ▧
                      </span>
                    ) : (
                      <span className="text-[11px] font-bold text-[var(--theme-soft)]">
                        -
                      </span>
                    )}
                  </div>

                  <p className="hidden truncate text-right text-[11px] font-bold text-[var(--theme-soft)] sm:block">
                    {authorLabel(post.author_id)}
                  </p>

                  <time className="hidden text-right text-[11px] font-bold text-[var(--theme-soft)] sm:block">
                    {formatDateTime(post.created_at)}
                  </time>
                </Link>
              ))
            ) : (
              <div className="p-10 text-center">
                <div className="mx-auto flex justify-center gap-4">
                  <AthenaIcon />
                  <PoseidonIcon />
                </div>

                <h3 className="mt-6 font-serif text-2xl font-black text-[var(--theme-text)]">
                  아직 기록된 발언이 없습니다
                </h3>

                <p className="mt-3 text-sm text-[var(--theme-muted)]">
                  참여자가 첫 번째 발언을 남기면 이곳에 표시됩니다.
                </p>

                {canWrite ? (
                  <Link
                    href={`/topics/${topic.id}/debate/new`}
                    className="mt-6 inline-flex items-center justify-center border border-[var(--theme-gold)] bg-[var(--theme-gold)] px-5 py-2.5 text-sm font-black text-[var(--theme-accent-contrast)] shadow-[var(--shadow-button)] transition duration-300 hover:opacity-85"
                  >
                    새 발언 작성
                    <span className="ml-2">›</span>
                  </Link>
                ) : null}
              </div>
            )}
          </div>

          {totalPages > 1 ? (
            <nav className="mt-5 flex flex-wrap items-center justify-center gap-2">
              {currentPage > 1 ? (
                <Link
                  href={buildDebateHref(topic.id, activeSide, currentPage - 1)}
                  className="border border-[var(--theme-line)] bg-[var(--theme-surface)] px-3 py-2 text-xs font-black text-[var(--theme-muted)] transition hover:bg-[var(--theme-surface-hover)] hover:text-[var(--theme-text)]"
                >
                  이전
                </Link>
              ) : null}

              {paginationItems.map((item) =>
                typeof item === "number" ? (
                  <Link
                    key={item}
                    href={buildDebateHref(topic.id, activeSide, item)}
                    className={
                      item === currentPage
                        ? "border border-[var(--theme-gold)] bg-[var(--theme-gold)] px-3 py-2 text-xs font-black text-[var(--theme-accent-contrast)]"
                        : "border border-[var(--theme-line)] bg-[var(--theme-surface)] px-3 py-2 text-xs font-black text-[var(--theme-muted)] transition hover:bg-[var(--theme-surface-hover)] hover:text-[var(--theme-text)]"
                    }
                  >
                    {item}
                  </Link>
                ) : (
                  <span
                    key={item}
                    className="px-1 py-2 text-xs font-black text-[var(--theme-soft)]"
                  >
                    ...
                  </span>
                ),
              )}

              {currentPage < totalPages ? (
                <Link
                  href={buildDebateHref(topic.id, activeSide, currentPage + 1)}
                  className="border border-[var(--theme-line)] bg-[var(--theme-surface)] px-3 py-2 text-xs font-black text-[var(--theme-muted)] transition hover:bg-[var(--theme-surface-hover)] hover:text-[var(--theme-text)]"
                >
                  다음
                </Link>
              ) : null}
            </nav>
          ) : null}
        </section>
      </section>
    </main>
  );
}