import { NextResponse } from "next/server";

import { createClient } from "@/lib/supabase/server";

function getSafeNext(value: string | null) {
  if (!value) return "/me";

  if (!value.startsWith("/") || value.startsWith("//")) {
    return "/me";
  }

  return value;
}

function withMessage(
  origin: string,
  path: string,
  message: string,
  type: "success" | "error" = "success",
) {
  const url = new URL(path, origin);

  url.searchParams.set("message", message);
  url.searchParams.set("type", type);

  return url;
}

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");
  const next = getSafeNext(requestUrl.searchParams.get("next"));

  if (!code) {
    return NextResponse.redirect(
      withMessage(
        requestUrl.origin,
        "/login",
        "이메일 인증 링크가 올바르지 않습니다.",
        "error",
      ),
    );
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.exchangeCodeForSession(code);

  if (error) {
    return NextResponse.redirect(
      withMessage(
        requestUrl.origin,
        "/login",
        "이메일 인증 링크가 만료되었거나 유효하지 않습니다. 다시 시도해주세요.",
        "error",
      ),
    );
  }

  return NextResponse.redirect(
    withMessage(
      requestUrl.origin,
      next,
      "이메일 인증이 완료되었습니다.",
      "success",
    ),
  );
}