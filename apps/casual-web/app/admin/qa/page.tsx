import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";

import { SiteHeader } from "@/components/SiteHeader";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "QA 체크리스트",
  robots: {
    index: false,
    follow: false,
  },
};

export const dynamic = "force-dynamic";

type QaLink = {
  href: string;
  label: string;
};

type QaSection = {
  title: string;
  description: string;
  links: QaLink[];
  items: string[];
};

const qaSections: QaSection[] = [
  {
    title: "A. 인증/프로필",
    description: "가입, 로그인, 공개 프로필 흐름을 확인합니다.",
    links: [
      { href: "/signup", label: "회원가입" },
      { href: "/login", label: "로그인" },
      { href: "/settings/profile", label: "프로필 설정" },
      { href: "/me", label: "내 활동" },
    ],
    items: [
      "회원가입 가능",
      "로그인 가능",
      "로그아웃 가능",
      "프로필 닉네임 수정 가능",
      "공개 프로필 접근 가능",
    ],
  },
  {
    title: "B. 주제 참여",
    description: "목록, 검색, 필터, 상세 투표 흐름을 확인합니다.",
    links: [{ href: "/topics", label: "주제 목록" }],
    items: [
      "주제 목록 표시",
      "검색 q 동작",
      "태그 tag 필터 동작",
      "sort=trending/hot/new/views 정렬 동작",
      "주제 상세 표시",
      "조회수 중복 증가 방지",
      "A/B 투표 가능",
      "투표 후 결과 표시",
    ],
  },
  {
    title: "C. 의견/댓글",
    description: "투표 이후 의견과 댓글 작성, 수정, 삭제를 확인합니다.",
    links: [
      { href: "/topics", label: "주제 목록" },
      { href: "/me", label: "내 활동" },
    ],
    items: [
      "투표 후 의견 작성 가능",
      "의견 수정 가능",
      "의견 수정 시 공감/비공감 초기화 경고 표시",
      "의견 삭제 가능",
      "댓글 작성 가능",
      "댓글 수정 가능",
      "댓글 삭제 가능",
      "닉네임 클릭 시 공개 프로필 이동",
    ],
  },
  {
    title: "D. 반응/알림",
    description: "반응 자체와 댓글 중심 알림 정책을 확인합니다.",
    links: [
      { href: "/topics", label: "주제 목록" },
      { href: "/notifications", label: "알림" },
    ],
    items: [
      "공감/비공감 가능",
      "공감/비공감 알림은 생성되지 않음",
      "댓글 작성 시 의견 작성자에게 알림 생성",
      "알림 목록 표시",
      "알림 읽음 처리 가능",
      "모두 읽음 처리 가능",
    ],
  },
  {
    title: "E. 저장/마이페이지",
    description: "주제 저장과 마이페이지 활동 요약을 확인합니다.",
    links: [
      { href: "/topics", label: "주제 목록" },
      { href: "/me", label: "내 활동" },
    ],
    items: [
      "주제 저장 가능",
      "저장 해제 가능",
      "/me에서 저장한 주제 표시",
      "/me에서 내 투표 표시",
      "/me에서 내 의견 표시",
      "/me에서 내 댓글 표시",
    ],
  },
  {
    title: "F. 신고/관리자",
    description: "신고 처리와 관리자 주제 운영 흐름을 확인합니다.",
    links: [
      { href: "/admin", label: "관리자 홈" },
      { href: "/admin/topics", label: "주제 관리" },
      { href: "/admin/reports", label: "신고 관리" },
      { href: "/topics", label: "사용자 화면" },
    ],
    items: [
      "주제 신고 가능",
      "의견 신고 가능",
      "댓글 신고 가능",
      "관리자 신고 목록 표시",
      "신고 처리 가능",
      "의견 숨김 가능",
      "댓글 숨김 가능",
      "관리자 주제 생성 가능",
      "관리자 주제 수정 가능",
      "태그 연결 가능",
      "오늘의 논쟁 지정 가능",
    ],
  },
  {
    title: "G. 빌드/배포",
    description: "출시 전 환경과 빌드 상태를 마지막으로 확인합니다.",
    links: [{ href: "/admin", label: "관리자 홈" }],
    items: [
      "`pnpm --filter casual-web build` 성공",
      "Next 경고 없음",
      "환경변수 설정 확인",
      "Supabase URL/Anon Key 확인",
      "Vercel 배포 환경변수 확인",
      "Supabase Auth redirect URL 확인",
    ],
  },
];

export default async function AdminQaPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login?message=로그인이 필요합니다.&type=error");
  }

  const { data: isAdmin } = await supabase.rpc("is_casual_admin");

  if (!isAdmin) {
    redirect("/?message=관리자 권한이 필요합니다.&type=error");
  }

  return (
    <main className="casual-page-bg min-h-screen text-[#2f2118]">
      <SiteHeader />

      <section className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
        <section className="rounded-3xl border border-orange-100 bg-white p-6 shadow-sm">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="text-sm font-bold tracking-[0.3em] text-orange-700">
                ADMIN QA
              </p>
              <h1 className="mt-2 text-3xl font-black sm:text-4xl">
                QA 체크리스트
              </h1>
              <p className="mt-3 max-w-2xl text-sm leading-6 text-stone-600">
                수동 점검용 체크리스트입니다. 출시 전 관리자가 주요 사용자
                흐름과 운영 기능을 직접 확인하는 용도로 사용하세요.
              </p>
            </div>

            <div className="flex flex-wrap gap-2">
              <Link
                href="/admin"
                className="rounded-full border border-stone-200 px-4 py-2 text-sm font-bold text-stone-700 transition hover:bg-stone-50"
              >
                관리자 홈
              </Link>
              <Link
                href="/admin/topics"
                className="rounded-full border border-orange-200 bg-orange-50 px-4 py-2 text-sm font-bold text-orange-800 transition hover:bg-orange-100"
              >
                주제 관리
              </Link>
              <Link
                href="/admin/reports"
                className="rounded-full bg-stone-950 px-4 py-2 text-sm font-black text-white transition hover:-translate-y-0.5"
              >
                신고 관리
              </Link>
              <Link
                href="/admin/users"
                className="rounded-full border border-stone-200 px-4 py-2 text-sm font-bold text-stone-700 transition hover:bg-stone-50"
              >
                유저 관리
              </Link>
              <Link
                href="/admin/logs"
                className="rounded-full border border-stone-200 px-4 py-2 text-sm font-bold text-stone-700 transition hover:bg-stone-50"
              >
                관리자 로그
              </Link>
              <Link
                href="/admin/announcements"
                className="rounded-full border border-stone-200 px-4 py-2 text-sm font-bold text-stone-700 transition hover:bg-stone-50"
              >
                공지 관리
              </Link>
            </div>
          </div>
        </section>

        <section className="mt-6 grid gap-5 lg:grid-cols-2">
          {qaSections.map((section) => (
            <article
              key={section.title}
              className="rounded-3xl border border-orange-100 bg-white p-6 shadow-sm"
            >
              <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <h2 className="text-xl font-black">{section.title}</h2>
                  <p className="mt-2 text-sm leading-6 text-stone-600">
                    {section.description}
                  </p>
                </div>

                <div className="flex flex-wrap gap-2">
                  {section.links.map((link) => (
                    <Link
                      key={`${section.title}-${link.href}`}
                      href={link.href}
                      className="rounded-full bg-orange-50 px-3 py-1.5 text-xs font-black text-orange-800 transition hover:bg-orange-100"
                    >
                      {link.label}
                    </Link>
                  ))}
                </div>
              </div>

              <ul className="mt-5 grid gap-3">
                {section.items.map((item) => (
                  <li key={`${section.title}-${item}`}>
                    <label className="flex items-start gap-3 rounded-2xl bg-stone-50 px-4 py-3 text-sm font-bold text-stone-700">
                      <input
                        aria-label={`${section.title} ${item}`}
                        type="checkbox"
                        className="mt-0.5 h-4 w-4 shrink-0 accent-orange-600"
                      />
                      <span className="min-w-0 leading-6">{item}</span>
                    </label>
                  </li>
                ))}
              </ul>
            </article>
          ))}
        </section>
      </section>
    </main>
  );
}
