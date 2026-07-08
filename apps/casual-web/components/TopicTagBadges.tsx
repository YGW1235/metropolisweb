import Link from "next/link";

import type { TopicTag } from "@/lib/casual-tags";

export function TopicTagBadges({
  className = "",
  linked = false,
  tags,
}: {
  className?: string;
  linked?: boolean;
  tags: TopicTag[];
}) {
  if (tags.length === 0) {
    return null;
  }

  return (
    <div className={`flex flex-wrap gap-2 ${className}`}>
      {tags.map((tag) =>
        linked ? (
          <Link
            key={tag.id}
            href={`/topics?tag=${encodeURIComponent(tag.slug)}`}
            className="rounded-full bg-orange-50 px-3 py-1 text-xs font-black text-orange-700 transition hover:bg-orange-100"
          >
            #{tag.name}
          </Link>
        ) : (
          <span
            key={tag.id}
            className="rounded-full bg-orange-50 px-3 py-1 text-xs font-black text-orange-700"
          >
            #{tag.name}
          </span>
        ),
      )}
    </div>
  );
}
