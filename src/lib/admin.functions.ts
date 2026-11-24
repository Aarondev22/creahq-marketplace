import { createServerFn } from "@tanstack/react-start";
import type { SupabaseClient } from "@supabase/supabase-js";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import type { Database } from "@/integrations/supabase/types";

type Ctx = { supabase: SupabaseClient<Database>; userId: string };

async function assertAdmin(context: Ctx) {
  const { data } = await context.supabase.from("user_roles").select("role").eq("user_id", context.userId);
  const roles = (data ?? []).map((r: { role: string }) => r.role);
  if (!roles.includes("admin") && !roles.includes("founder")) {
    throw new Error("Nur Admins dürfen das.");
  }
  return roles as string[];
}

export type AdminReport = {
  id: string;
  target_type: string;
  target_id: string;
  reason: string;
  note: string | null;
  status: string;
  admin_note: string | null;
  created_at: string;
};

export const listReports = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<AdminReport[]> => {
    await assertAdmin(context as Ctx);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data, error } = await supabaseAdmin
      .from("reports")
      .select("id,target_type,target_id,reason,note,status,admin_note,created_at")
      .order("created_at", { ascending: false })
      .limit(100);
    if (error) throw new Error(error.message);
    return (data ?? []) as AdminReport[];
  });

export const resolveReport = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { id: string; status: "resolved" | "dismissed"; adminNote?: string }) => ({
    id: String(d.id),
    status: d.status === "dismissed" ? ("dismissed" as const) : ("resolved" as const),
    adminNote: d.adminNote ? String(d.adminNote).slice(0, 500) : null,
  }))
  .handler(async ({ data, context }) => {
    await assertAdmin(context as Ctx);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin
      .from("reports")
      .update({
        status: data.status,
        admin_note: data.adminNote,
        resolved_at: new Date().toISOString(),
        resolved_by: (context as Ctx).userId,
      })
      .eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export type AdminListing = {
  id: string;
  title: string;
  seller_id: string;
  moderation_status: string;
  moderation_note: string | null;
  status: string;
  cover_url: string | null;
  created_at: string;
};

export const listModerationQueue = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<AdminListing[]> => {
    await assertAdmin(context as Ctx);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data, error } = await supabaseAdmin
      .from("listings")
      .select("id,title,seller_id,moderation_status,moderation_note,status,cover_url,created_at")
      .neq("moderation_status", "approved")
      .order("created_at", { ascending: false })
      .limit(100);
    if (error) throw new Error(error.message);
    return (data ?? []) as AdminListing[];
  });

export const moderateListing = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { id: string; moderation_status: "approved" | "rejected"; moderation_note?: string }) => ({
    id: String(d.id),
    moderation_status: d.moderation_status === "rejected" ? ("rejected" as const) : ("approved" as const),
    moderation_note: d.moderation_note ? String(d.moderation_note).slice(0, 500) : null,
  }))
  .handler(async ({ data, context }) => {
    await assertAdmin(context as Ctx);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin
      .from("listings")
      .update({ moderation_status: data.moderation_status, moderation_note: data.moderation_note })
      .eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export type AdminUser = {
  id: string;
  display_name: string | null;
  handle: string | null;
  banned: boolean;
  is_pro: boolean;
  is_verified: boolean;
  roles: string[];
};

export const searchUsers = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { q?: string }) => ({ q: String(d?.q ?? "").trim().slice(0, 80) }))
  .handler(async ({ data, context }): Promise<AdminUser[]> => {
    await assertAdmin(context as Ctx);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    let query = supabaseAdmin.from("profiles").select("id,display_name,handle,banned,is_pro,is_verified").limit(25);
    if (data.q) {
      const like = `%${data.q.replace(/[%_,()]/g, "")}%`;
      query = query.or(`display_name.ilike.${like},handle.ilike.${like}`);
    }
    const { data: rows, error } = await query;
    if (error) throw new Error(error.message);
    const ids = (rows ?? []).map((r) => r.id);
    const { data: roleRows } = ids.length
      ? await supabaseAdmin.from("user_roles").select("user_id,role").in("user_id", ids)
      : { data: [] as { user_id: string; role: string }[] };
    return (rows ?? []).map((r) => ({
      ...r,
      roles: (roleRows ?? []).filter((x) => x.user_id === r.id).map((x) => String(x.role)),
    })) as AdminUser[];
  });

export const banUser = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { userId: string; ban: boolean }) => ({ userId: String(d.userId), ban: Boolean(d.ban) }))
  .handler(async ({ data, context }) => {
    await assertAdmin(context as Ctx);
    if (data.userId === (context as Ctx).userId) throw new Error("Du kannst dich nicht selbst sperren.");
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin.from("profiles").update({ banned: data.ban }).eq("id", data.userId);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const toggleUserRole = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { targetUserId: string; role: string; action: "add" | "remove" }) => ({
    targetUserId: String(d.targetUserId),
    role: String(d.role),
    action: d.action === "remove" ? ("remove" as const) : ("add" as const),
  }))
  .handler(async ({ data, context }) => {
    await assertAdmin(context as Ctx);
    const me = (context as Ctx).userId;
    if (data.targetUserId === me && data.action === "remove" && (data.role === "admin" || data.role === "founder")) {
      throw new Error("Du kannst dir Admin/Founder nicht selbst entziehen.");
    }
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    if (data.action === "add") {
      const { error } = await supabaseAdmin
        .from("user_roles")
        .upsert({ user_id: data.targetUserId, role: data.role as never }, { onConflict: "user_id,role" });
      if (error) throw new Error(error.message);
    } else {
      const { error } = await supabaseAdmin
        .from("user_roles")
        .delete()
        .eq("user_id", data.targetUserId)
        .eq("role", data.role as never);
      if (error) throw new Error(error.message);
    }
    return { ok: true };
  });

export type AdminListingFull = AdminListing & { price_cents: number; currency: string };

export const listAllListings = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { q?: string; filter?: string }) => ({
    q: String(d?.q ?? "").trim().slice(0, 80),
    filter: ["all", "approved", "pending", "rejected", "paused"].includes(String(d?.filter)) ? String(d?.filter) : "all",
  }))
  .handler(async ({ data, context }): Promise<AdminListingFull[]> => {
    await assertAdmin(context as Ctx);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    let query = supabaseAdmin
      .from("listings")
      .select("id,title,seller_id,moderation_status,moderation_note,status,cover_url,created_at,price_cents,currency")
      .order("created_at", { ascending: false })
      .limit(100);
    if (data.q) query = query.ilike("title", `%${data.q.replace(/[%_,()]/g, "")}%`);
    if (data.filter === "paused") query = query.neq("status", "published");
    else if (data.filter !== "all") query = query.eq("moderation_status", data.filter);
    const { data: rows, error } = await query;
    if (error) throw new Error(error.message);
    return (rows ?? []) as AdminListingFull[];
  });

export const setListingStatus = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { id: string; status: "published" | "draft" }) => ({
    id: String(d.id),
    status: d.status === "draft" ? ("draft" as const) : ("published" as const),
  }))
  .handler(async ({ data, context }) => {
    await assertAdmin(context as Ctx);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin.from("listings").update({ status: data.status }).eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const setUserPro = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { userId: string; pro: boolean }) => ({ userId: String(d.userId), pro: Boolean(d.pro) }))
  .handler(async ({ data, context }) => {
    await assertAdmin(context as Ctx);
    // Als Admin über den Nutzer-Client: der Pro-Schutz-Trigger erlaubt das nur Admins/Foundern.
    const { error } = await (context as Ctx).supabase.from("profiles").update({ is_pro: data.pro }).eq("id", data.userId);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const setUserVerified = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { userId: string; verified: boolean }) => ({
    userId: String(d.userId),
    verified: Boolean(d.verified),
  }))
  .handler(async ({ data, context }) => {
    await assertAdmin(context as Ctx);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin
      .from("profiles")
      .update({ is_verified: data.verified })
      .eq("id", data.userId);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export type AdminRedeemCode = {
  id: string;
  code: string;
  code_type: "founder" | "pro" | "beta_tester";
  max_uses: number | null;
  used_count: number;
  created_at: string;
};

export const listRedeemCodes = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<AdminRedeemCode[]> => {
    await assertAdmin(context as Ctx);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data, error } = await supabaseAdmin
      .from("founder_redeem_codes")
      .select("id,code,code_type,max_uses,used_count,created_at")
      .order("created_at", { ascending: false });
    if (error) throw new Error(error.message);
    return (data ?? []) as AdminRedeemCode[];
  });

export const createRedeemCode = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { code?: string; codeType: string; maxUses?: number | null }) => {
    const codeType = ["founder", "pro", "beta_tester"].includes(d.codeType)
      ? (d.codeType as AdminRedeemCode["code_type"])
      : null;
    const code = String(d.code ?? "").trim().toUpperCase();
    const maxUses = d.maxUses == null ? null : Number(d.maxUses);
    if (!codeType) throw new Error("Ungültiger Code-Typ.");
    if (code && !/^[A-Z0-9-]{3,40}$/.test(code)) throw new Error("Der Code darf nur Buchstaben, Zahlen und Bindestriche enthalten.");
    if (maxUses !== null && (!Number.isInteger(maxUses) || maxUses < 1 || maxUses > 1000000)) {
      throw new Error("Die maximale Einlösungszahl muss mindestens 1 sein.");
    }
    return { code, codeType, maxUses };
  })
  .handler(async ({ data, context }) => {
    await assertAdmin(context as Ctx);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const code = data.code || `CREAHQ-${crypto.randomUUID().replace(/-/g, "").slice(0, 12).toUpperCase()}`;
    const grantsRole = data.codeType === "founder" ? "founder" : data.codeType === "beta_tester" ? "beta_tester" : "buyer";
    const { data: created, error } = await supabaseAdmin
      .from("founder_redeem_codes")
      .insert({
        code,
        code_type: data.codeType,
        grants_role: grantsRole,
        max_uses: data.maxUses,
      })
      .select("id,code,code_type,max_uses,used_count,created_at")
      .single();
    if (error) throw new Error(error.message);
    return created as AdminRedeemCode;
  });

export const deleteRedeemCode = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { id: string }) => ({ id: String(d.id) }))
  .handler(async ({ data, context }) => {
    await assertAdmin(context as Ctx);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin.from("founder_redeem_codes").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export { fetchMarketplaceSettings as getPlatformSettings } from "@/lib/listings.functions";

export const setPhysicalEnabled = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { enabled: boolean; notify: boolean }) => ({ enabled: !!d.enabled, notify: !!d.notify }))
  .handler(async ({ data, context }) => {
    await assertAdmin(context as Ctx);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin.from("platform_settings")
      .update({ physical_enabled: data.enabled, updated_at: new Date().toISOString() }).eq("id", 1);
    if (error) throw new Error(error.message);
    let sent = 0;
    if (data.notify) {
      const { data: users } = await supabaseAdmin.from("profiles").select("id").limit(50000);
      const rows = (users ?? []).map((u: { id: string }) => ({
        user_id: u.id,
        category: "system",
        title: data.enabled ? "Update: Physische Produkte sind jetzt verfügbar" : "Update: CreaHQ ist wieder rein digital",
        body: data.enabled
          ? "Ab sofort können auf CreaHQ neben digitalen Downloads auch physische Produkte mit Sendungsverfolgung verkauft werden."
          : "Physische Produkte sind vorübergehend pausiert. Digitale Downloads laufen wie gewohnt weiter.",
        link: "/hilfe",
      }));
      for (let i = 0; i < rows.length; i += 500) {
        const { error: e } = await supabaseAdmin.from("notifications").insert(rows.slice(i, i + 500));
        if (e) throw new Error(e.message);
      }
      sent = rows.length;
    }
    return { ok: true, sent };
  });
