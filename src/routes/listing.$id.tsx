import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useSuspenseQuery, queryOptions } from "@tanstack/react-query";
import { motion } from "motion/react";
import { fetchListingById } from "@/lib/listings.functions";

const listingQuery = (id: string) => queryOptions({
  queryKey: ["listing", id],
  queryFn: () => fetchListingById({ data: { id } }),
});

export const Route = createFileRoute("/listing/$id")({
  loader: async ({ params, context }) => {
    const data = await context.queryClient.ensureQueryData(listingQuery(params.id));
    if (!data) throw notFound();
  },
  head: ({ loaderData }) => ({
    meta: [{ title: "Listing — CreaHQ" }, { name: "description", content: "Listing-Details auf CreaHQ." }],
  }),
  component: ListingPage,
  errorComponent: ({ error }) => <div className="p-10 text-center text-sm text-muted-foreground">{error.message}</div>,
  notFoundComponent: () => <div className="p-10 text-center text-sm text-muted-foreground">Listing nicht gefunden.</div>,
});

function ListingPage() {
  const { id } = Route.useParams();
  const { data: l } = useSuspenseQuery(listingQuery(id));
  if (!l) return null;
  return (
    <div className="mx-auto grid max-w-6xl gap-8 px-6 py-12 lg:grid-cols-2">
      <motion.div initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} className="overflow-hidden rounded-[2rem] border border-border bg-gradient-to-br from-brand-soft to-amber-100/40 aspect-square">
        {l.cover_url ? <img src={l.cover_url} alt={l.title} className="h-full w-full object-cover" /> : <div className="grid h-full place-items-center text-6xl">🎨</div>}
      </motion.div>
      <div>
        {l.category && <span className="inline-block rounded-full bg-brand-soft px-3 py-1 text-xs font-bold uppercase tracking-widest text-brand">{l.category}</span>}
        <h1 className="mt-2 font-display text-4xl font-black text-brand-ink">{l.title}</h1>
        {l.seller && (
          <Link to="/shop/$handle" params={{ handle: l.seller.handle ?? "" }} className="mt-2 inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-brand">
            <span className="grid h-7 w-7 place-items-center rounded-full bg-brand/15 text-xs font-bold text-brand">{(l.seller.display_name ?? "?").slice(0,1).toUpperCase()}</span>
            von {l.seller.display_name}
          </Link>
        )}
        <p className="mt-6 whitespace-pre-line text-sm leading-relaxed text-foreground/80">{l.description}</p>
        <div className="mt-8 flex items-end gap-4">
          <div className="font-display text-4xl font-black text-brand">{(l.price_cents/100).toFixed(2)} €</div>
        </div>
        <button className="mt-6 w-full rounded-full bg-brand px-6 py-4 text-base font-bold text-primary-foreground brand-glow transition-transform hover:scale-[1.02]">
          In den Warenkorb (kommt bald)
        </button>
        <p className="mt-2 text-center text-xs text-muted-foreground">Stripe Checkout wird im nächsten Schritt aktiviert.</p>
      </div>
    </div>
  );
}
