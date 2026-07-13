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

const COLUMN_STYLES: Record<
  VoteChoice,
  {
    countText: string;
    emptyBorder: string;
    header: string;
    title: string;
  }
> = {
  a: {
    countText: "text-orange-800",
    emptyBorder: "border-orange-200",
    header: "bg-orange-100",
    title: "text-orange-950",
  },
  b: {
    countText: "text-stone-600",
    emptyBorder: "border-stone-200",
    header: "bg-stone-100",
    title: "text-stone-950",
  },
};

export function OpinionColumn({
  commentsByOpinionId,
  currentUserId,
  currentPage,
  hasNextPage,
  hasPreviousPage,
  imagesByOpinionId,
  isLoggedIn,
  myReactionByOpinionId,
  nextHref,
  opinions,
  optionLabel,
  previousHref,
  profileByUserId,
  side,
  topicId,
  totalCount,
}: {
  commentsByOpinionId: Map<string, Comment[]>;
  currentUserId?: string;
  currentPage: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
  imagesByOpinionId: Map<string, OpinionImage[]>;
  isLoggedIn: boolean;
  myReactionByOpinionId: Map<string, OpinionReaction>;
  nextHref: string;
  opinions: Opinion[];
  optionLabel: string;
  previousHref: string;
  profileByUserId: Map<string, PublicProfile>;
  side: VoteChoice;
  topicId: string;
  totalCount: number;
}) {
  const styles = COLUMN_STYLES[side];

  return (
    <div className="min-w-0">
      <div className={`mb-4 rounded-2xl px-4 py-3 ${styles.header}`}>
        <h3 className={`break-words font-black leading-snug ${styles.title}`}>
          {optionLabel}
        </h3>
        <p className={`mt-1 text-xs font-bold ${styles.countText}`}>
          {totalCount}개 의견
        </p>
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
            optionLabel={optionLabel}
            profileByUserId={profileByUserId}
            topicId={topicId}
          />
        ))}

        {opinions.length === 0 && (
          <div
            className={`rounded-3xl border border-dashed p-5 text-center text-sm font-bold text-stone-500 ${styles.emptyBorder}`}
          >
            아직 이쪽 의견이 없습니다.
          </div>
        )}
      </div>

      {(hasPreviousPage || hasNextPage || totalCount > opinions.length) && (
        <div className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-white/70 p-3 text-xs font-black text-stone-500">
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
