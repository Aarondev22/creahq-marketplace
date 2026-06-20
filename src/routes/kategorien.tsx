import { createFileRoute, Link } from "@tanstack/react-router";
import { PageShell } from "@/components/PageShell";

const cats = [
  { slug: "illustration", label: "Illustration", emoji: "🎨" },
  { slug: "musik", label: "Musik & Sound", emoji: "🎧" },
  { slug: "3d", label: "3D & Modelle", emoji: "🧊" },
  { slug: "templates", label: "Templates", emoji: "📐" },
  { slug: "presets", label: "Presets", emoji: "🎚️" },
  { slug: "schrift", label: "Schrift", emoji: "✒️" },
  { slug: "code", label: "Code-Snippets", emoji: "💾" },
  { slug: "fotovideo", label: "Foto & Video", emoji: "📷" },
  { slug: "coaching", label: "Coaching", emoji: "🧭" },
  { slug: "beratung", label: "Beratung", emoji: "💬" },
];

export const Route = createFileRoute("/kategorien")({
  head: () => ({ meta: [{ title: "Kategorien — CreaHQ" }] }),
  component: () => (
    <PageShell eyebrow="Stöbern" title="Alle Kategorien" lead="Klick rein. Wir filtern für dich.">
      <div className="not-prose grid grid-cols-2 gap-3 sm:grid-cols-3">
        {cats.map((c) => (
          <Link
            key={c.slug}
            to="/browse"
            search={{ q: c.label, cat: c.slug } as never}
            className="group flex items-center gap-3 rounded-2xl border border-border bg-card p-4 transition-all hover:-translate-y-0.5 hover:border-brand"
          >
            <span className="text-2xl">{c.emoji}</span>
            <span className="font-display text-sm font-bold text-brand-ink group-hover:text-brand">{c.label}</span>
          </Link>
        ))}
      </div>
    </PageShell>
  ),
});
