import { archiveTopicAsDeleted } from "@/app/admin/topics/actions";
import { SubmitButton } from "@/components/SubmitButton";

export function ArchiveTopicControl({
  returnPath,
  status,
  topicId,
  topicTitle,
}: {
  returnPath: string;
  status: string;
  topicId: string;
  topicTitle: string;
}) {
  if (status === "archived") {
    return (
      <span className="inline-flex rounded-full bg-red-50 px-4 py-2 text-sm font-black text-red-700">
        이미 삭제됨
      </span>
    );
  }

  return (
    <details className="min-w-0 max-w-full rounded-2xl border border-red-100 bg-red-50/70 p-2">
      <summary className="inline-flex cursor-pointer list-none rounded-full bg-red-100 px-4 py-2 text-sm font-black text-red-700 transition hover:bg-red-200 [&::-webkit-details-marker]:hidden">
        삭제
      </summary>

      <div className="mt-3 max-w-md rounded-2xl border border-red-100 bg-white p-4 text-sm text-stone-700 shadow-sm">
        <p className="font-black text-red-800">이 주제를 삭제 처리할까요?</p>
        <p className="mt-2 whitespace-pre-wrap leading-6">
          삭제 처리하면 공개 페이지와 주제 목록에서 보이지 않습니다. 의견과
          댓글 데이터는 보존됩니다. 이 작업은 관리자용 보관 처리입니다.
        </p>
        <p className="mt-3 break-words text-xs font-bold text-stone-500 [overflow-wrap:anywhere]">
          대상: {topicTitle}
        </p>

        <form action={archiveTopicAsDeleted} className="mt-4 grid gap-3">
          <input type="hidden" name="topicId" value={topicId} />
          <input type="hidden" name="returnPath" value={returnPath} />

          <label className="text-xs font-black text-stone-600">
            확인 문구
            <input
              name="confirmText"
              pattern="삭제"
              placeholder="삭제"
              required
              className="mt-2 w-full rounded-2xl border border-red-100 px-3 py-2 text-sm outline-none focus:border-red-300"
            />
          </label>

          <SubmitButton
            className="rounded-full bg-red-600 px-4 py-2 text-sm font-black text-white transition hover:bg-red-700"
            pendingText="삭제 처리 중..."
          >
            삭제 처리
          </SubmitButton>
        </form>
      </div>
    </details>
  );
}
