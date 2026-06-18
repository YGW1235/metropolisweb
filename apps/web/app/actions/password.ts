"use server";

import { headers } from "next/headers";
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

async function getOrigin() {
  const requestHeaders = await headers();

  return (
    requestHeaders.get("origin") ??
    process.env.NEXT_PUBLIC_SITE_URL ??
    "http://localhost:3000"
  );
}

function validatePassword(password: string, confirmPassword: string) {
  if (password.length < 8) {
    return "비밀번호는 8자 이상이어야 합니다.";
  }

  if (password !== confirmPassword) {
    return "새 비밀번호가 서로 일치하지 않습니다.";
  }

  return null;
}

export async function requestPasswordReset(formData: FormData) {
  const email = getString(formData, "email");

  if (!email) {
    redirectWithMessage(
      "/forgot-password",
      "비밀번호 재설정 메일을 받을 이메일을 입력해주세요.",
      "error",
    );
  }

  const supabase = await createClient();
  const origin = await getOrigin();

  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${origin}/auth/callback?next=/reset-password`,
  });

  if (error) {
    redirectWithMessage("/forgot-password", error.message, "error");
  }

  redirectWithMessage(
    "/forgot-password",
    "비밀번호 재설정 메일을 보냈습니다. 메일함과 스팸함을 확인해주세요.",
    "success",
  );
}

export async function updatePasswordAfterReset(formData: FormData) {
  const password = getString(formData, "password");
  const confirmPassword = getString(formData, "confirm_password");

  const validationError = validatePassword(password, confirmPassword);

  if (validationError) {
    redirectWithMessage("/reset-password", validationError, "error");
  }

  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirectWithMessage(
      "/forgot-password",
      "비밀번호 재설정 링크가 만료되었거나 로그인 세션이 없습니다. 다시 요청해주세요.",
      "error",
    );
  }

  const { error } = await supabase.auth.updateUser({
    password,
  });

  if (error) {
    redirectWithMessage("/reset-password", error.message, "error");
  }

  redirectWithMessage(
    "/login",
    "비밀번호가 변경되었습니다. 새 비밀번호로 로그인해주세요.",
    "success",
  );
}

export async function changeMyPassword(formData: FormData) {
  const currentPassword = getString(formData, "current_password");
  const password = getString(formData, "password");
  const confirmPassword = getString(formData, "confirm_password");

  if (!currentPassword) {
    redirectWithMessage(
      "/me/password",
      "현재 비밀번호를 입력해주세요.",
      "error",
    );
  }

  const validationError = validatePassword(password, confirmPassword);

  if (validationError) {
    redirectWithMessage("/me/password", validationError, "error");
  }

  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user?.email) {
    redirectWithMessage("/login", "로그인이 필요합니다.", "error");
  }

  const { error: signInError } = await supabase.auth.signInWithPassword({
    email: user.email,
    password: currentPassword,
  });

  if (signInError) {
    redirectWithMessage(
      "/me/password",
      "현재 비밀번호가 올바르지 않습니다.",
      "error",
    );
  }

  const { error } = await supabase.auth.updateUser({
    password,
  });

  if (error) {
    redirectWithMessage("/me/password", error.message, "error");
  }

  redirectWithMessage("/me", "비밀번호가 변경되었습니다.", "success");
}