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
      <form action={createOpinion} className="mt-6">
        <input type="hidden" name="topicId" value={topic.id} />

        <div className="rounded-3xl bg-orange-50 p-4">
          <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
            <p className="text-sm font-black text-stone-700">
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

          <div className="mt-3 flex justify-end">
            <button className="rounded-full bg-stone-950 px-5 py-3 text-sm font-black text-white transition hover:-translate-y-0.5">
              의견 남기기
            </button>
          </div>
        </div>
      </form>
    );
  }

  if (isLoggedIn) {
    return (
      <div className="mt-6 rounded-3xl bg-stone-50 p-5 text-center">
        <h3 className="text-lg font-black">먼저 투표해주세요</h3>
        <p className="mt-2 text-sm text-stone-600">
          A/B 중 하나를 선택한 뒤 의견을 작성할 수 있습니다.
        </p>
      </div>
    );
  }

  return (
    <div className="mt-6 rounded-3xl bg-stone-50 p-5 text-center">
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
