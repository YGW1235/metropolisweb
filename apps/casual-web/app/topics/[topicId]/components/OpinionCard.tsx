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
    badge: string;
    card: string;
  }
> = {
  a: {
    avatar: "bg-orange-200 text-orange-900",
    badge: "bg-orange-100 text-orange-800",
    card: "border-orange-100 bg-orange-50/60",
  },
  b: {
    avatar: "bg-stone-200 text-stone-900",
    badge: "bg-stone-200 text-stone-700",
    card: "border-stone-100 bg-stone-50",
  },
};

function formatRelativeTime(value: string) {
  const createdAt = new Date(value);
  const createdAtTime = createdAt.getTime();

  if (Number.isNaN(createdAtTime)) {
    return "";
  }

  const diff = Math.max(0, Date.now() - createdAtTime);
  const minute = 60_000;
  const hour = minute * 60;
  const day = hour * 24;

  if (diff < minute) {
    return "방금 전";
  }

  if (diff < hour) {
    return `${Math.floor(diff / minute)}분 전`;
  }

  if (diff < day) {
    return `${Math.floor(diff / hour)}시간 전`;
  }

  if (diff < day * 7) {
    return `${Math.floor(diff / day)}일 전`;
  }

  return createdAt.toLocaleDateString("ko-KR", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

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
  const displayName = opinionProfile?.nickname ?? "익명";
  const relativeTime = formatRelativeTime(opinion.created_at);

  return (
    <article className={`rounded-3xl border p-4 shadow-sm ${styles.card}`}>
      <div className="flex items-start gap-3">
        {opinionProfile?.avatar_url ? (
          <img
            src={opinionProfile.avatar_url}
            alt={`${displayName} 프로필`}
            className="h-10 w-10 rounded-full object-cover"
          />
        ) : (
          <div
            className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-sm font-black ${styles.avatar}`}
          >
            {displayName.slice(0, 1)}
          </div>
        )}

        <div className="min-w-0 flex-1">
          <div className="flex min-w-0 flex-wrap items-center gap-x-2 gap-y-1">
            {opinionProfile?.nickname ? (
              <Link
                href={`/users/${encodeURIComponent(opinionProfile.nickname)}`}
                className="truncate text-sm font-black text-stone-900 hover:text-orange-700"
              >
                {opinionProfile.nickname}
              </Link>
            ) : (
              <p className="text-sm font-black text-stone-900">알 수 없음</p>
            )}
            {relativeTime && (
              <time
                dateTime={opinion.created_at}
                className="text-xs font-bold text-stone-400"
              >
                {relativeTime}
              </time>
            )}
          </div>

          <span
            className={`mt-1 inline-flex rounded-full px-2.5 py-1 text-xs font-black ${styles.badge}`}
          >
            {optionLabel} 측
          </span>
        </div>
      </div>

      <p className="mt-4 whitespace-pre-wrap text-sm leading-6 text-stone-700">
        {opinion.body}
      </p>

      {images.length > 0 && (
        <div className="mt-4 space-y-2">
          {images.map((image) => (
            <a
              key={image.storage_path}
              href={image.public_url}
              target="_blank"
              rel="noreferrer"
              className="block overflow-hidden rounded-2xl bg-white/80"
            >
              <img
                src={image.public_url}
                alt="의견 이미지"
                loading="lazy"
                className="max-h-[28rem] w-full object-contain"
              />
            </a>
          ))}
        </div>
      )}

      {currentUserId === opinion.user_id && (
        <OpinionEditBox opinion={opinion} topicId={topicId} />
      )}

      <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-white/80 pt-3">
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
            ▲ {opinion.like_count}
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
            ▼ {opinion.dislike_count}
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

        <CommentList
          comments={comments}
          currentUserId={currentUserId}
          isLoggedIn={isLoggedIn}
          opinionId={opinion.id}
          profileByUserId={profileByUserId}
          topicId={topicId}
        />

        <Link
          href={`/report?targetType=opinion&targetId=${
            opinion.id
          }&returnTo=${encodeURIComponent(`/topics/${topicId}`)}`}
          className="ml-auto text-xs font-bold text-stone-400 underline underline-offset-4 hover:text-red-600"
        >
          신고
        </Link>
      </div>
    </article>
  );
}
