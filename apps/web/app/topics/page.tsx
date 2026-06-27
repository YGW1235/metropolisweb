import Link from "next/link";

import { createClient } from "@/lib/supabase/server";

type TopicsPageProps = {
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

function getPositionPreview(value: string | null, fallback: string) {
  const trimmed = value?.trim();

  if (!trimmed) {
    return fallback;
  }

  if (trimmed.length <= 120) {
    return trimmed;
  }

  return `${trimmed.slice(0, 120)}...`;
}

function AthenaIcon() {
  return (
    <span className="flex h-12 w-12 items-center justify-center rounded-full border border-[var(--theme-gold)] bg-[var(--athena-surface-soft)] text-2xl text-[var(--athena-text)] shadow-[var(--shadow-athena-icon)] transition-[background-color,box-shadow,color,border-color] duration-300">
      ♜
    </span>
  );
}

function PoseidonIcon() {
  return (
    <span className="flex h-12 w-12 items-center justify-center rounded-full border border-[var(--theme-blue)] bg-[var(--poseidon-surface-soft)] text-2xl text-[var(--poseidon-text)] shadow-[var(--shadow-poseidon-icon)] transition-[background-color,box-shadow,color,border-color] duration-300">
      Ψ
    </span>
  );
}

function getStatusLabel(status: string | null) {
  if (status === "open") return "참가 가능";
  if (status === "active") return "진행 중";
  return "종료";
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

function TopicDuelCard({ topic }: { topic: Topic }) {
  const startDate = formatDate(topic.starts_at);
  const endDate = formatDate(topic.ends_at);

  return (
    <article className="group overflow-hidden rounded-[1.75rem] border border-[var(--theme-line)] bg-[var(--theme-panel)] shadow-[var(--shadow-card)] transition duration-300 hover:-translate-y-1 hover:border-[var(--theme-gold)]">
      <div className="grid lg:grid-cols-[0.85fr_1.3fr_0.85fr]">
        <div
          className="relative min-h-[220px] border-b border-[var(--theme-line)] bg-[var(--athena-surface)] p-5 transition-colors duration-300 lg:border-b-0 lg:border-r"
          style={{
            backgroundImage:
              "radial-gradient(circle at 20% 10%, rgba(255,255,255,0.18), transparent 32%), linear-gradient(135deg, rgba(255,255,255,0.08), transparent 55%)",
          }}
        >
          <div className="relative z-10">
            <AthenaIcon />

            <p className="mt-4 text-xs font-black uppercase tracking-[0.24em] text-[var(--theme-gold)]">
              Athena
            </p>

            <h3 className="mt-2 font-serif text-xl font-black text-[var(--athena-text)]">
              질서의 해석
            </h3>

            <p className="mt-2 line-clamp-4 text-sm leading-7 text-[var(--athena-muted)]">
              {getPositionPreview(
                topic.athena_position,
                "아직 아테나 측 기본 주장이 입력되지 않았습니다.",
              )}
            </p>
          </div>
        </div>

        <div className="relative flex min-h-[260px] flex-col justify-between bg-[var(--theme-panel)] p-6 text-center transition-colors duration-300">
          <div>
            <div className="flex flex-wrap items-center justify-center gap-2">
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

            <p className="mt-6 text-xs font-black uppercase tracking-[0.28em] text-[var(--theme-gold)]">
              Public Motion
            </p>

            <h2 className="mx-auto mt-3 max-w-2xl font-serif text-3xl font-black leading-tight text-[var(--theme-text)] md:text-4xl">
              {topic.title}
            </h2>

            <p className="mx-auto mt-4 whitespace-pre-line break-words max-w-2xl text-sm leading-7 text-[var(--theme-muted)]">
              {topic.description || "아직 설명이 등록되지 않은 의제입니다."}
            </p>
          </div>

          <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Link
              href={`/topics/${topic.id}`}
              className="inline-flex items-center justify-center border border-[var(--theme-gold)] bg-[var(--theme-gold)] px-6 py-3 text-sm font-black text-[var(--theme-bg)] shadow-[var(--shadow-button)] transition duration-300 hover:opacity-85"
            >
              의제 상세 보기
              <span className="ml-3">›</span>
            </Link>

            <Link
              href={`/topics/${topic.id}/debate`}
              className="inline-flex items-center justify-center border border-[var(--theme-blue)] bg-[var(--theme-blue)] px-6 py-3 text-sm font-black text-[var(--theme-bg)] shadow-[var(--shadow-button)] transition duration-300 hover:opacity-85"
            >
              토론장 입장
              <span className="ml-3">›</span>
            </Link>
          </div>
        </div>

        <div
          className="relative min-h-[220px] border-t border-[var(--theme-line)] bg-[var(--poseidon-surface)] p-5 text-right transition-colors duration-300 lg:border-l lg:border-t-0"
          style={{
            backgroundImage:
              "radial-gradient(circle at 82% 12%, rgba(255,255,255,0.16), transparent 32%), linear-gradient(225deg, rgba(255,255,255,0.06), transparent 55%)",
          }}
        >
          <div className="relative z-10 flex flex-col items-end">
            <PoseidonIcon />

            <p className="mt-4 text-xs font-black uppercase tracking-[0.24em] text-[var(--theme-blue)]">
              Poseidon
            </p>

            <h3 className="mt-2 text-xl font-black text-[var(--poseidon-text)]">
              격정의 해석
            </h3>

            <p className="mt-2 line-clamp-4 text-sm leading-7 text-[var(--poseidon-muted)]">
              {getPositionPreview(
                topic.poseidon_position,
                "아직 포세이돈 측 기본 주장이 입력되지 않았습니다.",
              )}
            </p>
          </div>
        </div>
      </div>
    </article>
  );
}

export default async function TopicsPage({ searchParams }: TopicsPageProps) {
  const params = await searchParams;
  const supabase = await createClient();

  const { data: topics, error } = await supabase
    .from("topics")
    .select(
      "id, title, description, status, starts_at, ends_at, created_at, athena_position, poseidon_position",
    )
    .is("deleted_at", null)
    .order("created_at", { ascending: false });

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
          <div className="grid gap-10 lg:grid-cols-[1fr_0.9fr] lg:items-end">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.32em] text-[var(--theme-gold)]">
                Public Motions
              </p>

              <h1 className="mt-4 font-serif text-5xl font-black leading-tight tracking-[0.08em] text-[var(--theme-text)] md:text-7xl">
                도시의 의제
              </h1>

              <p className="mt-5 max-w-2xl text-sm leading-7 text-[var(--theme-muted)]">
                하나의 의제는 두 신의 해석으로 갈라집니다. 아테나는 질서와
                논리를, 포세이돈은 충돌과 자유를 상징합니다. 시민은 그 사이에서
                자신의 입장을 세우고 토론장에 참여합니다.
              </p>
            </div>

            <div className="rounded-[2rem] border border-[var(--theme-line)] bg-[var(--theme-surface)] p-6 shadow-[var(--shadow-card)] backdrop-blur transition duration-300">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="rounded-2xl border border-[var(--theme-line)] bg-[var(--athena-surface-soft)] p-5 transition-colors duration-300">
                  <AthenaIcon />
                  <h2 className="mt-4 font-serif text-2xl font-black text-[var(--athena-text)]">
                    Athena
                  </h2>
                  <p className="mt-2 text-sm leading-6 text-[var(--athena-muted)]">
                    질서, 논리, 절차의 관점에서 의제를 바라봅니다.
                  </p>
                </div>

                <div className="rounded-2xl border border-[var(--theme-line)] bg-[var(--poseidon-surface-soft)] p-5 transition-colors duration-300">
                  <PoseidonIcon />
                  <h2 className="mt-4 text-2xl font-black text-[var(--poseidon-text)]">
                    Poseidon
                  </h2>
                  <p className="mt-2 text-sm leading-6 text-[var(--poseidon-muted)]">
                    충돌, 자유, 변화의 관점에서 의제를 바라봅니다.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {params.message ? (
            <div
              className={
                params.type === "success"
                  ? "mt-8 rounded-2xl border bg-[var(--message-success-bg)] p-4 text-sm font-bold text-[var(--message-success-text)]"
                  : "mt-8 rounded-2xl border bg-[var(--message-error-bg)] p-4 text-sm font-bold text-[var(--message-error-text)]"
              }
              style={{
                borderColor:
                  params.type === "success"
                    ? "var(--message-success-line)"
                    : "var(--message-error-line)",
              }}
            >
              {params.message}
            </div>
          ) : null}

          {error ? (
            <div
              className="mt-8 rounded-2xl border bg-[var(--message-error-bg)] p-4 text-sm font-bold text-[var(--message-error-text)]"
              style={{ borderColor: "var(--message-error-line)" }}
            >
              주제 목록을 불러오지 못했습니다: {error.message}
            </div>
          ) : null}
        </div>
      </section>

      <section className="px-6 py-12">
        <div className="mx-auto max-w-7xl">
          {topics?.length ? (
            <div className="space-y-8">
              {(topics as Topic[]).map((topic) => (
                <TopicDuelCard key={topic.id} topic={topic} />
              ))}
            </div>
          ) : (
            <div className="rounded-[2rem] border border-[var(--theme-line)] bg-[var(--theme-panel)] p-12 text-center shadow-[var(--shadow-card)] transition duration-300">
              <div className="mx-auto flex max-w-xs justify-center gap-4">
                <AthenaIcon />
                <PoseidonIcon />
              </div>

              <h2 className="mt-6 font-serif text-3xl font-black text-[var(--theme-text)]">
                아직 열린 의제가 없습니다
              </h2>

              <p className="mx-auto mt-3 max-w-md text-sm leading-7 text-[var(--theme-muted)]">
                시민들이 참여할 수 있는 토론 주제가 등록되면 이곳에 표시됩니다.
              </p>
            </div>
          )}
        </div>
      </section>
    </main>
  );
}