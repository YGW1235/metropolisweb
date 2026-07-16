import Link from "next/link";
import { redirect } from "next/navigation";

import { waterOlive } from "@/app/actions/olive";
import { PendingSubmitButton } from "@/components/pending-submit-button";
import { createClient } from "@/lib/supabase/server";

type OlivePageProps = {
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
  created_at: string | null;
  updated_at: string | null;
};

type OliveLog = {
  id: string;
  watered_on: string;
  created_at: string;
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

function formatDate(value: string | null) {
  if (!value) return "기록 없음";

  return new Intl.DateTimeFormat("ko-KR", {
    timeZone: "Asia/Seoul",
    year: "numeric",
    month: "long",
    day: "numeric",
  }).format(new Date(value));
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

function getOliveStage(totalWaterCount: number) {
  if (totalWaterCount >= 30) {
    return {
      icon: "🏛️🌿",
      title: "시민의 올리브 관",
      description:
        "꾸준한 방문이 시민의 상징이 되었습니다. 메트로폴리스에 깊게 뿌리내린 기록입니다.",
      next: null,
      progressTarget: 30,
    };
  }

  if (totalWaterCount >= 14) {
    return {
      icon: "🌿🌿",
      title: "풍성한 올리브 가지",
      description: "올리브 가지가 풍성하게 자랐습니다. 시민의 정성이 쌓이고 있습니다.",
      next: "30회에 시민의 올리브 관이 됩니다.",
      progressTarget: 30,
    };
  }

  if (totalWaterCount >= 7) {
    return {
      icon: "🌿",
      title: "잎이 난 올리브 가지",
      description: "꾸준한 물 주기로 잎이 선명해졌습니다.",
      next: "14회에 풍성한 올리브 가지가 됩니다.",
      progressTarget: 14,
    };
  }

  if (totalWaterCount >= 3) {
    return {
      icon: "🌱",
      title: "어린 올리브 가지",
      description: "작은 가지가 자라나기 시작했습니다.",
      next: "7회에 잎이 난 올리브 가지가 됩니다.",
      progressTarget: 7,
    };
  }

  if (totalWaterCount >= 1) {
    return {
      icon: "🌱",
      title: "작은 싹",
      description: "첫 물을 머금고 작은 싹이 돋았습니다.",
      next: "3회에 어린 올리브 가지가 됩니다.",
      progressTarget: 3,
    };
  }

  return {
    icon: "◦",
    title: "올리브 씨앗",
    description: "아직 물을 기다리고 있는 작은 씨앗입니다.",
    next: "1회 물을 주면 작은 싹이 됩니다.",
    progressTarget: 1,
  };
}

function OliveStat({
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
    <div className="rounded-2xl border border-[var(--theme-line)] bg-[var(--theme-surface)] p-5 text-center transition duration-300">
      <p className="text-xs font-black uppercase tracking-[0.2em] text-[var(--theme-soft)]">
        {label}
      </p>
      <p className={`mt-3 text-3xl font-black ${valueClass}`}>{value}</p>
    </div>
  );
}

export default async function OlivePage({ searchParams }: OlivePageProps) {
  const query = await searchParams;

  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect(
      `/login?message=${encodeURIComponent(
        "로그인 후 올리브 가지를 확인할 수 있습니다.",
      )}&redirectTo=${encodeURIComponent("/olive")}`,
    );
  }

  const { data: oliveTreeData } = await supabase
    .from("olive_trees")
    .select(
      "total_water_count, streak_count, best_streak_count, last_watered_on, created_at, updated_at",
    )
    .eq("user_id", user.id)
    .maybeSingle();

  const { data: logsData } = await supabase
    .from("olive_watering_logs")
    .select("id, watered_on, created_at")
    .eq("user_id", user.id)
    .order("watered_on", { ascending: false })
    .limit(14);

  const oliveTree = oliveTreeData as OliveTree | null;
  const logs = (logsData ?? []) as OliveLog[];

  const totalWaterCount = oliveTree?.total_water_count ?? 0;
  const streakCount = oliveTree?.streak_count ?? 0;
  const bestStreakCount = oliveTree?.best_streak_count ?? 0;
  const lastWateredOn = oliveTree?.last_watered_on ?? null;

  const today = getKoreaTodayString();
  const alreadyWateredToday = lastWateredOn === today;
  const stage = getOliveStage(totalWaterCount);
  const progressPercent = Math.min(
    100,
    Math.round((totalWaterCount / stage.progressTarget) * 100),
  );

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
        <div className="flex flex-wrap items-center justify-between gap-3">
          <Link
            href="/me"
            className="inline-flex items-center text-sm font-bold text-[var(--theme-gold)] transition hover:opacity-80"
          >
            ‹ 내 기록으로 돌아가기
          </Link>

          <Link
            href="/topics"
            className="inline-flex items-center justify-center border border-[var(--theme-line)] bg-[var(--theme-surface)] px-4 py-2 text-xs font-black text-[var(--theme-text)] transition hover:bg-[var(--theme-surface-hover)]"
          >
            의제 둘러보기
          </Link>
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

        <div className="mt-8 overflow-hidden rounded-[2rem] border border-[var(--theme-line)] bg-[var(--theme-panel-strong)] shadow-[var(--shadow-card-strong)] transition duration-300">
          <div className="grid lg:grid-cols-[0.9fr_1.2fr_0.9fr]">
            <div className="bg-[var(--athena-surface)] p-6 transition-colors duration-300">
              <AthenaIcon />
              <p className="mt-4 text-xs font-black uppercase tracking-[0.28em] text-[var(--theme-gold)]">
                Olive Garden
              </p>
              <h2 className="mt-3 font-serif text-3xl font-black text-[var(--athena-text)]">
                시민의 정원
              </h2>
              <p className="mt-4 text-sm leading-7 text-[var(--athena-muted)]">
                하루 한 번 물을 주며 다시 찾아오는 습관을 만듭니다.
              </p>
            </div>

            <div className="flex flex-col items-center justify-center border-y border-[var(--theme-line)] bg-[var(--theme-panel)] p-6 text-center transition-colors duration-300 lg:border-x lg:border-y-0">
              <p className="text-xs font-black uppercase tracking-[0.28em] text-[var(--theme-gold)]">
                Daily Ritual
              </p>

              <h1 className="mt-4 font-serif text-5xl font-black leading-tight tracking-[0.06em] text-[var(--theme-text)] md:text-6xl">
                올리브 가지
              </h1>

              <p className="mt-5 max-w-2xl text-sm leading-7 text-[var(--theme-muted)]">
                매일 한 번 올리브 가지에 물을 주세요. 연속 기록은 이어지고,
                가지는 조금씩 성장합니다.
              </p>
            </div>

            <div className="bg-[var(--poseidon-surface)] p-6 text-right transition-colors duration-300">
              <div className="flex justify-end">
                <PoseidonIcon />
              </div>
              <p className="mt-4 text-xs font-black uppercase tracking-[0.28em] text-[var(--theme-blue)]">
                Return Current
              </p>
              <h2 className="mt-3 text-3xl font-black text-[var(--poseidon-text)]">
                다시 흐르는 방문
              </h2>
              <p className="mt-4 text-sm leading-7 text-[var(--poseidon-muted)]">
                가벼운 루틴이 다음 토론 참여로 이어지게 만듭니다.
              </p>
            </div>
          </div>
        </div>

        <section className="mt-8 grid gap-8 lg:grid-cols-[0.95fr_1.05fr]">
          <div className="rounded-[2rem] border border-[var(--theme-line)] bg-[var(--theme-panel)] p-6 shadow-[var(--shadow-card)] transition duration-300 sm:p-8">
            <div className="flex flex-col items-center text-center">
              <div className="relative flex h-40 w-40 items-center justify-center">
                {justWatered ? (
                  <>
                    <span className="olive-drop absolute left-10 top-0 text-2xl text-[var(--theme-blue)]">
                      ●
                    </span>
                    <span className="olive-drop absolute left-20 top-2 text-lg text-[var(--theme-blue)] [animation-delay:0.15s]">
                      ●
                    </span>
                    <span className="olive-drop absolute right-10 top-0 text-xl text-[var(--theme-blue)] [animation-delay:0.3s]">
                      ●
                    </span>
                    <span className="olive-sparkle absolute right-4 top-10 text-2xl text-[var(--theme-gold)]">
                      ✦
                    </span>
                    <span className="olive-sparkle absolute bottom-8 left-4 text-xl text-[var(--theme-gold)] [animation-delay:0.25s]">
                      ✧
                    </span>
                  </>
                ) : null}

                <div
                  className={`flex h-32 w-32 items-center justify-center rounded-full border border-[var(--theme-gold)] bg-[var(--athena-surface-soft)] text-6xl shadow-[var(--shadow-athena-icon)] ${
                    justWatered ? "olive-grow" : ""
                  }`}
                >
                  {stage.icon}
                </div>
              </div>

              <p className="mt-6 text-xs font-black uppercase tracking-[0.28em] text-[var(--theme-gold)]">
                Current Stage
              </p>

              <h2 className="mt-3 font-serif text-4xl font-black text-[var(--theme-text)]">
                {stage.title}
              </h2>

              <p className="mt-4 max-w-xl text-sm leading-7 text-[var(--theme-muted)]">
                {stage.description}
              </p>

              {stage.next ? (
                <p className="mt-3 text-xs font-bold text-[var(--theme-soft)]">
                  다음 성장: {stage.next}
                </p>
              ) : (
                <p className="mt-3 text-xs font-bold text-[var(--theme-gold)]">
                  현재 최고 성장 단계입니다.
                </p>
              )}
            </div>

            <div className="mt-8">
              <div className="flex items-center justify-between text-xs font-black text-[var(--theme-soft)]">
                <span>성장도</span>
                <span>{progressPercent}%</span>
              </div>

              <div className="mt-2 h-3 overflow-hidden rounded-full border border-[var(--theme-line)] bg-[var(--theme-surface)]">
                <div
                  className="h-full rounded-full bg-[var(--theme-gold)] transition-all duration-500"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
            </div>

            <form action={waterOlive} className="mt-8">
              <input type="hidden" name="redirect_to" value="/olive" />

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

            <p className="mt-3 text-center text-xs font-bold text-[var(--theme-soft)]">
              기준 시간은 한국 시간입니다.
            </p>
          </div>

          <div className="space-y-8">
            <div className="grid gap-3 sm:grid-cols-3">
              <OliveStat
                label="총 물 주기"
                value={`${totalWaterCount}회`}
                tone="gold"
              />
              <OliveStat label="연속" value={`${streakCount}일`} tone="blue" />
              <OliveStat
                label="최고 기록"
                value={`${bestStreakCount}일`}
                tone="stone"
              />
            </div>

            <div className="rounded-[2rem] border border-[var(--theme-line)] bg-[var(--theme-panel)] p-6 shadow-[var(--shadow-card)] transition duration-300">
              <p className="text-xs font-black uppercase tracking-[0.28em] text-[var(--theme-gold)]">
                Watering Record
              </p>

              <h2 className="mt-3 font-serif text-3xl font-black text-[var(--theme-text)]">
                최근 물 주기 기록
              </h2>

              <p className="mt-2 text-sm leading-7 text-[var(--theme-muted)]">
                최근 14개의 물 주기 기록입니다.
              </p>

              <div className="mt-6 overflow-hidden rounded-2xl border border-[var(--theme-line)]">
                {logs.length ? (
                  logs.map((log) => (
                    <div
                      key={log.id}
                      className="grid grid-cols-[2rem_1fr_8rem] gap-3 border-b border-[var(--theme-line)] bg-[var(--theme-surface)] px-3 py-3 last:border-b-0"
                    >
                      <div className="flex items-center justify-center text-[var(--theme-gold)]">
                        🌿
                      </div>

                      <div>
                        <p className="text-sm font-black text-[var(--theme-text)]">
                          {formatDate(log.watered_on)}
                        </p>
                        <p className="mt-0.5 text-[11px] font-bold text-[var(--theme-soft)]">
                          올리브 가지에 물을 주었습니다.
                        </p>
                      </div>

                      <p className="text-right text-[11px] font-bold text-[var(--theme-soft)]">
                        {formatDateTime(log.created_at)}
                      </p>
                    </div>
                  ))
                ) : (
                  <div className="p-8 text-center">
                    <p className="text-sm text-[var(--theme-muted)]">
                      아직 물 주기 기록이 없습니다.
                    </p>
                  </div>
                )}
              </div>
            </div>

            <div className="rounded-[2rem] border border-[var(--theme-line)] bg-[var(--theme-panel)] p-6 shadow-[var(--shadow-card)] transition duration-300">
              <p className="text-xs font-black uppercase tracking-[0.28em] text-[var(--theme-blue)]">
                Guide
              </p>

              <h2 className="mt-3 font-serif text-3xl font-black text-[var(--theme-text)]">
                성장 단계
              </h2>

              <div className="mt-5 space-y-3 text-sm leading-7 text-[var(--theme-muted)]">
                <p>0회: 올리브 씨앗</p>
                <p>1회: 작은 싹</p>
                <p>3회: 어린 올리브 가지</p>
                <p>7회: 잎이 난 올리브 가지</p>
                <p>14회: 풍성한 올리브 가지</p>
                <p>30회: 시민의 올리브 관</p>
              </div>

              <div className="mt-6 rounded-2xl border border-[var(--theme-line)] bg-[var(--theme-surface)] p-4">
                <p className="text-xs font-black uppercase tracking-[0.22em] text-[var(--theme-soft)]">
                  Last Watered
                </p>
                <p className="mt-2 text-sm font-bold text-[var(--theme-text)]">
                  {formatDate(lastWateredOn)}
                </p>
              </div>
            </div>
          </div>
        </section>
      </section>
    </main>
  );
}
