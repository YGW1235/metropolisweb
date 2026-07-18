"use client";

import Link from "next/link";
import { useEffect, useState, type FormEvent } from "react";

import { updatePassword } from "@/app/reset-password/actions";
import { SubmitButton } from "@/components/SubmitButton";
import { createClient } from "@/lib/supabase/client";

type SessionStatus = "checking" | "ready" | "invalid";

export function ResetPasswordForm({ code }: { code?: string }) {
  const [status, setStatus] = useState<SessionStatus>("checking");
  const [clientError, setClientError] = useState("");

  useEffect(() => {
    let isMounted = true;

    async function prepareRecoverySession() {
      setStatus("checking");
      setClientError("");

      const supabase = createClient();

      if (code) {
        const { error } = await supabase.auth.exchangeCodeForSession(code);

        if (!isMounted) {
          return;
        }

        if (error) {
          console.error("Failed to exchange password reset code:", error.message);
          setStatus("invalid");
          setClientError(
            "재설정 링크가 만료되었거나 올바르지 않습니다. 다시 요청해주세요.",
          );
          return;
        }

        window.history.replaceState(null, "", "/reset-password");
      }

      const {
        data: { session },
        error: sessionError,
      } = await supabase.auth.getSession();

      if (!isMounted) {
        return;
      }

      if (sessionError || !session) {
        if (sessionError) {
          console.error(
            "Failed to read password reset session:",
            sessionError.message,
          );
        }

        setStatus("invalid");
        setClientError(
          "재설정 링크가 만료되었거나 올바르지 않습니다. 다시 요청해주세요.",
        );
        return;
      }

      setStatus("ready");
    }

    void prepareRecoverySession();

    return () => {
      isMounted = false;
    };
  }, [code]);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    const formData = new FormData(event.currentTarget);
    const password = String(formData.get("password") ?? "");
    const passwordConfirm = String(formData.get("passwordConfirm") ?? "");

    if (password.length < 8 || password.length > 72) {
      event.preventDefault();
      setClientError("비밀번호는 8자 이상 72자 이하로 입력해주세요.");
      return;
    }

    if (password !== passwordConfirm) {
      event.preventDefault();
      setClientError("비밀번호가 일치하지 않습니다.");
      return;
    }

    setClientError("");
  }

  if (status === "checking") {
    return (
      <div className="mt-6 rounded-2xl bg-orange-50 p-4 text-sm font-bold text-orange-800">
        재설정 링크를 확인하고 있습니다.
      </div>
    );
  }

  if (status === "invalid") {
    return (
      <div className="mt-6 rounded-2xl bg-red-50 p-4 text-sm font-bold leading-6 text-red-700">
        {clientError}
        <div className="mt-4">
          <Link
            className="inline-flex rounded-full bg-white px-4 py-2 text-sm font-black text-red-700 ring-1 ring-red-100 transition hover:bg-red-100"
            href="/forgot-password"
          >
            재설정 링크 다시 받기
          </Link>
        </div>
      </div>
    );
  }

  return (
    <form action={updatePassword} className="mt-6 space-y-4" onSubmit={handleSubmit}>
      {clientError && (
        <div className="rounded-2xl bg-red-50 p-4 text-sm font-bold text-red-700">
          {clientError}
        </div>
      )}

      <div>
        <label className="text-sm font-bold text-stone-700">
          새 비밀번호
        </label>
        <input
          autoComplete="new-password"
          className="mt-2 w-full rounded-2xl border border-stone-200 px-4 py-3 outline-none focus:border-orange-400"
          maxLength={72}
          minLength={8}
          name="password"
          placeholder="8자 이상"
          required
          type="password"
        />
        <p className="mt-2 text-xs font-semibold text-stone-500">
          8자 이상 72자 이하로 입력해주세요.
        </p>
      </div>

      <div>
        <label className="text-sm font-bold text-stone-700">
          새 비밀번호 확인
        </label>
        <input
          autoComplete="new-password"
          className="mt-2 w-full rounded-2xl border border-stone-200 px-4 py-3 outline-none focus:border-orange-400"
          maxLength={72}
          minLength={8}
          name="passwordConfirm"
          placeholder="새 비밀번호를 한 번 더 입력"
          required
          type="password"
        />
      </div>

      <SubmitButton
        className="w-full rounded-2xl bg-stone-950 px-5 py-3 font-black text-white transition hover:-translate-y-0.5"
        pendingText="변경 중..."
      >
        비밀번호 변경
      </SubmitButton>
    </form>
  );
}
