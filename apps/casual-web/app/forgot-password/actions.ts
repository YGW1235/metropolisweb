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
  message: string,
  type: "success" | "error" = "success",
): never {
  const params = new URLSearchParams({ message, type });

  redirect(`/forgot-password?${params.toString()}`);
}

function isValidEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

function normalizeOrigin(value: string | null | undefined) {
  const trimmed = value?.trim();

  if (!trimmed) {
    return null;
  }

  const withProtocol = /^https?:\/\//i.test(trimmed)
    ? trimmed
    : `https://${trimmed}`;

  try {
    return new URL(withProtocol).origin;
  } catch {
    return null;
  }
}

async function getResetPasswordUrl() {
  const configuredOrigin = normalizeOrigin(process.env.NEXT_PUBLIC_SITE_URL);

  if (configuredOrigin) {
    return `${configuredOrigin}/reset-password`;
  }

  const headerList = await headers();
  const forwardedHost = headerList.get("x-forwarded-host");
  const host =
    forwardedHost?.split(",")[0]?.trim() ||
    headerList.get("host") ||
    "localhost:3001";
  const forwardedProto = headerList.get("x-forwarded-proto");
  const protocol =
    forwardedProto?.split(",")[0]?.trim() ||
    (host.startsWith("localhost") ? "http" : "https");
  const origin = normalizeOrigin(`${protocol}://${host}`) ?? "http://localhost:3001";

  return `${origin}/reset-password`;
}

export async function sendPasswordResetEmail(formData: FormData) {
  const email = getString(formData, "email").toLowerCase();

  if (!email) {
    redirectWithMessage("이메일을 입력해주세요.", "error");
  }

  if (!isValidEmail(email)) {
    redirectWithMessage("이메일 형식이 올바르지 않습니다.", "error");
  }

  const supabase = await createClient();
  const redirectTo = await getResetPasswordUrl();

  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo,
  });

  if (error) {
    console.error("Failed to send password reset email:", error.message);
    redirectWithMessage(
      "비밀번호 재설정 메일을 보내지 못했습니다. 잠시 후 다시 시도해주세요.",
      "error",
    );
  }

  redirectWithMessage(
    "입력한 이메일로 비밀번호 재설정 링크를 보냈습니다. 메일함을 확인해주세요.",
    "success",
  );
}
