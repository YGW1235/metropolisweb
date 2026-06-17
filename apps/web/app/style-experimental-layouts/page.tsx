import Link from "next/link";
import type { CSSProperties } from "react";

const topics = [
  {
    title: "익명성은 공론장을 더 자유롭게 만드는가?",
    description: "자유로운 발언과 책임 있는 토론 사이의 균형을 논의합니다.",
    status: "진행 중",
    citizens: 28,
    district: "Agora",
  },
  {
    title: "운영자는 토론에 어디까지 개입해야 하는가?",
    description: "관리 권한과 시민 자율성의 경계를 다룹니다.",
    status: "모집 중",
    citizens: 16,
    district: "Senate",
  },
  {
    title: "좋은 반론은 무엇을 갖춰야 하는가?",
    description: "상대를 이기는 반론이 아니라 논의를 전진시키는 반론을 정의합니다.",
    status: "기록 열람",
    citizens: 42,
    district: "Archive",
  },
];

const posts = [
  {
    side: "찬성",
    author: "찬성 익명 1",
    title: "익명성은 더 넓은 참여를 가능하게 합니다",
    content:
      "발언자의 배경보다 논거 자체가 평가받을 때, 더 많은 시민이 부담 없이 토론에 참여할 수 있습니다.",
  },
  {
    side: "반대",
    author: "반대 익명 1",
    title: "익명성에도 책임 장치가 필요합니다",
    content:
      "자유로운 발언은 중요하지만, 토론의 질서를 유지하기 위한 신고와 관리 구조가 함께 있어야 합니다.",
  },
];

const pageBackground: CSSProperties = {
  backgroundImage:
    "radial-gradient(circle at top left, rgba(201,166,107,0.18), transparent 26%), radial-gradient(circle at top right, rgba(31,58,95,0.18), transparent 28%)",
};

function TopNav() {
  return (
    <header className="border-b border-[#C9A66B]/30 bg-[#101827] text-[#F7F0E2]">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-5">
        <Link
          href="/"
          className="font-serif text-2xl font-black tracking-[0.22em] text-[#E7C985]"
        >
          METROPOLIS
        </Link>

        <nav className="flex items-center gap-2 text-sm">
          <Link
            href="/topics"
            className="rounded-full px-3 py-2 font-semibold text-[#D8CCB5] hover:bg-white/10"
          >
            의제
          </Link>
          <Link
            href="/me"
            className="rounded-full px-3 py-2 font-semibold text-[#D8CCB5] hover:bg-white/10"
          >
            내 기록
          </Link>
          <Link
            href="/login"
            className="rounded-full bg-[#E7C985] px-4 py-2 font-bold text-[#101827] hover:bg-[#F3DFA8]"
          >
            입장하기
          </Link>
        </nav>
      </div>
    </header>
  );
}

function Label({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-xs font-black uppercase tracking-[0.28em] text-[#BFA16A]">
      {children}
    </p>
  );
}

function SideBadge({ side }: { side: string }) {
  const isPro = side === "찬성";

  return (
    <span
      className={
        isPro
          ? "rounded-full border border-[#6CA6E8]/30 bg-[#123454] px-3 py-1 text-xs font-bold text-[#B8D9FF]"
          : "rounded-full border border-[#E89A82]/30 bg-[#4D2220] px-3 py-1 text-xs font-bold text-[#FFC1B4]"
      }
    >
      {side}
    </span>
  );
}

export default function StyleExperimentalLayoutsPage() {
  return (
    <main className="min-h-screen bg-[#0B111C] text-[#F7F0E2]" style={pageBackground}>
      <TopNav />

      <section className="border-b border-white/10 px-6 py-12">
        <div className="mx-auto max-w-7xl">
          <Label>Metropolis Experimental Layouts</Label>
          <h1 className="mt-4 font-serif text-4xl font-black leading-tight md:text-6xl">
            토론장을 “공간”으로 보여주는 UI 실험
          </h1>
          <p className="mt-5 max-w-3xl text-sm leading-7 text-[#D8CCB5]">
            이번 페이지는 단순한 색상 테마가 아니라, 토론을 도시·의회·재판·신문이라는
            구조로 재해석한 예시입니다. 실제 적용 시에는 이 중 하나를 전체 서비스의
            핵심 컨셉으로 선택하거나, 페이지별로 섞을 수 있습니다.
          </p>

          <div className="mt-7 flex flex-wrap gap-3 text-sm">
            <a href="#city-map" className="rounded-full border border-white/15 px-4 py-2 hover:bg-white/10">
              City-State Map
            </a>
            <a href="#parliament" className="rounded-full border border-white/15 px-4 py-2 hover:bg-white/10">
              Parliament Chamber
            </a>
            <a href="#trial-court" className="rounded-full border border-white/15 px-4 py-2 hover:bg-white/10">
              Trial Court
            </a>
            <a href="#gazette" className="rounded-full border border-white/15 px-4 py-2 hover:bg-white/10">
              Broadsheet Gazette
            </a>
          </div>
        </div>
      </section>

      <CityStateMap />
      <ParliamentChamber />
      <TrialCourt />
      <BroadsheetGazette />
    </main>
  );
}

function CityStateMap() {
  return (
    <section id="city-map" className="border-b border-white/10 px-6 py-20">
      <div className="mx-auto max-w-7xl">
        <Label>01 · City-State Map</Label>

        <div className="mt-5 grid gap-8 lg:grid-cols-[0.85fr_1.15fr] lg:items-center">
          <div>
            <h2 className="font-serif text-4xl font-black leading-tight text-[#E7C985] md:text-5xl">
              토픽 목록을 도시 지도로 보여주기
            </h2>
            <p className="mt-5 text-sm leading-7 text-[#D8CCB5]">
              `/topics` 페이지에 가장 잘 어울리는 구조입니다. 토론 주제를 단순한
              카드 목록이 아니라 도시 안의 구역으로 표현합니다. 사용자는 도시를
              탐색하듯 의제를 선택합니다.
            </p>

            <div className="mt-6 grid grid-cols-2 gap-3 text-sm">
              <div className="rounded-2xl border border-[#C9A66B]/25 bg-white/[0.04] p-4">
                <p className="font-bold text-[#E7C985]">Agora</p>
                <p className="mt-1 text-xs leading-5 text-[#BFB39E]">가장 활발한 공개 의제</p>
              </div>
              <div className="rounded-2xl border border-[#C9A66B]/25 bg-white/[0.04] p-4">
                <p className="font-bold text-[#E7C985]">Senate</p>
                <p className="mt-1 text-xs leading-5 text-[#BFB39E]">운영자 추천 핵심 의제</p>
              </div>
              <div className="rounded-2xl border border-[#C9A66B]/25 bg-white/[0.04] p-4">
                <p className="font-bold text-[#E7C985]">Port</p>
                <p className="mt-1 text-xs leading-5 text-[#BFB39E]">새로 열린 토론</p>
              </div>
              <div className="rounded-2xl border border-[#C9A66B]/25 bg-white/[0.04] p-4">
                <p className="font-bold text-[#E7C985]">Archive</p>
                <p className="mt-1 text-xs leading-5 text-[#BFB39E]">종료된 토론 기록</p>
              </div>
            </div>
          </div>

          <div className="relative min-h-[540px] rounded-[2.5rem] border border-[#C9A66B]/30 bg-[#151F30] p-5 shadow-[0_30px_100px_rgba(0,0,0,0.45)]">
            <div
              className="absolute inset-5 rounded-[2rem] opacity-50"
              style={{
                backgroundImage:
                  "linear-gradient(rgba(201,166,107,0.12) 1px, transparent 1px), linear-gradient(90deg, rgba(201,166,107,0.12) 1px, transparent 1px)",
                backgroundSize: "38px 38px",
              }}
            />

            <div className="relative grid h-full min-h-[500px] grid-cols-6 grid-rows-6 gap-3">
              <MapDistrict
                className="col-span-4 row-span-3"
                name="Agora"
                title={topics[0].title}
                description={topics[0].description}
                status="가장 활발한 의제"
              />
              <MapDistrict
                className="col-span-2 row-span-2"
                name="Senate"
                title={topics[1].title}
                description={topics[1].description}
                status="운영 의제"
              />
              <MapDistrict
                className="col-span-2 row-span-2"
                name="Port"
                title="새 시민을 위한 입장 토론"
                description="처음 참여하는 사용자를 위한 쉬운 의제입니다."
                status="새 의제"
              />
              <MapDistrict
                className="col-span-3 row-span-3"
                name="Stoa"
                title="좋은 반론의 조건은 무엇인가?"
                description="논증과 반론의 기준을 논의하는 회랑입니다."
                status="토론 중"
              />
              <MapDistrict
                className="col-span-3 row-span-3"
                name="Archive"
                title={topics[2].title}
                description={topics[2].description}
                status="기록 열람"
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function MapDistrict({
  className,
  name,
  title,
  description,
  status,
}: {
  className: string;
  name: string;
  title: string;
  description: string;
  status: string;
}) {
  return (
    <article
      className={`${className} group relative overflow-hidden rounded-3xl border border-[#C9A66B]/30 bg-[#0F1725]/90 p-5 transition hover:-translate-y-1 hover:border-[#E7C985] hover:bg-[#17243A]`}
    >
      <div className="absolute right-4 top-4 rounded-full border border-[#C9A66B]/30 px-3 py-1 text-[10px] font-black uppercase tracking-[0.2em] text-[#E7C985]">
        {name}
      </div>

      <div className="flex h-full flex-col justify-end">
        <span className="w-fit rounded-full bg-[#E7C985] px-3 py-1 text-xs font-black text-[#101827]">
          {status}
        </span>
        <h3 className="mt-4 font-serif text-2xl font-black leading-8 text-[#F7F0E2]">
          {title}
        </h3>
        <p className="mt-2 text-sm leading-6 text-[#BFB39E]">{description}</p>
        <Link
          href="/topics"
          className="mt-4 text-sm font-bold text-[#E7C985] group-hover:underline"
        >
          이 구역으로 이동
        </Link>
      </div>
    </article>
  );
}

function ParliamentChamber() {
  return (
    <section id="parliament" className="border-b border-white/10 bg-[#100F18] px-6 py-20">
      <div className="mx-auto max-w-7xl">
        <Label>02 · Parliament Chamber</Label>

        <div className="mt-5 text-center">
          <h2 className="font-serif text-4xl font-black leading-tight text-[#E7C985] md:text-5xl">
            찬성과 반대가 마주 앉는 의회형 토론방
          </h2>
          <p className="mx-auto mt-5 max-w-3xl text-sm leading-7 text-[#D8CCB5]">
            `/topics/[topicId]/debate`에 어울리는 구조입니다. 중앙에는 의제가 있고,
            좌우에는 찬성·반대 진영이 배치됩니다. 실제 게시글 목록은 아래에서
            읽기 쉽게 유지할 수 있습니다.
          </p>
        </div>

        <div className="mt-12 rounded-[2.5rem] border border-[#C9A66B]/30 bg-[#171624] p-6 shadow-[0_30px_100px_rgba(0,0,0,0.45)]">
          <div className="grid gap-6 lg:grid-cols-[1fr_0.75fr_1fr]">
            <div className="space-y-4 rounded-[2rem] border border-[#6CA6E8]/25 bg-[#10213A] p-5">
              <p className="text-xs font-black uppercase tracking-[0.25em] text-[#9BCBFF]">
                Pro Benches
              </p>

              {posts
                .filter((post) => post.side === "찬성")
                .map((post) => (
                  <ArgumentSeat key={post.title} post={post} />
                ))}

              <ArgumentSeat
                post={{
                  side: "찬성",
                  author: "찬성 익명 2",
                  title: "발언의 문턱을 낮춰야 합니다",
                  content: "더 많은 사용자가 참여해야 다양한 논거가 모일 수 있습니다.",
                }}
              />
            </div>

            <div className="flex flex-col items-center justify-center rounded-[2rem] border border-[#C9A66B]/40 bg-[#211A16] p-6 text-center">
              <div className="mb-5 h-24 w-24 rounded-full border-4 border-double border-[#E7C985] bg-[#101827]" />
              <p className="text-xs font-black uppercase tracking-[0.28em] text-[#BFA16A]">
                Central Motion
              </p>
              <h3 className="mt-4 font-serif text-3xl font-black leading-tight text-[#F7F0E2]">
                익명성은 공론장을 더 자유롭게 만드는가?
              </h3>
              <p className="mt-4 text-sm leading-7 text-[#D8CCB5]">
                각 진영은 중앙 의제를 향해 발언합니다. 논점이 흐려지지 않도록
                모든 게시글은 이 의제에 연결됩니다.
              </p>

              <div className="mt-6 flex gap-2">
                <span className="rounded-full bg-[#123454] px-3 py-1 text-xs font-bold text-[#B8D9FF]">
                  찬성 12
                </span>
                <span className="rounded-full bg-[#4D2220] px-3 py-1 text-xs font-bold text-[#FFC1B4]">
                  반대 9
                </span>
              </div>
            </div>

            <div className="space-y-4 rounded-[2rem] border border-[#E89A82]/25 bg-[#351A1C] p-5">
              <p className="text-xs font-black uppercase tracking-[0.25em] text-[#FFC1B4]">
                Con Benches
              </p>

              {posts
                .filter((post) => post.side === "반대")
                .map((post) => (
                  <ArgumentSeat key={post.title} post={post} />
                ))}

              <ArgumentSeat
                post={{
                  side: "반대",
                  author: "반대 익명 2",
                  title: "책임 없는 발언은 토론을 흐립니다",
                  content: "익명성은 필요하지만, 최소한의 규칙과 제재가 함께 있어야 합니다.",
                }}
              />
            </div>
          </div>

          <div className="mt-6 grid gap-3 md:grid-cols-5">
            {["쟁점 정리", "찬성 발언", "반대 발언", "반론", "합의 후보"].map((item) => (
              <div
                key={item}
                className="rounded-2xl border border-white/10 bg-white/[0.04] p-4 text-center text-sm font-bold text-[#D8CCB5]"
              >
                {item}
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

function ArgumentSeat({
  post,
}: {
  post: {
    side: string;
    author: string;
    title: string;
    content: string;
  };
}) {
  return (
    <article className="rounded-2xl border border-white/10 bg-white/[0.04] p-4">
      <div className="flex items-center gap-2">
        <SideBadge side={post.side} />
        <span className="text-xs font-bold text-[#BFB39E]">{post.author}</span>
      </div>
      <h4 className="mt-3 font-serif text-xl font-black text-[#F7F0E2]">
        {post.title}
      </h4>
      <p className="mt-2 text-sm leading-6 text-[#D8CCB5]">{post.content}</p>
    </article>
  );
}

function TrialCourt() {
  return (
    <section id="trial-court" className="border-b border-white/10 bg-[#1B1612] px-6 py-20">
      <div className="mx-auto max-w-7xl">
        <Label>03 · Trial Court</Label>

        <div className="mt-5 grid gap-8 lg:grid-cols-[0.9fr_1.1fr] lg:items-start">
          <div>
            <h2 className="font-serif text-4xl font-black leading-tight text-[#E7C985] md:text-5xl">
              토론을 재판 기록처럼 구성하기
            </h2>
            <p className="mt-5 text-sm leading-7 text-[#D8CCB5]">
              신고, 삭제, 댓글 기능이 있는 현재 구조와 잘 맞습니다. 의제는 사건명,
              찬성·반대는 양측 주장, 댓글은 증언/반대신문처럼 표현할 수 있습니다.
            </p>

            <div className="mt-7 rounded-3xl border border-[#C9A66B]/30 bg-[#241D17] p-6">
              <p className="text-xs font-black uppercase tracking-[0.25em] text-[#BFA16A]">
                Case Summary
              </p>
              <h3 className="mt-3 font-serif text-3xl font-black text-[#F7F0E2]">
                Case No. 001: Anonymous Agora
              </h3>
              <p className="mt-4 text-sm leading-7 text-[#D8CCB5]">
                쟁점: 익명 토론은 더 자유로운 시민 참여를 만드는가, 아니면
                책임 없는 발언을 늘리는가?
              </p>
            </div>
          </div>

          <div className="rounded-[2rem] border border-[#C9A66B]/35 bg-[#241D17] p-6 shadow-[0_30px_100px_rgba(0,0,0,0.35)]">
            <div className="rounded-t-[2rem] border-b-4 border-double border-[#C9A66B]/40 bg-[#302419] p-6 text-center">
              <p className="text-xs font-black uppercase tracking-[0.28em] text-[#BFA16A]">
                The Court of Public Reason
              </p>
              <h3 className="mt-3 font-serif text-3xl font-black text-[#F7F0E2]">
                재판장: 시민 판단
              </h3>
            </div>

            <div className="mt-6 grid gap-5 md:grid-cols-2">
              <CourtColumn
                title="원고 측 주장"
                side="찬성"
                summary="익명성은 발언의 문턱을 낮추고 다양한 의견을 불러옵니다."
              />
              <CourtColumn
                title="피고 측 주장"
                side="반대"
                summary="익명성은 책임 없는 발언을 늘릴 수 있으므로 제어 장치가 필요합니다."
              />
            </div>

            <div className="mt-6 rounded-2xl border border-white/10 bg-[#19130F] p-5">
              <p className="text-xs font-black uppercase tracking-[0.25em] text-[#BFA16A]">
                Transcript
              </p>

              <div className="mt-4 space-y-4">
                {posts.map((post) => (
                  <div key={post.title} className="border-l-4 border-[#C9A66B]/40 pl-4">
                    <div className="flex flex-wrap items-center gap-2">
                      <SideBadge side={post.side} />
                      <span className="text-xs font-bold text-[#BFB39E]">
                        {post.author}
                      </span>
                    </div>
                    <h4 className="mt-2 font-serif text-xl font-black text-[#F7F0E2]">
                      {post.title}
                    </h4>
                    <p className="mt-2 text-sm leading-6 text-[#D8CCB5]">
                      {post.content}
                    </p>
                    <div className="mt-3 flex gap-3 text-xs font-bold text-[#BFA16A]">
                      <span>증언 3개</span>
                      <span>이의 제기</span>
                      <span>기록 열람</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function CourtColumn({
  title,
  side,
  summary,
}: {
  title: string;
  side: string;
  summary: string;
}) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-5">
      <SideBadge side={side} />
      <h4 className="mt-4 font-serif text-2xl font-black text-[#F7F0E2]">
        {title}
      </h4>
      <p className="mt-3 text-sm leading-6 text-[#D8CCB5]">{summary}</p>
      <div className="mt-5 rounded-xl bg-[#101827] p-4 text-xs font-bold leading-6 text-[#BFA16A]">
        제출된 논거 8개 · 반론 5개 · 댓글 21개
      </div>
    </div>
  );
}

function BroadsheetGazette() {
  return (
    <section id="gazette" className="bg-[#EFE2C4] px-6 py-20 text-[#211A12]">
      <div className="mx-auto max-w-7xl">
        <div className="border-4 border-double border-[#211A12] bg-[#FFF3D3] p-6 shadow-[12px_12px_0_rgba(33,26,18,0.16)]">
          <div className="border-b-4 border-double border-[#211A12] pb-5 text-center">
            <p className="text-xs font-black uppercase tracking-[0.3em] text-[#7A4D20]">
              04 · Broadsheet Gazette
            </p>
            <h2 className="mt-3 font-serif text-5xl font-black leading-tight md:text-7xl">
              THE METROPOLIS GAZETTE
            </h2>
            <p className="mt-3 text-sm font-bold uppercase tracking-[0.2em]">
              Public arguments, civic records, and daily motions
            </p>
          </div>

          <div className="mt-6 grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
            <article className="border-b border-[#211A12] pb-6 lg:border-b-0 lg:border-r lg:pr-6">
              <p className="text-xs font-black uppercase tracking-[0.25em] text-[#7A4D20]">
                Front Page Motion
              </p>
              <h3 className="mt-3 font-serif text-4xl font-black leading-tight md:text-5xl">
                익명성은 공론장을 더 자유롭게 만드는가?
              </h3>
              <p className="mt-4 columns-1 text-sm leading-7 md:columns-2">
                이 레이아웃은 `/topics/[topicId]/debate` 또는 홈 화면의 주요 토론
                요약에 잘 맞습니다. 찬성과 반대의 핵심 주장을 신문 칼럼처럼
                나누어 보여주고, 아래에는 시민 댓글과 관련 의제를 배치합니다.
                전체 서비스에 적용하면 독특하지만, 글이 많아질수록 오히려
                정보 전달력이 좋아질 수 있습니다.
              </p>

              <div className="mt-6 grid gap-4 md:grid-cols-2">
                {posts.map((post) => (
                  <article key={post.title} className="border-t-4 border-[#211A12] pt-4">
                    <div className="flex items-center gap-2">
                      <span
                        className={
                          post.side === "찬성"
                            ? "bg-[#D9E6EF] px-2 py-1 text-xs font-black text-[#1F4A6D]"
                            : "bg-[#E8D0C5] px-2 py-1 text-xs font-black text-[#823B2C]"
                        }
                      >
                        {post.side}
                      </span>
                      <span className="text-xs font-bold text-[#7A4D20]">
                        {post.author}
                      </span>
                    </div>

                    <h4 className="mt-3 font-serif text-2xl font-black leading-8">
                      {post.title}
                    </h4>
                    <p className="mt-2 text-sm leading-6">{post.content}</p>
                  </article>
                ))}
              </div>
            </article>

            <aside>
              <div className="border-b border-[#211A12] pb-5">
                <p className="text-xs font-black uppercase tracking-[0.25em] text-[#7A4D20]">
                  Today&apos;s Topics
                </p>

                <div className="mt-4 space-y-5">
                  {topics.map((topic) => (
                    <article key={topic.title}>
                      <div className="flex items-center justify-between gap-3">
                        <span className="border border-[#211A12] px-2 py-1 text-[10px] font-black uppercase">
                          {topic.status}
                        </span>
                        <span className="text-xs font-bold text-[#7A4D20]">
                          {topic.citizens} citizens
                        </span>
                      </div>

                      <h4 className="mt-2 font-serif text-xl font-black">
                        {topic.title}
                      </h4>
                      <p className="mt-1 text-xs leading-5 text-[#5F4428]">
                        {topic.description}
                      </p>
                    </article>
                  ))}
                </div>
              </div>

              <div className="mt-5 border border-[#211A12] p-4">
                <p className="text-xs font-black uppercase tracking-[0.25em] text-[#7A4D20]">
                  Editor&apos;s Note
                </p>
                <p className="mt-3 text-sm leading-6">
                  신문형 UI는 토론 결과 요약, 종료된 토론 아카이브, 관리자 추천
                  의제 페이지에 특히 잘 어울립니다.
                </p>
              </div>
            </aside>
          </div>

          <div className="mt-6 border-t-4 border-double border-[#211A12] pt-4 text-center text-xs font-black uppercase tracking-[0.25em]">
            Debate · Record · Reply · Archive
          </div>
        </div>
      </div>
    </section>
  );
}