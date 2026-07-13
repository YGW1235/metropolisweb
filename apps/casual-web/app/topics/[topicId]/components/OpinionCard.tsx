import Link from "next/link";

import {
  clearOpinionReaction,
  reactOpinion,
} from "@/app/topics/actions";

import { CommentList } from "./CommentList";
import { OpinionEditBox } from "./OpinionEditBox";
import type {
  Comment,
  Opinion,
  OpinionImage,
  OpinionReaction,
  PublicProfile,
  VoteChoice,
} from "./types";

const SIDE_STYLES: Record<
  VoteChoice,
  {
    avatar: string;
    card: string;
    sideText: string;
  }
> = {
  a: {
    avatar: "bg-orange-200 text-orange-900",
    card: "border-orange-100 bg-orange-50/60",
    sideText: "text-orange-700",
  },
  b: {
    avatar: "bg-stone-200 text-stone-900",
    card: "border-stone-100 bg-stone-50",
    sideText: "text-stone-600",
  },
};

export function OpinionCard({
  comments,
  currentUserId,
  isLoggedIn,
  images,
  myReaction,
  opinion,
  opinionProfile,
  optionLabel,
  profileByUserId,
  topicId,
}: {
  comments: Comment[];
  currentUserId?: string;
  isLoggedIn: boolean;
  images: OpinionImage[];
  myReaction?: OpinionReaction;
  opinion: Opinion;
  opinionProfile?: PublicProfile;
  optionLabel: string;
  profileByUserId: Map<string, PublicProfile>;
  topicId: string;
}) {
  const styles = SIDE_STYLES[opinion.choice];

  return (
    <article className={`rounded-3xl border p-4 ${styles.card}`}>
      <div className="flex items-center gap-3">
        <div
          className={`flex h-10 w-10 items-center justify-center rounded-full text-sm font-black ${styles.avatar}`}
        >
          {(opinionProfile?.nickname ?? "익명").slice(0, 1)}
        </div>

        <div className="min-w-0">
          {opinionProfile?.nickname ? (
            <Link
              href={`/users/${encodeURIComponent(opinionProfile.nickname)}`}
              className="text-sm font-black hover:text-orange-700"
            >
              {opinionProfile.nickname}
            </Link>
          ) : (
            <p className="text-sm font-black">알 수 없음</p>
          )}
          <p className={`text-xs font-bold ${styles.sideText}`}>
            {optionLabel} 측 ·{" "}
            <time dateTime={opinion.created_at}>
              {new Date(opinion.created_at).toLocaleString("ko-KR", {
                dateStyle: "short",
                timeStyle: "short",
              })}
            </time>
          </p>
        </div>
      </div>

      <p className="mt-4 whitespace-pre-wrap text-sm leading-6 text-stone-700">
        {opinion.body}
      </p>

      {images.length > 0 && (
        <div className="mt-4 space-y-2">
          {images.map((image) => (
            <img
              key={image.storage_path}
              src={image.public_url}
              alt="의견 이미지"
              loading="lazy"
              className="max-h-96 w-full rounded-2xl border border-orange-100 bg-white object-contain"
            />
          ))}
        </div>
      )}

      {currentUserId === opinion.user_id && (
        <OpinionEditBox opinion={opinion} topicId={topicId} />
      )}

      <div className="mt-4 flex flex-wrap items-center gap-2">
        <form action={reactOpinion}>
          <input type="hidden" name="topicId" value={topicId} />
          <input type="hidden" name="opinionId" value={opinion.id} />
          <input type="hidden" name="reactionType" value="like" />
          <button
            className={`rounded-full px-3 py-2 text-xs font-black ${
              myReaction === "like"
                ? "bg-orange-500 text-white"
                : "bg-white text-stone-700"
            }`}
          >
            공감 {opinion.like_count}
          </button>
        </form>

        <form action={reactOpinion}>
          <input type="hidden" name="topicId" value={topicId} />
          <input type="hidden" name="opinionId" value={opinion.id} />
          <input type="hidden" name="reactionType" value="dislike" />
          <button
            className={`rounded-full px-3 py-2 text-xs font-black ${
              myReaction === "dislike"
                ? "bg-stone-900 text-white"
                : "bg-white text-stone-700"
            }`}
          >
            비공감 {opinion.dislike_count}
          </button>
        </form>

        {myReaction && (
          <form action={clearOpinionReaction}>
            <input type="hidden" name="topicId" value={topicId} />
            <input type="hidden" name="opinionId" value={opinion.id} />
            <button className="rounded-full bg-white px-3 py-2 text-xs font-black text-stone-500">
              취소
            </button>
          </form>
        )}

        <Link
          href={`/report?targetType=opinion&targetId=${
            opinion.id
          }&returnTo=${encodeURIComponent(`/topics/${topicId}`)}`}
          className="text-xs font-bold text-stone-400 underline underline-offset-4 hover:text-red-600"
        >
          신고
        </Link>

        <span className="ml-auto text-xs font-bold text-stone-500">
          점수 {opinion.score}
        </span>
      </div>

      <CommentList
        comments={comments}
        currentUserId={currentUserId}
        isLoggedIn={isLoggedIn}
        opinionId={opinion.id}
        profileByUserId={profileByUserId}
        topicId={topicId}
      />
    </article>
  );
}
