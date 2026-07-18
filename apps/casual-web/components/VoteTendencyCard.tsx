import { createClient } from "@/lib/supabase/server";

type VoteTendency = {
  user_id: string | null;
  analyzed_vote_count: number | null;
  majority_vote_count: number | null;
  minority_vote_count: number | null;
  tied_vote_count: number | null;
  majority_rate: number | null;
  minority_rate: number | null;
  tendency: "mainstream" | "minority" | "insufficient" | string | null;
};

const FALLBACK_TENDENCY: VoteTendency = {
  user_id: null,
  analyzed_vote_count: 0,
  majority_vote_count: 0,
  minority_vote_count: 0,
  tied_vote_count: 0,
  majority_rate: 0,
  minority_rate: 0,
  tendency: "insufficient",
};

function getFirstRecord(data: unknown): VoteTendency | null {
  if (Array.isArray(data)) {
    return (data[0] as VoteTendency | undefined) ?? null;
  }

  if (data && typeof data === "object") {
    return data as VoteTendency;
  }

  return null;
}

function getTendencyCopy(tendency: VoteTendency["tendency"]) {
  if (tendency === "mainstream") {
    return {
      label: "주류형",
      description: "다수의 선택과 같은 방향으로 투표한 비율이 더 높아요.",
      badge: "bg-orange-500 text-white",
      panel: "bg-orange-50",
      accent: "bg-orange-500",
    };
  }

  if (tendency === "minority") {
    return {
      label: "비주류형",
      description: "남들과는 다른 선택을 고른 비율이 더 높아요.",
      badge: "bg-stone-950 text-white",
      panel: "bg-stone-50",
      accent: "bg-stone-950",
    };
  }

  return {
    label: "아직 분석 중",
    description: "투표 기록이 조금 더 쌓이면 성향을 보여드릴게요.",
    badge: "bg-stone-100 text-stone-700",
    panel: "bg-orange-50/60",
    accent: "bg-orange-200",
  };
}

function formatCount(value: number | null | undefined) {
  return new Intl.NumberFormat("ko-KR").format(value ?? 0);
}

function formatRate(value: number | null | undefined) {
  const numberValue = Number(value ?? 0);

  if (!Number.isFinite(numberValue)) {
    return "0%";
  }

  const percent = numberValue <= 1 ? numberValue * 100 : numberValue;

  return `${Math.round(percent)}%`;
}

function getRateWidth(value: number | null | undefined) {
  const numberValue = Number(value ?? 0);

  if (!Number.isFinite(numberValue)) {
    return 0;
  }

  const percent = numberValue <= 1 ? numberValue * 100 : numberValue;

  return Math.max(0, Math.min(100, percent));
}

function getChartLabel(label: string) {
  if (label === "아직 분석 중") {
    return "분석 중";
  }

  return label;
}

async function getVoteTendency(userId: string) {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc(
    "get_casual_user_vote_tendency",
    {
      p_user_id: userId,
    },
  );

  if (error) {
    console.error("Failed to load casual user vote tendency:", error.message);
    return FALLBACK_TENDENCY;
  }

  return getFirstRecord(data) ?? FALLBACK_TENDENCY;
}

export async function VoteTendencyCard({
  title = "선택 성향",
  userId,
}: {
  title?: string;
  userId: string;
}) {
  const tendency = await getVoteTendency(userId);
  const copy = getTendencyCopy(tendency.tendency);
  const majorityWidth = getRateWidth(tendency.majority_rate);
  const minorityWidth = getRateWidth(tendency.minority_rate);
  const analyzedVoteCount = Number(tendency.analyzed_vote_count ?? 0);
  const hasChartData =
    tendency.tendency !== "insufficient" &&
    analyzedVoteCount > 0 &&
    majorityWidth + minorityWidth > 0;
  const majorityDeg = hasChartData
    ? Math.round((majorityWidth / (majorityWidth + minorityWidth)) * 360)
    : 0;
  const chartBackground = hasChartData
    ? `conic-gradient(#ea580c 0deg ${majorityDeg}deg, #78716c ${majorityDeg}deg 360deg)`
    : "conic-gradient(#e7e5e4 0deg 360deg)";
  const chartAriaLabel = hasChartData
    ? `주류 선택 ${formatRate(
        tendency.majority_rate,
      )}, 비주류 선택 ${formatRate(tendency.minority_rate)}`
    : "선택 성향을 분석하기에 투표 기록이 부족합니다.";

  return (
    <section className="rounded-3xl border border-orange-100 bg-white p-5 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-sm font-bold tracking-[0.22em] text-orange-700">
            TENDENCY
          </p>
          <h2 className="mt-1 text-2xl font-black">{title}</h2>
        </div>

        <span className={`rounded-full px-3 py-1 text-xs font-black ${copy.badge}`}>
          {copy.label}
        </span>
      </div>

      <div className={`mt-4 rounded-2xl p-4 ${copy.panel}`}>
        <p className="text-sm font-bold leading-6 text-stone-700">
          {copy.description}
        </p>
      </div>

      <div className="mt-5 grid min-w-0 gap-5 lg:grid-cols-[13rem_minmax(0,1fr)] lg:items-center">
        <div className="flex justify-center">
          <div
            aria-label={chartAriaLabel}
            className="relative flex h-44 w-44 shrink-0 items-center justify-center rounded-full p-4 shadow-inner"
            role="img"
            style={{ background: chartBackground }}
          >
            <div className="flex h-full w-full flex-col items-center justify-center rounded-full bg-white text-center shadow-sm">
              <span className={`rounded-full px-3 py-1 text-xs font-black ${copy.badge}`}>
                {getChartLabel(copy.label)}
              </span>
              <span className="mt-2 text-xs font-bold text-stone-500">
                {formatCount(tendency.analyzed_vote_count)}개 분석
              </span>
            </div>
          </div>
        </div>

        <div className="min-w-0 space-y-3">
          <div className="flex min-w-0 items-center justify-between gap-3 rounded-2xl bg-orange-50 px-4 py-3">
            <span className="flex min-w-0 items-center gap-2 text-sm font-black text-orange-800">
              <span className="h-3 w-3 shrink-0 rounded-full bg-orange-600" />
              <span className="truncate">주류 선택</span>
            </span>
            <span className="shrink-0 text-sm font-black text-stone-900">
              {formatRate(tendency.majority_rate)}
            </span>
          </div>

          <div className="flex min-w-0 items-center justify-between gap-3 rounded-2xl bg-stone-50 px-4 py-3">
            <span className="flex min-w-0 items-center gap-2 text-sm font-black text-stone-700">
              <span className="h-3 w-3 shrink-0 rounded-full bg-stone-500" />
              <span className="truncate">비주류 선택</span>
            </span>
            <span className="shrink-0 text-sm font-black text-stone-900">
              {formatRate(tendency.minority_rate)}
            </span>
          </div>
        </div>
      </div>

      <div className="mt-4 grid gap-3 sm:grid-cols-3">
        <div className="rounded-2xl bg-stone-50 p-4">
          <p className="text-xs font-black text-stone-500">분석한 투표</p>
          <p className="mt-2 text-2xl font-black">
            {formatCount(tendency.analyzed_vote_count)}
          </p>
        </div>

        <div className="rounded-2xl bg-orange-50 p-4">
          <p className="text-xs font-black text-orange-700">주류 선택</p>
          <p className="mt-2 text-2xl font-black">
            {formatRate(tendency.majority_rate)}
          </p>
        </div>

        <div className="rounded-2xl bg-stone-50 p-4">
          <p className="text-xs font-black text-stone-600">비주류 선택</p>
          <p className="mt-2 text-2xl font-black">
            {formatRate(tendency.minority_rate)}
          </p>
        </div>
      </div>

      <div className="mt-4 space-y-3">
        <div>
          <div className="flex justify-between gap-3 text-xs font-bold text-stone-500">
            <span>주류 선택</span>
            <span>{formatCount(tendency.majority_vote_count)}개</span>
          </div>
          <div className="mt-1 h-2 overflow-hidden rounded-full bg-stone-100">
            <div
              className={`h-full rounded-full ${copy.accent}`}
              style={{ width: `${majorityWidth}%` }}
            />
          </div>
        </div>

        <div>
          <div className="flex justify-between gap-3 text-xs font-bold text-stone-500">
            <span>비주류 선택</span>
            <span>{formatCount(tendency.minority_vote_count)}개</span>
          </div>
          <div className="mt-1 h-2 overflow-hidden rounded-full bg-stone-100">
            <div
              className="h-full rounded-full bg-stone-400"
              style={{ width: `${minorityWidth}%` }}
            />
          </div>
        </div>
      </div>

      <p className="mt-4 text-xs font-bold leading-5 text-stone-500">
        동률인 주제와 투표 수가 너무 적은 주제는 분석에서 제외됩니다.
      </p>
    </section>
  );
}
