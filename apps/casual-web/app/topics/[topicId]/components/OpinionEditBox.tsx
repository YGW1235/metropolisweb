import { deleteOpinion, updateOpinion } from "@/app/topics/actions";

import type { Opinion } from "./types";

export function OpinionEditBox({
  opinion,
  topicId,
}: {
  opinion: Opinion;
  topicId: string;
}) {
  return (
    <details className="mt-4 rounded-2xl bg-white/70 p-3">
      <summary className="cursor-pointer text-xs font-black text-stone-500">
        내 의견 수정/삭제
      </summary>

      <form action={updateOpinion} className="mt-3">
        <input type="hidden" name="topicId" value={topicId} />
        <input type="hidden" name="opinionId" value={opinion.id} />

        <div className="mb-3 rounded-2xl bg-yellow-50 p-3 text-xs font-bold leading-5 text-yellow-800">
          의견을 수정하면 기존 공감/비공감이 모두 초기화됩니다. 수정 전 받은
          반응은 새 내용에 그대로 유지되지 않습니다.
        </div>

        <textarea
          name="body"
          required
          maxLength={500}
          defaultValue={opinion.body}
          className="min-h-24 w-full resize-none rounded-2xl border border-stone-200 bg-white px-3 py-3 text-sm leading-6 outline-none focus:border-orange-400"
        />

        <label className="mt-3 flex items-start gap-2 rounded-2xl bg-white p-3 text-xs font-bold leading-5 text-stone-600">
          <input
            name="confirmReset"
            type="checkbox"
            required
            className="mt-0.5 h-4 w-4"
          />
          <span>
            의견 수정 시 기존 공감/비공감이 초기화되는 것을 이해했습니다.
          </span>
        </label>

        <div className="mt-2 flex flex-wrap justify-end gap-2">
          <button className="rounded-full bg-stone-950 px-4 py-2 text-xs font-black text-white transition hover:-translate-y-0.5">
            수정 저장
          </button>
        </div>
      </form>

      <form action={deleteOpinion} className="mt-2 flex justify-end">
        <input type="hidden" name="topicId" value={topicId} />
        <input type="hidden" name="opinionId" value={opinion.id} />
        <button className="rounded-full bg-red-50 px-4 py-2 text-xs font-black text-red-700 transition hover:bg-red-100">
          의견 삭제
        </button>
      </form>
    </details>
  );
}
