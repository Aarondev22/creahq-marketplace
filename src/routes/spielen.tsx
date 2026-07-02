import { createFileRoute } from "@tanstack/react-router";
import { PageShell } from "@/components/PageShell";
import { Sparkles } from "lucide-react";
import { CountryTheme } from "@/components/CountryTheme";
import { FlagLangDoodle } from "@/components/FlagLangDoodle";

export const Route = createFileRoute("/spielen")({
  head: () => ({
    meta: [
      { title: "Spielen — CreaHQ" },
      { name: "description", content: "Kleine Spielereien: Glückssterne sammeln, Länder-Farben, Sprache per Flagge zeichnen." },
      { property: "og:title", content: "Spielen — CreaHQ" },
      { property: "og:description", content: "Länder-Farben, Sterne-Zähler und Sprache per Flagge — nur zum Spaß." },
    ],
  }),
  component: SpielenPage,
});

function SpielenPage() {
  const found = Number(typeof window !== "undefined" ? localStorage.getItem("creahq:star-found") ?? 0 : 0);

  return (
    <PageShell
      eyebrow="Spielen"
      title="Kleine Spielereien."
      lead="Sterne sammeln, Länder-Farben ausprobieren, Sprache per Flagge zeichnen. Kein Zwang, kein Preis."
    >
      <div className="not-prose grid gap-6">
        {/* Sterne-Zähler */}
        <div className="rounded-3xl border border-border bg-card p-6 sm:p-8">
          <div className="flex items-center gap-3">
            <Sparkles className="h-8 w-8 text-brand" />
            <div>
              <h3 className="font-display text-xl font-black text-brand-ink">Glücksstern-Sammler</h3>
              <p className="text-sm text-muted-foreground">
                Auf der Startseite wandern Sterne rum. Klick sie an — Zähler steigt.
              </p>
            </div>
            <div className="ml-auto rounded-2xl bg-brand-soft px-4 py-2 text-2xl font-black text-brand-ink">
              {found}×
            </div>
          </div>
        </div>

        <CountryTheme />
        <FlagLangDoodle />
      </div>
    </PageShell>
  );
}
