"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";

import { logAdminActivity } from "@/lib/admin-log";

type JoinSide = "auto" | "pro" | "con";
type TopicStatus = "draft" | "open" | "active" | "closed" | "archived";

const TOPIC_STATUSES = [
  "draft",
  "open",
  "active",
  "closed",
  "archived",
] as const;

function getString(formData: FormData, key: string) {
  const value = formData.get(key);

  if (typeof value !== "string") {
    return "";
  }

  return value.trim();
}

function getNullableString(formData: FormData, key: string) {
  const value = getString(formData, key);

  if (!value) {
    return null;
  }

  return value;
}

function getRequiredString(formData: FormData, key: string) {
  const value = getString(formData, key);

  if (!value) {
    throw new Error(`${key} 값이 필요합니다.`);
  }

  return value;
}

function getJoinSide(value: string): JoinSide {
  if (value === "pro" || value === "con") {
    return value;
  }

  return "auto";
}

function getTopicStatus(value: string): TopicStatus | null {
  if (TOPIC_STATUSES.includes(value as TopicStatus)) {
    return value as TopicStatus;
  }

  return null;
}

function getOptionalKstDateTime(formData: FormData, key: string) {
  const value = getString(formData, key);

  if (!value) {
    return null;
  }

  // input type="datetime-local" 값 예시: 2026-06-10T19:30
  // MVP에서는 한국 시간 기준으로 저장합니다.
  return new Date(`${value}:00+09:00`).toISOString();
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

function getSideName(side: "pro" | "con") {
  if (side === "pro") return "아테나";
  return "포세이돈";
}

async function requireAdmin() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect(
      `/login?message=${encodeURIComponent("로그인 후 이용할 수 있습니다.")}`,
    );
  }

  const { data: profile, error } = await supabase
    .from("profiles")
    .select("role, status")
    .eq("id", user.id)
    .single();

  if (error || profile?.role !== "admin" || profile?.status !== "active") {
    redirect(
      `/topics?message=${encodeURIComponent("관리자 권한이 필요합니다.")}`,
    );
  }

  return { supabase, user, profile };
}

export async function joinTopic(formData: FormData) {
  const topicId = getString(formData, "topic_id");
  const joinSide = getJoinSide(getString(formData, "side"));

  if (!topicId) {
    redirectWithMessage("/topics", "의제 정보를 찾을 수 없습니다.", "error");
  }

  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect(
      `/login?message=${encodeURIComponent(
        "로그인 후 진영에 참여할 수 있습니다.",
      )}&redirectTo=${encodeURIComponent(`/topics/${topicId}`)}`,
    );
  }

  const { data: participation, error } = await supabase.rpc("join_topic", {
    p_topic_id: topicId,
    p_join_side: joinSide,
  });

  if (error) {
    console.error("Join topic failed", error);
    redirectWithMessage(
      `/topics/${topicId}`,
      "참여를 처리하지 못했습니다. 잠시 후 다시 시도해주세요.",
      "error",
    );
  }

  revalidatePath("/topics");
  revalidatePath(`/topics/${topicId}`);
  revalidatePath(`/topics/${topicId}/debate`);

  const assignedSide =
    participation?.assigned_side === "con" ? "con" : "pro";

  const message =
    joinSide === "auto"
      ? `자동 배정으로 ${getSideName(assignedSide)} 진영에 참여했습니다.`
      : `${getSideName(assignedSide)} 진영에 참여했습니다.`;

  redirectWithMessage(`/topics/${topicId}/debate`, message, "success");
}

export async function createTopic(formData: FormData) {
  const { supabase, user } = await requireAdmin();

  const title = getRequiredString(formData, "title");
  const description = getRequiredString(formData, "description");

  const statusValue = getString(formData, "status");
  const status = getTopicStatus(statusValue) ?? "draft";

  const startsAt = getOptionalKstDateTime(formData, "starts_at");
  const endsAt = getOptionalKstDateTime(formData, "ends_at");

  const athenaPosition = getNullableString(formData, "athena_position");
  const poseidonPosition = getNullableString(formData, "poseidon_position");

  const { data: topic, error } = await supabase
    .from("topics")
    .insert({
      title,
      description,
      status,
      starts_at: startsAt,
      ends_at: endsAt,
      created_by: user.id,
      athena_position: athenaPosition,
      poseidon_position: poseidonPosition,
    })
    .select("id, title, status")
    .single();

  if (error) {
    console.error("Create topic failed", error);
    redirectWithMessage(
      "/admin/topics/new",
      "주제를 생성하지 못했습니다. 입력 내용을 확인한 뒤 다시 시도해주세요.",
      "error",
    );
  }

  if (!topic) {
    redirectWithMessage(
      "/admin/topics/new",
      "생성된 주제 정보를 확인할 수 없습니다.",
      "error",
    );
  }

  await logAdminActivity(supabase, {
    action: "topic.created",
    targetType: "topic",
    targetId: topic.id,
    summary: "토론 주제를 생성했습니다.",
    metadata: {
      title: topic.title,
      status: topic.status,
    },
  });

  revalidatePath("/");
  revalidatePath("/topics");
  revalidatePath("/admin/topics");
  revalidatePath("/admin/activity");

  redirectWithMessage("/admin/topics", "주제가 생성되었습니다.", "success");
}

export async function updateTopicStatus(formData: FormData) {
  const { supabase } = await requireAdmin();

  const topicId = getRequiredString(formData, "topic_id");
  const statusValue = getRequiredString(formData, "status");
  const status = getTopicStatus(statusValue);

  if (!status) {
    redirectWithMessage(
      "/admin/topics",
      "올바르지 않은 주제 상태입니다.",
      "error",
    );
  }

  const { data: topic, error } = await supabase
    .from("topics")
    .update({
      status,
    })
    .eq("id", topicId)
    .select("id, title, status")
    .single();

  if (error) {
    console.error("Update topic status failed", error);
    redirectWithMessage(
      "/admin/topics",
      "주제 상태를 변경하지 못했습니다. 잠시 후 다시 시도해주세요.",
      "error",
    );
  }

  if (!topic) {
    redirectWithMessage(
      "/admin/topics",
      "상태를 변경한 주제 정보를 확인할 수 없습니다.",
      "error",
    );
  }

  await logAdminActivity(supabase, {
    action: "topic.status_changed",
    targetType: "topic",
    targetId: topic.id,
    summary: "토론 주제 상태를 변경했습니다.",
    metadata: {
      title: topic.title,
      status: topic.status,
    },
  });

  revalidatePath("/topics");
  revalidatePath("/admin/topics");
  revalidatePath(`/topics/${topicId}`);
  revalidatePath(`/topics/${topicId}/debate`);
  revalidatePath("/admin/activity");

  redirectWithMessage(
    "/admin/topics",
    "주제 상태가 변경되었습니다.",
    "success",
  );
}

export async function updateTopic(formData: FormData) {
  const { supabase } = await requireAdmin();

  const topicId = getRequiredString(formData, "topic_id");
  const title = getRequiredString(formData, "title");
  const description = getRequiredString(formData, "description");

  const statusValue = getRequiredString(formData, "status");
  const status = getTopicStatus(statusValue);

  const athenaPosition = getNullableString(formData, "athena_position");
  const poseidonPosition = getNullableString(formData, "poseidon_position");

  if (!status) {
    redirectWithMessage(
      `/admin/topics/${topicId}/edit`,
      "올바르지 않은 주제 상태입니다.",
      "error",
    );
  }

  const startsAt = getOptionalKstDateTime(formData, "starts_at");
  const endsAt = getOptionalKstDateTime(formData, "ends_at");

  const { data: topic, error } = await supabase
    .from("topics")
    .update({
      title,
      description,
      status,
      starts_at: startsAt,
      ends_at: endsAt,
      athena_position: athenaPosition,
      poseidon_position: poseidonPosition,
    })
    .eq("id", topicId)
    .select("id, title, status")
    .single();

  if (error) {
    console.error("Update topic failed", error);
    redirectWithMessage(
      `/admin/topics/${topicId}/edit`,
      "주제를 수정하지 못했습니다. 입력 내용을 확인한 뒤 다시 시도해주세요.",
      "error",
    );
  }

  if (!topic) {
    redirectWithMessage(
      `/admin/topics/${topicId}/edit`,
      "수정된 주제 정보를 확인할 수 없습니다.",
      "error",
    );
  }

  await logAdminActivity(supabase, {
    action: "topic.updated",
    targetType: "topic",
    targetId: topic.id,
    summary: "토론 주제를 수정했습니다.",
    metadata: {
      title: topic.title,
      status: topic.status,
      starts_at: startsAt,
      ends_at: endsAt,
      athena_position: athenaPosition,
      poseidon_position: poseidonPosition,
    },
  });

  revalidatePath("/");
  revalidatePath("/topics");
  revalidatePath("/admin/topics");
  revalidatePath(`/topics/${topicId}`);
  revalidatePath(`/topics/${topicId}/debate`);
  revalidatePath(`/admin/topics/${topicId}/edit`);
  revalidatePath("/admin/activity");

  redirectWithMessage("/admin/topics", "주제가 수정되었습니다.", "success");
}

export async function archiveTopic(formData: FormData) {
  const { supabase } = await requireAdmin();

  const topicId = getRequiredString(formData, "topic_id");

  const { data: topic, error } = await supabase
    .from("topics")
    .update({
      status: "archived",
    })
    .eq("id", topicId)
    .select("id, title, status")
    .single();

  if (error) {
    console.error("Archive topic failed", error);
    redirectWithMessage(
      "/admin/topics",
      "주제를 보관 처리하지 못했습니다. 잠시 후 다시 시도해주세요.",
      "error",
    );
  }

  if (!topic) {
    redirectWithMessage(
      "/admin/topics",
      "보관 처리한 주제 정보를 확인할 수 없습니다.",
      "error",
    );
  }

  await logAdminActivity(supabase, {
    action: "topic.archived",
    targetType: "topic",
    targetId: topic.id,
    summary: "토론 주제를 보관 처리했습니다.",
    metadata: {
      title: topic.title,
      status: topic.status,
    },
  });

  revalidatePath("/topics");
  revalidatePath("/admin/topics");
  revalidatePath(`/topics/${topicId}`);
  revalidatePath(`/topics/${topicId}/debate`);
  revalidatePath("/admin/activity");

  redirectWithMessage(
    "/admin/topics",
    "주제가 보관 처리되었습니다.",
    "success",
  );
}
