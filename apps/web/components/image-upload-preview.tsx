"use client";

import { useEffect, useRef, useState } from "react";

const MAX_IMAGE_SIZE = 5 * 1024 * 1024;

const ALLOWED_IMAGE_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
]);

export function ImageUploadPreview() {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string>("");
  const [errorMessage, setErrorMessage] = useState<string>("");

  useEffect(() => {
    return () => {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);

  function resetPreview() {
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }

    setPreviewUrl(null);
    setFileName("");
    setErrorMessage("");

    if (inputRef.current) {
      inputRef.current.value = "";
    }
  }

  function handleFileChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];

    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }

    setPreviewUrl(null);
    setFileName("");
    setErrorMessage("");

    if (!file) {
      return;
    }

    if (!ALLOWED_IMAGE_TYPES.has(file.type)) {
      setErrorMessage("JPG, PNG, WEBP 형식의 이미지만 선택할 수 있습니다.");
      event.target.value = "";
      return;
    }

    if (file.size > MAX_IMAGE_SIZE) {
      setErrorMessage("이미지는 최대 5MB까지만 업로드할 수 있습니다.");
      event.target.value = "";
      return;
    }

    setFileName(file.name);
    setPreviewUrl(URL.createObjectURL(file));
  }

  return (
    <div>
      <label className="block text-sm font-bold text-[var(--theme-muted)]">
        근거 이미지
      </label>

      <input
        ref={inputRef}
        type="file"
        name="image"
        accept="image/jpeg,image/png,image/webp"
        onChange={handleFileChange}
        className="mt-2 w-full rounded-xl border border-[var(--theme-line)] bg-[var(--theme-surface)] px-4 py-3 text-sm text-[var(--theme-text)] outline-none transition file:mr-4 file:border-0 file:bg-[var(--theme-gold)] file:px-4 file:py-2 file:text-sm file:font-black file:text-[var(--theme-accent-contrast)] hover:bg-[var(--theme-surface-hover)]"
      />

      <p className="mt-2 text-xs font-bold text-[var(--theme-soft)]">
        JPG, PNG, WEBP 형식만 가능하며 최대 5MB까지 업로드할 수 있습니다.
      </p>

      {errorMessage ? (
        <div
          className="mt-3 rounded-xl border bg-[var(--message-error-bg)] p-3 text-xs font-bold text-[var(--message-error-text)]"
          style={{ borderColor: "var(--message-error-line)" }}
        >
          {errorMessage}
        </div>
      ) : null}

      {previewUrl ? (
        <div className="mt-4 overflow-hidden rounded-2xl border border-[var(--theme-line)] bg-[var(--theme-surface)]">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[var(--theme-line)] px-4 py-3">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.22em] text-[var(--theme-gold)]">
                Image Preview
              </p>
              <p className="mt-1 max-w-full truncate text-xs font-bold text-[var(--theme-muted)]">
                {fileName}
              </p>
            </div>

            <button
              type="button"
              onClick={resetPreview}
              className="border border-[var(--theme-line)] bg-[var(--theme-panel)] px-3 py-2 text-xs font-black text-[var(--theme-muted)] transition hover:bg-[var(--theme-surface-hover)] hover:text-[var(--theme-text)]"
            >
              이미지 제거
            </button>
          </div>

          <div className="p-4">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={previewUrl}
              alt="업로드 전 이미지 미리보기"
              className="max-h-[420px] w-full rounded-xl object-contain"
            />
          </div>
        </div>
      ) : null}
    </div>
  );
}