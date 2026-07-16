"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";

function getString(formData: FormData, key: string) {
  const value = formData.get(key);

  if (typeof value !== "string") {
    return "";
  }

  return value.trim();
}

function getSafeRedirectTo(value: string, fallback = "/admin") {
  if (!value) {
    return fallback;
  }

  if (!value.startsWith("/") || value.startsWith("//")) {
    return fallback;
  }

  return value;
}

function redirectWithMessage(
  path: string,
  message: string,
  type: "success" | "error" = "success",
): never {
  const [pathname, queryString] = path.split("?");
  const params = new URLSearchParams(queryString ?? "");

  params.set("message", message);
  params.set("type", type);

  redirect(`${pathname}?${params.toString()}`);
}

async function getAdminUser() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect(
      `/login?message=${encodeURIComponent(
        "관리자 기능은 로그인 후 이용할 수 있습니다.",
      )}&redirectTo=${encodeURIComponent("/admin")}`,
    );
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role, status")
    .eq("id", user.id)
    .maybeSingle();

  if (profile?.role !== "admin" || profile?.status !== "active") {
    redirectWithMessage(
      "/",
      "관리자만 이용할 수 있는 기능입니다.",
      "error",
    );
  }

  return {
    supabase,
    user,
  };
}

export async function deleteTopic(formData: FormData) {
  const topicId = getString(formData, "topic_id");
  const redirectTo = getSafeRedirectTo(getString(formData, "redirect_to"));

  if (!topicId) {
    redirectWithMessage(
      redirectTo,
      "삭제할 주제를 찾을 수 없습니다.",
      "error",
    );
  }

  const { supabase, user } = await getAdminUser();

  const { data: topic, error: readError } = await supabase
    .from("topics")
    .select("id, title, deleted_at")
    .eq("id", topicId)
    .maybeSingle();

  if (readError || !topic) {
    redirectWithMessage(
      redirectTo,
      "삭제할 주제를 찾을 수 없습니다.",
      "error",
    );
  }

  if (topic.deleted_at) {
    redirectWithMessage(
      redirectTo,
      "이미 삭제된 주제입니다.",
      "error",
    );
  }

  const { error } = await supabase
    .from("topics")
    .update({
      deleted_at: new Date().toISOString(),
      deleted_by: user.id,
    })
    .eq("id", topicId);

  if (error) {
    console.error("Delete topic failed", error);
    redirectWithMessage(
      redirectTo,
      "주제를 삭제하지 못했습니다. 잠시 후 다시 시도해주세요.",
      "error",
    );
  }

  revalidatePath("/");
  revalidatePath("/topics");
  revalidatePath(`/topics/${topicId}`);
  revalidatePath(`/topics/${topicId}/debate`);
  revalidatePath("/admin");

  redirectWithMessage(
    redirectTo,
    "주제가 삭제되었습니다.",
    "success",
  );
}
