import { deleteOpinion, updateOpinion } from "@/app/topics/actions";
import { SubmitButton } from "@/components/SubmitButton";
import {
  CASUAL_OPINION_BODY_MAX_LENGTH,
  CASUAL_OPINION_BODY_MAX_LENGTH_LABEL,
} from "@/lib/casual-opinion-constraints";

import type { Opinion } from "./types";

export function OpinionEditBox({
  opinion,
  topicId,
}: {
  opinion: Opinion;
  topicId: string;
}) {
  return (
    <details className="mt-3 rounded-2xl border border-white/80 bg-white/60 p-3">
      <summary className="cursor-pointer text-xs font-black text-stone-500">
        더보기 · 내 의견 수정/삭제
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
          maxLength={CASUAL_OPINION_BODY_MAX_LENGTH}
          defaultValue={opinion.body}
          className="min-h-24 w-full resize-none rounded-2xl border border-stone-200 bg-white px-3 py-3 text-sm leading-6 outline-none focus:border-orange-400"
        />
        <p className="mt-2 text-xs font-bold text-stone-500">
          최대 {CASUAL_OPINION_BODY_MAX_LENGTH_LABEL}자까지 작성할 수
          있습니다.
        </p>

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
          <SubmitButton
            className="rounded-full bg-stone-950 px-4 py-2 text-xs font-black text-white transition hover:-translate-y-0.5"
            pendingText="저장 중..."
          >
            수정 저장
          </SubmitButton>
        </div>
      </form>

      <form action={deleteOpinion} className="mt-2 flex justify-end">
        <input type="hidden" name="topicId" value={topicId} />
        <input type="hidden" name="opinionId" value={opinion.id} />
        <SubmitButton
          className="rounded-full bg-red-50 px-4 py-2 text-xs font-black text-red-700 transition hover:bg-red-100"
          pendingText="삭제 중..."
        >
          의견 삭제
        </SubmitButton>
      </form>
    </details>
  );
}
