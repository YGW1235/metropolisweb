import { createComment } from "@/app/topics/actions";

export function CommentForm({
  isLoggedIn,
  opinionId,
  topicId,
}: {
  isLoggedIn: boolean;
  opinionId: string;
  topicId: string;
}) {
  if (!isLoggedIn) {
    return (
      <div className="mt-3 rounded-2xl bg-stone-50 p-3 text-center text-xs font-bold text-stone-500">
        댓글을 작성하려면 로그인이 필요합니다.
      </div>
    );
  }

  return (
    <details className="mt-3 rounded-2xl border border-stone-100 bg-white p-3">
      <summary className="cursor-pointer list-none text-xs font-black text-stone-600 marker:hidden">
        댓글 작성하기
      </summary>

      <form action={createComment} className="mt-3">
        <input type="hidden" name="topicId" value={topicId} />
        <input type="hidden" name="opinionId" value={opinionId} />

        <textarea
          name="body"
          required
          maxLength={300}
          className="min-h-20 w-full resize-none rounded-2xl border border-stone-200 bg-white px-3 py-3 text-sm leading-6 outline-none focus:border-orange-400"
          placeholder="짧은 댓글을 남겨보세요. 최대 300자"
        />

        <div className="mt-2 flex justify-end">
          <button className="rounded-full bg-stone-900 px-4 py-2 text-xs font-black text-white transition hover:-translate-y-0.5">
            댓글 작성
          </button>
        </div>
      </form>
    </details>
  );
}
