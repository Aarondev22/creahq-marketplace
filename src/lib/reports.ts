*** Begin Patch
*** Update File: src/lib/reports.ts
@@
 export async function resolveReport(id: string, status: "resolved" | "dismissed", adminNote?: string) {
   const { data: u } = await supabase.auth.getUser();
-  const { error } = await table()
-    .update({
-      status,
-      admin_note: adminNote?.trim() || null,
-      resolved_by: u.user?.id ?? null,
-      resolved_at: new Date().toISOString(),
-    })
-    .eq("id", id);
-  if (error) throw new Error(error.message);
+  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
+  const { error } = await supabaseAdmin.from("reports").update({
+    status,
+    admin_note: adminNote?.trim() || null,
+    resolved_by: u.user?.id ?? null,
+    resolved_at: new Date().toISOString(),
+  }).eq("id", id);
+  if (error) throw new Error(error.message);
 }
*** End Patch
