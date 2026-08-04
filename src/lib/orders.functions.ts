import { supabase } from "@/integrations/supabase/client";

export type MyOrderItem = {
  id: string;
  listing_id: string;
  title: string;
  cover_url: string | null;
  unit_price_cents: number;
  qty: number;
};

export type MyOrderDetail = {
  id: string;
  total_cents: number;
  currency: string;
  status: string;
  created_at: string;
  items: MyOrderItem[];
  shipments: { carrier: string; tracking_number: string; status: string; shipped_at: string }[];
};

export const ORDER_STATUS_LABEL: Record<string, string> = {
  pending: "Zahlung offen",
  paid: "Bezahlt",
  fulfilled: "Abgeschlossen",
  cancelled: "Storniert",
  refunded: "Erstattet",
};

export const ORDER_STATUS_STYLE: Record<string, string> = {
  pending: "bg-amber-100 text-amber-800",
  paid: "bg-emerald-100 text-emerald-700",
  fulfilled: "bg-brand/10 text-brand",
  cancelled: "bg-gray-100 text-gray-600",
  refunded: "bg-red-50 text-red-600",
};

export async function fetchMyOrders(): Promise<MyOrderDetail[]> {
  const { data: u } = await supabase.auth.getUser();
  if (!u.user) return [];

  const { data: orders, error } = await supabase
    .from("orders")
    .select("id,total_cents,currency,status,created_at")
    .eq("buyer_id", u.user.id)
    .order("created_at", { ascending: false })
    .limit(50);
  if (error) throw error;
  if (!orders || orders.length === 0) return [];

  const ids = orders.map((o) => o.id);
  const [{ data: items }, { data: shipments }] = await Promise.all([
    supabase
      .from("order_items")
      .select("id,order_id,listing_id,unit_price_cents,qty,listings(title,cover_url)")
      .in("order_id", ids),
    supabase.from("shipments").select("order_id,carrier,tracking_number,status,shipped_at").in("order_id", ids),
  ]);

  return orders.map((o) => ({
    ...o,
    items: (items ?? [])
      .filter((i) => i.order_id === o.id)
      .map((i) => {
        const listing = i.listings as unknown as { title?: string; cover_url?: string | null } | null;
        return {
          id: i.id,
          listing_id: i.listing_id,
          title: listing?.title ?? "Unbekanntes Produkt",
          cover_url: listing?.cover_url ?? null,
          unit_price_cents: i.unit_price_cents,
          qty: i.qty,
        };
      }),
    shipments: (shipments ?? []).filter((s) => s.order_id === o.id),
  }));
}
