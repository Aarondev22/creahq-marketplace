import { Link } from "@tanstack/react-router";
import { motion } from "motion/react";
import type { ListingCard as TListing } from "@/lib/listings.functions";

export function ListingCard({ l }: { l: TListing }) {
  return (
    <motion.div whileHover={{ y: -4 }} className="shrink-0">
      <Link to="/listing/$id" params={{ id: l.id }} className="block w-56 overflow-hidden rounded-3xl border border-border bg-card">
        <div className="aspect-[4/3] bg-gradient-to-br from-brand-soft to-amber-100/40">
          {l.cover_url ? <img src={l.cover_url} alt={l.title} className="h-full w-full object-cover" loading="lazy" /> : <div className="grid h-full place-items-center text-4xl">🎨</div>}
        </div>
        <div className="p-3">
          {l.category && <span className="text-[10px] font-bold uppercase tracking-widest text-brand">{l.category}</span>}
          <h3 className="mt-0.5 line-clamp-2 font-display text-sm font-bold text-brand-ink">{l.title}</h3>
          <div className="mt-2 flex items-center justify-between">
            <span className="rounded-full bg-brand/10 px-2 py-0.5 text-xs font-bold text-brand">{(l.price_cents/100).toFixed(2)} €</span>
            <span className="text-[10px] text-muted-foreground">{l.kind === "digital" ? "Digital" : "Service"}</span>
          </div>
        </div>
      </Link>
    </motion.div>
  );
}
