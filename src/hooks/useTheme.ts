import { useEffect, useState, useCallback } from "react";

/**
 * A theme swaps a couple of CSS custom properties globally.
 *
 * Country themes work differently from color themes:
 *   - The page surface stays pure white (light) or pure black (dark).
 *   - On top of that surface sits a soft, "verflossen" gradient painted
 *     from the flag's stripes in their real proportions and order.
 *   - Buttons invert: white in light mode, black in dark mode, so they
 *     read as neutral chrome on top of the colorful flag background.
 */
export type Stripes = {
  /** "h" = horizontal stripes (colors flow top→bottom), "v" = vertical (left→right). */
  dir: "h" | "v";
  /** Bands as [hex, weight]. Weights are relative — they get normalized. */
  bands: Array<[string, number]>;
};

export type HeroTheme = {
  id: string;
  label: string;
  emoji: string;
  kind: "color" | "country";
  /** Full CSS color for `--brand`. */
  brandLight: string;
  brandDark: string;
  /** Full CSS color for `--brand-soft`. */
  softLight: string;
  softDark: string;
  /** Country themes only — used to build the melted flag background. */
  stripes?: Stripes;
  /** Display swatches (hex) — country themes render these below the emoji. */
  swatches?: string[];
};

/* ---------- helpers ---------- */

function hexRgba(hex: string, a: number) {
  const h = hex.replace("#", "");
  const r = parseInt(h.slice(0, 2), 16);
  const g = parseInt(h.slice(2, 4), 16);
  const b = parseInt(h.slice(4, 6), 16);
  return `rgba(${r},${g},${b},${a})`;
}

/**
 * Build a soft, "verflossen" flag-colored gradient in proportional stripes.
 * The gradient is painted with semi-transparent colors on top of a pure
 * white (light) or pure black (dark) page surface, so it feels like the
 * flag's colors have melted into the page — recognizably in flag order
 * and proportion, but never a hard flag graphic.
 */
function meltedStripes(stripes: Stripes, mode: "light" | "dark"): string {
  const alpha = mode === "dark" ? 0.55 : 0.5;
  const total = stripes.bands.reduce((s, [, w]) => s + w, 0) || 1;
  // Blend zone as a fraction of the full length — bigger = softer.
  const blend = 14;
  const angle = stripes.dir === "h" ? "180deg" : "90deg";

  const stops: string[] = [];
  let cursor = 0;
  stripes.bands.forEach(([hex, w], i) => {
    const size = (w / total) * 100;
    const start = cursor;
    const end = cursor + size;
    const rgba = hexRgba(hex, alpha);
    const first = i === 0 ? 0 : Math.min(100, start + blend / 2);
    const last = i === stripes.bands.length - 1 ? 100 : Math.max(0, end - blend / 2);
    stops.push(`${rgba} ${first.toFixed(2)}%`);
    stops.push(`${rgba} ${last.toFixed(2)}%`);
    cursor = end;
  });

  // Two crossing gradients for a modern, wavy feel — same stripe order
  // in both, one straight, one angled diagonally, softly averaged.
  const primary = `linear-gradient(${angle}, ${stops.join(", ")})`;
  const diagonalAngle = stripes.dir === "h" ? "155deg" : "115deg";
  const secondary = `linear-gradient(${diagonalAngle}, ${stops
    .map((s) => s.replace(/,([\d.]+)\)/, (_, a) => `,${(parseFloat(a) * 0.55).toFixed(3)})`))
    .join(", ")})`;

  return `${secondary}, ${primary}`;
}

function country(
  id: string,
  label: string,
  emoji: string,
  stripes: Stripes,
): HeroTheme {
  const swatches = stripes.bands.map(([c]) => c);
  return {
    id,
    label,
    emoji,
    kind: "country",
    // Buttons for country themes invert vs page surface, handled in applyTheme.
    brandLight: "#ffffff",
    brandDark: "#0a0a0a",
    softLight: "rgba(0,0,0,0.06)",
    softDark:  "rgba(255,255,255,0.10)",
    stripes,
    swatches,
  };
}

/* ---------- theme catalog ---------- */

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

// Flag stripe data — direction + bands in real proportion (top→bottom for "h", left→right for "v").
export const COUNTRY_THEMES: HeroTheme[] = [
  country("c-de", "Deutschland",  "🇩🇪", { dir: "h", bands: [["#000000", 1], ["#DD0000", 1], ["#FFCC00", 1]] }),
  country("c-fr", "Frankreich",   "🇫🇷", { dir: "v", bands: [["#0055A4", 1], ["#FFFFFF", 1], ["#EF4135", 1]] }),
  country("c-it", "Italien",      "🇮🇹", { dir: "v", bands: [["#008C45", 1], ["#F4F5F0", 1], ["#CD212A", 1]] }),
  country("c-es", "Spanien",      "🇪🇸", { dir: "h", bands: [["#AA151B", 1], ["#F1BF00", 2], ["#AA151B", 1]] }),
  country("c-nl", "Niederlande",  "🇳🇱", { dir: "h", bands: [["#AE1C28", 1], ["#FFFFFF", 1], ["#21468B", 1]] }),
  country("c-be", "Belgien",      "🇧🇪", { dir: "v", bands: [["#000000", 1], ["#FDDA24", 1], ["#EF3340", 1]] }),
  country("c-ch", "Schweiz",      "🇨🇭", { dir: "h", bands: [["#DA291C", 1], ["#FFFFFF", 1], ["#DA291C", 1]] }),
  country("c-at", "Österreich",   "🇦🇹", { dir: "h", bands: [["#ED2939", 1], ["#FFFFFF", 1], ["#ED2939", 1]] }),
  country("c-gb", "UK",           "🇬🇧", { dir: "v", bands: [["#012169", 1], ["#FFFFFF", 1], ["#C8102E", 1], ["#FFFFFF", 1], ["#012169", 1]] }),
  country("c-ie", "Irland",       "🇮🇪", { dir: "v", bands: [["#169B62", 1], ["#FFFFFF", 1], ["#FF883E", 1]] }),
  country("c-se", "Schweden",     "🇸🇪", { dir: "h", bands: [["#006AA7", 2], ["#FECC00", 1], ["#006AA7", 2]] }),
  country("c-no", "Norwegen",     "🇳🇴", { dir: "h", bands: [["#BA0C2F", 2], ["#FFFFFF", 1], ["#00205B", 1], ["#FFFFFF", 1], ["#BA0C2F", 2]] }),
  country("c-dk", "Dänemark",     "🇩🇰", { dir: "h", bands: [["#C60C30", 2], ["#FFFFFF", 1], ["#C60C30", 2]] }),
  country("c-fi", "Finnland",     "🇫🇮", { dir: "h", bands: [["#FFFFFF", 2], ["#003580", 1], ["#FFFFFF", 2]] }),
  country("c-pt", "Portugal",     "🇵🇹", { dir: "v", bands: [["#046A38", 2], ["#DA291C", 3]] }),
  country("c-gr", "Griechenland", "🇬🇷", { dir: "h", bands: [["#0D5EAF", 1], ["#FFFFFF", 1], ["#0D5EAF", 1], ["#FFFFFF", 1], ["#0D5EAF", 1]] }),
  country("c-pl", "Polen",        "🇵🇱", { dir: "h", bands: [["#FFFFFF", 1], ["#DC143C", 1]] }),
  country("c-jp", "Japan",        "🇯🇵", { dir: "h", bands: [["#FFFFFF", 2], ["#BC002D", 1], ["#FFFFFF", 2]] }),
  country("c-us", "USA",          "🇺🇸", { dir: "h", bands: [["#B22234", 1], ["#FFFFFF", 1], ["#B22234", 1], ["#FFFFFF", 1], ["#3C3B6E", 1]] }),
  country("c-br", "Brasilien",    "🇧🇷", { dir: "h", bands: [["#009C3B", 2], ["#FFDF00", 1], ["#002776", 1], ["#FFDF00", 1], ["#009C3B", 2]] }),
];

export const HERO_THEMES: HeroTheme[] = [...COLOR_THEMES, ...COUNTRY_THEMES];

const DEFAULT_THEME_ID = "violet";
const LS_THEME = "creahq:hero-theme";
const LS_MODE = "creahq:mode";

type Mode = "light" | "dark";

/** Vars we set — cleared together to avoid leaks between themes. */
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

  // Reset every override first so switching between kinds never leaks.
  OVERRIDE_VARS.forEach((v) => root.style.removeProperty(v));

  if (theme.kind === "country" && theme.stripes) {
    // Pure surface behind the flag gradient — white in light, black in dark.
    const surface = mode === "dark" ? "#000000" : "#ffffff";
    root.style.setProperty("--surface", surface);
    root.style.setProperty("--background", surface);

    // Buttons invert vs surface so they read as neutral chrome.
    const btn = mode === "dark" ? "#0a0a0a" : "#ffffff";
    const btnInk = mode === "dark" ? "#f5f5f5" : "#111111";
    root.style.setProperty("--brand", btn);
    root.style.setProperty("--brand-soft", mode === "dark" ? "rgba(255,255,255,0.10)" : "rgba(0,0,0,0.06)");
    root.style.setProperty("--primary-foreground", btnInk);
    root.style.setProperty("--sidebar-primary-foreground", btnInk);

    root.style.setProperty("--page-bg-image", meltedStripes(theme.stripes, mode));
    return;
  }

  // Color theme — just brand + soft; page bg stays default.
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
      try { localStorage.removeItem("creahq:country-theme"); } catch { /* noop */ }
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
    else clearTheme();
  }, [themeId]);

  const toggleMode = useCallback(() => {
    setExplicitMode(mode === "light" ? "dark" : "light");
  }, [mode, setExplicitMode]);

  return { themeId, setTheme, resetTheme, mode, toggleMode, setMode: setExplicitMode };
}
