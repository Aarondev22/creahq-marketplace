import { Link } from "@tanstack/react-router";
import type { ListingCard } from "@/lib/listings.functions";

export function ListingGridCard({ listing, showKind = true }: { listing: ListingCard; showKind?: boolean }) {
  const isDigital = listing.kind === "digital";
  return (
    <Link
      to="/listing/$id"
      params={{ id: listing.id }}
      className="group relative flex flex-col overflow-hidden rounded-[1.75rem] border border-border bg-card shadow-sm transition-all duration-300 hover:-translate-y-1.5 hover:border-brand/50 hover:shadow-xl hover:shadow-brand/10"
    >
      <div className="relative aspect-[4/3] overflow-hidden bg-gradient-to-br from-brand-soft via-brand-soft/60 to-amber-100/40">
        {listing.cover_url ? (
          <img
            src={listing.cover_url}
            alt={listing.title}
            loading="lazy"
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
        ) : (
          <div className="grid h-full w-full place-items-center text-4xl opacity-60">{isDigital ? "💾" : "📦"}</div>
        )}
        {showKind && (
          <span className="absolute left-3 top-3 rounded-full bg-card/90 px-2.5 py-1 text-[10px] font-bold uppercase tracking-widest text-brand-ink backdrop-blur">
            {isDigital ? "💾 Digital" : "📦 Physisch"}
          </span>
        )}
      </div>
      <div className="flex flex-1 flex-col p-4">
        {listing.category && (
          <span className="text-[10px] font-bold uppercase tracking-widest text-brand">{listing.category}</span>
        )}
        <h3 className="mt-0.5 line-clamp-2 font-display text-sm font-bold leading-snug text-brand-ink">
          {listing.title}
        </h3>
        <span className="mt-auto pt-3">
          <span className="inline-block rounded-full bg-brand/10 px-3 py-1 text-xs font-black text-brand transition-colors group-hover:bg-brand group-hover:text-primary-foreground">
            {(listing.price_cents / 100).toFixed(2)} €
          </span>
        </span>
      </div>
    </Link>
  );
}

export function ListingCardSkeleton() {
  return (
    <div className="overflow-hidden rounded-[1.75rem] border border-border bg-card">
      <div className="aspect-[4/3] animate-pulse bg-brand-soft/50" />
      <div className="space-y-2 p-4">
        <div className="h-2.5 w-16 animate-pulse rounded-full bg-brand-soft" />
        <div className="h-3.5 w-full animate-pulse rounded-full bg-muted" />
        <div className="h-3.5 w-2/3 animate-pulse rounded-full bg-muted" />
        <div className="h-6 w-20 animate-pulse rounded-full bg-brand-soft" />
      </div>
    </div>
  );
}

export function ListingGridSkeleton({ count = 4 }: { count?: number }) {
  return (
    <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
      {Array.from({ length: count }).map((_, i) => (
        <ListingCardSkeleton key={i} />
      ))}
    </div>
  );
}
