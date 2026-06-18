import Link from "next/link";

const sections = [
  {
    title: "1. 수집하는 개인정보 항목",
    body: [
      "회원가입 및 로그인 과정에서 이메일 주소, 비밀번호 인증 정보, 닉네임을 처리합니다.",
      "서비스 이용 과정에서 토론 참여 기록, 게시글, 댓글, 신고 내역, 올리브 활동 기록, 문의 내용이 저장될 수 있습니다.",
      "문의하기 기능 이용 시 답변을 위한 이메일 주소, 문의 유형, 제목, 문의 내용이 저장됩니다.",
    ],
  },
  {
    title: "2. 개인정보의 이용 목적",
    body: [
      "회원 식별, 로그인, 이메일 인증, 계정 관리",
      "토론방 참여, 게시글 및 댓글 작성, 신고 처리 등 서비스 제공",
      "부정 이용 방지, 운영 정책 위반 대응, 서비스 안정성 확보",
      "문의 접수 및 답변",
    ],
  },
  {
    title: "3. 개인정보의 보관 기간",
    body: [
      "회원 정보는 회원 탈퇴 또는 계정 삭제 요청 시까지 보관합니다.",
      "게시글, 댓글, 신고, 관리자 처리 기록은 서비스 운영 및 분쟁 대응을 위해 필요한 기간 동안 보관될 수 있습니다.",
      "문의 내역은 답변 및 운영 이력 관리를 위해 필요한 기간 동안 보관될 수 있습니다.",
    ],
  },
  {
    title: "4. 개인정보의 제3자 제공",
    body: [
      "서비스는 법령에 따른 경우를 제외하고 이용자의 개인정보를 외부에 판매하거나 임의로 제공하지 않습니다.",
    ],
  },
  {
    title: "5. 개인정보 처리 위탁 및 외부 서비스",
    body: [
      "서비스 운영을 위해 Supabase, Vercel 등 클라우드 및 인증/데이터베이스 서비스를 사용할 수 있습니다.",
      "이메일 발송 기능을 사용하는 경우 Supabase Auth SMTP 또는 Resend 등 이메일 발송 서비스를 사용할 수 있습니다.",
    ],
  },
  {
    title: "6. 이용자의 권리",
    body: [
      "이용자는 본인의 개인정보 열람, 정정, 삭제, 처리 정지를 요청할 수 있습니다.",
      "요청은 문의하기 페이지를 통해 접수할 수 있으며, 운영자는 합리적인 기간 내에 확인 후 조치합니다.",
    ],
  },
  {
    title: "7. 쿠키 및 세션",
    body: [
      "서비스는 로그인 상태 유지와 보안을 위해 인증 쿠키 또는 세션 정보를 사용할 수 있습니다.",
    ],
  },
  {
    title: "8. 문의",
    body: [
      "개인정보 관련 문의는 문의하기 페이지를 통해 접수해주세요.",
      "운영자 연락처: metropolisathenswar@gmail.com",
    ],
  },
];

export default function PrivacyPage() {
  return (
    <main className="mx-auto min-h-screen max-w-3xl px-4 py-10 text-gray-100 sm:px-6 sm:py-14">
      <Link href="/" className="text-sm text-blue-300 hover:text-blue-200">
        ← 메인으로 돌아가기
      </Link>

      <div className="mt-8">
        <p className="text-sm font-semibold text-blue-300">Privacy Policy</p>
        <h1 className="mt-2 text-3xl font-bold">개인정보처리방침</h1>
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