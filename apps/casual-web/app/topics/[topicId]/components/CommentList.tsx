import Link from "next/link";

import { deleteComment, updateComment } from "@/app/topics/actions";

import { CommentForm } from "./CommentForm";
import type { Comment, PublicProfile } from "./types";

function formatRelativeTime(value: string) {
  const createdAt = new Date(value);
  const createdAtTime = createdAt.getTime();

  if (Number.isNaN(createdAtTime)) {
    return "";
  }

  const diff = Math.max(0, Date.now() - createdAtTime);
  const minute = 60_000;
  const hour = minute * 60;
  const day = hour * 24;

  if (diff < minute) {
    return "방금 전";
  }

  if (diff < hour) {
    return `${Math.floor(diff / minute)}분 전`;
  }

  if (diff < day) {
    return `${Math.floor(diff / hour)}시간 전`;
  }

  if (diff < day * 7) {
    return `${Math.floor(diff / day)}일 전`;
  }

  return createdAt.toLocaleDateString("ko-KR", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function CommentItem({
  comment,
  commentProfile,
  currentUserId,
  topicId,
}: {
  comment: Comment;
  commentProfile?: PublicProfile;
  currentUserId?: string;
  topicId: string;
}) {
  const displayName = commentProfile?.nickname ?? "익명";
  const relativeTime = formatRelativeTime(comment.created_at);

  return (
    <article className="border-b border-stone-100 py-3 last:border-b-0">
      <div className="flex min-w-0 gap-2.5">
        {commentProfile?.avatar_url ? (
          <img
            src={commentProfile.avatar_url}
            alt={`${displayName} 프로필`}
            className="h-8 w-8 shrink-0 rounded-full object-cover"
          />
        ) : (
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-stone-200 text-xs font-black text-stone-700">
            {displayName.slice(0, 1)}
          </div>
        )}

        <div className="min-w-0 flex-1">
          <div className="flex min-w-0 flex-wrap items-center gap-x-2 gap-y-1">
            {commentProfile?.nickname ? (
              <Link
                href={`/users/${encodeURIComponent(commentProfile.nickname)}`}
                className="truncate text-xs font-black text-stone-800 hover:text-orange-700"
              >
                {commentProfile.nickname}
              </Link>
            ) : (
              <p className="text-xs font-black text-stone-800">알 수 없음</p>
            )}

            {relativeTime && (
              <time
                dateTime={comment.created_at}
                className="text-xs font-bold text-stone-400"
              >
                {relativeTime}
              </time>
            )}
          </div>

          <p className="mt-1 whitespace-pre-wrap text-[13px] leading-6 text-stone-700">
            {comment.body}
          </p>

          <div className="mt-2 flex flex-wrap items-start gap-3">
            <Link
              href={`/report?targetType=comment&targetId=${
                comment.id
              }&returnTo=${encodeURIComponent(`/topics/${topicId}`)}`}
              className="text-xs font-bold text-stone-400 underline underline-offset-4 hover:text-red-600"
            >
              댓글 신고
            </Link>

            {currentUserId === comment.user_id && (
              <details className="w-full sm:w-auto">
                <summary className="inline-flex cursor-pointer list-none text-xs font-black text-stone-500 hover:text-orange-700 marker:hidden">
                  내 댓글 수정/삭제
                </summary>

                <div className="mt-2 max-w-full rounded-2xl border border-stone-100 bg-white/80 p-3">
                  <form action={updateComment}>
                    <input type="hidden" name="topicId" value={topicId} />
                    <input type="hidden" name="commentId" value={comment.id} />

                    <textarea
                      name="body"
                      required
                      maxLength={300}
                      defaultValue={comment.body}
                      className="min-h-20 w-full resize-none rounded-2xl border border-stone-200 bg-white px-3 py-3 text-sm leading-6 outline-none focus:border-orange-400 sm:min-w-80"
                    />

                    <div className="mt-2 flex justify-end">
                      <button className="rounded-full bg-stone-950 px-4 py-2 text-xs font-black text-white transition hover:-translate-y-0.5">
                        수정 저장
                      </button>
                    </div>
                  </form>

                  <form action={deleteComment} className="mt-2 flex justify-end">
                    <input type="hidden" name="topicId" value={topicId} />
                    <input type="hidden" name="commentId" value={comment.id} />

                    <button className="rounded-full bg-red-50 px-4 py-2 text-xs font-black text-red-700 transition hover:bg-red-100">
                      댓글 삭제
                    </button>
                  </form>
                </div>
              </details>
            )}
          </div>
        </div>
      </div>
    </article>
  );
}

export function CommentList({
  comments,
  currentUserId,
  isLoggedIn,
  opinionId,
  profileByUserId,
  topicId,
}: {
  comments: Comment[];
  currentUserId?: string;
  isLoggedIn: boolean;
  opinionId: string;
  profileByUserId: Map<string, PublicProfile>;
  topicId: string;
}) {
  const summaryText =
    comments.length === 0 ? "댓글 쓰기" : `댓글보기 ${comments.length}`;

  return (
    <div className="contents">
      <details className="group contents">
        <summary className="inline-flex cursor-pointer list-none items-center gap-1 rounded-full bg-white px-3 py-2 text-xs font-black text-stone-700 transition hover:bg-orange-100 hover:text-orange-800 marker:hidden group-open:bg-orange-100 group-open:text-orange-800">
          <svg
            aria-hidden="true"
            viewBox="0 0 24 24"
            className="h-3.5 w-3.5"
            fill="none"
            stroke="currentColor"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2.4"
          >
            <path d="M21 12a8 8 0 0 1-8 8H6l-3 3v-7a8 8 0 1 1 18-4Z" />
          </svg>
          {summaryText}
        </summary>

        <div className="order-last mt-3 w-full basis-full pl-1 sm:pl-2">
          <div className="min-w-0 border-l-2 border-orange-100 pl-2 sm:pl-3">
            {comments.length > 0 && (
              <div>
                {comments.map((comment) => (
                  <CommentItem
                    key={comment.id}
                    comment={comment}
                    commentProfile={profileByUserId.get(comment.user_id)}
                    currentUserId={currentUserId}
                    topicId={topicId}
                  />
                ))}
              </div>
            )}

            {comments.length === 0 && (
              <p className="rounded-2xl bg-orange-50/60 px-3 py-3 text-xs font-bold text-stone-500">
                첫 댓글을 남겨보세요.
              </p>
            )}

            <CommentForm
              isLoggedIn={isLoggedIn}
              opinionId={opinionId}
              topicId={topicId}
            />
          </div>
        </div>
      </details>
    </div>
  );
}
