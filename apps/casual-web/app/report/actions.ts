"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";

type TargetType = "topic" | "opinion" | "comment";

function getString(formData: FormData, key: string) {
  const value = formData.get(key);

  if (typeof value !== "string") {
    return "";
  }

  return value.trim();
}

function getTargetType(value: string): TargetType | null {
  if (value === "topic" || value === "opinion" || value === "comment") {
    return value;
  }

  return null;
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

  const separator = path.includes("?") ? "&" : "?";

  redirect(`${path}${separator}${params.toString()}`);
}

export async function createReport(formData: FormData) {
  const targetTypeRaw = getString(formData, "targetType");
  const targetType = getTargetType(targetTypeRaw);
  const targetId = getString(formData, "targetId");
  const reason = getString(formData, "reason");
  const details = getString(formData, "details");
  const returnTo = getString(formData, "returnTo") || "/topics";

  if (!targetType || !targetId) {
    redirectWithMessage(returnTo, "신고 대상 정보가 올바르지 않습니다.", "error");
  }

  if (!reason) {
    redirectWithMessage(
      `/report?targetType=${targetType}&targetId=${targetId}&returnTo=${encodeURIComponent(
        returnTo,
      )}`,
      "신고 사유를 선택해주세요.",
      "error",
    );
  }

  if (details.length > 500) {
    redirectWithMessage(
      `/report?targetType=${targetType}&targetId=${targetId}&returnTo=${encodeURIComponent(
        returnTo,
      )}`,
      "상세 내용은 500자 이하로 입력해주세요.",
      "error",
    );
  }

  const supabase = await createClient();

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    redirectWithMessage("/login", "신고하려면 로그인이 필요합니다.", "error");
  }

  const { error } = await supabase.from("casual_reports").insert({
    reporter_id: user.id,
    target_type: targetType,
    target_id: targetId,
    reason,
    details,
  });

  if (error) {
    redirectWithMessage(returnTo, error.message, "error");
  }

  revalidatePath("/admin/reports");

  redirectWithMessage(returnTo, "신고가 접수되었습니다.", "success");
}