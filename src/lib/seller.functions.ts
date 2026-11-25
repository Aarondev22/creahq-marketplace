import { createServerFn } from "@tanstack/react-start";
import { validatePhysicalShipping } from "@/lib/shipping";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { isProActive } from "@/lib/shopTheme";

export type CreateListingInput = {
  title: string;
  description: string;
  category: string;
  kind: "digital" | "service";
  priceCents: number;
  shippingMode: "included" | "extra" | "digital";
  shippingPriceCents: number;
  location: string;
  condition: string;
  stock: number | null;
  images: string[];
  acceptedRules: boolean;
  shippingCarrier?: string;
  processingTime?: string;
};

export type CreateListingResult = {
  id: string;
  moderation: "approved" | "pending";
  note: string | null;
};

export type EditableListing = {
  id: string;
  title: string;
  description: string | null;
  category: string | null;
  kind: "digital" | "service";
  price_cents: number;
  shipping_mode: "included" | "extra" | "digital";
  shipping_price_cents: number;
  location: string | null;
  condition: string | null;
  stock: number | null;
  images: string[];
  shipping_carrier: string | null;
  processing_time: string | null;
  has_download: boolean;
};

export const fetchListingForEdit = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { id: string }) => ({ id: String(d.id) }))
  .handler(async ({ data, context }): Promise<EditableListing | null> => {
    const { data: listing, error } = await context.supabase
      .from("listings")
      .select("id,title,description,category,kind,price_cents,shipping_mode,shipping_price_cents,location,condition,stock,images,shipping_carrier,processing_time")
      .eq("id", data.id)
      .eq("seller_id", context.userId)
      .maybeSingle();
    if (error) throw new Error(error.message);
    if (!listing) return null;
    const { count, error: fileError } = await context.supabase
      .from("listing_files")
      .select("id", { count: "exact", head: true })
      .eq("listing_id", data.id)
      .eq("seller_id", context.userId);
    if (fileError) throw new Error(fileError.message);
    return { ...listing, has_download: (count ?? 0) > 0 } as EditableListing;
  });

export const updateListing = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: CreateListingInput & { id: string }) => ({ ...d, id: String(d.id) }))
  .handler(async ({ data, context }): Promise<CreateListingResult> => {
    if (!data.acceptedRules) throw new Error("Bitte akzeptiere zuerst die Verkaufsregeln.");
    const title = String(data.title ?? "").trim().slice(0, 140);
    if (title.length < 3) throw new Error("Bitte einen aussagekräftigen Titel angeben.");
    const description = String(data.description ?? "").trim().slice(0, 5000);
    const priceCents = Math.round(Number(data.priceCents));
    if (!Number.isFinite(priceCents) || priceCents < 50) throw new Error("Der Preis muss mindestens 0,50 € betragen.");
    const { data: userRes } = await context.supabase.auth.getUser();
    if (!userRes.user?.email_confirmed_at) throw new Error("Bitte bestätige zuerst deine E-Mail-Adresse.");

    let shipping: ReturnType<typeof validatePhysicalShipping> | null = null;
    if (data.kind === "service") {
      const { data: setting, error } = await context.supabase.from("platform_settings").select("physical_enabled").eq("id", 1).maybeSingle();
      if (error) throw new Error("Verkaufsfreigabe konnte nicht geprüft werden.");
      shipping = validatePhysicalShipping(setting?.physical_enabled === true, data);
    }

    const images = (data.images ?? []).filter((url) => /^https:\/\//i.test(url)).slice(0, 8);
    const { data: row, error } = await context.supabase
      .from("listings")
      .update({
        title,
        description,
        category: String(data.category ?? "").slice(0, 80) || null,
        kind: data.kind,
        price_cents: priceCents,
        shipping_mode: data.kind === "digital" ? "digital" : data.shippingMode === "extra" ? "extra" : "included",
        shipping_price_cents: data.kind === "digital" ? 0 : Math.max(0, Math.round(Number(data.shippingPriceCents) || 0)),
        shipping_carrier: shipping?.shippingCarrier ?? null,
        processing_time: shipping?.processingTime ?? null,
        cover_url: images[0] ?? null,
        images,
        location: String(data.location ?? "").slice(0, 120) || null,
        condition: String(data.condition ?? "").slice(0, 40) || null,
        stock: data.stock == null ? null : Math.max(0, Math.round(data.stock)),
      })
      .eq("id", data.id)
      .eq("seller_id", context.userId)
      .select("id")
      .maybeSingle();
    if (error) throw new Error(error.message);
    if (!row) throw new Error("Listing nicht gefunden oder keine Berechtigung zum Bearbeiten.");
    return { id: row.id, moderation: "approved", note: null };
  });

export const createListing = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: CreateListingInput) => d)
  .handler(async ({ data, context }): Promise<CreateListingResult> => {
    const { supabase, userId } = context;

    if (!data.acceptedRules) throw new Error("Bitte akzeptiere zuerst die Verkaufsregeln.");
    const title = String(data.title ?? "").trim().slice(0, 140);
    if (title.length < 3) throw new Error("Bitte einen aussagekräftigen Titel angeben.");
    const description = String(data.description ?? "").trim().slice(0, 5000);
    const priceCents = Math.round(Number(data.priceCents));
    if (!Number.isFinite(priceCents) || priceCents < 50) throw new Error("Der Preis muss mindestens 0,50 € betragen.");

    const { data: userRes } = await supabase.auth.getUser();
    if (!userRes.user?.email_confirmed_at) {
      throw new Error("E-Mail nicht bestätigt: Bitte bestätige zuerst deine E-Mail-Adresse, dann kannst du verkaufen.");
    }

    let shipping: ReturnType<typeof validatePhysicalShipping> | null = null;
    if (data.kind === "service") {
      const { data: setting, error: settingError } = await supabase.from("platform_settings").select("physical_enabled").eq("id", 1).maybeSingle();
      if (settingError) throw new Error("Verkaufsfreigabe konnte nicht geprüft werden.");
      shipping = validatePhysicalShipping(setting?.physical_enabled === true, data);
    } else if (data.kind !== "digital") throw new Error("Ungültige Produktart.");
    const moderation_status = "approved";

    await supabase.from("user_roles").insert({ user_id: userId, role: "seller" });

    const kind = data.kind === "service" ? "service" : "digital";
    const { data: row, error } = await supabase
      .from("listings")
      .insert({
        seller_id: userId,
        title,
        description,
        category: String(data.category ?? "").slice(0, 80) || null,
        kind,
        price_cents: priceCents,
        shipping_mode: kind === "digital" ? "digital" : data.shippingMode === "extra" ? "extra" : "included",
        shipping_price_cents: kind === "digital" ? 0 : Math.max(0, Math.round(Number(data.shippingPriceCents) || 0)),
        shipping_carrier: shipping?.shippingCarrier ?? null,
        processing_time: shipping?.processingTime ?? null,
        cover_url: data.images[0] ?? null,
        images: (data.images ?? []).slice(0, 8),
        location: String(data.location ?? "").slice(0, 120) || null,
        condition: String(data.condition ?? "").slice(0, 40) || null,
        stock: data.stock == null ? null : Math.max(0, Math.round(data.stock)),
        status: "published",
        moderation_status,
        moderation_note: null,
      })
      .select("id")
      .single();

    if (error) {
      const limit = /maximal\s+(\d+)/i.exec(error.message)?.[1];
      if (/limit|daily/i.test(error.message)) {
        throw new Error(`Tageslimit erreicht: Du kannst maximal ${limit ?? "5"} Listings pro Tag anlegen. Morgen geht's weiter!`);
      }
      throw new Error(error.message);
    }

    return { id: row.id, moderation: moderation_status, note: null };
  });

export const resendConfirmationEmail = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data: userRes } = await context.supabase.auth.getUser();
    const email = userRes.user?.email;
    if (!email) throw new Error("Kein E-Mail-Konto hinterlegt.");
    if (userRes.user?.email_confirmed_at) return { ok: true, already: true };
    const { error } = await context.supabase.auth.resend({ type: "signup", email });
    if (error) throw new Error(error.message);
    return { ok: true, already: false };
  });

export const fetchSellerStatus = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data: userRes } = await context.supabase.auth.getUser();
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const [{ count }, { data: profile, error: profileError }] = await Promise.all([
      context.supabase
      .from("listings")
      .select("id", { count: "exact", head: true })
      .eq("seller_id", context.userId)
      .gte("created_at", today.toISOString()),
      context.supabase.from("profiles").select("is_pro,pro_expires_at").eq("id", context.userId).maybeSingle(),
    ]);
    if (profileError) throw new Error(profileError.message);
    const isPro = isProActive(!!profile?.is_pro, profile?.pro_expires_at);
    return {
      email: userRes.user?.email ?? null,
      emailConfirmed: Boolean(userRes.user?.email_confirmed_at),
      todayCount: count ?? 0,
      isPro,
      dailyLimit: isPro ? 10 : 5,
    };
  });
