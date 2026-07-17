"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { createAdminAuditLog } from "@/lib/casual-admin-audit-log";
import { createClient } from "@/lib/supabase/server";

type InquiryStatus = "open" | "in_progress" | "resolved" | "archived";

const INQUIRY_STATUSES = new Set<InquiryStatus>([
  "open",
  "in_progress",
  "resolved",
  "archived",
]);

function getString(formData: FormData, key: string) {
  const value = formData.get(key);

  if (typeof value !== "string") {
    return "";
  }

  return value.trim();
}

function getStatus(value: string): InquiryStatus {
  if (INQUIRY_STATUSES.has(value as InquiryStatus)) {
    return value as InquiryStatus;
  }

  return "open";
}

function redirectWithMessage(
  path: string,
  message: string,
  type: "success" | "error" = "success",
): never {
  const params = new URLSearchParams({ message, type });

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

  return { supabase, user };
}

export async function updateInquiryStatus(formData: FormData) {
  const inquiryId = getString(formData, "inquiryId");
  const status = getStatus(getString(formData, "status"));
  const adminNote = getString(formData, "adminNote");
  const returnPath = getString(formData, "returnPath") || "/admin/inquiries";

  if (!inquiryId) {
    redirectWithMessage(returnPath, "문의 정보가 올바르지 않습니다.", "error");
  }

  const { supabase, user } = await requireAdmin();

  const { data: inquiry } = await supabase
    .from("casual_inquiries")
    .select("id, category, subject, status")
    .eq("id", inquiryId)
    .maybeSingle();

  const { error } = await supabase
    .from("casual_inquiries")
    .update({
      status,
      admin_note: adminNote,
      handled_by: user.id,
      handled_at: new Date().toISOString(),
    })
    .eq("id", inquiryId);

  if (error) {
    console.error("Failed to update casual inquiry:", error.message);
    redirectWithMessage(
      returnPath,
      "문의 상태 저장에 실패했습니다.",
      "error",
    );
  }

  await createAdminAuditLog(supabase, {
    action: "inquiry_status_changed",
    targetType: "inquiry",
    targetId: inquiryId,
    message: `문의 상태를 ${status}로 변경했습니다.`,
    metadata: {
      status,
      adminNote: adminNote || null,
      category: inquiry?.category ?? null,
      subject: inquiry?.subject ?? null,
      previous_status: inquiry?.status ?? null,
    },
  });

  revalidatePath("/admin/inquiries");
  revalidatePath("/admin/logs");

  redirectWithMessage(returnPath, "문의 상태를 저장했습니다.", "success");
}
