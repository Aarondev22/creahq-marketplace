import { createFileRoute, Link } from "@tanstack/react-router";
import { PageShell } from "@/components/PageShell";
import { ArrowLeft } from "lucide-react";

// Same list of "curated" homepage sections + a few real categories.
// Keeping labels in sync with DiscoverRail slugs on the homepage.
const KATEGORIEN: Record<string, { title: string; subtitle: string; emoji: string }> = {
  "top-10":         { title: "Top 10 gerade beliebt", subtitle: "Was die Community diese Woche feiert.", emoji: "🔥" },
  "perfekt-daheim": { title: "Perfekt für daheim",    subtitle: "Prints, Sounds & Templates, die das Zuhause besser machen.", emoji: "🏡" },
  "frisch":         { title: "Frisch reingekommen",   subtitle: "Die neuesten Drops aus den Werkstätten.", emoji: "✨" },
  "perlen":         { title: "Versteckte Perlen",     subtitle: "Untern Radar, aber liebenswert.", emoji: "💎" },
  "kuratiert":      { title: "Von der Community kuratiert", subtitle: "Handverlesen von Leuten wie dir.", emoji: "🎀" },
  "illustration":   { title: "Illustration",          subtitle: "Zeichnung, Print, digitale Kunst.", emoji: "🎨" },
  "musik":          { title: "Musik & Sound",         subtitle: "Loops, Samples, Jingles.", emoji: "🎧" },
  "3d":             { title: "3D & Modelle",          subtitle: "Meshes, Rigs, Assets.", emoji: "🧊" },
  "templates":      { title: "Templates",             subtitle: "Notion, Figma, Docs & Co.", emoji: "📐" },
  "presets":        { title: "Presets",               subtitle: "LUTs, Lightroom, Ableton.", emoji: "🎚️" },
  "schrift":        { title: "Schrift",               subtitle: "Fonts & Lettering.", emoji: "✒️" },
  "code":           { title: "Code-Snippets",         subtitle: "Kleine Bausteine, große Wirkung.", emoji: "💾" },
  "fotovideo":      { title: "Foto & Video",          subtitle: "Presets, Overlays, Footage.", emoji: "📷" },
  "coaching":       { title: "Coaching",              subtitle: "1:1 Sessions von Creatorn für Creator.", emoji: "🧭" },
  "beratung":       { title: "Beratung",              subtitle: "Reviews, Feedback, Strategie.", emoji: "💬" },
};

export const Route = createFileRoute("/kategorie/$slug")({
  head: ({ params }) => {
    const c = KATEGORIEN[params.slug];
    const title = c ? `${c.title} — CreaHQ` : "Kategorie — CreaHQ";
    return {
      meta: [
        { title },
        { name: "description", content: c?.subtitle ?? "Kategorie auf CreaHQ." },
        { property: "og:title", content: title },
        { property: "og:description", content: c?.subtitle ?? "Kategorie auf CreaHQ." },
      ],
    };
  },
  component: CategoryPage,
});

function CategoryPage() {
  const { slug } = Route.useParams();
  const c = KATEGORIEN[slug] ?? { title: slug, subtitle: "Diese Ecke füllt sich noch.", emoji: "📦" };

  return (
    <PageShell eyebrow="Kategorie" title={`${c.emoji}  ${c.title}`} lead={c.subtitle}>
      <div className="not-prose">
        <div className="mb-6 flex flex-wrap items-center gap-2 text-sm">
          <Link to="/" className="inline-flex items-center gap-1 rounded-full bg-brand-soft px-3 py-1.5 font-bold text-brand-ink hover:bg-brand hover:text-primary-foreground">
            <ArrowLeft className="h-3.5 w-3.5" /> Zurück
          </Link>
          <Link to="/kategorien" className="rounded-full border border-border bg-card px-3 py-1.5 font-semibold text-brand-ink hover:border-brand hover:text-brand">
            Alle Kategorien
          </Link>
        </div>

        {/* Placeholder grid — same structure as browse, but every card is empty. */}
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div
              key={i}
              className="relative flex h-64 flex-col justify-between overflow-hidden rounded-3xl border-2 border-dashed border-brand/30 bg-card/60 p-5"
            >
              <div className="absolute inset-0 -z-10 bg-gradient-to-br from-brand-soft/40 via-transparent to-amber-100/30" />
              <div className="flex items-center justify-between text-[10px] font-bold uppercase tracking-widest text-brand/70">
                <span>Bald hier</span>
                <span>#{String(i + 1).padStart(2, "0")}</span>
              </div>
              {i === 0 ? (
                <div className="my-auto text-center">
                  <div className="mx-auto mb-3 text-4xl">📦</div>
                  <p className="text-xs font-medium leading-relaxed text-brand-ink">
                    Noch nichts da. Sobald Creator hier reinstellen, tauchen sie in dieser Ecke auf.
                  </p>
                </div>
              ) : (
                <div className="my-auto space-y-2">
                  <div className="h-3 w-3/4 rounded-full bg-brand/15" />
                  <div className="h-3 w-1/2 rounded-full bg-brand/10" />
                  <div className="mt-4 h-20 rounded-2xl bg-gradient-to-br from-brand/10 to-amber-200/30" />
                </div>
              )}
              <div className="flex items-center justify-between text-[11px] text-muted-foreground">
                <span>Creator gesucht</span>
                <span className="rounded-full bg-brand/10 px-2 py-0.5 font-bold text-brand">—,— €</span>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-10 rounded-3xl border border-border bg-card p-6 text-center">
          <h3 className="font-display text-lg font-black text-brand-ink">Willst du hier reinstellen?</h3>
          <p className="mt-1 text-sm text-muted-foreground">Eröffne deinen Shop und sei der/die Erste in dieser Ecke.</p>
          <Link to="/verkaufen/guide" className="mt-4 inline-flex items-center gap-1.5 rounded-full bg-brand px-5 py-2.5 text-sm font-bold text-primary-foreground brand-glow hover:brightness-110">
            Verkaufs-Guide öffnen →
          </Link>
        </div>
      </div>
    </PageShell>
  );
}
