// Browser- und server-sichere Shop-Design-Definitionen (keine Imports).

export type ShopBg = "none" | "image" | "bubbles" | "confetti" | "waves" | "stars" | "blobs";
export type CardFx = "none" | "zoom" | "tilt" | "pop";
export type Entrance = "rise" | "pop" | "slide";
export type BadgeStyle = "pill" | "neon" | "sticker" | "minimal";

export type ShopBadge = { emoji: string; text: string; style: BadgeStyle };

export type ShopTheme = {
  accent: string;
  bg: ShopBg;
  bgImage: string | null;
  cardFx: CardFx;
  entrance: Entrance;
  marquee: string;
  template: string | null;
};

export const FREE_BADGES = 3;
export const PRO_BADGES = 5;

export const DEFAULT_THEME: ShopTheme = {
  accent: "#8b5cf6",
  bg: "none",
  bgImage: null,
  cardFx: "zoom",
  entrance: "rise",
  marquee: "",
  template: null,
};

export const BG_OPTIONS: { key: ShopBg; label: string; pro: boolean }[] = [
  { key: "none", label: "Schlicht", pro: false },
  { key: "image", label: "Eigenes Bild", pro: false },
  { key: "bubbles", label: "Seifenblasen 🫧", pro: false },
  { key: "confetti", label: "Farbkleckse 🎨", pro: false },
  { key: "waves", label: "Wellen 🌊", pro: false },
  { key: "stars", label: "Sternenstaub ✨", pro: true },
  { key: "blobs", label: "Liquid Blobs 🫠", pro: true },
];

export const CARD_FX_OPTIONS: { key: CardFx; label: string; pro: boolean }[] = [
  { key: "none", label: "Ruhig", pro: false },
  { key: "zoom", label: "Smooth Zoom 🔍", pro: false },
  { key: "pop", label: "Feder-Pop 🪀", pro: false },
  { key: "tilt", label: "3D-Kippen 🧊", pro: true },
];

export const ENTRANCE_OPTIONS: { key: Entrance; label: string }[] = [
  { key: "rise", label: "Sanft aufsteigen" },
  { key: "pop", label: "Aufploppen" },
  { key: "slide", label: "Reinrutschen" },
];

export const BADGE_STYLES: { key: BadgeStyle; label: string }[] = [
  { key: "pill", label: "Pille" },
  { key: "neon", label: "Neon" },
  { key: "sticker", label: "Sticker" },
  { key: "minimal", label: "Minimal" },
];

export const TEMPLATES: { key: string; label: string; theme: Omit<ShopTheme, "template" | "bgImage" | "marquee">; marquee: string }[] = [
  { key: "neon", label: "Cyber Neon", theme: { accent: "#22d3ee", bg: "stars", cardFx: "tilt", entrance: "slide" }, marquee: "⚡ Neue Drops jede Woche · Digital first ⚡" },
  { key: "pastel", label: "Pastel Dream", theme: { accent: "#f472b6", bg: "bubbles", cardFx: "pop", entrance: "pop" }, marquee: "🍬 Handgemacht mit Liebe · Jedes Stück ein Unikat 🍬" },
  { key: "cozy", label: "Cozy Studio", theme: { accent: "#d97706", bg: "waves", cardFx: "zoom", entrance: "rise" }, marquee: "☕ Kleine Werkstatt · Große Liebe zum Detail ☕" },
  { key: "splash", label: "Artistic Splash", theme: { accent: "#8b5cf6", bg: "blobs", cardFx: "tilt", entrance: "pop" }, marquee: "🎨 Kunst zum Anfassen · Versand mit Herz 🎨" },
];

const HEX = /^#[0-9a-fA-F]{6}$/;

function pick<T extends string>(v: unknown, allowed: readonly T[], fallback: T): T {
  return typeof v === "string" && (allowed as readonly string[]).includes(v) ? (v as T) : fallback;
}

export function parseTheme(raw: unknown, isPro: boolean): ShopTheme {
  const r = (raw && typeof raw === "object" ? raw : {}) as Record<string, unknown>;
  const t: ShopTheme = {
    accent: typeof r.accent === "string" && HEX.test(r.accent) ? r.accent : DEFAULT_THEME.accent,
    bg: pick(r.bg, BG_OPTIONS.map((o) => o.key), "none"),
    bgImage: typeof r.bgImage === "string" ? r.bgImage : null,
    cardFx: pick(r.cardFx, CARD_FX_OPTIONS.map((o) => o.key), "zoom"),
    entrance: pick(r.entrance, ENTRANCE_OPTIONS.map((o) => o.key), "rise"),
    marquee: typeof r.marquee === "string" ? r.marquee.slice(0, 120) : "",
    template: typeof r.template === "string" ? r.template : null,
  };
  // Pro-Effekte fallen ohne Pro auf freie Varianten zurück.
  if (!isPro) {
    if (BG_OPTIONS.find((o) => o.key === t.bg)?.pro) t.bg = "bubbles";
    if (CARD_FX_OPTIONS.find((o) => o.key === t.cardFx)?.pro) t.cardFx = "zoom";
    t.template = null;
  }
  if (t.bg === "image" && !t.bgImage) t.bg = "none";
  return t;
}

export function parseBadges(raw: unknown, isPro: boolean): ShopBadge[] {
  const arr = Array.isArray(raw) ? raw : [];
  return arr
    .map((b) => {
      const o = (b && typeof b === "object" ? b : {}) as Record<string, unknown>;
      return {
        emoji: typeof o.emoji === "string" ? o.emoji.slice(0, 4) : "✨",
        text: typeof o.text === "string" ? o.text.slice(0, 32) : "",
        style: pick(o.style, BADGE_STYLES.map((s) => s.key), "pill"),
      };
    })
    .filter((b) => b.text.trim().length > 0)
    .slice(0, isPro ? PRO_BADGES : FREE_BADGES);
}

/** Faire Pro-Platzierung: Top-Plätze für die relevantesten Pro-Treffer, Rotation alle 3h. */
export function applyProSpotlight<T extends { id: string; seller_id: string }>(
  list: T[],
  proSellers: Set<string>,
  spots = 2,
  now = Date.now(),
): (T & { spotlight?: boolean })[] {
  if (proSellers.size === 0) return list;
  const pro = list.filter((l) => proSellers.has(l.seller_id));
  if (pro.length === 0) return list;
  // Kandidaten = die relevantesten Pro-Treffer (Liste ist bereits nach Relevanz sortiert).
  const pool = pro.slice(0, Math.max(spots * 3, spots));
  const slot = Math.floor(now / (3 * 60 * 60 * 1000));
  const start = slot % pool.length;
  const chosen: T[] = [];
  const usedSellers = new Set<string>();
  for (let i = 0; i < pool.length && chosen.length < spots; i++) {
    const c = pool[(start + i) % pool.length];
    if (usedSellers.has(c.seller_id)) continue;
    usedSellers.add(c.seller_id);
    chosen.push(c);
  }
  const ids = new Set(chosen.map((c) => c.id));
  return [...chosen.map((c) => ({ ...c, spotlight: true })), ...list.filter((l) => !ids.has(l.id))];
}
