"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";

type TopicStatus = "draft" | "active" | "closed" | "archived";

function getString(formData: FormData, key: string) {
  const value = formData.get(key);

  if (typeof value !== "string") {
    return "";
  }

  return value.trim();
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

async function requireAdmin() {
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
    redirectWithMessage("/", "관리자 권한이 필요합니다.", "error");
  }

  return {
    supabase,
    user,
  };
}

export async function createTopic(formData: FormData) {
  const title = getString(formData, "title");
  const description = getString(formData, "description");
  const optionA = getString(formData, "optionA");
  const optionB = getString(formData, "optionB");
  const status = getStatus(getString(formData, "status"));
  const isToday = formData.get("isToday") === "on";

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

  if (isToday) {
    await supabase
      .from("casual_topics")
      .update({ is_today: false })
      .eq("is_today", true);
  }

  const { error } = await supabase.from("casual_topics").insert({
    title,
    description,
    option_a: optionA,
    option_b: optionB,
    status,
    is_today: isToday,
    created_by: user.id,
  });

  if (error) {
    redirectWithMessage("/admin/topics", error.message, "error");
  }

  revalidatePath("/");
  revalidatePath("/topics");
  revalidatePath("/admin/topics");

  redirectWithMessage("/admin/topics", "주제를 생성했습니다.", "success");
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

  revalidatePath("/");
  revalidatePath("/topics");
  revalidatePath(`/topics/${topicId}`);
  revalidatePath("/admin/topics");

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

  revalidatePath("/");
  revalidatePath("/topics");
  revalidatePath(`/topics/${topicId}`);
  revalidatePath("/admin/topics");

  redirectWithMessage("/admin/topics", "주제 상태를 변경했습니다.", "success");
}