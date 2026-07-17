"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";

type InquiryCategory =
  | "general"
  | "account"
  | "bug"
  | "report"
  | "partnership"
  | "other";

const CATEGORY_VALUES = new Set<InquiryCategory>([
  "general",
  "account",
  "bug",
  "report",
  "partnership",
  "other",
]);

function getString(formData: FormData, key: string) {
  const value = formData.get(key);

  if (typeof value !== "string") {
    return "";
  }

  return value.trim();
}

function redirectWithMessage(
  message: string,
  type: "success" | "error" = "success",
): never {
  const params = new URLSearchParams({ message, type });

  redirect(`/contact?${params.toString()}`);
}

function getCategory(value: string): InquiryCategory {
  if (CATEGORY_VALUES.has(value as InquiryCategory)) {
    return value as InquiryCategory;
  }

  return "general";
}

function isValidEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

export async function createInquiry(formData: FormData) {
  const website = getString(formData, "website");

  if (website) {
    redirectWithMessage("문의가 접수되었습니다.", "success");
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  let profileName = "";

  if (user) {
    const { data: profile } = await supabase
      .from("casual_profiles")
      .select("nickname")
      .eq("user_id", user.id)
      .maybeSingle();

    profileName = profile?.nickname ?? "";
  }

  const name = getString(formData, "name") || profileName;
  const email = (getString(formData, "email") || user?.email || "").toLowerCase();
  const category = getCategory(getString(formData, "category"));
  const subject = getString(formData, "subject");
  const body = getString(formData, "body");

  if (!email) {
    redirectWithMessage("답변을 받을 이메일을 입력해주세요.", "error");
  }

  if (!isValidEmail(email)) {
    redirectWithMessage("이메일 형식이 올바르지 않습니다.", "error");
  }

  if (subject.length < 1 || subject.length > 100) {
    redirectWithMessage(
      "문의 제목은 1자 이상 100자 이하로 입력해주세요.",
      "error",
    );
  }

  if (body.length < 10 || body.length > 2000) {
    redirectWithMessage(
      "문의 내용은 10자 이상 2000자 이하로 입력해주세요.",
      "error",
    );
  }

  const recentThreshold = new Date(Date.now() - 60_000).toISOString();
  const recentQuery = supabase
    .from("casual_inquiries")
    .select("id")
    .gt("created_at", recentThreshold)
    .limit(1);

  if (user) {
    recentQuery.eq("user_id", user.id);
  } else {
    recentQuery.eq("email", email);
  }

  const { data: recentInquiries, error: recentError } = await recentQuery;

  if (recentError) {
    redirectWithMessage(
      "문의 제출 상태를 확인하지 못했습니다. 잠시 후 다시 시도해주세요.",
      "error",
    );
  }

  if ((recentInquiries ?? []).length > 0) {
    redirectWithMessage(
      "문의를 너무 빠르게 제출하고 있습니다. 잠시 후 다시 시도해주세요.",
      "error",
    );
  }

  const { error } = await supabase.from("casual_inquiries").insert({
    user_id: user?.id ?? null,
    name,
    email,
    category,
    subject,
    body,
    status: "open",
  });

  if (error) {
    console.error("Failed to create casual inquiry:", error.message);
    redirectWithMessage(
      "문의 접수에 실패했습니다. 잠시 후 다시 시도해주세요.",
      "error",
    );
  }

  revalidatePath("/contact");
  revalidatePath("/admin/inquiries");

  redirectWithMessage("문의가 접수되었습니다.", "success");
}
