"use client";

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

type Theme = "dark" | "light";

type ThemeContextValue = {
  theme: Theme;
  toggleTheme: () => void;
  setTheme: (theme: Theme) => void;
};

const ThemeContext = createContext<ThemeContextValue | null>(null);
const THEME_STORAGE_KEY = "metropolis-theme";
const DEFAULT_THEME: Theme = "dark";

function isTheme(value: string | null): value is Theme {
  return value === "dark" || value === "light";
}

function applyTheme(theme: Theme, options: { persist?: boolean } = {}) {
  const { persist = true } = options;

  document.documentElement.dataset.theme = theme;

  if (persist) {
    try {
      localStorage.setItem(THEME_STORAGE_KEY, theme);
    } catch {
      // Ignore storage failures; the current document theme is still applied.
    }
  }
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<Theme>(DEFAULT_THEME);

  useEffect(() => {
    let savedTheme: string | null = null;

    try {
      savedTheme = localStorage.getItem(THEME_STORAGE_KEY);
    } catch {
      savedTheme = null;
    }

    if (isTheme(savedTheme)) {
      setThemeState(savedTheme);
      applyTheme(savedTheme, { persist: false });
      return;
    }

    if (savedTheme !== null) {
      try {
        localStorage.removeItem(THEME_STORAGE_KEY);
      } catch {
        // Ignore storage failures; invalid values simply will not be reused.
      }
    }

    setThemeState(DEFAULT_THEME);
    applyTheme(DEFAULT_THEME, { persist: false });
  }, []);

  const value = useMemo<ThemeContextValue>(
    () => ({
      theme,
      setTheme: (nextTheme) => {
        setThemeState(nextTheme);
        applyTheme(nextTheme);
      },
      toggleTheme: () => {
        const nextTheme = theme === "dark" ? "light" : "dark";

        setThemeState(nextTheme);
        applyTheme(nextTheme);
      },
    }),
    [theme],
  );

  return (
    <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
  );
}

export function useTheme() {
  const value = useContext(ThemeContext);

  if (!value) {
    throw new Error("useTheme must be used inside ThemeProvider.");
  }

  return value;
}
