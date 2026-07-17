"use client";

import { useEffect, useRef, useState } from "react";

const STORAGE_KEY = "casual-background-color";

const BACKGROUND_OPTIONS = [
  { label: "흰색", value: "white", color: "#ffffff" },
  { label: "크림", value: "cream", color: "#fff7ed" },
  { label: "회색", value: "gray", color: "#f8fafc" },
  { label: "민트", value: "mint", color: "#f0fdf4" },
  { label: "하늘", value: "sky", color: "#f0f9ff" },
] as const;

type BackgroundValue = (typeof BACKGROUND_OPTIONS)[number]["value"];

function getBackgroundOption(value: string | null) {
  return (
    BACKGROUND_OPTIONS.find((option) => option.value === value) ??
    BACKGROUND_OPTIONS[0]
  );
}

function applyBackground(value: BackgroundValue) {
  const option = getBackgroundOption(value);
  document.documentElement.style.setProperty("--casual-page-bg", option.color);
}

export function BackgroundColorPicker() {
  const [isOpen, setIsOpen] = useState(false);
  const [selected, setSelected] = useState<BackgroundValue>("white");
  const rootRef = useRef<HTMLDivElement>(null);
  const selectedOption = getBackgroundOption(selected);

  useEffect(() => {
    const storedValue = window.localStorage.getItem(STORAGE_KEY);
    const option = getBackgroundOption(storedValue);

    setSelected(option.value);
    applyBackground(option.value);

    if (storedValue && storedValue !== option.value) {
      window.localStorage.setItem(STORAGE_KEY, option.value);
    }
  }, []);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    function handlePointerDown(event: PointerEvent) {
      if (
        rootRef.current &&
        event.target instanceof Node &&
        !rootRef.current.contains(event.target)
      ) {
        setIsOpen(false);
      }
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setIsOpen(false);
      }
    }

    document.addEventListener("pointerdown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen]);

  function handleSelect(value: BackgroundValue) {
    setSelected(value);
    applyBackground(value);
    window.localStorage.setItem(STORAGE_KEY, value);
    setIsOpen(false);
  }

  return (
    <div ref={rootRef} className="relative shrink-0">
      <button
        type="button"
        aria-label="배경색 선택"
        aria-expanded={isOpen}
        className="inline-flex min-h-10 items-center gap-1.5 rounded-full border border-stone-200 bg-white px-3 py-2 text-xs font-black text-stone-700 shadow-sm transition hover:bg-stone-50"
        onClick={() => setIsOpen((current) => !current)}
      >
        <span
          aria-hidden="true"
          className="h-4 w-4 rounded-full border border-stone-200"
          style={{ backgroundColor: selectedOption.color }}
        />
        <span>배경</span>
      </button>

      {isOpen && (
        <div className="absolute right-0 z-50 mt-2 w-48 rounded-2xl border border-orange-100 bg-white p-2 shadow-lg shadow-stone-200/60">
          <p className="px-2 py-1 text-xs font-black text-stone-500">
            배경색
          </p>

          <div className="mt-1 grid gap-1">
            {BACKGROUND_OPTIONS.map((option) => {
              const isSelected = option.value === selected;

              return (
                <button
                  key={option.value}
                  type="button"
                  aria-pressed={isSelected}
                  className={`flex min-h-10 w-full items-center justify-between gap-3 rounded-xl px-2.5 py-2 text-left text-sm font-bold transition ${
                    isSelected
                      ? "bg-orange-50 text-orange-800"
                      : "text-stone-700 hover:bg-stone-50"
                  }`}
                  onClick={() => handleSelect(option.value)}
                >
                  <span className="flex min-w-0 items-center gap-2">
                    <span
                      aria-hidden="true"
                      className="h-5 w-5 shrink-0 rounded-full border border-stone-200"
                      style={{ backgroundColor: option.color }}
                    />
                    <span>{option.label}</span>
                  </span>

                  {isSelected && (
                    <span className="shrink-0 text-xs font-black text-orange-700">
                      선택
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
