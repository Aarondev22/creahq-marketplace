import { useEffect, useState, useCallback } from "react";

/**
 * A theme swaps a couple of CSS custom properties globally.
 * Country themes additionally set `--page-bg-image` so the whole
 * site background gets a modern, "melted" gradient in flag colors.
 * Light/Dark mode still applies — the gradient just uses different
 * alpha and the brand/soft variants swap accordingly.
 */
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
  /** Optional page background gradient — used by country themes. */
  pageBgLight?: string;
  pageBgDark?: string;
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

/** Build a modern, "verflossen" three-color gradient background. */
function melted(colors: [string, string, string], mode: "light" | "dark") {
  const a = mode === "dark" ? 0.32 : 0.22;
  const b = mode === "dark" ? 0.24 : 0.16;
  return [
    `radial-gradient(70% 60% at 12% 15%, ${hexRgba(colors[0], a)} 0%, transparent 65%)`,
    `radial-gradient(70% 60% at 88% 25%, ${hexRgba(colors[1], a)} 0%, transparent 65%)`,
    `radial-gradient(90% 70% at 50% 110%, ${hexRgba(colors[2], a)} 0%, transparent 70%)`,
    `linear-gradient(135deg, ${hexRgba(colors[0], b)}, ${hexRgba(colors[2], b)})`,
  ].join(", ");
}

/** Signature (non-white) color for --brand. */
function pickBrand(colors: [string, string, string]) {
  const nonWhite = colors.find((c) => c.toLowerCase() !== "#ffffff" && c.toLowerCase() !== "#f4f5f0");
  return nonWhite ?? colors[0];
}

/** Simple hex mix with white or near-black. */
function tint(hex: string, mix: string, ratio: number) {
  const parse = (h: string) => {
    const s = h.replace("#", "");
    return [parseInt(s.slice(0, 2), 16), parseInt(s.slice(2, 4), 16), parseInt(s.slice(4, 6), 16)];
  };
  const [r1, g1, b1] = parse(hex);
  const [r2, g2, b2] = parse(mix);
  const r = Math.round(r1 * (1 - ratio) + r2 * ratio);
  const g = Math.round(g1 * (1 - ratio) + g2 * ratio);
  const b = Math.round(b1 * (1 - ratio) + b2 * ratio);
  return `rgb(${r},${g},${b})`;
}

function country(
  id: string,
  label: string,
  emoji: string,
  colors: [string, string, string],
): HeroTheme {
  const brand = pickBrand(colors);
  return {
    id,
    label,
    emoji,
    kind: "country",
    brandLight: brand,
    brandDark: tint(brand, "#ffffff", 0.15),
    softLight: tint(brand, "#ffffff", 0.85),
    softDark: tint(brand, "#111111", 0.7),
    pageBgLight: melted(colors, "light"),
    pageBgDark: melted(colors, "dark"),
    swatches: colors,
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

export const COUNTRY_THEMES: HeroTheme[] = [
  country("c-de", "Deutschland",  "🇩🇪", ["#000000", "#DD0000", "#FFCC00"]),
  country("c-fr", "Frankreich",   "🇫🇷", ["#0055A4", "#FFFFFF", "#EF4135"]),
  country("c-it", "Italien",      "🇮🇹", ["#008C45", "#F4F5F0", "#CD212A"]),
  country("c-es", "Spanien",      "🇪🇸", ["#AA151B", "#F1BF00", "#AA151B"]),
  country("c-nl", "Niederlande",  "🇳🇱", ["#AE1C28", "#FFFFFF", "#21468B"]),
  country("c-be", "Belgien",      "🇧🇪", ["#000000", "#FDDA24", "#EF3340"]),
  country("c-ch", "Schweiz",      "🇨🇭", ["#DA291C", "#FFFFFF", "#DA291C"]),
  country("c-at", "Österreich",   "🇦🇹", ["#ED2939", "#FFFFFF", "#ED2939"]),
  country("c-gb", "UK",           "🇬🇧", ["#012169", "#FFFFFF", "#C8102E"]),
  country("c-ie", "Irland",       "🇮🇪", ["#169B62", "#FFFFFF", "#FF883E"]),
  country("c-se", "Schweden",     "🇸🇪", ["#006AA7", "#FECC00", "#006AA7"]),
  country("c-no", "Norwegen",     "🇳🇴", ["#BA0C2F", "#FFFFFF", "#00205B"]),
  country("c-dk", "Dänemark",     "🇩🇰", ["#C60C30", "#FFFFFF", "#C60C30"]),
  country("c-fi", "Finnland",     "🇫🇮", ["#003580", "#FFFFFF", "#003580"]),
  country("c-pt", "Portugal",     "🇵🇹", ["#046A38", "#FFE900", "#DA291C"]),
  country("c-gr", "Griechenland", "🇬🇷", ["#0D5EAF", "#FFFFFF", "#0D5EAF"]),
  country("c-pl", "Polen",        "🇵🇱", ["#FFFFFF", "#DC143C", "#FFFFFF"]),
  country("c-jp", "Japan",        "🇯🇵", ["#FFFFFF", "#BC002D", "#FFFFFF"]),
  country("c-us", "USA",          "🇺🇸", ["#B22234", "#FFFFFF", "#3C3B6E"]),
  country("c-br", "Brasilien",    "🇧🇷", ["#009C3B", "#FFDF00", "#002776"]),
];

export const HERO_THEMES: HeroTheme[] = [...COLOR_THEMES, ...COUNTRY_THEMES];

const DEFAULT_THEME_ID = "violet";
const LS_THEME = "creahq:hero-theme";
const LS_MODE = "creahq:mode";

type Mode = "light" | "dark";

function applyTheme(theme: HeroTheme, mode: Mode) {
  const root = document.documentElement;
  root.style.setProperty("--brand", mode === "dark" ? theme.brandDark : theme.brandLight);
  root.style.setProperty("--brand-soft", mode === "dark" ? theme.softDark : theme.softLight);
  const bg = mode === "dark" ? theme.pageBgDark : theme.pageBgLight;
  if (bg) root.style.setProperty("--page-bg-image", bg);
  else root.style.removeProperty("--page-bg-image");
}

function clearTheme() {
  const root = document.documentElement;
  ["--brand", "--brand-soft", "--page-bg-image"].forEach((v) => root.style.removeProperty(v));
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
  }, [themeId]);

  const toggleMode = useCallback(() => {
    setExplicitMode(mode === "light" ? "dark" : "light");
  }, [mode, setExplicitMode]);

  return { themeId, setTheme, resetTheme, mode, toggleMode, setMode: setExplicitMode };
}
