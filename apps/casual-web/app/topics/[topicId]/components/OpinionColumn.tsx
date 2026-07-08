import { OpinionCard } from "./OpinionCard";
import type {
  Comment,
  Opinion,
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
  isLoggedIn,
  myReactionByOpinionId,
  opinions,
  optionLabel,
  profileByUserId,
  side,
  topicId,
}: {
  commentsByOpinionId: Map<string, Comment[]>;
  currentUserId?: string;
  isLoggedIn: boolean;
  myReactionByOpinionId: Map<string, OpinionReaction>;
  opinions: Opinion[];
  optionLabel: string;
  profileByUserId: Map<string, PublicProfile>;
  side: VoteChoice;
  topicId: string;
}) {
  const styles = COLUMN_STYLES[side];

  return (
    <div>
      <div className={`mb-4 rounded-2xl px-4 py-3 ${styles.header}`}>
        <h3 className={`font-black ${styles.title}`}>{optionLabel}</h3>
        <p className={`mt-1 text-xs font-bold ${styles.countText}`}>
          {opinions.length}개 의견
        </p>
      </div>

      <div className="space-y-3">
        {opinions.map((opinion) => (
          <OpinionCard
            key={opinion.id}
            comments={commentsByOpinionId.get(opinion.id) ?? []}
            currentUserId={currentUserId}
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
    </div>
  );
}
