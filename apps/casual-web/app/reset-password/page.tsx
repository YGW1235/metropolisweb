import type { Metadata } from "next";
import Link from "next/link";

import { ResetPasswordForm } from "@/app/reset-password/ResetPasswordForm";
import { PublicShell } from "@/components/PublicShell";
import { SiteHeader } from "@/components/SiteHeader";

export const metadata: Metadata = {
  title: "비밀번호 재설정",
  description: "심포지온 계정의 새 비밀번호를 설정합니다.",
  alternates: {
    canonical: "/reset-password",
  },
};

type SearchParams = Promise<{
  code?: string;
  message?: string;
  type?: "success" | "error";
}>;

export default async function ResetPasswordPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const params = await searchParams;

  return (
    <main className="casual-page-bg min-h-screen text-[#2f2118]">
      <SiteHeader />

      <PublicShell>
        <section className="mx-auto w-full max-w-xl">
          <Link
            href="/forgot-password"
            className="text-sm font-black text-orange-700"
          >
            ← 재설정 링크 다시 받기
          </Link>

          <div className="mt-6 rounded-3xl border border-orange-100 bg-white p-6 shadow-sm sm:p-8">
            <p className="text-sm font-bold tracking-[0.3em] text-orange-700">
              NEW PASSWORD
            </p>
            <h1 className="mt-2 text-3xl font-black">비밀번호 재설정</h1>
            <p className="mt-3 text-sm leading-6 text-stone-600">
              메일로 받은 재설정 링크가 확인되면 새 비밀번호를 저장할 수
              있습니다.
            </p>

            {params.message && (
              <div
                className={`mt-5 rounded-2xl p-4 text-sm font-bold ${
                  params.type === "error"
                    ? "bg-red-50 text-red-700"
                    : "bg-green-50 text-green-700"
                }`}
              >
                {params.message}
              </div>
            )}

            <ResetPasswordForm code={params.code} />
          </div>
        </section>
      </PublicShell>
    </main>
  );
}
