import { createServerFn } from "@tanstack/react-start";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";
import { applyProSpotlight } from "@/lib/shopTheme";

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
  spotlight?: boolean;
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
      const { data } = await supa.from("listings").select(SAFE_COLS).in("id", topIds).eq("status", "published").eq("moderation_status", "approved");
      return (data ?? []) as ListingCard[];
    }
  }
  // Fallback: newest published
  const { data } = await supa
    .from("listings")
    .select(SAFE_COLS)
    .eq("status", "published").eq("moderation_status", "approved")
    .order("created_at", { ascending: false })
    .limit(20);
  return (data ?? []) as ListingCard[];
});

export const fetchFresh = createServerFn({ method: "GET" }).handler(async (): Promise<ListingCard[]> => {
  const supa = serverPublic();
  const { data } = await supa
    .from("listings")
    .select(SAFE_COLS)
    .eq("status", "published").eq("moderation_status", "approved")
    .order("created_at", { ascending: false })
    .limit(12);
  return (data ?? []) as ListingCard[];
});

export type SearchInput = {
  q?: string;
  kind?: "digital" | "service" | "";
  category?: string;
  min?: number;
  max?: number;
  sort?: "new" | "price_asc" | "price_desc";
  limit?: number;
};

export const searchListings = createServerFn({ method: "GET" })
  .inputValidator((d: SearchInput) => ({
    q: String(d?.q ?? "").trim().slice(0, 120),
    kind: (d?.kind === "digital" || d?.kind === "service" ? d.kind : "") as "digital" | "service" | "",
    category: String(d?.category ?? "").slice(0, 80),
    min: Number.isFinite(Number(d?.min)) ? Math.max(0, Number(d?.min)) : 0,
    max: Number.isFinite(Number(d?.max)) && Number(d?.max) > 0 ? Number(d?.max) : 0,
    sort: (d?.sort === "price_asc" || d?.sort === "price_desc" ? d.sort : "new") as "new" | "price_asc" | "price_desc",
    limit: Math.min(Math.max(Number(d?.limit ?? 48), 1), 100),
  }))
  .handler(async ({ data }): Promise<ListingCard[]> => {
    const supa = serverPublic();
    let query = supa.from("listings").select(SAFE_COLS + ",description,tags").eq("status", "published").eq("moderation_status", "approved");
    if (data.kind) query = query.eq("kind", data.kind);
    if (data.category) query = query.eq("category", data.category);
    if (data.min > 0) query = query.gte("price_cents", Math.round(data.min * 100));
    if (data.max > 0) query = query.lte("price_cents", Math.round(data.max * 100));

    if (data.sort === "price_asc") query = query.order("price_cents", { ascending: true });
    else if (data.sort === "price_desc") query = query.order("price_cents", { ascending: false });
    else query = query.order("created_at", { ascending: false });

    const { data: rows } = await query.limit(data.q ? 500 : data.limit);
    let list = (rows ?? []) as unknown as (ListingCard & { description: string | null; tags: string[] | null })[];
    if (data.q) {
      // Schreibweisen-tolerant: "tshirt" findet "T-Shirt", "t shirt", Kategorie, Tags …
      const words = data.q.split(/\s+/).map(norm).filter(Boolean);
      const scored = list
        .map((l) => {
          const title = norm(l.title), cat = norm(l.category ?? ""), tags = (l.tags ?? []).map(norm), desc = norm(l.description ?? "");
          let score = 0;
          for (const w of words) {
            let s = 0;
            if (cat.includes(w) || (cat && w.includes(cat))) s += 5;
            if (tags.some((t) => t.includes(w) || (t && w.includes(t)))) s += 4;
            if (title.includes(w)) s += 3;
            if (desc.includes(w)) s += 1;
            if (s === 0) return { l, score: 0 };
            score += s;
          }
          return { l, score };
        })
        .filter((x) => x.score > 0);
      if (data.sort === "new") scored.sort((a, b) => b.score - a.score);
      list = scored.map((x) => x.l);
    }
    let out = list.map(({ description: _d, tags: _t, ...c }) => c as ListingCard);
    // Pro-Spotlight: relevanteste Pro-Treffer oben, faire Rotation (nur bei Relevanz-Sortierung).
    if (data.sort === "new" && out.length > 0) {
      const sellerIds = [...new Set(out.map((l) => l.seller_id))];
      const { data: pros } = await supa.from("profiles").select("id").in("id", sellerIds).eq("is_pro", true);
      out = applyProSpotlight(out, new Set((pros ?? []).map((p) => p.id)));
    }
    return out.slice(0, data.limit);
  });

function norm(s: string) {
  return s.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/ß/g, "ss").replace(/[^a-z0-9]/g, "");
}

function tokens(s: string) {
  return s.toLowerCase().split(/[^a-z0-9äöüß]+/).map(norm).filter((t) => t.length >= 3);
}

export const fetchCategories = createServerFn({ method: "GET" }).handler(async (): Promise<string[]> => {
  const supa = serverPublic();
  const { data } = await supa.from("listings").select("category").eq("status", "published").eq("moderation_status", "approved").limit(500);
  const set = new Set<string>();
  for (const r of data ?? []) if (r.category) set.add(r.category);
  return [...set].sort((a, b) => a.localeCompare(b, "de"));
});


export type ListingDetail = ListingCard & {
  description: string | null;
  tags: string[];
  images: string[];
  shipping_mode: string;
  shipping_price_cents: number;
  location: string | null;
  condition: string | null;
  stock: number | null;
  seller: {
    id: string;
    handle: string | null;
    display_name: string | null;
    avatar_url: string | null;
    is_pro: boolean;
    shop_badges: unknown;
    shop_theme: unknown;
  } | null;
};

const DETAIL_COLS = `${SAFE_COLS},description,tags,images,shipping_mode,shipping_price_cents,location,condition,stock`;

export const fetchListingById = createServerFn({ method: "GET" })
  .inputValidator((d: { id: string }) => ({ id: String(d.id) }))
  .handler(async ({ data }): Promise<ListingDetail | null> => {
    const supa = serverPublic();
    const { data: row } = await supa
      .from("listings")
      .select(DETAIL_COLS)
      .eq("id", data.id)
      .eq("status", "published").eq("moderation_status", "approved")
      .maybeSingle();
    if (!row) return null;
    const { data: seller } = await supa
      .from("profiles")
      .select("id,handle,display_name,avatar_url,is_pro,shop_badges,shop_theme")
      .eq("id", row.seller_id)
      .maybeSingle();
    return { ...(row as unknown as Omit<ListingDetail, "seller">), seller: seller ?? null };
  });

export const fetchRelatedListings = createServerFn({ method: "GET" })
  .inputValidator((d: { id: string; sellerId: string; category?: string | null }) => ({
    id: String(d.id),
    sellerId: String(d.sellerId),
    category: d.category ? String(d.category) : null,
  }))
  .handler(async ({ data }): Promise<{ fromShop: ListingCard[]; similar: ListingCard[] }> => {
    const supa = serverPublic();
    const { data: fromShop } = await supa
      .from("listings")
      .select(SAFE_COLS)
      .eq("seller_id", data.sellerId)
      .eq("status", "published").eq("moderation_status", "approved")
      .neq("id", data.id)
      .order("created_at", { ascending: false })
      .limit(4);

    const { data: me } = await supa.from("listings").select("title,category,tags").eq("id", data.id).maybeSingle();
    const { data: pool } = await supa
      .from("listings")
      .select(SAFE_COLS + ",tags")
      .eq("status", "published").eq("moderation_status", "approved")
      .neq("id", data.id)
      .order("created_at", { ascending: false })
      .limit(300);
    const myCat = norm(me?.category ?? data.category ?? "");
    const myTags = new Set(((me?.tags ?? []) as string[]).map(norm));
    const myTokens = new Set(tokens(me?.title ?? ""));
    const scored = ((pool ?? []) as unknown as (ListingCard & { tags: string[] | null })[])
      .map((l) => {
        let s = 0;
        if (myCat && norm(l.category ?? "") === myCat) s += 5;
        for (const t of l.tags ?? []) if (myTags.has(norm(t))) s += 3;
        for (const t of tokens(l.title)) if (myTokens.has(t)) s += 4;
        if (l.seller_id === data.sellerId) s -= 1;
        return { l, s };
      })
      .filter((x) => x.s > 0)
      .sort((a, b) => b.s - a.s)
      .slice(0, 8)
      .map(({ l: { tags: _t, ...c } }) => c as ListingCard);

    return { fromShop: (fromShop ?? []) as ListingCard[], similar: scored };
  });


export const fetchShopByHandle = createServerFn({ method: "GET" })
  .inputValidator((d: { handle: string }) => ({ handle: String(d.handle) }))
  .handler(async ({ data }) => {
    const supa = serverPublic();
    const { data: profile } = await supa
      .from("profiles")
      .select("id,handle,display_name,bio,avatar_url,theme_color,banner_url,shop_sections,highlight_listing_id,is_pro,shop_badges,shop_theme,shop_shipping_default")
      .eq("handle", data.handle)
      .maybeSingle();
    if (!profile) return null;
    const { data: listings } = await supa
      .from("listings")
      .select(SAFE_COLS)
      .eq("seller_id", profile.id)
      .eq("status", "published").eq("moderation_status", "approved")
      .order("created_at", { ascending: false });

    const { data: reviews } = await supa.from("reviews").select("rating").eq("seller_id", profile.id);
    const count = reviews?.length ?? 0;
    const avg = count > 0 ? Math.round((reviews!.reduce((a, r) => a + (r.rating ?? 0), 0) / count) * 10) / 10 : 0;

    return { profile, listings: (listings ?? []) as ListingCard[], rating: { avg, count } };
  });
