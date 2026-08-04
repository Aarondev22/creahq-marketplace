import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useSuspenseQuery, useQuery, queryOptions } from "@tanstack/react-query";
import { Search, SlidersHorizontal, X } from "lucide-react";
import { searchListings, fetchCategories, type SearchInput } from "@/lib/listings.functions";
import { ListingGridCard } from "@/components/ListingGridCard";

type Sort = "new" | "price_asc" | "price_desc";
type Kind = "" | "digital" | "service";

type BrowseSearch = { q: string; kind: Kind; cat: string; min: string; max: string; sort: Sort };

const listQuery = (s: SearchInput) =>
  queryOptions({
    queryKey: ["search", s],
    queryFn: () => searchListings({ data: s }),
  });

const catQuery = queryOptions({ queryKey: ["categories"], queryFn: () => fetchCategories() });

function toInput(s: BrowseSearch): SearchInput {
  return {
    q: s.q,
    kind: s.kind,
    category: s.cat,
    min: s.min ? Number(s.min) : 0,
    max: s.max ? Number(s.max) : 0,
    sort: s.sort,
  };
}

export const Route = createFileRoute("/browse")({
  validateSearch: (search: Record<string, unknown>): BrowseSearch => ({
    q: typeof search.q === "string" ? search.q : "",
    kind: search.kind === "digital" || search.kind === "service" ? search.kind : "",
    cat: typeof search.cat === "string" ? search.cat : "",
    min: typeof search.min === "string" ? search.min : "",
    max: typeof search.max === "string" ? search.max : "",
    sort: search.sort === "price_asc" || search.sort === "price_desc" ? search.sort : "new",
  }),
  loaderDeps: ({ search }) => ({ search }),
  loader: ({ context, deps }) => context.queryClient.ensureQueryData(listQuery(toInput(deps.search))),
  head: () => ({
    meta: [
      { title: "Stöbern & Filtern — CreaHQ" },
      { name: "description", content: "Durchsuche alle Produkte auf CreaHQ: digital oder physisch, nach Preis, Kategorie und Neuheit gefiltert." },
      { property: "og:title", content: "Stöbern & Filtern — CreaHQ" },
      { property: "og:description", content: "Finde digitale & physische Produkte, Services und Chatbots von echten Creatorn." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: BrowsePage,
  errorComponent: ({ error }) => <div className="p-10 text-center text-sm">{error.message}</div>,
  notFoundComponent: () => <div className="p-10 text-center text-sm">Nicht gefunden.</div>,
});

function BrowsePage() {
  const search = Route.useSearch();
  const navigate = useNavigate();
  const { data: items } = useSuspenseQuery(listQuery(toInput(search)));
  const { data: categories } = useQuery(catQuery);

  const set = (patch: Partial<BrowseSearch>) =>
    navigate({ to: "/browse", search: { ...search, ...patch }, resetScroll: false });

  const hasFilters = Boolean(search.kind || search.cat || search.min || search.max || search.sort !== "new");

  return (
    <section className="relative mx-auto max-w-7xl px-4 sm:px-6 py-12 sm:py-16">
      <div className="mb-2 inline-flex items-center gap-2 rounded-full bg-brand-soft px-3 py-1 text-xs font-bold uppercase tracking-widest text-brand">
        <Search className="h-3.5 w-3.5" /> Stöbern
      </div>
      <h1 className="font-display text-4xl font-black tracking-tight text-brand-ink sm:text-5xl">
        {search.q ? <>Ergebnisse für „<span className="text-brand">{search.q}</span>"</> : <>Alles auf einen Blick ✨</>}
      </h1>
      <p className="mt-2 max-w-xl text-muted-foreground">
        {items.length} {items.length === 1 ? "Treffer" : "Treffer"}.
      </p>

      {/* Filterleiste */}
      <div className="mt-6 rounded-[1.75rem] border border-border bg-card/70 p-4 shadow-sm backdrop-blur">
        <div className="mb-3 flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-muted-foreground">
          <SlidersHorizontal className="h-3.5 w-3.5" /> Filter
          {hasFilters && (
            <button
              onClick={() => set({ kind: "", cat: "", min: "", max: "", sort: "new" })}
              className="ml-auto inline-flex min-h-9 items-center gap-1 rounded-full bg-brand-soft px-3 text-[11px] font-bold text-brand-ink hover:bg-brand hover:text-primary-foreground"
            >
              <X className="h-3 w-3" /> Zurücksetzen
            </button>
          )}
        </div>

        <div className="flex flex-wrap gap-2">
          <Chip label="Alles" active={search.kind === ""} onClick={() => set({ kind: "" })} />
          <Chip label="💾 Digital" active={search.kind === "digital"} onClick={() => set({ kind: "digital" })} />
          <Chip label="📦 Physisch" active={search.kind === "service"} onClick={() => set({ kind: "service" })} />
        </div>

        <div className="mt-3 grid gap-2 sm:grid-cols-[1fr_auto_auto_auto]">
          <select
            value={search.cat}
            onChange={(e) => set({ cat: e.target.value })}
            className="min-h-12 rounded-2xl border border-border bg-surface px-4 text-sm font-medium text-brand-ink"
          >
            <option value="">Alle Kategorien</option>
            {(categories ?? []).map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
          <input
            type="number"
            min={0}
            inputMode="decimal"
            value={search.min}
            onChange={(e) => set({ min: e.target.value })}
            placeholder="Preis ab €"
            className="min-h-12 w-full rounded-2xl border border-border bg-surface px-4 text-sm sm:w-32"
          />
          <input
            type="number"
            min={0}
            inputMode="decimal"
            value={search.max}
            onChange={(e) => set({ max: e.target.value })}
            placeholder="bis €"
            className="min-h-12 w-full rounded-2xl border border-border bg-surface px-4 text-sm sm:w-28"
          />
          <select
            value={search.sort}
            onChange={(e) => set({ sort: e.target.value as Sort })}
            className="min-h-12 rounded-2xl border border-border bg-surface px-4 text-sm font-medium text-brand-ink"
          >
            <option value="new">Neueste zuerst</option>
            <option value="price_asc">Preis aufsteigend</option>
            <option value="price_desc">Preis absteigend</option>
          </select>
        </div>
      </div>

      {items.length === 0 ? (
        <div className="mt-12 grid place-items-center rounded-[2rem] border-2 border-dashed border-brand/30 bg-brand-soft/20 p-12 text-center">
          <div className="text-6xl">🪺</div>
          <p className="mt-4 font-display text-xl font-bold text-brand-ink">Hier ist gerade nichts zu holen.</p>
          <p className="mt-1 max-w-md text-sm text-muted-foreground">
            Probier weniger Filter oder ein anderes Wort. Oder lad selbst was hoch —{" "}
            <Link to="/verkaufen/guide" className="font-semibold text-brand hover:underline">Shop eröffnen →</Link>
          </p>
        </div>
      ) : (
        <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {items.map((l) => (
            <ListingGridCard key={l.id} listing={l} />
          ))}
        </div>
      )}
    </section>
  );
}

function Chip({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={`inline-flex min-h-11 items-center rounded-full px-5 text-sm font-bold transition-all ${
        active ? "bg-brand text-primary-foreground brand-glow" : "border border-border bg-surface text-brand-ink hover:border-brand hover:bg-brand-soft"
      }`}
    >
      {label}
    </button>
  );
}
