import type { TopicTag } from "@/lib/casual-tags";

export function TopicTagCheckboxes({
  selectedTagIds = [],
  tags,
}: {
  selectedTagIds?: string[];
  tags: TopicTag[];
}) {
  if (tags.length === 0) {
    return (
      <div className="rounded-2xl bg-stone-50 p-4 text-sm font-bold text-stone-500">
        등록된 태그가 없습니다.
      </div>
    );
  }

  const selectedTagIdSet = new Set(selectedTagIds);

  return (
    <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
      {tags.map((tag) => (
        <label
          key={tag.id}
          className="flex items-center gap-2 rounded-2xl border border-orange-100 bg-orange-50/40 px-3 py-2 text-sm font-bold text-stone-700"
        >
          <input
            name="tagIds"
            type="checkbox"
            value={tag.id}
            defaultChecked={selectedTagIdSet.has(tag.id)}
            className="h-4 w-4"
          />
          <span>#{tag.name}</span>
        </label>
      ))}
    </div>
  );
}
