import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { PageShell } from "@/components/PageShell";
import { FEES, feeRate, type ProductKind } from "@/lib/fees";
import { Store, ArrowRight } from "lucide-react";

export const Route = createFileRoute("/gebuehren")({
  head: () => ({
    meta: [
      { title: "Gebühren — CreaHQ" },
      { name: "description", content: "Keine monatliche Gebühr. Faire Provision pro Verkauf, die mit dir wächst." },
    ],
  }),
  component: FeesPage,
});

function FeesPage() {
  const [kind, setKind] = useState<ProductKind>("digital");
  const [sales, setSales] = useState(0);
  const rate = feeRate(kind, sales);
  const price = 2000; // 20 €
  const fee = Math.round((price * rate) / 100);

  return (
    <PageShell
      eyebrow="Gebühren"
      title="Fair pro Verkauf. Nix monatlich."
      lead="Du zahlst keine Grundgebühr. Stattdessen nehmen wir nur eine kleine Provision wenn du verkaufst — und die wird mit jedem Monat besser."
    >
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="rounded-3xl border border-brand/30 bg-brand-soft/50 p-6">
          <div className="text-xs font-bold uppercase tracking-widest text-brand">Digitale Produkte</div>
          <div className="mt-2 font-display text-5xl font-black text-brand-ink">{FEES.digitalStartPct}<span className="text-2xl">%</span></div>
          <div className="text-sm text-muted-foreground">ab dem ersten Verkauf</div>
        </div>
        <div className="rounded-3xl border border-amber-300/60 bg-amber-100/40 p-6">
          <div className="text-xs font-bold uppercase tracking-widest text-amber-700">Physische Produkte</div>
          <div className="mt-2 font-display text-5xl font-black text-brand-ink">{FEES.physicalStartPct}<span className="text-2xl">%</span></div>
          <div className="text-sm text-muted-foreground">ab dem ersten Verkauf</div>
        </div>
      </div>

      <h2>So sinkt deine Gebühr</h2>
      <p>
        Pro Shop & Monat: alle <strong>{FEES.tierSize} abgeschlossenen Verkäufe</strong> verlierst du <strong>{FEES.reductionPerTier} %</strong>. Mindestgebühr: digital {FEES.digitalFloorPct} %, physisch {FEES.physicalFloorPct} %. Am 1. jedes Monats startet die Zählung neu.
      </p>

      <div className="not-prose rounded-3xl border border-border bg-card p-5">
        <div className="mb-3 text-xs font-bold uppercase tracking-widest text-brand">Rechne nach</div>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setKind("digital")}
            className={`rounded-full px-4 py-2 text-sm font-bold ${kind === "digital" ? "bg-brand text-primary-foreground" : "border border-border bg-card text-brand-ink"}`}
          >
            Digital
          </button>
          <button
            onClick={() => setKind("physical")}
            className={`rounded-full px-4 py-2 text-sm font-bold ${kind === "physical" ? "bg-brand text-primary-foreground" : "border border-border bg-card text-brand-ink"}`}
          >
            Physisch
          </button>
        </div>
        <label className="mt-5 block text-sm font-semibold text-brand-ink">
          Verkäufe diesen Monat: <span className="text-brand">{sales}</span>
        </label>
        <input
          type="range"
          min={0}
          max={300}
          step={1}
          value={sales}
          onChange={(e) => setSales(Number(e.target.value))}
          className="mt-2 w-full accent-[oklch(var(--brand))]"
        />
        <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3">
          <Stat label="Aktueller Satz" value={`${rate} %`} />
          <Stat label="Bei 20 € Produkt" value={`${(fee / 100).toFixed(2)} € Gebühr`} />
          <Stat label="Du behältst" value={`${((price - fee) / 100).toFixed(2)} €`} />
        </div>
      </div>

      <h2>Beispiel: digitaler Shop, voll im Flow</h2>
      <ul>
        <li>0–24 Verkäufe: 17 %</li>
        <li>25–49 Verkäufe: 16 %</li>
        <li>50–74 Verkäufe: 15 %</li>
        <li>… alle 25 Verkäufe weiter -1 %, Minimum digital {FEES.digitalFloorPct} %, physisch {FEES.physicalFloorPct} %.</li>
        <li>Am 1. des nächsten Monats: zurück auf 17 %.</li>
      </ul>

      <h2>Was sonst noch?</h2>
      <ul>
        <li>Zahlungsabwicklung läuft über Stripe (übliche Stripe-Gebühren kommen oben drauf).</li>
        <li>Auszahlungen automatisch auf dein hinterlegtes Konto.</li>
        <li>Keine Setup-Kosten, kein Listing-Preis, kein Abo.</li>
      </ul>

      <div className="not-prose mt-10 flex flex-wrap items-center gap-3">
        <Link to="/auth" className="group inline-flex items-center gap-2 rounded-full bg-brand-ink px-6 py-3 text-sm font-bold text-primary-foreground transition-transform hover:scale-105">
          <Store className="h-4 w-4" /> Shop kostenlos eröffnen
          <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
        </Link>
        <Link to="/hilfe" className="text-sm font-semibold text-brand hover:underline">Noch Fragen? →</Link>
      </div>
    </PageShell>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-border bg-surface-warm p-3">
      <div className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">{label}</div>
      <div className="font-display text-lg font-black text-brand-ink">{value}</div>
    </div>
  );
}
