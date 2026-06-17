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

function getStatus(value: string) {
  if (value === "draft") {
    return "draft";
  }

  return "published";
}

function getBoolean(formData: FormData, key: string) {
  return formData.get(key) === "on";
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

export async function createNotice(formData: FormData) {
  const title = getString(formData, "title");
  const content = getString(formData, "content");
  const status = getStatus(getString(formData, "status"));
  const isPinned = getBoolean(formData, "is_pinned");

  if (title.length < 2) {
    redirectWithMessage(
      "/admin/notices/new",
      "공지 제목은 2자 이상 입력해주세요.",
      "error",
    );
  }

  if (content.length < 5) {
    redirectWithMessage(
      "/admin/notices/new",
      "공지 내용은 5자 이상 입력해주세요.",
      "error",
    );
  }

  const { supabase, user } = await getAdminUser();

  const { data, error } = await supabase
    .from("notices")
    .insert({
      title,
      content,
      status,
      is_pinned: isPinned,
      created_by: user.id,
      published_at: status === "published" ? new Date().toISOString() : null,
    })
    .select("id")
    .single();

  if (error) {
    redirectWithMessage(
      "/admin/notices/new",
      `공지를 작성하지 못했습니다: ${error.message}`,
      "error",
    );
  }

  revalidatePath("/notices");
  revalidatePath("/admin");

  redirectWithMessage(
    `/notices/${data.id}`,
    "공지가 작성되었습니다.",
    "success",
  );
}

export async function updateNotice(formData: FormData) {
  const noticeId = getString(formData, "notice_id");
  const title = getString(formData, "title");
  const content = getString(formData, "content");
  const status = getStatus(getString(formData, "status"));
  const isPinned = getBoolean(formData, "is_pinned");
  const redirectTo = getSafeRedirectTo(
    getString(formData, "redirect_to"),
    noticeId ? `/admin/notices/${noticeId}/edit` : "/admin",
  );

  if (!noticeId) {
    redirectWithMessage("/admin", "수정할 공지를 찾을 수 없습니다.", "error");
  }

  if (title.length < 2) {
    redirectWithMessage(
      redirectTo,
      "공지 제목은 2자 이상 입력해주세요.",
      "error",
    );
  }

  if (content.length < 5) {
    redirectWithMessage(
      redirectTo,
      "공지 내용은 5자 이상 입력해주세요.",
      "error",
    );
  }

  const { supabase } = await getAdminUser();

  const { data: currentNotice, error: readError } = await supabase
    .from("notices")
    .select("id, published_at")
    .eq("id", noticeId)
    .maybeSingle();

  if (readError || !currentNotice) {
    redirectWithMessage(
      "/admin",
      "수정할 공지를 찾을 수 없습니다.",
      "error",
    );
  }

  const { error } = await supabase
    .from("notices")
    .update({
      title,
      content,
      status,
      is_pinned: isPinned,
      published_at:
        status === "published"
          ? currentNotice.published_at ?? new Date().toISOString()
          : null,
    })
    .eq("id", noticeId);

  if (error) {
    redirectWithMessage(
      redirectTo,
      `공지를 수정하지 못했습니다: ${error.message}`,
      "error",
    );
  }

  revalidatePath("/notices");
  revalidatePath(`/notices/${noticeId}`);
  revalidatePath("/admin");
  revalidatePath(`/admin/notices/${noticeId}/edit`);

  redirectWithMessage(
    `/notices/${noticeId}`,
    "공지가 수정되었습니다.",
    "success",
  );
}

export async function deleteNotice(formData: FormData) {
  const noticeId = getString(formData, "notice_id");
  const redirectTo = getSafeRedirectTo(getString(formData, "redirect_to"));

  if (!noticeId) {
    redirectWithMessage(redirectTo, "삭제할 공지를 찾을 수 없습니다.", "error");
  }

  const { supabase } = await getAdminUser();

  const { error } = await supabase
    .from("notices")
    .delete()
    .eq("id", noticeId);

  if (error) {
    redirectWithMessage(
      redirectTo,
      `공지를 삭제하지 못했습니다: ${error.message}`,
      "error",
    );
  }

  revalidatePath("/notices");
  revalidatePath(`/notices/${noticeId}`);
  revalidatePath("/admin");

  redirectWithMessage(
    redirectTo,
    "공지가 삭제되었습니다.",
    "success",
  );
}