import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import type { ReactNode } from "react";

import {
  closeTopicAndResolve,
  dismissReport,
  hideCommentAndResolve,
  hideOpinionAndResolve,
  resolveReport,
  unhideComment,
  unhideOpinion,
} from "@/app/admin/reports/actions";
import { createClient } from "@/lib/supabase/server";

import { SiteHeader } from "@/components/SiteHeader";
import { SubmitButton } from "@/components/SubmitButton";

export const metadata: Metadata = {
  title: "신고 관리",
  robots: {
    index: false,
    follow: false,
  },
};

export const dynamic = "force-dynamic";

const OPINION_IMAGE_BUCKET = "casual-opinion-images";
const MISSING_TARGET_MESSAGE =
  "신고 대상을 찾을 수 없습니다. 이미 삭제되었거나 숨김 처리되었을 수 있습니다.";
const ADMIN_NOTE_PLACEHOLDER = "처리 메모를 입력하세요. 선택 사항입니다.";

type SearchParams = Promise<{
  message?: string;
  sort?: string;
  status?: string;
  targetType?: string;
  type?: "success" | "error";
}>;

type ReportStatusFilter = "all" | "open" | "resolved" | "dismissed";
type ReportTargetFilter = "all" | "topic" | "opinion" | "comment";
type ReportSort = "new" | "old";

const STATUS_FILTER_OPTIONS: {
  label: string;
  value: ReportStatusFilter;
}[] = [
  { label: "처리 대기", value: "open" },
  { label: "처리 완료", value: "resolved" },
  { label: "기각", value: "dismissed" },
  { label: "전체", value: "all" },
];

const TARGET_FILTER_OPTIONS: {
  label: string;
  value: ReportTargetFilter;
}[] = [
  { label: "전체 대상", value: "all" },
  { label: "주제", value: "topic" },
  { label: "의견", value: "opinion" },
  { label: "댓글", value: "comment" },
];

const SORT_OPTIONS: {
  label: string;
  value: ReportSort;
}[] = [
  { label: "최신순", value: "new" },
  { label: "오래된순", value: "old" },
];

type AdminReport = {
  id: string;
  reporter_id: string | null;
  target_type: string;
  target_id: string;
  reason: string;
  details: string | null;
  status: string;
  admin_note: string | null;
  created_at: string;
  resolved_at: string | null;
};

type ProfileRecord = {
  user_id: string;
  nickname: string | null;
};

type TopicRecord = {
  id: string;
  title: string;
  description: string;
  option_a: string;
  option_b: string;
  status: string;
};

type OpinionRecord = {
  id: string;
  topic_id: string;
  user_id: string;
  body: string;
  choice: string;
  like_count: number | null;
  dislike_count: number | null;
  is_hidden: boolean | null;
};

type CommentRecord = {
  id: string;
  opinion_id: string;
  user_id: string;
  body: string;
  is_hidden: boolean | null;
};

type OpinionImagePreview = {
  publicUrl: string;
  storagePath: string;
};

type TargetPreview =
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
      status: string;
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
      images: OpinionImagePreview[];
      likeCount: number;
      dislikeCount: number;
      isHidden: boolean;
    }
  | {
      found: true;
      type: "comment";
      label: "댓글";
      topicId: string | null;
      topicTitle: string;
      authorNickname: string;
      body: string;
      isHidden: boolean;
      opinionAuthorNickname: string;
      opinionBody: string;
      opinionChoiceLabel: string;
    };

type PreviewMaps = {
  topicById: Map<string, TopicRecord>;
  opinionById: Map<string, OpinionRecord>;
  commentById: Map<string, CommentRecord>;
  profileByUserId: Map<string, ProfileRecord>;
  imagesByOpinionId: Map<string, OpinionImagePreview[]>;
};

function getStatusFilter(value?: string): ReportStatusFilter {
  if (
    value === "all" ||
    value === "open" ||
    value === "resolved" ||
    value === "dismissed"
  ) {
    return value;
  }

  return "open";
}

function getTargetFilter(value?: string): ReportTargetFilter {
  if (
    value === "all" ||
    value === "topic" ||
    value === "opinion" ||
    value === "comment"
  ) {
    return value;
  }

  return "all";
}

function getReportSort(value?: string): ReportSort {
  if (value === "old") {
    return value;
  }

  return "new";
}

function getReportsHref({
  sort,
  status,
  targetType,
}: {
  sort: ReportSort;
  status: ReportStatusFilter;
  targetType: ReportTargetFilter;
}) {
  const params = new URLSearchParams();

  if (status !== "open") {
    params.set("status", status);
  }

  if (targetType !== "all") {
    params.set("targetType", targetType);
  }

  if (sort !== "new") {
    params.set("sort", sort);
  }

  const query = params.toString();

  return query ? `/admin/reports?${query}` : "/admin/reports";
}

function getReasonLabel(reason: string) {
  if (reason === "abuse") return "욕설/비방";
  if (reason === "spam") return "스팸/도배";
  if (reason === "harassment") return "괴롭힘/공격적 표현";
  if (reason === "personal_info") return "개인정보 노출";
  if (reason === "off_topic") return "주제와 무관한 내용";
  if (reason === "other") return "기타";
  return reason;
}

function getStatusLabel(status: string) {
  if (status === "open") return "대기";
  if (status === "resolved") return "처리완료";
  if (status === "dismissed") return "기각";
  return status;
}

function getStatusClass(status: string) {
  if (status === "open") return "bg-red-50 text-red-700";
  if (status === "resolved") return "bg-green-50 text-green-700";
  if (status === "dismissed") return "bg-stone-100 text-stone-700";
  return "bg-stone-100 text-stone-700";
}

function getTargetLabel(targetType: string) {
  if (targetType === "topic") return "주제";
  if (targetType === "opinion") return "의견";
  if (targetType === "comment") return "댓글";
  return targetType;
}

function getChoiceLabel(
  choice: string | undefined,
  optionA?: string,
  optionB?: string,
) {
  if (choice === "a") return optionA ?? "A";
  if (choice === "b") return optionB ?? "B";
  return "선택 정보 없음";
}

function getNickname(
  profileByUserId: Map<string, ProfileRecord>,
  userId?: string | null,
) {
  if (!userId) return "알 수 없음";

  return profileByUserId.get(userId)?.nickname ?? "알 수 없음";
}

function formatDate(value: string | null) {
  if (!value) return "-";

  return new Intl.DateTimeFormat("ko-KR", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

function getReportPreview(report: AdminReport, maps: PreviewMaps): TargetPreview {
  if (report.target_type === "topic") {
    const topic = maps.topicById.get(report.target_id);

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
      status: topic.status,
    };
  }

  if (report.target_type === "opinion") {
    const opinion = maps.opinionById.get(report.target_id);

    if (!opinion) {
      return { found: false, label: "의견" };
    }

    const topic = maps.topicById.get(opinion.topic_id);

    return {
      found: true,
      type: "opinion",
      label: "의견",
      topicId: opinion.topic_id,
      topicTitle: topic?.title ?? "관련 주제를 찾을 수 없습니다.",
      authorNickname: getNickname(maps.profileByUserId, opinion.user_id),
      choiceLabel: getChoiceLabel(
        opinion.choice,
        topic?.option_a,
        topic?.option_b,
      ),
      body: opinion.body,
      images: maps.imagesByOpinionId.get(opinion.id) ?? [],
      likeCount: opinion.like_count ?? 0,
      dislikeCount: opinion.dislike_count ?? 0,
      isHidden: Boolean(opinion.is_hidden),
    };
  }

  if (report.target_type === "comment") {
    const comment = maps.commentById.get(report.target_id);

    if (!comment) {
      return { found: false, label: "댓글" };
    }

    const opinion = maps.opinionById.get(comment.opinion_id);
    const topic = opinion ? maps.topicById.get(opinion.topic_id) : null;

    return {
      found: true,
      type: "comment",
      label: "댓글",
      topicId: opinion?.topic_id ?? null,
      topicTitle: topic?.title ?? "관련 주제를 찾을 수 없습니다.",
      authorNickname: getNickname(maps.profileByUserId, comment.user_id),
      body: comment.body,
      isHidden: Boolean(comment.is_hidden),
      opinionAuthorNickname: getNickname(
        maps.profileByUserId,
        opinion?.user_id,
      ),
      opinionBody: opinion?.body ?? "원 의견을 찾을 수 없습니다.",
      opinionChoiceLabel: getChoiceLabel(
        opinion?.choice,
        topic?.option_a,
        topic?.option_b,
      ),
    };
  }

  return { found: false, label: getTargetLabel(report.target_type) };
}

function getPreviewTopicId(preview: TargetPreview) {
  if (!preview.found) return null;
  return preview.topicId;
}

function Badge({
  children,
  className,
}: {
  children: ReactNode;
  className: string;
}) {
  return (
    <span className={`rounded-full px-3 py-1 text-xs font-black ${className}`}>
      {children}
    </span>
  );
}

function InfoItem({
  label,
  value,
}: {
  label: string;
  value: ReactNode;
}) {
  return (
    <div className="rounded-2xl bg-stone-50 px-4 py-3">
      <p className="text-xs font-black text-stone-500">{label}</p>
      <div className="mt-1 break-words text-sm font-bold text-stone-800">
        {value}
      </div>
    </div>
  );
}

function AdminNoteInput() {
  return (
    <input
      name="adminNote"
      className="w-full rounded-2xl border border-stone-200 px-3 py-2 text-sm outline-none transition focus:border-orange-400"
      placeholder={ADMIN_NOTE_PLACEHOLDER}
    />
  );
}

function TopicLink({ topicId }: { topicId: string | null }) {
  if (!topicId) {
    return null;
  }

  return (
    <Link
      href={`/topics/${topicId}`}
      className="rounded-full border border-orange-200 bg-white px-4 py-2 text-xs font-black text-orange-800 transition hover:bg-orange-50"
    >
      주제 상세로 이동
    </Link>
  );
}

function FilterButton({
  active,
  children,
  href,
}: {
  active: boolean;
  children: ReactNode;
  href: string;
}) {
  return (
    <Link
      href={href}
      aria-current={active ? "page" : undefined}
      className={`rounded-full px-4 py-2 text-sm font-black transition ${
        active
          ? "bg-orange-600 text-white shadow-sm"
          : "border border-stone-200 bg-white text-stone-700 hover:bg-orange-50 hover:text-orange-800"
      }`}
    >
      {children}
    </Link>
  );
}

function FilterGroup({
  children,
  title,
}: {
  children: ReactNode;
  title: string;
}) {
  return (
    <div>
      <p className="text-xs font-black text-stone-500">{title}</p>
      <div className="mt-2 flex flex-wrap gap-2">{children}</div>
    </div>
  );
}

function ReportTargetPreview({ preview }: { preview: TargetPreview }) {
  if (!preview.found) {
    return (
      <section className="rounded-3xl border border-red-100 bg-red-50 p-5">
        <p className="text-xs font-black text-red-700">신고 대상 확인</p>
        <h3 className="mt-2 text-lg font-black text-red-900">
          신고 대상: {preview.label}
        </h3>
        <p className="mt-3 text-sm leading-6 text-red-800">
          {MISSING_TARGET_MESSAGE}
        </p>
      </section>
    );
  }

  return (
    <section className="rounded-3xl border border-orange-100 bg-orange-50/70 p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-xs font-black text-orange-800">신고 대상 확인</p>
          <h3 className="mt-1 text-lg font-black">
            신고 대상: {preview.label}
          </h3>
        </div>
        <TopicLink topicId={getPreviewTopicId(preview)} />
      </div>

      {preview.type === "topic" && (
        <div className="mt-4 space-y-4">
          <div>
            <h4 className="break-words text-xl font-black">{preview.title}</h4>
            <p className="mt-3 whitespace-pre-wrap text-sm leading-6 text-stone-700">
              {preview.description}
            </p>
          </div>

          <div className="grid gap-2 sm:grid-cols-2">
            <div className="rounded-2xl bg-white px-4 py-3">
              <p className="text-xs font-black text-orange-700">A 선택지</p>
              <p className="mt-1 break-words text-sm font-black">
                {preview.optionA}
              </p>
            </div>
            <div className="rounded-2xl bg-white px-4 py-3">
              <p className="text-xs font-black text-stone-500">B 선택지</p>
              <p className="mt-1 break-words text-sm font-black">
                {preview.optionB}
              </p>
            </div>
          </div>

          <Badge className="bg-white text-stone-700">
            현재 상태 {preview.status}
          </Badge>
        </div>
      )}

      {preview.type === "opinion" && (
        <div className="mt-4 space-y-4">
          <div>
            <p className="text-xs font-black text-stone-500">관련 주제</p>
            <h4 className="mt-1 break-words text-xl font-black">
              {preview.topicTitle}
            </h4>
          </div>

          <div className="flex flex-wrap items-center gap-2 text-xs font-bold text-stone-500">
            <span>의견 작성자 {preview.authorNickname}</span>
            <span>·</span>
            <span>{preview.choiceLabel}</span>
          </div>

          <p className="max-h-60 overflow-hidden whitespace-pre-wrap rounded-2xl bg-white px-4 py-3 text-sm leading-6 text-stone-700">
            {preview.body}
          </p>

          {preview.images.length > 0 && (
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
              {preview.images.map((image) => (
                <a
                  key={image.storagePath}
                  href={image.publicUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="block"
                >
                  <img
                    src={image.publicUrl}
                    alt="의견 이미지"
                    className="aspect-square w-full rounded-2xl bg-white object-cover ring-1 ring-orange-100"
                  />
                </a>
              ))}
            </div>
          )}

          <div className="flex flex-wrap gap-2">
            <Badge className="bg-white text-stone-700">
              공감 {preview.likeCount}
            </Badge>
            <Badge className="bg-white text-stone-700">
              비공감 {preview.dislikeCount}
            </Badge>
            <Badge
              className={
                preview.isHidden
                  ? "bg-red-50 text-red-700"
                  : "bg-white text-stone-700"
              }
            >
              {preview.isHidden ? "숨김됨" : "공개 상태"}
            </Badge>
          </div>
        </div>
      )}

      {preview.type === "comment" && (
        <div className="mt-4 space-y-4">
          <div>
            <p className="text-xs font-black text-stone-500">관련 주제</p>
            <h4 className="mt-1 break-words text-xl font-black">
              {preview.topicTitle}
            </h4>
          </div>

          <div className="rounded-2xl bg-white px-4 py-3">
            <div className="flex flex-wrap items-center gap-2">
              <p className="text-xs font-black text-orange-700">댓글</p>
              <span className="text-xs font-bold text-stone-400">·</span>
              <p className="text-xs font-bold text-stone-500">
                댓글 작성자 {preview.authorNickname}
              </p>
              <span className="text-xs font-bold text-stone-400">·</span>
              <p
                className={`text-xs font-black ${
                  preview.isHidden ? "text-red-700" : "text-stone-500"
                }`}
              >
                {preview.isHidden ? "숨김됨" : "공개 상태"}
              </p>
            </div>
            <p className="mt-3 whitespace-pre-wrap text-sm leading-6 text-stone-700">
              {preview.body}
            </p>
          </div>

          <div className="rounded-2xl bg-white/70 px-4 py-3">
            <div className="flex flex-wrap items-center gap-2">
              <p className="text-xs font-black text-stone-500">원 의견</p>
              <span className="text-xs font-bold text-stone-400">·</span>
              <p className="text-xs font-bold text-stone-500">
                작성자 {preview.opinionAuthorNickname}
              </p>
              <span className="text-xs font-bold text-stone-400">·</span>
              <p className="text-xs font-bold text-stone-500">
                {preview.opinionChoiceLabel}
              </p>
            </div>
            <p className="mt-3 max-h-32 overflow-hidden whitespace-pre-wrap text-sm leading-6 text-stone-600">
              {preview.opinionBody}
            </p>
          </div>
        </div>
      )}
    </section>
  );
}

function ReportActions({
  preview,
  report,
}: {
  preview: TargetPreview;
  report: AdminReport;
}) {
  const isOpen = report.status === "open";
  const canHideOpinion =
    isOpen && preview.found && preview.type === "opinion" && !preview.isHidden;
  const canHideComment =
    isOpen && preview.found && preview.type === "comment" && !preview.isHidden;
  const canCloseTopic = isOpen && preview.found && preview.type === "topic";
  const canUnhideOpinion =
    preview.found && preview.type === "opinion" && preview.isHidden;
  const canUnhideComment =
    preview.found && preview.type === "comment" && preview.isHidden;

  return (
    <aside className="flex min-w-0 flex-col gap-3 lg:w-72 lg:shrink-0">
      {getPreviewTopicId(preview) && (
        <Link
          href={`/topics/${getPreviewTopicId(preview)}`}
          className="rounded-full border border-stone-200 px-4 py-2 text-center text-sm font-bold text-stone-700 transition hover:bg-stone-50"
        >
          사용자 화면 보기
        </Link>
      )}

      {isOpen ? (
        <div className="space-y-3 rounded-3xl border border-stone-100 bg-stone-50 p-3">
          <p className="px-1 text-xs font-black text-stone-500">처리 액션</p>

          <form action={resolveReport} className="space-y-2">
            <input type="hidden" name="reportId" value={report.id} />
            <AdminNoteInput />
            <SubmitButton
              className="w-full rounded-full bg-green-600 px-4 py-2 text-sm font-black text-white transition hover:-translate-y-0.5"
              pendingText="처리 중..."
            >
              신고 처리완료
            </SubmitButton>
          </form>

          {canHideOpinion && (
            <form action={hideOpinionAndResolve} className="space-y-2">
              <input type="hidden" name="reportId" value={report.id} />
              <input type="hidden" name="targetId" value={report.target_id} />
              <AdminNoteInput />
              <SubmitButton
                className="w-full rounded-full bg-red-600 px-4 py-2 text-sm font-black text-white transition hover:-translate-y-0.5"
                pendingText="처리 중..."
              >
                의견 숨김 + 처리완료
              </SubmitButton>
            </form>
          )}

          {canHideComment && (
            <form action={hideCommentAndResolve} className="space-y-2">
              <input type="hidden" name="reportId" value={report.id} />
              <input type="hidden" name="targetId" value={report.target_id} />
              <AdminNoteInput />
              <SubmitButton
                className="w-full rounded-full bg-red-600 px-4 py-2 text-sm font-black text-white transition hover:-translate-y-0.5"
                pendingText="처리 중..."
              >
                댓글 숨김 + 처리완료
              </SubmitButton>
            </form>
          )}

          {canCloseTopic && (
            <form action={closeTopicAndResolve} className="space-y-2">
              <input type="hidden" name="reportId" value={report.id} />
              <input type="hidden" name="targetId" value={report.target_id} />
              <AdminNoteInput />
              <SubmitButton
                className="w-full rounded-full bg-red-600 px-4 py-2 text-sm font-black text-white transition hover:-translate-y-0.5"
                pendingText="처리 중..."
              >
                주제 종료 + 처리완료
              </SubmitButton>
            </form>
          )}

          <form action={dismissReport} className="space-y-2">
            <input type="hidden" name="reportId" value={report.id} />
            <AdminNoteInput />
            <SubmitButton
              className="w-full rounded-full bg-stone-200 px-4 py-2 text-sm font-black text-stone-800 transition hover:bg-stone-300"
              pendingText="처리 중..."
            >
              신고 기각
            </SubmitButton>
          </form>
        </div>
      ) : (
        <div className="rounded-3xl border border-stone-100 bg-stone-50 p-4">
          <p className="text-sm font-black text-stone-700">
            {getStatusLabel(report.status)}된 신고입니다.
          </p>
          {report.admin_note && (
            <p className="mt-2 whitespace-pre-wrap text-xs leading-5 text-stone-500">
              {report.admin_note}
            </p>
          )}
        </div>
      )}

      {canUnhideOpinion && (
        <form action={unhideOpinion}>
          <input type="hidden" name="targetId" value={report.target_id} />
          <SubmitButton
            className="w-full rounded-full border border-stone-200 bg-white px-4 py-2 text-sm font-black text-stone-700 transition hover:bg-stone-50"
            pendingText="처리 중..."
          >
            의견 숨김 해제
          </SubmitButton>
        </form>
      )}

      {canUnhideComment && (
        <form action={unhideComment}>
          <input type="hidden" name="targetId" value={report.target_id} />
          <SubmitButton
            className="w-full rounded-full border border-stone-200 bg-white px-4 py-2 text-sm font-black text-stone-700 transition hover:bg-stone-50"
            pendingText="처리 중..."
          >
            댓글 숨김 해제
          </SubmitButton>
        </form>
      )}
    </aside>
  );
}

export default async function AdminReportsPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const params = await searchParams;
  const statusFilter = getStatusFilter(params.status);
  const targetFilter = getTargetFilter(params.targetType);
  const sort = getReportSort(params.sort);
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

  let reportsQuery = supabase
    .from("casual_reports")
    .select(
      "id, reporter_id, target_type, target_id, reason, details, status, admin_note, created_at, resolved_at",
    );

  if (statusFilter !== "all") {
    reportsQuery = reportsQuery.eq("status", statusFilter);
  }

  if (targetFilter !== "all") {
    reportsQuery = reportsQuery.eq("target_type", targetFilter);
  }

  const [{ data: reports, error }, { count: openTotalCount }] =
    await Promise.all([
      reportsQuery.order("created_at", { ascending: sort === "old" }),
      supabase
        .from("casual_reports")
        .select("id", { count: "exact", head: true })
        .eq("status", "open"),
    ]);

  if (error) {
    return (
      <main className="min-h-screen bg-red-50 p-8 text-red-900">
        <h1 className="text-2xl font-black">신고 목록을 불러오지 못했습니다.</h1>
        <pre className="mt-4 whitespace-pre-wrap rounded-xl bg-white p-4 text-sm">
          {error.message}
        </pre>
      </main>
    );
  }

  const reportList = (reports ?? []) as AdminReport[];
  const reporterIds = Array.from(
    new Set(reportList.map((report) => report.reporter_id).filter(Boolean)),
  ) as string[];
  const topicTargetIds = reportList
    .filter((report) => report.target_type === "topic")
    .map((report) => report.target_id);
  const opinionTargetIds = reportList
    .filter((report) => report.target_type === "opinion")
    .map((report) => report.target_id);
  const commentTargetIds = reportList
    .filter((report) => report.target_type === "comment")
    .map((report) => report.target_id);

  const [opinionTargetsResult, commentTargetsResult] = await Promise.all([
    opinionTargetIds.length > 0
      ? supabase
          .from("casual_opinions")
          .select(
            "id, topic_id, user_id, body, choice, like_count, dislike_count, is_hidden",
          )
          .in("id", opinionTargetIds)
      : Promise.resolve({ data: [] }),
    commentTargetIds.length > 0
      ? supabase
          .from("casual_comments")
          .select("id, opinion_id, user_id, body, is_hidden")
          .in("id", commentTargetIds)
      : Promise.resolve({ data: [] }),
  ]);

  const opinionTargets = (opinionTargetsResult.data ?? []) as OpinionRecord[];
  const commentTargets = (commentTargetsResult.data ?? []) as CommentRecord[];
  const commentOpinionIds = Array.from(
    new Set(commentTargets.map((comment) => comment.opinion_id)),
  );

  const { data: commentOpinionsData } =
    commentOpinionIds.length > 0
      ? await supabase
          .from("casual_opinions")
          .select(
            "id, topic_id, user_id, body, choice, like_count, dislike_count, is_hidden",
          )
          .in("id", commentOpinionIds)
      : { data: [] };

  const commentOpinions = (commentOpinionsData ?? []) as OpinionRecord[];
  const allOpinions = [...opinionTargets, ...commentOpinions];
  const allOpinionIds = Array.from(
    new Set(allOpinions.map((opinion) => opinion.id)),
  );
  const allTopicIds = Array.from(
    new Set([
      ...topicTargetIds,
      ...allOpinions.map((opinion) => opinion.topic_id),
    ]),
  );
  const allUserIds = Array.from(
    new Set([
      ...reporterIds,
      ...allOpinions.map((opinion) => opinion.user_id),
      ...commentTargets.map((comment) => comment.user_id),
    ]),
  );

  const [topicsResult, profilesResult, imagesResult] = await Promise.all([
    allTopicIds.length > 0
      ? supabase
          .from("casual_topics")
          .select("id, title, description, option_a, option_b, status")
          .in("id", allTopicIds)
      : Promise.resolve({ data: [] }),
    allUserIds.length > 0
      ? supabase
          .from("casual_profiles")
          .select("user_id, nickname")
          .in("user_id", allUserIds)
      : Promise.resolve({ data: [] }),
    opinionTargetIds.length > 0
      ? supabase
          .from("casual_opinion_images")
          .select("opinion_id, storage_bucket, storage_path, display_order")
          .in("opinion_id", opinionTargetIds)
          .order("display_order", { ascending: true })
      : Promise.resolve({ data: [] }),
  ]);

  const topicById = new Map<string, TopicRecord>(
    ((topicsResult.data ?? []) as TopicRecord[]).map((topic) => [
      topic.id,
      topic,
    ]),
  );
  const opinionById = new Map<string, OpinionRecord>(
    allOpinions.map((opinion) => [opinion.id, opinion]),
  );
  const commentById = new Map<string, CommentRecord>(
    commentTargets.map((comment) => [comment.id, comment]),
  );
  const profileByUserId = new Map<string, ProfileRecord>(
    ((profilesResult.data ?? []) as ProfileRecord[]).map((profile) => [
      profile.user_id,
      profile,
    ]),
  );
  const imagesByOpinionId = new Map<string, OpinionImagePreview[]>();

  for (const image of imagesResult.data ?? []) {
    const storageBucket = image.storage_bucket ?? OPINION_IMAGE_BUCKET;
    const { data } = supabase.storage
      .from(storageBucket)
      .getPublicUrl(image.storage_path);
    const images = imagesByOpinionId.get(image.opinion_id) ?? [];

    images.push({
      publicUrl: data.publicUrl,
      storagePath: image.storage_path,
    });
    imagesByOpinionId.set(image.opinion_id, images);
  }

  const previewMaps: PreviewMaps = {
    topicById,
    opinionById,
    commentById,
    profileByUserId,
    imagesByOpinionId,
  };
  const openCount = openTotalCount ?? 0;
  const emptyTitle =
    statusFilter === "open" && targetFilter === "all"
      ? "처리 대기 중인 신고가 없습니다."
      : "조건에 맞는 신고가 없습니다.";
  const emptyDescription =
    statusFilter === "open" && targetFilter === "all"
      ? "새 신고가 접수되면 이곳에 표시됩니다."
      : "필터를 변경하거나 전체 조건으로 다시 확인해보세요.";

  return (
    <main className="casual-page-bg min-h-screen pb-24 text-[#2f2118]">
      <SiteHeader />
      <section className="mx-auto max-w-6xl px-4 sm:px-6">
        <section className="mt-8 rounded-3xl border border-orange-100 bg-white p-5 shadow-sm sm:p-6">
          <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="text-sm font-bold tracking-[0.3em] text-orange-700">
                ADMIN REPORTS
              </p>
              <h1 className="mt-2 text-3xl font-black">신고 관리</h1>
              <p className="mt-3 text-sm leading-6 text-stone-600">
                신고 접수 상태와 신고 대상을 함께 확인하고 필요한 운영 조치를
                처리합니다.
              </p>
              <p className="mt-3 text-sm font-bold text-stone-500">
                현재 조건 {reportList.length}건 · 처리 대기 {openCount}건
              </p>
            </div>

            <div className="flex flex-wrap gap-2">
              <Link
                href="/admin"
                className="rounded-full border border-stone-200 px-4 py-2 text-sm font-bold text-stone-700 transition hover:bg-stone-50"
              >
                대시보드
              </Link>
              <Link
                href="/admin/qa"
                className="rounded-full border border-orange-200 bg-orange-50 px-4 py-2 text-sm font-black text-orange-800 transition hover:bg-orange-100"
              >
                QA 체크리스트
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
              <Link
                href="/admin/users"
                className="rounded-full border border-stone-200 px-4 py-2 text-sm font-bold text-stone-700 transition hover:bg-stone-50"
              >
                유저 관리
              </Link>
              <Link
                href="/admin/topics"
                className="rounded-full bg-stone-950 px-4 py-2 text-sm font-black text-white transition hover:-translate-y-0.5"
              >
                주제 관리
              </Link>
            </div>
          </div>
        </section>

        {params.message && (
          <div
            className={`mt-6 rounded-2xl p-4 text-sm font-bold ${
              params.type === "error"
                ? "bg-red-50 text-red-700"
                : "bg-green-50 text-green-700"
            }`}
          >
            {params.message}
          </div>
        )}

        <section className="mt-6 rounded-3xl border border-orange-100 bg-white p-5 shadow-sm">
          <div className="grid gap-5 lg:grid-cols-[1fr_1fr_auto] lg:items-end">
            <FilterGroup title="상태 필터">
              {STATUS_FILTER_OPTIONS.map((option) => (
                <FilterButton
                  key={option.value}
                  active={statusFilter === option.value}
                  href={getReportsHref({
                    status: option.value,
                    targetType: targetFilter,
                    sort,
                  })}
                >
                  {option.label}
                </FilterButton>
              ))}
            </FilterGroup>

            <FilterGroup title="대상 필터">
              {TARGET_FILTER_OPTIONS.map((option) => (
                <FilterButton
                  key={option.value}
                  active={targetFilter === option.value}
                  href={getReportsHref({
                    status: statusFilter,
                    targetType: option.value,
                    sort,
                  })}
                >
                  {option.label}
                </FilterButton>
              ))}
            </FilterGroup>

            <FilterGroup title="정렬">
              {SORT_OPTIONS.map((option) => (
                <FilterButton
                  key={option.value}
                  active={sort === option.value}
                  href={getReportsHref({
                    status: statusFilter,
                    targetType: targetFilter,
                    sort: option.value,
                  })}
                >
                  {option.label}
                </FilterButton>
              ))}
            </FilterGroup>
          </div>
        </section>

        <section className="mt-8 space-y-5">
          {reportList.map((report) => {
            const reporter = report.reporter_id
              ? profileByUserId.get(report.reporter_id)
              : null;
            const preview = getReportPreview(report, previewMaps);

            return (
              <article
                key={report.id}
                className="rounded-3xl border border-orange-100 bg-white p-4 shadow-sm sm:p-5"
              >
                <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_18rem]">
                  <div className="min-w-0 space-y-4">
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge className={getStatusClass(report.status)}>
                        {getStatusLabel(report.status)}
                      </Badge>
                      <Badge className="bg-stone-100 text-stone-700">
                        {getTargetLabel(report.target_type)}
                      </Badge>
                      <Badge className="bg-orange-100 text-orange-800">
                        {getReasonLabel(report.reason)}
                      </Badge>
                      {preview.found &&
                        preview.type === "opinion" &&
                        preview.isHidden && (
                          <Badge className="bg-red-50 text-red-700">
                            의견 숨김됨
                          </Badge>
                        )}
                      {preview.found &&
                        preview.type === "comment" &&
                        preview.isHidden && (
                          <Badge className="bg-red-50 text-red-700">
                            댓글 숨김됨
                          </Badge>
                        )}
                    </div>

                    <div className="grid gap-3 md:grid-cols-2">
                      <InfoItem
                        label="신고 사유"
                        value={getReasonLabel(report.reason)}
                      />
                      <InfoItem
                        label="신고자"
                        value={reporter?.nickname ?? "알 수 없음"}
                      />
                      <InfoItem
                        label="신고 접수 시각"
                        value={formatDate(report.created_at)}
                      />
                      <InfoItem
                        label="처리 시각"
                        value={
                          report.resolved_at ? formatDate(report.resolved_at) : "-"
                        }
                      />
                    </div>

                    <div className="rounded-2xl bg-red-50 p-4">
                      <p className="text-xs font-black text-red-700">
                        신고 상세 내용
                      </p>
                      <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-red-900">
                        {report.details || "상세 내용이 입력되지 않았습니다."}
                      </p>
                    </div>

                    {report.admin_note && (
                      <div className="rounded-2xl bg-green-50 p-4">
                        <p className="text-xs font-black text-green-700">
                          관리자 메모
                        </p>
                        <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-green-900">
                          {report.admin_note}
                        </p>
                      </div>
                    )}

                    <ReportTargetPreview preview={preview} />
                  </div>

                  <ReportActions preview={preview} report={report} />
                </div>
              </article>
            );
          })}

          {reportList.length === 0 && (
            <div className="rounded-3xl border border-orange-100 bg-white p-8 text-center">
              <h2 className="text-xl font-black">{emptyTitle}</h2>
              <p className="mt-2 text-sm text-stone-600">
                {emptyDescription}
              </p>
            </div>
          )}
        </section>
      </section>
    </main>
  );
}
