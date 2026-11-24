import { createFileRoute, Link } from "@tanstack/react-router";
import { PageShell } from "@/components/PageShell";
import { Camera, Code2, Compass, LayoutTemplate, MessageCircle, Music2, Palette, SlidersHorizontal, Type, Box } from "lucide-react";

const cats = [
  { slug: "illustration", label: "Illustration", icon: Palette },
  { slug: "musik", label: "Musik & Sound", icon: Music2 },
  { slug: "3d", label: "3D & Modelle", icon: Box },
  { slug: "templates", label: "Templates", icon: LayoutTemplate },
  { slug: "presets", label: "Presets", icon: SlidersHorizontal },
  { slug: "schrift", label: "Schrift", icon: Type },
  { slug: "code", label: "Code-Snippets", icon: Code2 },
  { slug: "fotovideo", label: "Foto & Video", icon: Camera },
  { slug: "coaching", label: "Coaching", icon: Compass },
  { slug: "beratung", label: "Beratung", icon: MessageCircle },
];

export const Route = createFileRoute("/kategorien")({
  head: () => ({ meta: [{ title: "Kategorien — CreaHQ" }] }),
  component: () => (
    <PageShell eyebrow="Stöbern" title="Alle Kategorien" lead="Klick rein. Wir filtern für dich.">
      <div className="not-prose grid grid-cols-2 gap-3 sm:grid-cols-3">
        {cats.map((c) => (
          <CategoryCard key={c.slug} category={c} />
        ))}
      </div>
    </PageShell>
  ),
});

function CategoryCard({ category: c }: { category: (typeof cats)[number] }) {
  const Icon = c.icon;
  return (
          <Link
            to="/browse"
            search={{ q: c.label, cat: c.slug } as never}
            className="group flex items-center gap-3 rounded-2xl border border-border bg-card p-4 transition-all hover:-translate-y-0.5 hover:border-brand"
          >
            <Icon className="h-5 w-5 text-brand" />
            <span className="font-display text-sm font-bold text-brand-ink group-hover:text-brand">{c.label}</span>
          </Link>
  );
}
