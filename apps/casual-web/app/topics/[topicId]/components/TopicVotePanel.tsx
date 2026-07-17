import Link from "next/link";

import { toggleTopicBookmark, voteTopic } from "@/app/topics/actions";
import { SubmitButton } from "@/components/SubmitButton";
import { TopicTagBadges } from "@/components/TopicTagBadges";
import type { TopicTag } from "@/lib/casual-tags";

import type { CurrentVote, TopicDetail } from "./types";

function getPercent(value: number, total: number) {
  if (total <= 0) return 0;
  return Math.round((value / total) * 100);
}

function VoteButton({
  choice,
  currentVote,
  label,
  topicId,
}: {
  choice: "a" | "b";
  currentVote: CurrentVote;
  label: string;
  topicId: string;
}) {
  const isSelected = currentVote?.choice === choice;
  const selectedClass =
    choice === "a"
      ? "bg-orange-500 text-white shadow-lg shadow-orange-200"
      : "bg-stone-950 text-white shadow-lg shadow-stone-300";
  const defaultClass =
    choice === "a"
      ? "bg-orange-100 text-orange-950 hover:bg-orange-200"
      : "bg-stone-100 text-stone-950 hover:bg-stone-200";

  return (
    <form action={voteTopic}>
      <input type="hidden" name="topicId" value={topicId} />
      <input type="hidden" name="choice" value={choice} />
      <SubmitButton
        className={`w-full rounded-3xl px-4 py-5 text-left transition hover:-translate-y-0.5 sm:px-6 sm:py-6 ${
          isSelected ? selectedClass : defaultClass
        }`}
        pendingText="투표 중..."
      >
        <span className="block text-sm font-black opacity-80">
          {choice.toUpperCase()}
        </span>
        <span className="mt-1 block break-words text-xl font-black leading-tight sm:text-2xl">
          {label}
        </span>
        {isSelected && (
          <span className="mt-2 block text-sm font-bold">
            내가 선택한 입장
          </span>
        )}
      </SubmitButton>
    </form>
  );
}

export function TopicVotePanel({
  currentVote,
  isBookmarked,
  isLoggedIn,
  tags,
  topic,
}: {
  currentVote: CurrentVote;
  isBookmarked: boolean;
  isLoggedIn: boolean;
  tags: TopicTag[];
  topic: TopicDetail;
}) {
  const totalVotes = topic.vote_a_count + topic.vote_b_count;
  const aPercent = getPercent(topic.vote_a_count, totalVotes);
  const bPercent = getPercent(topic.vote_b_count, totalVotes);
  const hasVoted = Boolean(currentVote);

  return (
    <article className="mt-5 rounded-[1.5rem] border border-orange-100 bg-white p-4 shadow-sm sm:mt-8 sm:rounded-[2rem] sm:p-6">
      <div className="flex flex-wrap items-center gap-2">
        {topic.is_today && (
          <span className="rounded-full bg-orange-100 px-3 py-1 text-xs font-black text-orange-800">
            오늘의 논쟁
          </span>
        )}
        <span className="rounded-full bg-stone-100 px-3 py-1 text-xs font-black text-stone-600">
          조회 {topic.view_count}
        </span>
        <span className="rounded-full bg-stone-100 px-3 py-1 text-xs font-black text-stone-600">
          투표 {totalVotes}
        </span>
      </div>

      <div className="mt-5 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <h1 className="break-words text-3xl font-black leading-tight sm:text-4xl">
          {topic.title}
        </h1>

        <form action={toggleTopicBookmark} className="shrink-0">
          <input type="hidden" name="topicId" value={topic.id} />
          <SubmitButton
            className={`w-full rounded-full px-5 py-3 text-sm font-black transition hover:-translate-y-0.5 sm:w-auto ${
              isBookmarked
                ? "bg-orange-500 text-white shadow-lg shadow-orange-100"
                : "border border-orange-200 bg-orange-50 text-orange-800 hover:bg-orange-100"
            }`}
            pendingText="저장 중..."
          >
            {isBookmarked ? "저장됨" : "주제 저장"}
          </SubmitButton>
        </form>
      </div>

      <p className="mt-4 break-words text-base leading-7 text-stone-700 sm:text-lg sm:leading-8">
        {topic.description}
      </p>

      <TopicTagBadges className="mt-4" linked tags={tags} />

      <div className="mt-4">
        <Link
          href={`/report?targetType=topic&targetId=${
            topic.id
          }&returnTo=${encodeURIComponent(`/topics/${topic.id}`)}`}
          className="text-xs font-bold text-stone-500 underline underline-offset-4 hover:text-red-600"
        >
          이 주제 신고
        </Link>
      </div>

      <div className="mt-8 grid gap-3 md:grid-cols-2">
        <VoteButton
          choice="a"
          currentVote={currentVote}
          label={topic.option_a}
          topicId={topic.id}
        />
        <VoteButton
          choice="b"
          currentVote={currentVote}
          label={topic.option_b}
          topicId={topic.id}
        />
      </div>

      {!isLoggedIn && (
        <div className="mt-5 rounded-2xl bg-stone-50 p-4 text-sm font-bold text-stone-600">
          투표하려면 로그인이 필요합니다.{" "}
          <Link href="/login" className="text-orange-700 underline">
            로그인하기
          </Link>
        </div>
      )}

      {hasVoted ? (
        <section className="mt-8 rounded-3xl bg-orange-50 p-4 sm:p-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-xl font-black">투표 결과</h2>
            <p className="text-sm font-bold text-stone-600">
              총 {totalVotes}명 참여
            </p>
          </div>

          <div className="mt-5 space-y-4">
            <div>
              <div className="flex gap-3 text-sm font-black text-stone-700">
                <span className="min-w-0 flex-1 break-words">{topic.option_a}</span>
                <span className="shrink-0">
                  {aPercent}% · {topic.vote_a_count}표
                </span>
              </div>
              <div className="mt-2 h-4 overflow-hidden rounded-full bg-white">
                <div
                  className="h-full rounded-full bg-orange-500"
                  style={{ width: `${aPercent}%` }}
                />
              </div>
            </div>

            <div>
              <div className="flex gap-3 text-sm font-black text-stone-700">
                <span className="min-w-0 flex-1 break-words">{topic.option_b}</span>
                <span className="shrink-0">
                  {bPercent}% · {topic.vote_b_count}표
                </span>
              </div>
              <div className="mt-2 h-4 overflow-hidden rounded-full bg-white">
                <div
                  className="h-full rounded-full bg-stone-950"
                  style={{ width: `${bPercent}%` }}
                />
              </div>
            </div>
          </div>
        </section>
      ) : (
        <section className="mt-8 rounded-3xl bg-stone-50 p-4 text-center sm:p-5">
          <h2 className="text-xl font-black">먼저 선택해보세요</h2>
          <p className="mt-2 text-sm leading-6 text-stone-600">
            투표 후 다른 사람들의 선택 비율을 볼 수 있습니다.
          </p>
        </section>
      )}
    </article>
  );
}
