"use server";

import { revalidatePath } from "next/cache";
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
) {
  const params = new URLSearchParams({
    message,
    type,
  });

  redirect(`${path}?${params.toString()}`);
}

export async function updateProfile(formData: FormData) {
  const displayName = getString(formData, "display_name");

  if (displayName.length > 32) {
    redirectWithMessage(
      "/settings/profile",
      "표시 이름은 32자 이하로 입력해주세요.",
      "error",
    );
  }

  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect(`/login?message=${encodeURIComponent("로그인 후 이용할 수 있습니다.")}`);
  }

  const { error } = await supabase
    .from("profiles")
    .update({
      display_name: displayName || null,
    })
    .eq("id", user.id);

  if (error) {
    console.error("Profile update failed", error);
    redirectWithMessage(
      "/settings/profile",
      "프로필을 저장하지 못했습니다. 잠시 후 다시 시도해주세요.",
      "error",
    );
  }

  revalidatePath("/me");
  revalidatePath("/settings/profile");

  redirectWithMessage(
    "/settings/profile",
    "프로필이 저장되었습니다.",
    "success",
  );
}
