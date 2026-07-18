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
  const params = new URLSearchParams({
    message,
    type,
  });

  redirect(`${path}?${params.toString()}`);
}

export async function signUp(formData: FormData) {
  const email = getString(formData, "email");
  const password = getRawString(formData, "password");
  const passwordConfirm = getRawString(formData, "passwordConfirm");

  if (!email || !password || !passwordConfirm) {
    redirectWithMessage(
      "/signup",
      "이메일과 비밀번호 확인을 입력해주세요.",
      "error",
    );
  }

  if (password.length < 8 || password.length > 72) {
    redirectWithMessage(
      "/signup",
      "비밀번호는 8자 이상 72자 이하로 입력해주세요.",
      "error",
    );
  }

  if (password !== passwordConfirm) {
    redirectWithMessage("/signup", "비밀번호가 일치하지 않습니다.", "error");
  }

  const supabase = await createClient();

  const { error } = await supabase.auth.signUp({
    email,
    password,
  });

  if (error) {
    console.error("Failed to sign up casual user:", error.message);
    redirectWithMessage(
      "/signup",
      "회원가입을 완료하지 못했습니다. 잠시 후 다시 시도해주세요.",
      "error",
    );
  }

  redirectWithMessage(
    "/login",
    "회원가입이 완료되었습니다. 이메일 인증을 사용 중이라면 인증 후 로그인해주세요.",
    "success",
  );
}

export async function signIn(formData: FormData) {
  const email = getString(formData, "email");
  const password = getString(formData, "password");

  if (!email || !password) {
    redirectWithMessage("/login", "이메일과 비밀번호를 입력해주세요.", "error");
  }

  const supabase = await createClient();

  const { error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    redirectWithMessage("/login", error.message, "error");
  }

  await supabase.rpc("ensure_casual_profile");

  revalidatePath("/", "layout");
  redirect("/");
}

export async function signOut() {
  const supabase = await createClient();

  await supabase.auth.signOut();

  revalidatePath("/", "layout");
  redirectWithMessage("/login", "로그아웃되었습니다.", "success");
}

export async function updateProfile(formData: FormData) {
  const nickname = getString(formData, "nickname");
  const bio = getString(formData, "bio");

  const nicknamePattern = /^[가-힣A-Za-z0-9_]+$/;

  if (!nicknamePattern.test(nickname)) {
    redirectWithMessage(
      "/settings/profile",
      "닉네임은 한글, 영어, 숫자, 언더바(_)만 사용할 수 있습니다.",
      "error",
    );
  }

  if (nickname.length < 2 || nickname.length > 16) {
    redirectWithMessage(
      "/settings/profile",
      "닉네임은 2자 이상 16자 이하로 입력해주세요.",
      "error",
    );
  }

  if (bio.length > 120) {
    redirectWithMessage(
      "/settings/profile",
      "한 줄 소개는 120자 이하로 입력해주세요.",
      "error",
    );
  }

  const supabase = await createClient();

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    redirectWithMessage("/login", "로그인이 필요합니다.", "error");
  }

  await supabase.rpc("ensure_casual_profile");

  const { error } = await supabase
    .from("casual_profiles")
    .update({
      nickname,
      bio,
    })
    .eq("user_id", user.id);

  if (error) {
    if (error.code === "23505") {
      redirectWithMessage(
        "/settings/profile",
        "이미 사용 중인 닉네임입니다.",
        "error",
      );
    }

    redirectWithMessage("/settings/profile", error.message, "error");
  }

  revalidatePath("/", "layout");
  revalidatePath("/settings/profile");

  redirectWithMessage(
    "/settings/profile",
    "프로필이 수정되었습니다.",
    "success",
  );
}
