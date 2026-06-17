import Link from "next/link";
import type { CSSProperties, ReactNode } from "react";

const fonts = {
  athena:
    'Georgia, "Times New Roman", "Noto Serif KR", serif',
  poseidon:
    'Impact, Haettenschweiler, "Arial Narrow Bold", "Trebuchet MS", sans-serif',
  inscription:
    'Cinzel, Georgia, "Times New Roman", "Noto Serif KR", serif',
  ui:
    'Avenir, "Trebuchet MS", Arial, "Noto Sans KR", sans-serif',
};

const pageBackground: CSSProperties = {
  backgroundImage:
    "radial-gradient(circle at 18% 6%, rgba(218,184,106,0.22), transparent 28%), radial-gradient(circle at 82% 10%, rgba(41,128,185,0.26), transparent 32%), linear-gradient(90deg, rgba(224,200,144,0.06) 1px, transparent 1px)",
  backgroundSize: "auto, auto, 54px 54px",
};

const motions = [
  {
    title: "익명성은 공론장을 더 자유롭게 만드는가?",
    status: "진행 중",
    athena:
      "이성적 질서와 규칙이 있다면 익명성은 더 깊은 사유를 가능하게 한다.",
    poseidon:
      "익명성은 거친 파도처럼 통제되지 않으면 토론장을 뒤흔든다.",
    heat: "논쟁 고조",
  },
  {
    title: "운영자는 어디까지 토론에 개입해야 하는가?",
    status: "토론 모집",
    athena:
      "운영자는 법과 절차를 세우는 지혜의 수호자여야 한다.",
    poseidon:
      "지나친 개입은 시민의 힘찬 발언을 억누르는 쇠사슬이 된다.",
    heat: "입장 대립",
  },
  {
    title: "좋은 반론은 상대를 꺾는 것인가?",
    status: "기록 열람",
    athena:
      "좋은 반론은 논리를 정제하고 더 나은 판단으로 이끈다.",
    poseidon:
      "반론은 때로 강한 충돌이어야 잠든 의제를 깨울 수 있다.",
    heat: "종료 기록",
  },
];

const athenaArguments = [
  {
    author: "아테나 진영 익명 1",
    title: "질서 없는 자유는 오래가지 못합니다",
    content:
      "자유로운 발언은 중요하지만, 토론이 오래 지속되려면 규칙과 절차가 함께 있어야 합니다.",
  },
  {
    author: "아테나 진영 익명 2",
    title: "좋은 의제는 감정보다 구조를 필요로 합니다",
    content:
      "논점이 정리되어야 서로 다른 시민의 발언도 하나의 판단 과정으로 연결될 수 있습니다.",
  },
];

const poseidonArguments = [
  {
    author: "포세이돈 진영 익명 1",
    title: "너무 정돈된 토론은 살아 있지 않습니다",
    content:
      "공론장은 예측 가능한 답을 모으는 곳이 아니라, 강한 충돌을 통해 새로운 관점을 끌어내는 곳입니다.",
  },
  {
    author: "포세이돈 진영 익명 2",
    title: "격정도 시민의 중요한 언어입니다",
    content:
      "모든 발언을 지나치게 점잖게 만들면, 절박한 목소리는 토론장에 도달하기 어렵습니다.",
  },
];

function TopNav() {
  return (
    <header className="relative z-20 border-b border-white/10 bg-[#070A12]/80 text-white backdrop-blur">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-5">
        <Link
          href="/"
          className="text-2xl font-black tracking-[0.24em] text-[#E8C66A]"
          style={{ fontFamily: fonts.inscription }}
        >
          METROPOLIS
        </Link>

        <nav className="flex items-center gap-2 text-sm" style={{ fontFamily: fonts.ui }}>
          <Link
            href="/topics"
            className="rounded-full px-3 py-2 font-semibold text-slate-200 hover:bg-white/10"
          >
            의제
          </Link>
          <Link
            href="/me"
            className="rounded-full px-3 py-2 font-semibold text-slate-200 hover:bg-white/10"
          >
            내 기록
          </Link>
          <Link
            href="/login"
            className="rounded-full bg-[#E8C66A] px-4 py-2 font-black text-[#07101F] hover:bg-[#F3DA8F]"
          >
            토론장 입장
          </Link>
        </nav>
      </div>
    </header>
  );
}

function TinyLabel({ children, tone = "gold" }: { children: ReactNode; tone?: "gold" | "blue" | "white" }) {
  const color =
    tone === "blue"
      ? "text-[#7FC7FF]"
      : tone === "white"
        ? "text-white/70"
        : "text-[#E8C66A]";

  return (
    <p
      className={`text-xs font-black uppercase tracking-[0.28em] ${color}`}
      style={{ fontFamily: fonts.ui }}
    >
      {children}
    </p>
  );
}

function AthenaMark() {
  return (
    <div className="flex h-16 w-16 items-center justify-center rounded-full border-4 border-double border-[#C7A74B] bg-[#FFF5D8] text-3xl shadow-[0_0_40px_rgba(232,198,106,0.25)]">
      ♜
    </div>
  );
}

function PoseidonMark() {
  return (
    <div className="flex h-16 w-16 items-center justify-center rounded-full border-4 border-double border-[#6EC7FF] bg-[#071B2A] text-3xl text-[#9DDEFF] shadow-[0_0_45px_rgba(86,184,255,0.35)]">
      Ψ
    </div>
  );
}

export default function StyleAthenaPoseidonPage() {
  return (
    <main
      className="min-h-screen overflow-hidden bg-[#070A12] text-white"
      style={pageBackground}
    >
      <TopNav />

      <HeroContest />
      <DivineSplitMotions />
      <BattleChamber />
      <FinalDirection />
    </main>
  );
}

function HeroContest() {
  return (
    <section className="relative min-h-[760px] border-b border-white/10">
      <div className="absolute inset-0 grid lg:grid-cols-2">
        <div
          className="min-h-[380px] bg-[#F3E6C4]"
          style={{
            backgroundImage:
              "radial-gradient(circle at 20% 10%, rgba(126,98,33,0.20), transparent 30%), linear-gradient(135deg, rgba(255,255,255,0.35), transparent 45%)",
          }}
        />
        <div
          className="min-h-[380px] bg-[#071A2B]"
          style={{
            backgroundImage:
              "radial-gradient(circle at 80% 8%, rgba(100,196,255,0.28), transparent 30%), linear-gradient(135deg, rgba(20,80,130,0.25), transparent 55%)",
          }}
        />
      </div>

      <div className="relative z-10 mx-auto grid min-h-[760px] max-w-7xl items-center gap-10 px-6 py-20 lg:grid-cols-[1fr_280px_1fr]">
        <div className="text-[#1D2430]">
          <TinyLabel>Wisdom · Order · Olive</TinyLabel>

          <div className="mt-5 flex items-center gap-4">
            <AthenaMark />
            <h1
              className="text-6xl font-black leading-none md:text-8xl"
              style={{ fontFamily: fonts.athena }}
            >
              ATHENA
            </h1>
          </div>

          <p
            className="mt-6 max-w-xl text-lg leading-8 text-[#4C4332]"
            style={{ fontFamily: fonts.athena }}
          >
            아테나의 진영은 토론을 질서, 규칙, 논증, 기록의 공간으로 봅니다.
            좋은 공론장은 감정을 억누르는 곳이 아니라, 감정이 판단으로
            정제되는 장소입니다.
          </p>

          <div className="mt-8 grid max-w-xl gap-3 sm:grid-cols-3" style={{ fontFamily: fonts.ui }}>
            {["논리", "질서", "절차"].map((item) => (
              <div
                key={item}
                className="border border-[#9F7E2D] bg-[#FFF7DF] px-4 py-3 text-center text-sm font-black text-[#6A4B12]"
              >
                {item}
              </div>
            ))}
          </div>
        </div>

        <div className="relative mx-auto flex h-[340px] w-[260px] flex-col items-center justify-center rounded-t-full border-4 border-double border-[#E8C66A] bg-[#101827] p-6 text-center shadow-[0_30px_90px_rgba(0,0,0,0.55)]">
          <div className="absolute -top-8 h-16 w-16 rounded-full border-4 border-[#E8C66A] bg-[#101827]" />

          <TinyLabel>Central Contest</TinyLabel>

          <h2
            className="mt-4 text-3xl font-black leading-tight text-[#F8EFD2]"
            style={{ fontFamily: fonts.inscription }}
          >
            하나의 의제,
            <br />
            두 신의 판단
          </h2>

          <p className="mt-4 text-sm leading-6 text-[#D5C7A3]">
            모든 토론은 중앙 제단에 놓인 의제를 두고 시작됩니다.
            아테나의 지혜와 포세이돈의 힘이 서로의 논리를 시험합니다.
          </p>

          <div className="mt-6 h-1 w-full bg-gradient-to-r from-[#E8C66A] via-white to-[#6EC7FF]" />

          <div className="mt-6 flex gap-3" style={{ fontFamily: fonts.ui }}>
            <Link
              href="/topics"
              className="rounded-full bg-[#E8C66A] px-4 py-2 text-xs font-black text-[#101827]"
            >
              의제 보기
            </Link>
            <Link
              href="/me"
              className="rounded-full border border-[#6EC7FF]/50 px-4 py-2 text-xs font-black text-[#C8EEFF]"
            >
              내 기록
            </Link>
          </div>
        </div>

        <div className="text-right text-[#DDF4FF]">
          <TinyLabel tone="blue">Storm · Force · Sea</TinyLabel>

          <div className="mt-5 flex items-center justify-end gap-4">
            <h1
              className="text-6xl font-black leading-none tracking-wide md:text-8xl"
              style={{ fontFamily: fonts.poseidon }}
            >
              POSEIDON
            </h1>
            <PoseidonMark />
          </div>

          <p
            className="ml-auto mt-6 max-w-xl text-lg leading-8 text-[#B9DDF0]"
            style={{ fontFamily: fonts.ui }}
          >
            포세이돈의 진영은 토론을 충돌, 힘, 파도, 균열의 공간으로 봅니다.
            좋은 공론장은 언제나 평온하지 않습니다. 때로는 거센 반론이
            잠든 의제를 깨웁니다.
          </p>

          <div className="ml-auto mt-8 grid max-w-xl gap-3 sm:grid-cols-3" style={{ fontFamily: fonts.ui }}>
            {["충돌", "격정", "전복"].map((item) => (
              <div
                key={item}
                className="border border-[#6EC7FF]/40 bg-[#092D47] px-4 py-3 text-center text-sm font-black text-[#9DDEFF]"
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

function DivineSplitMotions() {
  return (
    <section className="border-b border-white/10 px-6 py-20">
      <div className="mx-auto max-w-7xl">
        <div className="text-center">
          <TinyLabel>Public Motions Reimagined</TinyLabel>
          <h2
            className="mt-4 text-4xl font-black leading-tight text-[#F8EFD2] md:text-6xl"
            style={{ fontFamily: fonts.inscription }}
          >
            의제는 카드가 아니라 전장입니다
          </h2>
          <p className="mx-auto mt-5 max-w-3xl text-sm leading-7 text-[#CFC4A8]">
            기존 토픽 카드를 버리고, 각 의제를 아테나와 포세이돈의 해석이
            부딪히는 “대립판”으로 보여줍니다. 사용자는 제목만 보는 것이 아니라,
            시작부터 양측의 관점을 동시에 마주합니다.
          </p>
        </div>

        <div className="mt-12 space-y-8">
          {motions.map((motion, index) => (
            <MotionDuel key={motion.title} motion={motion} index={index} />
          ))}
        </div>
      </div>
    </section>
  );
}

function MotionDuel({
  motion,
  index,
}: {
  motion: {
    title: string;
    status: string;
    athena: string;
    poseidon: string;
    heat: string;
  };
  index: number;
}) {
  return (
    <article className="relative overflow-hidden rounded-[2rem] border border-white/10 bg-[#0F1724] shadow-[0_24px_80px_rgba(0,0,0,0.35)]">
      <div className="grid lg:grid-cols-[1fr_260px_1fr]">
        <div className="bg-[#F1E0B7] p-6 text-[#2F2A24] lg:p-8">
          <div className="flex items-center gap-3">
            <AthenaMark />
            <div>
              <p className="text-xs font-black uppercase tracking-[0.25em] text-[#9F7E2D]">
                Athena&apos;s Reading
              </p>
              <p className="mt-1 text-sm font-bold text-[#6A4B12]">
                질서와 지혜의 해석
              </p>
            </div>
          </div>

          <p
            className="mt-6 text-2xl font-black leading-9"
            style={{ fontFamily: fonts.athena }}
          >
            “{motion.athena}”
          </p>
        </div>

        <div className="flex flex-col items-center justify-center border-y border-white/10 bg-[#111827] p-6 text-center lg:border-x lg:border-y-0">
          <p className="text-xs font-black uppercase tracking-[0.25em] text-[#E8C66A]">
            Motion {String(index + 1).padStart(2, "0")}
          </p>

          <h3
            className="mt-4 text-3xl font-black leading-tight text-[#F8EFD2]"
            style={{ fontFamily: fonts.inscription }}
          >
            {motion.title}
          </h3>

          <div className="mt-5 flex flex-wrap justify-center gap-2" style={{ fontFamily: fonts.ui }}>
            <span className="rounded-full bg-[#E8C66A] px-3 py-1 text-xs font-black text-[#111827]">
              {motion.status}
            </span>
            <span className="rounded-full border border-[#6EC7FF]/40 px-3 py-1 text-xs font-black text-[#9DDEFF]">
              {motion.heat}
            </span>
          </div>

          <Link
            href="/topics"
            className="mt-6 rounded-full border border-white/20 px-5 py-2 text-sm font-black text-white hover:bg-white/10"
            style={{ fontFamily: fonts.ui }}
          >
            대립판 입장
          </Link>
        </div>

        <div className="bg-[#08263D] p-6 text-[#DDF4FF] lg:p-8">
          <div className="flex items-center justify-end gap-3 text-right">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.25em] text-[#7FC7FF]">
                Poseidon&apos;s Reading
              </p>
              <p className="mt-1 text-sm font-bold text-[#9DDEFF]">
                파도와 충돌의 해석
              </p>
            </div>
            <PoseidonMark />
          </div>

          <p
            className="mt-6 text-right text-2xl font-black leading-9"
            style={{ fontFamily: fonts.poseidon }}
          >
            “{motion.poseidon}”
          </p>
        </div>
      </div>
    </article>
  );
}

function BattleChamber() {
  return (
    <section className="border-b border-white/10 bg-[#090D16] px-6 py-20">
      <div className="mx-auto max-w-7xl">
        <div className="grid gap-10 lg:grid-cols-[0.8fr_1.2fr] lg:items-start">
          <div>
            <TinyLabel>Debate Chamber</TinyLabel>
            <h2
              className="mt-4 text-4xl font-black leading-tight text-[#F8EFD2] md:text-6xl"
              style={{ fontFamily: fonts.inscription }}
            >
              토론방은 두 진영이 충돌하는 해협입니다
            </h2>
            <p className="mt-5 text-sm leading-7 text-[#CFC4A8]">
              실제 `/topics/[topicId]/debate` 페이지에 적용한다면,
              게시글을 단순 목록으로 쌓는 대신 아테나 진영과 포세이돈 진영을
              좌우로 분리할 수 있습니다. 중앙에는 현재 의제와 토론 상태가
              놓입니다.
            </p>

            <div className="mt-8 rounded-[2rem] border border-[#E8C66A]/25 bg-[#141B29] p-6">
              <p className="text-xs font-black uppercase tracking-[0.25em] text-[#E8C66A]">
                Central Question
              </p>
              <h3
                className="mt-3 text-3xl font-black leading-tight text-[#F8EFD2]"
                style={{ fontFamily: fonts.inscription }}
              >
                공론장은 질서를 먼저 세워야 하는가,
                충돌을 먼저 허용해야 하는가?
              </h3>
              <p className="mt-4 text-sm leading-7 text-[#CFC4A8]">
                이 구조에서는 “찬성/반대”보다 더 강한 브랜드 언어를 사용할 수
                있습니다. 찬성은 아테나의 질서, 반대는 포세이돈의 충돌로
                치환됩니다.
              </p>
            </div>
          </div>

          <div className="relative rounded-[2.5rem] border border-white/10 bg-[#111827] p-5 shadow-[0_30px_100px_rgba(0,0,0,0.45)]">
            <div className="absolute left-1/2 top-0 hidden h-full w-px -translate-x-1/2 bg-gradient-to-b from-transparent via-[#E8C66A] to-transparent lg:block" />

            <div className="grid gap-5 lg:grid-cols-2">
              <div className="rounded-[2rem] border border-[#E8C66A]/30 bg-[#F1E0B7] p-5 text-[#2F2A24]">
                <div className="mb-5 flex items-center gap-3">
                  <AthenaMark />
                  <div>
                    <p className="text-xs font-black uppercase tracking-[0.25em] text-[#9F7E2D]">
                      Athena Bench
                    </p>
                    <h3
                      className="text-2xl font-black text-[#1D2430]"
                      style={{ fontFamily: fonts.athena }}
                    >
                      지혜의 발언
                    </h3>
                  </div>
                </div>

                <div className="space-y-4">
                  {athenaArguments.map((argument) => (
                    <ArgumentTablet
                      key={argument.title}
                      tone="athena"
                      argument={argument}
                    />
                  ))}
                </div>
              </div>

              <div className="rounded-[2rem] border border-[#6EC7FF]/30 bg-[#08263D] p-5 text-[#DDF4FF]">
                <div className="mb-5 flex items-center justify-end gap-3 text-right">
                  <div>
                    <p className="text-xs font-black uppercase tracking-[0.25em] text-[#7FC7FF]">
                      Poseidon Bench
                    </p>
                    <h3
                      className="text-2xl font-black text-[#DDF4FF]"
                      style={{ fontFamily: fonts.poseidon }}
                    >
                      파도의 발언
                    </h3>
                  </div>
                  <PoseidonMark />
                </div>

                <div className="space-y-4">
                  {poseidonArguments.map((argument) => (
                    <ArgumentTablet
                      key={argument.title}
                      tone="poseidon"
                      argument={argument}
                    />
                  ))}
                </div>
              </div>
            </div>

            <div
              className="mt-5 grid gap-3 text-center text-xs font-black uppercase tracking-[0.16em] md:grid-cols-4"
              style={{ fontFamily: fonts.ui }}
            >
              {["의제 선언", "진영 선택", "발언 제출", "반론 충돌"].map((step) => (
                <div
                  key={step}
                  className="rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-4 text-[#CFC4A8]"
                >
                  {step}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function ArgumentTablet({
  tone,
  argument,
}: {
  tone: "athena" | "poseidon";
  argument: {
    author: string;
    title: string;
    content: string;
  };
}) {
  const isAthena = tone === "athena";

  return (
    <article
      className={
        isAthena
          ? "border border-[#BFA15C] bg-[#FFF7DF] p-5 shadow-[6px_6px_0_rgba(106,75,18,0.12)]"
          : "border border-[#6EC7FF]/35 bg-[#0B304D] p-5 shadow-[6px_6px_0_rgba(0,0,0,0.22)]"
      }
    >
      <p
        className={
          isAthena
            ? "text-xs font-black uppercase tracking-[0.2em] text-[#9F7E2D]"
            : "text-xs font-black uppercase tracking-[0.2em] text-[#7FC7FF]"
        }
        style={{ fontFamily: fonts.ui }}
      >
        {argument.author}
      </p>

      <h4
        className={
          isAthena
            ? "mt-3 text-2xl font-black leading-8 text-[#1D2430]"
            : "mt-3 text-2xl font-black leading-8 text-[#DDF4FF]"
        }
        style={{ fontFamily: isAthena ? fonts.athena : fonts.poseidon }}
      >
        {argument.title}
      </h4>

      <p
        className={
          isAthena
            ? "mt-3 text-sm leading-7 text-[#5F5032]"
            : "mt-3 text-sm leading-7 text-[#B9DDF0]"
        }
        style={{ fontFamily: fonts.ui }}
      >
        {argument.content}
      </p>

      <div
        className={
          isAthena
            ? "mt-4 flex gap-3 border-t border-[#BFA15C]/50 pt-3 text-xs font-black text-[#6A4B12]"
            : "mt-4 flex gap-3 border-t border-[#6EC7FF]/25 pt-3 text-xs font-black text-[#9DDEFF]"
        }
        style={{ fontFamily: fonts.ui }}
      >
        <span>댓글 3개</span>
        <span>반론 남기기</span>
      </div>
    </article>
  );
}

function FinalDirection() {
  return (
    <section className="px-6 py-20">
      <div className="mx-auto max-w-7xl">
        <div className="rounded-[2.5rem] border border-[#E8C66A]/30 bg-[#101827] p-8 shadow-[0_30px_100px_rgba(0,0,0,0.4)]">
          <div className="grid gap-8 lg:grid-cols-[0.7fr_1.3fr] lg:items-center">
            <div>
              <TinyLabel>Recommended Usage</TinyLabel>
              <h2
                className="mt-4 text-4xl font-black leading-tight text-[#F8EFD2] md:text-5xl"
                style={{ fontFamily: fonts.inscription }}
              >
                이 컨셉은 실제 서비스 구조와 잘 맞습니다
              </h2>
            </div>

            <div className="grid gap-4 md:grid-cols-3" style={{ fontFamily: fonts.ui }}>
              <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-5">
                <p className="font-black text-[#E8C66A]">/topics</p>
                <p className="mt-2 text-sm leading-6 text-[#CFC4A8]">
                  각 토픽을 아테나 해석과 포세이돈 해석이 맞서는 대립판으로 표시
                </p>
              </div>

              <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-5">
                <p className="font-black text-[#E8C66A]">/debate</p>
                <p className="mt-2 text-sm leading-6 text-[#CFC4A8]">
                  게시글을 아테나 진영과 포세이돈 진영으로 나누어 배치
                </p>
              </div>

              <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-5">
                <p className="font-black text-[#E8C66A]">/admin</p>
                <p className="mt-2 text-sm leading-6 text-[#CFC4A8]">
                  관리자는 중앙 제단의 의제를 세우는 기록관/중재자처럼 표현
                </p>
              </div>
            </div>
          </div>

          <div className="mt-8 h-2 rounded-full bg-gradient-to-r from-[#E8C66A] via-white to-[#6EC7FF]" />
        </div>
      </div>
    </section>
  );
}