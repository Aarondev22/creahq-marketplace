import { supabase } from "@/integrations/supabase/client";

export type MySale = {
  order_item_id: string;
  order_id: string;
  listing_title: string;
  unit_price_cents: number;
  qty: number;
  created_at: string;
  shipment: { carrier: string; tracking_number: string; status: string } | null;
};

export async function fetchMySales(): Promise<MySale[]> {
  const { data: u } = await supabase.auth.getUser();
  if (!u.user) return [];

  const { data: items, error } = await supabase
    .from("order_items")
    .select("id,order_id,unit_price_cents,qty,created_at,listings(title)")
    .eq("seller_id", u.user.id)
    .order("created_at", { ascending: false });
  if (error) throw error;

  const orderIds = (items ?? []).map((i) => i.order_id);
  const { data: shipments } = await supabase
    .from("shipments")
    .select("order_id,carrier,tracking_number,status")
    .in("order_id", orderIds.length ? orderIds : ["-"]);

  return (items ?? []).map((i: any) => ({
    order_item_id: i.id,
    order_id: i.order_id,
    listing_title: i.listings?.title ?? "Unbekannt",
    unit_price_cents: i.unit_price_cents,
    qty: i.qty,
    created_at: i.created_at,
    shipment: (shipments ?? []).find((s) => s.order_id === i.order_id) ?? null,
  }));
}

export async function addShipment(orderId: string, carrier: string, trackingNumber: string) {
  const { data: u } = await supabase.auth.getUser();
  if (!u.user) throw new Error("Nicht eingeloggt");
  const { error } = await supabase.from("shipments").insert({
    order_id: orderId,
    seller_id: u.user.id,
    carrier,
    tracking_number: trackingNumber,
  });
  if (error) throw error;
}
