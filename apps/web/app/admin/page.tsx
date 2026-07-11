import Link from "next/link";

import { AdminStateCard } from "@/components/admin-state-card";

type AdminAction = {
  href: string;
  label: string;
  variant?: "primary" | "secondary";
  external?: boolean;
};

type AdminCard = {
  title: string;
  description: string;
  note?: string;
  actions: AdminAction[];
};

type AdminSection = {
  id: string;
  title: string;
  description: string;
  cards: AdminCard[];
};

const adminSections: AdminSection[] = [
  {
    id: "content",
    title: "콘텐츠 관리",
    description: "토론 주제와 공지, 공개 화면의 기본 콘텐츠 상태를 관리합니다.",
    cards: [
      {
        title: "주제 관리",
        description: "토론 주제를 생성하고 제목, 설명, 상태를 운영 상황에 맞게 수정합니다.",
        actions: [{ href: "/admin/topics", label: "주제 관리로 이동", variant: "primary" }],
      },
      {
        title: "공지 관리",
        description: "공지사항을 작성하고 게시 상태, 고정 여부, 공개 내용을 관리합니다.",
        actions: [
          { href: "/admin/notices", label: "공지 관리로 이동", variant: "primary" },
          { href: "/admin/notices/new", label: "새 공지 작성" },
        ],
      },
      {
        title: "주제 통계",
        description: "주제별 참가자, 게시글, 댓글, 신고 현황을 확인합니다.",
        actions: [{ href: "/admin/stats", label: "통계 확인" }],
      },
      {
        title: "유저 화면 확인",
        description: "방문자에게 보이는 공개 주제 목록과 기본 진입 흐름을 확인합니다.",
        actions: [{ href: "/topics", label: "공개 주제 보기" }],
      },
    ],
  },
  {
    id: "users-reports",
    title: "사용자/신고 관리",
    description: "신고, 문의, 유저 상태처럼 운영 판단이 필요한 항목을 처리합니다.",
    cards: [
      {
        title: "신고 관리",
        description: "유저가 신고한 게시글과 댓글을 확인하고 처리 상태를 기록합니다.",
        note: "신고 대상 숨김 처리는 공개 화면 노출에 즉시 영향을 줍니다.",
        actions: [{ href: "/admin/reports", label: "신고 관리로 이동", variant: "primary" }],
      },
      {
        title: "유저 관리",
        description: "유저 상태를 확인하고 필요한 경우 정지 또는 복구를 처리합니다.",
        note: "정지/복구는 작성과 참여 권한에 영향을 줄 수 있습니다.",
        actions: [{ href: "/admin/users", label: "유저 관리로 이동", variant: "primary" }],
      },
      {
        title: "문의 관리",
        description: "유저와 방문자가 남긴 문의를 확인하고 처리 상태와 메모를 관리합니다.",
        actions: [{ href: "/admin/inquiries", label: "문의 관리로 이동" }],
      },
    ],
  },
  {
    id: "operations-security",
    title: "운영/보안",
    description: "관리자 작업 이력, 보안 상태, 런칭 점검 문서를 확인합니다.",
    cards: [
      {
        title: "관리자 활동 로그",
        description: "신고 처리, 유저 정지/복구, 문의 처리 등 관리자 작업 기록을 확인합니다.",
        actions: [{ href: "/admin/activity", label: "활동 로그 보기" }],
      },
      {
        title: "보안 점검",
        description: "관리자 계정 상태, 이메일 인증, 예비 관리자 여부를 점검합니다.",
        note: "보안 점검 결과는 운영 전후에 반복 확인하는 것이 좋습니다.",
        actions: [{ href: "/admin/security", label: "보안 상태 확인", variant: "primary" }],
      },
      {
        title: "운영 문서",
        description: "런칭 체크 결과와 관리자 운영 가이드를 저장소 문서에서 확인합니다.",
        actions: [
          {
            href: "https://github.com/YGW1235/metropolisweb/blob/main/docs/launch-test-result.md",
            label: "런칭 체크 문서",
            external: true,
          },
          {
            href: "https://github.com/YGW1235/metropolisweb/blob/main/docs/admin-guide.md",
            label: "관리자 가이드",
            external: true,
          },
        ],
      },
    ],
  },
];

const summaryItems = [
  { label: "운영 주소", value: "https://metropolisagora.com" },
  { label: "대상 앱", value: "apps/web" },
  { label: "관리 범위", value: "주제 · 공지 · 신고 · 문의 · 유저 · 보안" },
];

export default function AdminPage() {
  return (
    <main className="theme-page px-4 py-8 sm:px-6 sm:py-10 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <section
          aria-labelledby="admin-dashboard-title"
          className="theme-panel rounded-lg p-5 shadow-[var(--shadow-card)] sm:p-7"
        >
          <p className="text-xs font-black uppercase tracking-[0.24em] text-[var(--theme-gold)]">
            Metropolis Operations
          </p>
          <div className="mt-3 grid gap-6 lg:grid-cols-[minmax(0,1fr)_22rem] lg:items-end">
            <div>
              <h1
                id="admin-dashboard-title"
                className="font-serif text-3xl font-black tracking-normal text-[var(--theme-text)] sm:text-4xl"
              >
                관리자 대시보드
              </h1>
              <p className="mt-3 max-w-3xl break-words text-sm leading-7 text-[var(--theme-muted)] sm:text-base">
                주제, 공지, 신고, 문의, 유저, 보안 상태를 관리하는 운영 화면입니다.
              </p>
            </div>

            <dl className="grid gap-2 text-sm">
              {summaryItems.map((item) => (
                <div
                  key={item.label}
                  className="flex flex-col gap-1 rounded-md border border-[var(--theme-line)] bg-[var(--theme-surface)] px-3 py-2 sm:flex-row sm:items-center sm:justify-between"
                >
                  <dt className="font-bold text-[var(--theme-soft)]">{item.label}</dt>
                  <dd className="break-words font-black text-[var(--theme-text)] sm:text-right">
                    {item.value}
                  </dd>
                </div>
              ))}
            </dl>
          </div>
        </section>

        <div className="mt-6">
          <AdminStateCard
            tone="default"
            title="운영 화면 안내"
            description="관리자 액션은 공개 화면, 유저 권한, 운영 로그에 영향을 줄 수 있습니다. 신고, 유저, 공지, 주제 상태 변경은 각 페이지의 확인 문구를 확인한 뒤 실행하세요."
          />
        </div>

        <div className="mt-8 space-y-8">
          {adminSections.map((section) => (
            <AdminDashboardSection key={section.title} section={section} />
          ))}
        </div>
      </div>
    </main>
  );
}

function AdminDashboardSection({ section }: { section: AdminSection }) {
  const headingId = `admin-section-${section.id}`;

  return (
    <section aria-labelledby={headingId}>
      <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 id={headingId} className="text-2xl font-black text-[var(--theme-text)]">
            {section.title}
          </h2>
          <p className="mt-2 max-w-3xl break-words text-sm leading-6 text-[var(--theme-muted)]">
            {section.description}
          </p>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {section.cards.map((card) => (
          <AdminDashboardCard key={card.title} card={card} />
        ))}
      </div>
    </section>
  );
}

function AdminDashboardCard({ card }: { card: AdminCard }) {
  return (
    <article className="theme-card flex h-full flex-col rounded-lg p-5 transition duration-300 hover:-translate-y-0.5 hover:border-[var(--theme-gold)] hover:shadow-[var(--shadow-card-strong)] focus-within:border-[var(--theme-gold)]">
      <div className="flex-1">
        <h3 className="text-lg font-black text-[var(--theme-text)]">{card.title}</h3>
        <p className="mt-2 break-words text-sm leading-6 text-[var(--theme-muted)]">
          {card.description}
        </p>
        {card.note ? (
          <p className="mt-4 rounded-md border border-[var(--theme-line)] bg-[var(--theme-surface)] px-3 py-2 text-xs font-bold leading-5 text-[var(--theme-soft)]">
            {card.note}
          </p>
        ) : null}
      </div>

      <div className="mt-5 flex flex-wrap gap-2">
        {card.actions.map((action) => (
          <Link
            key={`${action.href}-${action.label}`}
            href={action.href}
            target={action.external ? "_blank" : undefined}
            rel={action.external ? "noreferrer" : undefined}
            className={[
              "inline-flex min-h-10 items-center justify-center rounded-full px-4 py-2 text-sm font-black transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--theme-gold)]",
              action.variant === "primary" ? "theme-button-primary" : "theme-button-secondary",
            ].join(" ")}
          >
            {action.label}
          </Link>
        ))}
      </div>
    </article>
  );
}
