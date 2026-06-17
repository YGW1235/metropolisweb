import Link from "next/link";

const topics = [
  {
    title: "도시의 광장은 누구에게 열려야 하는가?",
    description:
      "공공 토론장에 참여할 수 있는 시민의 범위와 책임에 대해 논의합니다.",
    status: "진행 중",
    side: "찬성/반대 토론",
    participants: 24,
  },
  {
    title: "익명 토론은 더 공정한가?",
    description:
      "익명성이 자유로운 발언을 돕는지, 책임 있는 토론을 방해하는지 다룹니다.",
    status: "모집 중",
    side: "입장 선택 가능",
    participants: 17,
  },
  {
    title: "운영자는 어디까지 개입해야 하는가?",
    description:
      "토론의 질서를 유지하기 위한 관리자 권한과 시민 자율성의 균형을 살펴봅니다.",
    status: "종료",
    side: "기록 열람",
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

function StatusBadge({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex rounded-full border border-[#BFA16A]/40 bg-[#F3E8D0] px-3 py-1 text-xs font-semibold text-[#6F5428]">
      {children}
    </span>
  );
}

function SideBadge({ side }: { side: "찬성" | "반대" }) {
  const isPro = side === "찬성";

  return (
    <span
      className={
        isPro
          ? "inline-flex rounded-full border border-[#2F5F8F]/25 bg-[#E7EEF7] px-3 py-1 text-xs font-semibold text-[#1F3A5F]"
          : "inline-flex rounded-full border border-[#A85D4F]/25 bg-[#F5E7E2] px-3 py-1 text-xs font-semibold text-[#8A3F32]"
      }
    >
      {side}
    </span>
  );
}

export default function StylePreviewPage() {
  return (
    <main className="min-h-screen bg-[#F7F3EB] text-[#2F2A24]">
      <div
        className="border-b border-[#D8CFC2] bg-[#FFFDF8]"
        style={{
          backgroundImage:
            "linear-gradient(90deg, rgba(166,124,82,0.12) 1px, transparent 1px), linear-gradient(rgba(166,124,82,0.08) 1px, transparent 1px)",
          backgroundSize: "28px 28px",
        }}
      >
        <header className="mx-auto flex max-w-6xl items-center justify-between px-6 py-5">
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
              className="rounded-md bg-[#1F3A5F] px-4 py-2 font-semibold text-[#FFFDF8] shadow-sm hover:bg-[#2A4B78]"
            >
              입장하기
            </Link>
          </nav>
        </header>

        <div className="h-2 border-t border-[#C9A66B]/40 bg-[repeating-linear-gradient(90deg,#C9A66B_0,#C9A66B_10px,transparent_10px,transparent_18px)] opacity-70" />
      </div>

      <section className="mx-auto max-w-6xl px-6 py-16">
        <div className="grid gap-10 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
          <div>
            <p className="mb-4 text-sm font-semibold uppercase tracking-[0.3em] text-[#A67C52]">
              Digital Agora
            </p>

            <h1 className="font-serif text-5xl font-bold leading-tight text-[#1F3A5F] md:text-6xl">
              시민의 의제가 모이는
              <br />
              현대의 아고라
            </h1>

            <p className="mt-6 max-w-2xl text-lg leading-8 text-[#6E655C]">
              Metropolis는 다양한 입장의 사용자가 하나의 의제를 두고
              질서 있게 토론하는 공론장입니다. 고대 도시국가의 광장처럼,
              이곳에서는 의견이 기록되고 입장이 비교되며 토론이 축적됩니다.
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
            <div className="border-b border-[#E3D8C8] pb-4">
              <p className="text-xs font-semibold uppercase tracking-[0.25em] text-[#A67C52]">
                Current Assembly
              </p>
              <h2 className="mt-2 font-serif text-2xl font-bold text-[#2F2A24]">
                오늘의 주요 의제
              </h2>
            </div>

            <div className="mt-5 space-y-4">
              {topics.slice(0, 2).map((topic) => (
                <article
                  key={topic.title}
                  className="rounded-xl border border-[#E3D8C8] bg-[#FBF6EC] p-4"
                >
                  <div className="flex items-center justify-between gap-3">
                    <StatusBadge>{topic.status}</StatusBadge>
                    <span className="text-xs text-[#7D7168]">
                      참여자 {topic.participants}명
                    </span>
                  </div>

                  <h3 className="mt-4 font-serif text-xl font-bold text-[#1F3A5F]">
                    {topic.title}
                  </h3>

                  <p className="mt-2 text-sm leading-6 text-[#6E655C]">
                    {topic.description}
                  </p>
                </article>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="border-y border-[#D8CFC2] bg-[#EFE7DA]">
        <div className="mx-auto grid max-w-6xl gap-4 px-6 py-8 md:grid-cols-3">
          <div className="rounded-xl border border-[#D8CFC2] bg-[#FFFDF8] p-5">
            <p className="font-serif text-xl font-bold text-[#1F3A5F]">
              의제 중심
            </p>
            <p className="mt-2 text-sm leading-6 text-[#6E655C]">
              사용자는 주제별로 입장을 선택하고 토론에 참여합니다.
            </p>
          </div>

          <div className="rounded-xl border border-[#D8CFC2] bg-[#FFFDF8] p-5">
            <p className="font-serif text-xl font-bold text-[#1F3A5F]">
              익명 발언
            </p>
            <p className="mt-2 text-sm leading-6 text-[#6E655C]">
              찬성 익명, 반대 익명처럼 입장 기반 라벨로 의견을 기록합니다.
            </p>
          </div>

          <div className="rounded-xl border border-[#D8CFC2] bg-[#FFFDF8] p-5">
            <p className="font-serif text-xl font-bold text-[#1F3A5F]">
              운영 질서
            </p>
            <p className="mt-2 text-sm leading-6 text-[#6E655C]">
              관리자는 의제를 만들고 토론 공간의 기본 질서를 유지합니다.
            </p>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-6 py-14">
        <div className="mb-8 flex flex-col justify-between gap-4 md:flex-row md:items-end">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.25em] text-[#A67C52]">
              Public Topics
            </p>
            <h2 className="mt-2 font-serif text-4xl font-bold text-[#1F3A5F]">
              도시의 의제
            </h2>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-[#6E655C]">
              현재 열려 있는 토론 주제를 확인하고, 자신의 입장을 선택해
              공론장에 참여하세요.
            </p>
          </div>

          <Link
            href="/topics"
            className="rounded-md border border-[#BFA16A] bg-[#FFFDF8] px-4 py-2 text-sm font-semibold text-[#6F5428] hover:bg-[#F3E8D0]"
          >
            전체 의제 보기
          </Link>
        </div>

        <div className="grid gap-5 md:grid-cols-3">
          {topics.map((topic) => (
            <article
              key={topic.title}
              className="group flex min-h-[260px] flex-col rounded-2xl border border-[#D8CFC2] bg-[#FFFDF8] p-5 shadow-sm transition hover:-translate-y-1 hover:shadow-[0_18px_50px_rgba(47,42,36,0.12)]"
            >
              <div className="flex items-center justify-between gap-3">
                <StatusBadge>{topic.status}</StatusBadge>
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

              <div className="mt-6 flex items-center justify-between border-t border-[#E3D8C8] pt-4">
                <span className="text-xs font-medium text-[#A67C52]">
                  {topic.side}
                </span>
                <span className="text-sm font-semibold text-[#1F3A5F] group-hover:underline">
                  자세히 보기
                </span>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-6 pb-20">
        <div className="rounded-2xl border border-[#D8CFC2] bg-[#FFFDF8] p-6 shadow-sm">
          <div className="border-b border-[#E3D8C8] pb-5">
            <p className="text-sm font-semibold uppercase tracking-[0.25em] text-[#A67C52]">
              Debate Chamber
            </p>
            <h2 className="mt-2 font-serif text-3xl font-bold text-[#1F3A5F]">
              토론 게시글 예시
            </h2>
            <p className="mt-3 text-sm leading-6 text-[#6E655C]">
              실제 토론방에서는 찬성/반대 입장과 익명 라벨이 함께 표시됩니다.
            </p>
          </div>

          <div className="mt-6 space-y-5">
            {posts.map((post) => (
              <article
                key={post.title}
                className="rounded-xl border border-[#E3D8C8] bg-[#FBF6EC] p-5"
              >
                <div className="flex flex-wrap items-center gap-3">
                  <SideBadge side={post.side as "찬성" | "반대"} />
                  <span className="text-sm font-medium text-[#6E655C]">
                    {post.author}
                  </span>
                </div>

                <h3 className="mt-4 font-serif text-2xl font-bold text-[#2F2A24]">
                  {post.title}
                </h3>

                <p className="mt-3 text-sm leading-7 text-[#5F554C]">
                  {post.content}
                </p>

                <div className="mt-5 flex items-center justify-between border-t border-[#E3D8C8] pt-4 text-xs text-[#7D7168]">
                  <span>댓글 3개</span>
                  <div className="flex gap-3">
                    <button className="font-medium hover:text-[#1F3A5F]">
                      댓글 작성
                    </button>
                    <button className="font-medium hover:text-[#8A3F32]">
                      신고
                    </button>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}