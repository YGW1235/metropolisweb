"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";

function getRawString(formData: FormData, key: string) {
  const value = formData.get(key);

  if (typeof value !== "string") {
    return "";
  }

  return value;
}

function redirectWithMessage(
  path: string,
  message: string,
  type: "success" | "error" = "success",
): never {
  const params = new URLSearchParams({ message, type });

  redirect(`${path}?${params.toString()}`);
}

export async function updatePassword(formData: FormData) {
  const password = getRawString(formData, "password");
  const passwordConfirm = getRawString(formData, "passwordConfirm");

  if (!password || !passwordConfirm) {
    redirectWithMessage(
      "/reset-password",
      "새 비밀번호와 비밀번호 확인을 입력해주세요.",
      "error",
    );
  }

  if (password.length < 8 || password.length > 72) {
    redirectWithMessage(
      "/reset-password",
      "비밀번호는 8자 이상 72자 이하로 입력해주세요.",
      "error",
    );
  }

  if (password !== passwordConfirm) {
    redirectWithMessage(
      "/reset-password",
      "비밀번호가 일치하지 않습니다.",
      "error",
    );
  }

  const supabase = await createClient();
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    if (userError) {
      console.error("Failed to read password reset session:", userError.message);
    }

    redirectWithMessage(
      "/forgot-password",
      "재설정 링크가 만료되었거나 올바르지 않습니다. 다시 요청해주세요.",
      "error",
    );
  }

  const { error } = await supabase.auth.updateUser({
    password,
  });

  if (error) {
    console.error("Failed to update casual user password:", error.message);
    redirectWithMessage(
      "/reset-password",
      "비밀번호를 변경하지 못했습니다. 잠시 후 다시 시도해주세요.",
      "error",
    );
  }

  await supabase.auth.signOut();

  revalidatePath("/", "layout");
  redirectWithMessage(
    "/login",
    "비밀번호가 변경되었습니다. 새 비밀번호로 로그인해주세요.",
    "success",
  );
}
