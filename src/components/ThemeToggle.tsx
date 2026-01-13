"use client";

// Theme toggle component for switching between light and dark mode

import React, { useEffect, useMemo, useState } from "react";

type Theme = "light" | "dark";

// Detect the user's system colour scheme preference
function getSystemTheme(): Theme {
  if (typeof window === "undefined") return "light";
  return window.matchMedia?.("(prefers-color-scheme: dark)").matches
    ? "dark"
    : "light";
}

// Apply the selected theme to the root HTML element
function applyTheme(theme: Theme) {
  document.documentElement.dataset.theme = theme;
}

// UI control for toggling between light and dark themes
export default function ThemeToggle() {
  const [theme, setTheme] = useState<Theme>("light");

  // Read saved theme or system preference once on mount
  useEffect(() => {
    const saved =
      (typeof window !== "undefined" &&
        localStorage.getItem("le_theme")) as Theme | null;

    const initial: Theme =
      saved === "light" || saved === "dark" ? saved : getSystemTheme();

    setTheme(initial);
    applyTheme(initial);
  }, []);

  const isDark = theme === "dark";

  const ariaLabel = useMemo(
    () => (isDark ? "Switch to light mode" : "Switch to dark mode"),
    [isDark]
  );

  // Toggle theme and persist the choice
  function toggle() {
    const next: Theme = isDark ? "light" : "dark";
    setTheme(next);
    applyTheme(next);
    localStorage.setItem("le_theme", next);
  }

  return (
    <button
      type="button"
      className="ThemeToggle"
      data-on={isDark ? "true" : "false"}
      onClick={toggle}
      role="switch"
      aria-checked={isDark}
      aria-label={ariaLabel}
      title={ariaLabel}
    >
      <span className="ThemeToggleKnob" aria-hidden="true">
        {/* Sun */}
        <svg className="ThemeToggleIcon sun" viewBox="0 0 24 24" fill="none">
          <path
            d="M12 18a6 6 0 1 0 0-12 6 6 0 0 0 0 12Z"
            stroke="currentColor"
            strokeWidth="2"
          />
          <path
            d="M12 2v2M12 20v2M4 12H2M22 12h-2M5 5l1.5 1.5M17.5 17.5 19 19M19 5l-1.5 1.5M6.5 17.5 5 19"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
          />
        </svg>

        {/* Moon */}
        <svg className="ThemeToggleIcon moon" viewBox="0 0 24 24" fill="none">
          <path
            d="M21 14.5A8 8 0 0 1 9.5 3a7 7 0 1 0 11.5 11.5Z"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinejoin="round"
          />
        </svg>
      </span>
    </button>
  );
}
