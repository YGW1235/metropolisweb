"use client";

import { useTheme } from "@/components/theme-provider";

export function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();

  const isDark = theme === "dark";
  const toggleLabel = isDark ? "일반모드로 전환" : "다크모드로 전환";

  return (
    <button
      type="button"
      onClick={toggleTheme}
      className="inline-flex max-w-full items-center gap-2 whitespace-nowrap rounded-full border border-[var(--theme-line)] bg-[var(--theme-surface)] px-3 py-2 text-sm font-black text-[var(--theme-text)] transition hover:bg-[var(--theme-surface-hover)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--theme-gold)] sm:px-4"
      aria-label={toggleLabel}
      title={toggleLabel}
    >
      <span aria-hidden="true" className="text-base">
        {isDark ? "☾" : "☼"}
      </span>
      <span className="hidden sm:inline">{toggleLabel}</span>
    </button>
  );
}
