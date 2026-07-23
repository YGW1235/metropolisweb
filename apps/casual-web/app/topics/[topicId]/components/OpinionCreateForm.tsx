"use client";

import { type FormEvent, useState } from "react";

import { createOpinion } from "@/app/topics/actions";
import { SubmitButton } from "@/components/SubmitButton";
import {
  CASUAL_OPINION_BODY_MAX_LENGTH,
  CASUAL_OPINION_BODY_MAX_LENGTH_LABEL,
  CASUAL_OPINION_IMAGE_TOTAL_UPLOAD_LIMIT_BYTES,
  CASUAL_OPINION_IMAGE_TOTAL_UPLOAD_LIMIT_LABEL,
} from "@/lib/casual-opinion-constraints";

import type { CurrentVote, TopicDetail } from "./types";

function getSelectedImageFiles(form: HTMLFormElement) {
  const imageInput = form.elements.namedItem("images");

  if (!(imageInput instanceof HTMLInputElement) || !imageInput.files) {
    return [];
  }

  return Array.from(imageInput.files);
}

export function OpinionCreateForm({
  currentVote,
  topic,
}: {
  currentVote: NonNullable<CurrentVote>;
  topic: TopicDetail;
}) {
  const [clientError, setClientError] = useState<string | null>(null);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    const imageFiles = getSelectedImageFiles(event.currentTarget);
    const totalImageSize = imageFiles.reduce((sum, file) => sum + file.size, 0);

    if (totalImageSize > CASUAL_OPINION_IMAGE_TOTAL_UPLOAD_LIMIT_BYTES) {
      event.preventDefault();
      setClientError(
        `현재 서버 전송 방식에서는 이미지 합계가 ${CASUAL_OPINION_IMAGE_TOTAL_UPLOAD_LIMIT_LABEL} 이하일 때만 제출할 수 있습니다. 이미지를 줄이거나 용량을 낮춰주세요.`,
      );
      return;
    }

    setClientError(null);
  }

  return (
    <form action={createOpinion} className="mt-4" onSubmit={handleSubmit}>
      <input type="hidden" name="topicId" value={topic.id} />

      <div>
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <p className="min-w-0 break-words text-sm font-black text-stone-700">
            {currentVote.choice === "a"
              ? `"${topic.option_a}" 입장으로 의견 작성`
              : `"${topic.option_b}" 입장으로 의견 작성`}
          </p>
          <p className="text-xs font-bold text-stone-500">
            최대 {CASUAL_OPINION_BODY_MAX_LENGTH_LABEL}자
          </p>
        </div>

        <textarea
          name="body"
          required
          maxLength={CASUAL_OPINION_BODY_MAX_LENGTH}
          className="min-h-28 w-full resize-none rounded-2xl border border-orange-100 bg-white px-4 py-3 text-sm leading-6 outline-none focus:border-orange-400"
          placeholder="내 선택의 이유를 짧게 남겨보세요."
        />

        <label className="mt-3 block rounded-2xl border border-dashed border-orange-200 bg-white px-4 py-3 text-sm font-bold text-stone-600">
          이미지 첨부
          <span className="mt-1 block text-xs font-semibold text-stone-400 sm:ml-2 sm:mt-0 sm:inline">
            JPEG/PNG/WEBP/GIF, 최대 3장. 현재 서버 전송 방식에서는 이미지
            합계 {CASUAL_OPINION_IMAGE_TOTAL_UPLOAD_LIMIT_LABEL} 이하 권장
          </span>
          <input
            type="file"
            name="images"
            accept="image/jpeg,image/png,image/webp,image/gif"
            multiple
            className="mt-3 block w-full text-xs font-bold text-stone-500 file:mr-3 file:rounded-full file:border-0 file:bg-orange-100 file:px-4 file:py-2 file:text-xs file:font-black file:text-orange-800"
          />
        </label>

        <p className="mt-2 rounded-2xl bg-stone-50 px-4 py-3 text-xs font-bold leading-5 text-stone-500">
          이미지 없는 의견은 그대로 작성할 수 있습니다. 이미지 첨부 시에는
          Server Action 요청 한도 때문에 본문과 파일을 포함한 전체 전송 용량을
          작게 유지해야 합니다.
        </p>

        {clientError && (
          <p className="mt-2 rounded-2xl bg-red-50 px-4 py-3 text-xs font-bold leading-5 text-red-700">
            {clientError}
          </p>
        )}

        <div className="mt-3 flex justify-end">
          <SubmitButton
            className="rounded-full bg-stone-950 px-5 py-3 text-sm font-black text-white transition hover:-translate-y-0.5"
            pendingText="의견 등록 중..."
          >
            의견 남기기
          </SubmitButton>
        </div>
      </div>
    </form>
  );
}
