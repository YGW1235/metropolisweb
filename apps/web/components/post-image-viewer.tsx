"use client";

import { useEffect, useState } from "react";

type PostImageViewerProps = {
  src: string;
  alt?: string;
};

export function PostImageViewer({
  src,
  alt = "발언에 첨부된 근거 이미지",
}: PostImageViewerProps) {
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setIsOpen(false);
      }
    }

    document.addEventListener("keydown", handleKeyDown);
    document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  return (
    <>
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className="group mb-8 block w-full overflow-hidden rounded-2xl border border-[var(--theme-line)] bg-[var(--theme-surface)] text-left transition duration-300 hover:border-[var(--theme-gold)]"
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={src}
          alt={alt}
          className="max-h-[560px] w-full object-contain transition duration-300 group-hover:scale-[1.01]"
        />

        <div className="flex items-center justify-between border-t border-[var(--theme-line)] px-4 py-3">
          <p className="text-xs font-black uppercase tracking-[0.22em] text-[var(--theme-gold)]">
            Evidence Image
          </p>
          <span className="text-xs font-black text-[var(--theme-muted)]">
            클릭해서 크게 보기
          </span>
        </div>
      </button>

      {isOpen ? (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 px-4 py-6 backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
          aria-label="첨부 이미지 확대 보기"
          onClick={() => setIsOpen(false)}
        >
          <div
            className="relative max-h-full w-full max-w-6xl overflow-hidden rounded-2xl border border-[var(--theme-line)] bg-[var(--theme-bg)] shadow-[var(--shadow-card-strong)]"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-[var(--theme-line)] bg-[var(--theme-panel)] px-4 py-3">
              <p className="text-xs font-black uppercase tracking-[0.22em] text-[var(--theme-gold)]">
                Evidence Image
              </p>

              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="rounded-full border border-[var(--theme-line)] bg-[var(--theme-surface)] px-3 py-2 text-xs font-black text-[var(--theme-muted)] transition hover:bg-[var(--theme-surface-hover)] hover:text-[var(--theme-text)]"
              >
                닫기
              </button>
            </div>

            <div className="max-h-[82vh] overflow-auto p-4">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={src}
                alt={alt}
                className="mx-auto max-h-[78vh] w-auto max-w-full object-contain"
              />
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}