import { supabase } from "@/integrations/supabase/client";

export type Review = {
  id: string;
  order_id: string;
  listing_id: string;
  seller_id: string;
  buyer_id: string;
  rating: number;
  body: string | null;
  created_at: string;
};

const COLS = "id,order_id,listing_id,seller_id,buyer_id,rating,body,created_at";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const table = () => supabase.from("reviews") as any;

export type RatingSummary = { avg: number; count: number };

export function summarize(reviews: Pick<Review, "rating">[]): RatingSummary {
  if (reviews.length === 0) return { avg: 0, count: 0 };
  const sum = reviews.reduce((a, r) => a + r.rating, 0);
  return { avg: Math.round((sum / reviews.length) * 10) / 10, count: reviews.length };
}

export async function fetchListingReviews(listingId: string): Promise<Review[]> {
  const { data, error } = await table()
    .select(COLS)
    .eq("listing_id", listingId)
    .order("created_at", { ascending: false })
    .limit(50);
  if (error) throw new Error(error.message);
  return (data ?? []) as Review[];
}

export async function fetchSellerReviews(sellerId: string): Promise<Review[]> {
  const { data, error } = await table()
    .select(COLS)
    .eq("seller_id", sellerId)
    .order("created_at", { ascending: false })
    .limit(100);
  if (error) throw new Error(error.message);
  return (data ?? []) as Review[];
}

/** Bestellungen der aktuellen Käufer:in, die für dieses Listing bewertbar sind. */
export async function fetchReviewableOrders(listingId: string): Promise<string[]> {
  const { data: u } = await supabase.auth.getUser();
  if (!u.user) return [];
  const { data: items } = await supabase
    .from("order_items")
    .select("order_id, orders!inner(id,buyer_id,status)")
    .eq("listing_id", listingId);
  const orderIds = (items ?? [])
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    .filter((row: any) => {
      const o = row.orders;
      return o && o.buyer_id === u.user!.id && (o.status === "paid" || o.status === "fulfilled");
    })
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    .map((row: any) => row.order_id as string);

  if (orderIds.length === 0) return [];
  const { data: existing } = await table().select("order_id").eq("listing_id", listingId).eq("buyer_id", u.user.id);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const used = new Set((existing ?? []).map((r: any) => r.order_id as string));
  return orderIds.filter((id) => !used.has(id));
}

export async function createReview(input: {
  orderId: string;
  listingId: string;
  sellerId: string;
  rating: number;
  body?: string;
}): Promise<Review> {
  const { data: u } = await supabase.auth.getUser();
  if (!u.user) throw new Error("Bitte melde dich an.");
  const { data, error } = await table()
    .insert({
      order_id: input.orderId,
      listing_id: input.listingId,
      seller_id: input.sellerId,
      buyer_id: u.user.id,
      rating: Math.min(5, Math.max(1, Math.round(input.rating))),
      body: input.body?.trim() || null,
    })
    .select(COLS)
    .single();
  if (error) throw new Error(error.message);
  return data as Review;
}

export async function deleteReview(id: string) {
  const { error } = await table().delete().eq("id", id);
  if (error) throw new Error(error.message);
}
