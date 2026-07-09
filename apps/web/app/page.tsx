import Link from "next/link";

import { createClient } from "@/lib/supabase/server";

type PublicTopic = {
  id: string;
  title: string;
  description: string | null;
  status: string | null;
  created_at: string | null;
  athena_position: string | null;
  poseidon_position: string | null;
};

type TopicParticipant = {
  topic_id: string;
  assigned_side: string | null;
};

type TopicCounts = {
  athena: number;
  poseidon: number;
  total: number;
};

const features = [
  {
    icon: "▥",
    title: "시민의 광장",
    description: "모든 시민의 목소리가 기록되고 존중받는 공론의 장입니다.",
  },
  {
    icon: "▤",
    title: "기록은 역사로",
    description: "오늘의 토론은 내일의 역사가 됩니다. 당신의 생각을 남기세요.",
  },
  {
    icon: "◌",
    title: "대립 속의 발전",
    description: "서로 다른 의견의 충돌이 더 나은 판단을 만들어갑니다.",
  },
];

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

function OliveHomeCta({
  isLoggedIn,
  canWater,
}: {
  isLoggedIn: boolean;
  canWater: boolean;
}) {
  return (
    <section className="border-b border-[var(--theme-line)] bg-[var(--theme-bg)] px-6 py-10">
      <div className="mx-auto max-w-7xl">
        <div className="overflow-hidden rounded-[2rem] border border-[var(--theme-line)] bg-[var(--theme-panel)] shadow-[var(--shadow-card)] transition duration-300">
          <div className="grid gap-0 lg:grid-cols-[0.85fr_1.3fr_0.85fr]">
            <div className="bg-[var(--athena-surface)] p-6">
              <div className="flex h-14 w-14 items-center justify-center rounded-full border border-[var(--theme-gold)] bg-[var(--athena-surface-soft)] text-3xl shadow-[var(--shadow-athena-icon)]">
                🌿
              </div>

              <p className="mt-4 text-xs font-black uppercase tracking-[0.28em] text-[var(--theme-gold)]">
                Daily Olive
              </p>

              <h2 className="mt-3 font-serif text-3xl font-black text-[var(--athena-text)]">
                시민의 정원
              </h2>

              <p className="mt-4 text-sm leading-7 text-[var(--athena-muted)]">
                하루 한 번 올리브 가지에 물을 주며 다시 찾아오는 습관을 만듭니다.
              </p>
            </div>

            <div className="flex flex-col justify-center border-y border-[var(--theme-line)] bg-[var(--theme-panel)] p-6 text-center lg:border-x lg:border-y-0">
              <p className="text-xs font-black uppercase tracking-[0.28em] text-[var(--theme-gold)]">
                Return Ritual
              </p>

              <h2 className="mt-3 font-serif text-4xl font-black tracking-[0.06em] text-[var(--theme-text)]">
                오늘의 올리브 가지
              </h2>

              <p className="mx-auto mt-4 max-w-2xl text-sm leading-7 text-[var(--theme-muted)]">
                토론은 깊게, 방문은 가볍게. 매일 한 번의 물 주기로 시민의 기록을
                이어가세요.
              </p>

              <div className="mt-6 flex flex-col justify-center gap-3 sm:flex-row">
                {isLoggedIn ? (
                  <Link
                    href="/olive"
                    className={
                      canWater
                        ? "inline-flex items-center justify-center border border-[var(--theme-gold)] bg-[var(--theme-gold)] px-7 py-3 text-sm font-black text-[var(--theme-accent-contrast)] shadow-[var(--shadow-button)] transition duration-300 hover:opacity-85"
                        : "inline-flex items-center justify-center border border-[var(--theme-line)] bg-[var(--theme-surface)] px-7 py-3 text-sm font-black text-[var(--theme-text)] shadow-[var(--shadow-button)] transition duration-300 hover:bg-[var(--theme-surface-hover)]"
                    }
                  >
                    {canWater ? "오늘 물 주기 가능" : "오늘의 의식 완료"}
                    <span className="ml-3">›</span>
                  </Link>
                ) : (
                  <Link
                    href={`/login?message=${encodeURIComponent(
                      "로그인 후 올리브 가지에 물을 줄 수 있습니다.",
                    )}&redirectTo=${encodeURIComponent("/olive")}`}
                    className="inline-flex items-center justify-center border border-[var(--theme-gold)] bg-[var(--theme-gold)] px-7 py-3 text-sm font-black text-[var(--theme-accent-contrast)] shadow-[var(--shadow-button)] transition duration-300 hover:opacity-85"
                  >
                    로그인 후 올리브 시작
                    <span className="ml-3">›</span>
                  </Link>
                )}

                <Link
                  href="/topics"
                  className="inline-flex items-center justify-center border border-[var(--theme-line)] bg-[var(--theme-surface)] px-7 py-3 text-sm font-black text-[var(--theme-text)] shadow-[var(--shadow-button)] transition duration-300 hover:bg-[var(--theme-surface-hover)]"
                >
                  의제 둘러보기
                </Link>
              </div>
            </div>

            <div className="bg-[var(--poseidon-surface)] p-6 text-right">
              <div className="ml-auto flex h-14 w-14 items-center justify-center rounded-full border border-[var(--theme-blue)] bg-[var(--poseidon-surface-soft)] text-3xl shadow-[var(--shadow-poseidon-icon)]">
                ◌
              </div>

              <p className="mt-4 text-xs font-black uppercase tracking-[0.28em] text-[var(--theme-blue)]">
                Revisit Flow
              </p>

              <h2 className="mt-3 text-3xl font-black text-[var(--poseidon-text)]">
                다시 흐르는 방문
              </h2>

              <p className="mt-4 text-sm leading-7 text-[var(--poseidon-muted)]">
                가벼운 루틴은 다음 토론 참여로 이어지는 작은 물결이 됩니다.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function getStatusLabel(status: string | null) {
  if (status === "open") return "참가 가능";
  if (status === "active") return "진행 중";
  if (status === "closed") return "종료";
  return "공개";
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

function getPreviewText(
  value: string | null,
  fallback: string,
  maxLength = 110,
) {
  const trimmed = value?.trim();

  if (!trimmed) {
    return fallback;
  }

  if (trimmed.length <= maxLength) {
    return trimmed;
  }

  return `${trimmed.slice(0, maxLength)}...`;
}

function getCountsForTopic(
  participantCounts: Map<string, TopicCounts>,
  topicId: string,
) {
  return (
    participantCounts.get(topicId) ?? {
      athena: 0,
      poseidon: 0,
      total: 0,
    }
  );
}




function AthenaIcon() {
  return (
    <span className="flex h-12 w-12 items-center justify-center rounded-full border border-[var(--theme-gold)] bg-[var(--athena-surface-soft)] text-2xl text-[var(--athena-text)] shadow-[var(--shadow-athena-icon)] transition-shadow duration-300">
      ♜
    </span>
  );
}

function PoseidonIcon() {
  return (
    <span className="flex h-12 w-12 items-center justify-center rounded-full border border-[var(--theme-blue)] bg-[var(--poseidon-surface-soft)] text-2xl text-[var(--poseidon-text)] shadow-[var(--shadow-poseidon-icon)] transition-shadow duration-300">
      Ψ
    </span>
  );
}

function SectionTitle({
  eyebrow,
  title,
  description,
}: {
  eyebrow: string;
  title: string;
  description: string;
}) {
  return (
    <div className="text-center">
      <p className="text-xs font-black uppercase tracking-[0.32em] text-[var(--theme-gold)]">
        {eyebrow}
      </p>
      <h2 className="mt-3 font-serif text-3xl font-black tracking-[0.12em] text-[var(--theme-text)] md:text-4xl">
        {title}
      </h2>
      <p className="mx-auto mt-3 max-w-2xl text-sm leading-7 text-[var(--theme-muted)]">
        {description}
      </p>
    </div>
  );
}

function PublicMotionCard({
  topic,
  counts,
}: {
  topic: PublicTopic;
  counts: TopicCounts;
}) {
  return (
    <article className="group relative overflow-hidden rounded-[2rem] border border-[var(--theme-line)] bg-[var(--theme-panel)] shadow-[var(--shadow-card)] transition duration-300 hover:-translate-y-1 hover:shadow-[var(--shadow-card-strong)]">
      <div
        className="absolute inset-0 opacity-80"
        style={{
          backgroundImage:
            "radial-gradient(circle at 12% 0%, var(--page-glow-gold), transparent 36%), radial-gradient(circle at 88% 0%, var(--page-glow-blue), transparent 36%)",
        }}
      />

      <div className="relative z-10 p-6">
        <div className="flex items-start justify-between gap-4">
          <span
            className={`rounded-full border px-3 py-1 text-xs font-black ${getStatusClass(
              topic.status,
            )}`}
          >
            {getStatusLabel(topic.status)}
          </span>

          <span className="rounded-full border border-[var(--theme-line)] bg-[var(--theme-surface)] px-3 py-1 text-xs font-black text-[var(--theme-muted)]">
            시민 {counts.total}
          </span>
        </div>

        <h3 className="mt-5 font-serif text-2xl font-black leading-tight text-[var(--theme-text)] transition group-hover:text-[var(--theme-gold)]">
          {topic.title}
        </h3>

        <p className="mt-3 line-clamp-2 whitespace-pre-line break-words text-sm leading-7 text-[var(--theme-muted)]">
          {topic.description || "아직 설명이 등록되지 않은 의제입니다."}
        </p>

        <div className="mt-6 grid gap-3">
          <div className="rounded-2xl border border-[var(--theme-gold)] bg-[var(--athena-surface-soft)] p-4">
            <div className="flex items-center gap-3">
              <AthenaIcon />

              <div>
                <p className="text-xs font-black uppercase tracking-[0.22em] text-[var(--theme-gold)]">
                  Athena View
                </p>

                <p className="mt-1 text-xs font-bold text-[var(--theme-soft)]">
                  {counts.athena}명 참여
                </p>
              </div>
            </div>

            <p className="mt-3 line-clamp-3 whitespace-pre-line break-words text-sm leading-7 text-[var(--athena-muted)]">
              {getPreviewText(
                topic.athena_position,
                "아직 아테나 측 기본 입장이 입력되지 않았습니다.",
              )}
            </p>
          </div>

          <div className="rounded-2xl border border-[var(--theme-blue)] bg-[var(--poseidon-surface-soft)] p-4">
            <div className="flex items-center gap-3">
              <PoseidonIcon />

              <div>
                <p className="text-xs font-black uppercase tracking-[0.22em] text-[var(--theme-blue)]">
                  Poseidon View
                </p>

                <p className="mt-1 text-xs font-bold text-[var(--theme-soft)]">
                  {counts.poseidon}명 참여
                </p>
              </div>
            </div>

            <p className="mt-3 line-clamp-3 whitespace-pre-line break-words text-sm leading-7 text-[var(--poseidon-muted)]">
              {getPreviewText(
                topic.poseidon_position,
                "아직 포세이돈 측 기본 입장이 입력되지 않았습니다.",
              )}
            </p>
          </div>
        </div>

        <Link
          href={`/topics/${topic.id}`}
          className="mt-6 inline-flex w-full items-center justify-center border border-[var(--theme-line)] bg-[var(--theme-surface)] px-5 py-3 text-sm font-black text-[var(--theme-text)] shadow-[var(--shadow-button)] transition duration-300 hover:border-[var(--theme-gold)] hover:bg-[var(--theme-surface-hover)]"
        >
          {topic.status === "closed" ? "기록 보기" : "토론 입장하기"}
          <span className="ml-3">›</span>
        </Link>
      </div>
    </article>
  );
}

function PublicMotionsSection({
  topics,
  participantCounts,
}: {
  topics: PublicTopic[];
  participantCounts: Map<string, TopicCounts>;
}) {
  return (
    <section
      id="public-motions"
      className="border-b border-[var(--theme-line)] bg-[var(--theme-bg)] px-6 py-20"
    >
      <div className="mx-auto max-w-7xl">
        <SectionTitle
          eyebrow="Public Motions"
          title="지금 열려 있는 의제"
          description="메트로폴리스에서 실제로 공개된 토론 주제입니다. 각 의제는 아테나와 포세이돈의 두 관점으로 나뉘어 기록됩니다."
        />

        {topics.length ? (
          <div className="mt-10 grid gap-6 lg:grid-cols-3">
            {topics.map((topic) => (
              <PublicMotionCard
                key={topic.id}
                topic={topic}
                counts={getCountsForTopic(participantCounts, topic.id)}
              />
            ))}
          </div>
        ) : (
          <div className="mx-auto mt-10 max-w-2xl rounded-[2rem] border border-[var(--theme-line)] bg-[var(--theme-panel)] p-8 text-center shadow-[var(--shadow-card)]">
            <p className="text-xs font-black uppercase tracking-[0.28em] text-[var(--theme-gold)]">
              No Public Motions
            </p>

            <h3 className="mt-3 font-serif text-3xl font-black text-[var(--theme-text)]">
              아직 공개된 의제가 없습니다
            </h3>

            <p className="mt-3 text-sm leading-7 text-[var(--theme-muted)]">
              관리자가 의제를 공개하면 이곳에 실제 토론 주제가 표시됩니다.
            </p>
          </div>
        )}

        <div className="mt-10 text-center">
          <Link
            href="/topics"
            className="inline-flex items-center justify-center border border-[var(--theme-gold)] bg-[var(--theme-gold)] px-8 py-3 text-sm font-black text-[var(--theme-accent-contrast)] shadow-[var(--shadow-button)] transition duration-300 hover:opacity-85"
          >
            전체 의제 보기
            <span className="ml-3">›</span>
          </Link>
        </div>
      </div>
    </section>
  );
}



export default async function HomePage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  let canWaterOlive = false;

  if (user) {
    const { data: oliveTree } = await supabase
      .from("olive_trees")
      .select("last_watered_on")
      .eq("user_id", user.id)
      .maybeSingle();

    const today = getKoreaTodayString();
    canWaterOlive = oliveTree?.last_watered_on !== today;
  }


  const { data: topicsData } = await supabase
    .from("topics")
    .select(
      "id, title, description, status, created_at, athena_position, poseidon_position",
    )
    .is("deleted_at", null)
    .in("status", ["open", "active", "closed"])
    .order("created_at", { ascending: false })
    .limit(3);

  const publicTopics = (topicsData ?? []) as PublicTopic[];
  const topicIds = publicTopics.map((topic) => topic.id);
  const participantCounts = new Map<string, TopicCounts>();

  for (const topic of publicTopics) {
    participantCounts.set(topic.id, {
      athena: 0,
      poseidon: 0,
      total: 0,
    });
  }

  if (topicIds.length > 0) {
    const { data: participantsData } = await supabase
      .from("topic_participants")
      .select("topic_id, assigned_side")
      .in("topic_id", topicIds);

    const participants = (participantsData ?? []) as TopicParticipant[];

    for (const participant of participants) {
      const current = participantCounts.get(participant.topic_id) ?? {
        athena: 0,
        poseidon: 0,
        total: 0,
      };

      if (participant.assigned_side === "pro") {
        current.athena += 1;
      }

      if (participant.assigned_side === "con") {
        current.poseidon += 1;
      }

      current.total += 1;
      participantCounts.set(participant.topic_id, current);
    }
  }

  return (
    <main className="min-h-screen bg-[var(--theme-bg)] text-[var(--theme-text)] transition-colors duration-300">
      <section
        className="relative min-h-[760px] overflow-hidden border-b border-[var(--theme-line)] bg-cover bg-center"
        style={{
          backgroundImage:
            "var(--theme-bg)), url('/images/athena-poseidon-hero.png')",
        }}
      >
        <div className="absolute inset-y-0 left-1/2 hidden w-px bg-gradient-to-b from-transparent via-[var(--theme-gold)] to-transparent opacity-60 lg:block" />

        <div className="relative z-10 mx-auto flex min-h-[760px] max-w-7xl flex-col justify-end px-6 pb-12 pt-20">
          <div className="mx-auto max-w-3xl text-center">
            <h1 className="hero-title-shadow font-serif text-5xl font-black leading-tight tracking-[0.08em] text-[var(--theme-text)] transition-[text-shadow,color] duration-300 md:text-7xl">
              하나의 의제,
              <br />
              두 신의 대립
            </h1>

            <div className="mx-auto mt-6 flex max-w-lg items-center gap-4">
              <div className="h-px flex-1 bg-[var(--theme-gold)] opacity-80" />
              <span className="hero-symbol-shadow text-[var(--theme-gold)] transition-[text-shadow,color] duration-300">
                ◇
              </span>
              <div className="h-px flex-1 bg-[var(--theme-gold)] opacity-80" />
            </div>

            <p className="hero-text-shadow mx-auto mt-6 max-w-2xl text-base font-semibold leading-8 text-[var(--theme-muted)] transition-[text-shadow,color] duration-300">
              아테나의 지혜와 포세이돈의 힘이 충돌하는 곳. 시민의 생각은
              하나의 의제를 두고 입장이 되고, 발언이 되고, 기록이 됩니다.
            </p>

            <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
              <Link
                href="/topics"
                className="inline-flex items-center justify-center border border-[var(--theme-gold)] bg-[var(--theme-gold)] px-7 py-3 text-sm font-black text-[var(--theme-bg)] shadow-[var(--shadow-button)] transition duration-300 hover:opacity-85"
              >
                의제 보기
                <span className="ml-3">›</span>
              </Link>

              <Link
                href="/me"
                className="inline-flex items-center justify-center border border-[var(--theme-line)] bg-[var(--theme-surface)]/80 px-7 py-3 text-sm font-black text-[var(--theme-text)] shadow-[var(--shadow-button)] backdrop-blur-sm transition duration-300 hover:bg-[var(--theme-surface-hover)]"
              >
                내 기록
              </Link>
            </div>
          </div>

          <div className="mt-12 grid gap-8 lg:grid-cols-[1fr_220px_1fr] lg:items-end">
            <div className="rounded-3xl border border-[var(--theme-line)] bg-[var(--athena-surface-soft)] p-6 text-center shadow-[var(--shadow-card-strong)] backdrop-blur-md transition-shadow duration-300 lg:text-left">
              <div className="flex items-center justify-center gap-4 lg:justify-start">
                <AthenaIcon />
                <div>
                  <p className="text-xs font-black uppercase tracking-[0.28em] text-[var(--theme-gold)]">
                    Wisdom · Order · Reason
                  </p>
                  <h2 className="mt-1 font-serif text-5xl font-black tracking-[0.08em] text-[var(--athena-text)]">
                    ATHENA
                  </h2>
                </div>
              </div>

              <p className="mt-5 text-sm leading-7 text-[var(--athena-muted)]">
                질서 있는 토론은 더 나은 사회를 만듭니다. 논리와 절차를 통해
                진실에 다가갑니다.
              </p>

              <Link
                href="/topics"
                className="mt-6 inline-flex items-center justify-center border border-[var(--theme-gold)] bg-[var(--theme-gold)] px-6 py-3 text-sm font-black text-[var(--theme-bg)] shadow-[var(--shadow-button)] transition duration-300 hover:opacity-85"
              >
                아테나 진영 보기
                <span className="ml-3">›</span>
              </Link>
            </div>

            <div className="hidden lg:block" />

            <div className="rounded-3xl border border-[var(--theme-line)] bg-[var(--poseidon-surface-soft)] p-6 text-center shadow-[var(--shadow-card-strong)] backdrop-blur-md transition-shadow duration-300 lg:text-right">
              <div className="flex items-center justify-center gap-4 lg:justify-end">
                <div>
                  <p className="text-xs font-black uppercase tracking-[0.28em] text-[var(--theme-blue)]">
                    Storm · Force · Freedom
                  </p>
                  <h2 className="mt-1 text-5xl font-black tracking-[0.08em] text-[var(--poseidon-text)]">
                    POSEIDON
                  </h2>
                </div>
                <PoseidonIcon />
              </div>

              <p className="mt-5 text-sm leading-7 text-[var(--poseidon-muted)]">
                충돌 없는 변화는 없습니다. 거센 반론과 자유로운 발언이 새로운
                진실을 만들어냅니다.
              </p>

              <Link
                href="/topics"
                className="mt-6 inline-flex items-center justify-center border border-[var(--theme-blue)] bg-[var(--theme-blue)] px-6 py-3 text-sm font-black text-[var(--theme-bg)] shadow-[var(--shadow-button)] transition duration-300 hover:opacity-85"
              >
                포세이돈 진영 보기
                <span className="ml-3">›</span>
              </Link>
            </div>
          </div>
        </div>
      </section>

      <OliveHomeCta isLoggedIn={Boolean(user)} canWater={canWaterOlive} />

      <PublicMotionsSection
        topics={publicTopics}
        participantCounts={participantCounts}
      />

      <section className="bg-[var(--theme-bg)] px-6 py-12">
        <div className="mx-auto grid max-w-7xl overflow-hidden rounded-xl border border-[var(--theme-line)] bg-[var(--theme-panel)] shadow-[var(--shadow-card)] transition-shadow duration-300 lg:grid-cols-3">
          {features.map((feature) => (
            <div
              key={feature.title}
              className="flex gap-5 border-b border-[var(--theme-line)] p-8 last:border-b-0 lg:border-b-0 lg:border-r lg:last:border-r-0"
            >
              <div className="flex h-16 w-16 shrink-0 items-center justify-center text-4xl text-[var(--theme-gold)]">
                {feature.icon}
              </div>

              <div>
                <h3 className="font-serif text-2xl font-black text-[var(--theme-text)]">
                  {feature.title}
                </h3>
                <p className="mt-2 text-sm leading-6 text-[var(--theme-muted)]">
                  {feature.description}
                </p>
              </div>

              <span className="ml-auto hidden self-center text-2xl text-[var(--theme-gold)] md:block">
                ›
              </span>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}
