import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

function withMessage(path: string, message: string) {
  return `${path}?message=${encodeURIComponent(message)}`;
}

export async function requireUser() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect(withMessage("/login", "로그인 후 이용할 수 있습니다."));
  }

  return { supabase, user };
}

export async function requireAdmin() {
  const { supabase, user } = await requireUser();

  const { data: profile, error } = await supabase
    .from("profiles")
    .select("role, status")
    .eq("id", user.id)
    .single();

  if (error || profile?.role !== "admin" || profile?.status !== "active") {
    redirect(withMessage("/topics", "관리자 권한이 필요합니다."));
  }

  return { supabase, user, profile };
}