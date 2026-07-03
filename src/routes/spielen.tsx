import { createFileRoute } from "@tanstack/react-router";
import { PageShell } from "@/components/PageShell";
import { Sparkles, Star as StarIcon } from "lucide-react";
import { FlagLangDoodle } from "@/components/FlagLangDoodle";
import { useEffect, useState } from "react";
import { toast } from "sonner";

const LS_ENABLED = "creahq:stars-enabled";
const LS_FOUND = "creahq:star-found";

export const Route = createFileRoute("/spielen")({
  head: () => ({
    meta: [
      { title: "Spielen — CreaHQ" },
      { name: "description", content: "Kleine Spielereien: Glückssterne sammeln und Sprache per Flagge zeichnen." },
      { property: "og:title", content: "Spielen — CreaHQ" },
      { property: "og:description", content: "Sterne-Zähler und Sprache per Flagge — nur zum Spaß." },
    ],
  }),
  component: SpielenPage,
});

function SpielenPage() {
  const [found, setFound] = useState(0);
  const [enabled, setEnabled] = useState(true);

  useEffect(() => {
    try {
      setFound(Number(localStorage.getItem(LS_FOUND) ?? 0));
      const raw = localStorage.getItem(LS_ENABLED);
      if (raw !== null) setEnabled(raw === "1");
    } catch { /* noop */ }
  }, []);

  function toggle() {
    setEnabled((v) => {
      const nv = !v;
      try { localStorage.setItem(LS_ENABLED, nv ? "1" : "0"); } catch { /* noop */ }
      toast(nv ? "✨ Sterne wieder an." : "Sterne aus — ruhig hier jetzt.");
      return nv;
    });
  }

  function resetCounter() {
    try { localStorage.setItem(LS_FOUND, "0"); } catch { /* noop */ }
    setFound(0);
    toast("Zähler auf 0 gesetzt.");
  }

  return (
    <PageShell
      eyebrow="Spielen"
      title="Kleine Spielereien."
      lead="Sterne sammeln und Sprache per Flagge zeichnen. Kein Zwang, kein Preis."
    >
      <div className="not-prose grid gap-6">
        {/* Sterne-Zähler + Toggle */}
        <div className="rounded-3xl border border-border bg-card p-6 sm:p-8">
          <div className="flex flex-wrap items-center gap-3">
            <Sparkles className="h-8 w-8 text-brand" />
            <div className="min-w-0">
              <h3 className="font-display text-xl font-black text-brand-ink">Glücksstern-Sammler</h3>
              <p className="text-sm text-muted-foreground">
                Auf der Startseite wandern Sterne rum. Klick sie an — Zähler steigt.
              </p>
            </div>
            <div className="ml-auto rounded-2xl bg-brand-soft px-4 py-2 text-2xl font-black text-brand-ink">
              {found}×
            </div>
          </div>
          <div className="mt-4 flex flex-wrap items-center gap-2">
            <button
              onClick={toggle}
              aria-pressed={enabled}
              className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-bold transition-colors ${
                enabled
                  ? "bg-amber-300 text-amber-900 hover:bg-amber-400"
                  : "bg-brand-soft text-brand-ink hover:bg-brand hover:text-primary-foreground"
              }`}
            >
              <StarIcon className={`h-4 w-4 ${enabled ? "fill-current" : ""}`} />
              {enabled ? "Sterne sind an — ausschalten" : "Sterne sind aus — einschalten"}
            </button>
            <button
              onClick={resetCounter}
              className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-4 py-2 text-sm font-semibold text-brand-ink hover:border-brand hover:text-brand"
            >
              Zähler zurücksetzen
            </button>
          </div>
        </div>

        <FlagLangDoodle />

        <div className="rounded-3xl border border-dashed border-brand/40 bg-card/60 p-6 text-sm text-muted-foreground">
          Farb-Themes (inkl. Flaggen) findest du jetzt oben im <strong className="text-brand-ink">Hero-Theme-Mixer</strong> auf der Startseite.
        </div>
      </div>
    </PageShell>
  );
}
