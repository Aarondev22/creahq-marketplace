import { createServerFn } from "@tanstack/react-start";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";

function serverPublic() {
  return createClient<Database>(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_PUBLISHABLE_KEY!,
    { auth: { storage: undefined, persistSession: false, autoRefreshToken: false } },
  );
}

export type ListingCard = {
  id: string;
  title: string;
  price_cents: number;
  currency: string;
  cover_url: string | null;
  category: string | null;
  kind: "digital" | "service";
  seller_id: string;
  created_at: string;
};

const SAFE_COLS = "id,title,price_cents,currency,cover_url,category,kind,seller_id,created_at";

export const fetchTopWeek = createServerFn({ method: "GET" }).handler(async (): Promise<ListingCard[]> => {
  const supa = serverPublic();
  const since = new Date(Date.now() - 7 * 24 * 3600 * 1000).toISOString();
  // Aggregate sales last 7 days
  const { data: agg } = await supa
    .from("order_items")
    .select("listing_id, qty")
    .gte("created_at", since);
  if (agg && agg.length > 0) {
    const counts = new Map<string, number>();
    for (const r of agg) counts.set(r.listing_id, (counts.get(r.listing_id) ?? 0) + (r.qty ?? 1));
    const topIds = [...counts.entries()].sort((a, b) => b[1] - a[1]).slice(0, 20).map(([id]) => id);
    if (topIds.length > 0) {
      const { data } = await supa.from("listings").select(SAFE_COLS).in("id", topIds).eq("status", "published");
      return (data ?? []) as ListingCard[];
    }
  }
  // Fallback: newest published
  const { data } = await supa
    .from("listings")
    .select(SAFE_COLS)
    .eq("status", "published")
    .order("created_at", { ascending: false })
    .limit(20);
  return (data ?? []) as ListingCard[];
});

export const fetchFresh = createServerFn({ method: "GET" }).handler(async (): Promise<ListingCard[]> => {
  const supa = serverPublic();
  const { data } = await supa
    .from("listings")
    .select(SAFE_COLS)
    .eq("status", "published")
    .order("created_at", { ascending: false })
    .limit(12);
  return (data ?? []) as ListingCard[];
});

export const searchListings = createServerFn({ method: "GET" })
  .inputValidator((d: { q: string; limit?: number }) => ({
    q: String(d.q ?? "").trim().slice(0, 120),
    limit: Math.min(Math.max(Number(d.limit ?? 24), 1), 50),
  }))
  .handler(async ({ data }): Promise<ListingCard[]> => {
    const supa = serverPublic();
    let query = supa.from("listings").select(SAFE_COLS).eq("status", "published");
    if (data.q) {
      const like = `%${data.q.replace(/[%_]/g, "")}%`;
      query = query.or(`title.ilike.${like},description.ilike.${like},category.ilike.${like}`);
    }
    const { data: rows } = await query.order("created_at", { ascending: false }).limit(data.limit);
    return (rows ?? []) as ListingCard[];
  });

export type ListingDetail = ListingCard & {
  description: string | null;
  tags: string[];
  seller: { handle: string | null; display_name: string | null; avatar_url: string | null } | null;
};

export const fetchListingById = createServerFn({ method: "GET" })
  .inputValidator((d: { id: string }) => ({ id: String(d.id) }))
  .handler(async ({ data }): Promise<ListingDetail | null> => {
    const supa = serverPublic();
    const { data: row } = await supa
      .from("listings")
      .select(`${SAFE_COLS},description,tags`)
      .eq("id", data.id)
      .eq("status", "published")
      .maybeSingle();
    if (!row) return null;
    const { data: seller } = await supa
      .from("profiles")
      .select("handle,display_name,avatar_url")
      .eq("id", row.seller_id)
      .maybeSingle();
    return { ...(row as ListingCard & { description: string | null; tags: string[] }), seller: seller ?? null };
  });

export const fetchShopByHandle = createServerFn({ method: "GET" })
  .inputValidator((d: { handle: string }) => ({ handle: String(d.handle) }))
  .handler(async ({ data }) => {
    const supa = serverPublic();
    const { data: profile } = await supa
      .from("profiles")
      .select("id,handle,display_name,bio,avatar_url,theme_color")
      .eq("handle", data.handle)
      .maybeSingle();
    if (!profile) return null;
    const { data: listings } = await supa
      .from("listings")
      .select(SAFE_COLS)
      .eq("seller_id", profile.id)
      .eq("status", "published")
      .order("created_at", { ascending: false });
    return { profile, listings: (listings ?? []) as ListingCard[] };
  });
