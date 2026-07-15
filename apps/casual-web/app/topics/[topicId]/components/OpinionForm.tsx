import Link from "next/link";

import { createOpinion } from "@/app/topics/actions";

import type { CurrentVote, TopicDetail } from "./types";

export function OpinionForm({
  currentVote,
  isLoggedIn,
  topic,
}: {
  currentVote: CurrentVote;
  isLoggedIn: boolean;
  topic: TopicDetail;
}) {
  if (isLoggedIn && currentVote) {
    return (
      <details className="mx-auto mt-5 max-w-5xl rounded-[1.35rem] bg-orange-50 p-4 sm:rounded-3xl">
        <summary className="inline-flex cursor-pointer list-none items-center gap-2 rounded-full bg-stone-950 px-4 py-2 text-sm font-black text-white transition hover:-translate-y-0.5 marker:hidden">
          <span className="flex h-6 w-6 items-center justify-center rounded-full bg-orange-500 text-base leading-none">
            +
          </span>
          <span>의견 작성</span>
        </summary>

        <p className="mt-3 text-xs font-bold text-stone-500">
          최대 500자, 이미지 3장까지 첨부할 수 있습니다.
        </p>

        <form action={createOpinion} className="mt-4">
          <input type="hidden" name="topicId" value={topic.id} />

          <div>
            <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
              <p className="min-w-0 break-words text-sm font-black text-stone-700">
                {currentVote.choice === "a"
                  ? `"${topic.option_a}" 입장으로 의견 작성`
                  : `"${topic.option_b}" 입장으로 의견 작성`}
              </p>
              <p className="text-xs font-bold text-stone-500">최대 500자</p>
            </div>

            <textarea
              name="body"
              required
              maxLength={500}
              className="min-h-28 w-full resize-none rounded-2xl border border-orange-100 bg-white px-4 py-3 text-sm leading-6 outline-none focus:border-orange-400"
              placeholder="내 선택의 이유를 짧게 남겨보세요."
            />

            <label className="mt-3 block rounded-2xl border border-dashed border-orange-200 bg-white px-4 py-3 text-sm font-bold text-stone-600">
              이미지 첨부
              <span className="mt-1 block text-xs font-semibold text-stone-400 sm:ml-2 sm:mt-0 sm:inline">
                JPEG/PNG/WEBP/GIF, 최대 3장, 파일당 5MB
              </span>
              <input
                type="file"
                name="images"
                accept="image/jpeg,image/png,image/webp,image/gif"
                multiple
                className="mt-3 block w-full text-xs font-bold text-stone-500 file:mr-3 file:rounded-full file:border-0 file:bg-orange-100 file:px-4 file:py-2 file:text-xs file:font-black file:text-orange-800"
              />
            </label>

            <div className="mt-3 flex justify-end">
              <button className="rounded-full bg-stone-950 px-5 py-3 text-sm font-black text-white transition hover:-translate-y-0.5">
                의견 남기기
              </button>
            </div>
          </div>
        </form>
      </details>
    );
  }

  if (isLoggedIn) {
    return (
      <div className="mx-auto mt-5 max-w-5xl rounded-3xl bg-stone-50 p-4 text-center sm:p-5">
        <h3 className="text-lg font-black">먼저 투표해주세요</h3>
        <p className="mt-2 text-sm text-stone-600">
          A/B 중 하나를 선택한 뒤 의견을 작성할 수 있습니다.
        </p>
      </div>
    );
  }

  return (
    <div className="mx-auto mt-5 max-w-5xl rounded-3xl bg-stone-50 p-4 text-center sm:p-5">
      <h3 className="text-lg font-black">로그인이 필요합니다</h3>
      <p className="mt-2 text-sm text-stone-600">
        로그인하면 투표와 의견 작성, 공감/비공감에 참여할 수 있습니다.
      </p>
      <Link
        href="/login"
        className="mt-4 inline-flex rounded-full bg-stone-950 px-5 py-3 text-sm font-black text-white"
      >
        로그인하기
      </Link>
    </div>
  );
}
