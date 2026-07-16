"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/auth";

import { sendContactInquiryNotification } from "@/lib/email";


type ContactInquiry = {
  id: string;
  email: string;
  category: string;
  title: string;
  content: string;
};



function getString(formData: FormData, key: string) {
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

export async function createContactInquiry(formData: FormData) {
  const email = getString(formData, "email");
  const category = getString(formData, "category") || "general";
  const title = getString(formData, "title");
  const content = getString(formData, "content");

  const supabase = await createClient();

  const privacyAgreed = formData.get("privacy_agreed") === "on";

    if (!privacyAgreed) {
    redirectWithMessage(
        "/contact",
        "개인정보 수집 및 처리에 동의해주세요.",
        "error",
    );
    }

  const { data: inquiry, error } = await supabase.rpc("create_contact_inquiry", {
    p_email: email,
    p_category: category,
    p_title: title,
    p_content: content,
  });

  const inquiryData = inquiry as ContactInquiry | null;

  await sendContactInquiryNotification({
    inquiryId: inquiryData?.id ?? null,
    email: inquiryData?.email ?? email,
    category: inquiryData?.category ?? category,
    title: inquiryData?.title ?? title,
    content: inquiryData?.content ?? content,
  });

  if (error) {
    console.error("Create contact inquiry failed", error);
    redirectWithMessage(
      "/contact",
      "문의를 접수하지 못했습니다. 잠시 후 다시 시도해주세요.",
      "error",
    );
  }

  await sendContactInquiryNotification({
    inquiryId: inquiry?.id ?? null,
    email: inquiry?.email ?? email,
    category: inquiry?.category ?? category,
    title: inquiry?.title ?? title,
    content: inquiry?.content ?? content,
  });

  redirectWithMessage(
    "/contact",
    "문의가 접수되었습니다. 확인 후 필요한 경우 답변드리겠습니다.",
    "success",
  );
}

export async function updateContactInquiry(formData: FormData) {
  const inquiryId = getString(formData, "inquiry_id");
  const status = getString(formData, "status");
  const adminNote = getString(formData, "admin_note");

  if (!inquiryId) {
    redirectWithMessage("/admin/inquiries", "문의 정보를 찾을 수 없습니다.", "error");
  }

  const { supabase } = await requireAdmin();

  const { error } = await supabase.rpc("admin_update_contact_inquiry", {
    p_inquiry_id: inquiryId,
    p_status: status,
    p_admin_note: adminNote || null,
  });

  if (error) {
    console.error("Update contact inquiry failed", error);
    redirectWithMessage(
      "/admin/inquiries",
      "문의 상태를 변경하지 못했습니다. 잠시 후 다시 시도해주세요.",
      "error",
    );
  }

  revalidatePath("/admin/inquiries");
  revalidatePath("/admin/activity");

  redirectWithMessage("/admin/inquiries", "문의 상태를 변경했습니다.");
}
