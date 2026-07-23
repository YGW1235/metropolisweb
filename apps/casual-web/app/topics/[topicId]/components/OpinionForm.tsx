import Link from "next/link";

import {
  CASUAL_OPINION_BODY_MAX_LENGTH_LABEL,
} from "@/lib/casual-opinion-constraints";

import { OpinionCreateForm } from "./OpinionCreateForm";
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
          최대 {CASUAL_OPINION_BODY_MAX_LENGTH_LABEL}자까지 작성할 수 있고,
          이미지 3장까지 첨부할 수 있습니다. 현재 서버 전송 방식에서는 이미지
          전체 용량 제한이 있습니다.
        </p>

        <OpinionCreateForm currentVote={currentVote} topic={topic} />
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
