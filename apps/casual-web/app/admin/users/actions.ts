"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";

type ModerationStatus = "active" | "limited" | "suspended";

function getString(formData: FormData, key: string) {
  const value = formData.get(key);

  if (typeof value !== "string") {
    return "";
  }

  return value.trim();
}

function getModerationStatus(value: string): ModerationStatus {
  if (value === "limited" || value === "suspended") {
    return value;
  }

  return "active";
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

  return { supabase };
}

export async function updateUserModeration(formData: FormData) {
  const userId = getString(formData, "userId");
  const status = getModerationStatus(getString(formData, "status"));
  const reason = getString(formData, "reason");
  const expiresAtRaw = getString(formData, "expiresAt");

  if (!userId) {
    redirectWithMessage(
      "/admin/users",
      "유저 정보가 올바르지 않습니다.",
      "error",
    );
  }

  let expiresAt: string | null = null;

  if (expiresAtRaw) {
    const parsedExpiresAt = new Date(expiresAtRaw);

    if (Number.isNaN(parsedExpiresAt.getTime())) {
      redirectWithMessage(
        "/admin/users",
        "만료 시각이 올바르지 않습니다.",
        "error",
      );
    }

    expiresAt = parsedExpiresAt.toISOString();
  }

  const { supabase } = await requireAdmin();

  const { error } = await supabase.rpc("set_casual_user_moderation", {
    p_user_id: userId,
    p_status: status,
    p_reason: reason || null,
    p_expires_at: expiresAt,
  });

  if (error) {
    redirectWithMessage("/admin/users", error.message, "error");
  }

  revalidatePath("/admin/users");
  revalidatePath("/me");

  redirectWithMessage("/admin/users", "유저 제재 상태를 저장했습니다.", "success");
}
