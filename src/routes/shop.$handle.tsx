import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useSuspenseQuery, queryOptions } from "@tanstack/react-query";
import { fetchShopByHandle } from "@/lib/listings.functions";

const shopQuery = (handle: string) => queryOptions({
  queryKey: ["shop", handle],
  queryFn: () => fetchShopByHandle({ data: { handle } }),
});

export const Route = createFileRoute("/shop/$handle")({
  loader: async ({ params, context }) => {
    const data = await context.queryClient.ensureQueryData(shopQuery(params.handle));
    if (!data) throw notFound();
  },
  head: () => ({ meta: [{ title: "Shop — CreaHQ" }] }),
  component: ShopPage,
  errorComponent: ({ error }) => <div className="p-10 text-center text-sm">{error.message}</div>,
  notFoundComponent: () => <div className="p-10 text-center text-sm">Shop gibt's (noch) nicht.</div>,
});

function ShopPage() {
  const { handle } = Route.useParams();
  const { data } = useSuspenseQuery(shopQuery(handle));
  if (!data) return null;
  const { profile, listings } = data;
  return (
    <div className="mx-auto max-w-7xl px-6 py-12">
      <header className="mb-10 flex items-center gap-5">
        <div className="grid h-20 w-20 place-items-center rounded-3xl bg-gradient-to-br from-brand to-brand-ink text-3xl font-black text-primary-foreground">
          {(profile.display_name ?? "?").slice(0, 1).toUpperCase()}
        </div>
        <div>
          <h1 className="font-display text-4xl font-black text-brand-ink">{profile.display_name}</h1>
          <p className="text-sm text-muted-foreground">@{profile.handle}</p>
          {profile.bio && <p className="mt-2 max-w-xl text-sm">{profile.bio}</p>}
        </div>
      </header>
      {listings.length === 0 ? (
        <p className="text-sm text-muted-foreground">Noch nichts im Schaufenster.</p>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {listings.map((l) => (
            <Link key={l.id} to="/listing/$id" params={{ id: l.id }} className="group overflow-hidden rounded-3xl border border-border bg-card transition-transform hover:-translate-y-1">
              <div className="aspect-[4/3] bg-gradient-to-br from-brand-soft to-amber-100/40">
                {l.cover_url && <img src={l.cover_url} alt={l.title} className="h-full w-full object-cover" />}
              </div>
              <div className="p-3">
                <h3 className="line-clamp-2 font-display text-sm font-bold text-brand-ink">{l.title}</h3>
                <span className="mt-1 inline-block text-xs font-bold text-brand">{(l.price_cents/100).toFixed(2)} €</span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
