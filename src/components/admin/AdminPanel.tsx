@@
-import { supabase } from "@/integrations/supabase/client";
-import { toast } from "sonner";
-import type { AppRole } from "@/hooks/useAuth";
-import { toggleUserRole, resolveReport as resolveReportFn, moderateListing, banUser } from "@/lib/admin.functions";
+import { supabase } from "@/integrations/supabase/client";
+import { toast } from "sonner";
+import type { AppRole } from "@/hooks/useAuth";
+import { toggleUserRole, resolveReport as resolveReportFn, moderateListing, banUser } from "@/lib/admin.client";
@@
-  async function banSeller(sellerId: string) {
-    try {
-      await banUser({ data: { userId: sellerId, ban: true } });
-      toast.success("Verkäufer gesperrt");
-      load();
-    } catch (err) {
-      toast.error(err instanceof Error ? err.message : "Fehler beim Sperren des Verkäufers");
-    }
-  }
+  async function banSeller(sellerId: string) {
+    try {
+      await banUser({ userId: sellerId, ban: true });
+      toast.success("Verkäufer gesperrt");
+      load();
+    } catch (err) {
+      toast.error(err instanceof Error ? err.message : "Fehler beim Sperren des Verkäufers");
+    }
+  }
