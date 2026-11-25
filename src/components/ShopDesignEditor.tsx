import { useEffect, useState } from "react";
import { Code2, Puzzle, Plus, Trash2, Check, Crown, GripVertical, PanelLeftClose, PanelLeftOpen } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import {
  parseTheme, parseBadges, TEMPLATES, CARD_FX_OPTIONS, BG_OPTIONS, BADGE_STYLES, FREE_BADGES, PRO_BADGES,
  type ShopTheme, type ShopBadge, isProActive,
} from "@/lib/shopTheme";
import { parseShopCode, CODE_CHEATSHEET, MAX_BLOCKS, type ShopBlock } from "@/lib/shopCode";
import { CodeFrame, ShopCustomContent } from "./ShopCustomContent";

const NEW_BLOCK: Record<ShopBlock["type"], ShopBlock> = {
  heading: { type: "heading", title: "Überschrift" },
  text: { type: "text", title: "Über uns", body: "" },
  banner: { type: "banner", title: "Willkommen", body: "" },
  quote: { type: "quote", text: "", author: "" },
  faq: { type: "faq", q: "Frage?", a: "" },
  image: { type: "image", url: "" },
  button: { type: "button", label: "Mehr erfahren", url: "https://" },
  divider: { type: "divider" },
  spacer: { type: "spacer", height: 32 },
};
const BLOCK_LABEL: Record<ShopBlock["type"], string> = {
  heading: "Überschrift",
  text: "Text",
  banner: "Banner",
  quote: "Kundenstimme",
  faq: "FAQ",
  image: "Bild",
  button: "Link-Button",
  divider: "Trennlinie",
  spacer: "Abstand",
};
const STEPS = ["Style & Thema", "Badges & Laufband", "Code / Bausteine", "Vorschau & Live"];
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
  const [step, setStep] = useState(1);
  const [device, setDevice] = useState<"phone" | "desktop">("desktop");
  const [paletteOpen, setPaletteOpen] = useState(true);

  useEffect(() => {
    void supabase.from("profiles").select("is_pro,pro_expires_at,shop_theme,shop_badges").eq("id", userId).maybeSingle().then(({ data }) => {
    const pro = isProActive(!!data?.is_pro, data?.pro_expires_at);
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
    if (error) toast.error(error.message); else toast.success("Design gespeichert.");
  }

  const setB = (i: number, b: ShopBlock) => setBlocks(blocks.map((x, j) => (j === i ? b : x)));
  const addBlock = (type: ShopBlock["type"]) => {
    if (blocks.length >= MAX_BLOCKS) return;
    setBlocks((current) => [...current, { ...NEW_BLOCK[type] }]);
  };
  function moveBlock(from: number, to: number) {
    if (from === to || from < 0 || from >= blocks.length) return;
    setBlocks((current) => {
      const next = [...current];
      const [moved] = next.splice(from, 1);
      next.splice(Math.max(0, Math.min(to, next.length)), 0, moved!);
      return next;
    });
  }

  return (
    <section className="mt-6 space-y-5 rounded-3xl border border-border bg-card p-6 sm:p-8">
      <h2 className="inline-flex items-center gap-2 font-display text-2xl font-black text-brand-ink">
        Shop-Design {isPro ? <span className="inline-flex items-center gap-1 rounded-full bg-brand px-3 py-1 text-xs text-primary-foreground"><Crown className="h-3 w-3" /> Pro</span> : <span className="rounded-full bg-muted px-3 py-1 text-xs">Standard</span>}
      </h2>

      <ol className="flex flex-wrap items-center gap-2">
        {STEPS.map((label, i) => (
          <li key={label} className="flex items-center gap-2">
            <button type="button" onClick={() => setStep(i + 1)} className={`inline-flex min-h-11 items-center gap-2 rounded-full px-4 text-sm font-bold ${step === i + 1 ? "bg-brand text-primary-foreground" : step > i + 1 ? "bg-brand-soft text-brand-ink" : "border border-border text-muted-foreground"}`}>
              <span className="grid h-6 w-6 place-items-center rounded-full bg-background/30 text-xs">{step > i + 1 ? "✓" : i + 1}</span>{label}
            </button>
            {i < STEPS.length - 1 && <span className="h-0.5 w-4 bg-border" />}
          </li>
        ))}
      </ol>

      {step === 1 && (<>
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
      </>)}

      {step === 2 && (<>
      <label className="block text-xs font-bold uppercase tracking-widest text-muted-foreground">Laufband-Text
        <input value={theme.marquee} maxLength={120} onChange={(e) => setTheme({ ...theme, marquee: e.target.value })} className={`${field} mt-1.5 min-h-12`} placeholder="Neue Produkte jeden Freitag" />
      </label>

      <div>
        <p className="mb-2 text-xs font-bold uppercase tracking-widest text-muted-foreground">Badges ({badges.length}/{maxBadges})</p>
        <div className="space-y-2">
          {badges.map((b, i) => (
            <div key={i} className="flex gap-2">
              <input value={b.text} maxLength={32} onChange={(e) => setBadges(badges.map((x, j) => j === i ? { ...x, text: e.target.value } : x))} className={field} />
              <select value={b.style} onChange={(e) => setBadges(badges.map((x, j) => j === i ? { ...x, style: e.target.value as ShopBadge["style"] } : x))} className={`${field} w-32`}>
                {BADGE_STYLES.map((s) => <option key={s.key} value={s.key}>{s.label}</option>)}
              </select>
              <button type="button" aria-label="Badge löschen" onClick={() => setBadges(badges.filter((_, j) => j !== i))} className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-muted"><Trash2 className="h-4 w-4" /></button>
            </div>
          ))}
          {badges.length < maxBadges && (
            <button type="button" onClick={() => setBadges([...badges, { emoji: "", text: "Handgemacht", style: "pill" }])} className="inline-flex min-h-11 items-center gap-1 rounded-full border border-dashed border-brand/50 px-4 text-sm font-bold text-brand-ink"><Plus className="h-4 w-4" /> Badge</button>
          )}
        </div>
      </div>
      </>)}

      {step === 3 && (<>
      <div className="flex gap-2">
        <button type="button" onClick={() => setMode("code")} className={`inline-flex min-h-11 items-center gap-2 rounded-full px-4 text-sm font-bold ${mode === "code" ? "bg-brand text-primary-foreground" : "border border-border"}`}><Code2 className="h-4 w-4" /> Eigener Code</button>
        <button type="button" onClick={() => isPro ? setMode("blocks") : toast("Bausteine sind mit Pro verfügbar.")} className={`inline-flex min-h-11 items-center gap-2 rounded-full px-4 text-sm font-bold ${mode === "blocks" ? "bg-brand text-primary-foreground" : "border border-border"} ${!isPro ? "opacity-60" : ""}`}><Puzzle className="h-4 w-4" /> Bausteine {!isPro && "(Pro)"}</button>
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
        <div className={`grid min-w-0 gap-3 ${paletteOpen ? "lg:grid-cols-[14rem_minmax(0,1fr)]" : "grid-cols-1"}`}>
          <aside className={`rounded-2xl border border-border bg-surface p-3 ${paletteOpen ? "" : "hidden"}`}>
            <h3 className="font-bold text-brand-ink">Bausteine</h3>
            <p className="mt-1 text-xs text-muted-foreground">Zieh einen Baustein in die Arbeitsfläche oder tippe darauf.</p>
            <div className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-1">
              {(Object.keys(NEW_BLOCK) as ShopBlock["type"][]).map((type) => (
                <button
                  key={type}
                  type="button"
                  draggable={blocks.length < MAX_BLOCKS}
                  onClick={() => addBlock(type)}
                  onDragStart={(event) => {
                    event.dataTransfer.setData("application/x-creahq-block", type);
                    event.dataTransfer.effectAllowed = "copy";
                  }}
                  disabled={blocks.length >= MAX_BLOCKS}
                  className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-border bg-card px-3 text-left text-sm font-semibold text-brand-ink hover:border-brand disabled:opacity-50"
                >
                  <Plus className="h-4 w-4 text-brand" /> {BLOCK_LABEL[type]}
                </button>
              ))}
            </div>
            <p className="mt-3 text-xs text-muted-foreground">{blocks.length}/{MAX_BLOCKS} Bausteine</p>
          </aside>

          <div className="min-w-0 space-y-3">
            <div className="flex items-center justify-between gap-2">
              <button type="button" onClick={() => setPaletteOpen((open) => !open)} className="inline-flex min-h-10 items-center gap-2 rounded-full border border-border px-3 text-xs font-bold">
                {paletteOpen ? <PanelLeftClose className="h-4 w-4" /> : <PanelLeftOpen className="h-4 w-4" />}
                {paletteOpen ? "Bausteinmenü einklappen" : "Bausteine öffnen"}
              </button>
              <span className="text-xs text-muted-foreground">Arbeitsfläche · Bausteine hier ablegen</span>
            </div>
            <div
              onDragOver={(event) => event.preventDefault()}
              onDrop={(event) => {
                event.preventDefault();
                const paletteType = event.dataTransfer.getData("application/x-creahq-block");
                if (isShopBlockType(paletteType)) {
                  setBlocks((current) => current.length >= MAX_BLOCKS ? current : [...current, { ...NEW_BLOCK[paletteType] }]);
                  return;
                }
                const from = Number(event.dataTransfer.getData("application/x-creahq-index"));
                if (Number.isInteger(from)) moveBlock(from, blocks.length - 1);
              }}
              className="min-h-48 space-y-3 rounded-2xl border-2 border-dashed border-brand/30 bg-background p-3 sm:p-4"
            >
              {blocks.length === 0 ? (
                <div className="grid min-h-40 place-items-center text-center text-sm text-muted-foreground">
                  Baustein links auswählen oder hierher ziehen.
                </div>
              ) : blocks.map((b, i) => (
                <div
                  key={`${b.type}-${i}`}
                  draggable
                  onDragStart={(event) => {
                    event.dataTransfer.setData("application/x-creahq-index", String(i));
                    event.dataTransfer.effectAllowed = "move";
                  }}
                  onDragOver={(event) => event.preventDefault()}
                  onDrop={(event) => {
                    event.preventDefault();
                    event.stopPropagation();
                    const from = Number(event.dataTransfer.getData("application/x-creahq-index"));
                    if (Number.isInteger(from)) moveBlock(from, i);
                    const paletteType = event.dataTransfer.getData("application/x-creahq-block");
                    if (isShopBlockType(paletteType)) {
                      setBlocks((current) => {
                        if (current.length >= MAX_BLOCKS) return current;
                        const next = [...current];
                        next.splice(i, 0, { ...NEW_BLOCK[paletteType] });
                        return next;
                      });
                    }
                  }}
                  className="space-y-2 rounded-2xl border border-border bg-card p-3"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="inline-flex min-w-0 items-center gap-2 text-sm font-bold"><GripVertical className="h-4 w-4 shrink-0 text-muted-foreground" />{BLOCK_LABEL[b.type]}</span>
                    <button type="button" aria-label="Baustein löschen" onClick={() => setBlocks((current) => current.filter((_, j) => j !== i))} className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-muted"><Trash2 className="h-4 w-4" /></button>
                  </div>
                  {b.type === "heading" && <input value={b.title} onChange={(e) => setB(i, { ...b, title: e.target.value })} className={field} placeholder="Überschrift" />}
                  {b.type === "text" && (<><input value={b.title} onChange={(e) => setB(i, { ...b, title: e.target.value })} className={field} placeholder="Titel" /><textarea value={b.body} onChange={(e) => setB(i, { ...b, body: e.target.value })} className={field} rows={3} placeholder="Text" /></>)}
                  {b.type === "banner" && (<><input value={b.title} onChange={(e) => setB(i, { ...b, title: e.target.value })} className={field} placeholder="Banner-Titel" /><textarea value={b.body} onChange={(e) => setB(i, { ...b, body: e.target.value })} className={field} rows={3} placeholder="Banner-Text" /></>)}
                  {b.type === "quote" && (<><textarea value={b.text} onChange={(e) => setB(i, { ...b, text: e.target.value })} className={field} rows={2} placeholder="Zitat" /><input value={b.author} onChange={(e) => setB(i, { ...b, author: e.target.value })} className={field} placeholder="Name" /></>)}
                  {b.type === "faq" && (<><input value={b.q} onChange={(e) => setB(i, { ...b, q: e.target.value })} className={field} placeholder="Frage" /><textarea value={b.a} onChange={(e) => setB(i, { ...b, a: e.target.value })} className={field} rows={2} placeholder="Antwort" /></>)}
                  {b.type === "image" && <input value={b.url} onChange={(e) => setB(i, { ...b, url: e.target.value })} className={field} placeholder="https://… Bild-Link" />}
                  {b.type === "button" && (<><input value={b.label} onChange={(e) => setB(i, { ...b, label: e.target.value })} className={field} placeholder="Button-Text" /><input value={b.url} onChange={(e) => setB(i, { ...b, url: e.target.value })} className={field} placeholder="https://… Ziel-Link" /></>)}
                  {b.type === "spacer" && <label className="block text-xs text-muted-foreground">Abstand in Pixeln<input type="number" min={8} max={128} value={b.height} onChange={(e) => setB(i, { ...b, height: Number(e.target.value) })} className={`${field} mt-1`} /></label>}
                  {(b.type === "divider" || b.type === "spacer") && <p className="text-xs text-muted-foreground">Baustein kann per Drag-and-drop verschoben werden.</p>}
                </div>
              ))}
            </div>
            <ShopCustomContent code={{ mode: "blocks", html: "", css: "", blocks }} />
          </div>
        </div>
      )}
      </>)}

      {step === 4 && (
        <div className="space-y-3">
          <div className="flex gap-2">
            <button type="button" onClick={() => setDevice("phone")} className={`min-h-11 rounded-full px-4 text-sm font-bold ${device === "phone" ? "bg-brand text-primary-foreground" : "border border-border"}`}>Handy</button>
            <button type="button" onClick={() => setDevice("desktop")} className={`min-h-11 rounded-full px-4 text-sm font-bold ${device === "desktop" ? "bg-brand text-primary-foreground" : "border border-border"}`}>Desktop</button>
          </div>
          <div className={`mx-auto overflow-hidden rounded-3xl border-4 border-border bg-background p-4 ${device === "phone" ? "max-w-[380px]" : "w-full"}`} style={{ borderColor: theme.accent }}>
            {theme.marquee && <div className="mb-3 truncate rounded-full px-4 py-2 text-sm font-bold text-primary-foreground" style={{ background: theme.accent }}>{theme.marquee}</div>}
            {badges.length > 0 && <div className="mb-3 flex flex-wrap gap-2">{badges.slice(0, maxBadges).map((b, i) => <span key={i} className="rounded-full bg-brand-soft px-3 py-1 text-xs font-bold text-brand-ink">{b.text}</span>)}</div>}
            <ShopCustomContent code={{ mode, html, css, blocks: isPro ? blocks : [] }} />
          </div>
          <p className="text-xs text-muted-foreground">So sehen Käufer deinen Shop. Erst nach „Veröffentlichen" ist es live.</p>
        </div>
      )}

      <div className="flex flex-wrap gap-2">
        {step > 1 && <button type="button" onClick={() => setStep(step - 1)} className="min-h-12 rounded-full border border-border px-6 text-sm font-bold">← Zurück</button>}
        {step < 4 && <button type="button" onClick={() => setStep(step + 1)} className="min-h-12 rounded-full bg-brand px-6 text-sm font-bold text-primary-foreground">Weiter →</button>}
      </div>

      {step === 4 && <button type="button" onClick={save} disabled={saving} className="inline-flex min-h-12 items-center gap-2 rounded-full bg-brand px-6 text-sm font-bold text-primary-foreground disabled:opacity-60">
        <Check className="h-4 w-4" /> {saving ? "Speichere …" : "Shop-Design veröffentlichen"}
      </button>}
    </section>
  );
}

function isShopBlockType(value: string): value is ShopBlock["type"] {
  return Object.prototype.hasOwnProperty.call(NEW_BLOCK, value);
}
