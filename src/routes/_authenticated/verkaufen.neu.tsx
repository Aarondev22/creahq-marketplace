import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { motion } from "motion/react";
import { ArrowLeft, ChevronLeft, ChevronRight, Check, ImagePlus, X, Download, Truck, Star, MoveLeft, MoveRight } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/verkaufen/neu")({
  head: () => ({
    meta: [
      { title: "Neues Listing anlegen — CreaHQ" },
      { name: "description", content: "Lege in wenigen Schritten ein neues Produkt oder eine Dienstleistung auf CreaHQ an." },
      { property: "og:title", content: "Neues Listing anlegen — CreaHQ" },
      { property: "og:description", content: "Lege in wenigen Schritten ein neues Produkt auf CreaHQ an." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: NewListingPage,
});

type Kind = "digital" | "service";
type WizardData = {
  title: string;
  description: string;
  category: string;
  price: string;
  kind: Kind;
  shippingMode: "included" | "extra" | "digital";
  shippingPrice: string;
  location: string;
  condition: string;
  stock: string;
  files: File[];
};

const SIGNED_URL_TTL = 60 * 60 * 24 * 365;
const TOTAL_STEPS = 4;
const STEP_LABELS = ["Art", "Basics", "Preis & Versand", "Bilder & Check"];

function NewListingPage() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [data, setData] = useState<WizardData>({
    title: "", description: "", category: "", price: "9.00", kind: "digital",
    shippingMode: "digital", shippingPrice: "0",
    location: "", condition: "neu", stock: "", files: [],
  });

  // Immer oben starten – keine Scroll-Sprünge
  useEffect(() => { window.scrollTo(0, 0); }, []);
  useEffect(() => { window.scrollTo({ top: 0, behavior: "smooth" }); }, [step]);

  const previews = useMemo(() => data.files.map((f) => URL.createObjectURL(f)), [data.files]);
  useEffect(() => () => previews.forEach((u) => URL.revokeObjectURL(u)), [previews]);

  function update<K extends keyof WizardData>(key: K, value: WizardData[K]) {
    setData((d) => ({ ...d, [key]: value }));
    setErrors((e) => ({ ...e, [key]: "" }));
  }

  function validate(target: number) {
    const e: Record<string, string> = {};
    if (target > 2 && !data.title.trim()) e.title = "Titel ist ein Pflichtfeld.";
    if (target > 3) {
      const p = parseFloat(data.price.replace(",", "."));
      if (!(p > 0)) e.price = "Bitte einen Preis größer als 0 € angeben.";
    }
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  function next() {
    if (!validate(step + 1)) return;
    setStep((s) => Math.min(TOTAL_STEPS, s + 1));
  }

  function moveImage(i: number, dir: -1 | 1) {
    const j = i + dir;
    if (j < 0 || j >= data.files.length) return;
    const arr = [...data.files];
    [arr[i], arr[j]] = [arr[j], arr[i]];
    update("files", arr);
  }

  async function submit() {
    if (!validate(TOTAL_STEPS + 1)) { setStep(1); return; }
    setSaving(true);
    try {
      const { data: u } = await supabase.auth.getUser();
      if (!u.user) throw new Error("Nicht eingeloggt");

      await supabase.from("user_roles").insert({ user_id: u.user.id, role: "seller" }).then(() => {});

      const urls: string[] = [];
      for (const file of data.files.slice(0, 8)) {
        const path = `${u.user.id}/${crypto.randomUUID()}-${file.name.replace(/[^\w.-]/g, "_")}`;
        const { error: upErr } = await supabase.storage.from("listing-covers").upload(path, file, { upsert: false });
        if (upErr) throw upErr;
        const { data: signed } = await supabase.storage.from("listing-covers").createSignedUrl(path, SIGNED_URL_TTL);
        if (signed?.signedUrl) urls.push(signed.signedUrl);
      }

      const price_cents = Math.round(parseFloat(data.price.replace(",", ".")) * 100);
      const shipping_price_cents = Math.round(parseFloat(data.shippingPrice.replace(",", ".") || "0") * 100);
      const stock = data.stock.trim() ? Math.max(0, parseInt(data.stock, 10)) : null;

      const { error } = await supabase.from("listings").insert({
        seller_id: u.user.id,
        title: data.title, description: data.description, category: data.category,
        kind: data.kind, price_cents,
        shipping_mode: data.kind === "digital" ? "digital" : data.shippingMode,
        shipping_price_cents: data.kind === "digital" ? 0 : shipping_price_cents,
        cover_url: urls[0] ?? null, images: urls,
        location: data.location.trim() || null,
        condition: data.condition || null,
        stock,
        status: "published",
      });
      if (error) throw error;
      toast.success("Veröffentlicht!");
      navigate({ to: "/dashboard", search: { tab: "listings" } });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Fehler");
    } finally { setSaving(false); }
  }

  return (
    <div className="mx-auto max-w-5xl px-4 pb-24 pt-8 sm:px-6">
      <Link
        to="/dashboard"
        search={{ tab: "listings" }}
        className="inline-flex items-center gap-2 rounded-full bg-brand-soft px-4 py-2.5 text-sm font-bold text-brand-ink hover:bg-brand hover:text-primary-foreground"
      >
        <ArrowLeft className="h-4 w-4" /> Zum Dashboard
      </Link>

      <h1 className="mt-5 font-display text-4xl font-black text-brand-ink sm:text-5xl">Neues Listing</h1>
      <p className="mt-1 text-sm text-muted-foreground">In vier Schritten online — du kannst später alles ändern.</p>

      <div className="mt-6 flex items-center gap-2">
        {STEP_LABELS.map((label, i) => (
          <div key={label} className="flex-1">
            <div className={`h-2 rounded-full transition-colors ${i + 1 <= step ? "bg-brand" : "bg-border"}`} />
            <div className={`mt-1.5 hidden text-[11px] font-bold uppercase tracking-widest sm:block ${i + 1 <= step ? "text-brand" : "text-muted-foreground"}`}>{label}</div>
          </div>
        ))}
      </div>
      <div className="mt-2 text-xs font-bold uppercase tracking-widest text-brand sm:hidden">
        Schritt {step} von {TOTAL_STEPS} · {STEP_LABELS[step - 1]}
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_320px]">
        <motion.div key={step} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="rounded-3xl border border-border bg-card p-6 sm:p-8">
          {step === 1 && (
            <div>
              <h2 className="font-display text-2xl font-black text-brand-ink">Was verkaufst du?</h2>
              <p className="mt-1 text-sm text-muted-foreground">Wähle die Art deines Angebots.</p>
              <div className="mt-5 grid gap-4 sm:grid-cols-2">
                <KindCard
                  active={data.kind === "digital"}
                  onClick={() => { update("kind", "digital"); update("shippingMode", "digital"); }}
                  icon={<Download className="h-6 w-6" />}
                  title="Digital"
                  desc="Downloads, Templates, Presets, Chatbots oder Services. Kein Versand — sofort verfügbar."
                />
                <KindCard
                  active={data.kind === "service"}
                  onClick={() => { update("kind", "service"); update("shippingMode", "included"); }}
                  icon={<Truck className="h-6 w-6" />}
                  title="Physisch"
                  desc="Etwas zum Anfassen: Prints, Handgemachtes, Verpackungen. Wird verschickt."
                />
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-5">
              <h2 className="font-display text-2xl font-black text-brand-ink">Basics</h2>
              <Field label="Titel" required error={errors.title}>
                <input
                  autoFocus
                  value={data.title}
                  onChange={(e) => update("title", e.target.value)}
                  placeholder="z.B. Aquarell-Poster Set (5 Motive)"
                  className={inputCls(!!errors.title)}
                />
              </Field>
              <Field label="Beschreibung" hint="Was ist drin, für wen, welches Format?">
                <textarea
                  value={data.description}
                  onChange={(e) => update("description", e.target.value)}
                  rows={5}
                  placeholder="Beschreib dein Produkt …"
                  className="w-full rounded-2xl border border-border bg-background px-4 py-3 text-sm focus:border-brand focus:outline-none"
                />
              </Field>
              <Field label="Kategorie" hint="z.B. Prints, Templates, Verpackung">
                <input value={data.category} onChange={(e) => update("category", e.target.value)} placeholder="Kategorie" className={inputCls(false)} />
              </Field>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-5">
              <h2 className="font-display text-2xl font-black text-brand-ink">Preis &amp; Versand</h2>
              <Field label="Preis in €" required error={errors.price}>
                <input
                  type="number" step="0.01" min="0"
                  value={data.price}
                  onChange={(e) => update("price", e.target.value)}
                  className={inputCls(!!errors.price)}
                />
              </Field>

              {data.kind === "digital" ? (
                <p className="rounded-2xl bg-brand-soft/60 p-4 text-sm text-brand-ink">
                  Digitale Produkte brauchen keinen Versand — Käufer bekommen sie direkt nach dem Kauf.
                </p>
              ) : (
                <>
                  <Field label="Versand">
                    <div className="grid gap-3 sm:grid-cols-2">
                      <ChoiceChip active={data.shippingMode === "included"} onClick={() => update("shippingMode", "included")} label="Versand inklusive" />
                      <ChoiceChip active={data.shippingMode === "extra"} onClick={() => update("shippingMode", "extra")} label="Versand extra" />
                    </div>
                  </Field>
                  {data.shippingMode === "extra" && (
                    <Field label="Versandkosten in €">
                      <input type="number" step="0.01" min="0" value={data.shippingPrice} onChange={(e) => update("shippingPrice", e.target.value)} className={inputCls(false)} />
                    </Field>
                  )}
                  <div className="grid gap-4 sm:grid-cols-3">
                    <Field label="Ort / Stadt">
                      <input value={data.location} onChange={(e) => update("location", e.target.value)} placeholder="optional" className={inputCls(false)} />
                    </Field>
                    <Field label="Zustand">
                      <select value={data.condition} onChange={(e) => update("condition", e.target.value)} className={inputCls(false)}>
                        <option value="neu">Neu</option>
                        <option value="handgemacht">Handgemacht</option>
                        <option value="gebraucht">Gebraucht</option>
                      </select>
                    </Field>
                    <Field label="Lagerbestand">
                      <input type="number" min="0" value={data.stock} onChange={(e) => update("stock", e.target.value)} placeholder="optional" className={inputCls(false)} />
                    </Field>
                  </div>
                </>
              )}
            </div>
          )}

          {step === 4 && (
            <div className="space-y-6">
              <div>
                <h2 className="font-display text-2xl font-black text-brand-ink">Fotos</h2>
                <p className="mt-1 text-sm text-muted-foreground">Erstes Bild ist das Titelbild. Maximal 8 Bilder.</p>
                <label className="mt-4 flex cursor-pointer items-center justify-center gap-3 rounded-3xl border-2 border-dashed border-brand/40 bg-brand-soft/40 px-6 py-8 text-base font-bold text-brand-ink transition-colors hover:border-brand hover:bg-brand-soft">
                  <ImagePlus className="h-6 w-6 text-brand" />
                  Fotos hinzufügen
                  <input
                    type="file" accept="image/*" multiple
                    onChange={(e) => update("files", [...data.files, ...Array.from(e.target.files ?? [])].slice(0, 8))}
                    className="sr-only"
                  />
                </label>

                {data.files.length > 0 && (
                  <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
                    {data.files.map((f, i) => (
                      <div key={`${f.name}-${i}`} className="relative overflow-hidden rounded-2xl border border-border bg-surface">
                        <img src={previews[i]} alt={f.name} className="aspect-square w-full object-cover" />
                        {i === 0 && (
                          <span className="absolute left-0 top-0 rounded-br-xl bg-brand px-2 py-1 text-[10px] font-bold text-primary-foreground">Titelbild</span>
                        )}
                        <button
                          type="button" aria-label="Bild entfernen"
                          onClick={() => update("files", data.files.filter((_, j) => j !== i))}
                          className="absolute right-0 top-0 grid h-9 w-9 place-items-center rounded-bl-xl bg-red-500 text-white"
                        >
                          <X className="h-4 w-4" />
                        </button>
                        <div className="flex items-center justify-between gap-1 p-1">
                          <button type="button" aria-label="nach vorne" onClick={() => moveImage(i, -1)} disabled={i === 0} className="grid h-9 flex-1 place-items-center rounded-xl bg-card disabled:opacity-30">
                            <MoveLeft className="h-4 w-4" />
                          </button>
                          <button type="button" aria-label="nach hinten" onClick={() => moveImage(i, 1)} disabled={i === data.files.length - 1} className="grid h-9 flex-1 place-items-center rounded-xl bg-card disabled:opacity-30">
                            <MoveRight className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="rounded-3xl bg-surface p-5 text-sm">
                <div className="font-display text-lg font-black text-brand-ink">Check</div>
                <ul className="mt-2 space-y-1 text-muted-foreground">
                  <li><strong className="text-brand-ink">{data.title || "— kein Titel —"}</strong></li>
                  <li>{data.kind === "digital" ? "Digital" : "Physisch"} · {data.price} € · {data.files.length} Bild{data.files.length === 1 ? "" : "er"}</li>
                  {data.kind === "service" && (
                    <li>Versand: {data.shippingMode === "extra" ? `extra (${data.shippingPrice} €)` : "inklusive"}{data.location ? ` · ${data.location}` : ""}</li>
                  )}
                  {data.category && <li>Kategorie: {data.category}</li>}
                </ul>
              </div>
            </div>
          )}

          <div className="mt-8 flex items-center justify-between gap-3">
            {step === 1 ? (
              <Link to="/dashboard" search={{ tab: "listings" }} className="inline-flex items-center gap-1 rounded-full border border-border px-5 py-3 text-sm font-bold text-brand-ink">
                Abbrechen
              </Link>
            ) : (
              <button type="button" onClick={() => setStep((s) => s - 1)} className="inline-flex items-center gap-1 rounded-full border border-border px-5 py-3 text-sm font-bold text-brand-ink">
                <ChevronLeft className="h-4 w-4" /> Zurück
              </button>
            )}
            {step < TOTAL_STEPS ? (
              <button type="button" onClick={next} className="inline-flex items-center gap-1 rounded-full bg-brand px-6 py-3 text-sm font-bold text-primary-foreground brand-glow">
                Weiter <ChevronRight className="h-4 w-4" />
              </button>
            ) : (
              <button type="button" disabled={saving} onClick={submit} className="inline-flex items-center gap-1 rounded-full bg-brand px-6 py-3 text-sm font-bold text-primary-foreground brand-glow disabled:opacity-60">
                <Check className="h-4 w-4" /> {saving ? "Speichere …" : "Veröffentlichen"}
              </button>
            )}
          </div>
        </motion.div>

        {/* Live-Vorschau */}
        <aside className="lg:sticky lg:top-24 lg:self-start">
          <div className="text-xs font-bold uppercase tracking-widest text-muted-foreground">So könnte es aussehen</div>
          <div className="mt-2 overflow-hidden rounded-3xl border border-border bg-card">
            <div className="aspect-[4/3] bg-gradient-to-br from-brand-soft to-amber-100/40">
              {previews[0] ? <img src={previews[0]} alt="Vorschau" className="h-full w-full object-cover" /> : <div className="grid h-full place-items-center text-4xl">🎨</div>}
            </div>
            <div className="p-4">
              <div className="text-[10px] font-bold uppercase tracking-widest text-brand/70">{data.category || (data.kind === "digital" ? "Digital" : "Physisch")}</div>
              <div className="mt-0.5 line-clamp-2 font-display text-base font-bold text-brand-ink">{data.title || "Dein Titel"}</div>
              <div className="mt-1 flex items-center justify-between">
                <span className="font-display text-lg font-black text-brand">{(parseFloat(data.price.replace(",", ".")) || 0).toFixed(2)} €</span>
                <span className="inline-flex items-center gap-1 text-[11px] text-muted-foreground"><Star className="h-3 w-3" /> neu</span>
              </div>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}

function inputCls(hasError: boolean) {
  return `w-full rounded-full border bg-background px-4 py-3 text-sm focus:outline-none ${hasError ? "border-red-400 focus:border-red-500" : "border-border focus:border-brand"}`;
}

function Field({ label, required, hint, error, children }: { label: string; required?: boolean; hint?: string; error?: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="mb-1.5 block text-xs font-bold uppercase tracking-widest text-muted-foreground">
        {label}{required && <span className="ml-1 text-brand">*</span>}
      </label>
      {children}
      {error ? <p className="mt-1.5 text-xs font-semibold text-red-600">{error}</p> : hint ? <p className="mt-1.5 text-xs text-muted-foreground">{hint}</p> : null}
    </div>
  );
}

function KindCard({ active, onClick, icon, title, desc }: { active: boolean; onClick: () => void; icon: React.ReactNode; title: string; desc: string }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-3xl border-2 p-6 text-left transition-all ${active ? "border-brand bg-brand-soft/60 shadow-lg" : "border-border bg-surface hover:border-brand/50"}`}
    >
      <span className="inline-grid h-12 w-12 place-items-center rounded-2xl bg-brand/15 text-brand">{icon}</span>
      <div className="mt-3 font-display text-xl font-black text-brand-ink">{title}</div>
      <p className="mt-1 text-sm text-muted-foreground">{desc}</p>
      {active && <div className="mt-3 inline-flex items-center gap-1 text-xs font-bold text-brand"><Check className="h-3.5 w-3.5" /> ausgewählt</div>}
    </button>
  );
}

function ChoiceChip({ active, onClick, label }: { active: boolean; onClick: () => void; label: string }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-2xl border-2 px-4 py-3 text-sm font-bold transition-colors ${active ? "border-brand bg-brand text-primary-foreground" : "border-border bg-surface text-brand-ink hover:border-brand/50"}`}
    >
      {label}
    </button>
  );
}
