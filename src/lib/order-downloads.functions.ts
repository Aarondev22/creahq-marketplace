import { createServerFn } from "@tanstack/react-start";
import type { SupabaseClient } from "@supabase/supabase-js";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import type { Database } from "@/integrations/supabase/types";

async function assertActiveBuyer(supabase: SupabaseClient<Database>, userId: string) {
  const { data: profile, error } = await supabase
    .from("profiles")
    .select("banned,suspended_until")
    .eq("id", userId)
    .maybeSingle();
  if (error) throw new Error("Dein Kontostatus konnte nicht geprüft werden.");
  if (
    !profile ||
    profile.banned ||
    (profile.suspended_until && new Date(profile.suspended_until) > new Date())
  ) {
    throw new Error("Dein Konto ist derzeit pausiert oder gesperrt.");
  }
}

export type OrderDownload = {
  id: string;
  listing_id: string;
  file_name: string;
};

export const fetchOrderDownloads = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { orderId: string }) => ({ orderId: String(d?.orderId ?? "") }))
  .handler(async ({ data, context }): Promise<OrderDownload[]> => {
    await assertActiveBuyer(context.supabase, context.userId);

    const { data: order, error: orderError } = await context.supabase
      .from("orders")
      .select("id,status")
      .eq("id", data.orderId)
      .eq("buyer_id", context.userId)
      .maybeSingle();
    if (orderError) throw new Error("Bestellung konnte nicht geprüft werden.");
    if (!order || (order.status !== "paid" && order.status !== "fulfilled")) return [];

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: items, error: itemsError } = await supabaseAdmin
      .from("order_items")
      .select("listing_id")
      .eq("order_id", order.id);
    if (itemsError) throw new Error("Bestellte Produkte konnten nicht geladen werden.");

    const listingIds = [...new Set((items ?? []).map((item) => item.listing_id))];
    if (!listingIds.length) return [];

    const { data: files, error: filesError } = await supabaseAdmin
      .from("listing_files")
      .select("id,listing_id,file_name")
      .in("listing_id", listingIds);
    if (filesError) throw new Error("Download-Dateien konnten nicht geladen werden.");
    return files ?? [];
  });

export const createOrderDownloadUrl = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { orderId: string; fileId: string }) => ({
    orderId: String(d?.orderId ?? ""),
    fileId: String(d?.fileId ?? ""),
  }))
  .handler(async ({ data, context }) => {
    await assertActiveBuyer(context.supabase, context.userId);

    const { data: order, error: orderError } = await context.supabase
      .from("orders")
      .select("id,status")
      .eq("id", data.orderId)
      .eq("buyer_id", context.userId)
      .maybeSingle();
    if (orderError) throw new Error("Bestellung konnte nicht geprüft werden.");
    if (!order || (order.status !== "paid" && order.status !== "fulfilled")) {
      throw new Error("Downloads sind erst nach bestätigter Zahlung verfügbar.");
    }

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: items, error: itemsError } = await supabaseAdmin
      .from("order_items")
      .select("listing_id")
      .eq("order_id", order.id);
    if (itemsError) throw new Error("Bestellte Produkte konnten nicht geprüft werden.");
    const listingIds = new Set((items ?? []).map((item) => item.listing_id));
    if (!listingIds.size) throw new Error("Diese Datei gehört nicht zu deiner Bestellung.");

    const { data: file, error: fileError } = await supabaseAdmin
      .from("listing_files")
      .select("listing_id,seller_id,file_path,file_name")
      .eq("id", data.fileId)
      .maybeSingle();
    if (fileError) throw new Error("Download-Datei konnte nicht geprüft werden.");
    if (
      !file ||
      !listingIds.has(file.listing_id) ||
      !file.file_path.startsWith(`${file.seller_id}/`)
    ) {
      throw new Error("Diese Datei gehört nicht zu deiner Bestellung.");
    }

    const { data: signed, error: signedError } = await supabaseAdmin.storage
      .from("listing-files")
      .createSignedUrl(file.file_path, 300, { download: file.file_name });
    if (signedError || !signed) throw new Error("Download-Link konnte nicht erstellt werden.");
    return { url: signed.signedUrl };
  });
