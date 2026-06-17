import Link from "next/link";
import type { ReactNode } from "react";

const topics = [
  {
    title: "도시의 광장은 누구에게 열려야 하는가?",
    description:
      "공공 토론장에 참여할 수 있는 시민의 범위와 책임에 대해 논의합니다.",
    status: "진행 중",
    participants: 24,
  },
  {
    title: "익명 토론은 더 공정한가?",
    description:
      "익명성이 자유로운 발언을 돕는지, 책임 있는 토론을 방해하는지 다룹니다.",
    status: "모집 중",
    participants: 17,
  },
  {
    title: "운영자는 어디까지 개입해야 하는가?",
    description:
      "토론의 질서를 유지하기 위한 관리자 권한과 시민 자율성의 균형을 살펴봅니다.",
    status: "종료",
    participants: 41,
  },
];

const posts = [
  {
    side: "찬성",
    author: "찬성 익명 1",
    title: "공론장은 넓게 열려야 합니다",
    content:
      "도시는 다양한 의견이 모일 때 더 강해집니다. 참여의 문턱을 낮추되, 명확한 규칙을 함께 세우는 방식이 필요합니다.",
  },
  {
    side: "반대",
    author: "반대 익명 1",
    title: "참여에는 최소한의 책임이 필요합니다",
    content:
      "모든 사람에게 열려 있는 구조는 이상적이지만, 토론의 품질을 유지하려면 일정한 기준과 관리 장치가 필요합니다.",
  },
];

function SectionLabel({ children }: { children: ReactNode }) {
  return (
    <p className="text-xs font-bold uppercase tracking-[0.28em] opacity-70">
      {children}
    </p>
  );
}

export default function StyleVariationsPage() {
  return (
    <main className="min-h-screen bg-neutral-950">
      <section className="border-b border-white/10 bg-neutral-950 px-6 py-10 text-white">
        <div className="mx-auto max-w-6xl">
          <p className="text-sm font-semibold uppercase tracking-[0.3em] text-amber-300">
            Metropolis UI Variations
          </p>
          <h1 className="mt-3 font-serif text-4xl font-bold md:text-5xl">
            고대 그리스 테마 베리에이션
          </h1>
          <p className="mt-4 max-w-3xl text-sm leading-7 text-neutral-300">
            아래 3가지 방향 중 마음에 드는 분위기를 고르면, 그 스타일을
            기준으로 실제 홈, 토픽 목록, 토론방, 관리자 페이지에 적용하면
            됩니다.
          </p>

          <div className="mt-6 flex flex-wrap gap-3 text-sm">
            <a
              href="#variation-marble"
              className="rounded-full border border-white/15 px-4 py-2 text-neutral-200 hover:bg-white/10"
            >
              1. Marble Agora
            </a>
            <a
              href="#variation-night"
              className="rounded-full border border-white/15 px-4 py-2 text-neutral-200 hover:bg-white/10"
            >
              2. Aegean Night
            </a>
            <a
              href="#variation-parchment"
              className="rounded-full border border-white/15 px-4 py-2 text-neutral-200 hover:bg-white/10"
            >
              3. Parchment Archive
            </a>
            <a
              href="#variation-oracle"
              className="rounded-full border border-white/15 px-4 py-2 text-neutral-200 hover:bg-white/10"
            >
              4. Oracle Tribunal
            </a>
            <a
              href="#variation-spartan"
              className="rounded-full border border-white/15 px-4 py-2 text-neutral-200 hover:bg-white/10"
            >
              5. Spartan Assembly
            </a>
            <a
              href="#variation-stoa"
              className="rounded-full border border-white/15 px-4 py-2 text-neutral-200 hover:bg-white/10"
            >
              6. Stoa of Arguments
            </a>
            <a
              href="#variation-amphitheater"
              className="rounded-full border border-white/15 px-4 py-2 text-neutral-200 hover:bg-white/10"
            >
              7. Amphitheater
            </a>
          </div>
        </div>
      </section>

      <VariationMarbleAgora />
      <VariationAegeanNight />
      <VariationParchmentArchive />
      <VariationOracleTribunal />
      <VariationSpartanAssembly />
      <VariationStoaOfArguments />
      <VariationAmphitheater />
    </main>
  );
}

function VariationMarbleAgora() {
  return (
    <section
      id="variation-marble"
      className="min-h-screen bg-[#F7F3EB] text-[#2F2A24]"
    >
      <header
        className="border-b border-[#D8CFC2] bg-[#FFFDF8]"
        style={{
          backgroundImage:
            "linear-gradient(90deg, rgba(166,124,82,0.10) 1px, transparent 1px), linear-gradient(rgba(166,124,82,0.08) 1px, transparent 1px)",
          backgroundSize: "28px 28px",
        }}
      >
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-5">
          <Link
            href="/"
            className="font-serif text-2xl font-bold tracking-[0.18em] text-[#1F3A5F]"
          >
            METROPOLIS
          </Link>

          <nav className="flex items-center gap-3 text-sm">
            <Link
              href="/topics"
              className="rounded-md px-3 py-2 font-medium text-[#5F554C] hover:bg-[#EFE7DA]"
            >
              의제
            </Link>
            <Link
              href="/me"
              className="rounded-md px-3 py-2 font-medium text-[#5F554C] hover:bg-[#EFE7DA]"
            >
              내 계정
            </Link>
            <Link
              href="/login"
              className="rounded-md bg-[#1F3A5F] px-4 py-2 font-semibold text-[#FFFDF8] hover:bg-[#2A4B78]"
            >
              입장하기
            </Link>
          </nav>
        </div>

        <div className="h-2 border-t border-[#C9A66B]/40 bg-[repeating-linear-gradient(90deg,#C9A66B_0,#C9A66B_10px,transparent_10px,transparent_18px)] opacity-70" />
      </header>

      <div className="mx-auto max-w-6xl px-6 py-16">
        <SectionLabel>Variation 01 · Marble Agora</SectionLabel>

        <div className="mt-4 grid gap-10 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
          <div>
            <h2 className="font-serif text-5xl font-bold leading-tight text-[#1F3A5F] md:text-6xl">
              대리석 광장 위의
              <br />
              디지털 공론장
            </h2>

            <p className="mt-6 max-w-2xl text-lg leading-8 text-[#6E655C]">
              가장 균형 잡힌 기본안입니다. 밝은 대리석 배경, 딥 네이비,
              브론즈 포인트를 사용해서 고대 그리스의 공공 광장 느낌을
              현대적인 토론 UI로 재해석합니다.
            </p>

            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                href="/topics"
                className="rounded-md bg-[#1F3A5F] px-5 py-3 text-sm font-semibold text-[#FFFDF8] shadow-sm hover:bg-[#2A4B78]"
              >
                토론 의제 보기
              </Link>
              <Link
                href="/me"
                className="rounded-md border border-[#BFA16A] bg-[#FFFDF8] px-5 py-3 text-sm font-semibold text-[#6F5428] hover:bg-[#F3E8D0]"
              >
                나의 참여 기록
              </Link>
            </div>
          </div>

          <div className="rounded-2xl border border-[#D8CFC2] bg-[#FFFDF8] p-6 shadow-[0_24px_80px_rgba(47,42,36,0.12)]">
            <SectionLabel>Current Assembly</SectionLabel>
            <h3 className="mt-2 font-serif text-2xl font-bold text-[#2F2A24]">
              오늘의 주요 의제
            </h3>

            <div className="mt-5 space-y-4">
              {topics.slice(0, 2).map((topic) => (
                <article
                  key={topic.title}
                  className="rounded-xl border border-[#E3D8C8] bg-[#FBF6EC] p-4"
                >
                  <div className="flex items-center justify-between gap-3">
                    <span className="rounded-full border border-[#BFA16A]/40 bg-[#F3E8D0] px-3 py-1 text-xs font-semibold text-[#6F5428]">
                      {topic.status}
                    </span>
                    <span className="text-xs text-[#7D7168]">
                      참여자 {topic.participants}명
                    </span>
                  </div>

                  <h4 className="mt-4 font-serif text-xl font-bold text-[#1F3A5F]">
                    {topic.title}
                  </h4>

                  <p className="mt-2 text-sm leading-6 text-[#6E655C]">
                    {topic.description}
                  </p>
                </article>
              ))}
            </div>
          </div>
        </div>

        <div className="mt-14 grid gap-5 md:grid-cols-3">
          {topics.map((topic) => (
            <article
              key={topic.title}
              className="group flex min-h-[250px] flex-col rounded-2xl border border-[#D8CFC2] bg-[#FFFDF8] p-5 shadow-sm transition hover:-translate-y-1 hover:shadow-[0_18px_50px_rgba(47,42,36,0.12)]"
            >
              <div className="flex items-center justify-between gap-3">
                <span className="rounded-full border border-[#BFA16A]/40 bg-[#F3E8D0] px-3 py-1 text-xs font-semibold text-[#6F5428]">
                  {topic.status}
                </span>
                <span className="text-xs text-[#7D7168]">
                  {topic.participants} citizens
                </span>
              </div>

              <h3 className="mt-5 font-serif text-2xl font-bold leading-8 text-[#1F3A5F]">
                {topic.title}
              </h3>

              <p className="mt-3 flex-1 text-sm leading-6 text-[#6E655C]">
                {topic.description}
              </p>

              <div className="mt-6 border-t border-[#E3D8C8] pt-4 text-sm font-semibold text-[#1F3A5F] group-hover:underline">
                자세히 보기
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

function VariationAegeanNight() {
  return (
    <section
      id="variation-night"
      className="min-h-screen bg-[#07111F] text-[#F8F1E4]"
    >
      <header
        className="border-b border-[#C9A66B]/25 bg-[#0B1728]"
        style={{
          backgroundImage:
            "radial-gradient(circle at 20% 10%, rgba(201,166,107,0.18), transparent 28%), radial-gradient(circle at 80% 0%, rgba(60,111,170,0.25), transparent 32%)",
        }}
      >
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-5">
          <Link
            href="/"
            className="font-serif text-2xl font-bold tracking-[0.18em] text-[#E7C985]"
          >
            METROPOLIS
          </Link>

          <nav className="flex items-center gap-3 text-sm">
            <Link
              href="/topics"
              className="rounded-md px-3 py-2 font-medium text-[#D8D1C2] hover:bg-white/10"
            >
              의제
            </Link>
            <Link
              href="/me"
              className="rounded-md px-3 py-2 font-medium text-[#D8D1C2] hover:bg-white/10"
            >
              내 계정
            </Link>
            <Link
              href="/login"
              className="rounded-md bg-[#C9A66B] px-4 py-2 font-semibold text-[#07111F] hover:bg-[#E7C985]"
            >
              입장하기
            </Link>
          </nav>
        </div>
      </header>

      <div
        className="mx-auto max-w-6xl px-6 py-16"
        style={{
          backgroundImage:
            "linear-gradient(rgba(201,166,107,0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(201,166,107,0.05) 1px, transparent 1px)",
          backgroundSize: "48px 48px",
        }}
      >
        <SectionLabel>Variation 02 · Aegean Night</SectionLabel>

        <div className="mt-4 grid gap-10 lg:grid-cols-[0.95fr_1.05fr] lg:items-center">
          <div>
            <h2 className="font-serif text-5xl font-bold leading-tight text-[#E7C985] md:text-6xl">
              밤의 에게해,
              <br />
              철학자의 토론장
            </h2>

            <p className="mt-6 max-w-2xl text-lg leading-8 text-[#CFC7B7]">
              더 고급스럽고 진중한 방향입니다. 어두운 남청색 배경에 금빛
              포인트를 사용해서 철학, 의회, 밤의 광장 같은 분위기를 줍니다.
            </p>

            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                href="/topics"
                className="rounded-md bg-[#C9A66B] px-5 py-3 text-sm font-semibold text-[#07111F] hover:bg-[#E7C985]"
              >
                아고라 입장
              </Link>
              <Link
                href="/me"
                className="rounded-md border border-[#C9A66B]/50 bg-white/5 px-5 py-3 text-sm font-semibold text-[#F8F1E4] hover:bg-white/10"
              >
                나의 기록 보기
              </Link>
            </div>
          </div>

          <div className="rounded-2xl border border-[#C9A66B]/25 bg-[#0E1C30]/90 p-6 shadow-[0_24px_90px_rgba(0,0,0,0.45)] backdrop-blur">
            <SectionLabel>Debate Chamber</SectionLabel>
            <h3 className="mt-2 font-serif text-2xl font-bold text-[#F8F1E4]">
              토론 게시글 예시
            </h3>

            <div className="mt-6 space-y-5">
              {posts.map((post) => (
                <article
                  key={post.title}
                  className="rounded-xl border border-white/10 bg-[#101F35] p-5"
                >
                  <div className="flex flex-wrap items-center gap-3">
                    <span
                      className={
                        post.side === "찬성"
                          ? "rounded-full border border-[#7EB6FF]/30 bg-[#12365C] px-3 py-1 text-xs font-semibold text-[#A9D1FF]"
                          : "rounded-full border border-[#F29A8A]/30 bg-[#4A1F25] px-3 py-1 text-xs font-semibold text-[#FFB5AA]"
                      }
                    >
                      {post.side}
                    </span>
                    <span className="text-sm text-[#CFC7B7]">
                      {post.author}
                    </span>
                  </div>

                  <h4 className="mt-4 font-serif text-2xl font-bold text-[#F8F1E4]">
                    {post.title}
                  </h4>

                  <p className="mt-3 text-sm leading-7 text-[#CFC7B7]">
                    {post.content}
                  </p>

                  <div className="mt-5 flex items-center justify-between border-t border-white/10 pt-4 text-xs text-[#AFA594]">
                    <span>댓글 3개</span>
                    <span className="font-semibold text-[#E7C985]">
                      토론 보기
                    </span>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </div>

        <div className="mt-14 grid gap-5 md:grid-cols-3">
          {topics.map((topic) => (
            <article
              key={topic.title}
              className="group rounded-2xl border border-[#C9A66B]/20 bg-[#0E1C30] p-5 transition hover:-translate-y-1 hover:border-[#C9A66B]/50 hover:bg-[#12243D]"
            >
              <div className="flex items-center justify-between gap-3">
                <span className="rounded-full border border-[#C9A66B]/30 bg-[#251F15] px-3 py-1 text-xs font-semibold text-[#E7C985]">
                  {topic.status}
                </span>
                <span className="text-xs text-[#AFA594]">
                  {topic.participants} citizens
                </span>
              </div>

              <h3 className="mt-5 font-serif text-2xl font-bold leading-8 text-[#F8F1E4]">
                {topic.title}
              </h3>

              <p className="mt-3 text-sm leading-6 text-[#CFC7B7]">
                {topic.description}
              </p>

              <div className="mt-6 border-t border-white/10 pt-4 text-sm font-semibold text-[#E7C985] group-hover:underline">
                자세히 보기
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

function VariationParchmentArchive() {
  return (
    <section
      id="variation-parchment"
      className="min-h-screen bg-[#EFE1C6] text-[#35281E]"
      style={{
        backgroundImage:
          "radial-gradient(circle at top left, rgba(137,85,48,0.16), transparent 28%), radial-gradient(circle at bottom right, rgba(111,123,82,0.18), transparent 30%)",
      }}
    >
      <header className="border-b-4 border-double border-[#8B6B3E] bg-[#E6D2AC]">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-5">
          <Link
            href="/"
            className="font-serif text-2xl font-black tracking-[0.16em] text-[#5A3922]"
          >
            METROPOLIS
          </Link>

          <nav className="flex items-center gap-3 text-sm">
            <Link
              href="/topics"
              className="rounded-sm px-3 py-2 font-bold text-[#5F4630] hover:bg-[#D8BE8D]"
            >
              의제
            </Link>
            <Link
              href="/me"
              className="rounded-sm px-3 py-2 font-bold text-[#5F4630] hover:bg-[#D8BE8D]"
            >
              내 계정
            </Link>
            <Link
              href="/login"
              className="rounded-sm bg-[#6F7B52] px-4 py-2 font-bold text-[#FFF8E8] hover:bg-[#5E6A45]"
            >
              참여하기
            </Link>
          </nav>
        </div>
      </header>

      <div className="mx-auto max-w-6xl px-6 py-16">
        <SectionLabel>Variation 03 · Parchment Archive</SectionLabel>

        <div className="mt-4 grid gap-10 lg:grid-cols-[1fr_1fr] lg:items-start">
          <div>
            <h2 className="font-serif text-5xl font-black leading-tight text-[#5A3922] md:text-6xl">
              시민의 발언이
              <br />
              기록되는 두루마리
            </h2>

            <p className="mt-6 max-w-2xl text-lg leading-8 text-[#6B5138]">
              가장 고전적인 느낌이 강한 방향입니다. 양피지, 기록소, 고대
              문서의 분위기를 살려서 토론 게시글이 하나의 기록처럼 보이게
              만듭니다.
            </p>

            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                href="/topics"
                className="rounded-sm bg-[#6F7B52] px-5 py-3 text-sm font-bold text-[#FFF8E8] shadow-sm hover:bg-[#5E6A45]"
              >
                의제 기록 열람
              </Link>
              <Link
                href="/me"
                className="rounded-sm border border-[#8B6B3E] bg-[#F7E8C8] px-5 py-3 text-sm font-bold text-[#5A3922] hover:bg-[#ECD6A8]"
              >
                나의 발언록
              </Link>
            </div>
          </div>

          <div className="rounded-sm border-4 border-double border-[#8B6B3E] bg-[#F7E8C8] p-6 shadow-[10px_10px_0_rgba(90,57,34,0.16)]">
            <SectionLabel>Public Record</SectionLabel>
            <h3 className="mt-2 font-serif text-3xl font-black text-[#5A3922]">
              도시의 의제 목록
            </h3>

            <div className="mt-6 divide-y divide-[#C5A675]">
              {topics.map((topic) => (
                <article key={topic.title} className="py-5 first:pt-0">
                  <div className="flex items-center justify-between gap-3">
                    <span className="rounded-sm border border-[#8B6B3E] bg-[#E6D2AC] px-2.5 py-1 text-xs font-black text-[#5A3922]">
                      {topic.status}
                    </span>
                    <span className="text-xs font-bold text-[#7A5D3E]">
                      {topic.participants} citizens
                    </span>
                  </div>

                  <h4 className="mt-4 font-serif text-2xl font-black text-[#35281E]">
                    {topic.title}
                  </h4>

                  <p className="mt-2 text-sm leading-6 text-[#6B5138]">
                    {topic.description}
                  </p>
                </article>
              ))}
            </div>
          </div>
        </div>

        <div className="mt-14 rounded-sm border-4 border-double border-[#8B6B3E] bg-[#F7E8C8] p-6">
          <SectionLabel>Recorded Arguments</SectionLabel>
          <h3 className="mt-2 font-serif text-3xl font-black text-[#5A3922]">
            토론 기록 예시
          </h3>

          <div className="mt-6 grid gap-5 md:grid-cols-2">
            {posts.map((post) => (
              <article
                key={post.title}
                className="rounded-sm border border-[#C5A675] bg-[#FFF3D6] p-5"
              >
                <div className="flex flex-wrap items-center gap-3">
                  <span
                    className={
                      post.side === "찬성"
                        ? "rounded-sm border border-[#486386] bg-[#D8E3EA] px-3 py-1 text-xs font-black text-[#2D4C73]"
                        : "rounded-sm border border-[#9B5E4A] bg-[#EBD4C6] px-3 py-1 text-xs font-black text-[#84452F]"
                    }
                  >
                    {post.side}
                  </span>
                  <span className="text-sm font-bold text-[#7A5D3E]">
                    {post.author}
                  </span>
                </div>

                <h4 className="mt-4 font-serif text-2xl font-black text-[#35281E]">
                  {post.title}
                </h4>

                <p className="mt-3 text-sm leading-7 text-[#6B5138]">
                  {post.content}
                </p>

                <div className="mt-5 border-t border-[#C5A675] pt-4 text-xs font-bold text-[#7A5D3E]">
                  기록된 댓글 3개
                </div>
              </article>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

function VariationOracleTribunal() {
  return (
    <section
      id="variation-oracle"
      className="min-h-screen overflow-hidden bg-[#120B1F] text-[#F7EEDC]"
    >
      <div
        className="border-b border-[#D8B46A]/25 bg-[#1A102C]"
        style={{
          backgroundImage:
            "radial-gradient(circle at 20% 20%, rgba(168,116,255,0.24), transparent 28%), radial-gradient(circle at 80% 0%, rgba(216,180,106,0.22), transparent 26%)",
        }}
      >
        <header className="mx-auto flex max-w-6xl items-center justify-between px-6 py-5">
          <Link
            href="/"
            className="font-serif text-2xl font-bold tracking-[0.2em] text-[#E7C985]"
          >
            METROPOLIS
          </Link>

          <nav className="flex items-center gap-3 text-sm">
            <Link
              href="/topics"
              className="rounded-full px-3 py-2 font-medium text-[#D8CDEB] hover:bg-white/10"
            >
              신탁 의제
            </Link>
            <Link
              href="/me"
              className="rounded-full px-3 py-2 font-medium text-[#D8CDEB] hover:bg-white/10"
            >
              나의 해석
            </Link>
            <Link
              href="/login"
              className="rounded-full bg-[#E7C985] px-4 py-2 font-semibold text-[#120B1F] hover:bg-[#F3DFA8]"
            >
              회의장 입장
            </Link>
          </nav>
        </header>
      </div>

      <div className="relative mx-auto max-w-6xl px-6 py-16">
        <div className="pointer-events-none absolute left-1/2 top-12 h-72 w-72 -translate-x-1/2 rounded-full bg-[#8E6CFF]/20 blur-3xl" />

        <SectionLabel>Variation 04 · Oracle Tribunal</SectionLabel>

        <div className="relative mt-5 grid gap-10 lg:grid-cols-[1fr_0.9fr] lg:items-center">
          <div>
            <h2 className="font-serif text-5xl font-bold leading-tight text-[#F3DFA8] md:text-6xl">
              신탁은 답하지 않고,
              <br />
              시민은 해석한다
            </h2>

            <p className="mt-6 max-w-2xl text-lg leading-8 text-[#D8CDEB]">
              델포이 신탁에서 영감을 받은 토론장입니다. 의제는 하나의
              예언처럼 제시되고, 사용자는 그 의미를 해석하며 찬성과 반대의
              논리를 쌓아갑니다.
            </p>

            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                href="/topics"
                className="rounded-full bg-[#E7C985] px-5 py-3 text-sm font-semibold text-[#120B1F] hover:bg-[#F3DFA8]"
              >
                오늘의 신탁 보기
              </Link>
              <Link
                href="/me"
                className="rounded-full border border-[#E7C985]/40 bg-white/5 px-5 py-3 text-sm font-semibold text-[#F7EEDC] hover:bg-white/10"
              >
                나의 논증 기록
              </Link>
            </div>
          </div>

          <div className="rounded-[2rem] border border-[#E7C985]/25 bg-[#1C1230]/90 p-6 shadow-[0_30px_100px_rgba(0,0,0,0.55)]">
            <div className="rounded-[1.5rem] border border-[#8E6CFF]/30 bg-[#25163F] p-5">
              <SectionLabel>Oracle Question</SectionLabel>
              <h3 className="mt-3 font-serif text-3xl font-bold text-[#F3DFA8]">
                익명성은 자유를 주는가, 책임을 흐리는가?
              </h3>
              <p className="mt-4 text-sm leading-7 text-[#D8CDEB]">
                이 질문은 단정된 답을 요구하지 않습니다. 각 시민은 자신의
                근거를 제시하고, 타인의 해석에 반론하며, 더 나은 판단에
                가까워집니다.
              </p>
            </div>

            <div className="mt-5 grid gap-3">
              {["문제 제기", "근거 제시", "반론", "재해석"].map((step) => (
                <div
                  key={step}
                  className="flex items-center justify-between rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3"
                >
                  <span className="text-sm font-semibold text-[#F7EEDC]">
                    {step}
                  </span>
                  <span className="text-xs text-[#E7C985]">open</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="relative mt-14 grid gap-5 md:grid-cols-3">
          {topics.map((topic) => (
            <article
              key={topic.title}
              className="group rounded-[1.75rem] border border-[#E7C985]/20 bg-[#1A102C] p-5 transition hover:-translate-y-1 hover:border-[#E7C985]/50 hover:bg-[#21143A]"
            >
              <div className="flex items-center justify-between gap-3">
                <span className="rounded-full border border-[#E7C985]/30 bg-[#2D2417] px-3 py-1 text-xs font-semibold text-[#F3DFA8]">
                  {topic.status}
                </span>
                <span className="text-xs text-[#BCAED6]">
                  {topic.participants} interpreters
                </span>
              </div>

              <h3 className="mt-5 font-serif text-2xl font-bold leading-8 text-[#F7EEDC]">
                {topic.title}
              </h3>

              <p className="mt-3 text-sm leading-6 text-[#D8CDEB]">
                {topic.description}
              </p>

              <div className="mt-6 border-t border-white/10 pt-4 text-sm font-semibold text-[#E7C985] group-hover:underline">
                해석에 참여하기
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

function VariationSpartanAssembly() {
  return (
    <section
      id="variation-spartan"
      className="min-h-screen bg-[#16120F] text-[#F4E7D0]"
    >
      <header className="border-y-4 border-[#8D2E24] bg-[#211A16]">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-5">
          <Link
            href="/"
            className="font-serif text-2xl font-black tracking-[0.22em] text-[#D6A85B]"
          >
            METROPOLIS
          </Link>

          <nav className="flex items-center gap-2 text-sm">
            <Link
              href="/topics"
              className="border border-[#5E4A39] px-3 py-2 font-bold text-[#E8D6B7] hover:border-[#D6A85B]"
            >
              의제
            </Link>
            <Link
              href="/me"
              className="border border-[#5E4A39] px-3 py-2 font-bold text-[#E8D6B7] hover:border-[#D6A85B]"
            >
              기록
            </Link>
            <Link
              href="/login"
              className="bg-[#8D2E24] px-4 py-2 font-bold text-[#FFF3DD] hover:bg-[#A93B30]"
            >
              참가
            </Link>
          </nav>
        </div>
      </header>

      <div className="mx-auto max-w-6xl px-6 py-16">
        <SectionLabel>Variation 05 · Spartan Assembly</SectionLabel>

        <div className="mt-5 grid gap-8 lg:grid-cols-[0.85fr_1.15fr] lg:items-start">
          <div className="border-l-8 border-[#8D2E24] bg-[#211A16] p-7">
            <h2 className="font-serif text-5xl font-black leading-tight text-[#D6A85B] md:text-6xl">
              짧게 말하고,
              <br />
              강하게 증명하라
            </h2>

            <p className="mt-6 text-lg leading-8 text-[#D8C5A8]">
              스파르타식 회의장 컨셉입니다. 장식은 줄이고, 발언의 핵심과
              입장을 강하게 드러냅니다. 진지하고 엄격한 토론 서비스에 잘
              어울립니다.
            </p>

            <div className="mt-8 grid grid-cols-2 gap-3 text-center text-sm font-bold">
              <div className="border border-[#5E4A39] bg-[#18130F] p-4">
                <p className="text-3xl text-[#D6A85B]">24</p>
                <p className="mt-1 text-[#B7A58C]">참여 시민</p>
              </div>
              <div className="border border-[#5E4A39] bg-[#18130F] p-4">
                <p className="text-3xl text-[#D6A85B]">2</p>
                <p className="mt-1 text-[#B7A58C]">입장 진영</p>
              </div>
            </div>
          </div>

          <div className="grid gap-4">
            {topics.map((topic, index) => (
              <article
                key={topic.title}
                className="grid gap-4 border border-[#5E4A39] bg-[#211A16] p-5 md:grid-cols-[80px_1fr_auto] md:items-center"
              >
                <div className="flex h-16 w-16 items-center justify-center border-2 border-[#8D2E24] font-serif text-2xl font-black text-[#D6A85B]">
                  {String(index + 1).padStart(2, "0")}
                </div>

                <div>
                  <div className="mb-2 flex flex-wrap items-center gap-2">
                    <span className="bg-[#8D2E24] px-2.5 py-1 text-xs font-black text-[#FFF3DD]">
                      {topic.status}
                    </span>
                    <span className="text-xs font-bold text-[#B7A58C]">
                      {topic.participants} citizens
                    </span>
                  </div>

                  <h3 className="font-serif text-2xl font-black text-[#F4E7D0]">
                    {topic.title}
                  </h3>

                  <p className="mt-2 text-sm leading-6 text-[#C8B69A]">
                    {topic.description}
                  </p>
                </div>

                <Link
                  href="/topics"
                  className="border border-[#D6A85B] px-4 py-3 text-center text-sm font-black text-[#D6A85B] hover:bg-[#D6A85B] hover:text-[#16120F]"
                >
                  입장
                </Link>
              </article>
            ))}
          </div>
        </div>

        <div className="mt-14 grid gap-5 md:grid-cols-2">
          {posts.map((post) => (
            <article
              key={post.title}
              className="border-t-8 border-[#8D2E24] bg-[#211A16] p-6"
            >
              <div className="flex flex-wrap items-center gap-3">
                <span
                  className={
                    post.side === "찬성"
                      ? "bg-[#253E5C] px-3 py-1 text-xs font-black text-[#BBD7FF]"
                      : "bg-[#5C2721] px-3 py-1 text-xs font-black text-[#FFC0B7]"
                  }
                >
                  {post.side}
                </span>
                <span className="text-sm font-bold text-[#B7A58C]">
                  {post.author}
                </span>
              </div>

              <h3 className="mt-4 font-serif text-3xl font-black text-[#F4E7D0]">
                {post.title}
              </h3>

              <p className="mt-3 text-sm leading-7 text-[#C8B69A]">
                {post.content}
              </p>

              <div className="mt-5 border-t border-[#5E4A39] pt-4 text-xs font-black uppercase tracking-[0.2em] text-[#D6A85B]">
                respond / challenge / defend
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

function VariationStoaOfArguments() {
  return (
    <section
      id="variation-stoa"
      className="min-h-screen bg-[#EDE8DC] text-[#2C2B27]"
    >
      <header className="border-b border-[#B9AD95] bg-[#F8F4EA]">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-5">
          <Link
            href="/"
            className="font-serif text-2xl font-bold tracking-[0.18em] text-[#28415E]"
          >
            METROPOLIS
          </Link>

          <nav className="flex items-center gap-3 text-sm">
            <Link
              href="/topics"
              className="rounded-md px-3 py-2 font-semibold text-[#5E594F] hover:bg-[#E1D7C2]"
            >
              회랑
            </Link>
            <Link
              href="/me"
              className="rounded-md px-3 py-2 font-semibold text-[#5E594F] hover:bg-[#E1D7C2]"
            >
              발언록
            </Link>
            <Link
              href="/login"
              className="rounded-md bg-[#28415E] px-4 py-2 font-semibold text-white hover:bg-[#365677]"
            >
              토론 참여
            </Link>
          </nav>
        </div>
      </header>

      <div className="mx-auto max-w-6xl px-6 py-16">
        <SectionLabel>Variation 06 · Stoa of Arguments</SectionLabel>

        <div className="mt-5 rounded-[2rem] border border-[#B9AD95] bg-[#F8F4EA] p-6 shadow-[0_25px_80px_rgba(44,43,39,0.12)]">
          <div className="grid gap-8 lg:grid-cols-[0.9fr_1.1fr] lg:items-center">
            <div>
              <h2 className="font-serif text-5xl font-bold leading-tight text-[#28415E] md:text-6xl">
                회랑을 걸으며
                <br />
                논거를 마주하다
              </h2>

              <p className="mt-6 text-lg leading-8 text-[#655F52]">
                스토아 철학의 회랑에서 영감을 받은 디자인입니다. 사용자는
                여러 의제를 지나가며 입장, 근거, 반론을 차례로 확인합니다.
                차분하고 지적인 느낌이 강합니다.
              </p>
            </div>

            <div className="grid grid-cols-4 gap-3">
              {["질문", "입장", "근거", "반론"].map((label) => (
                <div key={label} className="text-center">
                  <div className="mx-auto h-28 w-10 rounded-t-full border border-[#B9AD95] bg-[#E1D7C2]" />
                  <div className="border-x border-b border-[#B9AD95] bg-[#FFFDF7] px-2 py-3 text-xs font-bold text-[#6D5B37]">
                    {label}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-10 h-3 rounded-full bg-[repeating-linear-gradient(90deg,#B9AD95_0,#B9AD95_12px,transparent_12px,transparent_24px)] opacity-70" />
        </div>

        <div className="mt-10 grid gap-5 md:grid-cols-3">
          {topics.map((topic) => (
            <article
              key={topic.title}
              className="group relative overflow-hidden rounded-2xl border border-[#B9AD95] bg-[#FFFDF7] p-5 transition hover:-translate-y-1 hover:shadow-[0_18px_45px_rgba(44,43,39,0.14)]"
            >
              <div className="absolute left-0 top-0 h-full w-2 bg-[#28415E]" />

              <div className="pl-3">
                <div className="flex items-center justify-between gap-3">
                  <span className="rounded-md border border-[#B9AD95] bg-[#EDE8DC] px-3 py-1 text-xs font-bold text-[#6D5B37]">
                    {topic.status}
                  </span>
                  <span className="text-xs text-[#7A7468]">
                    {topic.participants}명
                  </span>
                </div>

                <h3 className="mt-5 font-serif text-2xl font-bold leading-8 text-[#28415E]">
                  {topic.title}
                </h3>

                <p className="mt-3 text-sm leading-6 text-[#655F52]">
                  {topic.description}
                </p>

                <div className="mt-6 border-t border-[#D7CCB7] pt-4 text-sm font-bold text-[#28415E] group-hover:underline">
                  회랑에서 논의하기
                </div>
              </div>
            </article>
          ))}
        </div>

        <div className="mt-12 grid gap-5 md:grid-cols-2">
          {posts.map((post) => (
            <article
              key={post.title}
              className="rounded-2xl border border-[#B9AD95] bg-[#F8F4EA] p-6"
            >
              <div className="flex flex-wrap items-center gap-3">
                <span
                  className={
                    post.side === "찬성"
                      ? "rounded-md bg-[#DDE8F2] px-3 py-1 text-xs font-bold text-[#28415E]"
                      : "rounded-md bg-[#EBDAD1] px-3 py-1 text-xs font-bold text-[#8A4938]"
                  }
                >
                  {post.side}
                </span>
                <span className="text-sm font-semibold text-[#655F52]">
                  {post.author}
                </span>
              </div>

              <h3 className="mt-4 font-serif text-2xl font-bold text-[#2C2B27]">
                {post.title}
              </h3>

              <p className="mt-3 text-sm leading-7 text-[#655F52]">
                {post.content}
              </p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

function VariationAmphitheater() {
  return (
    <section
      id="variation-amphitheater"
      className="min-h-screen bg-[#0D1821] text-[#F6EBD7]"
    >
      <header className="border-b border-[#D59E5D]/25 bg-[#101F2C]">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-5">
          <Link
            href="/"
            className="font-serif text-2xl font-bold tracking-[0.18em] text-[#D59E5D]"
          >
            METROPOLIS
          </Link>

          <nav className="flex items-center gap-3 text-sm">
            <Link
              href="/topics"
              className="rounded-md px-3 py-2 font-medium text-[#D6C8B7] hover:bg-white/10"
            >
              무대
            </Link>
            <Link
              href="/me"
              className="rounded-md px-3 py-2 font-medium text-[#D6C8B7] hover:bg-white/10"
            >
              내 발언
            </Link>
            <Link
              href="/login"
              className="rounded-md bg-[#D59E5D] px-4 py-2 font-semibold text-[#0D1821] hover:bg-[#E8B876]"
            >
              발언하기
            </Link>
          </nav>
        </div>
      </header>

      <div
        className="mx-auto max-w-6xl px-6 py-16"
        style={{
          backgroundImage:
            "radial-gradient(ellipse at center top, rgba(213,158,93,0.24), transparent 38%)",
        }}
      >
        <SectionLabel>Variation 07 · Amphitheater of Voices</SectionLabel>

        <div className="mt-5 text-center">
          <h2 className="font-serif text-5xl font-bold leading-tight text-[#E8B876] md:text-6xl">
            모든 발언은 무대에 오른다
          </h2>

          <p className="mx-auto mt-6 max-w-3xl text-lg leading-8 text-[#D6C8B7]">
            원형극장 컨셉입니다. 하나의 중심 의제를 무대처럼 배치하고,
            찬성·반대 발언이 관객석처럼 둘러싸는 구조입니다. 토론의
            현장감이 가장 강한 방향입니다.
          </p>
        </div>

        <div className="relative mx-auto mt-12 max-w-4xl">
          <div className="rounded-t-[999px] border-x border-t border-[#D59E5D]/25 bg-[#162A3A] px-8 pb-10 pt-16 shadow-[0_30px_100px_rgba(0,0,0,0.45)]">
            <div className="mx-auto max-w-2xl rounded-3xl border border-[#D59E5D]/40 bg-[#0F1D29] p-7 text-center">
              <SectionLabel>Central Motion</SectionLabel>
              <h3 className="mt-3 font-serif text-3xl font-bold text-[#F6EBD7]">
                공론장은 완전히 익명이어야 하는가?
              </h3>
              <p className="mt-4 text-sm leading-7 text-[#D6C8B7]">
                중심 의제를 기준으로 각 발언이 무대 위에 기록됩니다. 사용자는
                자신의 입장을 선택하고, 다른 시민의 논거를 검토합니다.
              </p>
            </div>

            <div className="mt-8 grid gap-4 md:grid-cols-3">
              {topics.map((topic) => (
                <article
                  key={topic.title}
                  className="rounded-2xl border border-white/10 bg-white/[0.04] p-4 text-left"
                >
                  <span className="rounded-full border border-[#D59E5D]/30 bg-[#2D2318] px-3 py-1 text-xs font-semibold text-[#E8B876]">
                    {topic.status}
                  </span>

                  <h4 className="mt-4 font-serif text-xl font-bold text-[#F6EBD7]">
                    {topic.title}
                  </h4>

                  <p className="mt-2 text-sm leading-6 text-[#D6C8B7]">
                    {topic.description}
                  </p>
                </article>
              ))}
            </div>
          </div>

          <div className="mx-auto h-8 w-2/3 rounded-b-full border-x border-b border-[#D59E5D]/20 bg-[#101F2C]" />
          <div className="mx-auto h-8 w-1/2 rounded-b-full border-x border-b border-[#D59E5D]/15 bg-[#0F1D29]" />
        </div>

        <div className="mt-14 grid gap-5 md:grid-cols-2">
          {posts.map((post) => (
            <article
              key={post.title}
              className="rounded-3xl border border-[#D59E5D]/25 bg-[#101F2C] p-6"
            >
              <div className="flex flex-wrap items-center gap-3">
                <span
                  className={
                    post.side === "찬성"
                      ? "rounded-full border border-[#7DB8FF]/30 bg-[#122D4A] px-3 py-1 text-xs font-bold text-[#A8D4FF]"
                      : "rounded-full border border-[#F1A08C]/30 bg-[#46221F] px-3 py-1 text-xs font-bold text-[#FFC1B3]"
                  }
                >
                  {post.side} 발언
                </span>
                <span className="text-sm text-[#C9B9A7]">{post.author}</span>
              </div>

              <h3 className="mt-4 font-serif text-2xl font-bold text-[#F6EBD7]">
                {post.title}
              </h3>

              <p className="mt-3 text-sm leading-7 text-[#D6C8B7]">
                {post.content}
              </p>

              <div className="mt-5 flex items-center justify-between border-t border-white/10 pt-4 text-xs text-[#C9B9A7]">
                <span>관객 반응 12</span>
                <span className="font-semibold text-[#E8B876]">
                  반론 남기기
                </span>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}