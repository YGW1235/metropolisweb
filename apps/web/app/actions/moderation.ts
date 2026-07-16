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

export async function moderateReport(formData: FormData) {
  const reportId = getRequiredString(formData, "report_id");
  const action = getRequiredString(formData, "action");
  const topicId = getRequiredString(formData, "topic_id");

  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const noteValue = formData.get("note");
  const note = typeof noteValue === "string" ? noteValue.trim() : "";

  const { error } = await supabase.rpc("moderate_report", {
    p_report_id: reportId,
    p_action: action,
    p_note: note || null,
  });

  if (error) {
    console.error("Moderate report failed", error);
    redirect(
      `/admin/reports?message=${encodeURIComponent(
        "신고 처리에 실패했습니다. 잠시 후 다시 시도해주세요.",
      )}&type=error`,
    );
  }

  revalidatePath("/admin/reports");
  revalidatePath(`/topics/${topicId}/debate`);

  redirect("/admin/reports");
}
