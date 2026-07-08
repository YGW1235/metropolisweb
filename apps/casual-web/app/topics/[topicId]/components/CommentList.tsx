import Link from "next/link";

import { deleteComment, updateComment } from "@/app/topics/actions";

import { CommentForm } from "./CommentForm";
import type { Comment, PublicProfile } from "./types";

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
  return (
    <div className="rounded-2xl bg-stone-50 px-3 py-3">
      <div className="flex flex-wrap items-center gap-2">
        {commentProfile?.nickname ? (
          <Link
            href={`/users/${encodeURIComponent(commentProfile.nickname)}`}
            className="text-xs font-black text-stone-700 hover:text-orange-700"
          >
            {commentProfile.nickname}
          </Link>
        ) : (
          <p className="text-xs font-black text-stone-700">알 수 없음</p>
        )}

        <span className="text-xs text-stone-300">·</span>

        <Link
          href={`/report?targetType=comment&targetId=${
            comment.id
          }&returnTo=${encodeURIComponent(`/topics/${topicId}`)}`}
          className="text-xs font-bold text-stone-400 underline underline-offset-4 hover:text-red-600"
        >
          신고
        </Link>
      </div>

      <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-stone-700">
        {comment.body}
      </p>

      {currentUserId === comment.user_id && (
        <details className="mt-3 rounded-2xl bg-white p-3">
          <summary className="cursor-pointer text-xs font-black text-stone-500">
            내 댓글 수정/삭제
          </summary>

          <form action={updateComment} className="mt-3">
            <input type="hidden" name="topicId" value={topicId} />
            <input type="hidden" name="commentId" value={comment.id} />

            <textarea
              name="body"
              required
              maxLength={300}
              defaultValue={comment.body}
              className="min-h-20 w-full resize-none rounded-2xl border border-stone-200 bg-white px-3 py-3 text-sm leading-6 outline-none focus:border-orange-400"
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
        </details>
      )}
    </div>
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
  return (
    <div className="mt-4 rounded-2xl bg-white/70 p-3">
      <div className="mb-3 flex items-center justify-between gap-2">
        <p className="text-xs font-black text-stone-600">
          댓글 {comments.length}개
        </p>
      </div>

      <div className="space-y-2">
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

      <CommentForm
        isLoggedIn={isLoggedIn}
        opinionId={opinionId}
        topicId={topicId}
      />
    </div>
  );
}
