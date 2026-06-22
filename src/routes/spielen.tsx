import { createFileRoute } from "@tanstack/react-router";
import { PageShell } from "@/components/PageShell";
import { Gamepad2, Palette, Flag, Sparkles } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/spielen")({
  head: () => ({
    meta: [
      { title: "Spielen & Codes — CreaHQ" },
      { name: "description", content: "KI-Mini-Games und Codes einlösen auf CreaHQ. Mal eine Flagge, kritzel ein Produkt, sammel Rabatte." },
      { property: "og:title", content: "Spielen & Codes — CreaHQ" },
      { property: "og:description", content: "Mini-Games und Codes für Creator und Käufer." },
    ],
  }),
  component: SpielenPage,
});

function SpielenPage() {
  return (
    <PageShell
      eyebrow="Spielen"
      title="KI-Mini-Games & Codes."
      lead="Kleine Spielereien zwischendurch. Bald mit echter KI — heute schon als Vorgeschmack."
    >
      <div className="grid gap-5 md:grid-cols-2">
        <GameCard
          icon={<Flag className="h-6 w-6" />}
          title="Flaggen-Malen"
          desc="Mal eine Landesflagge — die KI rät die Sprache und stellt die Seite um."
          cta="Bald spielen"
        />
        <GameCard
          icon={<Palette className="h-6 w-6" />}
          title="Doodle-Search"
          desc="Kritzel, wonach du suchst — die KI findet passende Listings."
          cta="Bald spielen"
        />
        <GameCard
          icon={<Sparkles className="h-6 w-6" />}
          title="Tages-Quiz"
          desc="3 Fragen rund um Creator-Sachen. Streak halten = Bonus-Code."
          cta="Bald spielen"
        />
        <GameCard
          icon={<Gamepad2 className="h-6 w-6" />}
          title="Sticker-Sammler"
          desc="Finde versteckte Sticker auf der Seite (z. B. den Glücksstern im Hero)."
          cta="Schon aktiv ✨"
          live
        />
      </div>

      <div className="mt-10 rounded-3xl border-2 border-dashed border-brand/40 bg-brand-soft/40 p-6 text-center sm:p-8">
        <h3 className="font-display text-xl font-black text-brand-ink sm:text-2xl">Code einlösen</h3>
        <p className="mt-2 text-sm text-muted-foreground">Rabatt-Codes & Founder-Codes gibst du auf <a href="/redeem" className="font-semibold text-brand hover:underline">/redeem</a> ein.</p>
      </div>
    </PageShell>
  );
}

function GameCard({ icon, title, desc, cta, live = false }: { icon: React.ReactNode; title: string; desc: string; cta: string; live?: boolean }) {
  return (
    <button
      onClick={() => toast(live ? "Such mal den Stern im Hero ✨" : "Kommt mit dem nächsten KI-Update")}
      className="group relative overflow-hidden rounded-3xl border border-border bg-card p-6 text-left transition-all hover:-translate-y-1 hover:border-brand hover:brand-glow"
    >
      <div className="flex items-center gap-3">
        <span className="grid h-11 w-11 place-items-center rounded-2xl bg-brand text-primary-foreground">{icon}</span>
        <h3 className="font-display text-lg font-black text-brand-ink">{title}</h3>
      </div>
      <p className="mt-3 text-sm text-muted-foreground">{desc}</p>
      <div className="mt-4 inline-flex items-center gap-1 rounded-full bg-brand-soft px-3 py-1 text-xs font-bold text-brand-ink">{cta}</div>
    </button>
  );
}
