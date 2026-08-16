export const moderateListing = createServerFn({ method: "POST" })
  // ... existing moderateListing implementation ...
  ;

export const banUser = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { userId: string; ban: boolean }) => ({ userId: String(d.userId), ban: Boolean(d.ban) }))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { data: callerRoles } = await supabase.from("user_roles").select("role").eq("user_id", userId);
    const roles = (callerRoles ?? []).map((r: any) => r.role as string);
    if (!roles.includes("admin") && !roles.includes("founder")) throw new Error("Nur Admins dürfen Nutzer sperren.");

    // Prevent banning oneself
    if (data.userId === userId) throw new Error("Du kannst dich nicht selbst sperren.");

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin.from("profiles").update({ banned: data.ban }).eq("id", data.userId);
    if (error) throw new Error(error.message);
    return { ok: true };
  });
