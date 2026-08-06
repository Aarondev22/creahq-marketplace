import { createFileRoute, notFound, Link } from "@tanstack/react-router";
import { useSuspenseQuery, queryOptions } from "@tanstack/react-query";
import { Store, Sparkles, Star, MessageCircle } from "lucide-react";
import { fetchShopByHandle } from "@/lib/listings.functions";
import { ListingGridCard, ListingGridSkeleton } from "@/components/ListingGridCard";
import { ReportButton } from "@/components/ReportButton";

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
      <div className="h-48 animate-pulse rounded-[2rem] bg-brand-soft" />
      <div className="mt-10">
        <ListingGridSkeleton count={8} />
      </div>
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

function Stars({ value }: { value: number }) {
  return (
    <span className="inline-flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((i) => (
        <Star
          key={i}
          className={`h-3.5 w-3.5 ${i <= Math.round(value) ? "fill-amber-400 text-amber-400" : "text-muted-foreground/40"}`}
        />
      ))}
    </span>
  );
}

function ShopPage() {
  const { handle } = Route.useParams();
  const { data } = useSuspenseQuery(shopQuery(handle));
  if (!data) return null;
  const { profile, listings, rating } = data;
  const initial = (profile.display_name ?? profile.handle ?? "?").slice(0, 1).toUpperCase();
  const highlight = listings.find((l) => l.id === profile.highlight_listing_id);
  const sections: string[] = Array.isArray(profile.shop_sections) && profile.shop_sections.length > 0
    ? (profile.shop_sections as string[])
    : ["highlight", "listings"];
  const rest = listings.filter((l) => l.id !== highlight?.id);

  const listingsBlock = (
    <section key="listings">
      <h2 className="mt-10 font-display text-2xl font-black text-brand-ink">Im Schaufenster 🪟</h2>
      {rest.length === 0 ? (
        <div className="mt-4 grid place-items-center rounded-[2rem] border-2 border-dashed border-brand/30 bg-brand-soft/20 p-12 text-center">
          <div className="text-5xl">🪟</div>
          <p className="mt-3 font-display text-lg font-bold text-brand-ink">Noch nichts im Schaufenster.</p>
          <p className="mt-1 text-sm text-muted-foreground">Dieser Shop hat aktuell keine veröffentlichten Produkte.</p>
          <Link
            to="/browse"
            search={{ q: "", kind: "" as const, cat: "", min: "", max: "", sort: "new" as const }}
            className="mt-5 inline-flex min-h-12 items-center rounded-full bg-brand px-6 text-sm font-bold text-primary-foreground"
          >
            Andere Shops entdecken
          </Link>
        </div>
      ) : (
        <div className="mt-5 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {rest.map((l) => (
            <ListingGridCard key={l.id} listing={l} />
          ))}
        </div>
      )}
    </section>
  );

  const highlightBlock = highlight ? (
    <section key="highlight" className="mt-10">
      <h2 className="font-display text-2xl font-black text-brand-ink">Highlight ⭐</h2>
      <Link
        to="/listing/$id"
        params={{ id: highlight.id }}
        className="mt-4 flex flex-col gap-5 overflow-hidden rounded-[2rem] border border-border bg-card p-5 transition hover:-translate-y-0.5 hover:shadow-lg sm:flex-row sm:items-center"
      >
        <div className="grid aspect-[4/3] w-full shrink-0 place-items-center overflow-hidden rounded-3xl bg-brand-soft sm:w-64">
          {highlight.cover_url ? (
            <img src={highlight.cover_url} alt={highlight.title} className="h-full w-full object-cover" />
          ) : (
            <span className="text-5xl">🎨</span>
          )}
        </div>
        <div className="min-w-0">
          <div className="text-[11px] font-bold uppercase tracking-widest text-brand">
            {highlight.category ?? (highlight.kind === "digital" ? "Digital" : "Physisch")}
          </div>
          <p className="mt-1 font-display text-2xl font-black text-brand-ink">{highlight.title}</p>
          <p className="mt-2 font-display text-xl font-black text-brand">
            {(highlight.price_cents / 100).toLocaleString("de-DE", { style: "currency", currency: "EUR" })}
          </p>
        </div>
      </Link>
    </section>
  ) : null;

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 sm:py-12">
      <header className="overflow-hidden rounded-[2rem] border border-border bg-card shadow-sm">
        <div className="relative h-40 w-full bg-gradient-to-br from-brand-soft via-brand/20 to-amber-100/60 sm:h-56">
          {profile.banner_url && (
            <img src={profile.banner_url} alt="" className="h-full w-full object-cover" />
          )}
        </div>
        <div className="flex flex-col gap-5 p-6 sm:flex-row sm:items-end sm:p-8">
          <div className="-mt-16 grid h-28 w-28 shrink-0 place-items-center overflow-hidden rounded-[1.75rem] border-4 border-card bg-gradient-to-br from-brand to-brand-ink text-4xl font-black text-primary-foreground shadow-lg sm:-mt-20 sm:h-32 sm:w-32">
            {profile.avatar_url ? (
              <img src={profile.avatar_url} alt={profile.display_name ?? handle} className="h-full w-full object-cover" />
            ) : (
              initial
            )}
          </div>
          <div className="min-w-0 flex-1">
            <div className="inline-flex items-center gap-1.5 rounded-full bg-brand-soft px-3 py-1 text-[11px] font-bold uppercase tracking-widest text-brand">
              <Store className="h-3 w-3" /> Shop
            </div>
            <h1 className="mt-1.5 font-display text-3xl font-black text-brand-ink sm:text-4xl">
              {profile.display_name ?? `@${profile.handle}`}
            </h1>
            <p className="text-sm font-medium text-muted-foreground">@{profile.handle}</p>
            {profile.bio && <p className="mt-3 max-w-2xl text-sm leading-relaxed text-brand-ink/80">{profile.bio}</p>}
            <div className="mt-4 flex flex-wrap items-center gap-2 text-xs font-bold">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-surface px-3 py-1.5 text-brand-ink">
                <Sparkles className="h-3 w-3 text-brand" />
                {listings.length} {listings.length === 1 ? "Produkt" : "Produkte"} online
              </span>
              {rating.count > 0 ? (
                <span className="inline-flex items-center gap-1.5 rounded-full bg-surface px-3 py-1.5 text-brand-ink">
                  <Stars value={rating.avg} /> {rating.avg.toFixed(1)} · {rating.count} Bewertung{rating.count === 1 ? "" : "en"}
                </span>
              ) : (
                <span className="rounded-full bg-surface px-3 py-1.5 text-muted-foreground">Noch keine Bewertungen</span>
              )}
              {listings[0] && (
                <Link
                  to="/listing/$id"
                  params={{ id: listings[0].id }}
                  className="inline-flex items-center gap-1.5 rounded-full bg-brand px-4 py-2 text-primary-foreground hover:opacity-90"
                >
                  <MessageCircle className="h-3.5 w-3.5" /> Shop anschreiben
                </Link>
              )}
              <ReportButton targetType="shop" targetId={profile.id} label="Shop melden" className="!min-h-9 !px-3 !text-xs" />
            </div>
          </div>
        </div>
      </header>

      {sections.map((s) => (s === "highlight" ? highlightBlock : s === "listings" ? listingsBlock : null))}
    </div>
  );
}
