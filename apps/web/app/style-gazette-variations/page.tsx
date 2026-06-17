import Link from "next/link";
import type { CSSProperties, ReactNode } from "react";

const topics = [
  {
    title: "익명성은 공론장을 더 자유롭게 만드는가?",
    description:
      "자유로운 발언과 책임 있는 토론 사이의 균형을 논의합니다.",
    status: "진행 중",
    citizens: 28,
  },
  {
    title: "운영자는 어디까지 토론에 개입해야 하는가?",
    description:
      "질서 유지를 위한 관리 권한과 시민 자율성의 경계를 다룹니다.",
    status: "토론 모집",
    citizens: 16,
  },
  {
    title: "좋은 반론은 무엇을 갖춰야 하는가?",
    description:
      "상대를 이기는 반론이 아니라 논의를 전진시키는 반론을 정의합니다.",
    status: "기록 열람",
    citizens: 42,
  },
];

const argumentsList = [
  {
    side: "찬성",
    author: "찬성 익명 1",
    title: "익명성은 발언의 문턱을 낮춥니다",
    content:
      "발언자의 배경보다 논거 자체가 평가받을 때, 더 많은 시민이 부담 없이 토론에 참여할 수 있습니다.",
  },
  {
    side: "반대",
    author: "반대 익명 1",
    title: "익명성에는 책임 장치가 필요합니다",
    content:
      "자유로운 발언은 중요하지만, 토론의 질서를 유지하기 위한 신고와 관리 구조가 함께 있어야 합니다.",
  },
  {
    side: "찬성",
    author: "찬성 익명 2",
    title: "소수 의견이 드러날 가능성이 커집니다",
    content:
      "익명 구조는 눈치 보지 않는 의견 제시를 가능하게 만들고, 다수 의견에 묻힌 관점을 끌어낼 수 있습니다.",
  },
];

const fonts = {
  classicSerif:
    'Georgia, "Times New Roman", Times, "Noto Serif KR", serif',
  oldNewspaper:
    '"Old English Text MT", "UnifrakturCook", Georgia, "Times New Roman", serif',
  elegantSerif:
    'Didot, "Bodoni 72", "Bodoni MT", "Playfair Display", Georgia, serif',
  editorialSerif:
    '"Iowan Old Style", Palatino, "Palatino Linotype", "Book Antiqua", Georgia, serif',
  typewriter:
    '"Courier New", Courier, "IBM Plex Mono", monospace',
  compactSans:
    'Impact, Haettenschweiler, "Arial Narrow Bold", sans-serif',
  humanistSans:
    'Avenir, "Gill Sans", "Trebuchet MS", Arial, sans-serif',
};

function SideMark({ side }: { side: string }) {
  const isPro = side === "찬성";

  return (
    <span
      className={
        isPro
          ? "border border-[#1F4A6D] bg-[#D9E6EF] px-2 py-1 text-[10px] font-black text-[#1F4A6D]"
          : "border border-[#823B2C] bg-[#E8D0C5] px-2 py-1 text-[10px] font-black text-[#823B2C]"
      }
    >
      {side}
    </span>
  );
}

function TopNav() {
  return (
    <header className="border-b border-white/10 bg-neutral-950 px-6 py-5 text-white">
      <div className="mx-auto flex max-w-7xl items-center justify-between">
        <Link
          href="/"
          className="text-2xl font-black tracking-[0.22em] text-amber-300"
          style={{ fontFamily: fonts.classicSerif }}
        >
          METROPOLIS
        </Link>

        <nav className="flex items-center gap-2 text-sm">
          <Link
            href="/topics"
            className="rounded-full px-3 py-2 font-semibold text-neutral-300 hover:bg-white/10"
          >
            의제
          </Link>
          <Link
            href="/me"
            className="rounded-full px-3 py-2 font-semibold text-neutral-300 hover:bg-white/10"
          >
            내 기록
          </Link>
          <Link
            href="/login"
            className="rounded-full bg-amber-300 px-4 py-2 font-bold text-neutral-950 hover:bg-amber-200"
          >
            입장하기
          </Link>
        </nav>
      </div>
    </header>
  );
}

function VariationLabel({ children }: { children: ReactNode }) {
  return (
    <p className="text-xs font-black uppercase tracking-[0.28em] opacity-70">
      {children}
    </p>
  );
}

export default function StyleGazetteVariationsPage() {
  return (
    <main className="min-h-screen bg-neutral-950">
      <TopNav />

      <section className="border-b border-white/10 px-6 py-12 text-white">
        <div className="mx-auto max-w-7xl">
          <p className="text-sm font-black uppercase tracking-[0.3em] text-amber-300">
            Metropolis Gazette Variations
          </p>
          <h1
            className="mt-4 text-5xl font-black leading-tight md:text-7xl"
            style={{ fontFamily: fonts.classicSerif }}
          >
            토론을 신문처럼 편집하는 UI
          </h1>
          <p className="mt-5 max-w-3xl text-sm leading-7 text-neutral-300">
            Broadsheet Gazette 컨셉을 유지하되, 신문 1면, 살롱 리뷰,
            야간 속보, 시민 팸플릿, 학술 저널처럼 서로 다른 편집 스타일로
            확장한 예시입니다.
          </p>

          <div className="mt-7 flex flex-wrap gap-3 text-sm">
            <a
              href="#classic"
              className="rounded-full border border-white/15 px-4 py-2 hover:bg-white/10"
            >
              Classic Broadsheet
            </a>
            <a
              href="#salon"
              className="rounded-full border border-white/15 px-4 py-2 hover:bg-white/10"
            >
              Salon Review
            </a>
            <a
              href="#midnight"
              className="rounded-full border border-white/15 px-4 py-2 hover:bg-white/10"
            >
              Midnight Press
            </a>
            <a
              href="#pamphlet"
              className="rounded-full border border-white/15 px-4 py-2 hover:bg-white/10"
            >
              Civic Pamphlet
            </a>
            <a
              href="#journal"
              className="rounded-full border border-white/15 px-4 py-2 hover:bg-white/10"
            >
              Argument Journal
            </a>
          </div>
        </div>
      </section>

      <ClassicBroadsheet />
      <SalonReview />
      <MidnightPress />
      <CivicPamphlet />
      <ArgumentJournal />
    </main>
  );
}

function ClassicBroadsheet() {
  return (
    <section
      id="classic"
      className="bg-[#EFE2C4] px-6 py-20 text-[#211A12]"
      style={{ fontFamily: fonts.classicSerif }}
    >
      <div className="mx-auto max-w-7xl">
        <div className="border-4 border-double border-[#211A12] bg-[#FFF3D3] p-6 shadow-[12px_12px_0_rgba(33,26,18,0.16)]">
          <div className="border-b-4 border-double border-[#211A12] pb-5 text-center">
            <VariationLabel>01 · Classic Broadsheet</VariationLabel>
            <h2
              className="mt-3 text-5xl font-black leading-none md:text-8xl"
              style={{ fontFamily: fonts.oldNewspaper }}
            >
              The Metropolis Gazette
            </h2>
            <p className="mt-3 text-xs font-black uppercase tracking-[0.25em]">
              Public Arguments · Civic Records · Daily Motions
            </p>
          </div>

          <div className="mt-6 grid gap-6 lg:grid-cols-[1.3fr_0.7fr]">
            <article className="border-b border-[#211A12] pb-6 lg:border-b-0 lg:border-r lg:pr-6">
              <p className="text-xs font-black uppercase tracking-[0.25em] text-[#7A4D20]">
                Front Page Motion
              </p>
              <h3 className="mt-3 text-4xl font-black leading-tight md:text-6xl">
                익명성은 공론장을 더 자유롭게 만드는가?
              </h3>
              <p className="mt-4 columns-1 text-sm leading-7 md:columns-2">
                고전적인 대형 신문 1면 스타일입니다. 의제를 헤드라인처럼
                크게 보여주고, 찬성과 반대의 핵심 발언을 기사 칼럼처럼
                나눠 배치합니다. 종료된 토론을 요약하거나 홈 화면의 대표
                토론을 보여줄 때 가장 안정적으로 사용할 수 있습니다.
              </p>

              <div className="mt-6 grid gap-4 md:grid-cols-2">
                {argumentsList.slice(0, 2).map((argument) => (
                  <article
                    key={argument.title}
                    className="border-t-4 border-[#211A12] pt-4"
                  >
                    <div className="flex items-center gap-2">
                      <SideMark side={argument.side} />
                      <span className="text-xs font-bold text-[#7A4D20]">
                        {argument.author}
                      </span>
                    </div>
                    <h4 className="mt-3 text-2xl font-black leading-8">
                      {argument.title}
                    </h4>
                    <p className="mt-2 text-sm leading-6">
                      {argument.content}
                    </p>
                  </article>
                ))}
              </div>
            </article>

            <aside>
              <p className="text-xs font-black uppercase tracking-[0.25em] text-[#7A4D20]">
                Today&apos;s Topics
              </p>

              <div className="mt-4 space-y-5">
                {topics.map((topic) => (
                  <article key={topic.title} className="border-b border-[#211A12]/30 pb-4">
                    <div className="flex items-center justify-between gap-3">
                      <span className="border border-[#211A12] px-2 py-1 text-[10px] font-black uppercase">
                        {topic.status}
                      </span>
                      <span className="text-xs font-bold text-[#7A4D20]">
                        {topic.citizens} citizens
                      </span>
                    </div>
                    <h4 className="mt-2 text-xl font-black leading-7">
                      {topic.title}
                    </h4>
                    <p className="mt-1 text-xs leading-5 text-[#5F4428]">
                      {topic.description}
                    </p>
                  </article>
                ))}
              </div>
            </aside>
          </div>
        </div>
      </div>
    </section>
  );
}

function SalonReview() {
  return (
    <section
      id="salon"
      className="bg-[#F5EFE7] px-6 py-20 text-[#2C2222]"
      style={{
        fontFamily: fonts.elegantSerif,
        backgroundImage:
          "radial-gradient(circle at 15% 10%, rgba(97,38,58,0.10), transparent 25%), radial-gradient(circle at 85% 0%, rgba(183,149,91,0.16), transparent 28%)",
      }}
    >
      <div className="mx-auto max-w-7xl">
        <div className="rounded-[2.5rem] border border-[#D8C2A3] bg-[#FFFDF8] p-8 shadow-[0_30px_100px_rgba(44,34,34,0.14)]">
          <div className="grid gap-8 border-b border-[#D8C2A3] pb-8 lg:grid-cols-[0.8fr_1.2fr] lg:items-end">
            <div>
              <VariationLabel>02 · Salon Review</VariationLabel>
              <h2 className="mt-4 text-5xl font-black leading-none text-[#4C1F2D] md:text-7xl">
                La Revue
                <br />
                Civique
              </h2>
            </div>

            <div>
              <p className="text-sm font-black uppercase tracking-[0.3em] text-[#B7955B]">
                An Elegant Review of Public Reason
              </p>
              <h3 className="mt-4 text-4xl font-black leading-tight text-[#4C1F2D] md:text-5xl">
                논쟁은 거칠게 시작되어도, 문장 속에서 정제된다.
              </h3>
              <p className="mt-5 text-sm leading-7 text-[#6B5A51]">
                프랑스 살롱과 문예지를 섞은 편집 스타일입니다. 토론을
                즉각적인 싸움이 아니라, 정제된 주장과 반론의 교환처럼
                보이게 만듭니다. 글의 품격을 강조하고 싶을 때 좋습니다.
              </p>
            </div>
          </div>

          <div className="mt-8 grid gap-6 lg:grid-cols-[1fr_1fr_0.7fr]">
            {argumentsList.map((argument) => (
              <article
                key={argument.title}
                className="rounded-[1.75rem] border border-[#E0CFB5] bg-[#FFFBF3] p-6"
              >
                <div className="flex items-center gap-2">
                  <SideMark side={argument.side} />
                  <span className="text-xs font-bold text-[#8A786D]">
                    {argument.author}
                  </span>
                </div>

                <h4 className="mt-5 text-3xl font-black leading-tight text-[#4C1F2D]">
                  {argument.title}
                </h4>

                <p
                  className="mt-4 text-sm leading-7 text-[#6B5A51]"
                  style={{ fontFamily: fonts.editorialSerif }}
                >
                  {argument.content}
                </p>
              </article>
            ))}
          </div>

          <div className="mt-8 rounded-[2rem] bg-[#4C1F2D] p-6 text-[#FFFDF8]">
            <p className="text-xs font-black uppercase tracking-[0.3em] text-[#D8C2A3]">
              Editor&apos;s Selection
            </p>
            <p className="mt-3 text-2xl font-black leading-9">
              이 스타일은 `/topics/[topicId]/debate`의 상단 요약 영역이나
              종료된 토론의 결과 요약 페이지에 특히 잘 어울립니다.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}

function MidnightPress() {
  return (
    <section
      id="midnight"
      className="bg-[#070B12] px-6 py-20 text-[#F4E8D4]"
      style={{
        backgroundImage:
          "radial-gradient(circle at 50% 0%, rgba(219,166,84,0.18), transparent 32%), linear-gradient(90deg, rgba(255,255,255,0.04) 1px, transparent 1px)",
        backgroundSize: "auto, 46px 46px",
      }}
    >
      <div className="mx-auto max-w-7xl">
        <div className="border border-[#D59E5D]/30 bg-[#0F1724] p-6 shadow-[0_30px_110px_rgba(0,0,0,0.6)]">
          <div className="grid gap-6 border-b border-[#D59E5D]/30 pb-6 md:grid-cols-[1fr_auto] md:items-end">
            <div>
              <VariationLabel>03 · Midnight Press</VariationLabel>
              <h2
                className="mt-4 text-5xl font-black uppercase leading-none text-[#E8B876] md:text-8xl"
                style={{ fontFamily: fonts.compactSans }}
              >
                Midnight
                <br />
                Press
              </h2>
            </div>

            <div
              className="border border-[#D59E5D]/40 p-4 text-right"
              style={{ fontFamily: fonts.typewriter }}
            >
              <p className="text-xs uppercase tracking-[0.25em] text-[#D59E5D]">
                Special Late Edition
              </p>
              <p className="mt-2 text-sm text-[#C9B9A7]">
                시민 발언 긴급 편집본
              </p>
            </div>
          </div>

          <div className="mt-8 grid gap-6 lg:grid-cols-[0.85fr_1.15fr]">
            <div>
              <h3
                className="text-4xl font-black leading-tight text-[#F4E8D4] md:text-6xl"
                style={{ fontFamily: fonts.classicSerif }}
              >
                오늘 밤, 익명성 논쟁이 다시 불붙다
              </h3>
              <p
                className="mt-5 text-sm leading-7 text-[#C9B9A7]"
                style={{ fontFamily: fonts.typewriter }}
              >
                야간 속보판 스타일입니다. 어두운 배경, 강한 헤드라인,
                타자기풍 보조 텍스트를 사용해 긴박한 공개 토론 느낌을
                만듭니다. 실시간 인기 토론, 뜨거운 의제, 알림 페이지에
                잘 어울립니다.
              </p>

              <div className="mt-6 grid grid-cols-3 gap-3">
                {["찬성 12", "반대 9", "댓글 34"].map((item) => (
                  <div
                    key={item}
                    className="border border-[#D59E5D]/30 bg-white/[0.04] p-4 text-center"
                  >
                    <p
                      className="text-xl font-black text-[#E8B876]"
                      style={{ fontFamily: fonts.typewriter }}
                    >
                      {item}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            <div className="grid gap-4">
              {argumentsList.map((argument, index) => (
                <article
                  key={argument.title}
                  className="border-l-8 border-[#D59E5D] bg-[#141F31] p-5"
                >
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2">
                      <SideMark side={argument.side} />
                      <span
                        className="text-xs text-[#C9B9A7]"
                        style={{ fontFamily: fonts.typewriter }}
                      >
                        {argument.author}
                      </span>
                    </div>
                    <span
                      className="text-xs text-[#D59E5D]"
                      style={{ fontFamily: fonts.typewriter }}
                    >
                      #{String(index + 1).padStart(2, "0")}
                    </span>
                  </div>

                  <h4
                    className="mt-3 text-2xl font-black text-[#F4E8D4]"
                    style={{ fontFamily: fonts.compactSans }}
                  >
                    {argument.title}
                  </h4>

                  <p
                    className="mt-3 text-sm leading-7 text-[#C9B9A7]"
                    style={{ fontFamily: fonts.typewriter }}
                  >
                    {argument.content}
                  </p>
                </article>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function CivicPamphlet() {
  return (
    <section
      id="pamphlet"
      className="bg-[#E9D6A8] px-6 py-20 text-[#21170F]"
      style={{
        fontFamily: fonts.typewriter,
        backgroundImage:
          "radial-gradient(circle at 10% 10%, rgba(130,59,44,0.12), transparent 24%), radial-gradient(circle at 90% 10%, rgba(31,74,109,0.10), transparent 28%)",
      }}
    >
      <div className="mx-auto max-w-7xl">
        <div className="grid gap-8 lg:grid-cols-[0.8fr_1.2fr]">
          <div className="border-4 border-[#21170F] bg-[#F5E6BD] p-6 shadow-[10px_10px_0_rgba(33,23,15,0.18)]">
            <VariationLabel>04 · Civic Pamphlet</VariationLabel>
            <h2
              className="mt-5 text-5xl font-black uppercase leading-none md:text-7xl"
              style={{ fontFamily: fonts.compactSans }}
            >
              Citizens,
              <br />
              Take
              <br />
              A Side
            </h2>
            <p className="mt-6 text-sm font-bold leading-7">
              시민 팸플릿 스타일입니다. 신문보다 더 선동적이고 직접적인
              톤입니다. 사용자의 참여를 강하게 유도하는 랜딩 페이지나
              토론 참여 전 입장 선택 화면에 잘 어울립니다.
            </p>

            <div className="mt-8 rotate-[-2deg] border-4 border-[#823B2C] p-4 text-center">
              <p className="text-2xl font-black uppercase text-[#823B2C]">
                Public Motion Open
              </p>
            </div>
          </div>

          <div className="border-4 border-double border-[#21170F] bg-[#FFF1C9] p-6">
            <div className="border-b-4 border-[#21170F] pb-5">
              <p className="text-xs font-black uppercase tracking-[0.25em] text-[#823B2C]">
                Distributed in the Agora
              </p>
              <h3
                className="mt-3 text-4xl font-black uppercase leading-tight md:text-6xl"
                style={{ fontFamily: fonts.compactSans }}
              >
                익명성은 자유인가, 무책임인가?
              </h3>
            </div>

            <div className="mt-6 grid gap-5 md:grid-cols-2">
              {argumentsList.slice(0, 2).map((argument) => (
                <article
                  key={argument.title}
                  className="border-2 border-[#21170F] bg-[#F5E6BD] p-5"
                >
                  <div className="flex items-center gap-2">
                    <SideMark side={argument.side} />
                    <span className="text-xs font-black">
                      {argument.author}
                    </span>
                  </div>

                  <h4
                    className="mt-4 text-3xl font-black uppercase leading-tight"
                    style={{ fontFamily: fonts.compactSans }}
                  >
                    {argument.title}
                  </h4>

                  <p className="mt-3 text-sm font-bold leading-7">
                    {argument.content}
                  </p>
                </article>
              ))}
            </div>

            <div className="mt-6 grid gap-3 md:grid-cols-3">
              {topics.map((topic) => (
                <article
                  key={topic.title}
                  className="border border-[#21170F] bg-[#F8EAC1] p-4"
                >
                  <p className="text-[10px] font-black uppercase text-[#823B2C]">
                    {topic.status}
                  </p>
                  <h4 className="mt-2 text-lg font-black leading-6">
                    {topic.title}
                  </h4>
                </article>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function ArgumentJournal() {
  return (
    <section
      id="journal"
      className="bg-[#F6F4EF] px-6 py-20 text-[#1E1E1C]"
      style={{ fontFamily: fonts.editorialSerif }}
    >
      <div className="mx-auto max-w-7xl">
        <div className="border border-[#1E1E1C] bg-white p-8">
          <div className="grid gap-6 border-b border-[#1E1E1C] pb-6 lg:grid-cols-[1fr_auto] lg:items-end">
            <div>
              <VariationLabel>05 · Argument Journal</VariationLabel>
              <h2
                className="mt-4 text-5xl font-black leading-none md:text-7xl"
                style={{ fontFamily: fonts.editorialSerif }}
              >
                Journal of
                <br />
                Civic Arguments
              </h2>
            </div>

            <div className="max-w-xs border-l border-[#1E1E1C] pl-5 text-sm leading-6">
              Vol. 1 · Issue 4
              <br />
              Topic Review
              <br />
              Public Reason Archive
            </div>
          </div>

          <div className="mt-8 grid gap-8 lg:grid-cols-[1fr_0.35fr]">
            <article>
              <p className="text-xs font-black uppercase tracking-[0.25em] text-[#6F6B61]">
                Abstract
              </p>
              <h3 className="mt-3 text-4xl font-black leading-tight md:text-5xl">
                익명 공론장의 참여 확장성과 책임 구조에 대한 시민 논증
              </h3>
              <p className="mt-5 text-sm leading-8">
                학술 저널 스타일입니다. 감정적인 토론보다 논거, 근거,
                반론, 결론을 차분하게 읽히게 만드는 데 좋습니다. 토론
                종료 후 요약 페이지, 관리자 검토 화면, 아카이브 페이지에
                특히 잘 어울립니다.
              </p>

              <div className="mt-8 grid gap-6 md:grid-cols-3">
                {argumentsList.map((argument, index) => (
                  <article
                    key={argument.title}
                    className="border-t border-[#1E1E1C] pt-4"
                  >
                    <p className="text-xs font-black text-[#6F6B61]">
                      Argument {index + 1}
                    </p>
                    <div className="mt-2 flex items-center gap-2">
                      <SideMark side={argument.side} />
                      <span className="text-xs font-bold text-[#6F6B61]">
                        {argument.author}
                      </span>
                    </div>
                    <h4 className="mt-3 text-xl font-black leading-7">
                      {argument.title}
                    </h4>
                    <p className="mt-2 text-sm leading-7">
                      {argument.content}
                    </p>
                  </article>
                ))}
              </div>
            </article>

            <aside className="border-t border-[#1E1E1C] pt-5 lg:border-l lg:border-t-0 lg:pl-5 lg:pt-0">
              <p className="text-xs font-black uppercase tracking-[0.25em] text-[#6F6B61]">
                Index
              </p>

              <div className="mt-4 space-y-4">
                {topics.map((topic, index) => (
                  <article key={topic.title}>
                    <p className="text-xs font-black text-[#6F6B61]">
                      {String(index + 1).padStart(2, "0")} · {topic.status}
                    </p>
                    <h4 className="mt-1 text-lg font-black leading-6">
                      {topic.title}
                    </h4>
                    <p className="mt-1 text-xs leading-5 text-[#5F5A52]">
                      {topic.description}
                    </p>
                  </article>
                ))}
              </div>

              <div className="mt-8 border border-[#1E1E1C] p-4">
                <p className="text-xs font-black uppercase tracking-[0.25em] text-[#6F6B61]">
                  Note
                </p>
                <p className="mt-3 text-sm leading-6">
                  이 테마는 가장 차분하고 신뢰감이 강합니다. 커뮤니티보다
                  논문/리포트/정책 토론 느낌에 가깝습니다.
                </p>
              </div>
            </aside>
          </div>
        </div>
      </div>
    </section>
  );
}