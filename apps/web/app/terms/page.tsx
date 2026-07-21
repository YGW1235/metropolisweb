import type { Metadata } from "next";
import Link from "next/link";

const description =
  "메트로폴리스 아고라 서비스 이용 조건과 운영 기준을 정리한 이용약관입니다.";

export const metadata: Metadata = {
  title: "이용약관",
  description,
  alternates: {
    canonical: "/terms",
  },
  openGraph: {
    title: "이용약관",
    description,
    url: "/terms",
  },
};

const sections = [
  {
    title: "1. 목적",
    body: [
      "본 약관은 Metropolis 서비스의 이용 조건, 이용자와 운영자의 권리와 의무, 서비스 운영 기준을 정하는 것을 목적으로 합니다.",
    ],
  },
  {
    title: "2. 서비스 내용",
    body: [
      "서비스는 이용자가 토론 주제에 참여하고, 지정된 진영에서 글과 댓글을 작성하며, 공지사항과 활동 기록을 확인할 수 있는 기능을 제공합니다.",
      "운영자는 서비스 개선, 보안, 안정성 확보를 위해 기능을 변경하거나 일부 제공을 제한할 수 있습니다.",
    ],
  },
  {
    title: "3. 회원가입 및 계정",
    body: [
      "이용자는 이메일 인증을 통해 계정을 생성할 수 있습니다.",
      "이용자는 본인 계정의 보안을 유지할 책임이 있습니다.",
      "운영 정책을 위반한 계정은 서비스 이용이 제한될 수 있습니다.",
    ],
  },
  {
    title: "4. 이용자의 의무",
    body: [
      "타인을 모욕, 협박, 괴롭힘, 차별하거나 불법적인 내용을 게시해서는 안 됩니다.",
      "허위 신고, 도배, 서비스 장애 유발, 타인의 개인정보 게시를 금지합니다.",
      "토론의 익명성을 악용하여 부정 행위를 해서는 안 됩니다.",
    ],
  },
  {
    title: "5. 게시물 관리",
    body: [
      "이용자가 작성한 게시글과 댓글은 서비스 내에 표시될 수 있습니다.",
      "운영자는 신고 또는 운영 기준에 따라 게시물을 숨김, 삭제, 제한할 수 있습니다.",
      "법령 위반 또는 타인의 권리를 침해하는 게시물은 사전 통지 없이 조치될 수 있습니다.",
    ],
  },
  {
    title: "6. 신고 및 제재",
    body: [
      "이용자는 부적절한 게시글이나 댓글을 신고할 수 있습니다.",
      "운영자는 신고 내용을 검토하여 게시물 숨김, 신고 기각, 계정 정지 등의 조치를 할 수 있습니다.",
    ],
  },
  {
    title: "7. 책임 제한",
    body: [
      "서비스는 이용자 간 토론 내용을 직접 보증하지 않습니다.",
      "운영자는 안정적인 서비스 제공을 위해 노력하지만, 외부 서비스 장애, 네트워크 문제, 불가항력으로 인한 손해에 대해 책임이 제한될 수 있습니다.",
    ],
  },
  {
    title: "8. 약관 변경",
    body: [
      "운영자는 필요한 경우 약관을 변경할 수 있으며, 중요한 변경 사항은 공지사항을 통해 안내합니다.",
    ],
  },
  {
    title: "9. 문의",
    body: [
      "서비스 이용 관련 문의는 문의하기 페이지를 통해 접수할 수 있습니다.",
    ],
  },
];

export default function TermsPage() {
  return (
    <main className="mx-auto min-h-screen max-w-3xl px-4 py-10 text-gray-100 sm:px-6 sm:py-14">
      <Link href="/" className="text-sm text-blue-300 hover:text-blue-200">
        ← 메인으로 돌아가기
      </Link>

      <div className="mt-8">
        <p className="text-sm font-semibold text-blue-300">Terms</p>
        <h1 className="mt-2 text-3xl font-bold">이용약관</h1>
        <p className="mt-3 text-sm text-gray-400">
          시행일: 2026년 6월 18일
        </p>
      </div>

      <section className="mt-8 grid gap-5">
        {sections.map((section) => (
          <article
            key={section.title}
            className="rounded-2xl border border-gray-800 bg-gray-950/70 p-5"
          >
            <h2 className="text-lg font-semibold">{section.title}</h2>
            <ul className="mt-3 grid gap-2 text-sm leading-6 text-gray-300">
              {section.body.map((item) => (
                <li key={item}>- {item}</li>
              ))}
            </ul>
          </article>
        ))}
      </section>
    </main>
  );
}
