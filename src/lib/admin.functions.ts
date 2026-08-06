import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export const toggleUserRole = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { targetUserId: string; role: string; action: "add" | "remove" }) => ({
    targetUserId: String(d.targetUserId),
    role: String(d.role),
    action: d.action,
  }))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    // Check caller roles
    const { data: callerRoles } = await supabase.from("user_roles").select("role").eq("user_id", userId);
    const roles = (callerRoles ?? []).map((r: any) => r.role as string);
    if (!roles.includes("admin") && !roles.includes("founder")) throw new Error("Nur Admins dürfen Rollen ändern.");

    // Prevent self-demote for admin/founder
    if (data.action === "remove" && data.targetUserId === userId && (data.role === "admin" || data.role === "founder")) {
      throw new Error("Du kannst dir deine eigenen Admin-/Founder-Rechte nicht entziehen.");
    }

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    if (data.action === "add") {
      const { error } = await supabaseAdmin.from("user_roles").insert({ user_id: data.targetUserId, role: data.role });
      if (error) throw new Error(error.message);
      return { ok: true };
    } else {
      const { error } = await supabaseAdmin.from("user_roles").delete().eq("user_id", data.targetUserId).eq("role", data.role);
      if (error) throw new Error(error.message);
      return { ok: true };
    }
  });

export const resolveReport = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { id: string; status: "resolved" | "dismissed"; adminNote?: string }) => ({
    id: String(d.id),
    status: String(d.status) as "resolved" | "dismissed",
    adminNote: d.adminNote ? String(d.adminNote) : undefined,
  }))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { data: callerRoles } = await supabase.from("user_roles").select("role").eq("user_id", userId);
    const roles = (callerRoles ?? []).map((r: any) => r.role as string);
    if (!roles.includes("admin") && !roles.includes("founder")) throw new Error("Nur Admins dürfen Meldungen bearbeiten.");

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin.from("reports").update({ status: data.status, admin_note: data.adminNote ?? null, resolved_by: userId, resolved_at: new Date().toISOString() }).eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const moderateListing = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { id: string; moderation_status: "approved" | "rejected"; moderation_note?: string }) => ({
    id: String(d.id),
    moderation_status: String(d.moderation_status) as "approved" | "rejected",
    moderation_note: d.moderation_note ? String(d.moderation_note) : undefined,
  }))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { data: callerRoles } = await supabase.from("user_roles").select("role").eq("user_id", userId);
    const roles = (callerRoles ?? []).map((r: any) => r.role as string);
    if (!roles.includes("admin") && !roles.includes("founder")) throw new Error("Nur Admins dürfen Moderationsentscheidungen treffen.");

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin.from("listings").update({ moderation_status: data.moderation_status, moderation_note: data.moderation_note ?? null }).eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });
