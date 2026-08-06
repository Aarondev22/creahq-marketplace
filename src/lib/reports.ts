@@
-import { supabase } from "@/integrations/supabase/client";
-import { resolveReport as resolveReportServer } from "@/lib/admin.functions";
+import { supabase } from "@/integrations/supabase/client";
+import { resolveReport as resolveReportServer } from "@/lib/admin.client";
@@
-export async function resolveReport(id: string, status: "resolved" | "dismissed", adminNote?: string) {
-  // Call server-side function to resolve reports to avoid importing server-only clients in client bundle
-  await resolveReportServer({ data: { id, status, adminNote } });
-}
+export async function resolveReport(id: string, status: "resolved" | "dismissed", adminNote?: string) {
+  // Call server-side endpoint via admin.client wrapper
+  await resolveReportServer({ id, status, adminNote });
+}
