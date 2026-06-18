import { createFileRoute } from "@tanstack/react-router";
import { Search } from "lucide-react";

export const Route = createFileRoute("/browse")({
  validateSearch: (search: Record<string, unknown>) => ({
    q: (search.q as string) ?? "",
    section: (search.section as string) ?? "",
    cat: (search.cat as string) ?? "",
  }),
  head: () => ({
    meta: [
      { title: "Stöbern — CreaHQ" },
      { name: "description", content: "Such und stöber durch alle Sachen auf CreaHQ." },
    ],
  }),
  component: BrowsePage,
});

function BrowsePage() {
  const { q, section } = Route.useSearch();
  return (
    <section className="mx-auto max-w-7xl px-6 py-16">
      <div className="mb-2 inline-flex items-center gap-2 rounded-full bg-brand-soft px-3 py-1 text-xs font-bold uppercase tracking-widest text-brand">
        <Search className="h-3.5 w-3.5" /> Stöbern
      </div>
      <h1 className="font-display text-4xl font-black tracking-tight text-brand-ink sm:text-5xl">
        {q ? <>Ergebnisse für „<span className="text-brand">{q}</span>"</> : section ? <>Schiene: <span className="text-brand">{section}</span></> : <>Alles auf einen Blick</>}
      </h1>
      <p className="mt-2 max-w-xl text-muted-foreground">
        Noch keine Listings online. Sobald die ersten Creator hochladen, taucht hier alles auf — filterbar nach Kategorie, Preis und Vibe.
      </p>

      <div className="mt-12 grid place-items-center rounded-[2rem] border-2 border-dashed border-brand/30 bg-card/40 p-12 text-center">
        <div className="text-6xl">🪺</div>
        <p className="mt-4 font-display text-xl font-bold text-brand-ink">Werkstatt frisch eingeräumt.</p>
        <p className="mt-1 max-w-md text-sm text-muted-foreground">
          Wir sammeln gerade die ersten Sachen. Komm bald wieder — oder mach selbst den Anfang und eröffne deinen Shop.
        </p>
      </div>
    </section>
  );
}
