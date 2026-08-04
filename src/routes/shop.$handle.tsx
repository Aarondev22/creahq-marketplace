import { createFileRoute, notFound } from "@tanstack/react-router";
import { useSuspenseQuery, queryOptions } from "@tanstack/react-query";
import { Store, Sparkles } from "lucide-react";
import { fetchShopByHandle } from "@/lib/listings.functions";
import { ListingGridCard, ListingGridSkeleton } from "@/components/ListingGridCard";

const shopQuery = (handle: string) => queryOptions({
  queryKey: ["shop", handle],
  queryFn: () => fetchShopByHandle({ data: { handle } }),
});

export const Route = createFileRoute("/shop/$handle")({
  loader: async ({ params, context }) => {
    const data = await context.queryClient.ensureQueryData(shopQuery(params.handle));
    if (!data) throw notFound();
  },
  head: ({ params }) => ({
    meta: [
      { title: `@${params.handle} — Shop auf CreaHQ` },
      { name: "description", content: `Alle Produkte von @${params.handle} auf CreaHQ: digitale & physische Sachen direkt von Creator zu Käufer.` },
      { property: "og:title", content: `@${params.handle} — Shop auf CreaHQ` },
      { property: "og:description", content: `Stöber durch den Shop von @${params.handle} auf CreaHQ.` },
      { property: "og:type", content: "profile" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: ShopPage,
  pendingComponent: () => (
    <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6">
      <div className="mb-10 flex items-center gap-5">
        <div className="h-24 w-24 animate-pulse rounded-[1.75rem] bg-brand-soft" />
        <div className="space-y-2">
          <div className="h-8 w-52 animate-pulse rounded-full bg-muted" />
          <div className="h-4 w-32 animate-pulse rounded-full bg-brand-soft" />
        </div>
      </div>
      <ListingGridSkeleton count={8} />
    </div>
  ),
  errorComponent: ({ error }) => <div className="p-10 text-center text-sm">{error.message}</div>,
  notFoundComponent: () => (
    <div className="mx-auto max-w-md px-6 py-24 text-center">
      <div className="text-6xl">🔍</div>
      <h1 className="mt-4 font-display text-2xl font-black text-brand-ink">Diesen Shop gibt's (noch) nicht.</h1>
      <p className="mt-2 text-sm text-muted-foreground">Vielleicht ein Tippfehler im Handle?</p>
    </div>
  ),
});

function ShopPage() {
  const { handle } = Route.useParams();
  const { data } = useSuspenseQuery(shopQuery(handle));
  if (!data) return null;
  const { profile, listings } = data;
  const initial = (profile.display_name ?? profile.handle ?? "?").slice(0, 1).toUpperCase();

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 sm:py-14">
      <header className="overflow-hidden rounded-[2rem] border border-border bg-gradient-to-br from-brand-soft/70 via-card to-amber-50/40 p-6 shadow-sm sm:p-8">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-center">
          <div className="grid h-24 w-24 shrink-0 place-items-center overflow-hidden rounded-[1.75rem] bg-gradient-to-br from-brand to-brand-ink text-4xl font-black text-primary-foreground shadow-lg">
            {profile.avatar_url ? (
              <img src={profile.avatar_url} alt={profile.display_name ?? handle} className="h-full w-full object-cover" />
            ) : (
              initial
            )}
          </div>
          <div className="min-w-0">
            <div className="inline-flex items-center gap-1.5 rounded-full bg-card/80 px-3 py-1 text-[11px] font-bold uppercase tracking-widest text-brand">
              <Store className="h-3 w-3" /> Shop
            </div>
            <h1 className="mt-1.5 font-display text-3xl font-black text-brand-ink sm:text-4xl">
              {profile.display_name ?? `@${profile.handle}`}
            </h1>
            <p className="text-sm font-medium text-muted-foreground">@{profile.handle}</p>
            {profile.bio && <p className="mt-3 max-w-2xl text-sm leading-relaxed text-brand-ink/80">{profile.bio}</p>}
            <p className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-card px-3 py-1 text-xs font-bold text-brand-ink">
              <Sparkles className="h-3 w-3 text-brand" />
              {listings.length} {listings.length === 1 ? "Produkt" : "Produkte"} online
            </p>
          </div>
        </div>
      </header>

      <h2 className="mt-10 font-display text-2xl font-black text-brand-ink">Im Schaufenster</h2>
      {listings.length === 0 ? (
        <div className="mt-4 grid place-items-center rounded-[2rem] border-2 border-dashed border-brand/30 bg-brand-soft/20 p-12 text-center">
          <div className="text-5xl">🪟</div>
          <p className="mt-3 font-display text-lg font-bold text-brand-ink">Noch nichts im Schaufenster.</p>
          <p className="mt-1 text-sm text-muted-foreground">Dieser Shop hat aktuell keine veröffentlichten Produkte.</p>
        </div>
      ) : (
        <div className="mt-5 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {listings.map((l) => (
            <ListingGridCard key={l.id} listing={l} />
          ))}
        </div>
      )}
    </div>
  );
}
