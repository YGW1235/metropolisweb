import Link from "next/link";
import { redirect } from "next/navigation";

import { createReport } from "@/app/report/actions";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

type SearchParams = Promise<{
  targetType?: string;
  targetId?: string;
  returnTo?: string;
  message?: string;
  type?: "success" | "error";
}>;

function getTargetLabel(targetType?: string) {
  if (targetType === "topic") return "주제";
  if (targetType === "opinion") return "의견";
  if (targetType === "comment") return "댓글";
  return "대상";
}

export default async function ReportPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const params = await searchParams;
  const supabase = await createClient();

  const targetType = params.targetType;
  const targetId = params.targetId;
  const returnTo = params.returnTo || "/topics";

  if (
    !targetId ||
    !targetType ||
    !["topic", "opinion", "comment"].includes(targetType)
  ) {
    redirect("/topics?message=신고 대상 정보가 올바르지 않습니다.&type=error");
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login?message=신고하려면 로그인이 필요합니다.&type=error");
  }

  let previewTitle = "";
  let previewBody = "";

  if (targetType === "topic") {
    const { data: topic } = await supabase
      .from("casual_topics")
      .select("title, description")
      .eq("id", targetId)
      .maybeSingle();

    previewTitle = topic?.title ?? "주제를 찾을 수 없습니다.";
    previewBody = topic?.description ?? "";
  }

  if (targetType === "opinion") {
    const { data: opinion } = await supabase
      .from("casual_opinions")
      .select("body, topic_id")
      .eq("id", targetId)
      .maybeSingle();

    previewTitle = "신고할 의견";
    previewBody = opinion?.body ?? "의견을 찾을 수 없습니다.";
  }

  if (targetType === "comment") {
    const { data: comment } = await supabase
      .from("casual_comments")
      .select("body")
      .eq("id", targetId)
      .maybeSingle();

    previewTitle = "신고할 댓글";
    previewBody = comment?.body ?? "댓글을 찾을 수 없습니다.";
  }

  return (
    <main className="min-h-screen bg-[#fff7ed] px-6 py-10 text-[#2f2118]">
      <section className="mx-auto max-w-2xl">
        <Link href={returnTo} className="text-sm font-black text-orange-700">
          ← 돌아가기
        </Link>

        <div className="mt-8 rounded-3xl border border-orange-100 bg-white p-6 shadow-sm">
          <p className="text-sm font-bold tracking-[0.3em] text-orange-700">
            REPORT
          </p>
          <h1 className="mt-2 text-3xl font-black">
            {getTargetLabel(targetType)} 신고
          </h1>
          <p className="mt-3 text-sm leading-6 text-stone-600">
            운영자가 검토할 수 있도록 신고 사유를 선택해주세요.
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

          <div className="mt-6 rounded-3xl bg-orange-50 p-5">
            <p className="text-sm font-black text-orange-800">신고 대상</p>
            <h2 className="mt-2 text-xl font-black">{previewTitle}</h2>
            {previewBody && (
              <p className="mt-3 whitespace-pre-wrap text-sm leading-6 text-stone-700">
                {previewBody}
              </p>
            )}
          </div>

          <form action={createReport} className="mt-6 space-y-4">
            <input type="hidden" name="targetType" value={targetType} />
            <input type="hidden" name="targetId" value={targetId} />
            <input type="hidden" name="returnTo" value={returnTo} />

            <div>
              <label className="text-sm font-bold text-stone-700">
                신고 사유
              </label>
              <select
                name="reason"
                required
                className="mt-2 w-full rounded-2xl border border-stone-200 bg-white px-4 py-3 outline-none focus:border-orange-400"
              >
                <option value="">사유 선택</option>
                <option value="abuse">욕설/비방</option>
                <option value="spam">스팸/도배</option>
                <option value="harassment">괴롭힘/공격적 표현</option>
                <option value="personal_info">개인정보 노출</option>
                <option value="off_topic">주제와 무관한 내용</option>
                <option value="other">기타</option>
              </select>
            </div>

            <div>
              <label className="text-sm font-bold text-stone-700">
                상세 내용
              </label>
              <textarea
                name="details"
                maxLength={500}
                className="mt-2 min-h-32 w-full resize-none rounded-2xl border border-stone-200 px-4 py-3 outline-none focus:border-orange-400"
                placeholder="운영자가 판단하는 데 필요한 내용을 적어주세요. 선택 사항입니다."
              />
              <p className="mt-2 text-xs font-bold text-stone-500">
                최대 500자
              </p>
            </div>

            <div className="flex flex-wrap justify-end gap-3">
              <Link
                href={returnTo}
                className="rounded-full border border-stone-200 bg-white px-6 py-3 text-sm font-bold text-stone-700 transition hover:bg-stone-50"
              >
                취소
              </Link>

              <button className="rounded-full bg-red-600 px-6 py-3 text-sm font-black text-white transition hover:-translate-y-0.5">
                신고 접수
              </button>
            </div>
          </form>
        </div>
      </section>
    </main>
  );
}