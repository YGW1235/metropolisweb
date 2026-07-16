import Link from "next/link";
import { notFound } from "next/navigation";

import { createReport } from "@/app/actions/reports";
import { joinTopic } from "@/app/actions/topics";
import {
  createDebateComment,
  deleteDebateComment,
  deleteDebatePost,
} from "@/app/actions/posts";
import { createClient } from "@/lib/supabase/server";
import { ConfirmSubmitButton } from "@/components/confirm-submit-button";
import { PendingSubmitButton } from "@/components/pending-submit-button";
import { PostImageViewer } from "@/components/post-image-viewer";

type PostDetailPageProps = {
  params: Promise<{
    topicId: string;
    postId: string;
  }>;
  searchParams: Promise<{
    message?: string;
    type?: string;
  }>;
};

type DebatePost = {
  id: string;
  topic_id: string;
  side: string | null;
  title: string;
  content: string;
  created_at: string;
  updated_at: string;
  image_url: string | null;
  author_label: string | null;
};

type DebateComment = {
  id: string;
  post_id: string;
  topic_id: string;
  content: string;
  side: string | null;
  created_at: string;
  updated_at: string;
  author_label: string | null;
};

type Participation = {
  assigned_side: string | null;
  side_index: number | null;
};

function AthenaIcon() {
  return (
    <span className="flex h-12 w-12 items-center justify-center rounded-full border border-[var(--theme-gold)] bg-[var(--athena-surface-soft)] text-2xl text-[var(--athena-text)] shadow-[var(--shadow-athena-icon)] transition duration-300">
      ♜
    </span>
  );
}

function PoseidonIcon() {
  return (
    <span className="flex h-12 w-12 items-center justify-center rounded-full border border-[var(--theme-blue)] bg-[var(--poseidon-surface-soft)] text-2xl text-[var(--poseidon-text)] shadow-[var(--shadow-poseidon-icon)] transition duration-300">
      Ψ
    </span>
  );
}

function sideLabel(side: string | null) {
  if (side === "pro") return "아테나 진영 · 찬성";
  if (side === "con") return "포세이돈 진영 · 반대";
  return "미배정";
}

function shortSideLabel(side: string | null) {
  if (side === "pro") return "아테나";
  if (side === "con") return "포세이돈";
  return "미배정";
}

function sideBadgeClass(side: string | null) {
  if (side === "pro") {
    return "border-[var(--theme-gold)] bg-[var(--athena-surface-soft)] text-[var(--athena-text)]";
  }

  if (side === "con") {
    return "border-[var(--theme-blue)] bg-[var(--poseidon-surface-soft)] text-[var(--poseidon-text)]";
  }

  return "border-[var(--theme-line)] bg-[var(--theme-surface)] text-[var(--theme-muted)]";
}

function fullSideLabel(side: string | null) {
  if (side === "pro") return "아테나 진영 · 찬성";
  if (side === "con") return "포세이돈 진영 · 반대";
  return "관전 중";
}

function formatDateTime(value: string) {
  return new Date(value).toLocaleString("ko-KR", {
    timeZone: "Asia/Seoul",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function writeDisabledMessage(status: string | null) {
  if (status === "closed") {
    return "종료된 토론입니다. 더 이상 댓글을 작성할 수 없습니다.";
  }

  if (status === "archived") {
    return "보관 처리된 토론입니다.";
  }

  if (status === "draft") {
    return "아직 공개되지 않은 토론입니다.";
  }

  return "현재 이 주제에는 댓글을 작성할 수 없습니다.";
}

function JoinButton({
  topicId,
  side,
  children,
  className,
}: {
  topicId: string;
  side: "auto" | "pro" | "con";
  children: string;
  className: string;
}) {
  return (
    <form action={joinTopic}>
      <input type="hidden" name="topic_id" value={topicId} />
      <input type="hidden" name="side" value={side} />

      <PendingSubmitButton
        pendingText="참여 중..."
        className={`inline-flex w-full items-center justify-center border px-4 py-2.5 text-xs font-black shadow-[var(--shadow-button)] transition duration-300 hover:opacity-85 ${className}`}
      >
        {children}
      </PendingSubmitButton>
    </form>
  );
}

function SpectatorPanel({
  topicId,
  userExists,
  canJoin,
}: {
  topicId: string;
  userExists: boolean;
  canJoin: boolean;
}) {
  if (!canJoin) {
    return (
      <div
        id="spectator-mode"
        className="mt-8 rounded-[2rem] border border-[var(--theme-line)] bg-[var(--theme-panel)] p-6 shadow-[var(--shadow-card)] transition duration-300"
      >
        <p className="text-xs font-black uppercase tracking-[0.28em] text-[var(--theme-gold)]">
          Spectator Mode
        </p>
        <h2 className="mt-3 font-serif text-3xl font-black text-[var(--theme-text)]">
          관전 중입니다
        </h2>
        <p className="mt-3 text-sm leading-7 text-[var(--theme-muted)]">
          이 의제는 현재 새 참여가 제한되어 있습니다. 발언과 댓글은 계속
          관전할 수 있습니다.
        </p>
      </div>
    );
  }

  if (!userExists) {
    return (
      <div
        id="spectator-mode"
        className="mt-8 rounded-[2rem] border border-[var(--theme-line)] bg-[var(--theme-panel)] p-6 shadow-[var(--shadow-card)] transition duration-300"
      >
        <p className="text-xs font-black uppercase tracking-[0.28em] text-[var(--theme-gold)]">
          Spectator Mode
        </p>
        <h2 className="mt-3 font-serif text-3xl font-black text-[var(--theme-text)]">
          비로그인 관전 중입니다
        </h2>
        <p className="mt-3 text-sm leading-7 text-[var(--theme-muted)]">
          지금은 발언과 댓글을 읽을 수 있습니다. 댓글이나 새 발언을 남기려면
          로그인 후 진영에 참여하세요.
        </p>

        <Link
          href={`/login?message=${encodeURIComponent(
            "로그인 후 진영에 참여할 수 있습니다.",
          )}&redirectTo=${encodeURIComponent(`/topics/${topicId}/debate`)}`}
          className="mt-5 inline-flex items-center justify-center border border-[var(--theme-gold)] bg-[var(--theme-gold)] px-5 py-3 text-sm font-black text-[var(--theme-accent-contrast)] shadow-[var(--shadow-button)] transition duration-300 hover:opacity-85"
        >
          로그인 후 참여
          <span className="ml-2">›</span>
        </Link>
      </div>
    );
  }

  return (
    <div
      id="spectator-mode"
      className="mt-8 rounded-[2rem] border border-[var(--theme-line)] bg-[var(--theme-panel)] p-6 shadow-[var(--shadow-card)] transition duration-300"
    >
      <div className="flex flex-col justify-between gap-5 lg:flex-row lg:items-end">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.28em] text-[var(--theme-gold)]">
            Spectator Mode
          </p>
          <h2 className="mt-3 font-serif text-3xl font-black text-[var(--theme-text)]">
            현재 관전 중입니다
          </h2>
          <p className="mt-3 max-w-2xl text-sm leading-7 text-[var(--theme-muted)]">
            댓글과 새 발언을 남기려면 진영을 선택해 참여하세요. 자동 배정은
            인원이 적은 진영으로 배정됩니다.
          </p>
        </div>

        <div className="grid gap-2 sm:grid-cols-3 lg:min-w-[480px]">
          <JoinButton
            topicId={topicId}
            side="auto"
            className="border-[var(--theme-line)] bg-[var(--theme-text)] text-[var(--theme-bg)]"
          >
            자동 배정
          </JoinButton>

          <JoinButton
            topicId={topicId}
            side="pro"
            className="border-[var(--theme-gold)] bg-[var(--theme-gold)] text-[var(--theme-accent-contrast)]"
          >
            아테나 선택
          </JoinButton>

          <JoinButton
            topicId={topicId}
            side="con"
            className="border-[var(--theme-blue)] bg-[var(--theme-blue)] text-[var(--theme-accent-contrast)]"
          >
            포세이돈 선택
          </JoinButton>
        </div>
      </div>
    </div>
  );
}

function ReportPostForm({
  topicId,
  postId,
}: {
  topicId: string;
  postId: string;
}) {
  return (
    <details>
      <summary className="cursor-pointer list-none border border-[var(--theme-line)] bg-[var(--theme-surface)] px-4 py-2 text-xs font-black text-[var(--theme-muted)] transition hover:bg-[var(--theme-surface-hover)] hover:text-[var(--theme-text)]">
        발언 신고
      </summary>

      <form
        action={createReport}
        className="mt-3 w-full max-w-xl space-y-3 rounded-2xl border border-[var(--theme-line)] bg-[var(--theme-panel)] p-4"
      >
        <input type="hidden" name="topic_id" value={topicId} />
        <input type="hidden" name="target_type" value="post" />
        <input type="hidden" name="target_id" value={postId} />
        <input type="hidden" name="anchor" value="" />

        <select
          name="reason"
          required
          className="w-full rounded-xl border border-[var(--theme-line)] bg-[var(--theme-surface)] px-3 py-2 text-sm text-[var(--theme-text)] outline-none transition focus:border-[var(--theme-gold)]"
        >
          <option value="">신고 사유 선택</option>
          <option value="abuse">욕설 / 비방</option>
          <option value="spam">도배 / 스팸</option>
          <option value="off_topic">주제와 무관함</option>
          <option value="role_break">배정 역할에 맞지 않는 주장</option>
          <option value="other">기타</option>
        </select>

        <textarea
          name="detail"
          rows={3}
          className="w-full rounded-xl border border-[var(--theme-line)] bg-[var(--theme-surface)] px-3 py-2 text-sm text-[var(--theme-text)] outline-none transition placeholder:text-[var(--theme-soft)] focus:border-[var(--theme-gold)]"
          placeholder="상세 내용을 입력하세요. 선택 사항입니다."
        />

        <PendingSubmitButton
          pendingText="신고 중..."
          className="border border-[var(--message-error-line)] bg-[var(--message-error-bg)] px-4 py-2 text-xs font-black text-[var(--message-error-text)] transition hover:opacity-80"
        >
          신고 접수
        </PendingSubmitButton>
      </form>
    </details>
  );
}

function ReportCommentForm({
  topicId,
  commentId,
}: {
  topicId: string;
  commentId: string;
}) {
  return (
    <details>
      <summary className="cursor-pointer list-none border border-[var(--theme-line)] bg-[var(--theme-surface)] px-3 py-2 text-xs font-black text-[var(--theme-soft)] transition hover:bg-[var(--theme-surface-hover)] hover:text-[var(--theme-text)]">
        댓글 신고
      </summary>

      <form
        action={createReport}
        className="mt-3 w-full max-w-xl space-y-3 rounded-2xl border border-[var(--theme-line)] bg-[var(--theme-panel)] p-4"
      >
        <input type="hidden" name="topic_id" value={topicId} />
        <input type="hidden" name="target_type" value="comment" />
        <input type="hidden" name="target_id" value={commentId} />
        <input type="hidden" name="anchor" value="" />

        <select
          name="reason"
          required
          className="w-full rounded-xl border border-[var(--theme-line)] bg-[var(--theme-surface)] px-3 py-2 text-xs text-[var(--theme-text)] outline-none transition focus:border-[var(--theme-gold)]"
        >
          <option value="">신고 사유 선택</option>
          <option value="abuse">욕설 / 비방</option>
          <option value="spam">도배 / 스팸</option>
          <option value="off_topic">주제와 무관함</option>
          <option value="role_break">배정 역할에 맞지 않는 발언</option>
          <option value="other">기타</option>
        </select>

        <textarea
          name="detail"
          rows={2}
          className="w-full rounded-xl border border-[var(--theme-line)] bg-[var(--theme-surface)] px-3 py-2 text-xs text-[var(--theme-text)] outline-none transition placeholder:text-[var(--theme-soft)] focus:border-[var(--theme-gold)]"
          placeholder="상세 내용. 선택 사항입니다."
        />

        <PendingSubmitButton
          pendingText="신고 중..."
          className="border border-[var(--message-error-line)] bg-[var(--message-error-bg)] px-3 py-2 text-xs font-black text-[var(--message-error-text)] transition hover:opacity-80"
        >
          신고 접수
        </PendingSubmitButton>
      </form>
    </details>
  );
}

function CommentCard({
  comment,
  topicId,
  postId,
  isMine,
  canReport,
}: {
  comment: DebateComment;
  topicId: string;
  postId: string;
  isMine: boolean;
  canReport: boolean;
}) {

  return (
    <article className="rounded-2xl border border-[var(--theme-line)] bg-[var(--theme-surface)] p-4 transition duration-300">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <span
            className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-black transition-colors duration-300 ${sideBadgeClass(
              comment.side,
            )}`}
          >
            {shortSideLabel(comment.side)}
          </span>

          <span className="text-xs font-bold text-[var(--theme-soft)]">
            {comment.author_label ?? "익명 참가자"}
          </span>
        </div>

        <time className="text-xs font-bold text-[var(--theme-soft)]">
          {formatDateTime(comment.created_at)}
        </time>
      </div>

      <p className="mt-3 whitespace-pre-line break-words text-sm leading-7 text-[var(--theme-muted)]">
        {comment.content}
      </p>

        {isMine || canReport ? (
          <div className="mt-4 flex flex-wrap items-center gap-3">
            {isMine ? (
              <form action={deleteDebateComment}>
                <input type="hidden" name="topic_id" value={topicId} />
                <input type="hidden" name="post_id" value={postId} />
                <input type="hidden" name="comment_id" value={comment.id} />
                <ConfirmSubmitButton
                  confirmMessage="내 댓글을 삭제하시겠습니까? 삭제 후에는 공개 댓글 목록에서 제거됩니다."
                  pendingText="삭제 중..."
                  className="border border-[var(--message-error-line)] bg-[var(--message-error-bg)] px-3 py-2 text-xs font-black text-[var(--message-error-text)] transition hover:opacity-80"
                >
                  내 댓글 삭제
                </ConfirmSubmitButton>
              </form>
            ) : null}

            {canReport ? (
              <ReportCommentForm topicId={topicId} commentId={comment.id} />
            ) : null}
          </div>
        ) : null}
    </article>
  );
}

export default async function PostDetailPage({
  params,
  searchParams,
}: PostDetailPageProps) {
  const { topicId, postId } = await params;
  const query = await searchParams;

  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: topic, error: topicError } = await supabase
    .from("topics")
    .select("id, title, description, status")
    .eq("id", topicId)
    .is("deleted_at", null)
    .maybeSingle();

  if (topicError || !topic) {
    notFound();
  }

  let participation: Participation | null = null;

  if (user) {
    const { data } = await supabase
      .from("topic_participants")
      .select("assigned_side, side_index")
      .eq("topic_id", topic.id)
      .eq("user_id", user.id)
      .maybeSingle();

    participation = data;
  }

  const { data: postRows, error: postError } = await supabase.rpc(
    "get_public_debate_post",
    {
      p_post_id: postId,
    },
  );

  const post = Array.isArray(postRows)
    ? ((postRows[0] ?? null) as DebatePost | null)
    : null;

  if (postError || !post || post.topic_id !== topic.id) {
    notFound();
  }

  const { data: comments, error: commentsError } = await supabase.rpc(
    "get_public_debate_comments_by_post",
    {
      p_post_id: post.id,
    },
  );

  let isPostAuthor = false;
  const myCommentIds = new Set<string>();

  if (user) {
    const { data: myPost } = await supabase
      .from("debate_posts")
      .select("id")
      .eq("id", post.id)
      .eq("author_id", user.id)
      .maybeSingle();

    isPostAuthor = Boolean(myPost);

    const { data: myComments } = await supabase
      .from("debate_comments")
      .select("id")
      .eq("post_id", post.id)
      .eq("author_id", user.id)
      .eq("status", "visible");

    for (const comment of myComments ?? []) {
      myCommentIds.add(comment.id);
    }
  }

  const canJoin = topic.status === "open" || topic.status === "active";
  const isParticipant = Boolean(participation?.assigned_side);
  const canWrite = Boolean(user) && isParticipant && canJoin;
  const canReport = Boolean(user);
  const isAthena = post.side === "pro";
  const commentList = (comments ?? []) as DebateComment[];

  return (
    <main
      className="min-h-screen bg-[var(--theme-bg)] px-4 py-10 text-[var(--theme-text)] transition-colors duration-300 sm:px-6 sm:py-14"
      style={{
        backgroundImage:
          "radial-gradient(circle at 12% 0%, var(--page-glow-gold), transparent 28%), radial-gradient(circle at 88% 8%, var(--page-glow-blue), transparent 30%), linear-gradient(90deg, var(--page-grid-line) 1px, transparent 1px)",
        backgroundSize: "auto, auto, 54px 54px",
      }}
    >
      <section className="mx-auto max-w-5xl">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <Link
            href={`/topics/${topic.id}/debate`}
            className="inline-flex items-center text-sm font-bold text-[var(--theme-gold)] transition hover:opacity-80"
          >
            ‹ 발언 목록으로 돌아가기
          </Link>

          {canWrite ? (
            <Link
              href={`/topics/${topic.id}/debate/new`}
              className="inline-flex items-center justify-center border border-[var(--theme-gold)] bg-[var(--theme-gold)] px-4 py-2 text-xs font-black text-[var(--theme-accent-contrast)] shadow-[var(--shadow-button)] transition duration-300 hover:opacity-85"
            >
              새 발언 작성
              <span className="ml-2">›</span>
            </Link>
          ) : user ? (
            <a
              href="#spectator-mode"
              className="inline-flex items-center justify-center border border-[var(--theme-line)] bg-[var(--theme-surface)] px-4 py-2 text-xs font-black text-[var(--theme-muted)] transition hover:bg-[var(--theme-surface-hover)] hover:text-[var(--theme-text)]"
            >
              참여 후 작성 가능
            </a>
          ) : (
            <Link
              href={`/login?message=${encodeURIComponent(
                "로그인 후 진영에 참여할 수 있습니다.",
              )}&redirectTo=${encodeURIComponent(
                `/topics/${topic.id}/debate/${post.id}`,
              )}`}
              className="inline-flex items-center justify-center border border-[var(--theme-line)] bg-[var(--theme-surface)] px-4 py-2 text-xs font-black text-[var(--theme-muted)] transition hover:bg-[var(--theme-surface-hover)] hover:text-[var(--theme-text)]"
            >
              로그인 후 작성
            </Link>
          )}
        </div>

        {query.message ? (
          <div
            className={
              query.type === "success"
                ? "mt-6 rounded-2xl border bg-[var(--message-success-bg)] p-4 text-sm font-bold text-[var(--message-success-text)]"
                : "mt-6 rounded-2xl border bg-[var(--message-error-bg)] p-4 text-sm font-bold text-[var(--message-error-text)]"
            }
            style={{
              borderColor:
                query.type === "success"
                  ? "var(--message-success-line)"
                  : "var(--message-error-line)",
            }}
          >
            {query.message}
          </div>
        ) : null}

        <article className="mt-8 overflow-hidden rounded-[2rem] border border-[var(--theme-line)] bg-[var(--theme-panel)] shadow-[var(--shadow-card-strong)] transition duration-300">
          <div
            className={
              isAthena
                ? "border-b border-[var(--theme-line)] bg-[var(--athena-surface)] p-8 transition-colors duration-300"
                : "border-b border-[var(--theme-line)] bg-[var(--poseidon-surface)] p-8 transition-colors duration-300"
            }
            style={{
              backgroundImage: isAthena
                ? "radial-gradient(circle at 12% 0%, var(--page-glow-gold), transparent 32%)"
                : "radial-gradient(circle at 88% 0%, var(--page-glow-blue), transparent 32%)",
            }}
          >
            <div className="flex flex-wrap items-start justify-between gap-5">
              <div className="flex gap-4">
                {isAthena ? <AthenaIcon /> : <PoseidonIcon />}

                <div>
                  <span
                    className={`inline-flex rounded-full border px-3 py-1 text-xs font-black transition-colors duration-300 ${sideBadgeClass(
                      post.side,
                    )}`}
                  >
                    {sideLabel(post.side)}
                  </span>

                  <p className="mt-5 text-xs font-black uppercase tracking-[0.28em] text-[var(--theme-gold)]">
                    Recorded Argument
                  </p>

                  <h1 className="mt-3 font-serif text-4xl font-black leading-tight text-[var(--theme-text)] md:text-5xl">
                    {post.title}
                  </h1>

                  <p className="mt-3 text-sm font-bold text-[var(--theme-soft)]">
                    {post.author_label ?? "익명 참가자"}
                  </p>
                </div>
              </div>

              <time className="text-xs font-bold text-[var(--theme-soft)]">
                {formatDateTime(post.created_at)}
              </time>
            </div>
          </div>

          <div className="p-6 sm:p-8">
            {post.image_url ? <PostImageViewer src={post.image_url} /> : null}
            <p className="whitespace-pre-line break-words text-base leading-9 text-[var(--theme-muted)]">
              {post.content}
            </p>

            {user ? (
              <div className="mt-8 flex flex-wrap items-center gap-3">
                {isPostAuthor ? (
                  <form action={deleteDebatePost}>
                    <input type="hidden" name="topic_id" value={topic.id} />
                    <input type="hidden" name="post_id" value={post.id} />

                    <ConfirmSubmitButton
                      confirmMessage="내 발언을 삭제하시겠습니까? 첨부 이미지가 있으면 함께 삭제될 수 있습니다."
                      pendingText="삭제 중..."
                      className="border border-[var(--message-error-line)] bg-[var(--message-error-bg)] px-4 py-2 text-xs font-black text-[var(--message-error-text)] transition hover:opacity-80"
                    >
                      내 발언 삭제
                    </ConfirmSubmitButton>
                  </form>
                ) : null}

                {canReport ? (
                  <ReportPostForm topicId={topic.id} postId={post.id} />
                ) : null}
              </div>
            ) : null}
          </div>
        </article>

        {!isParticipant ? (
          <SpectatorPanel
            topicId={topic.id}
            userExists={Boolean(user)}
            canJoin={canJoin}
          />
        ) : null}

        <section className="mt-8 rounded-[2rem] border border-[var(--theme-line)] bg-[var(--theme-panel)] p-6 shadow-[var(--shadow-card)] transition duration-300 sm:p-8">
          <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.28em] text-[var(--theme-gold)]">
                Replies
              </p>
              <h2 className="mt-3 font-serif text-3xl font-black text-[var(--theme-text)]">
                반론과 댓글
              </h2>
              <p className="mt-2 text-sm leading-7 text-[var(--theme-muted)]">
                참여하지 않아도 댓글은 읽을 수 있습니다. 작성은 진영 참여 후
                가능합니다.
              </p>
            </div>

            <span className="w-fit rounded-full border border-[var(--theme-line)] bg-[var(--theme-surface)] px-3 py-1 text-sm font-black text-[var(--theme-muted)]">
              {commentList.length}개
            </span>
          </div>

          {commentsError ? (
            <div
              className="mt-6 rounded-2xl border bg-[var(--message-error-bg)] p-4 text-sm text-[var(--message-error-text)]"
              style={{ borderColor: "var(--message-error-line)" }}
            >
              댓글을 불러오지 못했습니다: {commentsError.message}
            </div>
          ) : null}

          <div className="mt-6 space-y-3">
            {commentList.length ? (
              commentList.map((comment) => (
                <CommentCard
                  key={comment.id}
                  comment={comment}
                  topicId={topic.id}
                  postId={post.id}
                  isMine={myCommentIds.has(comment.id)}
                  canReport={canReport}
                />
              ))
            ) : (
              <div className="rounded-2xl border border-[var(--theme-line)] bg-[var(--theme-surface)] p-8 text-center">
                <p className="text-sm text-[var(--theme-muted)]">
                  아직 댓글이 없습니다.
                </p>
              </div>
            )}
          </div>

          {canWrite ? (
            <form action={createDebateComment} className="mt-6 space-y-3">
              <input type="hidden" name="topic_id" value={topic.id} />
              <input type="hidden" name="post_id" value={post.id} />

              <textarea
                name="content"
                required
                minLength={2}
                rows={4}
                className="w-full rounded-xl border border-[var(--theme-line)] bg-[var(--theme-surface)] px-4 py-3 text-sm text-[var(--theme-text)] outline-none transition placeholder:text-[var(--theme-soft)] focus:border-[var(--theme-gold)]"
                placeholder="반론 또는 댓글을 입력하세요."
              />

              <PendingSubmitButton
                pendingText="댓글 작성 중..."
                className="w-full border border-[var(--theme-gold)] bg-[var(--theme-gold)] px-5 py-3 text-sm font-black text-[var(--theme-accent-contrast)] shadow-[var(--shadow-button)] transition duration-300 hover:opacity-85"
              >
                댓글 등록
              </PendingSubmitButton>
            </form>
          ) : user ? (
            <div className="mt-6 rounded-2xl border border-[var(--theme-line)] bg-[var(--theme-surface)] p-5 text-sm leading-7 text-[var(--theme-muted)]">
              {canJoin
                ? "현재 관전 중입니다. 댓글을 남기려면 위에서 진영을 선택해 참여하세요."
                : writeDisabledMessage(topic.status)}
            </div>
          ) : (
            <div className="mt-6 rounded-2xl border border-[var(--theme-line)] bg-[var(--theme-surface)] p-5 text-sm leading-7 text-[var(--theme-muted)]">
              댓글을 남기려면 로그인 후 진영에 참여해야 합니다.
              <div className="mt-4">
                <Link
                  href={`/login?message=${encodeURIComponent(
                    "로그인 후 진영에 참여할 수 있습니다.",
                  )}&redirectTo=${encodeURIComponent(
                    `/topics/${topic.id}/debate/${post.id}`,
                  )}`}
                  className="inline-flex items-center justify-center border border-[var(--theme-gold)] bg-[var(--theme-gold)] px-4 py-2 text-xs font-black text-[var(--theme-accent-contrast)] shadow-[var(--shadow-button)] transition duration-300 hover:opacity-85"
                >
                  로그인 후 참여
                  <span className="ml-2">›</span>
                </Link>
              </div>
            </div>
          )}
        </section>
      </section>
    </main>
  );
}
