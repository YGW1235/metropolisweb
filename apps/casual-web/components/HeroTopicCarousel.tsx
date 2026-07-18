"use client";

import Link from "next/link";
import { useState } from "react";

import type { TopicTag } from "@/lib/casual-tags";

export type HeroTopicCarouselTopic = {
  id: string;
  title: string;
  description: string | null;
  option_a: string;
  option_b: string;
  vote_a_count: number | null;
  vote_b_count: number | null;
  opinion_count: number | null;
  comment_count: number | null;
  view_count: number | null;
  trending_score: number | null;
  is_today: boolean | null;
  tags: TopicTag[];
};

function formatCount(value: number | null | undefined) {
  return new Intl.NumberFormat("ko-KR").format(value ?? 0);
}

function getPercent(value: number, total: number) {
  if (total <= 0) {
    return 0;
  }

  return Math.round((value / total) * 100);
}

export function HeroTopicCarousel({
  topics,
}: {
  topics: HeroTopicCarouselTopic[];
}) {
  const [currentIndex, setCurrentIndex] = useState(0);

  if (topics.length === 0) {
    return (
      <section
        id="today"
        className="rounded-[1.75rem] border border-orange-100 bg-white p-6 text-center shadow-sm sm:rounded-[2rem] sm:p-10"
      >
        <p className="text-sm font-black tracking-[0.24em] text-orange-700">
          TRENDING
        </p>
        <h2 className="mt-2 text-3xl font-black">아직 표시할 주제가 없습니다.</h2>
        <p className="mx-auto mt-3 max-w-md text-sm leading-6 text-stone-600">
          활성 주제가 생기면 이곳에서 바로 확인할 수 있습니다.
        </p>
        <Link
          className="mt-6 inline-flex rounded-full bg-stone-950 px-5 py-3 text-sm font-black text-white transition hover:-translate-y-0.5"
          href="/topics"
        >
          주제 목록 보기
        </Link>
      </section>
    );
  }

  const topic = topics[currentIndex] ?? topics[0];
  const totalVotes = (topic.vote_a_count ?? 0) + (topic.vote_b_count ?? 0);
  const aPercent = getPercent(topic.vote_a_count ?? 0, totalVotes);
  const bPercent = getPercent(topic.vote_b_count ?? 0, totalVotes);

  function goToPrevious() {
    setCurrentIndex((index) => (index - 1 + topics.length) % topics.length);
  }

  function goToNext() {
    setCurrentIndex((index) => (index + 1) % topics.length);
  }

  return (
    <section
      id="today"
      className="relative overflow-hidden rounded-[1.75rem] border border-orange-100 bg-white shadow-sm sm:rounded-[2rem]"
    >
      <div className="absolute inset-x-0 top-0 h-1.5 bg-orange-500" />

      <div className="grid gap-6 p-5 sm:p-7 xl:grid-cols-[minmax(0,1fr)_320px]">
        <Link
          className="group block min-w-0 rounded-[1.5rem] bg-orange-50/70 p-5 transition hover:bg-orange-50 sm:p-7"
          href={`/topics/${topic.id}`}
        >
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-full bg-orange-500 px-3 py-1 text-xs font-black text-white">
              급상승 주제
            </span>
            {topic.is_today && (
              <span className="rounded-full bg-white px-3 py-1 text-xs font-black text-orange-800 ring-1 ring-orange-100">
                오늘의 논쟁
              </span>
            )}
            <span className="rounded-full bg-white px-3 py-1 text-xs font-black text-stone-600 ring-1 ring-stone-100">
              조회 {formatCount(topic.view_count)}
            </span>
          </div>

          <h2 className="mt-5 break-words text-3xl font-black leading-tight tracking-tight text-stone-950 group-hover:text-orange-800 sm:text-4xl lg:text-5xl">
            {topic.title}
          </h2>

          <p className="mt-4 line-clamp-3 break-words text-sm leading-7 text-stone-600 sm:text-base">
            {topic.description}
          </p>

          {topic.tags.length > 0 && (
            <div className="mt-5 flex flex-wrap gap-2">
              {topic.tags.map((tag) => (
                <span
                  key={tag.id}
                  className="rounded-full bg-white px-3 py-1 text-xs font-black text-orange-700 ring-1 ring-orange-100"
                >
                  #{tag.name}
                </span>
              ))}
            </div>
          )}

          <div className="mt-6 grid gap-3 sm:grid-cols-2">
            <div className="rounded-2xl bg-orange-500 px-4 py-4 text-white">
              <p className="break-words text-base font-black">{topic.option_a}</p>
              <p className="mt-1 text-xs font-bold text-orange-100">
                {aPercent}%
              </p>
            </div>

            <div className="rounded-2xl bg-stone-950 px-4 py-4 text-white">
              <p className="break-words text-base font-black">{topic.option_b}</p>
              <p className="mt-1 text-xs font-bold text-stone-300">
                {bPercent}%
              </p>
            </div>
          </div>
        </Link>

        <div className="flex min-w-0 flex-col justify-between rounded-[1.5rem] border border-orange-100 bg-white p-5">
          <div>
            <p className="text-xs font-black tracking-[0.22em] text-orange-700">
              LIVE SIGNAL
            </p>
            <h3 className="mt-2 text-xl font-black">지금 많이 보는 논쟁</h3>

            <div className="mt-5 space-y-3">
              <div>
                <div className="flex items-center justify-between gap-3 text-xs font-bold text-stone-600">
                  <span className="min-w-0 truncate">{topic.option_a}</span>
                  <span>{aPercent}%</span>
                </div>
                <div className="mt-1 h-2 overflow-hidden rounded-full bg-stone-100">
                  <div
                    className="h-full rounded-full bg-orange-500"
                    style={{ width: `${aPercent}%` }}
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between gap-3 text-xs font-bold text-stone-600">
                  <span className="min-w-0 truncate">{topic.option_b}</span>
                  <span>{bPercent}%</span>
                </div>
                <div className="mt-1 h-2 overflow-hidden rounded-full bg-stone-100">
                  <div
                    className="h-full rounded-full bg-stone-950"
                    style={{ width: `${bPercent}%` }}
                  />
                </div>
              </div>
            </div>

            <div className="mt-5 grid grid-cols-2 gap-2 text-xs font-black text-stone-600">
              <div className="rounded-2xl bg-stone-50 p-3">
                <p className="text-stone-400">투표</p>
                <p className="mt-1 text-base text-stone-900">
                  {formatCount(totalVotes)}
                </p>
              </div>
              <div className="rounded-2xl bg-stone-50 p-3">
                <p className="text-stone-400">의견</p>
                <p className="mt-1 text-base text-stone-900">
                  {formatCount(topic.opinion_count)}
                </p>
              </div>
              <div className="rounded-2xl bg-stone-50 p-3">
                <p className="text-stone-400">댓글</p>
                <p className="mt-1 text-base text-stone-900">
                  {formatCount(topic.comment_count)}
                </p>
              </div>
              <div className="rounded-2xl bg-stone-50 p-3">
                <p className="text-stone-400">급상승</p>
                <p className="mt-1 text-base text-stone-900">
                  {Math.round(Number(topic.trending_score ?? 0))}
                </p>
              </div>
            </div>
          </div>

          <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
            <div className="flex gap-2">
              <button
                aria-label="이전 주제 보기"
                className="flex h-10 w-10 items-center justify-center rounded-full border border-stone-200 bg-white text-lg font-black text-stone-700 transition hover:bg-orange-50 hover:text-orange-700"
                onClick={goToPrevious}
                type="button"
              >
                ‹
              </button>
              <button
                aria-label="다음 주제 보기"
                className="flex h-10 w-10 items-center justify-center rounded-full border border-stone-200 bg-white text-lg font-black text-stone-700 transition hover:bg-orange-50 hover:text-orange-700"
                onClick={goToNext}
                type="button"
              >
                ›
              </button>
            </div>

            <div className="flex flex-wrap justify-end gap-1.5">
              {topics.map((carouselTopic, index) => (
                <button
                  aria-label={`${index + 1}번째 주제 보기`}
                  className={`h-2.5 rounded-full transition ${
                    index === currentIndex
                      ? "w-6 bg-orange-500"
                      : "w-2.5 bg-stone-200 hover:bg-orange-200"
                  }`}
                  key={carouselTopic.id}
                  onClick={() => setCurrentIndex(index)}
                  type="button"
                />
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
