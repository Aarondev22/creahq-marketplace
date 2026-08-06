import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

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
};

export type CreateListingResult = {
  id: string;
  moderation: "approved" | "pending";
  note: string | null;
};

type Verdict = { flagged: boolean; reason: string };

async function moderate(title: string, description: string): Promise<Verdict> {
  const apiKey = process.env["LOVABLE_API_KEY"];
  if (!apiKey) return { flagged: false, reason: "" };
  try {
    const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash-lite",
        messages: [
          {
            role: "system",
            content:
              "Du bist Moderator eines Marktplatzes. Prüfe Titel und Beschreibung auf: verbotene Ware (Waffen, Drogen, Medikamente, Alkohol, Tabak), Fälschungen/Raubkopien, Accounts/Keys/Fake-Bewertungen, Betrug, Spam, Hass oder Erwachseneninhalte. Antworte NUR mit JSON: {\"flagged\": boolean, \"reason\": \"kurzer deutscher Grund oder leer\"}",
          },
          { role: "user", content: `Titel: ${title}\nBeschreibung: ${description}` },
        ],
      }),
    });
    if (!res.ok) return { flagged: false, reason: "" };
    const json = (await res.json()) as { choices?: { message?: { content?: string } }[] };
    const raw = json.choices?.[0]?.message?.content ?? "";
    const match = raw.match(/\{[\s\S]*\}/);
    if (!match) return { flagged: false, reason: "" };
    const parsed = JSON.parse(match[0]) as Verdict;
    return { flagged: Boolean(parsed.flagged), reason: String(parsed.reason ?? "").slice(0, 300) };
  } catch {
    return { flagged: false, reason: "" };
  }
}

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

    const verdict = await moderate(title, description);
    const moderation_status = verdict.flagged ? "pending" : "approved";

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
        cover_url: data.images[0] ?? null,
        images: (data.images ?? []).slice(0, 8),
        location: String(data.location ?? "").slice(0, 120) || null,
        condition: String(data.condition ?? "").slice(0, 40) || null,
        stock: data.stock == null ? null : Math.max(0, Math.round(data.stock)),
        status: "published",
        moderation_status,
        moderation_note: verdict.flagged ? verdict.reason : null,
      })
      .select("id")
      .single();

    if (error) {
      if (/limit|3 Listings|daily/i.test(error.message)) {
        throw new Error("Tageslimit erreicht: Du kannst maximal 3 neue Listings pro Tag anlegen. Morgen geht's weiter!");
      }
      throw new Error(error.message);
    }

    return { id: row.id, moderation: moderation_status, note: verdict.flagged ? verdict.reason : null };
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
    const { count } = await context.supabase
      .from("listings")
      .select("id", { count: "exact", head: true })
      .eq("seller_id", context.userId)
      .gte("created_at", today.toISOString());
    return {
      email: userRes.user?.email ?? null,
      emailConfirmed: Boolean(userRes.user?.email_confirmed_at),
      todayCount: count ?? 0,
    };
  });
