import { useEffect, useState, useCallback } from "react";

/**
 * Ein Theme tauscht nur ein paar globale CSS-Variablen. Nur Farb-Themes —
 * Länder-Themes wurden entfernt, die Stimmung war unrund.
 */
export type HeroTheme = {
  id: string;
  label: string;
  emoji: string;
  kind: "color";
  brandLight: string;
  brandDark: string;
  softLight: string;
  softDark: string;
};

export const COLOR_THEMES: HeroTheme[] = [
  { id: "candy",  label: "Candy",  emoji: "🍭", kind: "color",
    brandLight: "oklch(0.62 0.24 340)", brandDark: "oklch(0.74 0.2 340)",
    softLight:  "oklch(0.93 0.06 340)", softDark:  "oklch(0.3 0.1 340)" },
  { id: "sun",    label: "Sun",    emoji: "🌞", kind: "color",
    brandLight: "oklch(0.7 0.18 55)",   brandDark: "oklch(0.78 0.16 60)",
    softLight:  "oklch(0.94 0.07 70)",  softDark:  "oklch(0.32 0.09 55)" },
  { id: "forest", label: "Forest", emoji: "🌿", kind: "color",
    brandLight: "oklch(0.55 0.16 150)", brandDark: "oklch(0.72 0.16 150)",
    softLight:  "oklch(0.93 0.06 150)", softDark:  "oklch(0.3 0.09 150)" },
  { id: "ocean",  label: "Ocean",  emoji: "🌊", kind: "color",
    brandLight: "oklch(0.58 0.16 230)", brandDark: "oklch(0.72 0.16 230)",
    softLight:  "oklch(0.93 0.06 230)", softDark:  "oklch(0.3 0.1 230)" },
  { id: "violet", label: "Violet", emoji: "🪻", kind: "color",
    brandLight: "oklch(0.52 0.22 295)", brandDark: "oklch(0.7 0.2 295)",
    softLight:  "oklch(0.92 0.06 295)", softDark:  "oklch(0.3 0.1 295)" },
];

export const HERO_THEMES: HeroTheme[] = COLOR_THEMES;

const DEFAULT_THEME_ID = "violet";
const LS_THEME = "creahq:hero-theme";
const LS_MODE = "creahq:mode";

type Mode = "light" | "dark";

const OVERRIDE_VARS = [
  "--brand",
  "--brand-soft",
  "--page-bg-image",
  "--background",
  "--surface",
  "--primary-foreground",
  "--sidebar-primary-foreground",
] as const;

function applyTheme(theme: HeroTheme, mode: Mode) {
  const root = document.documentElement;
  OVERRIDE_VARS.forEach((v) => root.style.removeProperty(v));
  root.style.setProperty("--brand", mode === "dark" ? theme.brandDark : theme.brandLight);
  root.style.setProperty("--brand-soft", mode === "dark" ? theme.softDark : theme.softLight);
}

function clearTheme() {
  const root = document.documentElement;
  OVERRIDE_VARS.forEach((v) => root.style.removeProperty(v));
}

function applyMode(mode: Mode) {
  document.documentElement.classList.toggle("dark", mode === "dark");
}

export function useTheme() {
  const [themeId, setThemeId] = useState<string>(DEFAULT_THEME_ID);
  const [mode, setModeState] = useState<Mode>("light");

  useEffect(() => {
    try {
      // Alte Länder-Theme-Reste aufräumen
      try { localStorage.removeItem("creahq:country-theme"); } catch { /* noop */ }
      const stored = localStorage.getItem(LS_THEME) ?? DEFAULT_THEME_ID;
      // Falls jemand noch ein altes "c-*" Country-Theme gespeichert hatte
      const t = stored.startsWith("c-") ? DEFAULT_THEME_ID : stored;
      if (t !== stored) { try { localStorage.setItem(LS_THEME, t); } catch { /* noop */ } }
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
    else clearTheme();
  }, [themeId]);

  const toggleMode = useCallback(() => {
    setExplicitMode(mode === "light" ? "dark" : "light");
  }, [mode, setExplicitMode]);

  return { themeId, setTheme, resetTheme, mode, toggleMode, setMode: setExplicitMode };
}
