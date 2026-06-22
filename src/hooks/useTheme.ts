import { useEffect, useState, useCallback } from "react";

export type HeroTheme = {
  id: string;
  label: string;
  emoji: string;
  /** OKLCH values that override --brand, --brand-soft, --surface, --surface-warm globally */
  brand: string;
  brandSoft: string;
  brandInk: string;
  surface: string;
  surfaceWarm: string;
};

export const HERO_THEMES: HeroTheme[] = [
  { id: "candy",  label: "Candy",  emoji: "🍭",
    brand: "0.62 0.24 340", brandSoft: "0.93 0.06 340", brandInk: "0.25 0.1 340",
    surface: "0.985 0.012 340", surfaceWarm: "0.96 0.025 340" },
  { id: "sun",    label: "Sun",    emoji: "🌞",
    brand: "0.7 0.18 55", brandSoft: "0.94 0.07 70", brandInk: "0.28 0.08 50",
    surface: "0.99 0.012 80", surfaceWarm: "0.96 0.03 70" },
  { id: "forest", label: "Forest", emoji: "🌿",
    brand: "0.55 0.16 150", brandSoft: "0.93 0.06 150", brandInk: "0.22 0.08 150",
    surface: "0.985 0.012 140", surfaceWarm: "0.96 0.025 140" },
  { id: "ocean",  label: "Ocean",  emoji: "🌊",
    brand: "0.58 0.16 230", brandSoft: "0.93 0.06 230", brandInk: "0.22 0.08 235",
    surface: "0.985 0.012 220", surfaceWarm: "0.96 0.025 220" },
  { id: "violet", label: "Violet", emoji: "🪻",
    brand: "0.52 0.22 295", brandSoft: "0.92 0.06 295", brandInk: "0.22 0.08 290",
    surface: "0.985 0.008 90", surfaceWarm: "0.96 0.018 80" },
];

const DEFAULT_THEME_ID = "violet";
const LS_THEME = "creahq:hero-theme";
const LS_MODE = "creahq:mode";

type Mode = "light" | "dark";

function applyTheme(theme: HeroTheme) {
  const root = document.documentElement;
  root.style.setProperty("--brand", `oklch(${theme.brand})`);
  root.style.setProperty("--brand-soft", `oklch(${theme.brandSoft})`);
  root.style.setProperty("--brand-ink", `oklch(${theme.brandInk})`);
  root.style.setProperty("--surface", `oklch(${theme.surface})`);
  root.style.setProperty("--surface-warm", `oklch(${theme.surfaceWarm})`);
}

function clearTheme() {
  const root = document.documentElement;
  ["--brand", "--brand-soft", "--brand-ink", "--surface", "--surface-warm"].forEach((v) =>
    root.style.removeProperty(v),
  );
}

function applyMode(mode: Mode) {
  document.documentElement.classList.toggle("dark", mode === "dark");
}

export function useTheme() {
  const [themeId, setThemeId] = useState<string>(DEFAULT_THEME_ID);
  const [mode, setMode] = useState<Mode>("light");

  useEffect(() => {
    try {
      const t = localStorage.getItem(LS_THEME);
      if (t) setThemeId(t);
      const m = (localStorage.getItem(LS_MODE) as Mode | null) ?? "light";
      setMode(m);
      applyMode(m);
      const found = HERO_THEMES.find((x) => x.id === (t ?? DEFAULT_THEME_ID));
      if (found && found.id !== DEFAULT_THEME_ID) applyTheme(found);
    } catch { /* noop */ }
  }, []);

  const setTheme = useCallback((id: string) => {
    const found = HERO_THEMES.find((x) => x.id === id);
    if (!found) return;
    setThemeId(id);
    try { localStorage.setItem(LS_THEME, id); } catch { /* noop */ }
    if (id === DEFAULT_THEME_ID) clearTheme();
    else applyTheme(found);
  }, []);

  const resetTheme = useCallback(() => {
    setThemeId(DEFAULT_THEME_ID);
    try { localStorage.removeItem(LS_THEME); } catch { /* noop */ }
    clearTheme();
  }, []);

  const toggleMode = useCallback(() => {
    setMode((prev) => {
      const next: Mode = prev === "light" ? "dark" : "light";
      try { localStorage.setItem(LS_MODE, next); } catch { /* noop */ }
      applyMode(next);
      return next;
    });
  }, []);

  const setExplicitMode = useCallback((m: Mode) => {
    setMode(m);
    try { localStorage.setItem(LS_MODE, m); } catch { /* noop */ }
    applyMode(m);
  }, []);

  return { themeId, setTheme, resetTheme, mode, toggleMode, setMode: setExplicitMode };
}
