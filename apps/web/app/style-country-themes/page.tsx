import Link from "next/link";
import type { CSSProperties } from "react";

const topics = [
  {
    title: "공론장은 익명이어야 하는가?",
    description:
      "자유로운 발언과 책임 있는 토론 사이의 균형을 논의합니다.",
    status: "진행 중",
    participants: 28,
  },
  {
    title: "운영자는 어디까지 개입해야 하는가?",
    description:
      "질서 유지를 위한 관리 권한과 시민 자율성의 경계를 다룹니다.",
    status: "토론 모집",
    participants: 16,
  },
  {
    title: "좋은 반론의 조건은 무엇인가?",
    description:
      "상대 입장을 무너뜨리는 것이 아니라 논의를 발전시키는 반론을 정의합니다.",
    status: "기록 열람",
    participants: 42,
  },
];

const posts = [
  {
    side: "찬성",
    author: "찬성 익명 1",
    title: "익명성은 더 넓은 참여를 가능하게 합니다",
    content:
      "발언자의 배경보다 논거 자체가 평가받을 때, 더 많은 시민이 부담 없이 토론에 들어올 수 있습니다.",
  },
  {
    side: "반대",
    author: "반대 익명 1",
    title: "익명성에도 최소한의 책임 장치가 필요합니다",
    content:
      "자유로운 발언은 중요하지만, 토론의 질서를 유지하기 위한 신고와 관리 구조가 함께 있어야 합니다.",
  },
];

type CountryTheme = {
  id: string;
  country: string;
  label: string;
  title: string;
  description: string;
  keywords: string[];
  shellClass: string;
  headerClass: string;
  brandClass: string;
  navClass: string;
  primaryButtonClass: string;
  secondaryButtonClass: string;
  cardClass: string;
  miniCardClass: string;
  badgeClass: string;
  headingClass: string;
  bodyClass: string;
  mutedClass: string;
  proBadgeClass: string;
  conBadgeClass: string;
  ornamentClass: string;
  backgroundStyle?: CSSProperties;
};

const themes: CountryTheme[] = [
  {
    id: "korea-seowon",
    country: "Korea",
    label: "Seowon Debate Hall",
    title: "서원의 마루에서 이어지는 공론",
    description:
      "한국의 서원과 한옥 마루에서 영감을 받은 테마입니다. 한지, 먹색, 단청의 절제된 색감을 사용해 차분하고 품격 있는 토론장을 만듭니다.",
    keywords: ["한지", "먹색", "단청", "서원", "기록"],
    shellClass: "bg-[#F3EBDD] text-[#2B2520]",
    headerClass: "border-b border-[#BFA985] bg-[#FBF7EF]",
    brandClass: "font-serif text-2xl font-black tracking-[0.2em] text-[#263C2F]",
    navClass: "rounded-md px-3 py-2 font-semibold text-[#6A5A45] hover:bg-[#E8DDC8]",
    primaryButtonClass:
      "rounded-md bg-[#263C2F] px-5 py-3 text-sm font-bold text-[#FBF7EF] hover:bg-[#365442]",
    secondaryButtonClass:
      "rounded-md border border-[#9F7E4D] bg-[#FBF7EF] px-5 py-3 text-sm font-bold text-[#6B4B22] hover:bg-[#E8DDC8]",
    cardClass:
      "rounded-2xl border border-[#BFA985] bg-[#FBF7EF] p-6 shadow-[0_24px_70px_rgba(43,37,32,0.12)]",
    miniCardClass:
      "rounded-xl border border-[#D2BE99] bg-[#FFFDF8] p-5 transition hover:-translate-y-1 hover:shadow-[0_18px_45px_rgba(43,37,32,0.13)]",
    badgeClass:
      "rounded-full border border-[#9F7E4D]/40 bg-[#EFE1C5] px-3 py-1 text-xs font-bold text-[#6B4B22]",
    headingClass: "font-serif font-black text-[#263C2F]",
    bodyClass: "text-[#645744]",
    mutedClass: "text-[#8A7A64]",
    proBadgeClass:
      "rounded-md bg-[#DDE8E0] px-3 py-1 text-xs font-bold text-[#263C2F]",
    conBadgeClass:
      "rounded-md bg-[#E9D7CE] px-3 py-1 text-xs font-bold text-[#8A3F2F]",
    ornamentClass:
      "h-2 bg-[repeating-linear-gradient(90deg,#263C2F_0,#263C2F_12px,#B44536_12px,#B44536_20px,#D5A84C_20px,#D5A84C_28px)] opacity-80",
    backgroundStyle: {
      backgroundImage:
        "radial-gradient(circle at 15% 0%, rgba(38,60,47,0.10), transparent 28%), radial-gradient(circle at 90% 10%, rgba(180,69,54,0.10), transparent 24%)",
    },
  },
  {
    id: "rome-senate",
    country: "Italy / Rome",
    label: "Senate Forum",
    title: "원로원의 계단 위에 오른 의제",
    description:
      "고대 로마 원로원과 포룸에서 영감을 받은 테마입니다. 붉은 대리석, 금빛 장식, 묵직한 카드 구조로 공적이고 권위 있는 토론 분위기를 만듭니다.",
    keywords: ["원로원", "포룸", "대리석", "금장", "공적 발언"],
    shellClass: "bg-[#221714] text-[#F8E8D2]",
    headerClass: "border-b border-[#C9A66B]/35 bg-[#2C1C18]",
    brandClass: "font-serif text-2xl font-black tracking-[0.22em] text-[#D6A85B]",
    navClass: "rounded-sm px-3 py-2 font-bold text-[#E8D2B2] hover:bg-white/10",
    primaryButtonClass:
      "rounded-sm bg-[#B33A2E] px-5 py-3 text-sm font-black text-[#FFF4E2] hover:bg-[#C84A3C]",
    secondaryButtonClass:
      "rounded-sm border border-[#D6A85B]/50 bg-white/5 px-5 py-3 text-sm font-black text-[#D6A85B] hover:bg-white/10",
    cardClass:
      "rounded-sm border-2 border-[#D6A85B]/35 bg-[#2C1C18] p-6 shadow-[0_28px_80px_rgba(0,0,0,0.38)]",
    miniCardClass:
      "rounded-sm border border-[#D6A85B]/25 bg-[#38231D] p-5 transition hover:-translate-y-1 hover:border-[#D6A85B]/60",
    badgeClass:
      "rounded-sm border border-[#D6A85B]/40 bg-[#412A18] px-3 py-1 text-xs font-black text-[#D6A85B]",
    headingClass: "font-serif font-black text-[#F8E8D2]",
    bodyClass: "text-[#D9C2A2]",
    mutedClass: "text-[#B59D7E]",
    proBadgeClass:
      "rounded-sm bg-[#213E5C] px-3 py-1 text-xs font-black text-[#BBD7FF]",
    conBadgeClass:
      "rounded-sm bg-[#5A241E] px-3 py-1 text-xs font-black text-[#FFC0B7]",
    ornamentClass:
      "h-3 bg-[repeating-linear-gradient(90deg,#D6A85B_0,#D6A85B_10px,transparent_10px,transparent_18px)] opacity-70",
    backgroundStyle: {
      backgroundImage:
        "radial-gradient(circle at 15% 15%, rgba(214,168,91,0.16), transparent 28%), linear-gradient(90deg, rgba(214,168,91,0.04) 1px, transparent 1px)",
      backgroundSize: "auto, 44px 44px",
    },
  },
  {
    id: "japan-zen",
    country: "Japan",
    label: "Zen Council Room",
    title: "정적 속에서 논거가 선명해지는 방",
    description:
      "일본의 다다미방, 목재, 먹색, 남색에서 영감을 받은 절제형 테마입니다. 장식을 줄이고 여백을 넓게 사용해 차분한 토론 흐름을 강조합니다.",
    keywords: ["여백", "다다미", "남색", "목재", "절제"],
    shellClass: "bg-[#ECE7DC] text-[#24211D]",
    headerClass: "border-b border-[#C8BFAE] bg-[#F8F5ED]",
    brandClass: "font-serif text-2xl font-black tracking-[0.24em] text-[#1D2E3A]",
    navClass: "rounded-md px-3 py-2 font-semibold text-[#5D574F] hover:bg-[#E0D8C8]",
    primaryButtonClass:
      "rounded-md bg-[#1D2E3A] px-5 py-3 text-sm font-bold text-[#F8F5ED] hover:bg-[#2D4657]",
    secondaryButtonClass:
      "rounded-md border border-[#8B6F47] bg-[#F8F5ED] px-5 py-3 text-sm font-bold text-[#6B5132] hover:bg-[#E0D8C8]",
    cardClass:
      "rounded-3xl border border-[#C8BFAE] bg-[#F8F5ED] p-7 shadow-[0_25px_70px_rgba(36,33,29,0.10)]",
    miniCardClass:
      "rounded-2xl border border-[#D8D0C1] bg-[#FFFDF8] p-5 transition hover:-translate-y-1 hover:shadow-[0_18px_42px_rgba(36,33,29,0.10)]",
    badgeClass:
      "rounded-full border border-[#8B6F47]/30 bg-[#E9DDC8] px-3 py-1 text-xs font-bold text-[#6B5132]",
    headingClass: "font-serif font-black text-[#1D2E3A]",
    bodyClass: "text-[#5D574F]",
    mutedClass: "text-[#837A6C]",
    proBadgeClass:
      "rounded-full bg-[#DDE8EF] px-3 py-1 text-xs font-bold text-[#1D2E3A]",
    conBadgeClass:
      "rounded-full bg-[#EADAD3] px-3 py-1 text-xs font-bold text-[#854332]",
    ornamentClass:
      "h-2 bg-[linear-gradient(90deg,#1D2E3A_0,#1D2E3A_35%,transparent_35%,transparent_65%,#8B6F47_65%,#8B6F47_100%)] opacity-80",
    backgroundStyle: {
      backgroundImage:
        "linear-gradient(90deg, rgba(29,46,58,0.05) 1px, transparent 1px), linear-gradient(rgba(29,46,58,0.04) 1px, transparent 1px)",
      backgroundSize: "64px 64px",
    },
  },
  {
    id: "egypt-papyrus",
    country: "Egypt",
    label: "Papyrus Court",
    title: "파피루스에 새겨지는 시민의 판단",
    description:
      "고대 이집트의 파피루스, 사막빛, 청금석, 상형문자적 리듬에서 영감을 받은 테마입니다. 토론 게시글이 기록 문서처럼 보이는 방향입니다.",
    keywords: ["파피루스", "사막", "청금석", "기록", "판결"],
    shellClass: "bg-[#EED9A6] text-[#2E2415]",
    headerClass: "border-b-4 border-[#2E5E87] bg-[#F5E4B8]",
    brandClass: "font-serif text-2xl font-black tracking-[0.2em] text-[#1F4E79]",
    navClass: "rounded-sm px-3 py-2 font-black text-[#6A4C1D] hover:bg-[#E5C783]",
    primaryButtonClass:
      "rounded-sm bg-[#1F4E79] px-5 py-3 text-sm font-black text-[#FFF8E5] hover:bg-[#2E679B]",
    secondaryButtonClass:
      "rounded-sm border border-[#A87522] bg-[#FFF0C8] px-5 py-3 text-sm font-black text-[#7A5113] hover:bg-[#E8CE8B]",
    cardClass:
      "rounded-sm border-4 border-double border-[#A87522] bg-[#FFF0C8] p-6 shadow-[12px_12px_0_rgba(46,36,21,0.12)]",
    miniCardClass:
      "rounded-sm border border-[#B98A37] bg-[#FFF8DF] p-5 transition hover:-translate-y-1 hover:shadow-[8px_8px_0_rgba(46,36,21,0.12)]",
    badgeClass:
      "rounded-sm border border-[#A87522] bg-[#E8CE8B] px-3 py-1 text-xs font-black text-[#6A4C1D]",
    headingClass: "font-serif font-black text-[#1F4E79]",
    bodyClass: "text-[#6A4C1D]",
    mutedClass: "text-[#8C6A31]",
    proBadgeClass:
      "rounded-sm bg-[#D7E6EF] px-3 py-1 text-xs font-black text-[#1F4E79]",
    conBadgeClass:
      "rounded-sm bg-[#EBCDBD] px-3 py-1 text-xs font-black text-[#8B3E2A]",
    ornamentClass:
      "h-3 bg-[repeating-linear-gradient(90deg,#1F4E79_0,#1F4E79_14px,#D4A437_14px,#D4A437_22px,#8B4F24_22px,#8B4F24_30px)]",
    backgroundStyle: {
      backgroundImage:
        "radial-gradient(circle at 10% 10%, rgba(31,78,121,0.13), transparent 25%), radial-gradient(circle at 85% 20%, rgba(168,117,34,0.16), transparent 28%)",
    },
  },
  {
    id: "nordic-thing",
    country: "Nordic",
    label: "Thing Assembly",
    title: "차가운 광장에서 이루어지는 직접 토론",
    description:
      "북유럽의 Thing 집회에서 영감을 받은 테마입니다. 돌, 얼음빛, 룬 문양의 느낌을 활용해 직접적이고 투명한 공개 토론장을 표현합니다.",
    keywords: ["Thing", "룬", "돌", "직접 토론", "투명성"],
    shellClass: "bg-[#E9EEF0] text-[#182126]",
    headerClass: "border-b border-[#AAB7BC] bg-[#F7FAFA]",
    brandClass: "font-serif text-2xl font-black tracking-[0.2em] text-[#223F4A]",
    navClass: "rounded-md px-3 py-2 font-bold text-[#56666D] hover:bg-[#DDE6E9]",
    primaryButtonClass:
      "rounded-md bg-[#223F4A] px-5 py-3 text-sm font-bold text-[#F7FAFA] hover:bg-[#315B69]",
    secondaryButtonClass:
      "rounded-md border border-[#78909A] bg-[#F7FAFA] px-5 py-3 text-sm font-bold text-[#405660] hover:bg-[#DDE6E9]",
    cardClass:
      "rounded-2xl border border-[#AAB7BC] bg-[#F7FAFA] p-6 shadow-[0_24px_70px_rgba(24,33,38,0.12)]",
    miniCardClass:
      "rounded-2xl border border-[#B9C5C9] bg-white p-5 transition hover:-translate-y-1 hover:shadow-[0_18px_45px_rgba(24,33,38,0.13)]",
    badgeClass:
      "rounded-full border border-[#78909A]/35 bg-[#DDE6E9] px-3 py-1 text-xs font-bold text-[#405660]",
    headingClass: "font-serif font-black text-[#223F4A]",
    bodyClass: "text-[#56666D]",
    mutedClass: "text-[#7B8A90]",
    proBadgeClass:
      "rounded-md bg-[#DDEAF2] px-3 py-1 text-xs font-bold text-[#24516A]",
    conBadgeClass:
      "rounded-md bg-[#E9D9D6] px-3 py-1 text-xs font-bold text-[#824337]",
    ornamentClass:
      "h-2 bg-[repeating-linear-gradient(135deg,#223F4A_0,#223F4A_8px,transparent_8px,transparent_16px)] opacity-80",
    backgroundStyle: {
      backgroundImage:
        "linear-gradient(135deg, rgba(34,63,74,0.08) 25%, transparent 25%), linear-gradient(225deg, rgba(34,63,74,0.06) 25%, transparent 25%)",
      backgroundSize: "42px 42px",
    },
  },
  {
    id: "france-salon",
    country: "France",
    label: "Salon of Ideas",
    title: "살롱에서 정제되는 논쟁의 문장",
    description:
      "프랑스 살롱 문화와 계몽주의적 토론 분위기에서 영감을 받은 테마입니다. 우아한 크림색, 와인색, 금색 포인트로 세련된 토론 공간을 만듭니다.",
    keywords: ["살롱", "계몽", "문장", "우아함", "논증"],
    shellClass: "bg-[#F4EFE7] text-[#2B2323]",
    headerClass: "border-b border-[#D6C2A3] bg-[#FFFDF8]",
    brandClass: "font-serif text-2xl font-black tracking-[0.2em] text-[#4C1F2D]",
    navClass: "rounded-full px-3 py-2 font-semibold text-[#6B5A51] hover:bg-[#ECE1D1]",
    primaryButtonClass:
      "rounded-full bg-[#4C1F2D] px-5 py-3 text-sm font-bold text-[#FFFDF8] hover:bg-[#683044]",
    secondaryButtonClass:
      "rounded-full border border-[#B7955B] bg-[#FFFDF8] px-5 py-3 text-sm font-bold text-[#7A5B28] hover:bg-[#ECE1D1]",
    cardClass:
      "rounded-[2rem] border border-[#D6C2A3] bg-[#FFFDF8] p-7 shadow-[0_24px_80px_rgba(43,35,35,0.12)]",
    miniCardClass:
      "rounded-[1.5rem] border border-[#E0CFB5] bg-[#FFFBF3] p-5 transition hover:-translate-y-1 hover:shadow-[0_18px_45px_rgba(43,35,35,0.13)]",
    badgeClass:
      "rounded-full border border-[#B7955B]/40 bg-[#F2E5CF] px-3 py-1 text-xs font-bold text-[#7A5B28]",
    headingClass: "font-serif font-black text-[#4C1F2D]",
    bodyClass: "text-[#6B5A51]",
    mutedClass: "text-[#8A786D]",
    proBadgeClass:
      "rounded-full bg-[#E0E8F2] px-3 py-1 text-xs font-bold text-[#254B6D]",
    conBadgeClass:
      "rounded-full bg-[#EBD8DA] px-3 py-1 text-xs font-bold text-[#7A2E3E]",
    ornamentClass:
      "h-2 bg-[linear-gradient(90deg,#4C1F2D_0,#4C1F2D_28%,#B7955B_28%,#B7955B_72%,#4C1F2D_72%,#4C1F2D_100%)] opacity-80",
    backgroundStyle: {
      backgroundImage:
        "radial-gradient(circle at 15% 15%, rgba(76,31,45,0.08), transparent 26%), radial-gradient(circle at 85% 0%, rgba(183,149,91,0.13), transparent 26%)",
    },
  },
];

export default function StyleCountryThemesPage() {
  return (
    <main className="min-h-screen bg-neutral-950">
      <section className="border-b border-white/10 bg-neutral-950 px-6 py-10 text-white">
        <div className="mx-auto max-w-6xl">
          <p className="text-sm font-semibold uppercase tracking-[0.3em] text-amber-300">
            Metropolis Country Themes
          </p>
          <h1 className="mt-3 font-serif text-4xl font-black md:text-5xl">
            국가별 토론장 테마 예시
          </h1>
          <p className="mt-4 max-w-3xl text-sm leading-7 text-neutral-300">
            각 국가는 단순한 장식이 아니라, 토론장의 성격을 다르게 만드는
            컨셉으로 구성했습니다. 의제, 발언, 입장, 기록이라는 큰 구조는
            유지하고 분위기만 다르게 비교할 수 있습니다.
          </p>

          <div className="mt-6 flex flex-wrap gap-3 text-sm">
            {themes.map((theme) => (
              <a
                key={theme.id}
                href={`#${theme.id}`}
                className="rounded-full border border-white/15 px-4 py-2 text-neutral-200 hover:bg-white/10"
              >
                {theme.country}
              </a>
            ))}
          </div>
        </div>
      </section>

      {themes.map((theme) => (
        <CountryThemeSection key={theme.id} theme={theme} />
      ))}
    </main>
  );
}

function CountryThemeSection({ theme }: { theme: CountryTheme }) {
  return (
    <section
      id={theme.id}
      className={`min-h-screen ${theme.shellClass}`}
      style={theme.backgroundStyle}
    >
      <header className={theme.headerClass}>
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-5">
          <Link href="/" className={theme.brandClass}>
            METROPOLIS
          </Link>

          <nav className="flex items-center gap-2 text-sm">
            <Link href="/topics" className={theme.navClass}>
              의제
            </Link>
            <Link href="/me" className={theme.navClass}>
              내 기록
            </Link>
            <Link href="/login" className={theme.primaryButtonClass}>
              입장하기
            </Link>
          </nav>
        </div>
        <div className={theme.ornamentClass} />
      </header>

      <div className="mx-auto max-w-6xl px-6 py-16">
        <p className={`text-xs font-black uppercase tracking-[0.28em] ${theme.mutedClass}`}>
          {theme.country} · {theme.label}
        </p>

        <div className="mt-5 grid gap-10 lg:grid-cols-[0.95fr_1.05fr] lg:items-center">
          <div>
            <h2 className={`${theme.headingClass} text-5xl leading-tight md:text-6xl`}>
              {theme.title}
            </h2>

            <p className={`mt-6 max-w-2xl text-lg leading-8 ${theme.bodyClass}`}>
              {theme.description}
            </p>

            <div className="mt-6 flex flex-wrap gap-2">
              {theme.keywords.map((keyword) => (
                <span key={keyword} className={theme.badgeClass}>
                  {keyword}
                </span>
              ))}
            </div>

            <div className="mt-8 flex flex-wrap gap-3">
              <Link href="/topics" className={theme.primaryButtonClass}>
                토론 의제 보기
              </Link>
              <Link href="/me" className={theme.secondaryButtonClass}>
                나의 참여 기록
              </Link>
            </div>
          </div>

          <div className={theme.cardClass}>
            <p className={`text-xs font-black uppercase tracking-[0.25em] ${theme.mutedClass}`}>
              Featured Motion
            </p>

            <h3 className={`${theme.headingClass} mt-3 text-3xl leading-tight`}>
              시민의 발언은 어떻게 기록되어야 하는가?
            </h3>

            <p className={`mt-4 text-sm leading-7 ${theme.bodyClass}`}>
              하나의 의제를 중심으로 찬성과 반대가 나뉘고, 각 발언은
              익명 라벨과 함께 기록됩니다. 테마는 달라도 토론의 구조는
              동일하게 유지됩니다.
            </p>

            <div className="mt-6 grid gap-3 sm:grid-cols-3">
              {["입장 선택", "논거 제시", "반론 기록"].map((step) => (
                <div key={step} className={theme.miniCardClass}>
                  <p className={`text-sm font-black ${theme.headingClass}`}>
                    {step}
                  </p>
                  <p className={`mt-2 text-xs leading-5 ${theme.mutedClass}`}>
                    토론 흐름의 핵심 단계
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="mt-14">
          <div className="mb-6 flex flex-col justify-between gap-4 md:flex-row md:items-end">
            <div>
              <p className={`text-xs font-black uppercase tracking-[0.25em] ${theme.mutedClass}`}>
                Public Topics
              </p>
              <h3 className={`${theme.headingClass} mt-2 text-4xl`}>
                오늘의 의제
              </h3>
            </div>

            <Link href="/topics" className={theme.secondaryButtonClass}>
              전체 보기
            </Link>
          </div>

          <div className="grid gap-5 md:grid-cols-3">
            {topics.map((topic) => (
              <article key={topic.title} className={theme.miniCardClass}>
                <div className="flex items-center justify-between gap-3">
                  <span className={theme.badgeClass}>{topic.status}</span>
                  <span className={`text-xs font-semibold ${theme.mutedClass}`}>
                    {topic.participants}명
                  </span>
                </div>

                <h4 className={`${theme.headingClass} mt-5 text-2xl leading-8`}>
                  {topic.title}
                </h4>

                <p className={`mt-3 text-sm leading-6 ${theme.bodyClass}`}>
                  {topic.description}
                </p>

                <div className={`mt-6 border-t border-current/15 pt-4 text-sm font-black ${theme.headingClass}`}>
                  토론장으로 이동
                </div>
              </article>
            ))}
          </div>
        </div>

        <div className="mt-14">
          <div className={theme.cardClass}>
            <p className={`text-xs font-black uppercase tracking-[0.25em] ${theme.mutedClass}`}>
              Debate Preview
            </p>
            <h3 className={`${theme.headingClass} mt-2 text-4xl`}>
              발언 기록 예시
            </h3>

            <div className="mt-6 grid gap-5 md:grid-cols-2">
              {posts.map((post) => (
                <article key={post.title} className={theme.miniCardClass}>
                  <div className="flex flex-wrap items-center gap-3">
                    <span
                      className={
                        post.side === "찬성"
                          ? theme.proBadgeClass
                          : theme.conBadgeClass
                      }
                    >
                      {post.side}
                    </span>
                    <span className={`text-sm font-bold ${theme.mutedClass}`}>
                      {post.author}
                    </span>
                  </div>

                  <h4 className={`${theme.headingClass} mt-4 text-2xl leading-8`}>
                    {post.title}
                  </h4>

                  <p className={`mt-3 text-sm leading-7 ${theme.bodyClass}`}>
                    {post.content}
                  </p>

                  <div className={`mt-5 flex items-center justify-between border-t border-current/15 pt-4 text-xs font-bold ${theme.mutedClass}`}>
                    <span>댓글 3개</span>
                    <span>반론 남기기</span>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}