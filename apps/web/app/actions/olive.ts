"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";

function getString(formData: FormData | undefined, key: string) {
  if (!formData) {
    return "";
  }

  const value = formData.get(key);

  if (typeof value !== "string") {
    return "";
  }

  return value.trim();
}

function getSafeRedirectTo(value: string) {
  if (!value) {
    return "/me";
  }

  if (!value.startsWith("/") || value.startsWith("//")) {
    return "/me";
  }

  return value;
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

export async function waterOlive(formData?: FormData) {
  const redirectTo = getSafeRedirectTo(getString(formData, "redirect_to"));

  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect(
      `/login?message=${encodeURIComponent(
        "로그인 후 올리브 가지에 물을 줄 수 있습니다.",
      )}&redirectTo=${encodeURIComponent(redirectTo)}`,
    );
  }

  const { data, error } = await supabase.rpc("water_olive");

  if (error) {
    redirectWithMessage(
      redirectTo,
      `올리브 가지에 물을 주지 못했습니다: ${error.message}`,
      "error",
    );
  }

  const result = Array.isArray(data) ? data[0] : null;

  revalidatePath("/me");
  revalidatePath("/olive");

  if (result?.already_watered) {
    redirectWithMessage(
      redirectTo,
      "오늘은 이미 올리브 가지에 물을 주었습니다. 내일 다시 찾아와 주세요.",
      "success",
    );
  }

  redirectWithMessage(
    redirectTo,
    `올리브 가지에 물을 주었습니다. 연속 ${result?.streak_count ?? 1}일째입니다.`,
    "success",
  );
}