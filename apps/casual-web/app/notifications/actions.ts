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
): never {
  const params = new URLSearchParams({
    message,
    type,
  });

  redirect(`${path}?${params.toString()}`);
}

async function requireUser() {
  const supabase = await createClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    redirectWithMessage("/login", "로그인이 필요합니다.", "error");
  }

  return { supabase, user };
}

function revalidateNotificationSurfaces() {
  revalidatePath("/");
  revalidatePath("/me");
  revalidatePath("/notifications");
}

export async function markNotificationRead(formData: FormData) {
  const notificationId = getString(formData, "notificationId");

  if (!notificationId) {
    redirectWithMessage(
      "/notifications",
      "알림 정보가 올바르지 않습니다.",
      "error",
    );
  }

  const { supabase } = await requireUser();
  const { error } = await supabase.rpc("mark_casual_notification_read", {
    p_notification_id: notificationId,
  });

  if (error) {
    redirectWithMessage("/notifications", error.message, "error");
  }

  revalidateNotificationSurfaces();
  redirect("/notifications");
}

export async function markAllNotificationsRead() {
  const { supabase } = await requireUser();
  const { error } = await supabase.rpc("mark_all_casual_notifications_read");

  if (error) {
    redirectWithMessage("/notifications", error.message, "error");
  }

  revalidateNotificationSurfaces();
  redirect("/notifications");
}
