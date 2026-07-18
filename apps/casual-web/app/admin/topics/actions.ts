"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { createAdminAuditLog } from "@/lib/casual-admin-audit-log";
import { createClient } from "@/lib/supabase/server";

type TopicStatus = "draft" | "active" | "closed" | "archived";
type SupabaseClient = Awaited<ReturnType<typeof createClient>>;

function getString(formData: FormData, key: string) {
  const value = formData.get(key);

  if (typeof value !== "string") {
    return "";
  }

  return value.trim();
}

function getSelectedTagIds(formData: FormData) {
  return Array.from(
    new Set(
      formData
        .getAll("tagIds")
        .filter((value): value is string => typeof value === "string")
        .map((value) => value.trim())
        .filter(Boolean),
    ),
  );
}

function getStatus(value: string): TopicStatus {
  if (
    value === "draft" ||
    value === "active" ||
    value === "closed" ||
    value === "archived"
  ) {
    return value;
  }

  return "draft";
}

function redirectWithMessage(
  path: string,
  message: string,
  type: "success" | "error" = "success",
): never {
  const params = new URLSearchParams({
    message,
    type,
  });

  redirect(`${path}?${params.toString()}`);
}

async function requireAdmin(
  adminMessage = "관리자 권한이 필요합니다.",
) {
  const supabase = await createClient();

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    redirectWithMessage("/login", "로그인이 필요합니다.", "error");
  }

  const { data: isAdmin, error: adminError } =
    await supabase.rpc("is_casual_admin");

  if (adminError || !isAdmin) {
    redirectWithMessage("/", adminMessage, "error");
  }

  return {
    supabase,
    user,
  };
}

async function replaceTopicTags(
  supabase: SupabaseClient,
  topicId: string,
  tagIds: string[],
  returnPath: string,
) {
  const { error: deleteError } = await supabase
    .from("casual_topic_tag_links")
    .delete()
    .eq("topic_id", topicId);

  if (deleteError) {
    redirectWithMessage(returnPath, deleteError.message, "error");
  }

  if (tagIds.length === 0) {
    return;
  }

  const { error: insertError } = await supabase
    .from("casual_topic_tag_links")
    .insert(
      tagIds.map((tagId) => ({
        topic_id: topicId,
        tag_id: tagId,
      })),
    );

  if (insertError) {
    redirectWithMessage(returnPath, insertError.message, "error");
  }
}

export async function createTopic(formData: FormData) {
  const title = getString(formData, "title");
  const description = getString(formData, "description");
  const optionA = getString(formData, "optionA");
  const optionB = getString(formData, "optionB");
  const status = getStatus(getString(formData, "status"));
  const isToday = formData.get("isToday") === "on";
  const tagIds = getSelectedTagIds(formData);

  if (title.length < 2 || title.length > 80) {
    redirectWithMessage(
      "/admin/topics",
      "제목은 2자 이상 80자 이하로 입력해주세요.",
      "error",
    );
  }

  if (description.length > 500) {
    redirectWithMessage(
      "/admin/topics",
      "설명은 500자 이하로 입력해주세요.",
      "error",
    );
  }

  if (!optionA || !optionB) {
    redirectWithMessage(
      "/admin/topics",
      "A/B 선택지를 모두 입력해주세요.",
      "error",
    );
  }

  if (isToday && status !== "active") {
    redirectWithMessage(
      "/admin/topics",
      "오늘의 논쟁은 active 상태인 주제만 지정할 수 있습니다.",
      "error",
    );
  }

  const { supabase, user } = await requireAdmin();

  const duplicateTopicCutoff = new Date(Date.now() - 60_000).toISOString();
  const { data: duplicateTopics, error: duplicateTopicsError } = await supabase
    .from("casual_topics")
    .select("id")
    .eq("created_by", user.id)
    .eq("title", title)
    .eq("option_a", optionA)
    .eq("option_b", optionB)
    .gt("created_at", duplicateTopicCutoff)
    .limit(1);

  if (duplicateTopicsError) {
    redirectWithMessage(
      "/admin/topics",
      "주제 생성 상태를 확인하지 못했습니다. 잠시 후 다시 시도해주세요.",
      "error",
    );
  }

  if ((duplicateTopics ?? []).length > 0) {
    redirectWithMessage(
      "/admin/topics",
      "이미 같은 내용이 제출되었습니다. 잠시 후 확인해주세요.",
      "success",
    );
  }

  if (isToday) {
    await supabase
      .from("casual_topics")
      .update({ is_today: false })
      .eq("is_today", true);
  }

  const { data: topic, error } = await supabase
    .from("casual_topics")
    .insert({
      title,
      description,
      option_a: optionA,
      option_b: optionB,
      status,
      is_today: isToday,
      created_by: user.id,
    })
    .select("id")
    .single();

  if (error || !topic) {
    redirectWithMessage(
      "/admin/topics",
      error?.message ?? "주제를 생성하지 못했습니다.",
      "error",
    );
  }

  await replaceTopicTags(supabase, topic.id, tagIds, "/admin/topics");

  await createAdminAuditLog(supabase, {
    action: "topic_created",
    targetType: "topic",
    targetId: topic.id,
    message: "주제를 생성했습니다.",
    metadata: {
      title,
      status,
      isToday,
      tagIds,
    },
  });

  revalidatePath("/");
  revalidatePath("/topics");
  revalidatePath(`/topics/${topic.id}`);
  revalidatePath("/admin/topics");
  revalidatePath("/admin/logs");

  redirectWithMessage("/admin/topics", "주제를 생성했습니다.", "success");
}

export async function updateTopic(formData: FormData) {
  const topicId = getString(formData, "topicId");
  const returnPath = topicId
    ? `/admin/topics/${topicId}/edit`
    : "/admin/topics";
  const title = getString(formData, "title");
  const description = getString(formData, "description");
  const optionA = getString(formData, "optionA");
  const optionB = getString(formData, "optionB");
  const status = getStatus(getString(formData, "status"));
  const isToday = formData.get("isToday") === "on";
  const tagIds = getSelectedTagIds(formData);

  if (!topicId) {
    redirectWithMessage(
      "/admin/topics",
      "주제 정보가 올바르지 않습니다.",
      "error",
    );
  }

  if (title.length < 2 || title.length > 80) {
    redirectWithMessage(
      returnPath,
      "제목은 2자 이상 80자 이하로 입력해주세요.",
      "error",
    );
  }

  if (description.length > 500) {
    redirectWithMessage(
      returnPath,
      "설명은 500자 이하로 입력해주세요.",
      "error",
    );
  }

  if (!optionA || !optionB) {
    redirectWithMessage(
      returnPath,
      "A/B 선택지를 모두 입력해주세요.",
      "error",
    );
  }

  if (isToday && status !== "active") {
    redirectWithMessage(
      returnPath,
      "오늘의 논쟁은 active 상태인 주제만 지정할 수 있습니다.",
      "error",
    );
  }

  const { supabase } = await requireAdmin();

  const { data: existingTopic, error: existingTopicError } = await supabase
    .from("casual_topics")
    .select("id, status")
    .eq("id", topicId)
    .maybeSingle();

  if (existingTopicError) {
    console.error("Failed to read topic before update:", existingTopicError);
    redirectWithMessage(
      returnPath,
      "주제를 수정하지 못했습니다. 잠시 후 다시 시도해주세요.",
      "error",
    );
  }

  if (!existingTopic) {
    redirectWithMessage(returnPath, "주제를 찾을 수 없습니다.", "error");
  }

  if (status === "archived" && existingTopic.status !== "archived") {
    redirectWithMessage(
      returnPath,
      "삭제 처리는 위험 구역의 확인 절차를 이용해주세요.",
      "error",
    );
  }

  if (isToday) {
    await supabase
      .from("casual_topics")
      .update({ is_today: false })
      .eq("is_today", true);
  }

  const { error } = await supabase
    .from("casual_topics")
    .update({
      title,
      description,
      option_a: optionA,
      option_b: optionB,
      status,
      is_today: isToday,
    })
    .eq("id", topicId);

  if (error) {
    redirectWithMessage(returnPath, error.message, "error");
  }

  await replaceTopicTags(supabase, topicId, tagIds, returnPath);

  await createAdminAuditLog(supabase, {
    action: "topic_updated",
    targetType: "topic",
    targetId: topicId,
    message: "주제를 수정했습니다.",
    metadata: {
      title,
      status,
      isToday,
      tagIds,
    },
  });

  revalidatePath("/");
  revalidatePath("/topics");
  revalidatePath(`/topics/${topicId}`);
  revalidatePath("/admin/topics");
  revalidatePath("/admin/logs");
  revalidatePath(returnPath);

  redirectWithMessage(returnPath, "주제를 수정했습니다.", "success");
}

export async function setTodayTopic(formData: FormData) {
  const topicId = getString(formData, "topicId");

  if (!topicId) {
    redirectWithMessage(
      "/admin/topics",
      "주제 정보가 올바르지 않습니다.",
      "error",
    );
  }

  const { supabase } = await requireAdmin();

  await supabase
    .from("casual_topics")
    .update({ is_today: false })
    .eq("is_today", true);

  const { error } = await supabase
    .from("casual_topics")
    .update({
      is_today: true,
      status: "active",
    })
    .eq("id", topicId);

  if (error) {
    redirectWithMessage("/admin/topics", error.message, "error");
  }

  await createAdminAuditLog(supabase, {
    action: "topic_set_today",
    targetType: "topic",
    targetId: topicId,
    message: "오늘의 논쟁으로 지정했습니다.",
    metadata: {
      status: "active",
      isToday: true,
    },
  });

  revalidatePath("/");
  revalidatePath("/topics");
  revalidatePath(`/topics/${topicId}`);
  revalidatePath("/admin/topics");
  revalidatePath("/admin/logs");

  redirectWithMessage(
    "/admin/topics",
    "오늘의 논쟁으로 지정했습니다.",
    "success",
  );
}

export async function changeTopicStatus(formData: FormData) {
  const topicId = getString(formData, "topicId");
  const status = getStatus(getString(formData, "status"));

  if (!topicId) {
    redirectWithMessage(
      "/admin/topics",
      "주제 정보가 올바르지 않습니다.",
      "error",
    );
  }

  if (status === "archived") {
    redirectWithMessage(
      "/admin/topics",
      "삭제 처리는 확인 절차를 이용해주세요.",
      "error",
    );
  }

  const { supabase } = await requireAdmin();

  const patch =
    status === "active"
      ? { status }
      : {
          status,
          is_today: false,
        };

  const { error } = await supabase
    .from("casual_topics")
    .update(patch)
    .eq("id", topicId);

  if (error) {
    redirectWithMessage("/admin/topics", error.message, "error");
  }

  await createAdminAuditLog(supabase, {
    action: "topic_status_changed",
    targetType: "topic",
    targetId: topicId,
    message: `주제 상태를 ${status}로 변경했습니다.`,
    metadata: {
      status,
      isToday: status === "active" ? null : false,
    },
  });

  revalidatePath("/");
  revalidatePath("/topics");
  revalidatePath(`/topics/${topicId}`);
  revalidatePath("/admin/topics");
  revalidatePath("/admin/logs");

  redirectWithMessage("/admin/topics", "주제 상태를 변경했습니다.", "success");
}

export async function archiveTopicAsDeleted(formData: FormData) {
  const topicId = getString(formData, "topicId");
  const confirmText = getString(formData, "confirmText");
  const returnPath = getString(formData, "returnPath") || "/admin/topics";

  if (!topicId) {
    redirectWithMessage(
      "/admin/topics",
      "주제 정보가 올바르지 않습니다.",
      "error",
    );
  }

  if (confirmText !== "삭제") {
    redirectWithMessage(
      returnPath,
      "삭제 처리하려면 확인 문구를 정확히 입력해주세요.",
      "error",
    );
  }

  const { supabase } = await requireAdmin(
    "관리자만 주제를 삭제 처리할 수 있습니다.",
  );

  const { data: topic, error: readError } = await supabase
    .from("casual_topics")
    .select("id, title, status, is_today")
    .eq("id", topicId)
    .maybeSingle();

  if (readError) {
    console.error("Failed to read topic before archive:", readError);
    redirectWithMessage(
      returnPath,
      "주제를 삭제 처리하지 못했습니다. 잠시 후 다시 시도해주세요.",
      "error",
    );
  }

  if (!topic) {
    redirectWithMessage(returnPath, "주제를 찾을 수 없습니다.", "error");
  }

  if (topic.status === "archived") {
    redirectWithMessage(returnPath, "이미 삭제 처리된 주제입니다.", "success");
  }

  const previousStatus = topic.status;
  const { error: updateError } = await supabase
    .from("casual_topics")
    .update({
      status: "archived",
      is_today: false,
    })
    .eq("id", topicId);

  if (updateError) {
    console.error("Failed to archive topic as deleted:", updateError);
    redirectWithMessage(
      returnPath,
      "주제를 삭제 처리하지 못했습니다. 잠시 후 다시 시도해주세요.",
      "error",
    );
  }

  await createAdminAuditLog(supabase, {
    action: "topic_archived",
    targetType: "topic",
    targetId: topicId,
    message: "주제를 삭제 처리했습니다.",
    metadata: {
      title: topic.title,
      previousStatus,
      nextStatus: "archived",
      reason: "admin_delete",
      isToday: Boolean(topic.is_today),
    },
  });

  revalidatePath("/");
  revalidatePath("/topics");
  revalidatePath(`/topics/${topicId}`);
  revalidatePath(`/admin/topics/${topicId}/edit`);
  revalidatePath("/admin/topics");
  revalidatePath("/admin/logs");
  revalidatePath(returnPath);

  redirectWithMessage(returnPath, "주제를 삭제 처리했습니다.", "success");
}
