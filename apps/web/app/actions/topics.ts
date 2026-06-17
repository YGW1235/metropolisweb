"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";

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

  const { data: topic, error: topicError } = await supabase
    .from("topics")
    .select("id, status")
    .eq("id", topicId)
    .single();

  if (topicError || !topic) {
    redirectWithMessage("/topics", "의제를 찾을 수 없습니다.", "error");
  }

  if (topic.status !== "open" && topic.status !== "active") {
    redirectWithMessage(
      `/topics/${topicId}`,
      "현재 참여할 수 없는 의제입니다.",
      "error",
    );
  }

  const { data: existingParticipation } = await supabase
    .from("topic_participants")
    .select("assigned_side")
    .eq("topic_id", topicId)
    .eq("user_id", user.id)
    .maybeSingle();

  if (existingParticipation?.assigned_side) {
    redirectWithMessage(
      `/topics/${topicId}/debate`,
      "이미 이 의제에 참여 중입니다.",
      "success",
    );
  }

  const { count: proCount } = await supabase
    .from("topic_participants")
    .select("*", { count: "exact", head: true })
    .eq("topic_id", topicId)
    .eq("assigned_side", "pro");

  const { count: conCount } = await supabase
    .from("topic_participants")
    .select("*", { count: "exact", head: true })
    .eq("topic_id", topicId)
    .eq("assigned_side", "con");

  const selectedSide: "pro" | "con" =
    joinSide === "auto"
      ? (proCount ?? 0) <= (conCount ?? 0)
        ? "pro"
        : "con"
      : joinSide;

  const { count: selectedSideCount } = await supabase
    .from("topic_participants")
    .select("*", { count: "exact", head: true })
    .eq("topic_id", topicId)
    .eq("assigned_side", selectedSide);

  const sideIndex = (selectedSideCount ?? 0) + 1;

  const { error: insertError } = await supabase
    .from("topic_participants")
    .insert({
      topic_id: topicId,
      user_id: user.id,
      assigned_side: selectedSide,
      side_index: sideIndex,
    });

  if (insertError) {
    redirectWithMessage(`/topics/${topicId}`, insertError.message, "error");
  }

  revalidatePath("/topics");
  revalidatePath(`/topics/${topicId}`);
  revalidatePath(`/topics/${topicId}/debate`);

  const message =
    joinSide === "auto"
      ? `자동 배정으로 ${getSideName(selectedSide)} 진영에 참여했습니다.`
      : `${getSideName(selectedSide)} 진영에 참여했습니다.`;

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

  const { error } = await supabase.from("topics").insert({
    title,
    description,
    status,
    starts_at: startsAt,
    ends_at: endsAt,
    created_by: user.id,
    athena_position: athenaPosition,
    poseidon_position: poseidonPosition,
  });

  if (error) {
    redirectWithMessage("/admin/topics/new", error.message, "error");
  }

  revalidatePath("/");
  revalidatePath("/topics");
  revalidatePath("/admin/topics");

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

  const { error } = await supabase
    .from("topics")
    .update({
      status,
    })
    .eq("id", topicId);

  if (error) {
    redirectWithMessage("/admin/topics", error.message, "error");
  }

  revalidatePath("/topics");
  revalidatePath("/admin/topics");
  revalidatePath(`/topics/${topicId}`);
  revalidatePath(`/topics/${topicId}/debate`);

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

  const { error } = await supabase
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
    .eq("id", topicId);

  if (error) {
    redirectWithMessage(
      `/admin/topics/${topicId}/edit`,
      error.message,
      "error",
    );
  }

  revalidatePath("/");
  revalidatePath("/topics");
  revalidatePath("/admin/topics");
  revalidatePath(`/topics/${topicId}`);
  revalidatePath(`/topics/${topicId}/debate`);
  revalidatePath(`/admin/topics/${topicId}/edit`);

  redirectWithMessage("/admin/topics", "주제가 수정되었습니다.", "success");
}

export async function archiveTopic(formData: FormData) {
  const { supabase } = await requireAdmin();

  const topicId = getRequiredString(formData, "topic_id");

  const { error } = await supabase
    .from("topics")
    .update({
      status: "archived",
    })
    .eq("id", topicId);

  if (error) {
    redirectWithMessage("/admin/topics", error.message, "error");
  }

  revalidatePath("/topics");
  revalidatePath("/admin/topics");
  revalidatePath(`/topics/${topicId}`);
  revalidatePath(`/topics/${topicId}/debate`);

  redirectWithMessage(
    "/admin/topics",
    "주제가 보관 처리되었습니다.",
    "success",
  );
}