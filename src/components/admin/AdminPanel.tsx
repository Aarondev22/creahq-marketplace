@@
-import { supabase } from "@/integrations/supabase/client";
-import { toast } from "sonner";
-import type { AppRole } from "@/hooks/useAuth";
+import { supabase } from "@/integrations/supabase/client";
+import { toast } from "sonner";
+import type { AppRole } from "@/hooks/useAuth";
+import { toggleUserRole, resolveReport as resolveReportFn, moderateListing } from "@/lib/admin.functions";
@@
-  async function toggleRole(u: UserRow, role: AppRole) {
-    const has = u.roles.includes(role);
-    if (has && myId && u.id === myId && (role === "admin" || role === "founder")) {
-      return toast.error("Du kannst dir deine eigenen Admin-/Founder-Rechte nicht entziehen.");
-    }
-    if (has) {
-      const { error } = await supabase.from("user_roles").delete().eq("user_id", u.id).eq("role", role);
-      if (error) return toast.error(error.message);
-    } else {
-      const { error } = await supabase.from("user_roles").insert({ user_id: u.id, role });
-      if (error) return toast.error(error.message);
-    }
-    setUsers((arr) => arr.map((x) => (x.id === u.id ? { ...x, roles: has ? x.roles.filter((r) => r !== role) : [...x.roles, role] } : x)));
-  }
+  async function toggleRole(u: UserRow, role: AppRole) {
+    const has = u.roles.includes(role);
+    if (has && myId && u.id === myId && (role === "admin" || role === "founder")) {
+      return toast.error("Du kannst dir deine eigenen Admin-/Founder-Rechte nicht entziehen.");
+    }
+    try {
+      if (has) {
+        await toggleUserRole({ data: { targetUserId: u.id, role, action: "remove" } });
+      } else {
+        await toggleUserRole({ data: { targetUserId: u.id, role, action: "add" } });
+      }
+      setUsers((arr) => arr.map((x) => (x.id === u.id ? { ...x, roles: has ? x.roles.filter((r) => r !== role) : [...x.roles, role] } : x)));
+    } catch (err) {
+      toast.error(err instanceof Error ? err.message : "Fehler beim Ändern der Rolle");
+    }
+  }
*** End Patch