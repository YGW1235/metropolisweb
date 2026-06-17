"use client";

import { useTheme } from "@/components/theme-provider";

export function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();

  const isDark = theme === "dark";

  return (
    <button
      type="button"
      onClick={toggleTheme}
      className="inline-flex items-center gap-2 rounded-full border border-[var(--theme-line)] bg-[var(--theme-surface)] px-3 py-2 text-sm font-black text-[var(--theme-text)] transition hover:bg-[var(--theme-surface-hover)]"
      aria-label={isDark ? "일반모드로 전환" : "다크모드로 전환"}
    >
      <span className="text-base">{isDark ? "☾" : "☼"}</span>
      <span className="hidden sm:inline">
        {isDark ? "다크모드" : "일반모드"}
      </span>
    </button>
  );
}