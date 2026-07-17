"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { createAdminAuditLog } from "@/lib/casual-admin-audit-log";
import { createClient } from "@/lib/supabase/server";

type AnnouncementStatus = "active" | "draft" | "archived";
type AnnouncementTone = "info" | "warning" | "success";

function getString(formData: FormData, key: string) {
  const value = formData.get(key);

  if (typeof value !== "string") {
    return "";
  }

  return value.trim();
}

function getStatus(value: string): AnnouncementStatus {
  if (value === "active" || value === "archived") {
    return value;
  }

  return "draft";
}

function getTone(value: string): AnnouncementTone {
  if (value === "warning" || value === "success") {
    return value;
  }

  return "info";
}

function getOptionalDate(value: string, returnPath: string) {
  if (!value) {
    return null;
  }

  const parsedDate = new Date(value);

  if (Number.isNaN(parsedDate.getTime())) {
    redirectWithMessage(returnPath, "공지 노출 시각이 올바르지 않습니다.", "error");
  }

  return parsedDate.toISOString();
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

  return { supabase };
}

function revalidateAnnouncementPaths() {
  revalidatePath("/");
  revalidatePath("/topics");
  revalidatePath("/admin/announcements");
  revalidatePath("/admin/logs");
}

export async function createAnnouncement(formData: FormData) {
  const title = getString(formData, "title");
  const body = getString(formData, "body");
  const tone = getTone(getString(formData, "tone"));
  const status = getStatus(getString(formData, "status"));
  const linkLabel = String(formData.get("linkLabel") ?? "").trim();
  const linkUrl = String(formData.get("linkUrl") ?? "").trim();
  const startsAt = getOptionalDate(
    getString(formData, "startsAt"),
    "/admin/announcements",
  );
  const endsAt = getOptionalDate(
    getString(formData, "endsAt"),
    "/admin/announcements",
  );

  if (title.length < 2 || title.length > 100) {
    redirectWithMessage(
      "/admin/announcements",
      "공지 제목은 2자 이상 100자 이하로 입력해주세요.",
      "error",
    );
  }

  if (body.length < 1 || body.length > 1000) {
    redirectWithMessage(
      "/admin/announcements",
      "공지 본문은 1자 이상 1000자 이하로 입력해주세요.",
      "error",
    );
  }

  if ((linkLabel && !linkUrl) || (!linkLabel && linkUrl)) {
    redirectWithMessage(
      "/admin/announcements",
      "링크를 사용하려면 링크 문구와 링크 URL을 모두 입력해주세요.",
      "error",
    );
  }

  const { supabase } = await requireAdmin();

  const duplicateAnnouncementCutoff = new Date(
    Date.now() - 60_000,
  ).toISOString();
  const { data: duplicateAnnouncements, error: duplicateAnnouncementsError } =
    await supabase
      .from("casual_announcements")
      .select("id")
      .eq("title", title)
      .eq("body", body)
      .gt("created_at", duplicateAnnouncementCutoff)
      .limit(1);

  if (duplicateAnnouncementsError) {
    redirectWithMessage(
      "/admin/announcements",
      "공지 생성 상태를 확인하지 못했습니다. 잠시 후 다시 시도해주세요.",
      "error",
    );
  }

  if ((duplicateAnnouncements ?? []).length > 0) {
    redirectWithMessage(
      "/admin/announcements",
      "이미 같은 내용이 제출되었습니다. 잠시 후 확인해주세요.",
      "success",
    );
  }

  const { data: announcement, error } = await supabase
    .from("casual_announcements")
    .insert({
      title,
      body,
      tone,
      status,
      link_label: linkLabel,
      link_url: linkUrl,
      starts_at: startsAt,
      ends_at: endsAt,
    })
    .select("id")
    .single();

  if (error || !announcement) {
    redirectWithMessage(
      "/admin/announcements",
      error?.message ?? "공지 생성에 실패했습니다.",
      "error",
    );
  }

  await createAdminAuditLog(supabase, {
    action: "announcement_created",
    targetType: "announcement",
    targetId: announcement.id,
    message: "운영 공지를 생성했습니다.",
    metadata: {
      title,
      status,
      tone,
      starts_at: startsAt,
      ends_at: endsAt,
    },
  });

  revalidateAnnouncementPaths();

  redirectWithMessage(
    "/admin/announcements",
    "운영 공지를 생성했습니다.",
    "success",
  );
}

export async function updateAnnouncementStatus(formData: FormData) {
  const announcementId = getString(formData, "announcementId");
  const status = getStatus(getString(formData, "status"));

  if (!announcementId) {
    redirectWithMessage(
      "/admin/announcements",
      "공지 정보가 올바르지 않습니다.",
      "error",
    );
  }

  const { supabase } = await requireAdmin();

  const { data: announcement } = await supabase
    .from("casual_announcements")
    .select("id, title, tone, status")
    .eq("id", announcementId)
    .maybeSingle();

  const { error } = await supabase
    .from("casual_announcements")
    .update({ status })
    .eq("id", announcementId);

  if (error) {
    redirectWithMessage("/admin/announcements", error.message, "error");
  }

  await createAdminAuditLog(supabase, {
    action: "announcement_status_changed",
    targetType: "announcement",
    targetId: announcementId,
    message: `운영 공지 상태를 ${status}로 변경했습니다.`,
    metadata: {
      title: announcement?.title ?? null,
      previous_status: announcement?.status ?? null,
      status,
      tone: announcement?.tone ?? null,
    },
  });

  revalidateAnnouncementPaths();

  redirectWithMessage(
    "/admin/announcements",
    "공지 상태를 변경했습니다.",
    "success",
  );
}

export async function archiveAnnouncement(formData: FormData) {
  const announcementId = getString(formData, "announcementId");

  if (!announcementId) {
    redirectWithMessage(
      "/admin/announcements",
      "공지 정보가 올바르지 않습니다.",
      "error",
    );
  }

  const { supabase } = await requireAdmin();

  const { data: announcement } = await supabase
    .from("casual_announcements")
    .select("id, title, tone, status")
    .eq("id", announcementId)
    .maybeSingle();

  const { error } = await supabase
    .from("casual_announcements")
    .update({ status: "archived" })
    .eq("id", announcementId);

  if (error) {
    redirectWithMessage("/admin/announcements", error.message, "error");
  }

  await createAdminAuditLog(supabase, {
    action: "announcement_archived",
    targetType: "announcement",
    targetId: announcementId,
    message: "운영 공지를 보관 처리했습니다.",
    metadata: {
      title: announcement?.title ?? null,
      previous_status: announcement?.status ?? null,
      status: "archived",
      tone: announcement?.tone ?? null,
    },
  });

  revalidateAnnouncementPaths();

  redirectWithMessage(
    "/admin/announcements",
    "공지 보관 처리를 완료했습니다.",
    "success",
  );
}
