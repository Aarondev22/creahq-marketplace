// Eigener Shop-Code (Standard + Pro) und Bausteine (nur Pro). Liegen in profiles.shop_theme.

export type ShopBlock =
  | { type: "text"; title: string; body: string }
  | { type: "quote"; text: string; author: string }
  | { type: "faq"; q: string; a: string }
  | { type: "image"; url: string };

export type ShopCode = { mode: "code" | "blocks"; html: string; css: string; blocks: ShopBlock[] };

export const MAX_BLOCKS = 12;

const s = (v: unknown, max: number) => (typeof v === "string" ? v.slice(0, max) : "");

export function parseBlocks(raw: unknown): ShopBlock[] {
  if (!Array.isArray(raw)) return [];
  const out: ShopBlock[] = [];
  for (const b of raw.slice(0, MAX_BLOCKS)) {
    const o = (b && typeof b === "object" ? b : {}) as Record<string, unknown>;
    if (o.type === "text") out.push({ type: "text", title: s(o.title, 80), body: s(o.body, 1000) });
    else if (o.type === "quote") out.push({ type: "quote", text: s(o.text, 300), author: s(o.author, 60) });
    else if (o.type === "faq") out.push({ type: "faq", q: s(o.q, 160), a: s(o.a, 600) });
    else if (o.type === "image" && /^https:\/\//.test(s(o.url, 2000))) out.push({ type: "image", url: s(o.url, 2000) });
  }
  return out;
}

export function parseShopCode(raw: unknown, isPro: boolean): ShopCode {
  const r = (raw && typeof raw === "object" ? raw : {}) as Record<string, unknown>;
  const mode = isPro && r.mode === "blocks" ? "blocks" : "code";
  return { mode, html: s(r.customHtml, 20000), css: s(r.customCss, 20000), blocks: isPro ? parseBlocks(r.blocks) : [] };
}

/** Baut ein komplett abgeschottetes Dokument (keine Skripte, keine externen Requests außer Bildern). */
export function buildSandboxDoc(html: string, css: string): string {
  const cleanHtml = html.replace(/<\s*script[\s\S]*?<\s*\/\s*script\s*>/gi, "").replace(/\son\w+\s*=/gi, " data-x=");
  const cleanCss = css.replace(/@import[^;]*;?/gi, "").replace(/<\/style/gi, "");
  return `<!doctype html><html><head><meta charset="utf-8"><meta http-equiv="Content-Security-Policy" content="default-src 'none'; img-src https: data:; style-src 'unsafe-inline'; font-src data:"><style>body{margin:0;padding:16px;font-family:system-ui,sans-serif}${cleanCss}</style></head><body>${cleanHtml}</body></html>`;
}

export const CODE_CHEATSHEET = [
  { label: "Überschrift", code: "<h2>Willkommen!</h2>" },
  { label: "Text", code: "<p>Alles handgemacht.</p>" },
  { label: "Bild", code: '<img src="https://..." width="300">' },
  { label: "Animation: Zoom", code: "@keyframes zoom{from{transform:scale(.9)}to{transform:scale(1)}}\nh2{animation:zoom 1s ease}" },
  { label: "Animation: Pop", code: "@keyframes pop{50%{transform:scale(1.1)}}\n.pop{animation:pop .6s ease}" },
  { label: "Animation: Slide", code: "@keyframes slide{from{transform:translateY(20px);opacity:0}}\np{animation:slide .8s ease}" },
];
