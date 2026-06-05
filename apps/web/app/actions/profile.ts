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

export async function updateMyProfile(formData: FormData) {
  const displayName = getRequiredString(formData, "display_name");

  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect(`/login?message=${encodeURIComponent("로그인 후 이용할 수 있습니다.")}`);
  }

  const { error } = await supabase.rpc("update_my_profile", {
    p_display_name: displayName,
  });

  if (error) {
    redirect(
      `/settings/profile?message=${encodeURIComponent(error.message)}`,
    );
  }

  revalidatePath("/me");
  revalidatePath("/settings/profile");

  redirect(
    `/settings/profile?message=${encodeURIComponent(
      "프로필이 수정되었습니다.",
    )}`,
  );
}