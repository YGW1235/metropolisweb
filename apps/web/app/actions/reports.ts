"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

function getRequiredString(formData: FormData, key: string) {
  const value = formData.get(key);

  if (typeof value !== "string" || value.trim() === "") {
    throw new Error(`${key} 값이 필요합니다.`);
  }

  return value.trim();
}

function getOptionalString(formData: FormData, key: string) {
  const value = formData.get(key);

  if (typeof value !== "string" || value.trim() === "") {
    return null;
  }

  return value.trim();
}

export async function createReport(formData: FormData) {
  const topicId = getRequiredString(formData, "topic_id");
  const targetType = getRequiredString(formData, "target_type");
  const targetId = getRequiredString(formData, "target_id");
  const reason = getRequiredString(formData, "reason");
  const detail = getOptionalString(formData, "detail");
  const anchor = getOptionalString(formData, "anchor");

  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect(`/login?message=${encodeURIComponent("로그인 후 신고할 수 있습니다.")}`);
  }

  const { error } = await supabase.rpc("create_report", {
    p_target_type: targetType,
    p_target_id: targetId,
    p_reason: reason,
    p_detail: detail,
  });

  if (error) {
    redirect(
      `/topics/${topicId}/debate?message=${encodeURIComponent(error.message)}${
        anchor ? `#${anchor}` : ""
      }`,
    );
  }

  revalidatePath(`/topics/${topicId}/debate`);
  revalidatePath("/admin/reports");

  redirect(
    `/topics/${topicId}/debate?message=${encodeURIComponent("신고가 접수되었습니다.")}${
      anchor ? `#${anchor}` : ""
    }`,
  );
}