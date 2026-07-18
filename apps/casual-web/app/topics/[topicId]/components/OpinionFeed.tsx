import Link from "next/link";

import { OpinionCard } from "./OpinionCard";
import type {
  Comment,
  Opinion,
  OpinionImage,
  OpinionReaction,
  PublicProfile,
  VoteChoice,
} from "./types";

type OpinionSide = "all" | VoteChoice;

function getFeedTitle({
  opinionSide,
  optionALabel,
  optionBLabel,
}: {
  opinionSide: OpinionSide;
  optionALabel: string;
  optionBLabel: string;
}) {
  if (opinionSide === "a") {
    return `${optionALabel} 의견`;
  }

  if (opinionSide === "b") {
    return `${optionBLabel} 의견`;
  }

  return "전체 의견 피드";
}

function getEmptyMessage(opinionSide: OpinionSide) {
  if (opinionSide === "all") {
    return "아직 의견이 없습니다.";
  }

  return "아직 이쪽 의견이 없습니다.";
}

export function OpinionFeed({
  commentsByOpinionId,
  currentPage,
  currentUserId,
  hasNextPage,
  hasPreviousPage,
  imagesByOpinionId,
  isLoggedIn,
  myReactionByOpinionId,
  nextHref,
  opinionSide,
  opinions,
  optionALabel,
  optionBLabel,
  previousHref,
  profileByUserId,
  topicId,
  totalCount,
}: {
  commentsByOpinionId: Map<string, Comment[]>;
  currentPage: number;
  currentUserId?: string;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
  imagesByOpinionId: Map<string, OpinionImage[]>;
  isLoggedIn: boolean;
  myReactionByOpinionId: Map<string, OpinionReaction>;
  nextHref: string;
  opinionSide: OpinionSide;
  opinions: Opinion[];
  optionALabel: string;
  optionBLabel: string;
  previousHref: string;
  profileByUserId: Map<string, PublicProfile>;
  topicId: string;
  totalCount: number;
}) {
  const feedTitle = getFeedTitle({ opinionSide, optionALabel, optionBLabel });

  return (
    <div className="mx-auto mt-6 max-w-5xl lg:mt-8">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-stone-50/80 px-4 py-3">
        <div>
          <h3 className="break-words text-base font-black text-stone-900">
            {feedTitle}
          </h3>
          <p className="mt-1 text-xs font-bold text-stone-500">
            한 페이지에 10개씩 표시됩니다.
          </p>
        </div>
        <span className="rounded-full bg-white px-3 py-2 text-xs font-black text-stone-600">
          {totalCount}개 의견
        </span>
      </div>

      <div className="space-y-3">
        {opinions.map((opinion) => (
          <OpinionCard
            key={opinion.id}
            comments={commentsByOpinionId.get(opinion.id) ?? []}
            currentUserId={currentUserId}
            images={imagesByOpinionId.get(opinion.id) ?? []}
            isLoggedIn={isLoggedIn}
            myReaction={myReactionByOpinionId.get(opinion.id)}
            opinion={opinion}
            opinionProfile={profileByUserId.get(opinion.user_id)}
            optionLabel={
              opinion.choice === "a" ? optionALabel : optionBLabel
            }
            profileByUserId={profileByUserId}
            topicId={topicId}
          />
        ))}

        {opinions.length === 0 && (
          <div className="rounded-3xl border border-dashed border-orange-200 bg-white/70 p-6 text-center text-sm font-bold text-stone-500">
            {getEmptyMessage(opinionSide)}
          </div>
        )}
      </div>

      {(hasPreviousPage || hasNextPage || totalCount > opinions.length) && (
        <div className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-white/80 p-3 text-xs font-black text-stone-500">
          {hasPreviousPage ? (
            <Link
              href={previousHref}
              className="rounded-full bg-stone-100 px-3 py-2 text-stone-700 hover:bg-orange-100 hover:text-orange-800"
            >
              이전
            </Link>
          ) : (
            <span className="rounded-full bg-stone-50 px-3 py-2 text-stone-300">
              이전
            </span>
          )}

          <span>{currentPage}페이지</span>

          {hasNextPage ? (
            <Link
              href={nextHref}
              className="rounded-full bg-stone-950 px-3 py-2 text-white hover:bg-orange-700"
            >
              다음
            </Link>
          ) : (
            <span className="rounded-full bg-stone-50 px-3 py-2 text-stone-300">
              다음
            </span>
          )}
        </div>
      )}
    </div>
  );
}
