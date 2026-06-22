import { useEffect, useState, useCallback } from "react";

export type HeroTheme = {
  id: string;
  label: string;
  emoji: string;
  /** OKLCH chroma+hue token shared across modes; lightness comes from the mode. */
  brandLight: string;   // light-mode --brand
  brandDark: string;    // dark-mode --brand
  softLight: string;    // light-mode --brand-soft
  softDark: string;     // dark-mode --brand-soft
};

export const HERO_THEMES: HeroTheme[] = [
  { id: "candy",  label: "Candy",  emoji: "🍭",
    brandLight: "0.62 0.24 340", brandDark: "0.74 0.2 340",
    softLight: "0.93 0.06 340",  softDark: "0.3 0.1 340" },
  { id: "sun",    label: "Sun",    emoji: "🌞",
    brandLight: "0.7 0.18 55",   brandDark: "0.78 0.16 60",
    softLight: "0.94 0.07 70",   softDark: "0.32 0.09 55" },
  { id: "forest", label: "Forest", emoji: "🌿",
    brandLight: "0.55 0.16 150", brandDark: "0.72 0.16 150",
    softLight: "0.93 0.06 150",  softDark: "0.3 0.09 150" },
  { id: "ocean",  label: "Ocean",  emoji: "🌊",
    brandLight: "0.58 0.16 230", brandDark: "0.72 0.16 230",
    softLight: "0.93 0.06 230",  softDark: "0.3 0.1 230" },
  { id: "violet", label: "Violet", emoji: "🪻",
    brandLight: "0.52 0.22 295", brandDark: "0.7 0.2 295",
    softLight: "0.92 0.06 295",  softDark: "0.3 0.1 295" },
];

const DEFAULT_THEME_ID = "violet";
const LS_THEME = "creahq:hero-theme";
const LS_MODE = "creahq:mode";

type Mode = "light" | "dark";

function applyTheme(theme: HeroTheme, mode: Mode) {
  const root = document.documentElement;
  const brand = mode === "dark" ? theme.brandDark : theme.brandLight;
  const soft = mode === "dark" ? theme.softDark : theme.softLight;
  root.style.setProperty("--brand", `oklch(${brand})`);
  root.style.setProperty("--brand-soft", `oklch(${soft})`);
  // intentionally do NOT override --brand-ink / --surface — let .dark/:root rule.
}

function clearTheme() {
  const root = document.documentElement;
  ["--brand", "--brand-soft"].forEach((v) => root.style.removeProperty(v));
}

function applyMode(mode: Mode) {
  document.documentElement.classList.toggle("dark", mode === "dark");
}

export function useTheme() {
  const [themeId, setThemeId] = useState<string>(DEFAULT_THEME_ID);
  const [mode, setModeState] = useState<Mode>("light");

  useEffect(() => {
    try {
      const t = localStorage.getItem(LS_THEME) ?? DEFAULT_THEME_ID;
      const m = (localStorage.getItem(LS_MODE) as Mode | null) ?? "light";
      setThemeId(t);
      setModeState(m);
      applyMode(m);
      const found = HERO_THEMES.find((x) => x.id === t);
      if (found && found.id !== DEFAULT_THEME_ID) applyTheme(found, m);
      else clearTheme();
    } catch { /* noop */ }
  }, []);

  const setTheme = useCallback((id: string) => {
    const found = HERO_THEMES.find((x) => x.id === id);
    if (!found) return;
    setThemeId(id);
    try { localStorage.setItem(LS_THEME, id); } catch { /* noop */ }
    if (id === DEFAULT_THEME_ID) clearTheme();
    else applyTheme(found, mode);
  }, [mode]);

  const resetTheme = useCallback(() => {
    setThemeId(DEFAULT_THEME_ID);
    try { localStorage.removeItem(LS_THEME); } catch { /* noop */ }
    clearTheme();
  }, []);

  const setExplicitMode = useCallback((m: Mode) => {
    setModeState(m);
    try { localStorage.setItem(LS_MODE, m); } catch { /* noop */ }
    applyMode(m);
    const found = HERO_THEMES.find((x) => x.id === themeId);
    if (found && found.id !== DEFAULT_THEME_ID) applyTheme(found, m);
  }, [themeId]);

  const toggleMode = useCallback(() => {
    setExplicitMode(mode === "light" ? "dark" : "light");
  }, [mode, setExplicitMode]);

  return { themeId, setTheme, resetTheme, mode, toggleMode, setMode: setExplicitMode };
}
