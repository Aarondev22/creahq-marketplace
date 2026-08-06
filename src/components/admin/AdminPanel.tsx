*** Begin Patch
*** Update File: src/components/admin/AdminPanel.tsx
@@
-import { supabase } from "@/integrations/supabase/client";
-import { toast } from "sonner";
-import type { AppRole } from "@/hooks/useAuth";
-import { toggleUserRole, resolveReport as resolveReportFn, moderateListing, banUser } from "@/lib/admin.functions";
+import { supabase } from "@/integrations/supabase/client";
+import { toast } from "sonner";
+import type { AppRole } from "@/hooks/useAuth";
+import { toggleUserRole, resolveReport as resolveReportFn, moderateListing, banUser } from "@/lib/admin.functions";
@@
-  async function banSeller(sellerId: string) {
-    try {
-      const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
-      const { error } = await supabaseAdmin.from("profiles").update({ banned: true }).eq("id", sellerId);
-      if (error) throw error;
-      toast.success("Verkäufer gesperrt");
-      load();
-    } catch (err) {
-      toast.error(err instanceof Error ? err.message : "Fehler beim Sperren des Verkäufers");
-    }
-  }
+  async function banSeller(sellerId: string) {
+    try {
+      await banUser({ data: { userId: sellerId, ban: true } });
+      toast.success("Verkäufer gesperrt");
+      load();
+    } catch (err) {
+      toast.error(err instanceof Error ? err.message : "Fehler beim Sperren des Verkäufers");
+    }
+  }
*** End Patch
