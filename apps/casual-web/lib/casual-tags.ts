export type TopicTag = {
  id: string;
  name: string;
  slug: string;
};

export type TopicTagLink = {
  topic_id: string;
  tag_id: string;
};

export function buildTagsByTopicId(
  topicIds: string[],
  tags: TopicTag[],
  links: TopicTagLink[],
) {
  const tagById = new Map(tags.map((tag) => [tag.id, tag]));
  const topicIdSet = new Set(topicIds);
  const tagsByTopicId = new Map<string, TopicTag[]>();

  for (const topicId of topicIds) {
    tagsByTopicId.set(topicId, []);
  }

  for (const link of links) {
    if (!topicIdSet.has(link.topic_id)) {
      continue;
    }

    const tag = tagById.get(link.tag_id);

    if (!tag) {
      continue;
    }

    tagsByTopicId.get(link.topic_id)?.push(tag);
  }

  return tagsByTopicId;
}

export function normalizeTagSlug(value?: string) {
  return value?.trim() ?? "";
}
