import { createServerFn } from "@tanstack/react-start";
import { supabase } from "@/integrations/supabase/client";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import type { Json } from "@/integrations/supabase/types";

export type ShippingAddress = {
  name: string | null;
  line1: string | null;
  line2: string | null;
  city: string | null;
  state: string | null;
  postal_code: string | null;
  country: string | null;
};

export type MySale = {
  order_item_id: string;
  order_id: string;
  listing_title: string;
  listing_kind: string;
  unit_price_cents: number;
  shipping_cents: number;
  qty: number;
  created_at: string;
  shipping_address: ShippingAddress | null;
  shipment: { carrier: string; tracking_number: string; status: string } | null;
  report: { reason: string; note: string | null; status: string; created_at: string } | null;
};

function parseShippingAddress(value: Json | null): ShippingAddress | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  const field = (key: string) => {
    const candidate = value[key];
    return typeof candidate === "string" ? candidate : null;
  };
  return {
    name: field("name"),
    line1: field("line1"),
    line2: field("line2"),
    city: field("city"),
    state: field("state"),
    postal_code: field("postal_code"),
    country: field("country"),
  };
}

export const fetchMySales = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<MySale[]> => {
    const { data: profile, error: profileError } = await context.supabase
      .from("profiles")
      .select("banned,suspended_until")
      .eq("id", context.userId)
      .maybeSingle();
    if (profileError) throw new Error("Dein Kontostatus konnte nicht geprüft werden.");
    if (
      !profile ||
      profile.banned ||
      (profile.suspended_until && new Date(profile.suspended_until) > new Date())
    ) {
      throw new Error("Dein Konto ist derzeit pausiert oder gesperrt.");
    }

    const { data: items, error } = await context.supabase
      .from("order_items")
      .select("id,order_id,unit_price_cents,shipping_cents,qty,created_at,listings(title,kind)")
      .eq("seller_id", context.userId)
      .order("created_at", { ascending: false });
    if (error) throw error;

    const orderIds = [...new Set((items ?? []).map((item) => item.order_id))];
    if (!orderIds.length) return [];

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const [
      { data: orders, error: ordersError },
      { data: shipments, error: shipmentsError },
      { data: reports, error: reportsError },
    ] = await Promise.all([
      supabaseAdmin.from("orders").select("id,status,shipping_address").in("id", orderIds),
      context.supabase
        .from("shipments")
        .select("order_id,carrier,tracking_number,status")
        .in("order_id", orderIds),
      context.supabase
        .from("reports")
        .select("target_id,reason,note,status,created_at")
        .eq("target_type", "order")
        .in("target_id", orderIds),
    ]);
    if (ordersError) throw new Error("Bestellstatus konnte nicht geladen werden.");
    if (shipmentsError) throw new Error("Versanddaten konnten nicht geladen werden.");
    if (reportsError) throw new Error("Meldungen konnten nicht geladen werden.");

    const orderById = new Map((orders ?? []).map((order) => [order.id, order]));
    return (items ?? [])
      .filter((item) => {
        const status = orderById.get(item.order_id)?.status;
        return status === "paid" || status === "fulfilled";
      })
      .map((item) => {
        const listing = item.listings as unknown as { title?: string; kind?: string } | null;
        const order = orderById.get(item.order_id);
        const report = (reports ?? []).find((entry) => entry.target_id === item.order_id);
        return {
          order_item_id: item.id,
          order_id: item.order_id,
          listing_title: listing?.title ?? "Unbekannt",
          listing_kind: listing?.kind ?? "",
          unit_price_cents: item.unit_price_cents,
          shipping_cents: item.shipping_cents,
          qty: item.qty,
          created_at: item.created_at,
          shipping_address:
            listing?.kind === "service"
              ? parseShippingAddress(order?.shipping_address ?? null)
              : null,
          shipment:
            (shipments ?? []).find((shipment) => shipment.order_id === item.order_id) ?? null,
          report: report
            ? {
                reason: report.reason,
                note: report.note,
                status: report.status,
                created_at: report.created_at,
              }
            : null,
        };
      });
  });

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
