import { createFileRoute } from "@tanstack/react-router";
import { Check, Crown, Sparkles } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/pro")({
  head: () => ({
    meta: [
      { title: "CreaHQ Pro — Dein Shop, deine Regeln" },
      { name: "description", content: "Entdecke CreaHQ Pro: mehr Gestaltungsmöglichkeiten für deinen Creator-Shop für 4,99 € im Monat." },
      { property: "og:title", content: "CreaHQ Pro — Dein Shop, deine Regeln" },
      { property: "og:description", content: "Mehr Gestaltungsmöglichkeiten für deinen Creator-Shop." },
      { property: "og:type", content: "website" },
    ],
  }),
  component: ProPage,
});

const features = [
  { name: "HTML/CSS-Code-Editor", standard: true, pro: true },
  { name: "Visueller Baustein-Baukasten", standard: false, pro: true },
  { name: "Fertige 1-Klick-Designs", standard: "—", pro: "5 Designs" },
  { name: "Animationen", standard: "Bis zu 3", pro: "10" },
  { name: "Shop-Badges", standard: "Bis zu 3", pro: "Bis zu 5" },
  { name: "Standard-Listing", standard: true, pro: true },
  { name: "Pro Spotlight & goldenes Pro-Badge", standard: false, pro: true },
] as const;

function FeatureValue({ value }: { value: boolean | string }) {
  if (value === true) return <Check aria-label="Enthalten" className="mx-auto h-5 w-5 text-brand" />;
  if (value === false) return <span className="text-muted-foreground" aria-label="Nicht enthalten">—</span>;
  return <span>{value}</span>;
}

function ProPage() {
  return (
    <main className="mx-auto max-w-6xl px-4 py-10 sm:px-6 sm:py-16">
      <section className="relative overflow-hidden rounded-[2rem] border border-amber-400/40 bg-gradient-to-br from-amber-100/70 via-card to-brand-soft/60 p-6 sm:p-12">
        <div aria-hidden="true" className="absolute -right-12 -top-12 h-48 w-48 rounded-full bg-amber-300/30 blur-3xl" />
        <div className="relative max-w-3xl">
          <span className="inline-flex items-center gap-2 rounded-full bg-gold px-3 py-1 text-xs font-bold text-gold-foreground"><Crown className="h-4 w-4" /> CreaHQ Pro</span>
          <h1 className="mt-5 font-display text-4xl font-black text-brand-ink sm:text-6xl">Dein Shop,<br /><span className="text-brand">deine Regeln.</span></h1>
          <p className="mt-4 max-w-2xl text-base leading-7 text-muted-foreground">Gestalte deinen Creator-Shop individueller und hebe deine Angebote mit mehr Designoptionen hervor.</p>
          <p className="mt-6 font-display text-3xl font-black text-brand-ink">4,99 € <span className="text-base font-semibold text-muted-foreground">/ Monat · monatlich kündbar</span></p>
          <button type="button" onClick={() => toast.info("Zahlungsanbindung startet in Kürze — wende dich an den Support für eine Test-Freischaltung")} className="mt-6 inline-flex min-h-12 items-center gap-2 rounded-full bg-brand px-6 text-sm font-bold text-primary-foreground transition hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2">
            <Sparkles className="h-4 w-4" /> Pro aktivieren
          </button>
          <p className="mt-2 text-xs text-muted-foreground">Die Zahlungsanbindung ist noch nicht verfügbar.</p>
        </div>
      </section>

      <section className="mt-10" aria-labelledby="vergleich-heading">
        <h2 id="vergleich-heading" className="font-display text-2xl font-black text-brand-ink sm:text-3xl">Vergleiche die Shops</h2>
        <div className="mt-5 overflow-x-auto rounded-3xl border border-border bg-card">
          <table className="w-full min-w-[460px] border-collapse text-left text-sm">
            <thead><tr className="border-b border-border bg-surface"><th scope="col" className="p-4 font-bold text-brand-ink">Funktion</th><th scope="col" className="p-4 text-center font-bold text-brand-ink">Standard</th><th scope="col" className="p-4 text-center font-bold text-amber-700">Pro</th></tr></thead>
            <tbody>{features.map((feature) => <tr key={feature.name} className="border-b border-border last:border-0"><th scope="row" className="p-4 font-medium text-brand-ink">{feature.name}</th><td className="p-4 text-center text-muted-foreground"><FeatureValue value={feature.standard} /></td><td className="p-4 text-center font-semibold text-brand-ink"><FeatureValue value={feature.pro} /></td></tr>)}</tbody>
          </table>
        </div>
        <p className="mt-3 text-xs leading-5 text-muted-foreground">Die Pro-Funktionen richten sich nach dem jeweils verfügbaren Shop-Studio. Eine Test-Freischaltung kann der Support vornehmen; der Kauf über die Website ist derzeit noch nicht möglich.</p>
      </section>
    </main>
  );
}
