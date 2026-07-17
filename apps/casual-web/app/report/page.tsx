import Link from "next/link";
import { redirect } from "next/navigation";

import { createReport } from "@/app/report/actions";
import { SubmitButton } from "@/components/SubmitButton";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

const OPINION_IMAGE_BUCKET = "casual-opinion-images";

type SupabaseClient = Awaited<ReturnType<typeof createClient>>;
type TargetType = "topic" | "opinion" | "comment";

type SearchParams = Promise<{
  targetType?: string;
  targetId?: string;
  returnTo?: string;
  message?: string;
  type?: "success" | "error";
}>;

type ReportPreview =
  | {
      found: false;
      label: string;
    }
  | {
      found: true;
      type: "topic";
      label: "주제";
      topicId: string;
      title: string;
      description: string;
      optionA: string;
      optionB: string;
    }
  | {
      found: true;
      type: "opinion";
      label: "의견";
      topicId: string;
      topicTitle: string;
      authorNickname: string;
      choiceLabel: string;
      body: string;
      images: {
        publicUrl: string;
        storagePath: string;
      }[];
    }
  | {
      found: true;
      type: "comment";
      label: "댓글";
      topicId: string | null;
      topicTitle: string;
      authorNickname: string;
      body: string;
      opinionAuthorNickname: string;
      opinionBody: string;
    };

function getTargetType(value?: string): TargetType | null {
  if (value === "topic" || value === "opinion" || value === "comment") {
    return value;
  }

  return null;
}

function getTargetLabel(targetType?: string | null) {
  if (targetType === "topic") return "주제";
  if (targetType === "opinion") return "의견";
  if (targetType === "comment") return "댓글";
  return "대상";
}

async function getNickname(supabase: SupabaseClient, userId?: string | null) {
  if (!userId) {
    return "알 수 없음";
  }

  const { data } = await supabase
    .from("casual_profiles")
    .select("nickname")
    .eq("user_id", userId)
    .maybeSingle();

  return data?.nickname ?? "알 수 없음";
}

async function getOpinionImages(supabase: SupabaseClient, opinionId: string) {
  const { data } = await supabase
    .from("casual_opinion_images")
    .select("storage_bucket, storage_path, display_order")
    .eq("opinion_id", opinionId)
    .order("display_order", { ascending: true });

  return (data ?? []).map((image) => {
    const storageBucket = image.storage_bucket ?? OPINION_IMAGE_BUCKET;
    const { data: publicData } = supabase.storage
      .from(storageBucket)
      .getPublicUrl(image.storage_path);

    return {
      publicUrl: publicData.publicUrl,
      storagePath: image.storage_path,
    };
  });
}

async function loadReportPreview(
  supabase: SupabaseClient,
  targetType: TargetType,
  targetId: string,
): Promise<ReportPreview> {
  if (targetType === "topic") {
    const { data: topic } = await supabase
      .from("casual_topics")
      .select("id, title, description, option_a, option_b")
      .eq("id", targetId)
      .maybeSingle();

    if (!topic) {
      return { found: false, label: "주제" };
    }

    return {
      found: true,
      type: "topic",
      label: "주제",
      topicId: topic.id,
      title: topic.title,
      description: topic.description,
      optionA: topic.option_a,
      optionB: topic.option_b,
    };
  }

  if (targetType === "opinion") {
    const { data: opinion } = await supabase
      .from("casual_opinions")
      .select("id, topic_id, user_id, choice, body")
      .eq("id", targetId)
      .maybeSingle();

    if (!opinion) {
      return { found: false, label: "의견" };
    }

    const [{ data: topic }, authorNickname, images] = await Promise.all([
      supabase
        .from("casual_topics")
        .select("id, title, option_a, option_b")
        .eq("id", opinion.topic_id)
        .maybeSingle(),
      getNickname(supabase, opinion.user_id),
      getOpinionImages(supabase, opinion.id),
    ]);

    const choiceLabel =
      opinion.choice === "a"
        ? topic?.option_a ?? "A측"
        : topic?.option_b ?? "B측";

    return {
      found: true,
      type: "opinion",
      label: "의견",
      topicId: opinion.topic_id,
      topicTitle: topic?.title ?? "알 수 없는 주제",
      authorNickname,
      choiceLabel,
      body: opinion.body,
      images,
    };
  }

  const { data: comment } = await supabase
    .from("casual_comments")
    .select("id, opinion_id, user_id, body")
    .eq("id", targetId)
    .maybeSingle();

  if (!comment) {
    return { found: false, label: "댓글" };
  }

  const { data: opinion } = await supabase
    .from("casual_opinions")
    .select("id, topic_id, user_id, body")
    .eq("id", comment.opinion_id)
    .maybeSingle();

  const [{ data: topic }, authorNickname, opinionAuthorNickname] =
    await Promise.all([
      opinion?.topic_id
        ? supabase
            .from("casual_topics")
            .select("id, title")
            .eq("id", opinion.topic_id)
            .maybeSingle()
        : Promise.resolve({ data: null }),
      getNickname(supabase, comment.user_id),
      getNickname(supabase, opinion?.user_id),
    ]);

  return {
    found: true,
    type: "comment",
    label: "댓글",
    topicId: opinion?.topic_id ?? null,
    topicTitle: topic?.title ?? "알 수 없는 주제",
    authorNickname,
    body: comment.body,
    opinionAuthorNickname,
    opinionBody: opinion?.body ?? "원 의견을 찾을 수 없습니다.",
  };
}

function TopicReturnLink({ topicId }: { topicId: string | null }) {
  if (!topicId) {
    return null;
  }

  return (
    <Link
      href={`/topics/${topicId}`}
      className="text-xs font-black text-orange-700 underline underline-offset-4"
    >
      해당 주제로 이동
    </Link>
  );
}

function ReportTargetPreview({ preview }: { preview: ReportPreview }) {
  if (!preview.found) {
    return (
      <div className="mt-6 rounded-3xl bg-red-50 p-5">
        <p className="text-sm font-black text-red-700">신고 대상 확인</p>
        <h2 className="mt-2 text-xl font-black">
          신고 대상을 찾을 수 없습니다.
        </h2>
        <p className="mt-3 text-sm leading-6 text-red-700">
          대상이 삭제되었거나 접근할 수 없는 상태일 수 있습니다.
        </p>
      </div>
    );
  }

  return (
    <div className="mt-6 rounded-3xl bg-orange-50 p-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-sm font-black text-orange-800">신고 대상 확인</p>
          <p className="mt-1 text-xs font-bold text-stone-500">
            신고 대상: {preview.label}
          </p>
        </div>

        {"topicId" in preview && <TopicReturnLink topicId={preview.topicId} />}
      </div>

      {preview.type === "topic" && (
        <div className="mt-4 space-y-4">
          <div>
            <h2 className="break-words text-xl font-black">{preview.title}</h2>
            <p className="mt-3 whitespace-pre-wrap text-sm leading-6 text-stone-700">
              {preview.description}
            </p>
          </div>

          <div className="grid gap-2 sm:grid-cols-2">
            <div className="rounded-2xl bg-white px-4 py-3">
              <p className="text-xs font-black text-orange-700">A</p>
              <p className="mt-1 break-words text-sm font-black text-stone-800">
                {preview.optionA}
              </p>
            </div>
            <div className="rounded-2xl bg-white px-4 py-3">
              <p className="text-xs font-black text-stone-500">B</p>
              <p className="mt-1 break-words text-sm font-black text-stone-800">
                {preview.optionB}
              </p>
            </div>
          </div>
        </div>
      )}

      {preview.type === "opinion" && (
        <div className="mt-4 space-y-4">
          <div>
            <p className="text-xs font-bold text-stone-500">주제</p>
            <h2 className="mt-1 break-words text-xl font-black">
              {preview.topicTitle}
            </h2>
          </div>

          <div className="flex flex-wrap items-center gap-2 text-xs font-bold text-stone-500">
            <span>작성자 {preview.authorNickname}</span>
            <span>·</span>
            <span>{preview.choiceLabel} 측</span>
          </div>

          <p className="max-h-56 overflow-hidden whitespace-pre-wrap rounded-2xl bg-white px-4 py-3 text-sm leading-6 text-stone-700">
            {preview.body}
          </p>

          {preview.images.length > 0 && (
            <div className="grid grid-cols-3 gap-2">
              {preview.images.map((image) => (
                <img
                  key={image.storagePath}
                  src={image.publicUrl}
                  alt="의견 이미지"
                  className="aspect-square w-full rounded-2xl bg-white object-cover"
                />
              ))}
            </div>
          )}
        </div>
      )}

      {preview.type === "comment" && (
        <div className="mt-4 space-y-4">
          <div>
            <p className="text-xs font-bold text-stone-500">주제</p>
            <h2 className="mt-1 break-words text-xl font-black">
              {preview.topicTitle}
            </h2>
          </div>

          <div className="rounded-2xl bg-white px-4 py-3">
            <p className="text-xs font-black text-orange-700">댓글</p>
            <p className="mt-1 text-xs font-bold text-stone-500">
              작성자 {preview.authorNickname}
            </p>
            <p className="mt-3 whitespace-pre-wrap text-sm leading-6 text-stone-700">
              {preview.body}
            </p>
          </div>

          <div className="rounded-2xl bg-white/70 px-4 py-3">
            <p className="text-xs font-black text-stone-500">원 의견</p>
            <p className="mt-1 text-xs font-bold text-stone-500">
              작성자 {preview.opinionAuthorNickname}
            </p>
            <p className="mt-3 max-h-32 overflow-hidden whitespace-pre-wrap text-sm leading-6 text-stone-600">
              {preview.opinionBody}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

export default async function ReportPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const params = await searchParams;
  const supabase = await createClient();

  const targetType = getTargetType(params.targetType);
  const targetId = params.targetId;
  const returnTo = params.returnTo || "/topics";

  if (!targetId || !targetType) {
    redirect("/topics?message=신고 대상 정보가 올바르지 않습니다.&type=error");
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login?message=신고하려면 로그인이 필요합니다.&type=error");
  }

  const preview = await loadReportPreview(supabase, targetType, targetId);

  return (
    <main className="casual-page-bg min-h-screen px-6 py-10 text-[#2f2118]">
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

          <ReportTargetPreview preview={preview} />

          {preview.found ? (
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

                <SubmitButton
                  className="rounded-full bg-red-600 px-6 py-3 text-sm font-black text-white transition hover:-translate-y-0.5"
                  pendingText="신고 접수 중..."
                >
                  신고 접수
                </SubmitButton>
              </div>
            </form>
          ) : (
            <div className="mt-6 flex justify-end">
              <Link
                href={returnTo}
                className="rounded-full border border-stone-200 bg-white px-6 py-3 text-sm font-bold text-stone-700 transition hover:bg-stone-50"
              >
                돌아가기
              </Link>
            </div>
          )}
        </div>
      </section>
    </main>
  );
}
