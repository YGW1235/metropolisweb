"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { requireAdmin } from "@/lib/auth";

function getRequiredString(formData: FormData, key: string) {
  const value = formData.get(key);

  if (typeof value !== "string" || value.trim().length === 0) {
    throw new Error(`${key} 값이 필요합니다.`);
  }

  return value.trim();
}

function getOptionalString(formData: FormData, key: string) {
  const value = formData.get(key);

  if (typeof value !== "string") {
    return "";
  }

  return value.trim();
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

export async function setReportTargetAuthorStatus(formData: FormData) {
  const reportId = getRequiredString(formData, "report_id");
  const status = getRequiredString(formData, "status");
  const reason = getOptionalString(formData, "reason");

  if (status !== "active" && status !== "suspended") {
    redirectWithMessage(
      "/admin/reports",
      "변경할 수 없는 유저 상태입니다.",
      "error",
    );
  }

  const { supabase } = await requireAdmin();

  const { error } = await supabase.rpc(
    "admin_set_report_target_author_status",
    {
      p_report_id: reportId,
      p_status: status,
      p_reason: reason || null,
    },
  );

  if (error) {
    redirectWithMessage("/admin/reports", error.message, "error");
  }

  revalidatePath("/admin/reports");

  if (status === "suspended") {
    redirectWithMessage("/admin/reports", "신고 대상 작성자를 정지했습니다.");
  }

  redirectWithMessage("/admin/reports", "신고 대상 작성자를 복구했습니다.");
}

export async function setUserStatus(formData: FormData) {
  const userId = getRequiredString(formData, "user_id");
  const status = getRequiredString(formData, "status");
  const reason = getOptionalString(formData, "reason");

  if (status !== "active" && status !== "suspended") {
    redirectWithMessage(
      "/admin/users",
      "변경할 수 없는 유저 상태입니다.",
      "error",
    );
  }

  const { supabase } = await requireAdmin();

  const { error } = await supabase.rpc("admin_set_user_status", {
    p_user_id: userId,
    p_status: status,
    p_reason: reason || null,
  });

  if (error) {
    redirectWithMessage("/admin/users", error.message, "error");
  }

  revalidatePath("/admin/users");
  revalidatePath("/admin/reports");

  if (status === "suspended") {
    redirectWithMessage("/admin/users", "유저를 정지했습니다.");
  }

  redirectWithMessage("/admin/users", "유저를 복구했습니다.");
}