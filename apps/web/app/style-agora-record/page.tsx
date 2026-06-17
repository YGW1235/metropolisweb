import Link from "next/link";
import type { CSSProperties } from "react";

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
  inscription:
    'Cinzel, Georgia, "Times New Roman", "Noto Serif KR", serif',
  record:
    'Georgia, "Times New Roman", "Noto Serif KR", serif',
  scribe:
    '"Iowan Old Style", Palatino, "Palatino Linotype", "Book Antiqua", Georgia, serif',
  ui:
    'Avenir, "Trebuchet MS", Arial, "Noto Sans KR", sans-serif',
};

const stoneBackground: CSSProperties = {
  backgroundImage:
    "radial-gradient(circle at 12% 8%, rgba(166,124,82,0.16), transparent 28%), radial-gradient(circle at 88% 0%, rgba(31,58,95,0.12), transparent 30%), linear-gradient(90deg, rgba(47,42,36,0.04) 1px, transparent 1px), linear-gradient(rgba(47,42,36,0.035) 1px, transparent 1px)",
  backgroundSize: "auto, auto, 56px 56px, 56px 56px",
};

function SideMark({ side }: { side: string }) {
  const isPro = side === "찬성";

  return (
    <span
      className={
        isPro
          ? "border border-[#244B73] bg-[#DDE8F2] px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.18em] text-[#244B73]"
          : "border border-[#8A4938] bg-[#EAD6CD] px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.18em] text-[#8A4938]"
      }
    >
      {side}
    </span>
  );
}

function SmallLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-xs font-black uppercase tracking-[0.28em] text-[#9F7E4D]">
      {children}
    </p>
  );
}

export default function StyleAgoraRecordPage() {
  return (
    <main
      className="min-h-screen bg-[#F2E8D5] text-[#2F2A24]"
      style={{ ...stoneBackground, fontFamily: fonts.record }}
    >
      <header className="border-b border-[#BFA985] bg-[#FFF8E8]/90 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-5">
          <Link
            href="/"
            className="text-2xl font-black tracking-[0.22em] text-[#1F3A5F]"
            style={{ fontFamily: fonts.inscription }}
          >
            METROPOLIS
          </Link>

          <nav className="flex items-center gap-2 text-sm" style={{ fontFamily: fonts.ui }}>
            <Link
              href="/topics"
              className="rounded-md px-3 py-2 font-bold text-[#6E5B3E] hover:bg-[#E7D7B9]"
            >
              의제
            </Link>
            <Link
              href="/me"
              className="rounded-md px-3 py-2 font-bold text-[#6E5B3E] hover:bg-[#E7D7B9]"
            >
              내 기록
            </Link>
            <Link
              href="/login"
              className="rounded-md bg-[#1F3A5F] px-4 py-2 font-bold text-[#FFF8E8] hover:bg-[#2A4B78]"
            >
              아고라 입장
            </Link>
          </nav>
        </div>

        <div className="h-3 border-y border-[#BFA985] bg-[repeating-linear-gradient(90deg,#1F3A5F_0,#1F3A5F_12px,#C9A66B_12px,#C9A66B_20px,transparent_20px,transparent_28px)] opacity-80" />
      </header>

      <section className="px-6 py-16">
        <div className="mx-auto max-w-7xl">
          <div className="grid gap-8 lg:grid-cols-[0.9fr_1.1fr] lg:items-end">
            <div>
              <SmallLabel>Agora Record · Public Notice</SmallLabel>

              <h1
                className="mt-5 text-5xl font-black leading-none text-[#1F3A5F] md:text-7xl"
                style={{ fontFamily: fonts.inscription }}
              >
                THE
                <br />
                AGORA
                <br />
                RECORD
              </h1>

              <p className="mt-6 max-w-2xl text-lg leading-8 text-[#6E5B3E]">
                신문이 아니라, 시민들이 아고라에서 읽고 토론하는 공고문과
                민회 발언록의 느낌입니다. 강한 헤드라인, 칼럼형 발언 정리,
                서기의 기록 메모를 통해 토론을 고대 도시국가의 공적 기록처럼
                보여줍니다.
              </p>

              <div className="mt-8 flex flex-wrap gap-3" style={{ fontFamily: fonts.ui }}>
                <Link
                  href="/topics"
                  className="rounded-md bg-[#1F3A5F] px-5 py-3 text-sm font-bold text-[#FFF8E8] hover:bg-[#2A4B78]"
                >
                  공개 의제 보기
                </Link>
                <Link
                  href="/me"
                  className="rounded-md border border-[#9F7E4D] bg-[#FFF8E8] px-5 py-3 text-sm font-bold text-[#6B4B22] hover:bg-[#E7D7B9]"
                >
                  나의 발언록
                </Link>
              </div>
            </div>

            <div className="border-4 border-double border-[#7A5B28] bg-[#FFF8E8] p-6 shadow-[14px_14px_0_rgba(47,42,36,0.14)]">
              <SmallLabel>Inscribed Motion</SmallLabel>

              <h2
                className="mt-4 text-4xl font-black leading-tight text-[#2F2A24] md:text-5xl"
                style={{ fontFamily: fonts.inscription }}
              >
                시민 발언은 익명으로 기록되어야 하는가?
              </h2>

              <p className="mt-5 text-sm leading-7 text-[#6E5B3E]">
                이 의제는 민회의 중앙 석판에 새겨진 질문처럼 제시됩니다.
                각 시민은 찬성 또는 반대 입장에서 근거를 제출하고, 다른
                발언에 반론을 남깁니다.
              </p>

              <div className="mt-6 grid grid-cols-3 gap-3 text-center" style={{ fontFamily: fonts.ui }}>
                <div className="border border-[#BFA985] bg-[#F0E2C5] p-4">
                  <p className="text-2xl font-black text-[#1F3A5F]">28</p>
                  <p className="mt-1 text-xs font-bold text-[#7A5B28]">
                    참여 시민
                  </p>
                </div>
                <div className="border border-[#BFA985] bg-[#F0E2C5] p-4">
                  <p className="text-2xl font-black text-[#244B73]">12</p>
                  <p className="mt-1 text-xs font-bold text-[#7A5B28]">
                    찬성 발언
                  </p>
                </div>
                <div className="border border-[#BFA985] bg-[#F0E2C5] p-4">
                  <p className="text-2xl font-black text-[#8A4938]">9</p>
                  <p className="mt-1 text-xs font-bold text-[#7A5B28]">
                    반대 발언
                  </p>
                </div>
              </div>
            </div>
          </div>

          <section className="mt-16 border-4 border-double border-[#2F2A24] bg-[#FFF3D3] p-6 shadow-[12px_12px_0_rgba(47,42,36,0.16)]">
            <div className="border-b-4 border-double border-[#2F2A24] pb-5 text-center">
              <SmallLabel>Public Decree of Metropolis</SmallLabel>

              <h2
                className="mt-3 text-4xl font-black leading-tight text-[#2F2A24] md:text-6xl"
                style={{ fontFamily: fonts.inscription }}
              >
                익명성은 공론장을 더 자유롭게 만드는가?
              </h2>

              <p className="mt-3 text-xs font-black uppercase tracking-[0.24em] text-[#7A5B28]">
                Motion · Arguments · Replies · Civic Record
              </p>
            </div>

            <div className="mt-6 grid gap-6 lg:grid-cols-[1.25fr_0.75fr]">
              <article className="border-b border-[#2F2A24] pb-6 lg:border-b-0 lg:border-r lg:pr-6">
                <p className="text-xs font-black uppercase tracking-[0.25em] text-[#7A5B28]">
                  Assembly Record
                </p>

                <p className="mt-4 columns-1 text-sm leading-8 text-[#4F412E] md:columns-2">
                  아고라 기록형 UI는 기존 신문형 레이아웃의 장점인 강한
                  제목, 다단 구성, 핵심 주장 요약을 유지합니다. 하지만
                  명칭과 시각 요소는 고대 그리스에 맞게 바꿉니다. 기사는
                  “발언 기록”이 되고, 신문명은 “아고라 기록”이 되며,
                  편집자 메모는 “서기의 주석”이 됩니다.
                </p>

                <div className="mt-8 grid gap-5 md:grid-cols-2">
                  {argumentsList.slice(0, 2).map((argument) => (
                    <article
                      key={argument.title}
                      className="border-t-4 border-[#2F2A24] pt-5"
                    >
                      <div className="flex items-center gap-2">
                        <SideMark side={argument.side} />
                        <span className="text-xs font-bold text-[#7A5B28]">
                          {argument.author}
                        </span>
                      </div>

                      <h3
                        className="mt-3 text-2xl font-black leading-8 text-[#2F2A24]"
                        style={{ fontFamily: fonts.inscription }}
                      >
                        {argument.title}
                      </h3>

                      <p className="mt-2 text-sm leading-7 text-[#4F412E]">
                        {argument.content}
                      </p>

                      <div className="mt-4 flex gap-3 text-xs font-black text-[#7A5B28]">
                        <span>댓글 3개</span>
                        <span>반론 남기기</span>
                      </div>
                    </article>
                  ))}
                </div>
              </article>

              <aside>
                <p className="text-xs font-black uppercase tracking-[0.25em] text-[#7A5B28]">
                  Public Motions
                </p>

                <div className="mt-4 space-y-5">
                  {topics.map((topic) => (
                    <article
                      key={topic.title}
                      className="border-b border-[#2F2A24]/25 pb-4 last:border-b-0"
                    >
                      <div className="flex items-center justify-between gap-3">
                        <span className="border border-[#2F2A24] bg-[#F0E2C5] px-2 py-1 text-[10px] font-black uppercase tracking-[0.12em]">
                          {topic.status}
                        </span>
                        <span className="text-xs font-bold text-[#7A5B28]">
                          {topic.citizens} citizens
                        </span>
                      </div>

                      <h3
                        className="mt-3 text-xl font-black leading-7 text-[#1F3A5F]"
                        style={{ fontFamily: fonts.inscription }}
                      >
                        {topic.title}
                      </h3>

                      <p className="mt-2 text-xs leading-5 text-[#5F4E37]">
                        {topic.description}
                      </p>
                    </article>
                  ))}
                </div>

                <div className="mt-6 border-4 border-double border-[#7A5B28] bg-[#F0E2C5] p-4">
                  <p className="text-xs font-black uppercase tracking-[0.25em] text-[#7A5B28]">
                    Scribe&apos;s Note
                  </p>
                  <p className="mt-3 text-sm leading-6 text-[#4F412E]">
                    이 UI는 홈의 대표 토론, 종료된 토론 요약, 토픽 상세
                    상단에 잘 어울립니다. 실제 글 목록은 조금 더 단순한
                    카드형으로 유지하면 사용성도 지킬 수 있습니다.
                  </p>
                </div>
              </aside>
            </div>

            <div
              className="mt-6 border-t-4 border-double border-[#2F2A24] pt-4 text-center text-xs font-black uppercase tracking-[0.25em] text-[#7A5B28]"
              style={{ fontFamily: fonts.ui }}
            >
              Agora · Decree · Argument · Reply · Archive
            </div>
          </section>

          <section className="mt-16 grid gap-6 lg:grid-cols-[0.8fr_1.2fr]">
            <div className="border-4 border-double border-[#7A5B28] bg-[#EFE1C0] p-6">
              <SmallLabel>Civic Inscription</SmallLabel>

              <h2
                className="mt-4 text-4xl font-black leading-tight text-[#1F3A5F]"
                style={{ fontFamily: fonts.inscription }}
              >
                석비에 새겨진 시민 발언
              </h2>

              <p className="mt-4 text-sm leading-7 text-[#5F4E37]">
                게시글을 “포스트”가 아니라 하나의 기록 조각처럼 표현합니다.
                찬성과 반대의 라벨은 현대적으로 유지하되, 전체 분위기는
                공적 기록물처럼 갑니다.
              </p>
            </div>

            <div className="grid gap-4 md:grid-cols-3">
              {argumentsList.map((argument) => (
                <article
                  key={argument.title}
                  className="border border-[#BFA985] bg-[#FFF8E8] p-5 shadow-[6px_6px_0_rgba(47,42,36,0.1)]"
                >
                  <div className="flex flex-wrap items-center gap-2">
                    <SideMark side={argument.side} />
                    <span className="text-xs font-bold text-[#7A5B28]">
                      {argument.author}
                    </span>
                  </div>

                  <h3
                    className="mt-4 text-xl font-black leading-7 text-[#2F2A24]"
                    style={{ fontFamily: fonts.inscription }}
                  >
                    {argument.title}
                  </h3>

                  <p
                    className="mt-3 text-sm leading-7 text-[#5F4E37]"
                    style={{ fontFamily: fonts.scribe }}
                  >
                    {argument.content}
                  </p>
                </article>
              ))}
            </div>
          </section>
        </div>
      </section>
    </main>
  );
}