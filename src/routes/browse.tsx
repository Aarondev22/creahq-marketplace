import { createFileRoute, Link } from "@tanstack/react-router";
import { useSuspenseQuery, queryOptions } from "@tanstack/react-query";
import { Search } from "lucide-react";
import { searchListings } from "@/lib/listings.functions";

const searchQuery = (q: string) => queryOptions({
  queryKey: ["search", q],
  queryFn: () => searchListings({ data: { q } }),
});

export const Route = createFileRoute("/browse")({
  validateSearch: (search: Record<string, unknown>) => ({
    q: (search.q as string) ?? "",
    cat: (search.cat as string) ?? "",
  }),
  loaderDeps: ({ search }) => ({ q: search.q }),
  loader: ({ context, deps }) => context.queryClient.ensureQueryData(searchQuery(deps.q)),
  head: () => ({
    meta: [
      { title: "Stöbern — CreaHQ" },
      { name: "description", content: "Such und stöber durch alle Sachen auf CreaHQ." },
    ],
  }),
  component: BrowsePage,
  errorComponent: ({ error }) => <div className="p-10 text-center text-sm">{error.message}</div>,
  notFoundComponent: () => <div className="p-10 text-center text-sm">Nicht gefunden.</div>,
});

function BrowsePage() {
  const { q } = Route.useSearch();
  const { data: items } = useSuspenseQuery(searchQuery(q));

  return (
    <section className="mx-auto max-w-7xl px-6 py-16">
      <div className="mb-2 inline-flex items-center gap-2 rounded-full bg-brand-soft px-3 py-1 text-xs font-bold uppercase tracking-widest text-brand">
        <Search className="h-3.5 w-3.5" /> Stöbern
      </div>
      <h1 className="font-display text-4xl font-black tracking-tight text-brand-ink sm:text-5xl">
        {q ? <>Ergebnisse für „<span className="text-brand">{q}</span>"</> : <>Alles auf einen Blick</>}
      </h1>
      <p className="mt-2 max-w-xl text-muted-foreground">
        {items.length} {items.length === 1 ? "Treffer" : "Treffer"}.
      </p>

      {items.length === 0 ? (
        <div className="mt-12 grid place-items-center rounded-[2rem] border-2 border-dashed border-brand/30 bg-card/40 p-12 text-center">
          <div className="text-6xl">🪺</div>
          <p className="mt-4 font-display text-xl font-bold text-brand-ink">Noch nichts gefunden.</p>
          <p className="mt-1 max-w-md text-sm text-muted-foreground">
            Vielleicht magst du selbst was hochladen? <Link to="/auth" className="font-semibold text-brand hover:underline">Shop eröffnen →</Link>
          </p>
        </div>
      ) : (
        <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {items.map((l) => (
            <Link key={l.id} to="/listing/$id" params={{ id: l.id }} className="group overflow-hidden rounded-3xl border border-border bg-card transition-transform hover:-translate-y-1">
              <div className="aspect-[4/3] bg-gradient-to-br from-brand-soft to-amber-100/40">
                {l.cover_url && <img src={l.cover_url} alt={l.title} className="h-full w-full object-cover" loading="lazy" />}
              </div>
              <div className="p-4">
                {l.category && <span className="text-[10px] font-bold uppercase tracking-widest text-brand">{l.category}</span>}
                <h3 className="line-clamp-2 font-display text-sm font-bold text-brand-ink">{l.title}</h3>
                <span className="mt-2 inline-block rounded-full bg-brand/10 px-2 py-0.5 text-xs font-bold text-brand">{(l.price_cents/100).toFixed(2)} €</span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </section>
  );
}
