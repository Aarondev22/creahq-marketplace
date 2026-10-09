import { useEffect, useState } from "react";
import { Code2, Puzzle, Plus, Trash2, Check, Crown } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import {
  parseTheme, parseBadges, TEMPLATES, CARD_FX_OPTIONS, BG_OPTIONS, BADGE_STYLES, FREE_BADGES, PRO_BADGES,
  type ShopTheme, type ShopBadge,
} from "@/lib/shopTheme";
import { parseShopCode, CODE_CHEATSHEET, MAX_BLOCKS, type ShopBlock } from "@/lib/shopCode";
import { CodeFrame, ShopCustomContent } from "./ShopCustomContent";

const NEW_BLOCK: Record<ShopBlock["type"], ShopBlock> = {
  text: { type: "text", title: "Über uns", body: "" },
  quote: { type: "quote", text: "", author: "" },
  faq: { type: "faq", q: "Frage?", a: "" },
  image: { type: "image", url: "" },
};
const BLOCK_LABEL: Record<ShopBlock["type"], string> = { text: "📝 Text", quote: "💬 Kundenstimme", faq: "❓ FAQ", image: "🖼️ Bild" };
const field = "w-full rounded-2xl border border-border bg-background px-3 py-2 text-sm text-brand-ink focus:border-brand focus:outline-none";

export function ShopDesignEditor({ userId }: { userId: string }) {
  const [isPro, setIsPro] = useState(false);
  const [raw, setRaw] = useState<Record<string, unknown>>({});
  const [theme, setTheme] = useState<ShopTheme | null>(null);
  const [badges, setBadges] = useState<ShopBadge[]>([]);
  const [mode, setMode] = useState<"code" | "blocks">("code");
  const [html, setHtml] = useState("");
  const [css, setCss] = useState("");
  const [blocks, setBlocks] = useState<ShopBlock[]>([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    void supabase.from("profiles").select("is_pro,shop_theme,shop_badges").eq("id", userId).maybeSingle().then(({ data }) => {
      const pro = !!data?.is_pro;
      const r = (data?.shop_theme && typeof data.shop_theme === "object" ? data.shop_theme : {}) as Record<string, unknown>;
      setIsPro(pro); setRaw(r);
      setTheme(parseTheme(r, pro));
      setBadges(parseBadges(data?.shop_badges, pro));
      const c = parseShopCode(r, pro);
      setMode(c.mode); setHtml(c.html); setCss(c.css); setBlocks(c.blocks);
    });
  }, [userId]);

  if (!theme) return <div className="mt-6 h-40 animate-pulse rounded-3xl bg-brand-soft/50" />;
  const maxBadges = isPro ? PRO_BADGES : FREE_BADGES;

  async function save() {
    if (!theme) return;
    setSaving(true);
    const shop_theme = { ...raw, ...theme, mode, customHtml: html, customCss: css, blocks: isPro ? blocks : [] };
    const { error } = await supabase.from("profiles").update({ shop_theme, shop_badges: badges.slice(0, maxBadges) }).eq("id", userId);
    setSaving(false);
    if (error) toast.error(error.message); else toast.success("Design gespeichert ✨");
  }

  const setB = (i: number, b: ShopBlock) => setBlocks(blocks.map((x, j) => (j === i ? b : x)));

  return (
    <section className="mt-6 space-y-5 rounded-3xl border border-border bg-card p-6 sm:p-8">
      <h2 className="inline-flex items-center gap-2 font-display text-2xl font-black text-brand-ink">
        🎨 Shop-Design {isPro ? <span className="inline-flex items-center gap-1 rounded-full bg-brand px-3 py-1 text-xs text-primary-foreground"><Crown className="h-3 w-3" /> Pro</span> : <span className="rounded-full bg-muted px-3 py-1 text-xs">Standard</span>}
      </h2>

      {isPro && (
        <div>
          <p className="mb-2 text-xs font-bold uppercase tracking-widest text-muted-foreground">1-Klick-Designs</p>
          <div className="flex flex-wrap gap-2">
            {TEMPLATES.map((t) => (
              <button key={t.key} type="button" onClick={() => setTheme({ ...theme, ...t.theme, template: t.key, marquee: t.marquee })}
                className={`min-h-11 rounded-full border px-4 text-sm font-bold ${theme.template === t.key ? "border-brand bg-brand-soft" : "border-border"}`}>{t.label}</button>
            ))}
          </div>
        </div>
      )}

      <div className="grid gap-3 sm:grid-cols-3">
        <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Akzentfarbe
          <input type="color" value={theme.accent} onChange={(e) => setTheme({ ...theme, accent: e.target.value, template: null })} className="mt-1.5 h-12 w-full rounded-2xl" />
        </label>
        <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Hintergrund
          <select value={theme.bg} onChange={(e) => setTheme({ ...theme, bg: e.target.value as ShopTheme["bg"] })} className={`${field} mt-1.5 min-h-12`}>
            {BG_OPTIONS.filter((o) => o.key !== "image").map((o) => <option key={o.key} value={o.key} disabled={o.pro && !isPro}>{o.label}{o.pro && !isPro ? " (Pro)" : ""}</option>)}
          </select>
        </label>
        <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Animation
          <select value={theme.cardFx} onChange={(e) => setTheme({ ...theme, cardFx: e.target.value as ShopTheme["cardFx"] })} className={`${field} mt-1.5 min-h-12`}>
            {CARD_FX_OPTIONS.map((o) => <option key={o.key} value={o.key} disabled={o.pro && !isPro}>{o.label}{o.pro && !isPro ? " (Pro)" : ""}</option>)}
          </select>
        </label>
      </div>

      <label className="block text-xs font-bold uppercase tracking-widest text-muted-foreground">Laufband-Text
        <input value={theme.marquee} maxLength={120} onChange={(e) => setTheme({ ...theme, marquee: e.target.value })} className={`${field} mt-1.5 min-h-12`} placeholder="✨ Neue Drops jeden Freitag ✨" />
      </label>

      <div>
        <p className="mb-2 text-xs font-bold uppercase tracking-widest text-muted-foreground">Badges ({badges.length}/{maxBadges})</p>
        <div className="space-y-2">
          {badges.map((b, i) => (
            <div key={i} className="flex gap-2">
              <input value={b.emoji} maxLength={4} onChange={(e) => setBadges(badges.map((x, j) => j === i ? { ...x, emoji: e.target.value } : x))} className={`${field} w-16`} />
              <input value={b.text} maxLength={32} onChange={(e) => setBadges(badges.map((x, j) => j === i ? { ...x, text: e.target.value } : x))} className={field} />
              <select value={b.style} onChange={(e) => setBadges(badges.map((x, j) => j === i ? { ...x, style: e.target.value as ShopBadge["style"] } : x))} className={`${field} w-32`}>
                {BADGE_STYLES.map((s) => <option key={s.key} value={s.key}>{s.label}</option>)}
              </select>
              <button type="button" aria-label="Badge löschen" onClick={() => setBadges(badges.filter((_, j) => j !== i))} className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-muted"><Trash2 className="h-4 w-4" /></button>
            </div>
          ))}
          {badges.length < maxBadges && (
            <button type="button" onClick={() => setBadges([...badges, { emoji: "✨", text: "Handgemacht", style: "pill" }])} className="inline-flex min-h-11 items-center gap-1 rounded-full border border-dashed border-brand/50 px-4 text-sm font-bold text-brand-ink"><Plus className="h-4 w-4" /> Badge</button>
          )}
        </div>
      </div>

      <div className="flex gap-2">
        <button type="button" onClick={() => setMode("code")} className={`inline-flex min-h-11 items-center gap-2 rounded-full px-4 text-sm font-bold ${mode === "code" ? "bg-brand text-primary-foreground" : "border border-border"}`}><Code2 className="h-4 w-4" /> Eigener Code</button>
        <button type="button" onClick={() => isPro ? setMode("blocks") : toast("Bausteine gibt's mit Pro 👑")} className={`inline-flex min-h-11 items-center gap-2 rounded-full px-4 text-sm font-bold ${mode === "blocks" ? "bg-brand text-primary-foreground" : "border border-border"} ${!isPro ? "opacity-60" : ""}`}><Puzzle className="h-4 w-4" /> Bausteine {!isPro && "(Pro)"}</button>
      </div>

      {mode === "code" ? (
        <div className="space-y-3">
          <div className="flex flex-wrap gap-2">
            {CODE_CHEATSHEET.map((c) => (
              <button key={c.label} type="button" onClick={() => c.code.startsWith("<") ? setHtml(html + "\n" + c.code) : setCss(css + "\n" + c.code)} className="rounded-full bg-muted px-3 py-1.5 text-xs font-bold">+ {c.label}</button>
            ))}
          </div>
          <div className="grid gap-3 lg:grid-cols-2">
            <textarea value={html} onChange={(e) => setHtml(e.target.value)} rows={8} placeholder="HTML …" className={`${field} font-mono`} spellCheck={false} />
            <textarea value={css} onChange={(e) => setCss(e.target.value)} rows={8} placeholder="CSS …" className={`${field} font-mono`} spellCheck={false} />
          </div>
          <p className="text-xs text-muted-foreground">Live-Vorschau · Skripte sind aus Sicherheitsgründen gesperrt.</p>
          <CodeFrame html={html} css={css} />
        </div>
      ) : (
        <div className="space-y-3">
          {blocks.map((b, i) => (
            <div key={i} className="space-y-2 rounded-2xl border border-border p-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-bold">{BLOCK_LABEL[b.type]}</span>
                <button type="button" aria-label="Baustein löschen" onClick={() => setBlocks(blocks.filter((_, j) => j !== i))} className="grid h-10 w-10 place-items-center rounded-xl bg-muted"><Trash2 className="h-4 w-4" /></button>
              </div>
              {b.type === "text" && (<><input value={b.title} onChange={(e) => setB(i, { ...b, title: e.target.value })} className={field} placeholder="Titel" /><textarea value={b.body} onChange={(e) => setB(i, { ...b, body: e.target.value })} className={field} rows={3} placeholder="Text" /></>)}
              {b.type === "quote" && (<><textarea value={b.text} onChange={(e) => setB(i, { ...b, text: e.target.value })} className={field} rows={2} placeholder="Zitat" /><input value={b.author} onChange={(e) => setB(i, { ...b, author: e.target.value })} className={field} placeholder="Name" /></>)}
              {b.type === "faq" && (<><input value={b.q} onChange={(e) => setB(i, { ...b, q: e.target.value })} className={field} placeholder="Frage" /><textarea value={b.a} onChange={(e) => setB(i, { ...b, a: e.target.value })} className={field} rows={2} placeholder="Antwort" /></>)}
              {b.type === "image" && <input value={b.url} onChange={(e) => setB(i, { ...b, url: e.target.value })} className={field} placeholder="https://… Bild-Link" />}
            </div>
          ))}
          {blocks.length < MAX_BLOCKS && (
            <div className="flex flex-wrap gap-2">
              {(Object.keys(NEW_BLOCK) as ShopBlock["type"][]).map((t) => (
                <button key={t} type="button" onClick={() => setBlocks([...blocks, NEW_BLOCK[t]])} className="inline-flex min-h-11 items-center gap-1 rounded-full border border-dashed border-brand/50 px-4 text-sm font-bold"><Plus className="h-4 w-4" /> {BLOCK_LABEL[t]}</button>
              ))}
            </div>
          )}
          <ShopCustomContent code={{ mode: "blocks", html: "", css: "", blocks }} />
        </div>
      )}

      <button type="button" onClick={save} disabled={saving} className="inline-flex min-h-12 items-center gap-2 rounded-full bg-brand px-6 text-sm font-bold text-primary-foreground disabled:opacity-60">
        <Check className="h-4 w-4" /> {saving ? "Speichere …" : "Design speichern"}
      </button>
    </section>
  );
}
