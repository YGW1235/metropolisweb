"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import {
  getCasualUserRestrictionMessage,
  getCasualUserStatus,
} from "@/lib/casual-user-status";
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

  const { status, errorMessage } = await getCasualUserStatus(
    supabase,
    user.id,
  );

  if (errorMessage) {
    redirectWithMessage(returnTo, errorMessage, "error");
  }

  const restrictionMessage = getCasualUserRestrictionMessage(
    status,
    "participation",
  );

  if (restrictionMessage) {
    redirectWithMessage(returnTo, restrictionMessage, "error");
  }

  const { data: openReports, error: openReportsError } = await supabase
    .from("casual_reports")
    .select("id")
    .eq("reporter_id", user.id)
    .eq("target_type", targetType)
    .eq("target_id", targetId)
    .eq("status", "open")
    .limit(1);

  if (openReportsError) {
    redirectWithMessage(
      returnTo,
      "신고 상태를 확인하지 못했습니다. 잠시 후 다시 시도해주세요.",
      "error",
    );
  }

  if ((openReports ?? []).length > 0) {
    redirectWithMessage(
      returnTo,
      "이미 접수된 신고입니다. 관리자가 확인 중입니다.",
      "error",
    );
  }

  const reportRateLimitCutoff = new Date(Date.now() - 60_000).toISOString();

  const { data: duplicateReports, error: duplicateReportsError } =
    await supabase
      .from("casual_reports")
      .select("id")
      .eq("reporter_id", user.id)
      .eq("target_type", targetType)
      .eq("target_id", targetId)
      .eq("reason", reason)
      .eq("details", details)
      .gt("created_at", reportRateLimitCutoff)
      .limit(1);

  if (duplicateReportsError) {
    redirectWithMessage(
      returnTo,
      "신고 상태를 확인하지 못했습니다. 잠시 후 다시 시도해주세요.",
      "error",
    );
  }

  if ((duplicateReports ?? []).length > 0) {
    redirectWithMessage(
      returnTo,
      "이미 같은 내용이 제출되었습니다. 잠시 후 확인해주세요.",
      "success",
    );
  }

  const { data: recentReports, error: recentReportsError } = await supabase
    .from("casual_reports")
    .select("id")
    .eq("reporter_id", user.id)
    .gt("created_at", reportRateLimitCutoff)
    .limit(1);

  if (recentReportsError) {
    redirectWithMessage(
      returnTo,
      "신고 상태를 확인하지 못했습니다. 잠시 후 다시 시도해주세요.",
      "error",
    );
  }

  if ((recentReports ?? []).length > 0) {
    redirectWithMessage(
      returnTo,
      "신고를 너무 빠르게 제출하고 있습니다. 잠시 후 다시 시도해주세요.",
      "error",
    );
  }

  const { error } = await supabase.from("casual_reports").insert({
    reporter_id: user.id,
    target_type: targetType,
    target_id: targetId,
    reason,
    details,
  });

  if (error) {
    console.error("Failed to create casual report:", error.message);
    redirectWithMessage(
      returnTo,
      "신고 접수에 실패했습니다. 잠시 후 다시 시도해주세요.",
      "error",
    );
  }

  revalidatePath("/admin/reports");

  redirectWithMessage(returnTo, "신고가 접수되었습니다.", "success");
}
