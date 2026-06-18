"use server";

import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";

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

export async function requestAccountDeletion(formData: FormData) {
  const confirmText = getString(formData, "confirm_text");
  const reason = getString(formData, "reason");
  const agreed = formData.get("confirm_delete") === "on";

  if (!agreed) {
    redirectWithMessage(
      "/me/delete",
      "계정 탈퇴 안내를 확인하고 동의해주세요.",
      "error",
    );
  }

  if (confirmText !== "탈퇴합니다") {
    redirectWithMessage(
      "/me/delete",
      "확인 문구를 정확히 입력해주세요.",
      "error",
    );
  }

  const supabase = await createClient();

  const { error } = await supabase.rpc("request_account_deletion", {
    p_reason: reason || null,
  });

  if (error) {
    redirectWithMessage("/me/delete", error.message, "error");
  }

  await supabase.auth.signOut();

  redirectWithMessage(
    "/login",
    "계정 탈퇴가 완료되었습니다. 그동안 이용해주셔서 감사합니다.",
    "success",
  );
}