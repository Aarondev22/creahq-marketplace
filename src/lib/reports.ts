*** Begin Patch
*** Update File: src/lib/reports.ts
@@
-import { supabase } from "@/integrations/supabase/client";
-
-export type ReportTarget = "listing" | "shop" | "chat";
+import { supabase } from "@/integrations/supabase/client";
+import { resolveReport as resolveReportServer } from "@/lib/admin.functions";
+
+export type ReportTarget = "listing" | "shop" | "chat";
@@
-export async function resolveReport(id: string, status: "resolved" | "dismissed", adminNote?: string) {
-  const { data: u } = await supabase.auth.getUser();
-  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
-  const { error } = await supabaseAdmin.from("reports").update({
-    status,
-    admin_note: adminNote?.trim() || null,
-    resolved_by: u.user?.id ?? null,
-    resolved_at: new Date().toISOString(),
-  }).eq("id", id);
-  if (error) throw new Error(error.message);
-}
+export async function resolveReport(id: string, status: "resolved" | "dismissed", adminNote?: string) {
+  // Call server-side function to resolve reports to avoid importing server-only clients into client bundle
+  await resolveReportServer({ data: { id, status, adminNote } });
+}
*** End Patch
