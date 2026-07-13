"use client";

import { useEffect, useState } from "react";

import type { OpinionImage } from "./types";

export function OpinionImageGallery({ images }: { images: OpinionImage[] }) {
  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  const activeImage = activeIndex === null ? null : images[activeIndex];
  const activeImageNumber = activeIndex === null ? 0 : activeIndex + 1;
  const hasMultipleImages = images.length > 1;

  useEffect(() => {
    if (activeIndex === null) {
      return;
    }

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setActiveIndex(null);
      }

      if (event.key === "ArrowLeft" && hasMultipleImages) {
        setActiveIndex((currentIndex) => {
          if (currentIndex === null) {
            return currentIndex;
          }

          return currentIndex === 0 ? images.length - 1 : currentIndex - 1;
        });
      }

      if (event.key === "ArrowRight" && hasMultipleImages) {
        setActiveIndex((currentIndex) => {
          if (currentIndex === null) {
            return currentIndex;
          }

          return currentIndex === images.length - 1 ? 0 : currentIndex + 1;
        });
      }
    }

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [activeIndex, hasMultipleImages, images.length]);

  if (images.length === 0) {
    return null;
  }

  function showPreviousImage() {
    setActiveIndex((currentIndex) => {
      if (currentIndex === null) {
        return currentIndex;
      }

      return currentIndex === 0 ? images.length - 1 : currentIndex - 1;
    });
  }

  function showNextImage() {
    setActiveIndex((currentIndex) => {
      if (currentIndex === null) {
        return currentIndex;
      }

      return currentIndex === images.length - 1 ? 0 : currentIndex + 1;
    });
  }

  return (
    <>
      <div className="mt-4 space-y-2">
        {images.map((image, index) => (
          <button
            key={image.storage_path}
            type="button"
            aria-label="의견 이미지 크게 보기"
            onClick={() => setActiveIndex(index)}
            className="block w-full cursor-pointer overflow-hidden rounded-2xl bg-white/80 text-left ring-orange-400 transition hover:opacity-90 focus:outline-none focus:ring-2"
          >
            <img
              src={image.public_url}
              alt="의견 이미지"
              loading="lazy"
              className="max-h-[22rem] w-full object-contain sm:max-h-[28rem]"
            />
          </button>
        ))}
      </div>

      {activeImage && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center bg-stone-950/80 p-3 sm:p-4"
          onClick={() => setActiveIndex(null)}
        >
          <div
            className="relative flex max-h-[92vh] w-full max-w-5xl flex-col items-center pt-12 sm:pt-0"
            onClick={(event) => event.stopPropagation()}
          >
            <button
              type="button"
              aria-label="이미지 확대 닫기"
              onClick={() => setActiveIndex(null)}
              className="absolute right-0 top-0 z-10 rounded-full bg-white px-4 py-2 text-sm font-black text-stone-900 shadow-sm transition hover:bg-orange-100"
            >
              닫기
            </button>

            <img
              src={activeImage.public_url}
              alt="의견 이미지"
              className="max-h-[72vh] max-w-full rounded-2xl object-contain shadow-2xl sm:max-h-[80vh]"
            />

            <div className="mt-3 flex max-w-full flex-wrap items-center justify-center gap-3 rounded-full bg-white/95 px-4 py-2 text-xs font-black text-stone-700">
              {hasMultipleImages && (
                <button
                  type="button"
                  onClick={showPreviousImage}
                  className="rounded-full px-2 py-1 hover:bg-orange-100"
                >
                  이전
                </button>
              )}

              <span>
                {activeImageNumber} / {images.length}
              </span>

              {hasMultipleImages && (
                <button
                  type="button"
                  onClick={showNextImage}
                  className="rounded-full px-2 py-1 hover:bg-orange-100"
                >
                  다음
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
