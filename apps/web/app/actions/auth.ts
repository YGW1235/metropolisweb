"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

function getFormString(formData: FormData, key: string) {
  const value = formData.get(key);

  if (typeof value !== "string" || value.trim() === "") {
    throw new Error(`${key} 값이 필요합니다.`);
  }

  return value.trim();
}

export async function signUp(formData: FormData) {
  const email = getFormString(formData, "email");
  const password = getFormString(formData, "password");

  const supabase = await createClient();

  const { error } = await supabase.auth.signUp({
    email,
    password,
  });

  if (error) {
    console.error("Sign up failed", error);
    const params = new URLSearchParams({
      message:
        "회원가입에 실패했습니다. 입력한 이메일과 비밀번호를 다시 확인해주세요.",
      type: "error",
    });
    redirect(`/login?${params.toString()}`);
  }

  revalidatePath("/", "layout");
  redirect("/me");
}

export async function signIn(formData: FormData) {
  const email = getFormString(formData, "email");
  const password = getFormString(formData, "password");

  const supabase = await createClient();

  const { error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    console.error("Login failed", error);
    const params = new URLSearchParams({
      message: "로그인에 실패했습니다. 이메일과 비밀번호를 다시 확인해주세요.",
      type: "error",
    });
    redirect(`/login?${params.toString()}`);
  }

  revalidatePath("/", "layout");
  redirect("/me");
}

export async function signOut() {
  const supabase = await createClient();

  await supabase.auth.signOut();

  const params = new URLSearchParams({
    message: "로그아웃되었습니다.",
    type: "success",
  });

  redirect(`/login?${params.toString()}`);
}
