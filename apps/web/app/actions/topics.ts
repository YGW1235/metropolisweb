"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

const TOPIC_STATUSES = ["draft", "open", "active", "closed", "archived"] as const;

function getRequiredString(formData: FormData, key: string) {
  const value = formData.get(key);

  if (typeof value !== "string" || value.trim() === "") {
    throw new Error(`${key} 값이 필요합니다.`);
  }

  return value.trim();
}

function getOptionalKstDateTime(formData: FormData, key: string) {
  const value = formData.get(key);

  if (typeof value !== "string" || value.trim() === "") {
    return null;
  }

  // input type="datetime-local" 값 예시: 2026-06-10T19:30
  // MVP에서는 한국 시간 기준으로 저장합니다.
  return new Date(`${value}:00+09:00`).toISOString();
}

async function requireAdmin() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role, status")
    .eq("id", user.id)
    .single();

  if (profile?.role !== "admin" || profile?.status !== "active") {
    redirect("/admin?message=관리자 권한이 필요합니다.");
  }

  return { supabase, user };
}

export async function createTopic(formData: FormData) {
  const { supabase, user } = await requireAdmin();

  const title = getRequiredString(formData, "title");
  const description = getRequiredString(formData, "description");

  const statusValue = formData.get("status");
  const status =
    typeof statusValue === "string" &&
    TOPIC_STATUSES.includes(statusValue as (typeof TOPIC_STATUSES)[number])
      ? statusValue
      : "draft";

  const startsAt = getOptionalKstDateTime(formData, "starts_at");
  const endsAt = getOptionalKstDateTime(formData, "ends_at");

  const { error } = await supabase.from("topics").insert({
    title,
    description,
    status,
    starts_at: startsAt,
    ends_at: endsAt,
    created_by: user.id,
  });

  if (error) {
    redirect(`/admin/topics/new?message=${encodeURIComponent(error.message)}`);
  }

  revalidatePath("/topics");
  revalidatePath("/admin/topics");

  redirect("/admin/topics");
}

export async function updateTopicStatus(formData: FormData) {
  const { supabase } = await requireAdmin();

  const topicId = getRequiredString(formData, "topic_id");
  const statusValue = getRequiredString(formData, "status");

  if (
    !TOPIC_STATUSES.includes(
      statusValue as (typeof TOPIC_STATUSES)[number],
    )
  ) {
    redirect(
      `/admin/topics?message=${encodeURIComponent(
        "올바르지 않은 주제 상태입니다.",
      )}`,
    );
  }

  const { error } = await supabase
    .from("topics")
    .update({
      status: statusValue,
    })
    .eq("id", topicId);

  if (error) {
    redirect(`/admin/topics?message=${encodeURIComponent(error.message)}`);
  }

  revalidatePath("/topics");
  revalidatePath("/admin/topics");
  revalidatePath(`/topics/${topicId}`);
  revalidatePath(`/topics/${topicId}/debate`);

  redirect(
    `/admin/topics?message=${encodeURIComponent(
      "주제 상태가 변경되었습니다.",
    )}`,
  );
}

export async function updateTopic(formData: FormData) {
  const { supabase } = await requireAdmin();

  const topicId = getRequiredString(formData, "topic_id");
  const title = getRequiredString(formData, "title");
  const description = getRequiredString(formData, "description");

  const statusValue = getRequiredString(formData, "status");

  if (
    !TOPIC_STATUSES.includes(
      statusValue as (typeof TOPIC_STATUSES)[number],
    )
  ) {
    redirect(
      `/admin/topics/${topicId}/edit?message=${encodeURIComponent(
        "올바르지 않은 주제 상태입니다.",
      )}`,
    );
  }

  const startsAt = getOptionalKstDateTime(formData, "starts_at");
  const endsAt = getOptionalKstDateTime(formData, "ends_at");

  const { error } = await supabase
    .from("topics")
    .update({
      title,
      description,
      status: statusValue,
      starts_at: startsAt,
      ends_at: endsAt,
    })
    .eq("id", topicId);

  if (error) {
    redirect(
      `/admin/topics/${topicId}/edit?message=${encodeURIComponent(
        error.message,
      )}`,
    );
  }

  revalidatePath("/topics");
  revalidatePath("/admin/topics");
  revalidatePath(`/topics/${topicId}`);
  revalidatePath(`/topics/${topicId}/debate`);
  revalidatePath(`/admin/topics/${topicId}/edit`);

  redirect(
    `/admin/topics?message=${encodeURIComponent(
      "주제가 수정되었습니다.",
    )}`,
  );
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
    redirect(`/admin/topics?message=${encodeURIComponent(error.message)}`);
  }

  revalidatePath("/topics");
  revalidatePath("/admin/topics");
  revalidatePath(`/topics/${topicId}`);
  revalidatePath(`/topics/${topicId}/debate`);

  redirect(
    `/admin/topics?message=${encodeURIComponent(
      "주제가 보관 처리되었습니다.",
    )}`,
  );
}