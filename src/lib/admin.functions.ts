import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

type Ctx = { supabase: any; userId: string };

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
  roles: string[];
};

export const searchUsers = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { q?: string }) => ({ q: String(d?.q ?? "").trim().slice(0, 80) }))
  .handler(async ({ data, context }): Promise<AdminUser[]> => {
    await assertAdmin(context as Ctx);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    let query = supabaseAdmin.from("profiles").select("id,display_name,handle,banned").limit(25);
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
