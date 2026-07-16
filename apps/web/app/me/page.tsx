import Link from "next/link";
import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";

import { waterOlive } from "@/app/actions/olive";

import { AccountStatusNotice } from "@/components/account-status-notice";
import { PendingSubmitButton } from "@/components/pending-submit-button";

type Profile = {
  display_name: string | null;
  role: string | null;
  status: string | null;
  status_reason: string | null;
  status_changed_at: string | null;
};

type MePageProps = {
  searchParams: Promise<{
    message?: string;
    type?: string;
  }>;
};

type OliveTree = {
  total_water_count: number;
  streak_count: number;
  best_streak_count: number;
  last_watered_on: string | null;
};

type Participation = {
  topic_id: string;
  assigned_side: string | null;
  side_index: number | null;
  joined_at: string | null;
};

type Topic = {
  id: string;
  title: string;
  status: string | null;
};

type RelatedTopic = {
  id: string;
  title: string;
  status: string | null;
  deleted_at?: string | null;
};

type RelatedPost = {
  id: string;
  title: string;
  status: string | null;
};

type DebatePost = {
  id: string;
  topic_id: string;
  title: string;
  side: string | null;
  created_at: string;
  image_url: string | null;
  topic?: RelatedTopic | null;
};

type DebateComment = {
  id: string;
  topic_id: string;
  post_id: string;
  content: string;
  side: string | null;
  status: string | null;
  created_at: string;
  topic?: RelatedTopic | null;
  post?: RelatedPost | null;
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

function sideLabel(side: string | null) {
  if (side === "pro") return "아테나 진영";
  if (side === "con") return "포세이돈 진영";
  return "미배정";
}

function sideDetailLabel(side: string | null, sideIndex?: number | null) {
  const base = sideLabel(side);

  if (!sideIndex) {
    return base;
  }

  return `${base} 익명 ${sideIndex}`;
}

function statusLabel(status: string | null) {
  if (status === "open") return "참가 가능";
  if (status === "active") return "진행 중";
  if (status === "visible") return "공개";
  if (status === "closed") return "종료";
  if (status === "archived") return "보관";
  return status || "상태 없음";
}

function formatDateTime(value: string | null) {
  if (!value) return "날짜 없음";

  return new Date(value).toLocaleString("ko-KR", {
    timeZone: "Asia/Seoul",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function getTopicTitle(topicMap: Map<string, Topic>, topicId: string) {
  return topicMap.get(topicId)?.title ?? "알 수 없는 의제";
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
    <div className="rounded-2xl border border-[var(--theme-line)] bg-[var(--theme-surface)] p-5 transition duration-300">
      <p className="text-xs font-black uppercase tracking-[0.22em] text-[var(--theme-soft)]">
        {label}
      </p>
      <p className={`mt-3 text-3xl font-black ${valueClass}`}>{value}</p>
    </div>
  );
}

function getKoreaTodayString() {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: "Asia/Seoul",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(new Date());

  const year = parts.find((part) => part.type === "year")?.value;
  const month = parts.find((part) => part.type === "month")?.value;
  const day = parts.find((part) => part.type === "day")?.value;

  return `${year}-${month}-${day}`;
}

function getOliveStage(totalWaterCount: number) {
  if (totalWaterCount >= 30) {
    return {
      icon: "🏛️🌿",
      title: "시민의 올리브 관",
      description: "꾸준한 참여가 시민의 상징이 되었습니다.",
    };
  }

  if (totalWaterCount >= 14) {
    return {
      icon: "🌿🌿",
      title: "풍성한 올리브 가지",
      description: "올리브 가지가 제법 풍성하게 자랐습니다.",
    };
  }

  if (totalWaterCount >= 7) {
    return {
      icon: "🌿",
      title: "잎이 난 올리브 가지",
      description: "꾸준한 물 주기로 잎이 선명해졌습니다.",
    };
  }

  if (totalWaterCount >= 3) {
    return {
      icon: "🌱",
      title: "어린 올리브 가지",
      description: "작은 가지가 자라나기 시작했습니다.",
    };
  }

  if (totalWaterCount >= 1) {
    return {
      icon: "🌱",
      title: "작은 싹",
      description: "첫 물을 머금고 작은 싹이 돋았습니다.",
    };
  }

  return {
    icon: "◦",
    title: "올리브 씨앗",
    description: "아직 물을 기다리고 있는 작은 씨앗입니다.",
  };
}

function OliveStat({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-2xl border border-[var(--theme-line)] bg-[var(--theme-surface)] p-4 text-center">
      <p className="text-xs font-black uppercase tracking-[0.18em] text-[var(--theme-soft)]">
        {label}
      </p>
      <p className="mt-2 text-2xl font-black text-[var(--theme-text)]">
        {value}
      </p>
    </div>
  );
}

function OliveCard({
  oliveTree,
  justWatered,
}: {
  oliveTree: OliveTree | null;
  justWatered: boolean;
}) {
  const totalWaterCount = oliveTree?.total_water_count ?? 0;
  const streakCount = oliveTree?.streak_count ?? 0;
  const bestStreakCount = oliveTree?.best_streak_count ?? 0;
  const lastWateredOn = oliveTree?.last_watered_on ?? null;
  const today = getKoreaTodayString();
  const alreadyWateredToday = lastWateredOn === today;
  const stage = getOliveStage(totalWaterCount);

  return (
    <div className="rounded-[2rem] border border-[var(--theme-line)] bg-[var(--theme-panel)] p-6 shadow-[var(--shadow-card)] transition duration-300">
      <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.28em] text-[var(--theme-gold)]">
            Daily Olive
          </p>

          <h2 className="mt-3 font-serif text-3xl font-black text-[var(--theme-text)]">
            나의 올리브 가지
          </h2>

          <p className="mt-3 text-sm leading-7 text-[var(--theme-muted)]">
            하루에 한 번 올리브 가지에 물을 줄 수 있습니다.
          </p>
        </div>

        <div className="relative flex h-24 w-24 items-center justify-center">
          {justWatered ? (
            <>
              <span className="olive-drop absolute left-7 top-0 text-lg text-[var(--theme-blue)]">
                ●
              </span>
              <span className="olive-drop absolute left-12 top-1 text-sm text-[var(--theme-blue)] [animation-delay:0.15s]">
                ●
              </span>
              <span className="olive-drop absolute right-7 top-0 text-base text-[var(--theme-blue)] [animation-delay:0.3s]">
                ●
              </span>
              <span className="olive-sparkle absolute right-2 top-5 text-xl text-[var(--theme-gold)]">
                ✦
              </span>
              <span className="olive-sparkle absolute bottom-3 left-2 text-lg text-[var(--theme-gold)] [animation-delay:0.25s]">
                ✧
              </span>
            </>
          ) : null}

          <div
            className={`flex h-20 w-20 items-center justify-center rounded-full border border-[var(--theme-gold)] bg-[var(--athena-surface-soft)] text-4xl shadow-[var(--shadow-athena-icon)] ${
              justWatered ? "olive-grow" : ""
            }`}
          >
            {stage.icon}
          </div>
        </div>
      </div>

      <div className="mt-6 rounded-2xl border border-[var(--theme-line)] bg-[var(--athena-surface-soft)] p-5">
        <p className="font-serif text-2xl font-black text-[var(--athena-text)]">
          {stage.title}
        </p>
        <p className="mt-2 text-sm leading-6 text-[var(--athena-muted)]">
          {stage.description}
        </p>
      </div>

      {justWatered ? (
        <div className="mt-4 rounded-2xl border border-[var(--message-success-line)] bg-[var(--message-success-bg)] p-4 text-sm font-bold leading-6 text-[var(--message-success-text)]">
          올리브 가지가 물을 머금었습니다. 내일 다시 찾아오면 연속 기록을 이어갈 수
          있습니다.
        </div>
      ) : null}

      <div className="mt-5 grid gap-3 sm:grid-cols-3">
        <OliveStat label="총 물 주기" value={`${totalWaterCount}회`} />
        <OliveStat label="연속" value={`${streakCount}일`} />
        <OliveStat label="최고 기록" value={`${bestStreakCount}일`} />
      </div>

      <form action={waterOlive} className="mt-6">
        <PendingSubmitButton
          pendingText="물 주는 중..."
          disabled={alreadyWateredToday}
          className="inline-flex w-full items-center justify-center border border-[var(--theme-gold)] bg-[var(--theme-gold)] px-5 py-3 text-sm font-black text-[var(--theme-accent-contrast)] shadow-[var(--shadow-button)] transition duration-300 hover:opacity-85 disabled:cursor-not-allowed disabled:opacity-45"
        >
          {alreadyWateredToday
            ? "오늘은 이미 물을 주었습니다"
            : "오늘의 물 주기"}
        </PendingSubmitButton>
      </form>

      <Link
        href="/olive"
        className="mt-3 inline-flex w-full items-center justify-center border border-[var(--theme-line)] bg-[var(--theme-surface)] px-5 py-3 text-sm font-black text-[var(--theme-text)] transition hover:bg-[var(--theme-surface-hover)]"
      >
        올리브 정원 자세히 보기
        <span className="ml-2">›</span>
      </Link>

      <p className="mt-3 text-center text-xs font-bold text-[var(--theme-soft)]">
        기준 시간은 한국 시간입니다.
      </p>
    </div>
  );
}

export default async function MePage({ searchParams }: MePageProps) {
  const query = await searchParams;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect(`/login?message=${encodeURIComponent("로그인 후 이용할 수 있습니다.")}`);
  }

  const { data: profileData } = await supabase
    .from("profiles")
    .select("display_name, role, status, status_reason, status_changed_at")
    .eq("id", user.id)
    .maybeSingle();

  const profile = profileData as Profile | null;

  const { data: oliveTreeData } = await supabase
    .from("olive_trees")
    .select(
      "total_water_count, streak_count, best_streak_count, last_watered_on",
    )
    .eq("user_id", user.id)
    .maybeSingle();

  const oliveTree = oliveTreeData as OliveTree | null;

  const { data: visibleTopicsData } = await supabase
    .from("topics")
    .select("id, title, status")
    .is("deleted_at", null)
    .in("status", ["open", "active", "closed"]);

  const visibleTopics = (visibleTopicsData ?? []) as Topic[];
  const visibleTopicIds = visibleTopics.map((topic) => topic.id);
  const topicMap = new Map(visibleTopics.map((topic) => [topic.id, topic]));

  let participations: Participation[] = [];
  let posts: DebatePost[] = [];
  let comments: DebateComment[] = [];

  if (visibleTopicIds.length > 0) {
    const { data: participationsData } = await supabase
      .from("topic_participants")
      .select("topic_id, assigned_side, side_index, joined_at")
      .eq("user_id", user.id)
      .in("topic_id", visibleTopicIds)
      .order("joined_at", { ascending: false });

    participations = (participationsData ?? []) as Participation[];

    const { data: postsData } = await supabase
      .from("debate_posts")
      .select("id, topic_id, title, side, created_at, image_url")
      .eq("author_id", user.id)
      .eq("status", "visible")
      .in("topic_id", visibleTopicIds)
      .order("created_at", { ascending: false })
      .limit(8);

    posts = (postsData ?? []) as DebatePost[];

    const { data: commentsData } = await supabase
      .from("debate_comments")
      .select("id, topic_id, post_id, content, side, status, created_at")
      .eq("author_id", user.id)
      .eq("status", "visible")
      .in("topic_id", visibleTopicIds)
      .order("created_at", { ascending: false })
      .limit(30);

    const rawComments = (commentsData ?? []) as DebateComment[];
    const commentPostIds = Array.from(
      new Set(rawComments.map((comment) => comment.post_id)),
    );

    if (commentPostIds.length > 0) {
      const { data: visibleCommentPostsData } = await supabase
        .from("debate_posts")
        .select("id, topic_id, title, status")
        .eq("status", "visible")
        .in("id", commentPostIds)
        .in("topic_id", visibleTopicIds);

      const visibleCommentPostIds = new Set(
        (visibleCommentPostsData ?? []).map((post) => post.id),
      );

      comments = rawComments
        .filter((comment) => visibleCommentPostIds.has(comment.post_id))
        .slice(0, 8);
    }
  }

  const athenaCount = participations.filter(
    (item) => item.assigned_side === "pro",
  ).length;

  const poseidonCount = participations.filter(
    (item) => item.assigned_side === "con",
  ).length;

  const displayName = profile?.display_name?.trim() || "익명의 시민";
  const roleLabel = profile?.role === "admin" ? "관리자" : "시민";
  const status = profile?.status || "active";

  const justWatered =
    query.type === "success" &&
    Boolean(query.message?.includes("올리브 가지에 물을 주었습니다"));

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
        {query.message ? (
          <div
            className={
              query.type === "error"
                ? "mb-6 rounded-2xl border bg-[var(--message-error-bg)] p-4 text-sm font-bold text-[var(--message-error-text)]"
                : "mb-6 rounded-2xl border bg-[var(--message-success-bg)] p-4 text-sm font-bold text-[var(--message-success-text)]"
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

        <AccountStatusNotice
          status={profile?.status}
          reason={profile?.status_reason ?? null}
          changedAt={profile?.status_changed_at ?? null}
        />

        <div className="overflow-hidden rounded-[2rem] border border-[var(--theme-line)] bg-[var(--theme-panel-strong)] shadow-[var(--shadow-card-strong)] transition duration-300">
          <div className="grid lg:grid-cols-[1fr_1.35fr_1fr]">
            <div className="bg-[var(--athena-surface)] p-6 transition-colors duration-300">
              <AthenaIcon />
              <p className="mt-4 text-xs font-black uppercase tracking-[0.28em] text-[var(--theme-gold)]">
                Wisdom Record
              </p>
              <h2 className="mt-3 font-serif text-3xl font-black text-[var(--athena-text)]">
                아테나의 기록
              </h2>
              <p className="mt-4 text-sm leading-7 text-[var(--athena-muted)]">
                질서와 논리로 남긴 참여 기록을 확인합니다.
              </p>
            </div>

            <div className="flex flex-col items-center justify-center border-y border-[var(--theme-line)] bg-[var(--theme-panel)] p-6 text-center transition-colors duration-300 lg:border-x lg:border-y-0">
              <p className="text-xs font-black uppercase tracking-[0.28em] text-[var(--theme-gold)]">
                Citizen Archive
              </p>

              <h1 className="mt-4 max-w-3xl font-serif text-5xl font-black leading-tight tracking-[0.06em] text-[var(--theme-text)] md:text-6xl">
                내 기록
              </h1>

              <p className="mt-5 max-w-2xl text-sm leading-7 text-[var(--theme-muted)]">
                {displayName}님의 참여 진영, 작성한 발언, 남긴 댓글을 한곳에서
                확인합니다.
              </p>

              <div className="mt-8 grid w-full gap-3 sm:grid-cols-3">
                <StatCard
                  label="참여 의제"
                  value={`${participations.length}`}
                  tone="stone"
                />
                <StatCard label="아테나" value={`${athenaCount}`} tone="gold" />
                <StatCard
                  label="포세이돈"
                  value={`${poseidonCount}`}
                  tone="blue"
                />
              </div>
            </div>

            <div className="bg-[var(--poseidon-surface)] p-6 text-right transition-colors duration-300">
              <div className="flex justify-end">
                <PoseidonIcon />
              </div>
              <p className="mt-4 text-xs font-black uppercase tracking-[0.28em] text-[var(--theme-blue)]">
                Storm Record
              </p>
              <h2 className="mt-3 text-3xl font-black text-[var(--poseidon-text)]">
                포세이돈의 기록
              </h2>
              <p className="mt-4 text-sm leading-7 text-[var(--poseidon-muted)]">
                충돌과 반론으로 남긴 흔적을 살펴봅니다.
              </p>
            </div>
          </div>
        </div>

        <section className="mt-8 grid gap-8 lg:grid-cols-[0.82fr_1.18fr]">
          <aside className="space-y-8">
            <OliveCard oliveTree={oliveTree} justWatered={justWatered} />

            <div className="rounded-[2rem] border border-[var(--theme-line)] bg-[var(--theme-panel)] p-6 shadow-[var(--shadow-card)] transition duration-300">
              <p className="text-xs font-black uppercase tracking-[0.28em] text-[var(--theme-gold)]">
                Profile
              </p>
              <h2 className="mt-3 font-serif text-3xl font-black text-[var(--theme-text)]">
                시민 정보
              </h2>

              <div className="mt-6 space-y-3">
                <div className="rounded-2xl border border-[var(--theme-line)] bg-[var(--theme-surface)] p-4">
                  <p className="text-xs font-black text-[var(--theme-soft)]">
                    이름
                  </p>
                  <p className="mt-1 text-lg font-black text-[var(--theme-text)]">
                    {displayName}
                  </p>
                </div>

                <div className="rounded-2xl border border-[var(--theme-line)] bg-[var(--theme-surface)] p-4">
                  <p className="text-xs font-black text-[var(--theme-soft)]">
                    권한
                  </p>
                  <p className="mt-1 text-lg font-black text-[var(--theme-text)]">
                    {roleLabel}
                  </p>
                </div>

                <div className="rounded-2xl border border-[var(--theme-line)] bg-[var(--theme-surface)] p-4">
                  <p className="text-xs font-black text-[var(--theme-soft)]">
                    계정 상태
                  </p>
                  <p className="mt-1 text-lg font-black text-[var(--theme-text)]">
                    {status}
                  </p>
                </div>

                <Link
                  href="/settings/profile"
                  className="inline-flex w-full items-center justify-center border border-[var(--theme-line)] bg-[var(--theme-surface)] px-5 py-3 text-sm font-black text-[var(--theme-text)] transition hover:bg-[var(--theme-surface-hover)]"
                >
                  프로필 설정
                </Link>
                <Link
                  href="/me/password"
                  className="inline-flex w-full items-center justify-center border border-[var(--theme-line)] bg-[var(--theme-surface)] px-5 py-3 text-sm font-black text-[var(--theme-text)] transition hover:bg-[var(--theme-surface-hover)]"
                >
                  비밀번호 변경
                </Link>
                <Link
                  href="/me/delete"
                  className="inline-flex rounded-lg border border-[var(--message-error-line)] px-4 py-2 text-sm font-semibold text-[var(--message-error-text)] transition hover:bg-[var(--message-error-bg)]"
                >
                  계정 탈퇴
                </Link>
              </div>
            </div>

            <div className="rounded-[2rem] border border-[var(--theme-line)] bg-[var(--theme-panel)] p-6 shadow-[var(--shadow-card)] transition duration-300">
              <p className="text-xs font-black uppercase tracking-[0.28em] text-[var(--theme-gold)]">
                Quick Actions
              </p>
              <h2 className="mt-3 font-serif text-3xl font-black text-[var(--theme-text)]">
                바로가기
              </h2>

              <div className="mt-6 grid gap-3">
                <Link
                  href="/topics"
                  className="inline-flex items-center justify-center border border-[var(--theme-gold)] bg-[var(--theme-gold)] px-5 py-3 text-sm font-black text-[var(--theme-accent-contrast)] shadow-[var(--shadow-button)] transition duration-300 hover:opacity-85"
                >
                  의제 둘러보기
                  <span className="ml-2">›</span>
                </Link>

                <Link
                  href="/topics"
                  className="inline-flex items-center justify-center border border-[var(--theme-blue)] bg-[var(--theme-blue)] px-5 py-3 text-sm font-black text-[var(--theme-accent-contrast)] shadow-[var(--shadow-button)] transition duration-300 hover:opacity-85"
                >
                  토론장으로 이동
                  <span className="ml-2">›</span>
                </Link>
              </div>
            </div>
          </aside>

          <div className="space-y-8">
            <section className="rounded-[2rem] border border-[var(--theme-line)] bg-[var(--theme-panel)] p-6 shadow-[var(--shadow-card)] transition duration-300">
              <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
                <div>
                  <p className="text-xs font-black uppercase tracking-[0.28em] text-[var(--theme-gold)]">
                    Joined Motions
                  </p>
                  <h2 className="mt-3 font-serif text-3xl font-black text-[var(--theme-text)]">
                    참여 중인 의제
                  </h2>
                </div>

                <span className="w-fit rounded-full border border-[var(--theme-line)] bg-[var(--theme-surface)] px-3 py-1 text-xs font-black text-[var(--theme-muted)]">
                  {participations.length}개
                </span>
              </div>

              <div className="mt-6 overflow-hidden rounded-2xl border border-[var(--theme-line)]">
                {participations.length ? (
                  participations.map((item) => {
                    const topic = topicMap.get(item.topic_id);

                    return (
                      <Link
                        key={item.topic_id}
                        href={`/topics/${item.topic_id}/debate`}
                        className="group grid grid-cols-[2rem_1fr] gap-3 border-b border-[var(--theme-line)] bg-[var(--theme-surface)] px-3 py-3 transition last:border-b-0 hover:bg-[var(--theme-surface-hover)] sm:grid-cols-[2rem_1fr_7rem_7rem]"
                      >
                        <div className="flex items-center">
                          <SideIcon side={item.assigned_side} />
                        </div>

                        <div className="min-w-0">
                          <h3 className="truncate text-sm font-bold text-[var(--theme-text)] transition group-hover:text-[var(--theme-gold)]">
                            {topic?.title ?? "알 수 없는 의제"}
                          </h3>
                          <p className="mt-0.5 truncate text-[11px] font-bold text-[var(--theme-soft)] sm:hidden">
                            {sideDetailLabel(
                              item.assigned_side,
                              item.side_index,
                            )}{" "}
                            · {formatDateTime(item.joined_at)}
                          </p>
                        </div>

                        <p className="hidden truncate text-right text-[11px] font-bold text-[var(--theme-soft)] sm:block">
                          {sideDetailLabel(item.assigned_side, item.side_index)}
                        </p>

                        <p className="hidden text-right text-[11px] font-bold text-[var(--theme-soft)] sm:block">
                          {statusLabel(topic?.status ?? null)}
                        </p>
                      </Link>
                    );
                  })
                ) : (
                  <div className="p-10 text-center">
                    <div className="mx-auto flex justify-center gap-4">
                      <AthenaIcon />
                      <PoseidonIcon />
                    </div>
                    <h3 className="mt-6 font-serif text-2xl font-black text-[var(--theme-text)]">
                      아직 참여한 의제가 없습니다
                    </h3>
                    <p className="mt-3 text-sm text-[var(--theme-muted)]">
                      의제에 참여하면 이곳에 기록됩니다.
                    </p>
                  </div>
                )}
              </div>
            </section>

            <section className="rounded-[2rem] border border-[var(--theme-line)] bg-[var(--theme-panel)] p-6 shadow-[var(--shadow-card)] transition duration-300">
              <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
                <div>
                  <p className="text-xs font-black uppercase tracking-[0.28em] text-[var(--theme-gold)]">
                    My Arguments
                  </p>
                  <h2 className="mt-3 font-serif text-3xl font-black text-[var(--theme-text)]">
                    내가 쓴 발언
                  </h2>
                </div>

                <span className="w-fit rounded-full border border-[var(--theme-line)] bg-[var(--theme-surface)] px-3 py-1 text-xs font-black text-[var(--theme-muted)]">
                  최근 {posts.length}개
                </span>
              </div>

              <div className="mt-6 overflow-hidden rounded-2xl border border-[var(--theme-line)]">
                {posts.length ? (
                  posts.map((post) => (
                    <Link
                      key={post.id}
                      href={`/topics/${post.topic_id}/debate/${post.id}`}
                      className="group grid grid-cols-[2rem_1fr] gap-3 border-b border-[var(--theme-line)] bg-[var(--theme-surface)] px-3 py-3 transition last:border-b-0 hover:bg-[var(--theme-surface-hover)] sm:grid-cols-[2rem_1fr_2.5rem_7rem]"
                    >
                      <div className="flex items-center">
                        <SideIcon side={post.side} />
                      </div>

                      <div className="min-w-0">
                        <div className="flex min-w-0 items-center gap-2">
                          <h3 className="min-w-0 truncate text-sm font-bold text-[var(--theme-text)] transition group-hover:text-[var(--theme-gold)]">
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

                        <p className="mt-0.5 truncate text-[11px] font-bold text-[var(--theme-soft)]">
                          {getTopicTitle(topicMap, post.topic_id)}
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
                          <span className="text-[11px] font-bold text-[var(--theme-soft)]">-</span>
                        )}
                      </div>

                      <time className="hidden text-right text-[11px] font-bold text-[var(--theme-soft)] sm:block">
                        {formatDateTime(post.created_at)}
                      </time>
                    </Link>
                  ))
                ) : (
                  <div className="p-8 text-center">
                    <p className="text-sm text-[var(--theme-muted)]">
                      아직 작성한 발언이 없습니다.
                    </p>
                  </div>
                )}
              </div>
            </section>

            <section className="rounded-[2rem] border border-[var(--theme-line)] bg-[var(--theme-panel)] p-6 shadow-[var(--shadow-card)] transition duration-300">
              <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
                <div>
                  <p className="text-xs font-black uppercase tracking-[0.28em] text-[var(--theme-blue)]">
                    My Replies
                  </p>
                  <h2 className="mt-3 font-serif text-3xl font-black text-[var(--theme-text)]">
                    내가 남긴 댓글
                  </h2>
                </div>

                <span className="w-fit rounded-full border border-[var(--theme-line)] bg-[var(--theme-surface)] px-3 py-1 text-xs font-black text-[var(--theme-muted)]">
                  최근 {comments.length}개
                </span>
              </div>

              <div className="mt-6 space-y-3">
                {comments.length ? (
                  comments.map((comment) => (
                    <Link
                      key={comment.id}
                      href={`/topics/${comment.topic_id}/debate/${comment.post_id}`}
                      className="group block rounded-2xl border border-[var(--theme-line)] bg-[var(--theme-surface)] p-4 transition hover:bg-[var(--theme-surface-hover)]"
                    >
                      <div className="flex flex-wrap items-center justify-between gap-3">
                        <div className="flex min-w-0 items-center gap-3">
                          <SideIcon side={comment.side} />
                          <div className="min-w-0">
                            <p className="truncate text-sm font-bold text-[var(--theme-text)] transition group-hover:text-[var(--theme-gold)]">
                              {getTopicTitle(topicMap, comment.topic_id)}
                            </p>
                            <p className="mt-0.5 text-[11px] font-bold text-[var(--theme-soft)]">
                              {formatDateTime(comment.created_at)}
                            </p>
                          </div>
                        </div>

                        <span className="rounded-full border border-[var(--theme-line)] bg-[var(--theme-panel)] px-3 py-1 text-[11px] font-black text-[var(--theme-muted)]">
                          {statusLabel(comment.status)}
                        </span>
                      </div>

                      <p className="mt-3 line-clamp-2 whitespace-pre-line break-words text-sm leading-6 text-[var(--theme-muted)]">
                        {comment.content}
                      </p>
                    </Link>
                  ))
                ) : (
                  <div className="rounded-2xl border border-[var(--theme-line)] bg-[var(--theme-surface)] p-8 text-center">
                    <p className="text-sm text-[var(--theme-muted)]">
                      아직 남긴 댓글이 없습니다.
                    </p>
                  </div>
                )}
              </div>
            </section>
          </div>
        </section>
      </section>
    </main>
  );
}
